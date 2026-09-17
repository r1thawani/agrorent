import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LocationSelect from "../components/LocationSelect";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import Avatar from "../components/Avatar";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    province: "Lusaka Province",
    district: "Lusaka",
  });
  const [bio, setBio] = useState(
    "Smallholder farmer in Lusaka Province with 10 years experience. Primarily grow maize and soya beans."
  );
  const [focusedField, setFocusedField] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  function inputCls(field) {
    return `w-full h-11 px-3 text-sm text-ink rounded-lg outline-none ${
      focusedField === field ? "border border-orange" : "border border-border/50"
    }`;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    if (!form.name.trim()) {
      setSaveError("Name cannot be empty.");
      return;
    }
    try {
      await updateProfile({ name: form.name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || "Could not save your changes. Please try again.");
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateProfile({ photo_url: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function getPasswordError(pw) {
    if (pw.length < 8) return "New password must be at least 8 characters.";
    if (!/[A-Z]/.test(pw)) return "New password must include at least one uppercase letter.";
    if (!/[a-z]/.test(pw)) return "New password must include at least one lowercase letter.";
    if (!/[0-9]/.test(pw)) return "New password must include at least one number.";
    return "";
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Please fill in all password fields.");
      return;
    }
    const pwStrengthError = getPasswordError(pwForm.next);
    if (pwStrengthError) { setPwError(pwStrengthError); return; }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New password and confirmation don't match.");
      return;
    }
    setPwError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(err.message || "Could not update your password. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar role={user?.role || "renter"} activeLink="/profile/edit" />

        <div className="flex-1 min-w-0 max-w-[560px]">
          <h1 className="text-[22px] font-medium text-ink mb-6">Edit profile</h1>

          <div className="flex flex-col items-center mb-7">
            <Avatar
              src={user?.photo_url || null}
              name={user?.name}
              className="w-24 h-24 text-2xl border-4 border-white shadow-sm"
            />
            <label className="mt-2 text-[13px] text-orange cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              Change photo
            </label>
          </div>

          <form onSubmit={handleSave}
            className="bg-white rounded-xl p-6 mb-6 border border-border/50">
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Full Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                  className={inputCls("name")} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                  className={inputCls("phone")} />
                <p className="text-[11px] text-ink-faint mt-1">Not saved yet — coming soon.</p>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Location</label>
                <LocationSelect
                  province={form.province}
                  district={form.district}
                  onProvinceChange={(v) => setForm((f) => ({ ...f, province: v }))}
                  onDistrictChange={(v) => setForm((f) => ({ ...f, district: v }))}
                  required
                />
                <p className="text-[11px] text-ink-faint mt-1">Not saved yet — coming soon.</p>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Short bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  onFocus={() => setFocusedField("bio")}
                  onBlur={() => setFocusedField(null)}
                  rows={4}
                  placeholder="Tell renters and owners a bit about yourself…"
                  className={`w-full px-3 py-2.5 text-sm text-ink rounded-lg outline-none resize-none ${
                    focusedField === "bio" ? "border border-orange" : "border border-border/50"
                  }`}
                />
                <div className="text-right text-[11px] text-ink-muted mt-1">{bio.length} / 200</div>
              </div>

              {saveError && <div className="text-[13px] text-red">{saveError}</div>}
              {saved && (
                <div className="text-[13px] text-green-dark bg-green-tint rounded-lg px-3 py-2">
                  Profile changes saved.
                </div>
              )}

              <button type="submit"
                className="w-full h-12 rounded-lg border-none text-white text-[15px] font-medium bg-orange cursor-pointer">
                Save changes
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordUpdate}
            className="bg-white rounded-xl p-6 mb-6 border border-border/50">
            <h2 className="text-[15px] font-medium text-ink mb-5">Change password</h2>
            <div className="flex flex-col gap-6">
              {[
                { label: "Current Password", field: "current" },
                { label: "New Password", field: "next" },
                { label: "Confirm New Password", field: "confirm" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-[13px] font-medium text-ink mb-2">{label}</label>
                  <input
                    type="password"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    className={inputCls(field)}
                  />
                </div>
              ))}

              {pwError && <div className="text-[13px] text-red">{pwError}</div>}
              {pwSaved && (
                <div className="text-[13px] text-green-dark bg-green-tint rounded-lg px-3 py-2">
                  Password updated.
                </div>
              )}

              <button type="submit"
                className="w-full h-11 rounded-lg text-sm font-medium bg-transparent border border-orange text-orange cursor-pointer">
                Update password
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl p-6 border border-border/50 border-l-[3px] border-l-red">
            <h2 className="text-[15px] font-medium text-red mb-2">Delete account</h2>
            <p className="text-[13px] text-ink-muted mb-4">
              Deleting your account is permanent. All your listings, bookings, and data will be removed.
            </p>

            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full h-11 rounded-lg text-sm font-medium bg-transparent border border-red text-red cursor-pointer">
                Delete my account
              </button>
            ) : (
              <div className="flex gap-2.5">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-11 rounded-lg text-sm font-medium bg-transparent border border-border-muted text-ink-muted cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => { logout(); navigate("/"); }}
                  className="flex-1 h-11 rounded-lg text-sm font-medium text-white bg-red border-none cursor-pointer">
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
