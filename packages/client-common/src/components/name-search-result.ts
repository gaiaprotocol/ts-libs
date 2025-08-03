import '@ionic/core';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import '../../src/components/name-search-result.less';

declare const API_BASE_URL: string;

const BLACKLIST_NAMES = ['gaia', 'gaiaprotocol', 'admin', 'null', 'root'];

async function createNameSearchResultContent(query: string): Promise<HTMLElement> {
  const container = el('div.name-search-result-content');

  const spinner = el('sl-spinner', {
    style: 'margin: 1rem auto; display: block;',
  });
  container.append(spinner);

  let availableName: string | undefined;

  try {
    const res = await fetch(`${API_BASE_URL}/search-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error('Search API failed');
    }

    const result: { name: string }[] = await res.json();
    const names = result
      .map((r) => r.name)
      .filter((n) => !BLACKLIST_NAMES.includes(n.toLowerCase()));

    const exactMatch = names.some((n) => n.toLowerCase() === query.toLowerCase());

    const list = el('ion-list');

    for (const name of names) {
      list.append(
        el('ion-item', {
          button: true,
          onclick: () => location.href = `/${name}.gaia`,
        },
          el('ion-label',
            el('h3', `${name}.gaia`),
            el('p', 'Registered')
          )
        )
      );
    }

    container.append(list);

    if (!exactMatch && !BLACKLIST_NAMES.includes(query)) {
      availableName = `${query}.gaia`;

      const available = el('div.available-name',
        el('h4', 'Available'),
        el('ion-item', {
          button: true,
          color: 'success',
          onclick: () => location.href = `/${availableName}/register`,
        },
          el('ion-label', availableName),
          el('sl-icon', {
            name: 'arrow-right',
            slot: 'end',
            style: 'margin-left: 0.5rem;',
          }),
        )
      );
      container.append(available);
    }

    if (names.length === 0 && !availableName) {
      container.append(
        el('sl-alert', { variant: 'neutral', open: true },
          el('span', { slot: 'message' }, 'No matching names found.')
        )
      );
    }

  } catch (e) {
    container.append(
      el('sl-alert', { variant: 'danger', open: true },
        el('span', { slot: 'message' }, 'Failed to fetch search results.')
      )
    );
  } finally {
    spinner.remove();
  }

  return container;
}

export { createNameSearchResultContent };
