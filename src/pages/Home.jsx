import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import { CATEGORIES } from "../data/mockData";
import { equipmentService } from "../services/equipmentService";
import { toEquipmentCardProps } from "../utils/equipmentMappers";
import { useAsync } from "../hooks/useAsync";

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: equipment, loading } = useAsync(() => equipmentService.getAll(), [], {
    initialData: [],
  });
  const popular = equipment.slice(0, 6).map(toEquipmentCardProps);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/listings?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="pt-14">

      {/* HERO */}
      <section className="relative min-h-[420px] sm:min-h-[480px] flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1507662228758-08d030c4820b?w=1600&h=700&fit=crop&auto=format"
          alt="Farm field"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(15,61,30,0.55)]" />
        <div className="relative z-10 text-center px-4 sm:px-6 py-12 sm:py-16 w-full max-w-[720px] mx-auto">
          <h1 className="text-[24px] sm:text-[28px] font-medium text-white leading-tight">
            Rent the equipment. Grow the harvest.
          </h1>
          <p className="text-[14px] sm:text-[15px] text-green-tint-2 mt-2">
            Find affordable farming equipment near you — tractors, ploughs, harvesters and more
          </p>
          <form onSubmit={handleSearch} className="mt-6 flex max-w-[600px] mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for equipment (e.g. tractor, plough…)"
              className="flex-1 h-12 px-4 text-sm border-none outline-none rounded-l-lg text-white bg-white/15 min-w-0"
            />
            <button
              type="submit"
              className="h-12 px-4 sm:px-6 bg-orange text-white text-sm font-medium border-none cursor-pointer rounded-r-lg flex items-center gap-2 flex-shrink-0"
            >
              <Search size={16} /> Search
            </button>
          </form>
        </div>
      </section>

      {/* BROWSE BY CATEGORY */}
      <section className="bg-white px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-xl font-medium text-ink">Browse by category</h2>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate(`/listings?category=${cat}`)}
                className="px-4 py-1.5 rounded-full border border-border bg-white text-ink-muted text-[13px] cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR EQUIPMENT */}
      <section className="bg-page px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-xl font-medium text-ink">Popular equipment near you</h2>

          {loading ? (
            <div className="text-center py-10 text-ink-muted">Loading…</div>
          ) : popular.length === 0 ? (
            <div className="text-center py-10 text-ink-muted">No listings yet — be the first to post one.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {popular.map((eq) => (
                <EquipmentCard key={eq.id} {...eq} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/listings")}
              className="px-7 py-2.5 rounded-lg border-[1.5px] border-orange bg-transparent text-orange text-[13px] font-medium cursor-pointer"
            >
              Browse all equipment
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-xl font-medium text-ink">How AgroRent works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6 mt-8">
            {[
              { n: 1, title: "List your equipment", desc: "Create a free listing with photos and your price per day" },
              { n: 2, title: "Get booked", desc: "Renters find your equipment and send a booking request" },
              { n: 3, title: "Earn money", desc: "Accept the booking and receive your payment after the rental" },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-orange text-white text-base font-medium flex items-center justify-center">
                  {step.n}
                </div>
                <div className="text-base font-medium text-ink mt-3">{step.title}</div>
                <p className="text-sm text-ink-muted mt-1 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-page px-4 sm:px-6 py-14 sm:py-16 text-center">
        <h2 className="text-[20px] sm:text-[22px] font-medium text-ink">Ready to get started?</h2>
        <p className="text-[15px] text-ink-muted mt-2">Join farmers across Zambia already renting on AgroRent</p>
        <button
          onClick={() => navigate("/signup")}
          className="mt-6 px-8 py-3 rounded-lg bg-orange text-white text-[13px] font-medium border-none cursor-pointer"
        >
          Create a free account
        </button>
      </section>

    </div>
  );
}
