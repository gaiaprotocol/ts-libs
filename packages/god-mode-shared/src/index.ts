import fireManParts from '../src/parts-jsons/fire-man-parts.json' assert { type: 'json' };
import fireWomanParts from '../src/parts-jsons/fire-woman-parts.json' assert { type: 'json' };
import stoneManParts from '../src/parts-jsons/stone-man-parts.json' assert { type: 'json' };
import stoneWomanParts from '../src/parts-jsons/stone-woman-parts.json' assert { type: 'json' };
import waterManParts from '../src/parts-jsons/water-man-parts.json' assert { type: 'json' };
import waterWomanParts from '../src/parts-jsons/water-woman-parts.json' assert { type: 'json' };

type ElementType = 'Stone' | 'Fire' | 'Water';
type GenderType = 'Man' | 'Woman';

const partsData: Record<ElementType, Record<GenderType, PartCategory[]>> = {
  Stone: { Man: stoneManParts, Woman: stoneWomanParts },
  Fire: { Man: fireManParts, Woman: fireWomanParts },
  Water: { Man: waterManParts, Woman: waterWomanParts },
} as const;

type GodMetadata = {
  type: ElementType;
  gender: GenderType;
  parts: { [category: string]: string };
};

type ImageInfo = {
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

type PartCategory = {
  name: string;
  parts: PartItem[];
};

function getCategories(type: ElementType, gender: GenderType): PartCategory[] {
  return partsData[type][gender];
}

function isPartAvailable(part: PartItem, metadata: GodMetadata): boolean {
  if (!part.condition) return true;

  let traitValue: string | undefined;
  if (part.condition.part === 'Type') traitValue = metadata.type;
  else if (part.condition.part === 'Gender') traitValue = metadata.gender;
  else traitValue = metadata.parts[part.condition.part];

  if (!traitValue) return false;
  return part.condition.values.includes(traitValue);
}

function getAvailablePartsForCategory(
  category: PartCategory,
  metadata: GodMetadata,
): PartItem[] {
  return category.parts.filter((part) => isPartAvailable(part, metadata));
}

export function getSelectedParts(metadata: GodMetadata): { [category: string]: PartItem } {
  const categories = getCategories(metadata.type, metadata.gender);
  const selectedParts: { [category: string]: PartItem } = {};

  for (const category of categories) {
    const availableParts = getAvailablePartsForCategory(category, metadata);
    const selectedPartName = metadata.parts[category.name];
    const selectedPart = availableParts.find((part) =>
      part.name === selectedPartName
    );
    if (selectedPart) selectedParts[category.name] = selectedPart;
  }

  return selectedParts;
}
