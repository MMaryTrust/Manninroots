import { describe, expect, it } from "vitest";
import { computeTotals, restaurantIdsOf, tryAdd, type CartLine } from "@/lib/cart";
import { searchDishes } from "@/lib/data";

describe("cart rules", () => {
  it("refuses a 4th restaurant and keeps existing items", () => {
    const lines: CartLine[] = [{ dishId: "r1-d1", qty: 1 }, { dishId: "r2-d1", qty: 1 }, { dishId: "r3-d1", qty: 1 }];
    const r = tryAdd(lines, "r4-d1");
    expect(r.result.ok).toBe(false);
    expect(r.lines).toEqual(lines);
  });
  it("allows 3 restaurants", () => {
    const r = tryAdd([{ dishId: "r1-d1", qty: 1 }, { dishId: "r2-d1", qty: 1 }], "r3-d1");
    expect(restaurantIdsOf(r.lines)).toHaveLength(3);
  });
  it("charges delivery per restaurant plus platform fee", () => {
    const t = computeTotals([{ dishId: "r1-d1", qty: 2 }, { dishId: "r2-d1", qty: 1 }]);
    expect(t.food).toBe(1450 * 2 + 1900);
    expect(t.delivery).toBe(499 + 599);
    expect(t.total).toBe(t.food + t.delivery + 99);
  });
});

describe("search", () => {
  it("kothu, kottu and கொத்து find the same dishes", () => {
    const ids = (q: string) => searchDishes(q).map((d) => d.id).sort();
    expect(ids("kothu").length).toBeGreaterThan(0);
    expect(ids("kottu")).toEqual(ids("kothu"));
    expect(ids("கொத்து")).toEqual(ids("kothu"));
  });
});
