import { useState, useEffect } from "react";

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
        <div className="flex gap-3 mb-4 flex-wrap">
          {searchKeys.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 px-3 text-[13px] border border-border rounded-lg outline-none w-[260px] text-ink"
            />
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key]}
              onChange={(e) =>
                setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              className="h-9 px-2.5 text-[13px] border border-border rounded-lg outline-none bg-white text-ink w-[150px] capitalize"
            >
              {f.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-page">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-[0.03em] text-ink-muted"
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
                    className="px-4 py-8 text-center text-[13px] text-ink-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border bg-white hover:bg-page transition-colors duration-100"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5 align-middle">
                        {col.render ? col.render(row) : (
                          <span className="text-[13px] text-ink-muted">{row[col.key]}</span>
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
          <div className="flex justify-center items-center gap-2 p-4 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-[13px] font-medium border border-border-muted rounded-lg bg-white text-ink-muted ${
                currentPage === 1 ? "opacity-40 cursor-default" : "cursor-pointer"
              }`}
            >
              Previous
            </button>
            <span className="text-[13px] text-ink-muted px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-[13px] font-medium border border-border-muted rounded-lg bg-white text-ink-muted ${
                currentPage === totalPages ? "opacity-40 cursor-default" : "cursor-pointer"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
