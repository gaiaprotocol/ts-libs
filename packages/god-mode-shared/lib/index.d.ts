export type ElementType = 'Stone' | 'Fire' | 'Water';
export type GenderType = 'Man' | 'Woman';
export type GodMetadata = {
    type: ElementType;
    gender: GenderType;
    parts: {
        [category: string]: string;
    };
};
export type ImageInfo = {
    path: string;
    drawOrder: number;
};
interface PartCondition {
    part: string;
    values: string[];
}
type PartItem = {
    name: string;
    images?: ImageInfo[];
    percent?: number;
    condition?: PartCondition;
};
export declare function getSelectedParts(metadata: GodMetadata): {
    [category: string]: PartItem;
};
export {};
//# sourceMappingURL=index.d.ts.map