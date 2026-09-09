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

/*
 * The create-session modal is mounted for the life of the dashboard, whether or
 * not it is open, so its location field reads the pin once and would otherwise
 * still be offering chips around the machine after the pin moved. The dashboard
 * panels take the pin as a prop and need none of this; nothing mounted on
 * demand does either.
 */
const listeners = new Set();

export const onViewLocationChange = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};

const announce = (location) => {
    listeners.forEach((fn) => fn(location));
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
    // Announced whether or not the write landed: the pin is in effect either
    // way, and a listener that ignored a failed write would disagree with the
    // panels for the rest of the session.
    announce(readViewLocation() || {
        lat: Number(location.lat),
        lon: Number(location.lon),
        name: location.name || ''
    });
};

export const clearViewLocation = () => {
    try {
        window.localStorage.removeItem(KEY);
    } catch (err) {
    }
    announce(null);
};
