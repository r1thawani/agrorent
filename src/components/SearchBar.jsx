import { Search } from "lucide-react";

// Text search input used at the top of Listings.jsx's filter sidebar.
// Previously that input existed in markup only (no value/onChange), so
// typing in it did nothing — this version is controlled and wired to
// Listings.jsx's filter state, so it actually narrows results by name.
export default function SearchBar({ value, onChange, placeholder = "Search equipment…" }) {
  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <Search
        size={15}
        style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#555555" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "40px",
          padding: "0 12px 0 34px",
          fontSize: "13px",
          border: "1.5px solid #E0E8E3",
          borderRadius: "8px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
