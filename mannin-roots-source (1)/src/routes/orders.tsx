import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/roots";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Your orders – Mannin Roots" },
      { name: "description", content: "Track and reorder your Tamil meals." },
      { property: "og:title", content: "Your orders – Mannin Roots" },
      { property: "og:description", content: "Track and reorder your Tamil meals." },
    ],
  }),
  component: () => {
    const { t } = useI18n();
    return (
      <AppShell>
        <h1 className="mb-4 text-[28px] font-bold">{t("navOrders")}</h1>
        <p>{t("ordersEmpty")}</p>
        <Link to="/home" className="tap mt-4 inline-flex items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground">{t("browseDishes")}</Link>
      </AppShell>
    );
  },
});
