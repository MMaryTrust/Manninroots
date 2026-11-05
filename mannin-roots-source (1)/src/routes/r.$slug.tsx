import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppShell, DishCard, useAddToCart } from "@/components/roots";
import { useI18n } from "@/lib/i18n";
import { dishes, formatMoney, restaurants } from "@/lib/data";

export const Route = createFileRoute("/r/$slug")({
  loader: ({ params }) => {
    const r = restaurants.find((x) => x.slug === params.slug);
    if (!r) throw notFound();
    return { r };
  },
  head: ({ loaderData }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: loaderData ? `${loaderData.r.nameEn} – Mannin Roots` : "Kitchen – Mannin Roots" },
      { name: "description", content: loaderData ? `Order from ${loaderData.r.nameEn} on Mannin Roots.` : "Tamil kitchen" },
      { property: "og:title", content: loaderData ? `${loaderData.r.nameEn} – Mannin Roots` : "Kitchen – Mannin Roots" },
      { property: "og:description", content: "Home-style Tamil food." },
    ],
  }),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { r } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const { add, notice } = useAddToCart();
  const menu = dishes.filter((d) => d.restaurantId === r.id);
  return (
    <AppShell>
      <div className="rounded-xl bg-earth p-5 text-primary-foreground">
        <h1 className="text-[28px] font-bold leading-tight">{lang === "ta" ? r.nameTa : r.nameEn}</h1>
        <p className="opacity-90">{lang === "ta" ? r.nameEn : r.nameTa}</p>
        <p className="mt-2 text-sm">{t("hours", { h: r.hours })} · {t("km", { n: r.distanceKm })} · {r.suburb}{r.enrolled ? ` · ${t("deliveryFee", { fee: formatMoney(r.deliveryFee) })}` : ""}</p>
        {r.enrolled && <p className="mt-1 inline-flex items-center gap-1 text-sm"><ShieldCheck className="h-4 w-4" aria-hidden />{t("registration", { n: r.registration })}</p>}
      </div>
      {!r.enrolled && <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4"><p className="font-semibold">{t("notEnrolled")}</p><p className="text-sm text-muted-foreground">{t("notEnrolledBody")}</p></div>}
      {r.enrolled && <h2 className="mt-6 mb-3 text-xl font-semibold">{t("menu")}</h2>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {menu.map((d) => <DishCard key={d.id} dish={d} onAdd={add} />)}
      </div>
      {notice}
    </AppShell>
  );
}
