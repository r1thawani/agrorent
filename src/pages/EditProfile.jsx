import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ZAMBIAN_PROVINCES } from "../data/mockData";
import { useAuth } from "../hooks/useAuth";

function getFocusStyle(field, focusedField) {
  return {
    width: "100%",
    height: "44px",
    padding: "0 12px",
    fontSize: "14px",
    borderRadius: "8px",
    outline: "none",
    border: focusedField === field ? "1px solid #FF5C00" : "0.5px solid #E0E8E3",
  };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    location: "Lusaka Province",
  });
  const [bio, setBio] = useState(
    "Smallholder farmer in Lusaka Province with 10 years experience. Primarily grow maize and soya beans."
  );
  const [focusedField, setFocusedField] = useState(null);
  const [saved, setSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    // Actually persist to the logged-in user in AuthContext — previously
    // this just flashed a fake "saved" message without changing anything,
    // so the Sidebar/Dashboard kept showing the old hardcoded name.
    updateProfile({ name: form.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handlePasswordUpdate(e) {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New password and confirmation don't match.");
      return;
    }
    setPwError("");
    setPwSaved(true);
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 2500);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "24px" }}>
        <Sidebar role={user?.role || "renter"} activeLink="/profile/edit" />

        <div style={{ flex: 1, minWidth: 0, maxWidth: "560px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "24px" }}>
            Edit profile
          </h1>

          {/* Photo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
            <img
              src={user?.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=192&h=192&fit=crop"}
              alt="Profile"
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "9999px",
                objectFit: "cover",
                border: "4px solid #FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
            <label style={{ marginTop: "8px", fontSize: "13px", color: "#FF5C00", cursor: "pointer" }}>
              <input type="file" accept="image/*" style={{ display: "none" }} />
              Change photo
            </label>
          </div>

          {/* Profile info */}
          <form
            onSubmit={handleSave}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              border: "0.5px solid #E0E8E3",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  style={getFocusStyle("name", focusedField)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  style={getFocusStyle("phone", focusedField)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Location
                </label>
                <select
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  onFocus={() => setFocusedField("location")}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...getFocusStyle("location", focusedField), backgroundColor: "#FFFFFF" }}
                >
                  {ZAMBIAN_PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Short bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  onFocus={() => setFocusedField("bio")}
                  onBlur={() => setFocusedField(null)}
                  rows={4}
                  placeholder="Tell renters and owners a bit about yourself…"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    outline: "none",
                    resize: "none",
                    border: focusedField === "bio" ? "1px solid #FF5C00" : "0.5px solid #E0E8E3",
                  }}
                />
                <div style={{ textAlign: "right", fontSize: "11px", color: "#555555", marginTop: "4px" }}>
                  {bio.length} / 200
                </div>
              </div>

              {saved && (
                <div style={{ fontSize: "13px", color: "#0F3D1E", backgroundColor: "#D4EDDA", borderRadius: "8px", padding: "8px 12px" }}>
                  Profile changes saved.
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "8px",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 500,
                  backgroundColor: "#FF5C00",
                  cursor: "pointer",
                }}
              >
                Save changes
              </button>
            </div>
          </form>

          {/* Change password */}
          <form
            onSubmit={handlePasswordUpdate}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              border: "0.5px solid #E0E8E3",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
              Change password
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Current Password", field: "current" },
                { label: "New Password", field: "next" },
                { label: "Confirm New Password", field: "confirm" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                    {label}
                  </label>
                  <input
                    type="password"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    style={getFocusStyle(field, focusedField)}
                  />
                </div>
              ))}

              {pwError && <div style={{ fontSize: "13px", color: "#A02020" }}>{pwError}</div>}
              {pwSaved && (
                <div style={{ fontSize: "13px", color: "#0F3D1E", backgroundColor: "#D4EDDA", borderRadius: "8px", padding: "8px 12px" }}>
                  Password updated.
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: "transparent",
                  border: "1.5px solid #FF5C00",
                  color: "#FF5C00",
                  cursor: "pointer",
                }}
              >
                Update password
              </button>
            </div>
          </form>

          {/* Danger zone */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              border: "0.5px solid #E0E8E3",
              borderLeft: "3px solid #DC2626",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#DC2626", marginBottom: "8px" }}>
              Delete account
            </h2>
            <p style={{ fontSize: "13px", color: "#555555", marginBottom: "16px" }}>
              Deleting your account is permanent. All your listings, bookings, and data will be removed.
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: "transparent",
                  border: "1.5px solid #DC2626",
                  color: "#DC2626",
                  cursor: "pointer",
                }}
              >
                Delete my account
              </button>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    backgroundColor: "transparent",
                    border: "0.5px solid #CCCCCC",
                    color: "#555555",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // No backend to actually delete an account on, but this
                    // should at least end the session — previously this
                    // button had no onClick at all and did nothing.
                    logout();
                    navigate("/");
                  }}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    backgroundColor: "#DC2626",
                    border: "none",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  Confirm delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
