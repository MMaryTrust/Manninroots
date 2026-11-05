import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, DishCard, RestaurantChip, SearchBox, useAddToCart } from "@/components/roots";
import { RadiusPrompt, useUserLocation } from "@/lib/location";
import { useI18n } from "@/lib/i18n";
import { cravingDishes, distanceKm, restaurantsInPlace, searchDishes, topKitchens, type Category } from "@/lib/data";

const CATS: Category[] = ["dosa", "biryani", "meals", "sweets", "parotta", "curry"];

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string; c?: Category } => ({
    ...(typeof s["q"] === "string" ? { q: s["q"] as string } : {}),
    ...(typeof s["c"] === "string" && CATS.includes(s["c"] as Category) ? { c: s["c"] as Category } : {}),
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Search dishes – Mannin Roots" },
      { name: "description", content: "Search Tamil dishes in Tamil or English: kothu, dosai, biryani." },
      { property: "og:title", content: "Search dishes – Mannin Roots" },
      { property: "og:description", content: "Search Tamil dishes in Tamil or English." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "", c } = Route.useSearch();
  const { t } = useI18n();
  const { add, notice } = useAddToCart();
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState<"near" | "popular">("near");
  const { nearby } = useUserLocation();
  const dist = useMemo(() => new Map(nearby.map((r) => [r.id, r.distanceKm])), [nearby]);
  const results = useMemo(() => {
    let r = c ? cravingDishes(new Set(dist.keys()), 100, c) : searchDishes(q).filter((d) => dist.has(d.restaurantId));
    if (vegOnly) r = r.filter((d) => d.veg);
    return [...r].sort((a, b) => sort === "near"
      ? dist.get(a.restaurantId)! - dist.get(b.restaurantId)!
      : b.orders * b.rating - a.orders * a.rating);
  }, [q, c, vegOnly, sort, dist]);
  const { point } = useUserLocation();
  const placeKitchens = useMemo(() => (c ? [] : restaurantsInPlace(q).map((r) => ({ ...r, distanceKm: distanceKm(point, r) }))), [q, c, point]);
  const kitchens = useMemo(() => {
    if (c) { const ids = new Set(results.map((d) => d.restaurantId)); return topKitchens(nearby.filter((r) => ids.has(r.id)), 3); }
    const n = q.trim().toLowerCase();
    const hit = new Set(results.map((d) => d.restaurantId));
    return nearby.filter((r) => !n || hit.has(r.id) || r.nameEn.toLowerCase().includes(n) || r.nameTa.includes(q.trim()) || r.suburb.toLowerCase().includes(n));
  }, [q, c, results, nearby]);
  const chip = (on: boolean) => `tap rounded-full border px-4 text-sm font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`;
  return (
    <AppShell>
      <SearchBox key={q} initial={q} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={chip(vegOnly)} aria-pressed={vegOnly} onClick={() => setVegOnly(!vegOnly)}>{t("filterVeg")}</button>
        <button className={chip(sort === "near")} aria-pressed={sort === "near"} onClick={() => setSort("near")}>{t("sortNearest")}</button>
        <button className={chip(sort === "popular")} aria-pressed={sort === "popular"} onClick={() => setSort("popular")}>{t("sortPopular")}</button>
      </div>
      {placeKitchens.length > 0 && (<>
        <h2 className="mt-5 mb-2 text-lg font-semibold">{t("kitchensInPlace", { place: q })}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{placeKitchens.map((r) => <RestaurantChip key={r.id} r={r} />)}</div>
      </>)}
      {kitchens.length > 0 && !placeKitchens.length && (<>
        <h2 className="mt-5 mb-2 text-lg font-semibold">{c ? t("topKitchensFor") : t("matchingKitchens")}</h2>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">{kitchens.map((r) => <RestaurantChip key={r.id} r={r} />)}</div>
      </>)}
      <h2 className="mt-5 text-lg font-semibold">{t("matchingDishes")}</h2>
      <p className="text-sm text-muted-foreground" aria-live="polite">{t("results", { n: results.length })}</p>
      {results.length ? (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((d) => <DishCard key={d.id} dish={d} onAdd={add} />)}
        </div>
      ) : (
        <div className="mt-8 text-center">
          <p>{t("noResults")}</p>
          <Link to="/search" search={{ q: "dosa" }} className="mt-3 inline-block font-semibold text-primary underline">தோசை / Dosai</Link>
        </div>
      )}
      <RadiusPrompt />
      {notice}
    </AppShell>
  );
}
