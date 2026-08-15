import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import FilterSidebar from "../components/FilterSidebar";
import { EQUIPMENT, matchesLocation } from "../data/mockData";

export default function Listings() {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleCategory = (cat) =>
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setProvince("");
    setDistrict("");
    setMinPrice("");
    setMaxPrice("");
  }

  let filtered = EQUIPMENT.filter(eq => {
    if (search && !eq.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategories.length && !selectedCategories.includes(eq.category)) return false;
    if (!matchesLocation(eq.location, province, district)) return false;
    if (minPrice && eq.priceDay < Number(minPrice)) return false;
    if (maxPrice && eq.priceDay > Number(maxPrice)) return false;
    return true;
  });

  if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.priceDay - b.priceDay);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.priceDay - a.priceDay);

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
            <FilterSidebar
              search={search}
              onSearchChange={setSearch}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              province={province}
              district={district}
              onProvinceChange={setProvince}
              onDistrictChange={setDistrict}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              onClear={clearFilters}
            />
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
