type ImageInfo = {
    path: string;
    drawOrder: number;
};
interface PartCondition {
    part: string;
    values: string[];
}
export type PartItem = {
    name: string;
    images?: ImageInfo[];
    percent?: number;
    condition?: PartCondition;
};
export type PartCategory = {
    name: string;
    parts: PartItem[];
};
export type PartOptions = PartCategory[] | {
    [traitName: string]: PartCategory[];
} | {
    [trait1Name: string]: {
        [trait2Name: string]: PartCategory[];
    };
};
export type NftData = {
    traits?: {
        [traitName: string]: string | number;
    };
    parts: {
        [partName: string]: string | number;
    };
};
export {};
//# sourceMappingURL=nft.d.ts.map