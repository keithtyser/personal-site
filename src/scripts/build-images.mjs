import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const SOURCE = path.join(projectRoot, 'profile_pic.jpeg');

async function main() {
  const buf = await fs.readFile(SOURCE);
  const meta = await sharp(buf).metadata();
  console.log(`source: ${meta.width}x${meta.height}, ${(buf.length / 1024).toFixed(0)} KB`);

  // 400x400 covers 4x retina for the 44px avatar and works for social previews
  const jpeg = await sharp(buf).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  await fs.writeFile(SOURCE, jpeg);
  console.log(`profile_pic.jpeg: ${(jpeg.length / 1024).toFixed(1)} KB`);

  const webp = await sharp(buf).resize(400, 400, { fit: 'cover' }).webp({ quality: 82, effort: 6 }).toBuffer();
  await fs.writeFile(path.join(projectRoot, 'profile_pic.webp'), webp);
  console.log(`profile_pic.webp: ${(webp.length / 1024).toFixed(1)} KB`);

  // apple-touch-icon at 180x180 (upscaled from 160; browsers resample fine)
  const apple = await sharp(buf).resize(180, 180, { fit: 'cover' }).png({ compressionLevel: 9 }).toBuffer();
  await fs.writeFile(path.join(projectRoot, 'apple-touch-icon.png'), apple);
  console.log(`apple-touch-icon.png: ${(apple.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
