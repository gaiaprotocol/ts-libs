import '@ionic/core';
import { defineCustomElements } from '@ionic/core/loader';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import { DomAnimatedSpriteObject, DomGameObject } from 'kiwiengine';
import { KeyToFrame } from '../types/frame';
import { NftData, PartCategory, PartOptions } from '../types/nft';
import { SpritesheetData } from '../types/spritesheet';
import { buildDefaultParts, cleanData, cloneData, getPartCategoriesAndFrames, partItemAvailable } from '../utils/derive';
import { Component } from './component';

defineCustomElements(window);

type NftAttributeEditorOptions = {
  traitOptions?: { [traitName: string]: string[] };
  partOptions: PartOptions;
  baseData: NftData;
  keyToFrame: KeyToFrame;
  spritesheet: SpritesheetData;
  spritesheetImagePath: string;
};

class EditorComponent extends Component<{
  dataChanged: (data: NftData) => void,
}> {
  constructor(el: HTMLElement, public data: NftData, remove: () => void) {
    super(el, remove);
  }
}

function createPreview(
  categories: PartCategory[],
  keyToFrame: KeyToFrame,
  data: NftData,
  spritesheet: SpritesheetData,
  spritesheetImagePath: string,
) {
  const preview = new DomGameObject();

  for (const [partName, partValue] of Object.entries(data.parts)) {
    const category = categories.find((cat) => cat.name === partName);
    if (category) {
      const part = category.parts.find((p) => p.name === partValue);
      if (part?.images) {
        for (const image of part.images) {
          const frame = keyToFrame[image.path];
          if (!frame) continue;

          const sprite = new DomAnimatedSpriteObject({
            src: spritesheetImagePath,
            atlas: { ...spritesheet, animations: { [frame as string]: [frame as string] } },
            animation: frame as string,
            fps: 1,
            loop: false,
            drawOrder: image.drawOrder,
          });

          preview.add(sprite);
        }
      }
    }
  }

  return preview;
}

export function createNftAttributeEditor(options: NftAttributeEditorOptions) {
  const {
    traitOptions,
    partOptions,
    baseData,
    keyToFrame,
    spritesheet,
    spritesheetImagePath
  } = options;

  const editor = el('ion-content.nft-attribute-editor', { class: 'ion-padding' });
  let data = baseData;

  // 공용: 라벨/값 목록을 받아 미리보기+칩을 만드는 헬퍼
  function createAttributeSelector<T extends string | number>(
    label: string,
    values: readonly T[],
    selected: T,
    onSelect: (value: T) => void
  ): HTMLElement {
    const card = el('ion-card.attribute-selector');

    const header = el('ion-card-header', el('ion-card-title', label));
    const content = el('ion-card-content');

    // 현재 traits 기준 카탈로그
    const { categories: currentCategories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);

    const isPartLabel = currentCategories.some(c => c.name === label);

    for (const value of values) {
      const previewContainer = el();

      // 미리보기에 적용될 가상 데이터 구성
      let previewData = cloneData(data);

      if (isPartLabel) {
        // 파츠 선택의 프리뷰: 해당 파츠만 교체 후 정리
        previewData.parts[label] = value as any;
        previewData = cleanData(previewData, partOptions, keyToFrame);
      } else {
        // 트레이트 선택의 프리뷰: 트레이트 적용 → 카탈로그 재계산 → 디폴트 파츠 재구성
        previewData.traits = { ...(previewData.traits ?? {}), [label]: value as any };
        const { categories: previewCats } = getPartCategoriesAndFrames(partOptions, keyToFrame, previewData.traits);
        previewData.parts = buildDefaultParts(previewCats);
        previewData = cleanData(previewData, partOptions, keyToFrame);
      }

      // 미리보기용 카테고리 (트레이트 변경 시에는 새 카탈로그를 써야 함)
      const { categories: previewCategories } = getPartCategoriesAndFrames(
        partOptions,
        keyToFrame,
        previewData.traits
      );

      const preview = createPreview(
        previewCategories,
        keyToFrame,
        previewData,
        spritesheet,
        spritesheetImagePath
      );
      preview.attachToDom(previewContainer);

      const chip = el(
        'ion-chip.attribute-item',
        {
          outline: true,
          color: value === selected ? 'primary' : 'medium',
          onclick: () => onSelect(value),
        },
        previewContainer,
        el('ion-label', String(value)),
        value === selected ? el('sl-icon', { name: 'check', style: 'margin-left:4px;' }) : null
      );
      content.append(chip);
    }

    card.append(header, content);
    return card;
  }

  function render() {
    editor.innerHTML = '';

    // ── Traits (optional) ────────────────────────────────────────────────────
    if (traitOptions && Object.keys(traitOptions).length > 0) {
      for (const [traitName, values] of Object.entries(traitOptions)) {
        const selected = (data.traits ?? {})[traitName] as string | number | undefined;
        const selector = createAttributeSelector<string | number>(
          traitName,
          values,
          selected ?? values[0],
          (val) => {
            const next = cloneData(data);
            next.traits = { ...(next.traits ?? {}), [traitName]: val };

            const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, next.traits);
            // On trait change, reset parts to default of the new catalog
            next.parts = buildDefaultParts(categories);
            cleanData(next, partOptions, keyToFrame);

            data = next;
            render();
            component.emit('dataChanged', data);
          }
        );
        editor.append(selector);
      }
    }

    // ── Parts by derived catalog ─────────────────────────────────────────────
    const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);

    for (const cat of categories) {
      // available parts by condition
      const available = cat.parts.filter(p => partItemAvailable(p, data));
      if (available.length === 0) continue;

      // ensure selected exists in available
      const selectedName = data.parts[cat.name] as string | number | undefined;
      const selectedExists = selectedName != null && available.some(p => p.name === selectedName);
      if (!selectedExists) {
        const next = cloneData(data);
        next.parts[cat.name] = available[0].name;
        data = cleanData(next, partOptions, keyToFrame);
      }

      const selector = createAttributeSelector<string | number>(
        cat.name,
        available.map(p => p.name),
        data.parts[cat.name] as string | number,
        (val) => {
          const next = cloneData(data);
          next.parts[cat.name] = val;
          data = cleanData(next, partOptions, keyToFrame);
          render();
          component.emit('dataChanged', data);
        }
      );
      editor.append(selector);
    }
  }

  // first paint
  render();

  const component = new EditorComponent(editor, data, () => editor.remove());
  return component;
}
