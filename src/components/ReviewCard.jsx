import StarRating from "./StarRating";

// One review block, used on ListingDetail.jsx. Pulled out of that page so a
// future PublicProfile "reviews about this owner" section can reuse the same
// card instead of re-writing the markup.
export default function ReviewCard({ review }) {
  const { name, photo, date, rating, text, reply } = review;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "0.5px solid #E0E8E3",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={photo}
            alt={name}
            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{name}</span>
        </div>
        <span style={{ fontSize: "12px", color: "#555555" }}>{date}</span>
      </div>

      <StarRating rating={rating} />

      <p style={{ fontSize: "14px", color: "#111111", marginTop: "8px", lineHeight: 1.6 }}>{text}</p>

      {reply && (
        <div style={{ marginTop: "12px", paddingLeft: "12px", borderLeft: "3px solid #1A5C2E" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: "#1A5C2E" }}>Owner reply:</div>
          <p style={{ fontSize: "14px", color: "#111111", marginTop: "4px" }}>{reply}</p>
        </div>
      )}
    </div>
  );
}
