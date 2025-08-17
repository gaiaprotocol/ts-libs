import { KeyToFrame } from "../types/frame";
import { PartCategory, PartOptions } from "../types/nft";

export function isFlatPartOptions(p: PartOptions): p is PartCategory[] {
  return Array.isArray(p);
}

export function isOneLevelPartOptions(
  p: PartOptions
): p is Record<string, PartCategory[]> {
  return !Array.isArray(p) &&
    typeof p === 'object' &&
    Object.values(p).every(v => Array.isArray(v));
}

export function isTwoLevelPartOptions(
  p: PartOptions
): p is Record<string, Record<string, PartCategory[]>> {
  return !Array.isArray(p) &&
    typeof p === 'object' &&
    Object.values(p).every(
      v => typeof v === 'object' && v != null && Object.values(v).every(arr => Array.isArray(arr))
    );
}

export function isFlatKeyToFrame(
  k: KeyToFrame
): k is Record<string, string> {
  return typeof k === 'object' && k != null &&
    Object.values(k).every(v => typeof v === 'string');
}

export function isOneLevelKeyToFrame(
  k: KeyToFrame
): k is Record<string, Record<string, string>> {
  return typeof k === 'object' && k != null &&
    Object.values(k).every(
      v => typeof v === 'object' && v != null && Object.values(v).every(s => typeof s === 'string')
    );
}

export function isTwoLevelKeyToFrame(
  k: KeyToFrame
): k is Record<string, Record<string, Record<string, string>>> {
  return typeof k === 'object' && k != null &&
    Object.values(k).every(
      lv1 => typeof lv1 === 'object' && lv1 != null &&
        Object.values(lv1).every(
          lv2 => typeof lv2 === 'object' && lv2 != null && Object.values(lv2).every(s => typeof s === 'string')
        )
    );
}
