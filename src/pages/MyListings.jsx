import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      equipmentService.getMine(user.id),
      bookingService.getRequestsForOwner(user.id),
    ])
      .then(([equipment, bookings]) => {
        const merged = equipment.map((eq) => {
          const eqBookings = bookings.filter((b) => b.equipment_id === eq.id);
          const earnings = eqBookings
            .filter((b) => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => sum + Number(b.total_price), 0);
          const photos = (eq.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
          return {
            ...eq,
            image: photos[0]?.url || "",
            listed: eq.created_at ? new Date(eq.created_at).toLocaleDateString() : "",
            isAvailable: eq.is_available,
            bookingsCount: eqBookings.length,
            earnings,
          };
        });
        setListings(merged);
      })
      .catch(() => setLoadError("Could not load your listings."))
      .finally(() => setLoading(false));
  }, [user]);

  async function toggleAvailability(id) {
    const target = listings.find((eq) => eq.id === id);
    const nextValue = !target?.isAvailable;
    setListings((prev) => prev.map((eq) => (eq.id === id ? { ...eq, isAvailable: nextValue } : eq)));
    try {
      await equipmentService.update(id, { is_available: nextValue });
    } catch {
      setListings((prev) => prev.map((eq) => (eq.id === id ? { ...eq, isAvailable: !nextValue } : eq)));
    }
  }

  async function deleteListing(id) {
    const removed = listings.find((eq) => eq.id === id);
    setListings((prev) => prev.filter((eq) => eq.id !== id));
    try {
      await equipmentService.remove(id);
    } catch {
      if (removed) setListings((prev) => [...prev, removed].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
  }

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar role="owner" activeLink="/my-listings" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-medium text-ink">My listings</h1>
            <Link to="/post-listing"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-green rounded-lg no-underline hover:bg-green-dark transition-colors">
              <PlusCircle size={15} />
              Post new listing
            </Link>
          </div>

          {loading && <div className="text-center py-20 text-ink-muted">Loading…</div>}
          {loadError && <div className="text-center py-20 text-red">{loadError}</div>}

          {!loading && !loadError && listings.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="w-[120px] h-20 border-2 border-dashed border-border rounded-xl" />
              <div className="text-[18px] font-medium text-ink">No listings yet</div>
              <div className="text-sm text-ink-muted">Post your first listing to start earning.</div>
              <Link to="/post-listing"
                className="px-6 py-2 text-[13px] font-medium text-white bg-orange rounded-lg no-underline">
                Post a listing
              </Link>
            </div>
          )}

          {!loading && !loadError && listings.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {listings.map((eq) => (
                <ListingRow key={eq.id} eq={eq}
                  onToggle={() => toggleAvailability(eq.id)}
                  onDelete={() => deleteListing(eq.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingRow({ eq, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    await onDelete();
  }

  return (
    <div className="bg-white rounded-xl px-4 py-3.5 border border-border/50 flex items-center gap-3.5">
      <img src={eq.image} alt={eq.name}
        className="w-20 h-16 rounded-lg object-cover shrink-0 bg-page" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-medium text-ink truncate">{eq.name}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            eq.isAvailable ? "bg-green-tint text-green-dark" : "bg-page text-ink-muted"
          }`}>
            {eq.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
        <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-tint text-green-dark mb-1">
          {eq.category}
        </span>
        <div className="text-xs text-ink-muted">Posted {eq.listed}</div>
      </div>

      <div className="flex gap-7 shrink-0 mr-2">
        <div>
          <div className="text-xs text-ink-muted">Bookings</div>
          <div className="text-sm font-medium text-ink">{eq.bookingsCount}</div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">Earnings</div>
          <div className="text-sm font-medium text-ink">K{eq.earnings.toLocaleString()}</div>
        </div>
      </div>

      {confirmDelete ? (
        <div className="flex gap-1.5 shrink-0">
          <button onClick={handleDelete} disabled={deleting}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red rounded-lg border-none cursor-pointer disabled:opacity-60">
            {deleting ? "Deleting…" : "Confirm"}
          </button>
          <button onClick={() => setConfirmDelete(false)}
            className="px-3 py-1.5 text-xs text-ink-muted bg-white border border-border rounded-lg cursor-pointer">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 shrink-0">
          <Link to={`/listings/${eq.id}/edit`}
            className="block px-3 py-1.5 text-[13px] font-medium text-orange border border-orange rounded-lg no-underline text-center hover:bg-orange hover:text-white transition-colors">
            Edit
          </Link>
          <button onClick={onToggle}
            className="px-3 py-1.5 text-[13px] text-ink-muted bg-white border border-border rounded-lg cursor-pointer hover:bg-page transition-colors">
            {eq.isAvailable ? "Mark unavailable" : "Mark available"}
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-[13px] text-red bg-white border border-border rounded-lg cursor-pointer hover:bg-red-tint transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
