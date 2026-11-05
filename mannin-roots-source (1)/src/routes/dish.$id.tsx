import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { AllergenNote, AppShell, RestaurantChip, SpiceLevel, VegMark, useAddToCart } from "@/components/roots";
import { useI18n } from "@/lib/i18n";
import { dishImage, formatMoney, getDish, getRestaurant } from "@/lib/data";

export const Route = createFileRoute("/dish/$id")({
  loader: ({ params }) => {
    const dish = getDish(params.id);
    if (!dish) throw notFound();
    return { dish };
  },
  head: ({ loaderData }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: loaderData ? `${loaderData.dish.nameEn} / ${loaderData.dish.nameTa} – Mannin Roots` : "Dish – Mannin Roots" },
      { name: "description", content: loaderData?.dish.descEn ?? "Tamil dish" },
      { property: "og:title", content: loaderData ? `${loaderData.dish.nameEn} – Mannin Roots` : "Dish – Mannin Roots" },
      { property: "og:description", content: loaderData?.dish.descEn ?? "Tamil dish" },
    ],
  }),
  component: DishPage,
});

function DishPage() {
  const { dish } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const router = useRouter();
  const { add, notice } = useAddToCart();
  const r = getRestaurant(dish.restaurantId)!;
  return (
    <AppShell hideCartBar>
      <button onClick={() => router.history.back()} className="tap mb-2 inline-flex items-center gap-1 text-primary"><ArrowLeft className="h-5 w-5" aria-hidden />{t("back")}</button>
      <img src={dishImage(dish)} alt={dish.nameEn} width={944} height={704} className="aspect-[4/3] w-full rounded-xl object-cover" />
      <h1 className="mt-4 text-[28px] font-bold leading-tight">{lang === "ta" ? dish.nameTa : dish.nameEn}</h1>
      <p className="text-lg text-muted-foreground">{lang === "ta" ? dish.nameEn : dish.nameTa}</p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <VegMark veg={dish.veg} />
        <SpiceLevel level={dish.spice} />
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" aria-hidden />{t("mins", { n: dish.prepMin })}</span>
      </div>
      <p className="mt-3">{lang === "ta" ? dish.descTa : dish.descEn}</p>
      <div className="mt-4"><AllergenNote allergens={dish.allergens} /></div>
      <div className="mt-4"><RestaurantChip r={r} /></div>
      <div className="fixed inset-x-0 bottom-16 z-30 px-4">
        {dish.available ? (
          <button onClick={() => add(dish.id)} className="tap mx-auto flex min-h-14 w-full max-w-3xl items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-card">
            {t("addToCart", { price: formatMoney(dish.price) })}
          </button>
        ) : <p className="mx-auto max-w-3xl rounded-xl bg-muted p-4 text-center font-medium">{t("soldOut")}</p>}
      </div>
      {notice}
    </AppShell>
  );
}
