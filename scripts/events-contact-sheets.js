/* Build one contact sheet per event so the 3–4 published photos can be chosen by eye.

   iPhone HEICs are decoded with heic-convert: libheif's reference-count security limit
   rejects these files through sharp, and ffmpeg/WIC can't read them either.

   Run: node scripts/events-contact-sheets.js [outDir] */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const ROOT = path.join(__dirname, '..');
const EVENTS = path.join(ROOT, 'assets', 'events');
const OUT = process.argv[2] || path.join(__dirname, 'contact-sheets');

const IMAGE = /\.(jpe?g|png|heic)$/i;
const CELL = 300, COLS = 5, PAD = 6;

async function decode(file) {
  if (/\.heic$/i.test(file)) {
    const out = await heicConvert({ buffer: fs.readFileSync(file), format: 'JPEG', quality: 0.9 });
    return Buffer.from(out);
  }
  return fs.readFileSync(file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const index = {};

  for (const dir of fs.readdirSync(EVENTS).sort()) {
    const full = path.join(EVENTS, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    const files = fs.readdirSync(full).filter(f => IMAGE.test(f) && !f.startsWith('~$')).sort();
    if (!files.length) { console.log(`${dir}: no still images`); continue; }

    const cells = [];
    const used = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const buf = await decode(path.join(full, files[i]));
        const thumb = await sharp(buf).rotate()
          .resize({ width: CELL, height: CELL, fit: 'cover' })
          .jpeg({ quality: 72 }).toBuffer();
        cells.push(thumb);
        used.push(files[i]);
      } catch (e) {
        console.log(`  !! ${dir}/${files[i]}: ${e.message.split('\n')[0].slice(0, 70)}`);
      }
    }
    if (!cells.length) continue;

    const rows = Math.ceil(cells.length / COLS);
    const W = COLS * (CELL + PAD) + PAD;
    const H = rows * (CELL + PAD) + PAD + 26;
    const composites = cells.map((b, i) => ({
      input: b,
      left: PAD + (i % COLS) * (CELL + PAD),
      top: 26 + PAD + Math.floor(i / COLS) * (CELL + PAD),
    }));
    // numbered strip so picks can be referenced by index
    const label = Buffer.from(
      `<svg width="${W}" height="26"><rect width="${W}" height="26" fill="#111"/>` +
      `<text x="8" y="18" font-family="monospace" font-size="14" fill="#fff">${dir} — ${cells.length} photos (1..${cells.length})</text></svg>`);
    composites.unshift({ input: label, left: 0, top: 0 });

    const dest = path.join(OUT, dir.replace(/\s+/g, '_') + '.jpg');
    await sharp({ create: { width: W, height: H, channels: 3, background: '#1a1a1a' } })
      .composite(composites).jpeg({ quality: 76 }).toFile(dest);

    index[dir] = used;
    console.log(`${dir.padEnd(20)} ${String(cells.length).padStart(2)} photos -> ${path.basename(dest)}`);
  }

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  console.log('\nsheets in', OUT);
})().catch(e => { console.error(e); process.exit(1); });
