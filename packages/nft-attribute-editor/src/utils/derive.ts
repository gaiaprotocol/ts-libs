import { KeyToFrame } from "../types/frame";
import { NftData, PartCategory, PartItem, PartOptions } from "../types/nft";
import { isFlatKeyToFrame, isFlatPartOptions, isOneLevelKeyToFrame, isOneLevelPartOptions, isTwoLevelKeyToFrame, isTwoLevelPartOptions } from "./guards";

export function cloneData(data: NftData): { traits?: Record<string, string | number>; parts: Record<string, string | number> } {
  return {
    traits: data.traits ? { ...data.traits } : undefined,
    parts: { ...data.parts },
  };
}

export function getPartCategoriesAndFrames(
  partOptions: PartOptions,
  keyToFrame: KeyToFrame,
  traits?: Record<string, string | number>
): { categories: PartCategory[]; keyToFrameFlat: Record<string, string> } {
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
    const v = traits![t] as any;
    const categories = partOptions[v] ?? [];
    const map = keyToFrame[v] ?? {};
    return { categories, keyToFrameFlat: map };
  }

  if (c === 2) {
    if (!isTwoLevelPartOptions(partOptions) || !isTwoLevelKeyToFrame(keyToFrame)) {
      throw new Error('Expected two-level PartOptions/KeyToFrame for two-trait catalog.');
    }
    const [t1, t2] = names;
    const v1 = traits![t1] as any;
    const v2 = traits![t2] as any;

    const categories = (partOptions[v1]?.[v2] ?? partOptions[v2]?.[v1] ?? []) as PartCategory[];
    const map = (keyToFrame[v1]?.[v2] ?? keyToFrame[v2]?.[v1] ?? {}) as Record<string, string>;
    return { categories, keyToFrameFlat: map };
  }

  throw new Error('Unsupported trait count (> 2).');
}

export function buildDefaultParts(categories: PartCategory[]) {
  const out: Record<string, string> = {};
  for (const c of categories) {
    const first = c.parts[0];
    if (first) out[c.name] = first.name;
  }
  return out;
}

export function partItemAvailable(part: PartItem, current: NftData): boolean {
  if (!part.condition) return true;
  const { part: dep, values } = part.condition as any;
  const cur = current.parts[dep];
  return cur != null && values.includes(cur);
}

export function cleanData(
  data: { traits?: Record<string, string | number>; parts: Record<string, string | number> },
  partOptions: PartOptions,
  keyToFrame: KeyToFrame
) {
  const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);
  for (const cat of categories) {
    const ok = cat.parts.some(p => partItemAvailable(p, data as NftData));
    if (!ok) delete data.parts[cat.name];
  }
  return data;
}
