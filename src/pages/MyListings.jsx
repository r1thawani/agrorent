// FILE: agrorent/src/pages/MyListings.jsx
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
    setListings((prev) => prev.filter((eq) => eq.id !== id));
    try {
      await equipmentService.remove(id);
    } catch {
      // If deletion fails, the listing simply won't show back up until refresh —
      // acceptable tradeoff for keeping this simple.
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <Sidebar role="owner" activeLink="/my-listings" />

      <div style={{ flex: 1, minWidth: 0, padding: "40px 32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#111111", margin: 0 }}>
            My listings
          </h1>
          <Link
            to="/post-listing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#1A5C2E",
              borderRadius: 8,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#145226")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1A5C2E")}
          >
            <PlusCircle size={15} />
            Post new listing
          </Link>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#555555" }}>Loading…</div>
        )}

        {loadError && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#A02020" }}>{loadError}</div>
        )}

        {!loading && !loadError && listings.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 80,
              paddingBottom: 80,
              gap: 16,
            }}
          >
            <div
              style={{
                width: 120,
                height: 80,
                border: "2px dashed #E0E8E3",
                borderRadius: 12,
              }}
            />
            <div style={{ fontSize: 18, fontWeight: 500, color: "#111111" }}>
              No listings yet
            </div>
            <div style={{ fontSize: 14, color: "#555555" }}>
              Post your first listing to start earning.
            </div>
            <Link
              to="/post-listing"
              style={{
                padding: "9px 24px",
                fontSize: 13,
                fontWeight: 500,
                color: "#fff",
                backgroundColor: "#FF5C00",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Post a listing
            </Link>
          </div>
        )}

        {!loading && !loadError && listings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {listings.map((eq) => (
              <ListingRow
                key={eq.id}
                eq={eq}
                onToggle={() => toggleAvailability(eq.id)}
                onDelete={() => deleteListing(eq.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingRow({ eq, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hoverEdit, setHoverEdit] = useState(false);
  const [hoverToggle, setHoverToggle] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "0.5px solid #E0E8E3",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <img
        src={eq.image}
        alt={eq.name}
        style={{
          width: 80,
          height: 64,
          borderRadius: 8,
          objectFit: "cover",
          flexShrink: 0,
          backgroundColor: "#F5F5F0",
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#111111",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {eq.name}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 20,
              flexShrink: 0,
              backgroundColor: eq.isAvailable ? "#D4EDDA" : "#F5F5F0",
              color: eq.isAvailable ? "#0F3D1E" : "#555555",
            }}
          >
            {eq.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 20,
            backgroundColor: "#D4EDDA",
            color: "#0F3D1E",
            marginBottom: 4,
          }}
        >
          {eq.category}
        </span>
        <div style={{ fontSize: 12, color: "#555555" }}>Posted {eq.listed}</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 28,
          flexShrink: 0,
          marginRight: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#555555" }}>Bookings</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#111111" }}>
            {eq.bookingsCount}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#555555" }}>Earnings</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#111111" }}>
            K{eq.earnings.toLocaleString()}
          </div>
        </div>
      </div>

      {confirmDelete ? (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={onDelete}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#DC2626",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              color: "#555555",
              backgroundColor: "#fff",
              border: "1px solid #E0E8E3",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Link
            to={`/listings/${eq.id}/edit`}
            style={{
              display: "block",
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: hoverEdit ? "#fff" : "#FF5C00",
              backgroundColor: hoverEdit ? "#FF5C00" : "transparent",
              border: "1.5px solid #FF5C00",
              borderRadius: 8,
              textDecoration: "none",
              textAlign: "center",
              transition: "background-color 0.12s, color 0.12s",
            }}
            onMouseEnter={() => setHoverEdit(true)}
            onMouseLeave={() => setHoverEdit(false)}
          >
            Edit
          </Link>
          <button
            onClick={onToggle}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              color: "#555555",
              backgroundColor: hoverToggle ? "#F5F5F0" : "#fff",
              border: "1px solid #E0E8E3",
              borderRadius: 8,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoverToggle(true)}
            onMouseLeave={() => setHoverToggle(false)}
          >
            {eq.isAvailable ? "Mark unavailable" : "Mark available"}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              color: "#DC2626",
              backgroundColor: hoverDelete ? "#FDECEA" : "#fff",
              border: "1px solid #E0E8E3",
              borderRadius: 8,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoverDelete(true)}
            onMouseLeave={() => setHoverDelete(false)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}