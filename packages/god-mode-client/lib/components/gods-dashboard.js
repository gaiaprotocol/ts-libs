import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import { createChart, LineSeries } from 'lightweight-charts';
import '../../src/components/gods-dashboard.css';
export function createGodsStatsDashboard() {
    // Header inside card body
    const header = el('div.gs-header');
    // Stats (left column)
    const statsCard = el('div.gs-panel', el('div.gs-section-title', el('sl-icon', { name: 'graph-up-arrow' }), 'Global Stats'), el('div.gs-stats', el('div.gs-stat', el('div.value', { 'data-field': 'holders' }, '—'), el('div.label', 'Total Unique Holders')), el('div.gs-stat', el('div.value', { 'data-field': 'floor' }, '—'), el('div.label', 'Floor Price (ETH)'))));
    // Trend (left column, below stats)
    const chartCard = el('div.gs-panel', el('div.gs-section-title', el('sl-icon', { name: 'activity' }), 'Trend'), el('sl-tab-group', { activation: 'manual', style: 'margin-bottom:8px;' }, el('sl-tab', { slot: 'nav', panel: 'holders', active: true }, 'Holders'), el('sl-tab', { slot: 'nav', panel: 'floor' }, 'Floor Price'), el('sl-tab-panel', { name: 'holders', active: true }), el('sl-tab-panel', { name: 'floor' })), el('div.gs-chart-wrap'), el('div.gs-sub', 'Plots the "stats" array as a time series.'));
    // About (right column)
    const aboutCard = el('div.gs-panel', el('div.gs-section-title', el('sl-icon', { name: 'info' }), 'About The Gods'), el('div', { class: 'gs-about' }, 'Explore the trend of unique holders and the floor price for The Gods NFT collection.'));
    const grid = el('div.gs-grid', 
    //aboutCard
    statsCard, chartCard);
    const root = el('section.gods-stats-dash', header, grid);
    // ---------- Chart ----------
    const chartWrap = chartCard.querySelector('.gs-chart-wrap');
    const tabGroup = chartCard.querySelector('sl-tab-group');
    let chart = null;
    let series = null;
    let currentMetric = 'numOwners';
    let lastRows = [];
    function isDark() {
        const de = document.documentElement;
        return de.classList.contains('sl-theme-dark')
            || de.classList.contains('dark')
            || window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }
    function ensureChart() {
        if (chart)
            return;
        chart = createChart(chartWrap, {
            autoSize: true,
            height: 360,
            layout: {
                background: { color: isDark() ? 'rgba(20,23,29,1)' : 'rgba(250,250,250,1)' },
                textColor: isDark() ? 'rgba(230,230,230,0.65)' : 'rgba(60,60,60,0.75)',
            },
            grid: {
                vertLines: { color: isDark() ? 'rgba(230,230,230,0.08)' : 'rgba(0,0,0,0.06)' },
                horzLines: { color: isDark() ? 'rgba(230,230,230,0.08)' : 'rgba(0,0,0,0.06)' },
            },
            timeScale: { timeVisible: true, secondsVisible: false },
        });
        series = chart.addSeries(LineSeries, { color: '#7C3AED' });
    }
    function setChart(metric, rows) {
        ensureChart();
        currentMetric = metric;
        const data = rows.map((r) => ({
            time: Math.floor(new Date(r.time).getTime() / 1000),
            value: metric === 'numOwners' ? r.num_owners : r.floor_price,
        }));
        series.setData(data);
        chart.timeScale().fitContent();
    }
    // ---------- Data ----------
    async function fetchGodsStats() {
        const res = await fetch(`${GAIA_API_BASE_URI}/gods-stats`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok)
            throw new Error('Failed to fetch /gods-stats');
        return res.json();
    }
    (async () => {
        try {
            const { stats, current } = await fetchGodsStats();
            // Current stats
            const holdersNode = statsCard.querySelector('[data-field="holders"]');
            const floorNode = statsCard.querySelector('[data-field="floor"]');
            holdersNode.textContent = current?.num_owners != null ? String(current.num_owners) : '—';
            floorNode.textContent = current?.floor_price != null ? String(current.floor_price) : '—';
            // Chart
            lastRows = stats ?? [];
            setChart('numOwners', lastRows);
            tabGroup.addEventListener('sl-tab-show', (e) => {
                const name = e.detail.name;
                if (name === 'holders' && currentMetric !== 'numOwners')
                    setChart('numOwners', lastRows);
                if (name === 'floor' && currentMetric !== 'floorPrice')
                    setChart('floorPrice', lastRows);
            });
        }
        catch (err) {
            root.append(el('sl-alert', { variant: 'danger', open: true }, 'Failed to load The Gods stats.'));
        }
    })();
    return root;
}
//# sourceMappingURL=gods-dashboard.js.map