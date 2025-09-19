import '@ionic/core';
import '@shoelace-style/shoelace';
type ElementType = 'Stone' | 'Fire' | 'Water';
type GenderType = 'Man' | 'Woman';
interface GodMetadata {
    type: ElementType;
    gender: GenderType;
    parts: {
        [trait: string]: string;
    };
}
export declare function createGodAttributeEditor(metadata: GodMetadata, onChange: (updated: GodMetadata) => void): Promise<HTMLElement>;
export {};
//# sourceMappingURL=god-attribute-editor.d.ts.map