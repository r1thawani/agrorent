import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/mockData";
import PhotoUpload from "../components/PhotoUpload";
import Sidebar from "../components/Sidebar";

const CONDITIONS = ["New", "Good", "Fair", "Poor"];

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 12px",
  fontSize: 14,
  border: "1px solid #E0E8E3",
  borderRadius: 8,
  outline: "none",
  backgroundColor: "#fff",
  color: "#111111",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#111111",
  marginBottom: 6,
};

const sectionHeaderStyle = {
  fontSize: 12,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#555555",
  paddingBottom: 8,
  borderBottom: "1px solid #E0E8E3",
  marginBottom: 20,
};

export default function PostListing() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    condition: "",
    description: "",
    priceDay: "",
    priceWeek: "",
    pickup: "",
    availFrom: "",
    availUntil: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // No backend yet — navigate back to my listings on "submit"
    navigate("/my-listings");
  }

  function getFocusStyle(field) {
    return focusedField === field
      ? { ...inputStyle, borderColor: "#FF5C00" }
      : inputStyle;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F0" }}>
      <Sidebar role="owner" activeLink="/post-listing" />

      {/* Main content */}
      <div
        style={{
          marginLeft: 240,
          flex: 1,
          padding: "40px 32px",
          maxWidth: 760,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "#111111", marginBottom: 28, marginTop: 0 }}>
          Post your equipment
        </h1>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 32,
              border: "0.5px solid #E0E8E3",
            }}
          >
            {/* Section 1 — Basic info */}
            <div style={sectionHeaderStyle}>Basic information</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Equipment name</label>
                <input
                  value={form.name}
                  onChange={update("name")}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  style={getFocusStyle("name")}
                  placeholder="e.g. John Deere 5075E Tractor"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.category}
                    onChange={update("category")}
                    onFocus={() => setFocusedField("category")}
                    onBlur={() => setFocusedField(null)}
                    style={getFocusStyle("category")}
                    required
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Condition</label>
                  <select
                    value={form.condition}
                    onChange={update("condition")}
                    onFocus={() => setFocusedField("condition")}
                    onBlur={() => setFocusedField(null)}
                    style={getFocusStyle("condition")}
                    required
                  >
                    <option value="">Select…</option>
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <div style={{ position: "relative" }}>
                  <textarea
                    value={form.description}
                    onChange={update("description")}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField(null)}
                    maxLength={1000}
                    rows={5}
                    placeholder="Describe your equipment — age, brand, features, any important notes for renters…"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 14,
                      border: `1px solid ${focusedField === "description" ? "#FF5C00" : "#E0E8E3"}`,
                      borderRadius: 8,
                      outline: "none",
                      resize: "vertical",
                      minHeight: 120,
                      color: "#111111",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 10,
                      fontSize: 11,
                      color: "#555555",
                    }}
                  >
                    {form.description.length} / 1000
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2 — Pricing */}
            <div style={{ ...sectionHeaderStyle, marginTop: 32 }}>Pricing</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ maxWidth: "50%" }}>
                <label style={labelStyle}>Price per day</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 14,
                      color: "#555555",
                    }}
                  >
                    K
                  </span>
                  <input
                    type="number"
                    value={form.priceDay}
                    onChange={update("priceDay")}
                    onFocus={() => setFocusedField("priceDay")}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...getFocusStyle("priceDay"), paddingLeft: 28 }}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div style={{ maxWidth: "50%" }}>
                <label style={labelStyle}>Price per week (optional)</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 14,
                      color: "#555555",
                    }}
                  >
                    K
                  </span>
                  <input
                    type="number"
                    value={form.priceWeek}
                    onChange={update("priceWeek")}
                    onFocus={() => setFocusedField("priceWeek")}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...getFocusStyle("priceWeek"), paddingLeft: 28 }}
                    min="0"
                  />
                </div>
                <p style={{ fontSize: 12, color: "#555555", margin: "4px 0 0" }}>
                  Leave blank if you only rent daily.
                </p>
              </div>
            </div>

            {/* Section 3 — Location */}
            <div style={{ ...sectionHeaderStyle, marginTop: 32 }}>Location</div>
            <div>
              <label style={labelStyle}>Pickup location</label>
              <input
                value={form.pickup}
                onChange={update("pickup")}
                onFocus={() => setFocusedField("pickup")}
                onBlur={() => setFocusedField(null)}
                style={getFocusStyle("pickup")}
                placeholder="e.g. Lusaka, Chilanga Road near Total filling station"
              />
              <p style={{ fontSize: 12, color: "#555555", margin: "4px 0 0" }}>
                Be specific so renters know where to collect.
              </p>
            </div>

            {/* Section 4 — Availability */}
            <div style={{ ...sectionHeaderStyle, marginTop: 32 }}>Availability</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Available from</label>
                <input
                  type="date"
                  value={form.availFrom}
                  onChange={update("availFrom")}
                  onFocus={() => setFocusedField("availFrom")}
                  onBlur={() => setFocusedField(null)}
                  style={getFocusStyle("availFrom")}
                />
              </div>
              <span style={{ fontSize: 14, color: "#555555", paddingBottom: 10 }}>to</span>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Available until</label>
                <input
                  type="date"
                  value={form.availUntil}
                  onChange={update("availUntil")}
                  onFocus={() => setFocusedField("availUntil")}
                  onBlur={() => setFocusedField(null)}
                  style={getFocusStyle("availUntil")}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#555555", margin: "4px 0 0" }}>
              You can update availability at any time from your listings.
            </p>

            {/* Section 5 — Photos */}
            <div style={{ ...sectionHeaderStyle, marginTop: 32 }}>Photos</div>
            <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={10} />
          </div>

          <button
            type="submit"
            style={{
              display: "block",
              width: "100%",
              height: 52,
              marginTop: 24,
              backgroundColor: "#FF5C00",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#CC4A00")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF5C00")}
          >
            Post Listing
          </button>
        </form>
      </div>
    </div>
  );
}
