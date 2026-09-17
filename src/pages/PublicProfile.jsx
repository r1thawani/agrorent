import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import { equipmentService } from "../services/equipmentService";
import { toEquipmentCardProps } from "../utils/equipmentMappers";
import { supabase } from "../lib/supabaseClient";
import Avatar from "../components/Avatar";

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
      <div className="min-h-screen bg-page pt-[88px] text-center text-ink-muted">Loading…</div>
    );
  }

  if (notFound || !owner) {
    return (
      <div className="min-h-screen bg-page pt-14 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-[18px] font-medium text-ink mb-2">Profile not found</div>
          <p className="text-sm text-ink-muted mb-4">We couldn't find an owner matching this profile.</p>
          <Link to="/listings"
            className="inline-block px-6 py-2.5 rounded-lg bg-orange text-white text-sm font-medium no-underline">
            Browse Equipment
          </Link>
        </div>
      </div>
    );
  }

  const totalReviews = listings.reduce((sum, l) => sum + (l.review_count || 0), 0);
  const avgRating = listings.length
    ? listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length
    : 0;
  const memberSince = owner.created_at ? new Date(owner.created_at).getFullYear() : "";
  const primaryLocation = listings[0]?.location || "";
  const mappedListings = listings.map(toEquipmentCardProps);

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-xl p-7 mb-7 border border-border/50">
          <div className="flex gap-6">
            <Avatar src={owner.photo_url} name={owner.name}
              className="w-24 h-24" />
            <div>
              <h1 className="text-[22px] font-medium text-ink">{owner.name}</h1>
              {memberSince && (
                <div className="text-[13px] text-ink-muted mt-0.5">Member since {memberSince}</div>
              )}
              {primaryLocation && (
                <div className="flex items-center gap-1 text-[13px] text-ink-muted mt-0.5">
                  <MapPin size={12} /> {primaryLocation}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14}
                    fill={s <= Math.round(avgRating) ? "#FF5C00" : "none"}
                    stroke={s <= Math.round(avgRating) ? "#FF5C00" : "#cccccc"} />
                ))}
                <span className="text-[15px] font-medium text-ink">{avgRating.toFixed(1)}</span>
                <span className="text-[13px] text-ink-muted">({totalReviews} reviews)</span>
              </div>
              <p className="text-sm text-ink mt-3 leading-relaxed max-w-[480px]">
                {owner.name} is an experienced equipment owner on AgroRent, listing{" "}
                {listings.length} {listings.length === 1 ? "piece" : "pieces"} of equipment for
                rent to farmers across Zambia.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-[18px] font-medium text-ink mb-4">Equipment by {owner.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-7">
          {mappedListings.map((eq) => (
            <EquipmentCard key={eq.id} {...eq} />
          ))}
        </div>

        <h2 className="text-[18px] font-medium text-ink mb-4">
          Reviews{" "}
          <span className="text-sm font-normal text-ink-muted">
            — avg {avgRating.toFixed(1)} ({totalReviews})
          </span>
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-muted">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar src={r.reviewer?.photo_url} name={r.reviewer?.name}
                      className="w-8 h-8 text-[10px]" />
                    <span className="text-sm font-medium text-ink">{r.reviewer?.name}</span>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13}
                      fill={s <= r.rating ? "#FF5C00" : "none"}
                      stroke={s <= r.rating ? "#FF5C00" : "#cccccc"} />
                  ))}
                </div>
                <p className="text-sm text-ink leading-relaxed">{r.text}</p>
                {r.owner_reply && (
                  <div className="mt-3 pl-3 border-l-[3px] border-l-green">
                    <div className="text-xs font-medium text-green">Owner reply:</div>
                    <p className="text-sm text-ink mt-0.5">{r.owner_reply}</p>
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
