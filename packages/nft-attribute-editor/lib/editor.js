import '@ionic/core';
import { defineCustomElements } from '@ionic/core/loader';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import { EventEmitter } from '@webtaku/event-emitter';
import { DomAnimatedSpriteNode, DomGameObject, domPreload } from 'kiwiengine';
import '../src/editor.css';
import { buildDefaultParts, cleanData, cloneData, getPartCategoriesAndFrames, partItemAvailable } from './utils/derive';
defineCustomElements(window);
class EditorComponent extends EventEmitter {
    el;
    data;
    remove;
    constructor(el, data, remove) {
        super();
        this.el = el;
        this.data = data;
        this.remove = remove;
    }
}
/** 합성 프리뷰 생성 (큰/작은 공용) */
function createPreview(categories, keyToFrame, data, frames, spritesheetImagePath) {
    const preview = new DomGameObject();
    for (const [partName, partValue] of Object.entries(data.parts)) {
        const category = categories.find((cat) => cat.name === partName);
        if (!category)
            continue;
        const part = category.parts.find((p) => p.name === partValue);
        if (!part?.images || part.images.length === 0)
            continue;
        // drawOrder 기준 정렬(있다면)
        const images = [...part.images].sort((a, b) => (a.drawOrder ?? 0) - (b.drawOrder ?? 0));
        for (const image of images) {
            const frame = keyToFrame[image.path];
            if (!frame)
                continue;
            const sprite = new DomAnimatedSpriteNode({
                src: spritesheetImagePath,
                atlas: {
                    frames,
                    animations: {
                        [frame]: {
                            frames: [frame],
                            fps: 1,
                            loop: false,
                        }
                    }
                },
                animation: frame,
                drawOrder: image.drawOrder,
            });
            preview.add(sprite);
        }
    }
    return preview;
}
/** 에디터 생성 (좌측: 선택기, 우측: 고정 프리뷰) */
export async function createNftAttributeEditor(options) {
    const { traitOptions, partOptions, baseData, keyToFrame, frames, spritesheetImagePath } = options;
    await domPreload([spritesheetImagePath]);
    // 루트
    const editor = el('ion-content.nft-attribute-editor');
    // ---- 상태
    let data = baseData;
    // ---- 레이아웃 (좌/우)
    const layout = el('div', { class: 'nft-editor-layout' });
    const selectorsCol = el('div', { class: 'nft-selectors' });
    const previewCol = el('div', { class: 'nft-preview-col' });
    layout.append(selectorsCol, previewCol);
    editor.append(layout);
    // ---- 선택기(칩) 생성
    function createAttributeSelector(label, values, selected, onSelect) {
        const card = el('ion-card.attribute-selector');
        const header = el('ion-card-header', el('ion-card-title', label));
        const content = el('ion-card-content');
        const { categories: currentCategories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);
        const isPartLabel = currentCategories.some(c => c.name === label);
        for (const value of values) {
            // 이 값이 적용된 "가상 데이터" 준비
            const makePreviewData = () => {
                let previewData = cloneData(data);
                if (isPartLabel) {
                    previewData.parts[label] = value;
                    previewData = cleanData(previewData, partOptions, keyToFrame);
                }
                else {
                    previewData.traits = { ...(previewData.traits ?? {}), [label]: value };
                    const { categories: previewCats } = getPartCategoriesAndFrames(partOptions, keyToFrame, previewData.traits);
                    previewData.parts = buildDefaultParts(previewCats);
                    previewData = cleanData(previewData, partOptions, keyToFrame);
                }
                return previewData;
            };
            // 128×128 썸네일 컨테이너
            const thumbContainer = el('div.nft-thumb-128');
            try {
                const pd = makePreviewData();
                const { categories: previewCategories, keyToFrameFlat } = getPartCategoriesAndFrames(partOptions, keyToFrame, pd.traits);
                const thumbPreview = createPreview(previewCategories, keyToFrameFlat, pd, frames, spritesheetImagePath);
                thumbPreview.attachTo(thumbContainer);
            }
            catch { /* 썸네일 실패는 무시 */ }
            // chip 생성부 (핵심만 발췌)
            const isSelected = value === selected;
            // 체크 배지 (레이아웃에서 제외)
            const checkBadge = el('sl-icon', { name: 'check', class: 'check-badge', 'aria-hidden': 'true' });
            if (isSelected)
                thumbContainer.append(checkBadge);
            const chip = el(`ion-chip.attribute-item.tile${isSelected ? '.selected' : ''}`, { outline: true, color: isSelected ? 'primary' : 'medium' }, thumbContainer, el('ion-label', String(value)) // ← 아이콘은 더 이상 여기 두지 않습니다
            );
            // 클릭 시 선택 토글 반영
            chip.addEventListener('click', () => {
                onSelect(value);
            });
            content.append(chip);
        }
        card.append(header, content);
        return card;
    }
    // ---- 렌더(좌측만 갱신)
    function render() {
        selectorsCol.innerHTML = '';
        // Traits
        if (traitOptions && Object.keys(traitOptions).length > 0) {
            for (const [traitName, values] of Object.entries(traitOptions)) {
                const selected = (data.traits ?? {})[traitName];
                const selector = createAttributeSelector(traitName, values, selected ?? values[0], (val) => {
                    const next = cloneData(data);
                    next.traits = { ...(next.traits ?? {}), [traitName]: val };
                    const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, next.traits);
                    // 트레잇 변경 시 파츠 디폴트 재설정
                    next.parts = buildDefaultParts(categories);
                    data = cleanData(next, partOptions, keyToFrame);
                    render();
                    component.emit('dataChanged', data);
                });
                selectorsCol.append(selector);
            }
        }
        // Parts
        const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);
        for (const cat of categories) {
            const available = cat.parts.filter(p => partItemAvailable(p, data));
            if (available.length === 0)
                continue;
            // 선택값 보정
            const selectedName = data.parts[cat.name];
            const selectedExists = selectedName != null && available.some(p => p.name === selectedName);
            if (!selectedExists) {
                const next = cloneData(data);
                next.parts[cat.name] = available[0].name;
                data = cleanData(next, partOptions, keyToFrame);
            }
            const selector = createAttributeSelector(cat.name, available.map(p => p.name), data.parts[cat.name], (val) => {
                const next = cloneData(data);
                next.parts[cat.name] = val;
                data = cleanData(next, partOptions, keyToFrame);
                render();
                component.emit('dataChanged', data);
            });
            selectorsCol.append(selector);
        }
    }
    // 초기 페인트
    render();
    const component = new EditorComponent(editor, data, () => editor.remove());
    return component;
}
//# sourceMappingURL=editor.js.map