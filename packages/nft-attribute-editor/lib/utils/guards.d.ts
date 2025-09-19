import { KeyToFrame } from "../types/frame";
import { PartCategory, PartOptions } from "../types/nft";
export declare function isFlatPartOptions(p: PartOptions): p is PartCategory[];
export declare function isOneLevelPartOptions(p: PartOptions): p is Record<string, PartCategory[]>;
export declare function isTwoLevelPartOptions(p: PartOptions): p is Record<string, Record<string, PartCategory[]>>;
export declare function isFlatKeyToFrame(k: KeyToFrame): k is Record<string, string>;
export declare function isOneLevelKeyToFrame(k: KeyToFrame): k is Record<string, Record<string, string>>;
export declare function isTwoLevelKeyToFrame(k: KeyToFrame): k is Record<string, Record<string, Record<string, string>>>;
//# sourceMappingURL=guards.d.ts.map