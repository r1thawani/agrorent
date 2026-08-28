// FILE: agrorent/src/pages/PostListing.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/mockData";
import { equipmentService } from "../services/equipmentService";
import { useAuth } from "../hooks/useAuth";
import PhotoUpload from "../components/PhotoUpload";
import LocationSelect from "../components/LocationSelect";
import Sidebar from "../components/Sidebar";

// Matches equipment_condition enum in the database exactly — "Poor" was
// removed since it isn't a valid value there and would fail on submit.
const CONDITIONS = ["New", "Excellent", "Good", "Fair"];

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
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    condition: "",
    description: "",
    priceDay: "",
    priceWeek: "",
    pickup: "",
    province: "",
    district: "",
    availFrom: "",
    availUntil: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.category || !form.priceDay || !form.pickup) {
      setFormError("Please fill in the equipment name, category, daily price, and pickup location.");
      return;
    }
    if (!form.province || !form.district) {
      setFormError("Please select the province and district for this listing.");
      return;
    }
    setFormError("");
    setSubmitting(true);

    try {
      const created = await equipmentService.create({
        owner_id: user.id,
        name: form.name,
        category: form.category,
        condition: form.condition || "Good",
        description: form.description,
        price_day: Number(form.priceDay) || 0,
        price_week: form.priceWeek ? Number(form.priceWeek) : null,
        province: form.province,
        district: form.district,
        location: `${form.district}, ${form.province}`,
        pickup_address: form.pickup,
        available_from: form.availFrom || null,
        available_until: form.availUntil || null,
      });

      // photos are data-URL strings from PhotoUpload — convert each back to
      // a real Blob before handing it to Supabase Storage's upload().
      for (let i = 0; i < photos.length; i++) {
        const res = await fetch(photos[i]);
        const blob = await res.blob();
        await equipmentService.uploadPhoto(created.id, blob, `photo-${i}.jpg`);
      }

      navigate("/my-listings");
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong posting your listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function getFocusStyle(field) {
    return focusedField === field
      ? { ...inputStyle, borderColor: "#FF5C00" }
      : inputStyle;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <Sidebar role="owner" activeLink="/post-listing" />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
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
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Province / district</label>
                <LocationSelect
                  province={form.province}
                  district={form.district}
                  onProvinceChange={(v) => setForm((f) => ({ ...f, province: v }))}
                  onDistrictChange={(v) => setForm((f) => ({ ...f, district: v }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Pickup location</label>
                <input
                  value={form.pickup}
                  onChange={update("pickup")}
                  onFocus={() => setFocusedField("pickup")}
                  onBlur={() => setFocusedField(null)}
                  style={getFocusStyle("pickup")}
                  placeholder="e.g. Chilanga Road near Total filling station"
                />
                <p style={{ fontSize: 12, color: "#555555", margin: "4px 0 0" }}>
                  Be specific so renters know where to collect.
                </p>
              </div>
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

          {formError && (
            <p style={{ fontSize: 13, color: "#DC2626", marginTop: 16, marginBottom: 0 }}>
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
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
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = "#CC4A00")}
            onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = "#FF5C00")}
          >
            {submitting ? "Posting..." : "Post Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}