import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/roots";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatMoney, getDish, getRestaurant } from "@/lib/data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Your cart – Mannin Roots" },
      { name: "description", content: "Review your order from up to 3 Tamil kitchens." },
      { property: "og:title", content: "Your cart – Mannin Roots" },
      { property: "og:description", content: "Review your order from up to 3 Tamil kitchens." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const { lines, setQty, restaurantIds, totals } = useCart();
  const [notes, setNotes] = useState("");
  if (!lines.length)
    return (
      <AppShell hideCartBar>
        <div className="py-16 text-center">
          <p className="text-lg">{t("cartEmpty")}</p>
          <Link to="/home" className="tap mt-4 inline-flex items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground">{t("browseDishes")}</Link>
        </div>
      </AppShell>
    );
  const windows = restaurantIds.map((rid) => getRestaurant(rid)!.prepMin + 15);
  const gap = Math.max(...windows) - Math.min(...windows);
  return (
    <AppShell hideCartBar>
      <h1 className="mb-4 text-[28px] font-bold">{t("cartTitle")}</h1>
      <div className="flex flex-col gap-4">
        {restaurantIds.map((rid) => {
          const r = getRestaurant(rid)!;
          const a = r.prepMin + 15;
          return (
            <section key={rid} className="rounded-xl border border-border bg-card p-4" aria-label={r.nameEn}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{lang === "ta" ? r.nameTa : r.nameEn}</h2>
                <span className="text-sm text-muted-foreground">{t("arrival", { a, b: a + 10 })}</span>
              </div>
              <ul className="mt-2 divide-y divide-border">
                {lines.filter((l) => getDish(l.dishId)?.restaurantId === rid).map((l) => {
                  const d = getDish(l.dishId)!;
                  const nm = lang === "ta" ? d.nameTa : d.nameEn;
                  return (
                    <li key={l.dishId} className="flex items-center justify-between gap-2 py-2">
                      <span className="flex-1">{nm}</span>
                      <div className="flex items-center gap-1">
                        <button aria-label={`${t("decrease")}: ${nm}`} onClick={() => setQty(l.dishId, l.qty - 1)} className="tap flex items-center justify-center rounded-full border border-border"><Minus className="h-4 w-4" /></button>
                        <span className="tabular w-6 text-center" aria-live="polite">{l.qty}</span>
                        <button aria-label={`${t("increase")}: ${nm}`} onClick={() => setQty(l.dishId, l.qty + 1)} className="tap flex items-center justify-center rounded-full border border-border"><Plus className="h-4 w-4" /></button>
                      </div>
                      <span className="tabular w-20 text-right">{formatMoney(d.price * l.qty)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 flex justify-between text-sm text-muted-foreground"><span>{t("delivery")}</span><span className="tabular">{formatMoney(r.deliveryFee)}</span></p>
            </section>
          );
        })}
      </div>
      {gap > 20 && (
        <div className="mt-4 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3" role="status">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p>{t("gapWarning", { n: gap })}</p>
        </div>
      )}
      <label className="mt-4 block">
        <span className="font-medium">{t("notes")}</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-input bg-card p-3 outline-none focus:border-primary" />
      </label>
      <dl className="mt-4 rounded-xl border border-border bg-card p-4">
        <Row k={t("food")} v={totals.food} />
        <Row k={t("delivery")} v={totals.delivery} />
        <Row k={t("platformFee")} v={totals.platform} />
        <Row k={t("gst")} v={totals.gstIncluded} muted />
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-bold"><dt>{t("total")}</dt><dd className="tabular">{formatMoney(totals.total)}</dd></div>
      </dl>
      <div className="fixed inset-x-0 bottom-16 z-30 px-4">
        <button onClick={() => toast(t("checkoutSoon"))} className="tap mx-auto flex min-h-14 w-full max-w-3xl items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-card">
          {t("checkout", { price: formatMoney(totals.total) })}
        </button>
      </div>
    </AppShell>
  );
}

function Row({ k, v, muted }: { k: string; v: number; muted?: boolean }) {
  return <div className={`flex justify-between py-0.5 ${muted ? "text-sm text-muted-foreground" : ""}`}><dt>{k}</dt><dd className="tabular">{formatMoney(v)}</dd></div>;
}
