import SearchBar from "./SearchBar";
import { CATEGORIES, ZAMBIAN_PROVINCES } from "../data/mockData";

// The filters panel from Listings.jsx, extracted into its own component so
// it's testable/reusable on its own (e.g. a future "browse by category" page)
// instead of living as a local JSX variable inside the page.
export default function FilterSidebar({
  search,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  location,
  onLocationChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onClear,
}) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "0.5px solid #E0E8E3", padding: "20px" }}>
      <div style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>Filters</div>

      <SearchBar value={search} onChange={onSearchChange} />

      <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
        Category
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {CATEGORIES.map((cat) => (
          <label key={cat} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => onToggleCategory(cat)}
              style={{ width: "16px", height: "16px", accentColor: "#FF5C00", cursor: "pointer" }}
            />
            <span style={{ fontSize: "13px", color: "#111111" }}>{cat}</span>
          </label>
        ))}
      </div>

      <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
        Location
      </div>
      <select
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        style={{ width: "100%", height: "40px", padding: "0 12px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none", backgroundColor: "#FFFFFF", marginBottom: "20px" }}
      >
        <option value="">All provinces</option>
        {ZAMBIAN_PROVINCES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>

      <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
        Price per day
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <input
          type="number"
          placeholder="Min (K)"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          style={{ width: "50%", height: "40px", padding: "0 10px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }}
        />
        <span style={{ color: "#555555" }}>–</span>
        <input
          type="number"
          placeholder="Max (K)"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          style={{ width: "50%", height: "40px", padding: "0 10px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }}
        />
      </div>

      <button
        onClick={onClear}
        style={{ width: "100%", textAlign: "center", fontSize: "13px", color: "#555555", background: "none", border: "1px solid #E0E8E3", borderRadius: "8px", padding: "10px 0", cursor: "pointer" }}
      >
        Clear all filters
      </button>
    </div>
  );
}
