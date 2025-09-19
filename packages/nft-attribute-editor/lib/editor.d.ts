import '@ionic/core';
import '@shoelace-style/shoelace';
import { EventEmitter } from '@webtaku/event-emitter';
import { Frame } from 'kiwiengine';
import '../src/editor.css';
import { KeyToFrame } from './types/frame';
import { NftData, PartOptions } from './types/nft';
type NftAttributeEditorOptions = {
    traitOptions?: {
        [traitName: string]: string[];
    };
    partOptions: PartOptions;
    baseData: NftData;
    keyToFrame: KeyToFrame;
    frames: Record<string, Frame>;
    spritesheetImagePath: string;
};
declare class EditorComponent extends EventEmitter<{
    dataChanged: (data: NftData) => void;
}> {
    el: HTMLElement;
    data: NftData;
    remove: () => void;
    constructor(el: HTMLElement, data: NftData, remove: () => void);
}
/** 에디터 생성 (좌측: 선택기, 우측: 고정 프리뷰) */
export declare function createNftAttributeEditor(options: NftAttributeEditorOptions): Promise<EditorComponent>;
export {};
//# sourceMappingURL=editor.d.ts.map