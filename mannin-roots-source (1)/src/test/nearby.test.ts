import { describe, it, expect } from "vitest";
import { HOME_POINT, nearbyRestaurants } from "@/lib/data";
describe("nearby kitchens", () => {
  it("shows only open kitchens within 100 km, enrolled and not", () => {
    const r = nearbyRestaurants(HOME_POINT, 100);
    expect(r.every((x) => x.open && x.distanceKm <= 100)).toBe(true);
    expect(r.some((x) => !x.enrolled)).toBe(true);
    expect(r.find((x) => x.slug === "thanjavur-kitchen")).toBeUndefined(); // closed
    expect(r.find((x) => x.slug === "nellai-virundhu")).toBeUndefined(); // ~130 km
  });
  it("250 km adds farther open kitchens", () => {
    expect(nearbyRestaurants(HOME_POINT, 250).some((x) => x.slug === "nellai-virundhu")).toBe(true);
  });
});
import { DEFAULT_RADIUS, RADIUS_OPTIONS } from "@/lib/location";
describe("distance options", () => {
  it("defaults to 30 km with 30/100/250 options", () => {
    expect(DEFAULT_RADIUS).toBe(30);
    expect(RADIUS_OPTIONS).toEqual([30, 100, 250]);
  });
});
import { cravingDishes, kitchenScore, restaurantsInPlace, topKitchens, restaurants } from "@/lib/data";
describe("ratings and lists", () => {
  it("kitchen score combines customer and system rating, or uses whichever exists", () => {
    expect(kitchenScore({ rating: 4.6, systemScore: 4.8 })).toBeCloseTo(4.7);
    expect(kitchenScore({ rating: 4.3, systemScore: 0 })).toBe(4.3);
  });
  it("kitchens near you shows at most 15, best score first", () => {
    const list = topKitchens(nearbyRestaurants(HOME_POINT, 30), 15);
    expect(list.length).toBe(15);
    for (let i = 1; i < list.length; i++) expect(kitchenScore(list[i - 1]!)).toBeGreaterThanOrEqual(kitchenScore(list[i]!));
  });
  it("craving shows 12 dishes", () => {
    expect(cravingDishes(new Set(restaurants.map((r) => r.id)), 12).length).toBe(12);
  });
  it("searching a district lists all its kitchens", () => {
    const names = restaurantsInPlace("Parramatta").map((r) => r.slug);
    expect(names).toEqual(expect.arrayContaining(["kumars-kitchen", "amma-veedu", "idli-corner"]));
  });
});
