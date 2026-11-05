import { HOME_POINT, type Point } from "./data";

export type Radius = 30 | 100 | 250;
export const DEFAULT_RADIUS: Radius = 30;
export type LocationState = { point: Point; exact: boolean; radius: Radius; status: "idle" | "locating" | "denied" };

const initialState: LocationState = { point: HOME_POINT, exact: false, radius: DEFAULT_RADIUS, status: "idle" };
let state: LocationState = initialState;
let asked = false;
const subs = new Set<() => void>();

export const getLocationState = () => state;
export const getServerLocationState = () => initialState;
export const setLocationState = (p: Partial<LocationState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
export const subscribeLocation = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

// Detect where the user is as soon as the app opens (once); falls back to Harris Park.
export function startLocating() {
  if (asked) return;
  asked = true;
  if (!navigator.geolocation) return setLocationState({ status: "denied" });
  setLocationState({ status: "locating" });
  navigator.geolocation.getCurrentPosition(
    (p) => setLocationState({ point: { lat: p.coords.latitude, lng: p.coords.longitude }, exact: true, status: "idle" }),
    () => setLocationState({ status: "denied", exact: false, point: HOME_POINT }),
    { timeout: 10000 },
  );
}
