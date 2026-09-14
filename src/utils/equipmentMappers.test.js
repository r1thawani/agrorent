import { describe, expect, it } from "vitest";
import { primaryPhotoUrl, photoUrls, toEquipmentCardProps } from "./equipmentMappers";

const rowWithPhotos = {
  id: "eq1",
  name: "John Deere 5075E Tractor",
  category: "Tractors",
  price_day: 500,
  location: "Chilanga, Lusaka Province",
  rating: 4.5,
  review_count: 12,
  equipment_photos: [
    { url: "https://example.com/second.jpg", sort_order: 1 },
    { url: "https://example.com/first.jpg", sort_order: 0 },
  ],
};

describe("primaryPhotoUrl", () => {
  it("returns the photo with the lowest sort_order, not insertion order", () => {
    expect(primaryPhotoUrl(rowWithPhotos)).toBe("https://example.com/first.jpg");
  });

  it("returns an empty string when there are no photos", () => {
    expect(primaryPhotoUrl({ equipment_photos: [] })).toBe("");
  });

  it("returns an empty string when equipment_photos is missing entirely", () => {
    expect(primaryPhotoUrl({})).toBe("");
    expect(primaryPhotoUrl(null)).toBe("");
  });
});

describe("photoUrls", () => {
  it("returns every photo URL ordered by sort_order", () => {
    expect(photoUrls(rowWithPhotos)).toEqual([
      "https://example.com/first.jpg",
      "https://example.com/second.jpg",
    ]);
  });

  it("returns an empty array when there are no photos", () => {
    expect(photoUrls({ equipment_photos: [] })).toEqual([]);
  });

  it("does not mutate the row's original photos array", () => {
    const row = { equipment_photos: [{ url: "b", sort_order: 1 }, { url: "a", sort_order: 0 }] };
    const original = [...row.equipment_photos];
    photoUrls(row);
    expect(row.equipment_photos).toEqual(original);
  });
});

describe("toEquipmentCardProps", () => {
  it("maps a Supabase equipment row to the flat props EquipmentCard expects", () => {
    expect(toEquipmentCardProps(rowWithPhotos)).toEqual({
      id: "eq1",
      name: "John Deere 5075E Tractor",
      category: "Tractors",
      priceDay: 500,
      location: "Chilanga, Lusaka Province",
      rating: 4.5,
      reviews: 12,
      image: "https://example.com/first.jpg",
    });
  });

  it("gives image: '' instead of undefined when the listing has no photos", () => {
    const { image } = toEquipmentCardProps({ ...rowWithPhotos, equipment_photos: [] });
    expect(image).toBe("");
  });
});
