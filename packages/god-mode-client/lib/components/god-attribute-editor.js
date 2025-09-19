import '@ionic/core';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import fireManParts from './parts/fire-man-parts.json' assert { type: 'json' };
import fireWomanParts from './parts/fire-woman-parts.json' assert { type: 'json' };
import stoneManParts from './parts/stone-man-parts.json' assert { type: 'json' };
import stoneWomanParts from './parts/stone-woman-parts.json' assert { type: 'json' };
import waterManParts from './parts/water-man-parts.json' assert { type: 'json' };
import waterWomanParts from './parts/water-woman-parts.json' assert { type: 'json' };
const partsData = {
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
};
class PartSelector {
    getTraits(type, gender) {
        return partsData[type][gender];
    }
    #isPartAvailable(part, metadata) {
        if (!part.condition) {
            return true;
        }
        let traitValue;
        if (part.condition.trait === 'Type') {
            traitValue = metadata.type;
        }
        else if (part.condition.trait === 'Gender') {
            traitValue = metadata.gender;
        }
        else {
            traitValue = metadata.parts[part.condition.trait];
        }
        if (!traitValue) {
            return false;
        }
        return part.condition.values.includes(traitValue);
    }
    getAvailablePartsForTrait(trait, metadata) {
        return trait.parts.filter((part) => this.#isPartAvailable(part, metadata));
    }
    getSelectedParts(metadata) {
        const traits = this.getTraits(metadata.type, metadata.gender);
        const selectedParts = {};
        for (const trait of traits) {
            const availableParts = this.getAvailablePartsForTrait(trait, metadata);
            const selectedPartName = metadata.parts[trait.name];
            const selectedPart = availableParts.find((part) => part.name === selectedPartName);
            if (selectedPart)
                selectedParts[trait.name] = selectedPart;
        }
        return selectedParts;
    }
    getDefaultParts(type, gender) {
        const traits = this.getTraits(type, gender);
        const defaultParts = {};
        for (const trait of traits) {
            if (trait.parts.length > 0) {
                defaultParts[trait.name] = trait.parts[0].name;
            }
        }
        return defaultParts;
    }
    validateMetadata(metadata) {
        const errors = [];
        const traits = this.getTraits(metadata.type, metadata.gender);
        for (const trait of traits) {
            const availableParts = this.getAvailablePartsForTrait(trait, metadata);
            const selectedPartName = metadata.parts[trait.name];
            if (availableParts.length === 0) {
                if (selectedPartName) {
                    errors.push(`No parts are available for trait '${trait.name}', but a part '${selectedPartName}' is selected.`);
                }
                continue;
            }
            if (!selectedPartName) {
                errors.push(`Missing part for trait '${trait.name}'.`);
                continue;
            }
            const part = availableParts.find((p) => p.name === selectedPartName);
            if (!part) {
                errors.push(`Invalid part '${selectedPartName}' selected for trait '${trait.name}'.`);
                continue;
            }
        }
        return errors;
    }
}
const partSelector = new PartSelector();
function createAttributeSelector(label, values, selected, onSelect) {
    const container = el('ion-card.attribute-selector');
    const header = el('ion-card-header', el('ion-card-title', label));
    const content = el('ion-card-content');
    for (const value of values) {
        const item = el('ion-chip.attribute-item', {
            outline: true,
            color: value === selected ? 'primary' : 'medium',
            onclick: () => onSelect(value),
        }, el('ion-label', String(value)), value === selected ? el('sl-icon', { name: 'check', style: 'margin-left: 4px;' }) : null);
        content.append(item);
    }
    container.append(header, content);
    return container;
}
export async function createGodAttributeEditor(metadata, onChange) {
    const container = el('ion-content.god-attribute-editor', { class: 'ion-padding' });
    const render = () => {
        container.innerHTML = '';
        const typeSelector = createAttributeSelector('Element Type', ['Stone', 'Fire', 'Water'], metadata.type, (value) => {
            metadata.type = value;
            metadata.parts = partSelector.getDefaultParts(value, metadata.gender);
            render();
            onChange(metadata);
        });
        container.append(typeSelector);
        const genderSelector = createAttributeSelector('Gender', ['Man', 'Woman'], metadata.gender, (value) => {
            metadata.gender = value;
            metadata.parts = partSelector.getDefaultParts(metadata.type, value);
            render();
            onChange(metadata);
        });
        container.append(genderSelector);
        const traits = partSelector.getTraits(metadata.type, metadata.gender);
        for (const trait of traits) {
            const parts = partSelector.getAvailablePartsForTrait(trait, metadata);
            if (parts.length === 0)
                continue;
            if (!metadata.parts[trait.name] || !parts.find(p => p.name === metadata.parts[trait.name])) {
                metadata.parts[trait.name] = parts[0].name;
            }
            const selector = createAttributeSelector(trait.name, parts.map(p => p.name), metadata.parts[trait.name], (partName) => {
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
//# sourceMappingURL=god-attribute-editor.js.map