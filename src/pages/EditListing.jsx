import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { EQUIPMENT, CATEGORIES } from "../data/mockData";
import { equipmentService } from "../services/equipmentService";
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

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fall back to first item if id not matched (handles stale mock links)
  const eq = EQUIPMENT.find((e) => e.id === id) ?? EQUIPMENT[0];

  const [form, setForm] = useState({
    name: eq.name,
    category: eq.category,
    condition: eq.condition,
    description: eq.description,
    priceDay: String(eq.priceDay),
    priceWeek: String(eq.priceWeek ?? ""),
    pickup: eq.pickup,
    availFrom: eq.available?.from ?? "",
    availUntil: eq.available?.until ?? "",
  });

  // Seed photo state from existing thumbnails if present
  const [photos, setPhotos] = useState(eq.thumbnails ?? (eq.image ? [eq.image] : []));
  const [focusedField, setFocusedField] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.category || !form.priceDay || !form.pickup) {
      setFormError("Please fill in the equipment name, category, daily price, and pickup location.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await equipmentService.update(eq.id, {
        name: form.name,
        category: form.category,
        condition: form.condition,
        description: form.description,
        priceDay: Number(form.priceDay) || 0,
        priceWeek: Number(form.priceWeek) || 0,
        location: form.pickup,
        pickup: form.pickup,
        available: { from: form.availFrom, until: form.availUntil },
        image: photos[0] ?? eq.image,
        thumbnails: photos.length ? photos : eq.thumbnails,
      });
      navigate("/my-listings");
    } catch {
      setFormError("Something went wrong saving your changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await equipmentService.remove(eq.id);
      navigate("/my-listings");
    } catch {
      setFormError("Something went wrong deleting this listing. Please try again.");
      setSubmitting(false);
    }
  }

  function getFocusStyle(field) {
    return focusedField === field
      ? { ...inputStyle, borderColor: "#FF5C00" }
      : inputStyle;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F0" }}>
      <Sidebar role="owner" activeLink="/my-listings" />

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
          Edit your listing
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
                  >
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
                  >
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Price per day", "priceDay"],
                ["Price per week", "priceWeek"],
              ].map(([lbl, field]) => (
                <div key={field}>
                  <label style={labelStyle}>{lbl}</label>
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
                      value={form[field]}
                      onChange={update(field)}
                      onFocus={() => setFocusedField(field)}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...getFocusStyle(field), paddingLeft: 28 }}
                      min="0"
                    />
                  </div>
                </div>
              ))}
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

          {/* Delete confirmation panel */}
          {showDelete && (
            <div
              style={{
                marginTop: 24,
                borderRadius: 12,
                padding: 16,
                border: "1.5px solid #DC2626",
                backgroundColor: "#FDECEA",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={18} color="#A02020" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#A02020" }}>
                    Are you sure?
                  </div>
                  <div style={{ fontSize: 13, color: "#A02020", marginTop: 2 }}>
                    This will permanently delete this listing and cannot be undone.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#fff",
                    backgroundColor: "#DC2626",
                    border: "none",
                    borderRadius: 8,
                    cursor: submitting ? "default" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Deleting..." : "Yes, delete it"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  style={{
                    padding: "8px 16px",
                    fontSize: 13,
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
            </div>
          )}

          {formError && (
            <p style={{ fontSize: 13, color: "#DC2626", marginTop: 16, marginBottom: 0 }}>
              {formError}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: "0 0 70%",
                height: 52,
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
              {submitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              style={{
                flex: "0 0 28%",
                height: 52,
                backgroundColor: "#DC2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#B91C1C")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#DC2626")}
            >
              Delete listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
