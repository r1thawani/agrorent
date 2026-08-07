import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import { EQUIPMENT, CATEGORIES } from "../data/mockData";

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/listings?q=${encodeURIComponent(query)}`);
  }

  return (
    <div style={{ paddingTop: "56px" }}>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "480px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="https://images.unsplash.com/photo-1507662228758-08d030c4820b?w=1600&h=700&fit=crop&auto=format"
          alt="Farm field"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15, 61, 30, 0.55)" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "64px 24px", width: "100%", maxWidth: "720px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 500, color: "#FFFFFF", lineHeight: 1.2 }}>
            Rent the equipment. Grow the harvest.
          </h1>
          <p style={{ fontSize: "15px", color: "#A8E6BE", marginTop: "8px" }}>
            Find affordable farming equipment near you — tractors, ploughs, harvesters and more
          </p>
          <form onSubmit={handleSearch} style={{ marginTop: "24px", display: "flex", maxWidth: "600px", margin: "24px auto 0" }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for equipment (e.g. tractor, plough…)"
              style={{ flex: 1, height: "48px", padding: "0 16px", fontSize: "14px", border: "none", outline: "none", borderRadius: "8px 0 0 8px", color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.15)" }}
            />
            <button
              type="submit"
              style={{ height: "48px", padding: "0 24px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer", borderRadius: "0 8px 8px 0", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Search size={16} /> Search
            </button>
          </form>
        </div>
      </section>

      {/* BROWSE BY CATEGORY */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "48px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#111111" }}>Browse by category</h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => navigate(`/listings?category=${cat}`)}
                style={{ padding: "6px 16px", borderRadius: "20px", border: "1px solid #E0E8E3", backgroundColor: "#FFFFFF", color: "#555555", fontSize: "13px", cursor: "pointer" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR EQUIPMENT */}
      <section style={{ backgroundColor: "#F5F5F0", padding: "48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#111111" }}>Popular equipment near you</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginTop: "24px" }}>
            {EQUIPMENT.slice(0, 6).map(eq => (
              <EquipmentCard key={eq.id} {...eq} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button
              onClick={() => navigate("/listings")}
              style={{ padding: "10px 28px", borderRadius: "8px", border: "1.5px solid #FF5C00", backgroundColor: "transparent", color: "#FF5C00", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              Browse all equipment
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ backgroundColor: "#FFFFFF", padding: "48px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#111111" }}>How AgroRent works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginTop: "32px" }}>
            {[
              { n: 1, title: "List your equipment", desc: "Create a free listing with photos and your price per day" },
              { n: 2, title: "Get booked", desc: "Renters find your equipment and send a booking request" },
              { n: 3, title: "Earn money", desc: "Accept the booking and receive your payment after the rental" },
            ].map(step => (
              <div key={step.n} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "16px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.n}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginTop: "12px" }}>{step.title}</div>
                <p style={{ fontSize: "14px", color: "#555555", marginTop: "4px", lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: "#F5F5F0", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>Ready to get started?</h2>
        <p style={{ fontSize: "15px", color: "#555555", marginTop: "8px" }}>Join farmers across Zambia already renting on AgroRent</p>
        <button
          onClick={() => navigate("/signup")}
          style={{ marginTop: "24px", padding: "12px 32px", borderRadius: "8px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer" }}
        >
          Create a free account
        </button>
      </section>

    </div>
  );
}