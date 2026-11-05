import { createFileRoute, Link } from "@tanstack/react-router";
import brand from "@/assets/mannin_roots_logo_stacked.png.asset.json";
import { useI18n } from "@/lib/i18n";
import { LANGS, LANG_LABEL } from "@/lib/lang-detect";
import { LanguageRegionNote, Logo } from "@/components/roots";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Mannin Roots – தமிழ் மண்ணின் வேர்கள் | Our Roots. Our Taste." },
      { name: "description", content: "Order home-style Tamil food from local kitchens, in Tamil or English." },
      { property: "og:title", content: "Mannin Roots – தமிழ் மண்ணின் வேர்கள்" },
      { property: "og:description", content: "Order home-style Tamil food from local kitchens, in Tamil or English." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { t, lang, setLang } = useI18n();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-8">
      {lang === "ml" || lang === "kn" || lang === "ta" ? <Logo variant="full" className="mt-4 w-full rounded-xl" /> : <img src={brand.url} alt={`${t("brandTa")} – ${t("brandEn")}, ${t("tagline")}`} className="mt-4 w-full rounded-xl" />}
      <div className="mt-auto flex flex-col gap-3 pt-8">
        <h1 className="text-center text-2xl font-bold">{t("chooseLang")}</h1>
        <>
          {LANGS.map((l) => (
            <Button variant="outline" key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
              className={`tap h-auto rounded-xl border-2 px-4 py-4 text-xl font-semibold ${lang === l ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
              {LANG_LABEL[l]}
            </Button>
          ))}
        </>
        <div className="text-center"><LanguageRegionNote /></div>
        <Link to="/home" className="tap mt-2 flex items-center justify-center rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground">
          {t("continue")}
        </Link>
        <p className="text-center text-sm text-muted-foreground">{t("combinedNote")}</p>
      </div>
    </main>
  );
}
