import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { EQUIPMENT } from "../data/mockData";
import EquipmentCard from "../components/EquipmentCard";

export default function Wishlist() {
  const [saved, setSaved] = useState(EQUIPMENT.slice(0, 4));

  function remove(id) {
    setSaved((s) => s.filter((eq) => eq.id !== id));
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "24px" }}>
        <Sidebar role="renter" activeLink="/wishlist" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            Saved equipment
          </h1>

          {saved.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 0", gap: "16px" }}>
              <Heart size={32} color="#E0E8E3" />
              <div style={{ fontSize: "18px", fontWeight: 500, color: "#111111" }}>Nothing saved yet</div>
              <div style={{ fontSize: "14px", color: "#555555" }}>
                Browse equipment and tap the heart icon to save it here.
              </div>
              <Link
                to="/listings"
                style={{
                  padding: "10px 24px",
                  fontSize: "14px",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontWeight: 500,
                  backgroundColor: "#FF5C00",
                  textDecoration: "none",
                }}
              >
                Browse Equipment
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "20px",
              }}
            >
              {saved.map((eq) => (
                <div key={eq.id} style={{ position: "relative" }}>
                  <EquipmentCard {...eq} />
                  <button
                    onClick={() => remove(eq.id)}
                    aria-label="Remove from wishlist"
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "9999px",
                      backgroundColor: "#FFFFFF",
                      border: "none",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                  >
                    <Heart size={16} fill="#EF4444" stroke="#EF4444" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
