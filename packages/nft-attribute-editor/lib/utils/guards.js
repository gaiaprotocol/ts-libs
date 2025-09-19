export function isFlatPartOptions(p) {
    return Array.isArray(p);
}
export function isOneLevelPartOptions(p) {
    return !Array.isArray(p) &&
        typeof p === 'object' &&
        Object.values(p).every(v => Array.isArray(v));
}
export function isTwoLevelPartOptions(p) {
    return !Array.isArray(p) &&
        typeof p === 'object' &&
        Object.values(p).every(v => typeof v === 'object' && v != null && Object.values(v).every(arr => Array.isArray(arr)));
}
export function isFlatKeyToFrame(k) {
    return typeof k === 'object' && k != null &&
        Object.values(k).every(v => typeof v === 'string');
}
export function isOneLevelKeyToFrame(k) {
    return typeof k === 'object' && k != null &&
        Object.values(k).every(v => typeof v === 'object' && v != null && Object.values(v).every(s => typeof s === 'string'));
}
export function isTwoLevelKeyToFrame(k) {
    return typeof k === 'object' && k != null &&
        Object.values(k).every(lv1 => typeof lv1 === 'object' && lv1 != null &&
            Object.values(lv1).every(lv2 => typeof lv2 === 'object' && lv2 != null && Object.values(lv2).every(s => typeof s === 'string')));
}
//# sourceMappingURL=guards.js.map