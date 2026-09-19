/* One-off: card images for the "Nos expertises" section on the sub-service pages,
   built from the full-size originals (~1.5MB each). */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG = path.join(__dirname, '..', 'assets', 'images');
const OUT = path.join(IMG, 'expertises');

const sources = {
  'autobus':     'Minibus Iveco/4.png',
  'vans':        'Volkswagen Crafter/6_VW Model 12 - 17 P/2.png',
  'fabrication': 'Employees pictures/Soudeur/4.png',
};

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, rel] of Object.entries(sources)) {
    const dest = path.join(OUT, `${name}.webp`);
    await sharp(path.join(IMG, rel)).rotate()
      .resize({ width: 800, height: 600, fit: 'cover', position: 'centre' })
      .webp({ quality: 78, effort: 5 })
      .toFile(dest);
    console.log(`${name}.webp  ${(fs.statSync(dest).size / 1024).toFixed(0)}KB   <- ${rel}`);
  }
}
run().catch(e => { console.error(e); process.exit(1); });
