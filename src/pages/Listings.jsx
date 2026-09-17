import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import FilterSidebar from "../components/FilterSidebar";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { toEquipmentCardProps } from "../utils/equipmentMappers";

export default function Listings() {
  const [allEquipment, setAllEquipment] = useState([]);
  const [bookedMap, setBookedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    Promise.all([equipmentService.getAll(), bookingService.getCurrentlyBookedMap()])
      .then(([eq, booked]) => {
        setAllEquipment(eq);
        setBookedMap(booked);
      })
      .catch(() => setLoadError("Could not load listings."))
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (cat) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  function clearFilters() {
    setSearch(""); setSelectedCategories([]); setProvince("");
    setDistrict(""); setMinPrice(""); setMaxPrice("");
  }

  const mapped = allEquipment.map((eq) => ({
    ...toEquipmentCardProps(eq),
    unavailableUntil: bookedMap[eq.id] || null,
  }));

  let filtered = mapped.filter((eq) => {
    if (search && !eq.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategories.length && !selectedCategories.includes(eq.category)) return false;
    if (province && !eq.location.toLowerCase().includes(province.toLowerCase())) return false;
    if (district && !eq.location.toLowerCase().includes(district.toLowerCase())) return false;
    if (minPrice && eq.priceDay < Number(minPrice)) return false;
    if (maxPrice && eq.priceDay > Number(maxPrice)) return false;
    return true;
  });

  if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.priceDay - b.priceDay);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.priceDay - a.priceDay);

  return (
    <div className="bg-page min-h-screen pt-20 px-4 sm:px-6 pb-8">
      <div className="max-w-[1280px] mx-auto">

        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center gap-1.5 px-4 py-2 text-[13px] border-[1.5px] border-green text-green rounded-lg bg-transparent cursor-pointer mb-4"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className={`${showMobileFilters ? "block" : "hidden"} lg:block w-full lg:w-[260px] shrink-0 lg:sticky lg:top-20 lg:self-start`}>
            <FilterSidebar
              search={search} onSearchChange={setSearch}
              selectedCategories={selectedCategories} onToggleCategory={toggleCategory}
              province={province} district={district}
              onProvinceChange={setProvince} onDistrictChange={setDistrict}
              minPrice={minPrice} onMinPriceChange={setMinPrice}
              maxPrice={maxPrice} onMaxPriceChange={setMaxPrice}
              onClear={clearFilters}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[13px] text-ink-muted">
                {loading ? "Loading…" : `${filtered.length} results found`}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 px-3 text-[13px] border border-border rounded-lg outline-none bg-white"
              >
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>

            {loadError && (
              <div className="text-center py-16 text-red text-sm">{loadError}</div>
            )}

            {!loading && !loadError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((eq) => <EquipmentCard key={eq.id} {...eq} />)}
              </div>
            )}

            {!loading && !loadError && filtered.length === 0 && (
              <div className="text-center py-16 text-ink-muted text-sm">
                No equipment found matching your filters.
              </div>
            )}

            <div className="flex justify-center items-center gap-2 mt-8">
              <button className="px-3.5 py-1.5 text-[13px] text-ink-muted border border-border rounded-lg bg-white cursor-pointer opacity-40" disabled>
                Previous
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-9 h-9 text-[13px] rounded-lg cursor-pointer ${
                    p === 1 ? "border-none bg-orange text-white" : "border border-border bg-white text-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button className="px-3.5 py-1.5 text-[13px] text-ink border border-border rounded-lg bg-white cursor-pointer">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
