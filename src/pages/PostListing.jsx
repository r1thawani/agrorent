import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/mockData";
import { equipmentService } from "../services/equipmentService";
import { useAuth } from "../hooks/useAuth";
import PhotoUpload from "../components/PhotoUpload";
import LocationSelect from "../components/LocationSelect";
import Sidebar from "../components/Sidebar";

const CONDITIONS = ["New", "Excellent", "Good", "Fair"];

export default function PostListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "", category: "", condition: "", description: "",
    priceDay: "", priceWeek: "", pickup: "",
    province: "", district: "", availFrom: "", availUntil: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function inputCls(field) {
    return `w-full h-11 px-3 text-sm text-ink rounded-lg outline-none bg-white ${
      focusedField === field ? "border border-orange" : "border border-border/50"
    }`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.priceDay || !form.pickup.trim()) {
      setFormError("Please fill in the equipment name, category, daily price, and pickup location.");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      setFormError("Please add a description of at least 20 characters.");
      return;
    }
    if (!form.province || !form.district) {
      setFormError("Please select the province and district for this listing.");
      return;
    }
    const priceDay = Number(form.priceDay);
    if (!priceDay || priceDay < 1) {
      setFormError("Daily price must be at least K1.");
      return;
    }
    if (priceDay > 100000) {
      setFormError("Daily price cannot exceed K100,000.");
      return;
    }
    if (form.priceWeek) {
      const priceWeek = Number(form.priceWeek);
      if (priceWeek < 1 || priceWeek > 500000) {
        setFormError("Weekly price must be between K1 and K500,000.");
        return;
      }
    }
    if (form.availFrom && form.availFrom < today) {
      setFormError("Available from date can't be in the past.");
      return;
    }
    if (form.availUntil && form.availUntil < today) {
      setFormError("Available until date can't be in the past.");
      return;
    }
    if (form.availFrom && form.availUntil && form.availUntil < form.availFrom) {
      setFormError("Available until date can't be before the available from date.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const existing = await equipmentService.getMine(user.id);
      const duplicate = existing.find(
        (e) => e.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (duplicate) {
        setFormError(`You already have a listing called "${form.name.trim()}". Please use a different name or edit the existing listing.`);
        setSubmitting(false);
        return;
      }
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
      for (let i = 0; i < photos.length; i++) {
        const res = await fetch(photos[i]);
        const blob = await res.blob();
        await equipmentService.uploadPhoto(created.id, blob, `photo-${i}.jpg`);
      }
      navigate("/my-listings");
    } catch {
      setFormError("Something went wrong posting your listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sectionLabel = "text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted pb-2 border-b border-border mb-5";

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar activeLink="/post-listing" />

        <div className="flex-1 min-w-0 max-w-[760px]">
          <h1 className="text-[22px] font-medium text-ink mb-7">Post your equipment</h1>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl p-8 border border-border/50">
              <div className={sectionLabel}>Basic information</div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-2">Equipment name</label>
                  <input value={form.name} onChange={update("name")}
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                    className={inputCls("name")}
                    placeholder="e.g. John Deere 5075E Tractor" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-ink mb-2">Category</label>
                    <select value={form.category} onChange={update("category")}
                      onFocus={() => setFocusedField("category")} onBlur={() => setFocusedField(null)}
                      className={inputCls("category")} required>
                      <option value="">Select…</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-ink mb-2">Condition</label>
                    <select value={form.condition} onChange={update("condition")}
                      onFocus={() => setFocusedField("condition")} onBlur={() => setFocusedField(null)}
                      className={inputCls("condition")} required>
                      <option value="">Select…</option>
                      {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-ink mb-2">Description</label>
                  <div className="relative">
                    <textarea value={form.description} onChange={update("description")}
                      onFocus={() => setFocusedField("description")} onBlur={() => setFocusedField(null)}
                      maxLength={1000} rows={5}
                      placeholder="Describe your equipment — age, brand, features, any important notes for renters…"
                      className={`w-full px-3 py-2.5 text-sm text-ink rounded-lg outline-none resize-y min-h-[120px] ${
                        focusedField === "description" ? "border border-orange" : "border border-border/50"
                      }`}
                    />
                    <span className="absolute bottom-2 right-2.5 text-[11px] text-ink-muted">
                      {form.description.length} / 1000
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${sectionLabel} mt-8`}>Pricing</div>
              <div className="flex flex-col gap-6">
                <div className="max-w-[50%]">
                  <label className="block text-[13px] font-medium text-ink mb-2">Price per day</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">K</span>
                    <input type="number" value={form.priceDay} onChange={update("priceDay")}
                      onFocus={() => setFocusedField("priceDay")} onBlur={() => setFocusedField(null)}
                      className={`${inputCls("priceDay")} pl-7`} min="1" max="100000" required />
                  </div>
                </div>
                <div className="max-w-[50%]">
                  <label className="block text-[13px] font-medium text-ink mb-2">Price per week (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">K</span>
                    <input type="number" value={form.priceWeek} onChange={update("priceWeek")}
                      onFocus={() => setFocusedField("priceWeek")} onBlur={() => setFocusedField(null)}
                      className={`${inputCls("priceWeek")} pl-7`} min="1" max="500000" />
                  </div>
                  <p className="text-xs text-ink-muted mt-1">Leave blank if you only rent daily.</p>
                </div>
              </div>

              <div className={`${sectionLabel} mt-8`}>Location</div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-2">Province / district</label>
                  <LocationSelect
                    province={form.province} district={form.district}
                    onProvinceChange={(v) => setForm((f) => ({ ...f, province: v }))}
                    onDistrictChange={(v) => setForm((f) => ({ ...f, district: v }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-2">Pickup location</label>
                  <input value={form.pickup} onChange={update("pickup")}
                    onFocus={() => setFocusedField("pickup")} onBlur={() => setFocusedField(null)}
                    className={inputCls("pickup")}
                    placeholder="e.g. Chilanga Road near Total filling station" required />
                  <p className="text-xs text-ink-muted mt-1">Be specific so renters know where to collect.</p>
                </div>
              </div>

              <div className={`${sectionLabel} mt-8`}>Availability</div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[13px] font-medium text-ink mb-2">Available from</label>
                  <input type="date" value={form.availFrom} min={today} onChange={update("availFrom")}
                    onFocus={() => setFocusedField("availFrom")} onBlur={() => setFocusedField(null)}
                    className={inputCls("availFrom")} />
                </div>
                <span className="text-sm text-ink-muted pb-3">to</span>
                <div className="flex-1">
                  <label className="block text-[13px] font-medium text-ink mb-2">Available until</label>
                  <input type="date" value={form.availUntil} min={form.availFrom || today} onChange={update("availUntil")}
                    onFocus={() => setFocusedField("availUntil")} onBlur={() => setFocusedField(null)}
                    className={inputCls("availUntil")} />
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-1">You can update availability at any time from your listings.</p>

              <div className={`${sectionLabel} mt-8`}>Photos</div>
              <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={10} />
            </div>

            {formError && (
              <p className="text-[13px] text-red mt-4">{formError}</p>
            )}

            <button type="submit" disabled={submitting}
              className={`w-full h-[52px] mt-6 rounded-lg border-none text-white text-base font-medium bg-orange ${
                submitting ? "opacity-70 cursor-default" : "cursor-pointer hover:bg-orange-dark"
              } transition-colors`}>
              {submitting ? "Posting..." : "Post Listing"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
