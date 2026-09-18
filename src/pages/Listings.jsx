import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import EquipmentCard from "../components/EquipmentCard";
import FilterSidebar from "../components/FilterSidebar";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { toEquipmentCardProps } from "../utils/equipmentMappers";

const PAGE_SIZE = 12;

export default function Listings() {
  const [searchParams] = useSearchParams();
  const [allEquipment, setAllEquipment] = useState([]);
  const [bookedMap, setBookedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const cat = searchParams.get("category");
    return cat ? [cat] : [];
  });
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([equipmentService.getAll(), bookingService.getCurrentlyBookedMap()])
      .then(([eq, booked]) => {
        setAllEquipment(eq);
        setBookedMap(booked);
      })
      .catch(() => setLoadError("Could not load listings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, selectedCategories, province, district, minPrice, maxPrice, sort]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pageNumbers.push(i);
  }

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
                {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} found`}
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

            {!loading && !loadError && filtered.length === 0 && (
              <div className="text-center py-16 text-ink-muted text-sm">
                No equipment found matching your filters.
              </div>
            )}

            {!loading && !loadError && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {pageItems.map((eq) => <EquipmentCard key={eq.id} {...eq} />)}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 text-[13px] text-ink-muted border border-border rounded-lg bg-white cursor-pointer disabled:opacity-40"
                >
                  Previous
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 text-[13px] rounded-lg cursor-pointer ${
                      p === page ? "border-none bg-orange text-white" : "border border-border bg-white text-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 text-[13px] text-ink border border-border rounded-lg bg-white cursor-pointer disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
