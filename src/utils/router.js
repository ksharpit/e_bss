// ============================================
// Simple Hash-based SPA Router
// ============================================

const routes = {};
let currentRoute = null;

export function registerRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

export function navigate(hash) {
    window.location.hash = hash;
}

export function initRouter(defaultRoute = '#dashboard') {
    function handleRoute() {
        const hash = window.location.hash || defaultRoute;

        // Parse parameterized routes like #station/BSS-001
        const slashIndex = hash.indexOf('/');
        let path, param;

        if (slashIndex !== -1) {
            path = hash.substring(0, slashIndex);
            param = hash.substring(slashIndex + 1);
        } else {
            path = hash;
            param = undefined;
        }

        if (routes[path]) {
            currentRoute = path;
            routes[path](param);
        } else if (routes[defaultRoute]) {
            window.location.hash = defaultRoute;
        }
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
