/* Compress the build-input photo masters in place: 2048px PNG -> WebP q90.

   These folders are only ever read by optimize-media.js to produce assets/opt; the
   site never serves them. WebP q90 at full resolution is visually indistinguishable
   and ~70% smaller, so the derivatives come out the same.

   Folders the site DOES serve (showcase, expertises, MAIN LOGO BDEA, optimized)
   are deliberately left alone.

   Run: node scripts/compress-masters.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES = path.join(__dirname, '..', 'assets', 'images');
const SKIP = new Set(['showcase', 'expertises', 'MAIN LOGO BDEA', 'optimized', 'opt']);
const SRC = /\.(png|jpe?g)$/i;

let before = 0, after = 0, n = 0;

async function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) { await walk(abs); continue; }
    if (!SRC.test(name)) continue;
    const size = fs.statSync(abs).size;
    const dest = abs.replace(SRC, '.webp');
    try {
      await sharp(abs).rotate().webp({ quality: 90, effort: 5 }).toFile(dest);
    } catch (e) {
      console.log('  !! skipped', abs, e.message.split('\n')[0].slice(0, 60));
      continue;
    }
    before += size;
    after += fs.statSync(dest).size;
    fs.unlinkSync(abs);
    n++;
  }
}

(async () => {
  for (const top of fs.readdirSync(IMAGES)) {
    const abs = path.join(IMAGES, top);
    if (!fs.statSync(abs).isDirectory() || SKIP.has(top)) continue;
    await walk(abs);
    console.log('  done', top);
  }
  const mb = b => (b / 1048576).toFixed(1) + 'MB';
  console.log(`\n${n} files: ${mb(before)} -> ${mb(after)} (${(100 - after / before * 100).toFixed(0)}% smaller)`);
})().catch(e => { console.error(e); process.exit(1); });
