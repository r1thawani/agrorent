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
    if (wishlistIds.length === 0) { setSaved([]); setLoading(false); return; }
    setLoading(true);
    equipmentService
      .getAll()
      .then((all) => setSaved(all.filter((eq) => wishlistIds.includes(eq.id)).map(toEquipmentCardProps)))
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar activeLink="/wishlist" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink mb-5">Saved equipment</h1>

          {loading && <div className="text-center py-16 text-ink-muted">Loading…</div>}

          {!loading && saved.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-4">
              <Heart size={32} color="#E0E8E3" />
              <div className="text-lg font-medium text-ink">Nothing saved yet</div>
              <div className="text-sm text-ink-muted">Browse equipment and tap the heart icon to save it here.</div>
              <Link
                to="/listings"
                className="px-6 py-2.5 text-sm text-white rounded-lg font-medium bg-orange no-underline"
              >
                Browse Equipment
              </Link>
            </div>
          )}

          {!loading && saved.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {saved.map((eq) => <EquipmentCard key={eq.id} {...eq} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
