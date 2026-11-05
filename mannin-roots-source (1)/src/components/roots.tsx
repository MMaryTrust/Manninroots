import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Home, Search, ReceiptText, User, ShoppingBag, Leaf, Drumstick, Flame, Clock, AlertTriangle, Mic, Plus, Check, Star, ShieldCheck } from "lucide-react";
import logo from "@/assets/mannin_roots_logo_wide.png.asset.json";
import logoTa from "@/assets/mannin_roots_logo_ta_h.png.asset.json";
import logoTaFull from "@/assets/mannin_roots_logo_ta_full.png.asset.json";
import logoTe from "@/assets/mannin_roots_logo_te_t.png.asset.json";
import logoMl from "@/assets/mannin_roots_logo_ml_t.png.asset.json";
import logoKn from "@/assets/mannin_roots_logo_kn_t.png.asset.json";
import logoHi from "@/assets/mannin_roots_logo_hi_t.png.asset.json";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/lang-detect";
import { useCart } from "@/lib/cart";
import { ALLERGEN_TA, dishImage, formatMoney, getRestaurant, type Dish, type Restaurant } from "@/lib/data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("language")} className="flex min-w-0 max-w-full overflow-x-auto rounded-full border border-border bg-card p-0.5 text-sm">
      {LANGS.map((l: Lang) => (
        <Button variant="ghost" key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
          className={`tap shrink-0 rounded-full px-3 font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground"}`}>
          {LANG_LABEL[l]}
        </Button>
      ))}
    </div>
  );
}

export function LanguageRegionNote() {
  const { t, region, manual, resetToRegion } = useI18n();
  return (
    <div className="mt-2 text-sm text-muted-foreground">
      {!manual && region && <p>{t("autoLang", { region })}</p>}
      {manual && <button className="tap underline" onClick={resetToRegion}>{t("useRegionLang")}</button>}
    </div>
  );
}

export function Logo({ className = "h-10", variant = "header" }: { className?: string; variant?: "header" | "full" }) {
  const { lang, t } = useI18n();
  const source = lang === "ta" ? (variant === "full" ? logoTaFull.url : logoTa.url) : lang === "ml" ? logoMl.url : lang === "kn" ? logoKn.url : lang === "hi" ? logoHi.url : lang === "te" ? logoTe.url : logo.url;
  const altTop = lang === "te" ? "తెలుగు నేల వేర్లు" : lang === "hi" ? "तमिल मन्निन रूट्स" : t("brandTa");
  return <img src={source} alt={`${altTop} – ${t("brandEn")}`} className={`${className} w-auto max-w-full object-contain`} />;
}

export function AppHeader() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
        <Link to="/home" aria-label={t("navHome")} className="shrink-0 max-w-[42%]"><Logo className="h-11" /></Link>
        <LanguageToggle />
      </div>
    </header>
  );
}

export function BottomNav() {
  const { t } = useI18n();
  const items = [
    { to: "/home", icon: Home, label: t("navHome") },
    { to: "/search", icon: Search, label: t("navSearch") },
    { to: "/orders", icon: ReceiptText, label: t("navOrders") },
    { to: "/account", icon: User, label: t("navAccount") },
  ] as const;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <Link to={to} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}>
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-center leading-tight">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CartBar() {
  const { t } = useI18n();
  const { count, totals } = useCart();
  if (!count) return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-30 px-4">
      <Link to="/cart" className="mx-auto flex min-h-14 max-w-3xl items-center justify-between rounded-xl bg-primary px-4 text-primary-foreground shadow-card">
        <span className="flex items-center gap-2 font-semibold"><ShoppingBag className="h-5 w-5" aria-hidden />{t("viewCart")} · {t("items", { n: count })}</span>
        <span className="tabular font-semibold">{formatMoney(totals.total)}</span>
      </Link>
    </div>
  );
}

export function AppShell({ children, hideCartBar }: { children: React.ReactNode; hideCartBar?: boolean }) {
  return (
    <div className="min-h-screen pb-40">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>
      {!hideCartBar && <CartBar />}
      <BottomNav />
    </div>
  );
}

export function Rating({ value, count }: { value: number; count: number }) {
  const { t } = useI18n();
  if (!value) return <span className="text-sm text-muted-foreground">{t("noReviews")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${t("customerRating")}: ${value} / 5, ${t("reviews", { n: count })}`}>
      <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
      <span className="font-semibold tabular">{value.toFixed(1)}</span>
      <span className="text-muted-foreground">({t("reviews", { n: count })})</span>
    </span>
  );
}

export function VegMark({ veg }: { veg: boolean }) {
  const { t } = useI18n();
  const Icon = veg ? Leaf : Drumstick;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${veg ? "text-secondary" : "text-destructive"}`}>
      <Icon className="h-4 w-4" aria-hidden />{veg ? t("veg") : t("nonVeg")}
    </span>
  );
}

export function SpiceLevel({ level }: { level: 0 | 1 | 2 | 3 }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-muted-foreground" aria-label={`${t("spice")}: ${t(`spice${level}`)}`}>
      {Array.from({ length: Math.max(level, 1) }).map((_, i) => <Flame key={i} className={`h-4 w-4 ${level ? "text-warning" : "opacity-40"}`} aria-hidden />)}
      <span className="ml-1">{t(`spice${level}`)}</span>
    </span>
  );
}

export function useAddToCart() {
  const cart = useCart();
  const [blocked, setBlocked] = useState<{ dishId: string; rid: string } | null>(null);
  const add = (dishId: string) => {
    const r = cart.add(dishId);
    if (!r.ok) setBlocked({ dishId, rid: r.restaurantId });
    return r.ok;
  };
  const notice = <CartLimitNotice blocked={blocked} onClose={() => setBlocked(null)} />;
  return { add, notice };
}

export function CartLimitNotice({ blocked, onClose }: { blocked: { dishId: string; rid: string } | null; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { restaurantIds, replaceRestaurant } = useCart();
  const newR = blocked ? getRestaurant(blocked.rid) : undefined;
  const nm = (r?: Restaurant) => (r ? (lang === "ta" ? r.nameTa : r.nameEn) : "");
  return (
    <Sheet open={!!blocked} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("limitTitle")}</SheetTitle>
          <SheetDescription>{t("limitBody", { name: nm(newR) })}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4">
          {restaurantIds.map((rid) => (
            <button key={rid} className="tap rounded-lg border border-border px-4 py-3 text-left font-medium hover:bg-muted"
              onClick={() => { if (blocked) replaceRestaurant(rid, blocked.dishId); onClose(); }}>
              {t("replace", { name: nm(getRestaurant(rid)) })}
            </button>
          ))}
          <button className="tap rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground" onClick={onClose}>{t("keepCart")}</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DishCard({ dish, onAdd }: { dish: Dish; onAdd: (id: string) => boolean }) {
  const { t, lang } = useI18n();
  const r = getRestaurant(dish.restaurantId)!;
  const [justAdded, setJustAdded] = useState(false);
  const primary = lang === "ta" ? dish.nameTa : dish.nameEn;
  const secondary = lang === "ta" ? dish.nameEn : dish.nameTa;
  return (
    <article className={`overflow-hidden rounded-xl border border-border bg-card ${dish.available ? "" : "opacity-60 grayscale"}`}>
      <Link to="/dish/$id" params={{ id: dish.id }} className="block">
        <img src={dishImage(dish)} alt={dish.nameEn} loading="lazy" width={944} height={704} className="aspect-[4/3] w-full object-cover" />
      </Link>
      <div className="flex flex-col gap-1 p-3">
        <Link to="/dish/$id" params={{ id: dish.id }}>
          <h3 className="text-lg font-semibold leading-snug">{primary}</h3>
          <p className="text-sm text-muted-foreground">{secondary}</p>
        </Link>
        <p className="text-sm text-muted-foreground">{lang === "ta" ? r.nameTa : r.nameEn}</p>
        <Rating value={dish.rating} count={dish.ratingCount} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <VegMark veg={dish.veg} />
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" aria-hidden />{t("mins", { n: dish.prepMin })}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          {dish.available ? (
            <button
              onClick={() => { if (onAdd(dish.id)) { setJustAdded(true); setTimeout(() => setJustAdded(false), 1200); } }}
              className="tap inline-flex items-center gap-1 rounded-full border-2 border-primary px-4 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
              aria-label={`${t("add")} ${primary}`}>
              {justAdded ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              {justAdded ? t("added") : t("add")}
            </button>
          ) : <span className="text-sm font-medium text-muted-foreground">{t("soldOut")}</span>}
          <span className="tabular text-lg font-semibold">{formatMoney(dish.price)}</span>
        </div>
      </div>
    </article>
  );
}

export function RestaurantChip({ r }: { r: Restaurant }) {
  const { t, lang } = useI18n();
  return (
    <Link to="/r/$slug" params={{ slug: r.slug }} className="flex min-w-[220px] flex-col rounded-xl border border-border bg-card p-3 hover:border-primary">
      <span className="font-semibold">{lang === "ta" ? r.nameTa : r.nameEn}</span>
      <span className="text-sm text-muted-foreground">{t("km", { n: r.distanceKm })} · {r.suburb}{r.enrolled ? ` · ${t("deliveryFee", { fee: formatMoney(r.deliveryFee) })}` : ""}</span>
      <Rating value={r.rating} count={r.ratingCount} />
      {r.systemScore > 0 && <span className="inline-flex items-center gap-1 text-sm text-secondary"><ShieldCheck className="h-4 w-4" aria-hidden />{t("systemScore", { n: r.systemScore.toFixed(1) })}</span>}
      <span className={`text-sm font-medium ${r.open ? "text-secondary" : "text-destructive"}`}>{r.open ? t("open") : t("closed")}</span>
      {!r.enrolled && <span className="mt-1 self-start rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{t("notEnrolled")}</span>}
    </Link>
  );
}

export function AllergenNote({ allergens }: { allergens: string[] }) {
  const { t, lang } = useI18n();
  return (
    <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3" role="note">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="font-semibold">{t("allergenTitle")}</p>
        <p>{allergens.length ? allergens.map((a) => (lang === "ta" ? ALLERGEN_TA[a] ?? a : a.charAt(0).toUpperCase() + a.slice(1))).join(", ") : t("noAllergens")}</p>
        <p className="text-sm text-muted-foreground">{t("allergenNote")}</p>
      </div>
    </div>
  );
}

export function SearchBox({ initial = "" }: { initial?: string }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const [q, setQ] = useState(initial);
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); nav({ to: "/search", search: { q } }); }} className="flex gap-2">
      <label className="relative flex-1">
        <span className="sr-only">{t("searchLabel")}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")}
          className="tap w-full rounded-full border border-input bg-card py-3 pl-10 pr-4 outline-none focus:border-primary" />
      </label>
      <button type="button" aria-label={t("voice")} className="tap flex items-center justify-center rounded-full bg-secondary px-3 text-secondary-foreground">
        <Mic className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}
