import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import '../../src/components/name-search-result.css';
const BLACKLIST_NAMES = ['gaia', 'gaiaprotocol', 'admin', 'null', 'root'];
function rowButton(opts) {
    const btn = el('button.list-row', {
        type: 'button',
        'ariaLabel': opts.ariaLabel ?? opts.title,
        onclick: opts.onClick,
        onkeydown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
            }
        }
    }, el('div', el('div.title', opts.title), opts.meta ? el('p.meta', opts.meta) : null), opts.suffixIcon
        ? el('sl-icon', { name: opts.suffixIcon, slot: 'suffix', 'ariaHidden': 'true' })
        : null);
    return btn;
}
async function createNameSearchResultContent(query) {
    const container = el('div.name-search-result-content');
    if (query.trim().length < 2) {
        container.append(el('sl-alert', { variant: 'neutral', open: true }, 'Please enter at least 2 characters.'));
        return container;
    }
    const spinner = el('sl-spinner', { style: 'margin: 1rem auto; display: block;' });
    container.append(spinner);
    let availableName;
    try {
        const res = await fetch(`${GAIA_API_BASE_URI}/search-names`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
        if (!res.ok)
            throw new Error('Search API failed');
        const result = await res.json();
        const names = result
            .map((r) => r.name)
            .filter((n) => !BLACKLIST_NAMES.includes(n.toLowerCase()));
        const exactMatch = names.some((n) => n.toLowerCase() === query.toLowerCase());
        // 리스트
        const list = el('div.result-list');
        for (const name of names) {
            const title = `${name}.gaia`;
            const meta = el('span', 'Registered ', el('sl-badge', { pill: true, variant: 'neutral', class: 'badge' }, 'taken'));
            list.append(rowButton({
                title,
                meta,
                suffixIcon: 'arrow-right',
                onClick: () => (location.href = `/${name}.gaia`),
                ariaLabel: `${title} (registered)`,
            }));
        }
        container.append(list);
        // 사용 가능
        if (!exactMatch && !BLACKLIST_NAMES.includes(query)) {
            // 구분선
            container.append(el('div.result-separator'));
            availableName = `${query}.gaia`;
            const available = el('div.available-name', el('h4', 'Available'), rowButton({
                title: availableName,
                suffixIcon: 'arrow-right',
                onClick: () => (location.href = `/${availableName}`),
                ariaLabel: `${availableName} (available)`,
            }));
            container.append(available);
        }
        if (names.length === 0 && !availableName) {
            container.append(el('sl-alert', { variant: 'neutral', open: true }, 'No matching names found.'));
        }
    }
    catch (e) {
        container.append(el('sl-alert', { variant: 'danger', open: true }, 'Failed to fetch search results.'));
    }
    finally {
        spinner.remove();
    }
    return container;
}
export { createNameSearchResultContent };
//# sourceMappingURL=name-search-result.js.map