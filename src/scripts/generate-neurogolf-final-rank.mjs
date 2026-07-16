import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputPath = path.join(projectRoot, 'blog/images/neurogolf-last-55-hours-rank.svg');

const checkpoints = [
  ['2026-07-13T16:43:47.000Z', 168],
  ['2026-07-13T16:57:44.000Z', 154],
  ['2026-07-13T19:10:22.000Z', 150],
  ['2026-07-13T20:39:21.000Z', 151],
  ['2026-07-13T21:31:07.000Z', 152],
  ['2026-07-13T21:47:47.000Z', 151],
  ['2026-07-13T23:04:12.000Z', 152],
  ['2026-07-13T23:16:03.000Z', 151],
  ['2026-07-14T01:46:50.000Z', 151],
  ['2026-07-14T02:14:08.000Z', 153],
  ['2026-07-14T03:11:58.000Z', 152],
  ['2026-07-14T03:57:01.000Z', 150],
  ['2026-07-14T04:33:42.000Z', 147],
  ['2026-07-14T10:25:51.000Z', 146],
  ['2026-07-14T14:18:38.000Z', 149],
  ['2026-07-14T14:48:46.000Z', 150],
  ['2026-07-14T18:55:45.000Z', 152],
  ['2026-07-14T21:07:18.000Z', 153],
  ['2026-07-14T23:52:25.000Z', 150],
  ['2026-07-15T01:06:55.000Z', 152],
  ['2026-07-15T01:41:44.000Z', 154],
  ['2026-07-15T02:24:29.000Z', 155],
  ['2026-07-15T04:40:53.000Z', 120],
  ['2026-07-15T04:53:05.000Z', 121],
  ['2026-07-15T05:50:44.000Z', 122],
  ['2026-07-15T07:41:28.000Z', 123],
  ['2026-07-15T11:59:32.000Z', 127],
  ['2026-07-15T13:40:48.000Z', 122],
  ['2026-07-15T15:49:28.000Z', 125],
  ['2026-07-15T16:47:11.000Z', 124],
  ['2026-07-15T17:35:20.000Z', 116],
  ['2026-07-15T18:06:57.000Z', 115],
  ['2026-07-15T20:35:54.000Z', 105],
  ['2026-07-15T21:36:18.000Z', 100],
  ['2026-07-15T23:38:37.000Z', 96],
  ['2026-07-15T23:46:09.000Z', 96],
  ['2026-07-15T23:51:24.000Z', 97],
].map(([date, rank]) => ({ timestamp: new Date(date), rank }));

const width = 1200;
const height = 640;
const left = 92;
const right = 1138;
const top = 164;
const bottom = 542;
const minRank = 90;
const maxRank = 175;
const start = checkpoints[0].timestamp.valueOf();
const end = checkpoints.at(-1).timestamp.valueOf();

const x = (timestamp) => left + ((timestamp.valueOf() - start) / (end - start)) * (right - left);
const y = (rank) => top + ((rank - minRank) / (maxRank - minRank)) * (bottom - top);
const fmt = (value) => Number(value.toFixed(2));

const points = checkpoints.map((point) => `${fmt(x(point.timestamp))},${fmt(y(point.rank))}`).join(' ');
const area = `${left},${bottom} ${points} ${right},${bottom}`;
const rankTicks = [90, 100, 125, 151, 175];
const grids = rankTicks.map((rank) => `    <line x1="${left}" y1="${fmt(y(rank))}" x2="${right}" y2="${fmt(y(rank))}"/>`).join('\n');
const rankLabels = rankTicks.map((rank) => `    <text x="${left - 16}" y="${fmt(y(rank) + 5)}" text-anchor="end">${rank}</text>`).join('\n');
const dots = checkpoints.map((point, index) => {
  const final = index === checkpoints.length - 1;
  return `    <circle cx="${fmt(x(point.timestamp))}" cy="${fmt(y(point.rank))}" r="${final ? 9 : 4}" class="${final ? 'final-dot' : 'rank-dot'}"/>`;
}).join('\n');

const dateTicks = [
  { timestamp: checkpoints[0].timestamp, label: 'JUL 13' },
  { timestamp: new Date('2026-07-14T12:00:00.000Z'), label: 'JUL 14' },
  { timestamp: new Date('2026-07-15T12:00:00.000Z'), label: 'JUL 15' },
  { timestamp: checkpoints.at(-1).timestamp, label: '23:51' },
];
const dateLabels = dateTicks.map((tick) => `    <text x="${fmt(x(tick.timestamp))}" y="588" text-anchor="middle">${tick.label}</text>`).join('\n');

const first = checkpoints[0];
const preJumpLow = checkpoints[21];
const jump = checkpoints[22];
const midDip = checkpoints[26];
const topHundred = checkpoints[33];
const final = checkpoints.at(-1);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Rank over the final 55 hours</title>
  <desc id="desc">My NeuroGolf leaderboard rank moved from 168 on July 13 to 97 at the finish on July 15, repeatedly crossing the rank-151 silver cutoff before climbing 71 places.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#090c0a"/>
      <stop offset="1" stop-color="#101712"/>
    </linearGradient>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7ce38b" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#7ce38b" stop-opacity="0.015"/>
    </linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
      .mono { font-family: "JetBrains Mono", Consolas, monospace; }
      .eyebrow { font-size: 17px; font-weight: 600; letter-spacing: 2.7px; fill: #7ce38b; }
      .headline { font-size: 38px; font-weight: 700; fill: #edf4ee; }
      .summary { font-size: 17px; font-weight: 700; fill: #7ce38b; }
      .axis { font-size: 13px; fill: #8d998f; }
      .axis-title { font-size: 12px; font-weight: 700; letter-spacing: 1.8px; fill: #758078; }
      .value { font-size: 14px; font-weight: 700; fill: #edf4ee; }
      .final-value { font-size: 16px; font-weight: 800; fill: #f1b45b; }
      .silver { font-size: 13px; font-weight: 700; fill: #7ce38b; }
      .grid { stroke: #283129; stroke-width: 1; }
      .rank-dot { fill: #0a0c0a; stroke: #7ce38b; stroke-width: 3; }
      .final-dot { fill: #f1b45b; stroke: #fff1d4; stroke-width: 3; filter: url(#glow); }
    </style>
  </defs>

  <rect x="1" y="1" width="1198" height="638" rx="20" fill="url(#bg)" stroke="#2a342c" stroke-width="2"/>
  <text x="58" y="48" class="mono eyebrow">JUL 13–15, 2026</text>
  <text x="58" y="92" class="sans headline">Rank over the final 55 hours</text>
  <text x="1138" y="88" class="mono summary" text-anchor="end">168 → 97 · 71 PLACES</text>

  <text x="58" y="146" class="mono axis-title">RANK</text>
  <rect x="${left}" y="${top}" width="${right - left}" height="${fmt(y(151) - top)}" fill="#7ce38b" opacity="0.035"/>
  <g class="grid">
${grids}
  </g>
  <g class="mono axis">
${rankLabels}
  </g>
  <line x1="${left}" y1="${fmt(y(151))}" x2="${right}" y2="${fmt(y(151))}" stroke="#7ce38b" stroke-width="1.5" stroke-dasharray="5 7" opacity="0.8"/>
  <text x="${right}" y="${fmt(y(151) - 10)}" class="mono silver" text-anchor="end">SILVER · 151</text>

  <polygon points="${area}" fill="url(#area)"/>
  <polyline points="${points}" fill="none" stroke="#7ce38b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <g>
${dots}
  </g>

  <text x="${fmt(x(first.timestamp) + 14)}" y="${fmt(y(first.rank) - 14)}" class="mono value">168</text>
  <text x="${fmt(x(preJumpLow.timestamp) - 8)}" y="${fmt(y(preJumpLow.rank) + 25)}" class="mono value" text-anchor="end">155</text>
  <text x="${fmt(x(jump.timestamp) + 10)}" y="${fmt(y(jump.rank) - 15)}" class="mono value">120</text>
  <text x="${fmt(x(midDip.timestamp))}" y="${fmt(y(midDip.rank) + 27)}" class="mono value" text-anchor="middle">127</text>
  <text x="${fmt(x(topHundred.timestamp) - 10)}" y="${fmt(y(topHundred.rank) - 17)}" class="mono value" text-anchor="end">TOP 100</text>
  <text x="${fmt(x(final.timestamp) - 14)}" y="${fmt(y(final.rank) - 18)}" class="mono final-value" text-anchor="end">FINAL · 97</text>

  <g class="mono axis">
${dateLabels}
  </g>
</svg>
`;

fs.writeFileSync(outputPath, svg, 'utf8');
console.log(`Generated ${outputPath}`);
