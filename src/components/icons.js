// ============================================
// Icons - Material Symbols Outlined
// ============================================

/**
 * Returns a Material Symbols Outlined icon span
 * @param {string} name - Material Symbol icon name
 * @param {string} [size='20px'] - Icon size
 * @param {string} [extraClass=''] - Additional CSS classes
 */
export function icon(name, size = '20px', extra = '') {
    // If extra looks like a style (contains ':'), use it as style, otherwise as class
    const isStyle = extra.includes(':');
    const attr = isStyle ? `style="font-size:${size};${extra}"` : `style="font-size:${size}" class="material-symbols-outlined ${extra}"`;
    return isStyle
        ? `<span class="material-symbols-outlined" ${attr}>${name}</span>`
        : `<span ${attr}>${name}</span>`;
}

// Commonly used icon names mapped for easy reference
export const ICONS = {
    dashboard: 'dashboard',
    stations: 'ev_station',
    batteries: 'battery_charging_full',
    revenue: 'payments',
    inventory: 'inventory_2',
    settings: 'settings',
    support: 'help',
    search: 'search',
    notifications: 'notifications',
    download: 'download',
    add: 'add',
    bolt: 'bolt',
    swap: 'swap_horiz',
    health: 'health_and_safety',
    trending_up: 'trending_up',
    trending_down: 'trending_down',
    check_circle: 'check_circle',
    error: 'error',
    warning: 'warning',
    location: 'location_on',
    schedule: 'schedule',
    person: 'person',
    more: 'more_vert',
    arrow_forward: 'arrow_forward',
    arrow_back: 'arrow_back',
    close: 'close',
    refresh: 'sync',
    charging: 'battery_charging_full',
    battery_full: 'battery_full',
    battery_alert: 'battery_alert',
    empty: 'battery_0_bar',
    fault: 'report_problem',
    online: 'radio_button_checked',
    maintenance: 'build',
    thermometer: 'thermostat',
    voltage: 'electric_bolt',
    speed: 'speed',
    chart: 'analytics',
    export_csv: 'download',
    manage: 'tune',
    power: 'power',
};
