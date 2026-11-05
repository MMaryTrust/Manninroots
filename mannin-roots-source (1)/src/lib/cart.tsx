import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { COUNTRY, getDish, getRestaurant } from "./data";

export const MAX_RESTAURANTS = 3;
export type CartLine = { dishId: string; qty: number };
type AddResult = { ok: true } | { ok: false; reason: "limit"; restaurantId: string };

type Ctx = {
  lines: CartLine[];
  add: (dishId: string) => AddResult;
  setQty: (dishId: string, qty: number) => void;
  replaceRestaurant: (oldRid: string, dishId: string) => void;
  restaurantIds: string[];
  count: number;
  totals: ReturnType<typeof computeTotals>;
};

export function restaurantIdsOf(lines: CartLine[]) {
  return [...new Set(lines.map((l) => getDish(l.dishId)?.restaurantId).filter(Boolean) as string[])];
}

export function computeTotals(lines: CartLine[]) {
  const food = lines.reduce((s, l) => s + (getDish(l.dishId)?.price ?? 0) * l.qty, 0);
  const rids = restaurantIdsOf(lines);
  const delivery = rids.reduce((s, r) => s + (getRestaurant(r)?.deliveryFee ?? 0), 0);
  const platform = lines.length ? COUNTRY.platformFee : 0;
  const total = food + delivery + platform;
  const gstIncluded = Math.round(total - total / (1 + COUNTRY.gstRate));
  return { food, delivery, platform, total, gstIncluded };
}

/** Adding a dish from a 4th restaurant is refused; existing items are never removed. */
export function tryAdd(lines: CartLine[], dishId: string): { lines: CartLine[]; result: AddResult } {
  const dish = getDish(dishId);
  if (!dish) return { lines, result: { ok: true } };
  const rids = restaurantIdsOf(lines);
  if (!rids.includes(dish.restaurantId) && rids.length >= MAX_RESTAURANTS)
    return { lines, result: { ok: false, reason: "limit", restaurantId: dish.restaurantId } };
  const existing = lines.find((l) => l.dishId === dishId);
  const next = existing
    ? lines.map((l) => (l.dishId === dishId ? { ...l, qty: l.qty + 1 } : l))
    : [...lines, { dishId, qty: 1 }];
  return { lines: next, result: { ok: true } };
}

const gc = globalThis as { __mrCartCtx?: React.Context<Ctx | null> };
const CartContext = (gc.__mrCartCtx ??= createContext<Ctx | null>(null));

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem("mr-cart") || "[]")); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem("mr-cart", JSON.stringify(lines)); }, [lines, loaded]);

  const add = (dishId: string) => {
    const r = tryAdd(lines, dishId);
    setLines(r.lines);
    return r.result;
  };
  const setQty = (dishId: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.dishId !== dishId) : ls.map((l) => (l.dishId === dishId ? { ...l, qty } : l))));
  const replaceRestaurant = (oldRid: string, dishId: string) =>
    setLines((ls) => tryAdd(ls.filter((l) => getDish(l.dishId)?.restaurantId !== oldRid), dishId).lines);

  return (
    <CartContext.Provider value={{
      lines, add, setQty, replaceRestaurant,
      restaurantIds: restaurantIdsOf(lines),
      count: lines.reduce((s, l) => s + l.qty, 0),
      totals: computeTotals(lines),
    }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
