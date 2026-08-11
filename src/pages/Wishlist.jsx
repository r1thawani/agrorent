import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { EQUIPMENT } from "../data/mockData";
import EquipmentCard from "../components/EquipmentCard";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const { wishlistIds } = useWishlist();
  const saved = EQUIPMENT.filter((eq) => wishlistIds.includes(eq.id));

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
                // EquipmentCard's own heart button (top-right of the image) is
                // wired to the same WishlistContext, so tapping it here — where
                // everything shown is already saved — removes it from the list.
                // No need for a second, separately-positioned remove button.
                <EquipmentCard key={eq.id} {...eq} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
