import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { AppShell, DishCard, RestaurantChip, SearchBox, useAddToCart } from "@/components/roots";
import { useI18n } from "@/lib/i18n";
import { categoryImage, cravingDishes, topKitchens, type Category } from "@/lib/data";
import { RadiusPrompt, useUserLocation } from "@/lib/location";
import type { Dict } from "@/lib/translations";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Home – Mannin Roots" },
      { name: "description", content: "Popular Tamil dishes near you: dosai, biryani, meals and sweets." },
      { property: "og:title", content: "Home – Mannin Roots" },
      { property: "og:description", content: "Popular Tamil dishes near you." },
    ],
  }),
  component: HomePage,
});

const cats: [Category, keyof Dict, string][] = [
  ["dosa", "catDosa", "dosa"], ["biryani", "catBiryani", "biryani"], ["meals", "catMeals", "meals"],
  ["parotta", "catParotta", "kothu"], ["curry", "catCurry", "curry"], ["sweets", "catSweets", "sweet"],
];

function HomePage() {
  const { t } = useI18n();
  const { add, notice } = useAddToCart();
  const { nearby, radius } = useUserLocation();
  const ids = new Set(nearby.map((r) => r.id));
  const popular = cravingDishes(ids, 12);
  const kitchens = topKitchens(nearby, 15);
  return (
    <AppShell>
      <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" aria-hidden />{t("deliveringTo")}: <span className="font-semibold text-foreground">{t("zone")}</span></p>
      <SearchBox />
      <h2 className="mt-6 mb-3 text-xl font-semibold">{t("categories")}</h2>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {cats.map(([c, label]) => (
          <li key={c}>
            <Link to="/search" search={{ c }} className="flex flex-col items-center gap-1 text-center">
              <img src={categoryImage[c]} alt="" className="aspect-square w-full rounded-full border-2 border-accent object-cover" loading="lazy" />
              <span className="text-sm font-medium">{t(label)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 mb-3 text-xl font-semibold">{t("kitchens")} <span className="text-sm font-normal text-muted-foreground">· {t("withinKm", { n: radius })}</span></h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {kitchens.map((r) => <RestaurantChip key={r.id} r={r} />)}
      </div>
      {!nearby.length && <p className="text-muted-foreground">{t("noKitchens")}</p>}
      <h2 className="mt-8 mb-3 text-xl font-semibold">{t("cravingDishes")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {popular.map((d) => <DishCard key={d.id} dish={d} onAdd={add} />)}
      </div>
      <RadiusPrompt />
      {notice}
    </AppShell>
  );
}
