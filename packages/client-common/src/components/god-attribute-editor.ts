import '@ionic/core';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import fireManParts from './parts/fire-man-parts.json';
import fireWomanParts from './parts/fire-woman-parts.json';
import stoneManParts from './parts/stone-man-parts.json';
import stoneWomanParts from './parts/stone-woman-parts.json';
import waterManParts from './parts/water-man-parts.json';
import waterWomanParts from './parts/water-woman-parts.json';

type ElementType = 'Stone' | 'Fire' | 'Water';
type GenderType = 'Man' | 'Woman';

interface GodMetadata {
  type: ElementType;
  gender: GenderType;
  parts: { [trait: string]: string };
}

interface ImageInfo {
  path: string;
  order: number;
}

interface PartCondition {
  trait: string;
  values: string[];
}

interface Part {
  name: string;
  images?: ImageInfo[];
  percent?: number;
  condition?: PartCondition;
}

interface Trait {
  name: string;
  parts: Part[];
}

const partsData: Record<ElementType, Record<GenderType, Trait[]>> = {
  Stone: {
    Man: stoneManParts,
    Woman: stoneWomanParts,
  },
  Fire: {
    Man: fireManParts,
    Woman: fireWomanParts,
  },
  Water: {
    Man: waterManParts,
    Woman: waterWomanParts,
  },
} as const;

class PartSelector {
  getTraits(type: ElementType, gender: GenderType): Trait[] {
    return partsData[type][gender];
  }

  #isPartAvailable(part: Part, metadata: GodMetadata): boolean {
    if (!part.condition) {
      return true;
    }

    let traitValue: string | undefined;

    if (part.condition.trait === 'Type') {
      traitValue = metadata.type;
    } else if (part.condition.trait === 'Gender') {
      traitValue = metadata.gender;
    } else {
      traitValue = metadata.parts[part.condition.trait];
    }

    if (!traitValue) {
      return false;
    }

    return part.condition.values.includes(traitValue);
  }

  getAvailablePartsForTrait(
    trait: Trait,
    metadata: GodMetadata,
  ): Part[] {
    return trait.parts.filter((part) => this.#isPartAvailable(part, metadata));
  }

  getSelectedParts(metadata: GodMetadata): { [trait: string]: Part } {
    const traits = this.getTraits(metadata.type, metadata.gender);
    const selectedParts: { [trait: string]: Part } = {};

    for (const trait of traits) {
      const availableParts = this.getAvailablePartsForTrait(trait, metadata);
      const selectedPartName = metadata.parts[trait.name];
      const selectedPart = availableParts.find((part) =>
        part.name === selectedPartName
      );
      if (selectedPart) selectedParts[trait.name] = selectedPart;
    }

    return selectedParts;
  }

  getDefaultParts(type: ElementType, gender: GenderType) {
    const traits = this.getTraits(type, gender);
    const defaultParts: { [trait: string]: string } = {};

    for (const trait of traits) {
      if (trait.parts.length > 0) {
        defaultParts[trait.name] = trait.parts[0].name;
      }
    }

    return defaultParts;
  }

  validateMetadata(metadata: GodMetadata): string[] {
    const errors: string[] = [];
    const traits = this.getTraits(metadata.type, metadata.gender);

    for (const trait of traits) {
      const availableParts = this.getAvailablePartsForTrait(trait, metadata);
      const selectedPartName = metadata.parts[trait.name];

      if (availableParts.length === 0) {
        if (selectedPartName) {
          errors.push(
            `No parts are available for trait '${trait.name}', but a part '${selectedPartName}' is selected.`,
          );
        }
        continue;
      }

      if (!selectedPartName) {
        errors.push(`Missing part for trait '${trait.name}'.`);
        continue;
      }

      const part = availableParts.find((p) => p.name === selectedPartName);

      if (!part) {
        errors.push(
          `Invalid part '${selectedPartName}' selected for trait '${trait.name}'.`,
        );
        continue;
      }
    }

    return errors;
  }
}

const partSelector = new PartSelector();

function createAttributeSelector<T>(label: string, values: T[], selected: T, onSelect: (value: T) => void): HTMLElement {
  const container = el('ion-card.attribute-selector');

  const header = el('ion-card-header',
    el('ion-card-title', label)
  );
  const content = el('ion-card-content');

  for (const value of values) {
    const item = el('ion-chip.attribute-item', {
      outline: true,
      color: value === selected ? 'primary' : 'medium',
      onclick: () => onSelect(value),
    },
      el('ion-label', String(value)),
      value === selected ? el('sl-icon', { name: 'check', style: 'margin-left: 4px;' }) : null
    );
    content.append(item);
  }

  container.append(header, content);
  return container;
}

export async function createGodAttributeEditor(metadata: GodMetadata, onChange: (updated: GodMetadata) => void): Promise<HTMLElement> {
  const container = el('ion-content.god-attribute-editor', { class: 'ion-padding' });

  const render = () => {
    container.innerHTML = '';

    const typeSelector = createAttributeSelector<ElementType>('Element Type', ['Stone', 'Fire', 'Water'], metadata.type, (value) => {
      metadata.type = value;
      metadata.parts = partSelector.getDefaultParts(value, metadata.gender);
      render();
      onChange(metadata);
    });
    container.append(typeSelector);

    const genderSelector = createAttributeSelector<GenderType>('Gender', ['Man', 'Woman'], metadata.gender, (value) => {
      metadata.gender = value;
      metadata.parts = partSelector.getDefaultParts(metadata.type, value);
      render();
      onChange(metadata);
    });
    container.append(genderSelector);

    const traits = partSelector.getTraits(metadata.type, metadata.gender);

    for (const trait of traits) {
      const parts = partSelector.getAvailablePartsForTrait(trait, metadata);
      if (parts.length === 0) continue;

      if (!metadata.parts[trait.name] || !parts.find(p => p.name === metadata.parts[trait.name])) {
        metadata.parts[trait.name] = parts[0].name;
      }

      const selector = createAttributeSelector<string>(trait.name, parts.map(p => p.name), metadata.parts[trait.name], (partName) => {
        metadata.parts[trait.name] = partName;
        render();
        onChange(metadata);
      });
      container.append(selector);
    }
  };

  render();
  return container;
}