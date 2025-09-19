import { KeyToFrame } from "../types/frame";
import { NftData, PartCategory, PartItem, PartOptions } from "../types/nft";
export declare function cloneData(data: NftData): {
    traits?: Record<string, string | number>;
    parts: Record<string, string | number>;
};
export declare function getPartCategoriesAndFrames(partOptions: PartOptions, keyToFrame: KeyToFrame, traits?: Record<string, string | number>): {
    categories: PartCategory[];
    keyToFrameFlat: Record<string, string>;
};
export declare function buildDefaultParts(categories: PartCategory[]): Record<string, string>;
export declare function partItemAvailable(part: PartItem, current: NftData): boolean;
export declare function cleanData(data: {
    traits?: Record<string, string | number>;
    parts: Record<string, string | number>;
}, partOptions: PartOptions, keyToFrame: KeyToFrame): {
    traits?: Record<string, string | number>;
    parts: Record<string, string | number>;
};
//# sourceMappingURL=derive.d.ts.map