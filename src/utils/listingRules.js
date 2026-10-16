// Limits for listing fields, shared by PostListing.jsx and EditListing.jsx.
// The same limits are enforced in the database by
// migrations/002_listing_rules_deletion_and_emails.sql — change both together.

export const LISTING_LIMITS = {
  nameMin: 3,
  nameMax: 80,
  descriptionMin: 20,
  descriptionMax: 1000,
  pickupMin: 5,
  pickupMax: 150,
  priceDayMin: 50,
  priceDayMax: 50000,
  // A weekly rate only makes sense between one day's and seven days' price.
  weekMaxDays: 7,
  maxPhotos: 8,
  // Photos larger than this are refused before upload. Accepted photos are
  // shrunk in the browser (see utils/resizeImage.js) to well under the
  // storage bucket's 2 MB limit.
  maxPhotoMB: 10,
  photoTypes: ["image/jpeg", "image/png", "image/webp"],
  // How far ahead an availability window may end.
  maxAvailabilityYears: 2,
};

const L = LISTING_LIMITS;

function isWholeKwacha(n) {
  return Number.isInteger(n);
}

function fmt(n) {
  return `K${n.toLocaleString("en-US")}`;
}

// Returns the first problem with the form as a plain-language message,
// or "" if everything is valid. `today` is a YYYY-MM-DD string.
export function validateListing(form, { today, photoCount }) {
  const name = form.name.trim();
  const description = form.description.trim();
  const pickup = form.pickup.trim();

  if (!name || !form.category || !form.priceDay || !pickup) {
    return "Please fill in the equipment name, category, daily price, and pickup location.";
  }
  if (name.length < L.nameMin || name.length > L.nameMax) {
    return `Equipment name must be between ${L.nameMin} and ${L.nameMax} characters.`;
  }
  if (description.length < L.descriptionMin) {
    return `Please add a description of at least ${L.descriptionMin} characters.`;
  }
  if (description.length > L.descriptionMax) {
    return `Description can be at most ${L.descriptionMax} characters.`;
  }
  if (!form.province || !form.district) {
    return "Please select the province and district for this listing.";
  }
  if (pickup.length < L.pickupMin || pickup.length > L.pickupMax) {
    return `Pickup location must be between ${L.pickupMin} and ${L.pickupMax} characters.`;
  }

  const priceDay = Number(form.priceDay);
  if (!isWholeKwacha(priceDay)) {
    return "Daily price must be a whole number of Kwacha.";
  }
  if (priceDay < L.priceDayMin || priceDay > L.priceDayMax) {
    return `Daily price must be between ${fmt(L.priceDayMin)} and ${fmt(L.priceDayMax)}.`;
  }

  if (form.priceWeek !== "" && form.priceWeek != null) {
    const priceWeek = Number(form.priceWeek);
    const weekMax = priceDay * L.weekMaxDays;
    if (!isWholeKwacha(priceWeek)) {
      return "Weekly price must be a whole number of Kwacha.";
    }
    if (priceWeek < priceDay || priceWeek > weekMax) {
      return `Weekly price must be between one day's price (${fmt(priceDay)}) and ${L.weekMaxDays} days' price (${fmt(weekMax)}).`;
    }
  }

  const latest = maxAvailabilityDate(today);
  if (form.availFrom && form.availFrom < today) {
    return "Available from date can't be in the past.";
  }
  if (form.availUntil && form.availUntil < today) {
    return "Available until date can't be in the past.";
  }
  if (form.availFrom && form.availUntil && form.availUntil < form.availFrom) {
    return "Available until date can't be before the available from date.";
  }
  if ((form.availFrom && form.availFrom > latest) || (form.availUntil && form.availUntil > latest)) {
    return `Availability dates can be at most ${L.maxAvailabilityYears} years ahead.`;
  }

  if (photoCount < 1) {
    return "Please add at least one photo so renters can see the equipment.";
  }
  if (photoCount > L.maxPhotos) {
    return `A listing can have at most ${L.maxPhotos} photos.`;
  }
  return "";
}

// YYYY-MM-DD, `maxAvailabilityYears` after `today`.
export function maxAvailabilityDate(today) {
  const [y, m, d] = today.split("-");
  return `${Number(y) + L.maxAvailabilityYears}-${m}-${d}`;
}

// Checks one chosen photo file before it is read. Returns "" if it is fine.
export function checkPhotoFile(file) {
  if (!L.photoTypes.includes(file.type)) {
    return `"${file.name}" isn't a JPG, PNG or WebP photo.`;
  }
  if (file.size > L.maxPhotoMB * 1024 * 1024) {
    return `"${file.name}" is larger than ${L.maxPhotoMB} MB.`;
  }
  return "";
}
