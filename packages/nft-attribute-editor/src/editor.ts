import '@ionic/core';
import { defineCustomElements } from '@ionic/core/loader';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import { EventEmitter } from '@webtaku/event-emitter';
import { DomAnimatedSpriteObject, DomGameObject, domPreload } from 'kiwiengine';
import '../src/editor.css';
import { KeyToFrame } from './types/frame';
import { NftData, PartCategory, PartOptions } from './types/nft';
import { SpritesheetData } from './types/spritesheet';
import { buildDefaultParts, cleanData, cloneData, getPartCategoriesAndFrames, partItemAvailable } from './utils/derive';

defineCustomElements(window);

type NftAttributeEditorOptions = {
  traitOptions?: { [traitName: string]: string[] };
  partOptions: PartOptions;
  baseData: NftData;
  keyToFrame: KeyToFrame;
  spritesheet: SpritesheetData;
  spritesheetImagePath: string;
};

class EditorComponent extends EventEmitter<{
  dataChanged: (data: NftData) => void,
}> {
  constructor(
    public el: HTMLElement,
    public data: NftData,
    public remove: () => void,
  ) {
    super();
  }
}

/** 합성 프리뷰 생성 (큰/작은 공용) */
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
    if (!category) continue;

    const part = category.parts.find((p) => p.name === partValue);
    if (!part?.images || part.images.length === 0) continue;

    // drawOrder 기준 정렬(있다면)
    const images = [...part.images].sort((a, b) => (a.drawOrder ?? 0) - (b.drawOrder ?? 0));

    for (const image of images) {
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

  return preview;
}

/** 에디터 생성 (좌측: 선택기, 우측: 고정 프리뷰) */
export async function createNftAttributeEditor(options: NftAttributeEditorOptions) {
  const {
    traitOptions,
    partOptions,
    baseData,
    keyToFrame,
    spritesheet,
    spritesheetImagePath
  } = options;

  await domPreload([spritesheetImagePath]);

  // 루트
  const editor = el('ion-content.nft-attribute-editor', { class: 'ion-padding' });

  // ---- 상태
  let data = baseData;

  // ---- 레이아웃 (좌/우)
  const layout = el('div', { class: 'nft-editor-layout' });
  const selectorsCol = el('div', { class: 'nft-selectors' });
  const previewCol = el('div', { class: 'nft-preview-col' });

  // 우측 프리뷰 카드
  const previewMount = el('div', { class: 'nft-preview-mount' });
  previewCol.append(
    el('ion-card',
      el('ion-card-header', el('ion-card-title', 'Preview')),
      el('ion-card-content', previewMount)
    )
  );

  layout.append(selectorsCol, previewCol);
  editor.append(layout);

  // ---- 프리뷰 제어
  let currentPreview: DomGameObject | null = null;

  function mountPreview(previewObj: DomGameObject) {
    previewMount.innerHTML = '';
    previewObj.attachToDom(previewMount);
    currentPreview = previewObj;
  }

  function updatePreview(previewData: NftData) {
    const { categories: catsForPreview } = getPartCategoriesAndFrames(
      partOptions,
      keyToFrame,
      previewData.traits
    );
    const p = createPreview(
      catsForPreview,
      keyToFrame,
      previewData,
      spritesheet,
      spritesheetImagePath
    );
    mountPreview(p);
  }

  // ---- 선택기(칩) 생성
  function createAttributeSelector<T extends string | number>(
    label: string,
    values: readonly T[],
    selected: T,
    onSelect: (value: T) => void
  ): HTMLElement {
    const card = el('ion-card.attribute-selector');
    const header = el('ion-card-header', el('ion-card-title', label));
    const content = el('ion-card-content');

    // 현재 카탈로그(이 label이 파츠인지 트레잇인지 판별)
    const { categories: currentCategories } = getPartCategoriesAndFrames(
      partOptions, keyToFrame, data.traits
    );
    const isPartLabel = currentCategories.some(c => c.name === label);

    for (const value of values) {
      // 작은 썸네일(원하지 않으면 아예 제거 가능)
      const thumbContainer = el('div.nft-thumb');

      // 이 칩을 적용했을 때의 "가상 데이터" 만들기
      const makePreviewData = () => {
        let previewData = cloneData(data);

        if (isPartLabel) {
          previewData.parts[label] = value as any;
          previewData = cleanData(previewData, partOptions, keyToFrame);
        } else {
          previewData.traits = { ...(previewData.traits ?? {}), [label]: value as any };
          const { categories: previewCats } = getPartCategoriesAndFrames(
            partOptions, keyToFrame, previewData.traits
          );
          previewData.parts = buildDefaultParts(previewCats);
          previewData = cleanData(previewData, partOptions, keyToFrame);
        }
        return previewData;
      };

      // 썸네일은 현재 데이터로 간단히 렌더(비용 줄이려면 스킵 가능)
      try {
        const { categories: previewCategories } = getPartCategoriesAndFrames(
          partOptions, keyToFrame, data.traits
        );
        const thumbPreview = createPreview(
          previewCategories, keyToFrame, data, spritesheet, spritesheetImagePath
        );
        thumbPreview.attachToDom(thumbContainer);
      } catch { /* 썸네일 실패 무시 */ }

      const chip = el(
        'ion-chip.attribute-item',
        {
          outline: true,
          color: value === selected ? 'primary' : 'medium',
          onclick: () => {
            onSelect(value);
            updatePreview(data); // 확정 상태 반영
          },
          onmouseenter: () => {
            const pd = makePreviewData();
            updatePreview(pd);   // 가상 상태 미리보기
          },
          onmouseleave: () => {
            updatePreview(data); // 원복
          },
        },
        thumbContainer,
        el('ion-label', String(value)),
        value === selected ? el('sl-icon', { name: 'check', style: 'margin-left:4px;' }) : null
      );

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
        const selected = (data.traits ?? {})[traitName] as string | number | undefined;
        const selector = createAttributeSelector<string | number>(
          traitName,
          values,
          selected ?? values[0],
          (val) => {
            const next = cloneData(data);
            next.traits = { ...(next.traits ?? {}), [traitName]: val };

            const { categories } = getPartCategoriesAndFrames(
              partOptions, keyToFrame, next.traits
            );
            // 트레잇 변경 시 파츠 디폴트 재설정
            next.parts = buildDefaultParts(categories);
            data = cleanData(next, partOptions, keyToFrame);

            render();
            updatePreview(data);
            component.emit('dataChanged', data);
          }
        );
        selectorsCol.append(selector);
      }
    }

    // Parts
    const { categories } = getPartCategoriesAndFrames(partOptions, keyToFrame, data.traits);

    for (const cat of categories) {
      const available = cat.parts.filter(p => partItemAvailable(p, data));
      if (available.length === 0) continue;

      // 선택값 보정
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
          updatePreview(data);
          component.emit('dataChanged', data);
        }
      );
      selectorsCol.append(selector);
    }
  }

  // 초기 페인트
  render();
  updatePreview(data);

  const component = new EditorComponent(editor, data, () => editor.remove());
  return component;
}
