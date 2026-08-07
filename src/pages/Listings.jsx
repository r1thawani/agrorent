import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import { EQUIPMENT, CATEGORIES, ZAMBIAN_PROVINCES } from "../data/mockData";

export default function Listings() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleCategory = (cat) =>
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );

  const filtered = EQUIPMENT.filter(eq => {
    if (selectedCategories.length && !selectedCategories.includes(eq.category)) return false;
    if (location && !eq.location.includes(location)) return false;
    if (minPrice && eq.priceDay < Number(minPrice)) return false;
    if (maxPrice && eq.priceDay > Number(maxPrice)) return false;
    return true;
  });

  const sidebar = (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "0.5px solid #E0E8E3", padding: "20px" }}>
      <div style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>Filters</div>

      <input type="text" placeholder="Search equipment…" style={{ width: "100%", height: "40px", padding: "0 12px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

      <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Category</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {CATEGORIES.map(cat => (
          <label key={cat} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} style={{ width: "16px", height: "16px", accentColor: "#FF5C00", cursor: "pointer" }} />
            <span style={{ fontSize: "13px", color: "#111111" }}>{cat}</span>
          </label>
        ))}
      </div>

      <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Location</div>
      <select value={location} onChange={e => setLocation(e.target.value)} style={{ width: "100%", height: "40px", padding: "0 12px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none", backgroundColor: "#FFFFFF", marginBottom: "20px" }}>
        <option value="">All provinces</option>
        {ZAMBIAN_PROVINCES.map(p => <option key={p}>{p}</option>)}
      </select>

      <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Price per day</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <input type="number" placeholder="Min (K)" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ width: "50%", height: "40px", padding: "0 10px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }} />
        <span style={{ color: "#555555" }}>–</span>
        <input type="number" placeholder="Max (K)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ width: "50%", height: "40px", padding: "0 10px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }} />
      </div>

      <button style={{ width: "100%", height: "44px", borderRadius: "8px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer" }}>
        Apply Filters
      </button>
      <button onClick={() => { setSelectedCategories([]); setLocation(""); setMinPrice(""); setMaxPrice(""); }}
        style={{ width: "100%", textAlign: "center", fontSize: "13px", color: "#555555", marginTop: "10px", background: "none", border: "none", cursor: "pointer" }}>
        Clear all filters
      </button>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", padding: "80px 24px 32px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Mobile filters button */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          style={{ display: "none", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "13px", border: "1.5px solid #1A5C2E", color: "#1A5C2E", borderRadius: "8px", backgroundColor: "transparent", cursor: "pointer", marginBottom: "16px" }}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>

        <div style={{ display: "flex", gap: "24px" }}>
          {/* Sidebar */}
          <div style={{ width: "260px", flexShrink: 0, position: "sticky", top: "80px", alignSelf: "flex-start" }}>
            {sidebar}
          </div>

          {/* Listings area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", color: "#555555" }}>{filtered.length} results found</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ height: "36px", padding: "0 12px", fontSize: "13px", border: "1px solid #E0E8E3", borderRadius: "8px", outline: "none", backgroundColor: "#FFFFFF" }}>
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {filtered.map(eq => <EquipmentCard key={eq.id} {...eq} />)}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#555555", fontSize: "14px" }}>
                No equipment found matching your filters.
              </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "32px" }}>
              <button style={{ padding: "6px 14px", fontSize: "13px", color: "#555555", border: "1px solid #E0E8E3", borderRadius: "8px", backgroundColor: "#FFFFFF", cursor: "pointer", opacity: 0.4 }} disabled>Previous</button>
              {[1, 2, 3].map(p => (
                <button key={p} style={{ width: "36px", height: "36px", fontSize: "13px", borderRadius: "8px", border: p === 1 ? "none" : "1px solid #E0E8E3", backgroundColor: p === 1 ? "#FF5C00" : "#FFFFFF", color: p === 1 ? "#FFFFFF" : "#111111", cursor: "pointer" }}>
                  {p}
                </button>
              ))}
              <button style={{ padding: "6px 14px", fontSize: "13px", color: "#111111", border: "1px solid #E0E8E3", borderRadius: "8px", backgroundColor: "#FFFFFF", cursor: "pointer" }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}