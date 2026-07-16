import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = path.join(root, 'blog', 'images');

const palette = [
  '#000000',
  '#0074D9',
  '#FF4136',
  '#2ECC40',
  '#FFDC00',
  '#AAAAAA',
  '#F012BE',
  '#FF851B',
  '#7FDBFF',
  '#870C25',
];

const rows = (value) => value.trim().split('\n').map((row) => [...row].map(Number));

const examples = {
  task087: {
    input: rows(`
924
244
292`),
    output: rows(`
292
442
429`),
  },
  task140: {
    input: rows(`
552
100
000`),
    output: rows(`
000
001
255`),
  },
  task298: {
    input: rows(`
000000
077770
076670
076670
077770
000000`),
    output: rows(`
666666
600006
607706
607706
600006
666666`),
  },
  task303: {
    input: rows(`
1000111101101010111
1010111100111111011
1111001101000101010
1011111101111111111
1011011101111111111
1101011000010110001
1001101001111111010
1100111101011101111
0000000000000000000
1110011101001111111
1100110001100010101
1010100101111001111`),
    output: rows(`
1000111121101010111
1010111120111111011
1111001121000101010
1011111121111111111
1011011121111111111
1101011020010110001
1001101021111111010
1100111121011101111
2222222222222222222
1110011121001111111
1100110021100010101
1010100121111001111`),
  },
  task162: {
    input: rows(`
33330303033003330300
00330030330303300330
33333003000303303333
30330000303303330330
00030303330333033300
33003303333003033330
03000033030030003030
30300000033303333333
03300003033033003333
00033003333303030333
30330333003030003303
30030003333003030333
03300033033330030033
00303333000333003030
30333033033333333003
00303300303033033300
33033000000030300033
03030033303330033000
30030330300300333333
30330333000303033303`),
    output: rows(`
33330303033003330300
00330030330303300330
33333003000303303333
30330000303303330330
00030303330333033300
33003303333003033330
03011133030030003030
30311100033303333333
03311103033033003333
00033003333303030333
30330333003030003303
30030003333003030333
03300033033330030033
00303333000333003030
30333033033333333003
00303300303033033300
33033000000030300033
03030033303330033000
30030330300300333333
30330333000303033303`),
  },
};

const commonStyle = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#090c0a"/>
      <stop offset="1" stop-color="#101712"/>
    </linearGradient>
    <style>
      .sans { font-family: Inter, "Segoe UI", Arial, sans-serif; }
      .mono { font-family: "JetBrains Mono", Consolas, monospace; }
      .eyebrow { font-size: 17px; font-weight: 600; letter-spacing: 2.6px; fill: #7ce38b; }
      .title { font-size: 34px; font-weight: 700; fill: #edf4ee; }
      .label { font-size: 15px; font-weight: 600; letter-spacing: 1.4px; fill: #9aa69c; }
      .task { font-size: 23px; font-weight: 700; fill: #edf4ee; }
      .arc-id { font-size: 14px; fill: #879289; }
      .arrow { font-size: 43px; font-weight: 400; fill: #7ce38b; }
    </style>
  </defs>`;

function grid(gridData, x, y, cell) {
  const cells = [];
  for (let row = 0; row < gridData.length; row += 1) {
    for (let column = 0; column < gridData[row].length; column += 1) {
      cells.push(
        `<rect x="${x + column * cell}" y="${y + row * cell}" width="${cell}" height="${cell}" fill="${palette[gridData[row][column]]}" stroke="#273129" stroke-width="1"/>`,
      );
    }
  }
  return `<g shape-rendering="crispEdges">${cells.join('')}</g>`;
}

function pairSvg({ title, desc, eyebrow, input, output, cell, leftX, rightX, gridY, height }) {
  const inputWidth = input[0].length * cell;
  const outputWidth = output[0].length * cell;
  const arrowX = (leftX + inputWidth + rightX) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${desc}</desc>
  ${commonStyle}
  <rect x="1" y="1" width="1198" height="${height - 2}" rx="20" fill="url(#bg)" stroke="#2a342c" stroke-width="2"/>
  <text x="58" y="48" class="mono eyebrow">${eyebrow}</text>
  <text x="58" y="91" class="sans title">${title}</text>
  <text x="${leftX}" y="${gridY - 20}" class="mono label">INPUT</text>
  <text x="${rightX}" y="${gridY - 20}" class="mono label">OUTPUT</text>
  ${grid(input, leftX, gridY, cell)}
  <text x="${arrowX}" y="${gridY + (input.length * cell) / 2 + 13}" class="sans arrow" text-anchor="middle">→</text>
  ${grid(output, rightX, gridY, cell)}
</svg>
`;
}

function rotationsSvg() {
  const task087 = examples.task087;
  const task140 = examples.task140;
  const cell = 48;
  const gridY = 194;
  const block = ({ task, arcId, example, x }) => `
  <text x="${x}" y="132" class="sans task">${task}</text>
  <text x="${x}" y="156" class="mono arc-id">${arcId}</text>
  <text x="${x}" y="${gridY - 14}" class="mono label">INPUT</text>
  ${grid(example.input, x, gridY, cell)}
  <text x="${x + 194}" y="${gridY + 88}" class="sans arrow" text-anchor="middle">→</text>
  <text x="${x + 242}" y="${gridY - 14}" class="mono label">OUTPUT</text>
  ${grid(example.output, x + 242, gridY, cell)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 430" role="img" aria-labelledby="title desc">
  <title id="title">Two zero-cost rotations</title>
  <desc id="desc">ARC examples for Task087 and Task140. Each output is the input grid rotated 180 degrees.</desc>
  ${commonStyle}
  <rect x="1" y="1" width="1198" height="428" rx="20" fill="url(#bg)" stroke="#2a342c" stroke-width="2"/>
  <text x="58" y="48" class="mono eyebrow">ZERO-COST TASKS</text>
  <text x="58" y="91" class="sans title">Rotate the grid 180°</text>
  ${block({ task: 'Task087', arcId: '3c9b0459', example: task087, x: 58 })}
  ${block({ task: 'Task140', arcId: '6150a2bd', example: task140, x: 660 })}
</svg>
`;
}

const files = new Map([
  ['neurogolf-task303-arc.svg', pairSvg({
    title: 'Full black lines become red',
    desc: 'Task303 ARC example. A complete black row and a complete black column are recolored red while other black cells stay black.',
    eyebrow: 'TASK303 / C1D99E64',
    ...examples.task303,
    cell: 22,
    leftX: 58,
    rightX: 724,
    gridY: 148,
    height: 458,
  })],
  ['neurogolf-task298-arc.svg', pairSvg({
    title: 'Rotate the ring colors',
    desc: 'Task298 ARC example. The three nested ring colors rotate from black, orange, magenta to magenta, black, orange.',
    eyebrow: 'TASK298 / BDA2D7A6',
    ...examples.task298,
    cell: 50,
    leftX: 180,
    rightX: 720,
    gridY: 148,
    height: 500,
  })],
  ['neurogolf-zero-cost-rotations.svg', rotationsSvg()],
  ['neurogolf-task162-arc.svg', pairSvg({
    title: 'Fill empty 3 × 3 regions',
    desc: 'Task162 ARC example. One empty three-by-three area in a green and black grid is filled blue.',
    eyebrow: 'TASK162 / 6CF79266',
    ...examples.task162,
    cell: 22,
    leftX: 58,
    rightX: 702,
    gridY: 148,
    height: 640,
  })],
]);

fs.mkdirSync(outputDir, { recursive: true });
for (const [filename, contents] of files) {
  fs.writeFileSync(path.join(outputDir, filename), contents, 'utf8');
}

console.log(`Generated ${files.size} ARC visuals.`);
