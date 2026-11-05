import { useEffect, useSyncExternalStore } from "react";
import { MapPin } from "lucide-react";
import { nearbyRestaurants } from "./data";
import { useI18n } from "./i18n";
import { DEFAULT_RADIUS, getLocationState, getServerLocationState, setLocationState, startLocating, subscribeLocation, type Radius } from "./location-store";

export { DEFAULT_RADIUS, type Radius };
export const RADIUS_OPTIONS: Radius[] = [30, 100, 250];

export function useUserLocation() {
  const s = useSyncExternalStore(subscribeLocation, getLocationState, getServerLocationState);
  useEffect(() => { startLocating(); }, []);
  return {
    ...s,
    nearby: nearbyRestaurants(s.point, s.radius),
    setRadius: (radius: Radius) => setLocationState({ radius }),
  };
}

export function RadiusPrompt() {
  const { t } = useI18n();
  const loc = useUserLocation();
  const btn = (on: boolean) => `tap inline-flex items-center gap-1 rounded-full border px-4 text-sm font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`;
  return (
    <section className="mt-8 rounded-xl border border-border bg-muted/40 p-4" aria-live="polite">
      <h2 className="text-lg font-semibold">{t("wantMore")}</h2>
      <p className="text-sm text-muted-foreground">{t("wantMoreBody", { n: loc.radius, place: loc.exact ? t("myLocation") : t("zone") })}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-sm"><MapPin className="h-4 w-4 text-primary" aria-hidden />{loc.exact ? t("myLocation") : t("zone")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map((n) => (
          <button key={n} className={btn(loc.radius === n)} aria-pressed={loc.radius === n} onClick={() => loc.setRadius(n)}>{t("kmOption", { n })}</button>
        ))}
      </div>
      {loc.status === "locating" && <p className="mt-2 text-sm">{t("locating")}</p>}
      {loc.status === "denied" && <p className="mt-2 text-sm text-destructive">{t("locationDenied")}</p>}
    </section>
  );
}
