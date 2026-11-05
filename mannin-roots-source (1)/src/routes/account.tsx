import { createFileRoute } from "@tanstack/react-router";
import { AppShell, LanguageToggle, LanguageRegionNote } from "@/components/roots";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Account – Mannin Roots" },
      { name: "description", content: "Your Mannin Roots account and language." },
      { property: "og:title", content: "Account – Mannin Roots" },
      { property: "og:description", content: "Your Mannin Roots account and language." },
    ],
  }),
  component: () => {
    const { t } = useI18n();
    return (
      <AppShell>
        <h1 className="mb-4 text-[28px] font-bold">{t("account")}</h1>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 font-semibold">{t("language")}</p>
          <LanguageToggle />
          <LanguageRegionNote />
        </div>
        <p className="mt-4 text-muted-foreground">{t("signInSoon")}</p>
      </AppShell>
    );
  },
});
