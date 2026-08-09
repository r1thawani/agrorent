import { mockDelay } from "./api";
import { EQUIPMENT, CATEGORIES, ZAMBIAN_PROVINCES } from "../data/mockData";

// Mock service backing Listings.jsx / ListingDetail.jsx / PostListing.jsx /
// MyListings.jsx. Reads from mockData now; once a backend exists, replace
// the bodies with `api.get("/equipment")` etc. — callers already treat
// these as async, so no page needs to change.
export const equipmentService = {
  async getAll(filters = {}) {
    await mockDelay();
    let results = [...EQUIPMENT];
    if (filters.category) results = results.filter((e) => e.category === filters.category);
    if (filters.location) results = results.filter((e) => e.location.includes(filters.location));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((e) => e.name.toLowerCase().includes(q));
    }
    return results;
  },

  async getById(id) {
    await mockDelay();
    const eq = EQUIPMENT.find((e) => e.id === id);
    if (!eq) throw new Error(`Equipment ${id} not found`);
    return eq;
  },

  async getCategories() {
    await mockDelay(100);
    return CATEGORIES;
  },

  async getProvinces() {
    await mockDelay(100);
    return ZAMBIAN_PROVINCES;
  },

  async create(listing) {
    await mockDelay();
    // No backend yet, so "persist" means push into the in-memory EQUIPMENT
    // array. It's the same array every page reads via getAll()/getById(),
    // so a new listing is visible everywhere immediately, and it survives
    // client-side navigation (only a full reload resets it).
    const newItem = {
      rating: 0,
      reviews: 0,
      listed: "Just now",
      ...listing,
      id: `${Date.now()}`,
    };
    EQUIPMENT.unshift(newItem);
    return newItem;
  },

  async update(id, changes) {
    await mockDelay();
    const index = EQUIPMENT.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Equipment ${id} not found`);
    EQUIPMENT[index] = { ...EQUIPMENT[index], ...changes };
    return EQUIPMENT[index];
  },

  async remove(id) {
    await mockDelay();
    const index = EQUIPMENT.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Equipment ${id} not found`);
    EQUIPMENT.splice(index, 1);
    return { id, deleted: true };
  },
};
