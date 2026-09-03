// FILE: agrorent/src/pages/Wishlist.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Sidebar from "../components/Sidebar";
import EquipmentCard from "../components/EquipmentCard";
import { equipmentService } from "../services/equipmentService";
import { toEquipmentCardProps } from "../utils/equipmentMappers";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const { wishlistIds } = useWishlist();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setSaved([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    equipmentService
      .getAll()
      .then((all) => {
        const filtered = all.filter((eq) => wishlistIds.includes(eq.id));
        setSaved(filtered.map(toEquipmentCardProps));
      })
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "24px" }}>
        <Sidebar role="renter" activeLink="/wishlist" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            Saved equipment
          </h1>

          {loading && (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#555555" }}>Loading…</div>
          )}

          {!loading && saved.length === 0 && (
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
          )}

          {!loading && saved.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "20px",
              }}
            >
              {saved.map((eq) => (
                <EquipmentCard key={eq.id} {...eq} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}