/*
 * The position the dashboard reports on, when the surfer has pinned one.
 *
 * Browser geolocation answers from CoreLocation on macOS and Wi-Fi lookup
 * elsewhere, so a VPN never moves it and there is otherwise no way to ask what
 * a coast looks like from a desk somewhere else. A pin overrides the fix; with
 * nothing pinned the widgets locate as before.
 *
 * localStorage rather than the user record on purpose: this is where you are
 * looking from today, not where you surf.
 */
const KEY = 'gw-view-location';

/*
 * Safari in private browsing throws on getItem and setItem rather than
 * returning null, and that throw would take the dashboard out through the
 * ErrorBoundary in index.tsx. Every access is guarded for that, not for tidiness.
 */
export const readViewLocation = () => {
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Written by an older build, or edited by hand. A pin without usable
        // numbers would send NaN to /api/sc, which answers 400.
        if (!Number.isFinite(Number(parsed.lat)) || !Number.isFinite(Number(parsed.lon))) {
            return null;
        }
        return {
            lat: Number(parsed.lat),
            lon: Number(parsed.lon),
            name: parsed.name || ''
        };
    } catch (err) {
        return null;
    }
};

export const writeViewLocation = (location) => {
    try {
        window.localStorage.setItem(KEY, JSON.stringify({
            lat: Number(location.lat),
            lon: Number(location.lon),
            name: location.name || ''
        }));
    } catch (err) {
        // The pin still applies for this page load, it just will not survive
        // a reload.
    }
};

export const clearViewLocation = () => {
    try {
        window.localStorage.removeItem(KEY);
    } catch (err) {
    }
};
