import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LocationSelect from "../components/LocationSelect";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import { formatPhoneInput, isValidPhone } from "../utils/phone";
import { friendlyError } from "../utils/friendlyError";
import { getPasswordError, PASSWORD_HINT } from "../utils/password";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "+260",
    province: user?.province || "",
    district: user?.district || "",
  });
  const [bio, setBio] = useState(user?.bio || "");
  const [focusedField, setFocusedField] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    // "+260" alone means the field was left empty.
    const phone = form.phone === "+260" ? null : form.phone;
    if (phone && !isValidPhone(phone)) {
      setSaveError("Please enter your phone number in the format +260XXXXXXXXX.");
      return;
    }
    try {
      const details = {};
      if (phone !== (user.phone || null)) details.phone = phone;
      if (form.province !== (user.province || "")) details.province = form.province || null;
      if (form.district !== (user.district || "")) details.district = form.district || null;
      if (Object.keys(details).length) await updateProfile(details);
      // Saved separately so a name edit still works even if the bio column
      // hasn't been added to the database yet.
      if (form.name.trim() !== user.name) {
        await updateProfile({ name: form.name.trim() });
      }
      if (bio.trim() !== (user.bio || "")) {
        try {
          await updateProfile({ bio: bio.trim() });
        } catch (err) {
          if (/bio/i.test(err.message || "")) {
            throw new Error("Your bio couldn't be saved yet — the database needs a one-time update. Please tell the site admin.");
          }
          throw err;
        }
      }
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
    reader.onload = (ev) =>
      updateProfile({ photo_url: ev.target.result }).catch((err) =>
        setSaveError(err.message || "Could not update your photo. Please try again.")
      );
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function cancelDelete() {
    setConfirmDelete(false);
    setDeletePassword("");
    setDeleteError("");
  }

  async function handleDelete(e) {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      navigate("/account-deleted", { replace: true });
    } catch (err) {
      setDeleteError(friendlyError(err, "We couldn't delete your account. Please try again."));
      setDeleting(false);
    }
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
    if (pwForm.next === pwForm.current) {
      setPwError("Your new password must be different from your current one.");
      return;
    }
    setPwError("");
    setPwSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(friendlyError(err, "Could not update your password. Please try again."));
    } finally {
      setPwSaving(false);
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
                <input type="tel" value={form.phone} placeholder="+260XXXXXXXXX"
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }))}
                  onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                  className={inputCls("phone")} />
                <p className="text-[11px] text-ink-muted mt-1">
                  Private. Only shared with the other person on a booking once the deposit is paid, so you can arrange pickup.
                </p>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Location</label>
                <LocationSelect
                  province={form.province}
                  district={form.district}
                  onProvinceChange={(v) => setForm((f) => ({ ...f, province: v }))}
                  onDistrictChange={(v) => setForm((f) => ({ ...f, district: v }))}
                />
                <p className="text-[11px] text-ink-muted mt-1">Shown on your public profile.</p>
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
                { label: "Current Password", field: "current", autoComplete: "current-password" },
                { label: "New Password", field: "next", autoComplete: "new-password", hint: PASSWORD_HINT },
                { label: "Confirm New Password", field: "confirm", autoComplete: "new-password" },
              ].map(({ label, field, autoComplete, hint }) => (
                <div key={field}>
                  <label className="block text-[13px] font-medium text-ink mb-2">{label}</label>
                  <input
                    type="password"
                    autoComplete={autoComplete}
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    className={inputCls(field)}
                  />
                  {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
                </div>
              ))}

              {pwError && <div className="text-[13px] text-red">{pwError}</div>}
              {pwSaved && (
                <div className="text-[13px] text-green-dark bg-green-tint rounded-lg px-3 py-2">
                  Password updated.
                </div>
              )}

              <button type="submit" disabled={pwSaving}
                className="w-full h-11 rounded-lg text-sm font-medium bg-transparent border border-orange text-orange cursor-pointer disabled:opacity-60">
                {pwSaving ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl p-6 border border-border/50 border-l-[3px] border-l-red">
            <h2 className="text-[15px] font-medium text-red mb-2">Delete account</h2>
            <p className="text-[13px] text-ink-muted mb-2">
              This permanently deletes your account. Your profile, phone number and listings are removed, any
              requests you haven't paid for are withdrawn, and you won't be able to log in again.
            </p>
            <p className="text-[13px] text-ink-muted mb-4">
              Bookings and messages you shared with other people stay in their history, shown as
              "Deleted user". You can't delete your account while a paid booking hasn't finished.
            </p>

            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full h-11 rounded-lg text-sm font-medium bg-transparent border border-red text-red cursor-pointer">
                Delete my account
              </button>
            ) : (
              <form onSubmit={handleDelete} className="flex flex-col gap-3">
                <label className="text-[13px] text-ink" htmlFor="delete-password">
                  Enter your password to confirm
                </label>
                <input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onFocus={() => setFocusedField("deletePassword")}
                  onBlur={() => setFocusedField(null)}
                  className={inputCls("deletePassword")}
                />
                {deleteError && (
                  <div className="text-[13px] text-red bg-red-tint rounded-lg px-3 py-2">{deleteError}</div>
                )}
                <div className="flex gap-2.5">
                  <button type="button" onClick={cancelDelete} disabled={deleting}
                    className="flex-1 h-11 rounded-lg text-sm font-medium bg-transparent border border-border-muted text-ink-muted cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={deleting}
                    className="flex-1 h-11 rounded-lg text-sm font-medium text-white bg-red border-none cursor-pointer disabled:opacity-60">
                    {deleting ? "Deleting…" : "Delete permanently"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
