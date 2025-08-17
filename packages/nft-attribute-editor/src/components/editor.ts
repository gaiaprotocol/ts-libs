import '@ionic/core';
import { defineCustomElements } from '@ionic/core/loader';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import { DomGameObject } from 'kiwiengine';
import { KeyToFrame } from '../types/frame';
import { NftData, PartOptions } from '../types/nft';
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

function createAttributeSelector<T extends string | number>(
  label: string,
  values: readonly T[],
  selected: T,
  onSelect: (value: T) => void
): HTMLElement {
  const card = el('ion-card.attribute-selector');

  const header = el('ion-card-header', el('ion-card-title', label));
  const content = el('ion-card-content');

  for (const value of values) {
    const previewContainer = el();
    const preview = new DomGameObject(); //TODO
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

export function createNftAttributeEditor(options: NftAttributeEditorOptions) {
  const { traitOptions, partOptions, baseData, keyToFrame } = options;

  const editor = el('ion-content.nft-attribute-editor', { class: 'ion-padding' });
  let data = baseData;

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
