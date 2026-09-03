// FILE: agrorent/src/pages/PublicProfile.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import { equipmentService } from "../services/equipmentService";
import { toEquipmentCardProps } from "../utils/equipmentMappers";
import { supabase } from "../lib/supabaseClient";

export default function PublicProfile() {
  const { id } = useParams();
  const [owner, setOwner] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError || !profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setOwner(profile);

      const equipment = await equipmentService.getMine(id);
      setListings(equipment);

      if (equipment.length > 0) {
        const { data: reviewRows } = await supabase
          .from("reviews")
          .select("*, reviewer:profiles!reviews_reviewer_id_fkey(name, photo_url)")
          .in("equipment_id", equipment.map((e) => e.id))
          .order("created_at", { ascending: false });
        setReviews(reviewRows || []);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "88px", textAlign: "center", color: "#555555" }}>
        Loading…
      </div>
    );
  }

  if (notFound || !owner) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F5F5F0",
          paddingTop: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
            Profile not found
          </div>
          <p style={{ fontSize: "14px", color: "#555555", marginBottom: "16px" }}>
            We couldn't find an owner matching this profile.
          </p>
          <Link
            to="/listings"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: "8px",
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Browse Equipment
          </Link>
        </div>
      </div>
    );
  }

  // Aggregate rating/review count across all of this owner's listings —
  // profiles has no rating column of its own, only equipment does.
  const totalReviews = listings.reduce((sum, l) => sum + (l.review_count || 0), 0);
  const avgRating = listings.length
    ? listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length
    : 0;

  const memberSince = owner.created_at ? new Date(owner.created_at).getFullYear() : "";
  const primaryLocation = listings[0]?.location || "";

  // Map real equipment rows into the flat shape EquipmentCard expects.
  const mappedListings = listings.map(toEquipmentCardProps);

  return (
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", paddingTop: "56px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 16px" }}>
        {/* Profile header */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "28px",
            marginBottom: "28px",
            border: "0.5px solid #E0E8E3",
          }}
        >
          <div style={{ display: "flex", gap: "24px" }}>
            <img
              src={owner.photo_url}
              alt={owner.name}
              style={{ width: "96px", height: "96px", borderRadius: "9999px", objectFit: "cover", flexShrink: 0, backgroundColor: "#F5F5F0" }}
            />
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>{owner.name}</h1>
              {memberSince && (
                <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>
                  Member since {memberSince}
                </div>
              )}
              {primaryLocation && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#555555", marginTop: "2px" }}>
                  <MapPin size={12} /> {primaryLocation}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= Math.round(avgRating) ? "#FF5C00" : "none"}
                    stroke={s <= Math.round(avgRating) ? "#FF5C00" : "#cccccc"}
                  />
                ))}
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: "13px", color: "#555555" }}>({totalReviews} reviews)</span>
              </div>
              <p style={{ fontSize: "14px", color: "#111111", marginTop: "12px", lineHeight: 1.6, maxWidth: "480px" }}>
                {owner.name} is an experienced equipment owner on AgroRent, listing{" "}
                {listings.length} {listings.length === 1 ? "piece" : "pieces"} of equipment for
                rent to farmers across Zambia.
              </p>
            </div>
          </div>
        </div>

        {/* Listings */}
        <h2 style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
          Equipment by {owner.name}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          {mappedListings.map((eq) => (
            <EquipmentCard key={eq.id} {...eq} />
          ))}
        </div>

        {/* Reviews */}
        <h2 style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
          Reviews{" "}
          <span style={{ fontSize: "14px", fontWeight: 400, color: "#555555" }}>
            — avg {avgRating.toFixed(1)} ({totalReviews})
          </span>
        </h2>
        {reviews.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#555555" }}>No reviews yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "16px", border: "0.5px solid #E0E8E3" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img
                      src={r.reviewer?.photo_url}
                      alt={r.reviewer?.name}
                      style={{ width: "32px", height: "32px", borderRadius: "9999px", objectFit: "cover", backgroundColor: "#F5F5F0" }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{r.reviewer?.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#555555" }}>
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      fill={s <= r.rating ? "#FF5C00" : "none"}
                      stroke={s <= r.rating ? "#FF5C00" : "#cccccc"}
                    />
                  ))}
                </div>
                <p style={{ fontSize: "14px", color: "#111111", lineHeight: 1.6 }}>{r.text}</p>
                {r.owner_reply && (
                  <div style={{ marginTop: "12px", paddingLeft: "12px", borderLeft: "3px solid #1A5C2E" }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: "#1A5C2E" }}>Owner reply:</div>
                    <p style={{ fontSize: "14px", color: "#111111", marginTop: "2px" }}>{r.owner_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}