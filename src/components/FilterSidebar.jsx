import SearchBar from "./SearchBar";
import LocationSelect from "./LocationSelect";
import { CATEGORIES } from "../data/mockData";

export default function FilterSidebar({
  search,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onClear,
}) {
  return (
    <div className="bg-white rounded-xl border border-border/50 p-5">
      <div className="text-base font-medium text-ink mb-4">Filters</div>

      <SearchBar value={search} onChange={onSearchChange} />

      <div className="text-xs font-medium text-ink-muted uppercase tracking-[0.05em] mb-2.5">
        Category
      </div>
      <div className="flex flex-col gap-2 mb-5">
        {CATEGORIES.map((cat) => (
          <label key={cat} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => onToggleCategory(cat)}
              className="w-4 h-4 accent-orange cursor-pointer"
            />
            <span className="text-[13px] text-ink">{cat}</span>
          </label>
        ))}
      </div>

      <div className="text-xs font-medium text-ink-muted uppercase tracking-[0.05em] mb-2.5">
        Location
      </div>
      <div className="mb-5">
        <LocationSelect
          province={province}
          district={district}
          onProvinceChange={onProvinceChange}
          onDistrictChange={onDistrictChange}
          allowEmpty
          inputStyle={{ height: "40px" }}
        />
      </div>

      <div className="text-xs font-medium text-ink-muted uppercase tracking-[0.05em] mb-2.5">
        Price per day
      </div>
      <div className="flex items-center gap-2 mb-6">
        <input
          type="number"
          placeholder="Min (K)"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          className="w-1/2 h-10 px-2.5 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
        />
        <span className="text-ink-muted">–</span>
        <input
          type="number"
          placeholder="Max (K)"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          className="w-1/2 h-10 px-2.5 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
        />
      </div>

      <button
        onClick={onClear}
        className="w-full text-center text-[13px] text-ink-muted bg-transparent border border-border rounded-lg py-2.5 cursor-pointer"
      >
        Clear all filters
      </button>
    </div>
  );
}
