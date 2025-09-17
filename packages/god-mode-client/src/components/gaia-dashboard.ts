import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import '../../src/components/gaia-dashboard.css';
import { createGodsStatsDashboard } from './gods-dashboard';

export function createGaiaProtocolDashboard(): HTMLElement {
  const header = el(
    'div.header',
    el('sl-icon', { name: 'activity' }),
    el('h2', { style: 'margin:0;' }, 'Gaia Protocol Dashboard'),
  );

  const overviewCard = el(
    'sl-card',
    { class: 'overview' },
    el('div.section-title', el('sl-icon', { name: 'info' }), 'Overview'),
    el('div.body',
      'A quick view of key metrics and collection status across Gaia Protocol.'
    ),
  );

  // GODS (NFT) SECTION — full width
  const godsHeader = el(
    'div.gods-section-header',
    el('sl-icon', { name: 'person-square' }),
    el('h3', 'The Gods (NFT)'),
  );

  const godsCard = el(
    'sl-card',
    { class: 'gods' },
    godsHeader,
    createGodsStatsDashboard(),
  );

  // $GAIA TOKEN SECTION — placeholder (to be implemented later)
  // const gaiaTokenCard = el(
  //   'sl-card',
  //   { class: 'gaia-token' },
  //   el('div.section-title', el('sl-icon', { name: 'coins' }), '$GAIA Token'),
  //   el('div.body', 'Coming soon.'),
  // );

  const grid = el('div.grid',
    //overviewCard,
    godsCard,
    // gaiaTokenCard,
  );

  return el('main.gaia-dashboard', el('div.container', /*header,*/ grid));
}
