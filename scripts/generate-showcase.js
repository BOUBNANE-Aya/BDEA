/* One-off: build the home-page showcase slider assets (stage + rail thumbs)
   from the full-size project photos, which are ~1.5MB each. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'assets', 'images');
const OUT_DIR = path.join(IMG_DIR, 'showcase');
const THUMB_DIR = path.join(OUT_DIR, 'thumbs');

const sources = [
  'Mercedes Sprinter - Special with Auto Nejma/MB - Sprinter VIP Rafi/1.png',
  'Mercedes Sprinter - Special with Auto Nejma/MB - Sprinter VIP Rafi/3.png',
  'Mercedes Sprinter - Special with Auto Nejma/MB - Sprinter VIP LIGHT/1.png',
  'Mercedes Sprinter - Special with Auto Nejma/MB - Airport Budas/1.png',
  'Mercedes Sprinter - Project/MB - Luxe Bordo/1.png',
  'Mercedes Sprinter - Project/MB - Luxe Marron/1.png',
  'Mercedes Sprinter - Project/MB - Luxe Noir/1.png',
  'Mercedes Sprinter - Project/MB - Premuim Gris Cuire/1.png',
  'Mercedes Sprinter - Project/MB - Sprinter Premuim/1.png',
  'Mercedes Sprinter - Special/MB - Tourer Model 1/1.png',
  'Mercedes Sprinter - Special/MB - Tourer Model 2/1.png',
  'Mercedes Sprinter - Special/MB - Tourer Model 3/1.png',
  'Volkswagen Crafter/1_VW Model 10 - 17 P/1.png',
  'Volkswagen Crafter/3_VW Model 8 - 18 p/1.png',
  'Volkswagen Crafter/5_VW Model 13 - 20 P/1.png',
  'VW Crafter New Model 2026/VW Crafter - Black/1.png',
  'VW Crafter New Model 2026/VW Crafter - Red/1.png',
  'Renault Master/Renault Master - Model 1/1.png',
  'Minibus Iveco/1.png',
  'Jac - Marron/1.png',
];

async function run() {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  let i = 0;
  for (const rel of sources) {
    i += 1;
    const n = String(i).padStart(2, '0');
    const src = path.join(IMG_DIR, rel);
    const stage = path.join(OUT_DIR, `${n}.webp`);
    const thumb = path.join(THUMB_DIR, `${n}.webp`);

    await sharp(src).rotate()
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(stage);

    await sharp(src).rotate()
      .resize({ width: 200, height: 200, fit: 'cover', position: 'centre' })
      .webp({ quality: 70, effort: 5 })
      .toFile(thumb);

    console.log(
      `${n}  ${(fs.statSync(src).size / 1e6).toFixed(1)}MB -> ` +
      `stage ${(fs.statSync(stage).size / 1024).toFixed(0)}KB, ` +
      `thumb ${(fs.statSync(thumb).size / 1024).toFixed(0)}KB   ${rel}`
    );
  }
}

run().catch(err => { console.error(err); process.exit(1); });
