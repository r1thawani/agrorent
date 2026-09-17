import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { CATEGORIES } from "../data/mockData";
import { equipmentService } from "../services/equipmentService";
import PhotoUpload from "../components/PhotoUpload";
import LocationSelect from "../components/LocationSelect";
import Sidebar from "../components/Sidebar";

const CONDITIONS = ["New", "Excellent", "Good", "Fair"];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eq, setEq] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    equipmentService.getById(id)
      .then((data) => {
        setEq(data);
        setForm({
          name: data.name,
          category: data.category,
          condition: data.condition,
          description: data.description || "",
          priceDay: String(data.price_day ?? ""),
          priceWeek: String(data.price_week ?? ""),
          pickup: data.pickup_address || "",
          province: data.province || "",
          district: data.district || "",
          availFrom: data.available_from || "",
          availUntil: data.available_until || "",
        });
        const existingPhotos = (data.equipment_photos || [])
          .slice().sort((a, b) => a.sort_order - b.sort_order)
          .map((p) => p.url);
        setPhotos(existingPhotos);
      })
      .catch(() => setLoadError("Could not load this listing."));
  }, [id]);

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
      await equipmentService.update(eq.id, {
        name: form.name,
        category: form.category,
        condition: form.condition,
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
      const newPhotos = photos.filter((p) => p.startsWith("data:"));
      for (let i = 0; i < newPhotos.length; i++) {
        const res = await fetch(newPhotos[i]);
        const blob = await res.blob();
        await equipmentService.uploadPhoto(eq.id, blob, `photo-${Date.now()}-${i}.jpg`);
      }
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-page pt-14 flex flex-col lg:flex-row">
        <Sidebar role="owner" activeLink="/my-listings" />
        <div className="flex-1 pt-[88px] text-center text-red">{loadError}</div>
      </div>
    );
  }

  if (!eq || !form) {
    return (
      <div className="min-h-screen bg-page pt-14 flex flex-col lg:flex-row">
        <Sidebar role="owner" activeLink="/my-listings" />
        <div className="flex-1 pt-[88px] text-center text-ink-muted">Loading…</div>
      </div>
    );
  }

  const sectionLabel = "text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted pb-2 border-b border-border mb-5";

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar role="owner" activeLink="/my-listings" />

        <div className="flex-1 min-w-0 max-w-[760px]">
          <h1 className="text-[22px] font-medium text-ink mb-7">Edit your listing</h1>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl p-8 border border-border/50">
              <div className={sectionLabel}>Basic information</div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-2">Equipment name</label>
                  <input value={form.name} onChange={update("name")}
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                    className={inputCls("name")} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-ink mb-2">Category</label>
                    <select value={form.category} onChange={update("category")}
                      onFocus={() => setFocusedField("category")} onBlur={() => setFocusedField(null)}
                      className={inputCls("category")}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-ink mb-2">Condition</label>
                    <select value={form.condition} onChange={update("condition")}
                      onFocus={() => setFocusedField("condition")} onBlur={() => setFocusedField(null)}
                      className={inputCls("condition")}>
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
                      className={`w-full px-3 py-2.5 text-sm text-ink rounded-lg outline-none resize-y min-h-[120px] ${
                        focusedField === "description" ? "border border-orange" : "border border-border/50"
                      }`} />
                    <span className="absolute bottom-2 right-2.5 text-[11px] text-ink-muted">
                      {form.description.length} / 1000
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${sectionLabel} mt-8`}>Pricing</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[["Price per day", "priceDay"], ["Price per week", "priceWeek"]].map(([lbl, field]) => (
                  <div key={field}>
                    <label className="block text-[13px] font-medium text-ink mb-2">{lbl}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">K</span>
                      <input type="number" value={form[field]} onChange={update(field)}
                        onFocus={() => setFocusedField(field)} onBlur={() => setFocusedField(null)}
                        className={`${inputCls(field)} pl-7`}
                        min="1" max={field === "priceDay" ? "100000" : "500000"}
                        required={field === "priceDay"} />
                    </div>
                  </div>
                ))}
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

            {showDelete && (
              <div className="mt-6 rounded-xl p-4 border border-red bg-red-tint">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={18} color="#A02020" className="shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[15px] font-medium text-red">Are you sure?</div>
                    <div className="text-[13px] text-red mt-0.5">
                      This will permanently delete this listing and cannot be undone.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button type="button" onClick={handleDelete} disabled={submitting}
                    className={`px-4 py-2 text-[13px] font-medium text-white bg-red rounded-lg border-none ${
                      submitting ? "opacity-70 cursor-default" : "cursor-pointer"
                    }`}>
                    {submitting ? "Deleting..." : "Yes, delete it"}
                  </button>
                  <button type="button" onClick={() => setShowDelete(false)}
                    className="px-4 py-2 text-[13px] text-ink-muted bg-white border border-border rounded-lg cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {formError && <p className="text-[13px] text-red mt-4">{formError}</p>}

            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={submitting}
                className={`flex-[0_0_70%] h-[52px] rounded-lg border-none text-white text-base font-medium bg-orange ${
                  submitting ? "opacity-70 cursor-default" : "cursor-pointer hover:bg-orange-dark"
                } transition-colors`}>
                {submitting ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => setShowDelete(true)}
                className="flex-[0_0_28%] h-[52px] rounded-lg border-none text-white text-sm font-medium bg-red cursor-pointer hover:bg-red/90 transition-colors">
                Delete listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
