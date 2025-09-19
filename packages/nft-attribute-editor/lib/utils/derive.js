import { isFlatKeyToFrame, isFlatPartOptions, isOneLevelKeyToFrame, isOneLevelPartOptions, isTwoLevelKeyToFrame, isTwoLevelPartOptions } from "./guards";
export function cloneData(data) {
    return {
        traits: data.traits ? { ...data.traits } : undefined,
        parts: { ...data.parts },
    };
}
export function getPartCategoriesAndFrames(partOptions, keyToFrame, traits) {
    const names = Object.keys(traits ?? {});
    const c = names.length;
    if (c === 0) {
        if (!isFlatPartOptions(partOptions) || !isFlatKeyToFrame(keyToFrame)) {
            throw new Error('Expected flat PartOptions/KeyToFrame for zero-trait catalog.');
        }
        return { categories: partOptions, keyToFrameFlat: keyToFrame };
    }
    if (c === 1) {
        if (!isOneLevelPartOptions(partOptions) || !isOneLevelKeyToFrame(keyToFrame)) {
            throw new Error('Expected one-level PartOptions/KeyToFrame for one-trait catalog.');
        }
        const t = names[0];
        const v = traits[t];
        const categories = partOptions[v] ?? [];
        const map = keyToFrame[v] ?? {};
        return { categories, keyToFrameFlat: map };
    }
    if (c === 2) {
        if (!isTwoLevelPartOptions(partOptions) || !isTwoLevelKeyToFrame(keyToFrame)) {
            throw new Error('Expected two-level PartOptions/KeyToFrame for two-trait catalog.');
        }
        const [t1, t2] = names;
        const v1 = traits[t1];
        const v2 = traits[t2];
        const categories = (partOptions[v1]?.[v2] ?? partOptions[v2]?.[v1] ?? []);
        const map = (keyToFrame[v1]?.[v2] ?? keyToFrame[v2]?.[v1] ?? {});
        return { categories, keyToFrameFlat: map };
    }
    throw new Error('Unsupported trait count (> 2).');
}
export function buildDefaultParts(categories) {
    const out = {};
    for (const c of categories) {
        const first = c.parts[0];
        if (first)
            out[c.name] = first.name;
    }
    return out;
}
export function partItemAvailable(part, current) {
    if (!part.condition)
        return true;
    const { part: dep, values } = part.condition;
    const cur = current.parts[dep];
    return cur != null && values.includes(cur);
}
export function cleanData(data, partOptions, keyToFrame) {
    const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);
    for (const cat of categories) {
        const ok = cat.parts.some(p => partItemAvailable(p, data));
        if (!ok)
            delete data.parts[cat.name];
    }
    return data;
}
//# sourceMappingURL=derive.js.map