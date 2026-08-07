import { useState, useEffect } from "react";

// Generic searchable table, shared across AdminUsers.jsx (5A) and
// AdminListings.jsx/AdminBookings.jsx (5B) with different columns/data.
// Deliberately knows nothing about what it's displaying — all badge
// coloring, icons, and action buttons live in the `render` function each
// caller supplies per column, so this file never needs to change when a
// new admin page reuses it.
//
// Built 100% inline-style (Pattern A / Sidebar-style sub-pattern), same as
// AdminTopNav.jsx, Sidebar.jsx, StatCard.jsx, PhotoUpload.jsx — row hover is
// handled via onMouseEnter/onMouseLeave + local state rather than Tailwind
// hover: classes.
//
// Props:
//   columns   — [{ key, label, render?(row) }]. If `render` is omitted, the
//               column just displays row[key] as plain text.
//   rows      — array of data objects. EACH ROW MUST HAVE A UNIQUE `id`
//               field — used for the React key and for actions like toggling
//               status without relying on array index.
//   searchKeys      — string[] of row fields to match against the search box.
//                     Omit or pass [] to hide the search box entirely.
//   searchPlaceholder — placeholder text for the search box.
//   filters   — [{ key, label, options: string[] }]. `options[0]` is treated
//               as the "no filter" / "All ___" value. Omit or pass [] to hide
//               filter dropdowns entirely.
//   pageSize        — rows per page (default 5).
//   showPagination  — set false to render every filtered row with no
//                     pager (useful for short, one-off lists).
//   emptyMessage    — shown when the filtered result set is empty.

export default function AdminTable({
  columns,
  rows,
  searchKeys = [],
  searchPlaceholder = "Search…",
  filters = [],
  pageSize = 5,
  showPagination = true,
  emptyMessage = "No results found.",
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState(
    () => Object.fromEntries(filters.map((f) => [f.key, f.options[0]]))
  );
  const [page, setPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Reset back to page 1 whenever the search or filter criteria change,
  // so the person isn't stuck on a now-empty page 3.
  useEffect(() => {
    setPage(1);
  }, [search, JSON.stringify(filterValues)]);

  const filtered = rows.filter((row) => {
    if (searchKeys.length && search.trim()) {
      const q = search.trim().toLowerCase();
      const matches = searchKeys.some((k) =>
        String(row[k] ?? "").toLowerCase().includes(q)
      );
      if (!matches) return false;
    }
    for (const f of filters) {
      const val = filterValues[f.key];
      if (val && val !== f.options[0] && row[f.key] !== val) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = showPagination
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filtered;

  const showControls = searchKeys.length > 0 || filters.length > 0;

  return (
    <div>
      {showControls && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          {searchKeys.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                height: "36px",
                padding: "0 12px",
                fontSize: "13px",
                border: "1px solid #E0E8E3",
                borderRadius: "8px",
                outline: "none",
                width: "260px",
                color: "#111111",
              }}
            />
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key]}
              onChange={(e) =>
                setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              style={{
                height: "36px",
                padding: "0 10px",
                fontSize: "13px",
                border: "1px solid #E0E8E3",
                borderRadius: "8px",
                outline: "none",
                backgroundColor: "#FFFFFF",
                color: "#111111",
                width: "150px",
                textTransform: "capitalize",
              }}
            >
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "0.5px solid #E0E8E3",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#F5F5F0" }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      color: "#555555",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      fontSize: "13px",
                      color: "#555555",
                    }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderTop: "1px solid #E0E8E3",
                      backgroundColor: hoveredRow === row.id ? "#F5F5F0" : "#FFFFFF",
                      transition: "background-color 0.1s",
                    }}
                  >
                    {columns.map((col) => (
                      <td key={col.key} style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        {col.render ? col.render(row) : (
                          <span style={{ fontSize: "13px", color: "#555555" }}>
                            {row[col.key]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showPagination && filtered.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
              borderTop: "1px solid #E0E8E3",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 500,
                border: "0.5px solid #CCCCCC",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#555555",
                cursor: currentPage === 1 ? "default" : "pointer",
                opacity: currentPage === 1 ? 0.4 : 1,
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: "13px", color: "#555555", padding: "0 4px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 500,
                border: "0.5px solid #CCCCCC",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#555555",
                cursor: currentPage === totalPages ? "default" : "pointer",
                opacity: currentPage === totalPages ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
