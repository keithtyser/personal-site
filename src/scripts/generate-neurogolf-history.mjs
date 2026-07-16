import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inputPath = path.join(projectRoot, 'blog/data/neurogolf-submission-history.csv');
const dailyOutputPath = path.join(projectRoot, 'blog/data/neurogolf-daily-score-history.csv');
const rankOutputPath = path.join(projectRoot, 'blog/data/neurogolf-rank-checkpoints.csv');
const svgOutputPath = path.join(projectRoot, 'blog/images/neurogolf-full-score-history.svg');
const rankSvgOutputPath = path.join(projectRoot, 'blog/images/neurogolf-rank-checkpoints.svg');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  const [headers, ...values] = rows;
  return values
    .filter((valuesRow) => valuesRow.some((value) => value !== ''))
    .map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ''])));
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatScore(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const submissions = parseCsv(fs.readFileSync(inputPath, 'utf8'))
  .map((row) => ({
    ...row,
    timestamp: new Date(row.date),
    score: row.publicScore === '' ? Number.NaN : Number(row.publicScore),
  }))
  .filter((row) => !Number.isNaN(row.timestamp.valueOf()))
  .sort((a, b) => a.timestamp - b.timestamp);

if (!submissions.length) {
  throw new Error(`No submission records found in ${inputPath}`);
}

const firstTimestamp = submissions[0].timestamp;
const lastTimestamp = submissions.at(-1).timestamp;
const firstDay = new Date(Date.UTC(firstTimestamp.getUTCFullYear(), firstTimestamp.getUTCMonth(), firstTimestamp.getUTCDate()));
const lastDay = new Date(Date.UTC(lastTimestamp.getUTCFullYear(), lastTimestamp.getUTCMonth(), lastTimestamp.getUTCDate()));
const dayMs = 24 * 60 * 60 * 1000;
const daily = [];
const dailyByDate = new Map();

for (let timestamp = firstDay.valueOf(); timestamp <= lastDay.valueOf(); timestamp += dayMs) {
  const date = new Date(timestamp).toISOString().slice(0, 10);
  const entry = { date, attempts: 0, completed: 0, errors: 0, dayMax: null, highWater: null };
  daily.push(entry);
  dailyByDate.set(date, entry);
}

const highWaterPoints = [];
let highWater = Number.NEGATIVE_INFINITY;

for (const submission of submissions) {
  const entry = dailyByDate.get(submission.date.slice(0, 10));
  entry.attempts += 1;

  if (submission.status === 'COMPLETE' && Number.isFinite(submission.score)) {
    entry.completed += 1;
    entry.dayMax = entry.dayMax === null ? submission.score : Math.max(entry.dayMax, submission.score);
    if (submission.score > highWater) {
      highWater = submission.score;
      highWaterPoints.push({
        timestamp: submission.timestamp,
        score: submission.score,
        ref: submission.ref,
      });
    }
  } else {
    entry.errors += 1;
  }
}

highWater = Number.NEGATIVE_INFINITY;
for (const entry of daily) {
  if (entry.dayMax !== null) highWater = Math.max(highWater, entry.dayMax);
  entry.highWater = Number.isFinite(highWater) ? highWater : null;
}

const dailyCsv = [
  'date,attempts,completed,errors,dayMax,highWater',
  ...daily.map((entry) => [
    entry.date,
    entry.attempts,
    entry.completed,
    entry.errors,
    entry.dayMax === null ? '' : entry.dayMax.toFixed(2),
    entry.highWater === null ? '' : entry.highWater.toFixed(2),
  ].join(',')),
].join('\n');
fs.writeFileSync(dailyOutputPath, `${dailyCsv}\n`, 'utf8');

const completed = submissions.filter((row) => row.status === 'COMPLETE' && Number.isFinite(row.score)).length;
const errors = submissions.length - completed;
const activeDays = daily.filter((entry) => entry.attempts > 0).length;
const maxAttempts = Math.max(...daily.map((entry) => entry.attempts));
const firstScore = highWaterPoints[0].score;
const finalScore = highWaterPoints.at(-1).score;
const totalGain = finalScore - firstScore;

const width = 1200;
const height = 720;
const left = 114;
const right = 1138;
const plotTop = 184;
const plotBottom = 496;
const attemptsTop = 565;
const attemptsBottom = 650;
const plotWidth = right - left;
const plotHeight = plotBottom - plotTop;
const attemptHeight = attemptsBottom - attemptsTop;
const minTime = firstTimestamp.valueOf();
const maxTime = lastTimestamp.valueOf();
const x = (timestamp) => left + ((timestamp.valueOf() - minTime) / (maxTime - minTime)) * plotWidth;
const y = (score) => plotBottom - (score / 8000) * plotHeight;
const fmt = (value) => Number(value).toFixed(1);

const linePoints = highWaterPoints.map((point) => `${fmt(x(point.timestamp))},${fmt(y(point.score))}`).join(' ');
const areaPoints = `${fmt(x(highWaterPoints[0].timestamp))},${plotBottom} ${linePoints} ${fmt(x(highWaterPoints.at(-1).timestamp))},${plotBottom}`;

const yTicks = [0, 2000, 4000, 6000, 8000];
const grid = yTicks.map((tick) => {
  const tickY = y(tick);
  return `    <line x1="${left}" y1="${fmt(tickY)}" x2="${right}" y2="${fmt(tickY)}"/>`;
}).join('\n');
const yLabels = yTicks.map((tick) => `    <text x="${left - 16}" y="${fmt(y(tick) + 5)}">${tick.toLocaleString('en-US')}</text>`).join('\n');

const tickIndexes = [0, 15, 30, 45, 60, 76, daily.length - 1];
const seenTickIndexes = [...new Set(tickIndexes)];
const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const formatDateLabel = (timestamp) => `${monthNames[timestamp.getUTCMonth()]} ${timestamp.getUTCDate()}`;
const xLabels = seenTickIndexes.map((index) => {
  const day = new Date(`${daily[index].date}T00:00:00.000Z`);
  const position = left + (index / (daily.length - 1)) * plotWidth;
  return `    <text x="${fmt(position)}" y="686">${monthNames[day.getUTCMonth()]} ${day.getUTCDate()}</text>`;
}).join('\n');

const barStep = plotWidth / daily.length;
const barWidth = Math.max(2, barStep * 0.7);
const bars = daily.map((entry, index) => {
  if (!entry.attempts) return '';
  const barX = left + index * barStep + (barStep - barWidth) / 2;
  const completedHeight = (entry.completed / maxAttempts) * attemptHeight;
  const errorHeight = (entry.errors / maxAttempts) * attemptHeight;
  const completedY = attemptsBottom - completedHeight;
  const errorY = completedY - errorHeight;
  return [
    completedHeight > 0 ? `    <rect x="${fmt(barX)}" y="${fmt(completedY)}" width="${fmt(barWidth)}" height="${fmt(completedHeight)}" rx="1" class="completed-bar"/>` : '',
    errorHeight > 0 ? `    <rect x="${fmt(barX)}" y="${fmt(errorY)}" width="${fmt(barWidth)}" height="${fmt(errorHeight)}" rx="1" class="error-bar"/>` : '',
  ].filter(Boolean).join('\n');
}).filter(Boolean).join('\n');

function firstCrossing(target) {
  return highWaterPoints.find((point) => point.score >= target);
}

const fiveThousand = firstCrossing(5000);
const sevenThousand = firstCrossing(7000);
const firstPoint = highWaterPoints[0];
const finalPoint = highWaterPoints.at(-1);
const firstX = x(firstPoint.timestamp);
const firstY = y(firstPoint.score);
const fiveX = x(fiveThousand.timestamp);
const fiveY = y(fiveThousand.score);
const sevenX = x(sevenThousand.timestamp);
const sevenY = y(sevenThousand.score);
const finalX = x(finalPoint.timestamp);
const finalY = y(finalPoint.score);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">NeuroGolf 2026 score over time</title>
  <desc id="desc">A cumulative high-water line chart of Keith Tyser's public score from the first submission on April 16 through the final winning submission on July 15, 2026, with daily bars showing all ${submissions.length.toLocaleString('en-US')} attempts.</desc>
  <defs>
    <linearGradient id="history-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0c0a"/>
      <stop offset="1" stop-color="#101611"/>
    </linearGradient>
    <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7ce38b" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#7ce38b" stop-opacity="0.015"/>
    </linearGradient>
    <filter id="history-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
      .mono { font-family: "JetBrains Mono", Consolas, monospace; }
      .eyebrow { font-size: 17px; font-weight: 600; letter-spacing: 2.7px; fill: #7ce38b; }
      .headline { font-size: 38px; font-weight: 700; fill: #edf4ee; }
      .subtitle { font-size: 17px; fill: #a5b0a7; }
      .gain { font-size: 18px; font-weight: 700; fill: #7ce38b; }
      .axis { font-size: 13px; fill: #8d998f; }
      .axis-title { font-size: 12px; font-weight: 700; letter-spacing: 1.8px; fill: #758078; }
      .callout { font-size: 14px; font-weight: 700; fill: #edf4ee; }
      .callout-muted { font-size: 12px; fill: #9aa69c; }
      .finish { font-size: 15px; font-weight: 800; fill: #f1b45b; }
      .note { font-size: 12px; fill: #758078; }
      .grid { stroke: #283129; stroke-width: 1; }
      .completed-bar { fill: #4f9f62; opacity: 0.78; }
      .error-bar { fill: #9a6849; opacity: 0.85; }
    </style>
  </defs>

  <rect x="1" y="1" width="1198" height="718" rx="20" fill="url(#history-bg)" stroke="#2a342c" stroke-width="2"/>
  <text x="58" y="51" class="mono eyebrow">APR 16–JUL 15, 2026 · UTC</text>
  <text x="58" y="94" class="sans headline">Score over time</text>
  <text x="58" y="125" class="sans subtitle">${formatScore(firstScore)} → ${formatScore(finalScore)} across ${submissions.length.toLocaleString('en-US')} submissions · ${completed.toLocaleString('en-US')} completed · ${errors.toLocaleString('en-US')} errors</text>
  <text x="1138" y="94" class="mono gain" text-anchor="end">+${formatScore(totalGain)} POINTS</text>

  <text x="58" y="171" class="mono axis-title">PUBLIC SCORE</text>
  <g class="grid">
${grid}
  </g>
  <g class="mono axis" text-anchor="end">
${yLabels}
  </g>

  <polygon points="${areaPoints}" fill="url(#history-area)"/>
  <polyline points="${linePoints}" fill="none" stroke="#7ce38b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <g>
    <circle cx="${fmt(firstX)}" cy="${fmt(firstY)}" r="6" fill="#0a0c0a" stroke="#7ce38b" stroke-width="3"/>
    <line x1="${fmt(firstX + 4)}" y1="${fmt(firstY - 4)}" x2="${fmt(firstX + 42)}" y2="${fmt(firstY - 30)}" stroke="#607066" stroke-width="1.5"/>
    <text x="${fmt(firstX + 48)}" y="${fmt(firstY - 34)}" class="mono callout">START · ${formatScore(firstPoint.score)}</text>
    <text x="${fmt(firstX + 48)}" y="${fmt(firstY - 17)}" class="sans callout-muted">${formatDateLabel(firstPoint.timestamp)}</text>

    <circle cx="${fmt(fiveX)}" cy="${fmt(fiveY)}" r="5" fill="#0a0c0a" stroke="#7ce38b" stroke-width="3"/>
    <line x1="${fmt(fiveX + 4)}" y1="${fmt(fiveY - 4)}" x2="${fmt(fiveX + 50)}" y2="${fmt(fiveY - 32)}" stroke="#607066" stroke-width="1.5"/>
    <text x="${fmt(fiveX + 56)}" y="${fmt(fiveY - 36)}" class="mono callout">5,000 CROSSED</text>
    <text x="${fmt(fiveX + 56)}" y="${fmt(fiveY - 19)}" class="sans callout-muted">${formatDateLabel(fiveThousand.timestamp)}</text>

    <circle cx="${fmt(sevenX)}" cy="${fmt(sevenY)}" r="5" fill="#0a0c0a" stroke="#7ce38b" stroke-width="3"/>
    <line x1="${fmt(sevenX - 4)}" y1="${fmt(sevenY + 4)}" x2="${fmt(sevenX - 52)}" y2="${fmt(sevenY + 34)}" stroke="#607066" stroke-width="1.5"/>
    <text x="${fmt(sevenX - 58)}" y="${fmt(sevenY + 31)}" class="mono callout" text-anchor="end">7,000 CROSSED</text>
    <text x="${fmt(sevenX - 58)}" y="${fmt(sevenY + 48)}" class="sans callout-muted" text-anchor="end">${formatDateLabel(sevenThousand.timestamp)}</text>

    <circle cx="${fmt(finalX)}" cy="${fmt(finalY)}" r="8" fill="#f1b45b" stroke="#fff1d4" stroke-width="3" filter="url(#history-glow)"/>
    <text x="${fmt(finalX - 10)}" y="${fmt(finalY - 20)}" class="mono finish" text-anchor="end">FINAL · ${formatScore(finalPoint.score)}</text>
  </g>

  <line x1="${left}" y1="${attemptsBottom}" x2="${right}" y2="${attemptsBottom}" stroke="#283129" stroke-width="1"/>
  <text x="58" y="548" class="mono axis-title">DAILY ATTEMPTS</text>
  <g>
${bars}
  </g>
  <g class="sans axis">
    <rect x="890" y="533" width="10" height="10" rx="2" class="completed-bar"/><text x="907" y="543">completed</text>
    <rect x="994" y="533" width="10" height="10" rx="2" class="error-bar"/><text x="1011" y="543">error</text>
    <text x="1138" y="543" text-anchor="end">${activeDays} active days</text>
  </g>
  <g class="mono axis" text-anchor="middle">
${xLabels}
  </g>

</svg>
`;

fs.writeFileSync(svgOutputPath, svg, 'utf8');

const earlyRankCheckpoints = [
  ['2026-05-02T04:50:51.000Z', 5653.10, 19, 'M:3891'],
  ['2026-05-05T18:55:27.000Z', 5936.59, 18, 'M:30870'],
  ['2026-05-06T12:21:36.000Z', 6053.06, 17, 'M:41742'],
  ['2026-05-06T20:56:06.000Z', 6032.45, 5, 'M:46342'],
  ['2026-05-06T23:13:56.000Z', 6032.45, 13, 'M:48237'],
  ['2026-05-07T00:40:10.000Z', 6032.76, 16, 'M:49326'],
  ['2026-05-07T01:39:58.000Z', 6033.90, 16, 'M:50181'],
  ['2026-05-09T12:45:33.000Z', 6132.62, 18, 'M:63633'],
  ['2026-05-09T18:17:54.000Z', 6134.24, 19, 'M:66029'],
  ['2026-05-09T18:55:20.000Z', 6135.52, 19, 'M:66812'],
  ['2026-05-10T00:58:28.000Z', 6140.08, 20, 'M:71063'],
].map(([date, score, rank, source]) => ({ timestamp: new Date(date), score, rank, source }));

const finalRankCheckpoints = [
  ['2026-07-13T16:43:47.000Z', 7400.66, 168, 'J:2027'],
  ['2026-07-13T16:57:44.000Z', 7407.80, 154, 'J:2316'],
  ['2026-07-13T19:10:22.000Z', 7410.39, 150, 'J:5352'],
  ['2026-07-13T20:39:21.000Z', 7411.52, 151, 'J:7056'],
  ['2026-07-13T21:31:07.000Z', 7411.77, 152, 'J:8018'],
  ['2026-07-13T21:47:47.000Z', 7411.82, 151, 'J:8301'],
  ['2026-07-13T23:04:12.000Z', 7411.91, 152, 'J:9688'],
  ['2026-07-13T23:16:03.000Z', 7413.04, 151, 'J:9904'],
  ['2026-07-14T01:46:50.000Z', 7415.74, 151, 'J:12601'],
  ['2026-07-14T02:14:08.000Z', 7415.75, 153, 'J:12959'],
  ['2026-07-14T03:11:58.000Z', 7419.41, 152, 'J:13806'],
  ['2026-07-14T03:57:01.000Z', 7422.06, 150, 'J:14384'],
  ['2026-07-14T04:33:42.000Z', 7423.75, 147, 'J:14950'],
  ['2026-07-14T10:25:51.000Z', 7429.20, 146, 'J:20195'],
  ['2026-07-14T14:18:38.000Z', 7430.87, 149, 'J:23538'],
  ['2026-07-14T14:48:46.000Z', 7430.87, 150, 'J:24005'],
  ['2026-07-14T18:55:45.000Z', 7431.94, 152, 'J:27394'],
  ['2026-07-14T21:07:18.000Z', 7431.94, 153, 'J:29344'],
  ['2026-07-14T23:52:25.000Z', 7435.78, 150, 'J:33457'],
  ['2026-07-15T01:06:55.000Z', 7436.63, 152, 'J:35894'],
  ['2026-07-15T01:41:44.000Z', 7436.96, 154, 'J:37052'],
  ['2026-07-15T02:24:29.000Z', 7436.96, 155, 'J:38270'],
  ['2026-07-15T04:40:53.000Z', 7458.20, 120, 'J:42303'],
  ['2026-07-15T04:53:05.000Z', 7458.20, 121, 'J:42694'],
  ['2026-07-15T05:50:44.000Z', 7458.80, 122, 'J:44247'],
  ['2026-07-15T07:41:28.000Z', 7461.84, 123, 'J:46992'],
  ['2026-07-15T11:59:32.000Z', 7464.36, 127, 'J:47708'],
  ['2026-07-15T13:40:48.000Z', 7468.61, 122, 'J:50083'],
  ['2026-07-15T15:49:28.000Z', 7471.00, 125, 'J:53326'],
  ['2026-07-15T16:47:11.000Z', 7471.51, 124, 'J:54611'],
  ['2026-07-15T17:35:20.000Z', 7478.70, 116, 'J:56143'],
  ['2026-07-15T18:06:57.000Z', 7480.74, 115, 'J:57069'],
  ['2026-07-15T20:35:54.000Z', 7486.34, 105, 'J:61677'],
  ['2026-07-15T21:36:18.000Z', 7489.16, 100, 'J:63136'],
  ['2026-07-15T23:38:37.000Z', 7495.20, 96, 'J:66600'],
  ['2026-07-15T23:46:09.000Z', 7496.21, 96, 'J:66722'],
  ['2026-07-15T23:51:24.000Z', 7496.25, 97, 'final leaderboard row 98'],
].map(([date, score, rank, source]) => ({ timestamp: new Date(date), score, rank, source }));

const rankCheckpoints = [...earlyRankCheckpoints, ...finalRankCheckpoints];

const csvField = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const rankCsv = [
  'dateUtc,score,rank,note,source',
  [
    '2026-04-16T21:33:34.850Z',
    '84.27',
    '',
    'Competition start; no rank snapshot preserved',
    'Kaggle submission history',
  ].map(csvField).join(','),
  ...rankCheckpoints.map((point) => [
    point.timestamp.toISOString(),
    point.score.toFixed(2),
    point.rank,
    '',
    point.source,
  ].map(csvField).join(',')),
].join('\n');
fs.writeFileSync(rankOutputPath, `${rankCsv}\n`, 'utf8');

const rankWidth = 1200;
const rankHeight = 680;
const rankPlotTop = 196;
const rankPlotBottom = 510;
const earlyLeft = 104;
const earlyRight = 472;
const finalLeft = 628;
const finalRight = 1138;
const competitionStart = new Date('2026-04-16T21:33:34.850Z');
const earlyEnd = earlyRankCheckpoints.at(-1).timestamp;
const finalStart = finalRankCheckpoints[0].timestamp;
const finalEnd = finalRankCheckpoints.at(-1).timestamp;
const scaleTime = (timestamp, min, max, leftEdge, rightEdge) => leftEdge + ((timestamp.valueOf() - min.valueOf()) / (max.valueOf() - min.valueOf())) * (rightEdge - leftEdge);
const earlyX = (timestamp) => scaleTime(timestamp, competitionStart, earlyEnd, earlyLeft, earlyRight);
const finalRankX = (timestamp) => scaleTime(timestamp, finalStart, finalEnd, finalLeft, finalRight);
const earlyY = (rank) => rankPlotTop + ((rank - 1) / 24) * (rankPlotBottom - rankPlotTop);
const finalRankY = (rank) => rankPlotTop + ((rank - 90) / 85) * (rankPlotBottom - rankPlotTop);
const earlyLinePoints = earlyRankCheckpoints.map((point) => `${fmt(earlyX(point.timestamp))},${fmt(earlyY(point.rank))}`).join(' ');
const finalLinePoints = finalRankCheckpoints.map((point) => `${fmt(finalRankX(point.timestamp))},${fmt(finalRankY(point.rank))}`).join(' ');
const earlyTicks = [1, 5, 10, 15, 20, 25];
const finalTicks = [90, 100, 125, 151, 175];
const earlyGrid = earlyTicks.map((tick) => `    <line x1="${earlyLeft}" y1="${fmt(earlyY(tick))}" x2="${earlyRight}" y2="${fmt(earlyY(tick))}"/>`).join('\n');
const finalGrid = finalTicks.map((tick) => `    <line x1="${finalLeft}" y1="${fmt(finalRankY(tick))}" x2="${finalRight}" y2="${fmt(finalRankY(tick))}"/>`).join('\n');
const earlyLabels = earlyTicks.map((tick) => `    <text x="${earlyLeft - 14}" y="${fmt(earlyY(tick) + 5)}">${tick}</text>`).join('\n');
const finalLabels = finalTicks.map((tick) => `    <text x="${finalLeft - 14}" y="${fmt(finalRankY(tick) + 5)}">${tick}</text>`).join('\n');
const earlyDateTicks = [
  { timestamp: competitionStart, label: 'APR 16' },
  { timestamp: new Date('2026-05-01T00:00:00.000Z'), label: 'MAY 1' },
  { timestamp: new Date('2026-05-06T00:00:00.000Z'), label: 'MAY 6' },
  { timestamp: earlyEnd, label: 'MAY 10' },
];
const finalDateTicks = [
  { timestamp: finalStart, label: 'JUL 13' },
  { timestamp: new Date('2026-07-14T12:00:00.000Z'), label: 'JUL 14' },
  { timestamp: new Date('2026-07-15T12:00:00.000Z'), label: 'JUL 15' },
  { timestamp: finalEnd, label: '23:51' },
];
const earlyDateLabels = earlyDateTicks.map((tick) => `    <text x="${fmt(earlyX(tick.timestamp))}" y="548">${tick.label}</text>`).join('\n');
const finalDateLabels = finalDateTicks.map((tick) => `    <text x="${fmt(finalRankX(tick.timestamp))}" y="548">${tick.label}</text>`).join('\n');
const earlyPoints = earlyRankCheckpoints.map((point, index) => {
  const key = index === 3;
  return `    <circle cx="${fmt(earlyX(point.timestamp))}" cy="${fmt(earlyY(point.rank))}" r="${key ? 7 : 4}" class="rank-dot"/>`;
}).join('\n');
const finalPoints = finalRankCheckpoints.map((point, index) => {
  const final = index === finalRankCheckpoints.length - 1;
  return `    <circle cx="${fmt(finalRankX(point.timestamp))}" cy="${fmt(finalRankY(point.rank))}" r="${final ? 8 : 3.7}" class="${final ? 'rank-final-dot' : 'rank-dot'}"/>`;
}).join('\n');
const earlyPeak = earlyRankCheckpoints[3];
const finalFirst = finalRankCheckpoints[0];
const finalLow = finalRankCheckpoints[21];
const finalJump = finalRankCheckpoints[22];
const finalDip = finalRankCheckpoints[26];
const finalTop100 = finalRankCheckpoints[33];
const rankFinalPoint = finalRankCheckpoints.at(-1);

const rankSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rankWidth} ${rankHeight}" role="img" aria-labelledby="title desc">
  <title id="title">Observed NeuroGolf leaderboard rank history</title>
  <desc id="desc">Forty-eight preserved live leaderboard snapshots in two unconnected time windows: an early campaign peak at rank 5 on May 6 and a final-sprint climb from rank 168 on July 13 to rank 97 on July 15, 2026.</desc>
  <defs>
    <linearGradient id="rank-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0c0a"/>
      <stop offset="1" stop-color="#101611"/>
    </linearGradient>
    <filter id="rank-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
      .mono { font-family: "JetBrains Mono", Consolas, monospace; }
      .eyebrow { font-size: 17px; font-weight: 600; letter-spacing: 2.7px; fill: #7ce38b; }
      .headline { font-size: 38px; font-weight: 700; fill: #edf4ee; }
      .subtitle { font-size: 17px; fill: #a5b0a7; }
      .section { font-size: 12px; font-weight: 700; letter-spacing: 1.8px; fill: #758078; }
      .axis { font-size: 12px; fill: #8d998f; }
      .rank-value { font-size: 14px; font-weight: 700; fill: #edf4ee; }
      .rank-final { font-size: 15px; font-weight: 800; fill: #f1b45b; }
      .early-note { font-size: 13px; fill: #9aa69c; }
      .silver-label { font-size: 12px; font-weight: 700; fill: #7ce38b; }
      .note { font-size: 12px; fill: #758078; }
      .grid { stroke: #283129; stroke-width: 1; }
      .rank-dot { fill: #0a0c0a; stroke: #7ce38b; stroke-width: 3; }
      .rank-final-dot { fill: #f1b45b; stroke: #fff1d4; stroke-width: 3; filter: url(#rank-glow); }
    </style>
  </defs>

  <rect x="1" y="1" width="1198" height="678" rx="20" fill="url(#rank-bg)" stroke="#2a342c" stroke-width="2"/>
  <text x="58" y="51" class="mono eyebrow">OBSERVED LEADERBOARD RANK · LOWER IS BETTER</text>
  <text x="58" y="94" class="sans headline">From an early rank 5 to a final rank 97</text>
  <text x="58" y="125" class="sans subtitle">48 contemporaneous snapshots · missing dates are deliberately left unconnected</text>

  <text x="${earlyLeft}" y="171" class="mono section">EARLY CAMPAIGN · RANK 1–25</text>
  <text x="${finalLeft}" y="171" class="mono section">FINAL 55 HOURS · RANK 90–175</text>
  <rect x="${finalLeft}" y="${rankPlotTop}" width="${finalRight - finalLeft}" height="${fmt(finalRankY(151) - rankPlotTop)}" fill="#7ce38b" opacity="0.035"/>
  <g class="grid">
${earlyGrid}
${finalGrid}
  </g>
  <g class="mono axis" text-anchor="end">
${earlyLabels}
${finalLabels}
  </g>
  <text x="${finalRight}" y="${fmt(finalRankY(151) - 9)}" text-anchor="end" class="mono silver-label">SILVER LINE · 151</text>

  <line x1="${earlyLeft}" y1="${rankPlotTop}" x2="${earlyLeft}" y2="${rankPlotBottom}" stroke="#4d5a50" stroke-dasharray="4 7"/>
  <text x="${earlyLeft + 8}" y="${rankPlotBottom - 10}" class="sans early-note">APR 16 · no rank captured</text>
  <polyline points="${earlyLinePoints}" fill="none" stroke="#7ce38b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${finalLinePoints}" fill="none" stroke="#7ce38b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <g>
${earlyPoints}
${finalPoints}
  </g>
  <text x="${fmt(earlyX(earlyPeak.timestamp) + 10)}" y="${fmt(earlyY(earlyPeak.rank) - 13)}" class="mono rank-value">RANK 5 · MAY 6</text>
  <text x="${fmt(finalRankX(finalFirst.timestamp) + 9)}" y="${fmt(finalRankY(finalFirst.rank) - 12)}" class="mono rank-value">168</text>
  <text x="${fmt(finalRankX(finalLow.timestamp) - 8)}" y="${fmt(finalRankY(finalLow.rank) + 21)}" text-anchor="end" class="mono rank-value">155</text>
  <text x="${fmt(finalRankX(finalJump.timestamp) + 8)}" y="${fmt(finalRankY(finalJump.rank) - 13)}" class="mono rank-value">120</text>
  <text x="${fmt(finalRankX(finalDip.timestamp))}" y="${fmt(finalRankY(finalDip.rank) + 22)}" text-anchor="middle" class="mono rank-value">127</text>
  <text x="${fmt(finalRankX(finalTop100.timestamp) - 8)}" y="${fmt(finalRankY(finalTop100.rank) - 13)}" text-anchor="end" class="mono rank-value">TOP 100</text>
  <text x="${fmt(finalRankX(rankFinalPoint.timestamp) - 10)}" y="${fmt(finalRankY(rankFinalPoint.rank) - 14)}" text-anchor="end" class="mono rank-final">FINAL · 97</text>

  <g class="mono section" text-anchor="middle">
    <text x="550" y="306">62-DAY GAP</text>
    <text x="550" y="327">NO SNAPSHOTS</text>
  </g>
  <path d="M526 345 l10 10 -10 10 M548 345 l10 10 -10 10 M570 345 l10 10 -10 10" fill="none" stroke="#4d5a50" stroke-width="2"/>
  <g class="mono axis" text-anchor="middle">
${earlyDateLabels}
${finalDateLabels}
  </g>

  <text x="58" y="626" class="mono note">SOURCE: PRESERVED LIVE SESSION SNAPSHOTS + FINAL LEADERBOARD · KAGGLE HAS NO HISTORICAL “AS OF” ENDPOINT</text>
</svg>
`;

fs.writeFileSync(rankSvgOutputPath, rankSvg, 'utf8');

console.log(JSON.stringify({
  attempts: submissions.length,
  completed,
  errors,
  activeDays,
  calendarDays: daily.length,
  highWaterPoints: highWaterPoints.length,
  firstSubmission: firstTimestamp.toISOString(),
  firstScore,
  winningSubmission: finalPoint.timestamp.toISOString(),
  finalScore,
  totalGain,
  outputs: [dailyOutputPath, rankOutputPath, svgOutputPath, rankSvgOutputPath],
}, null, 2));
