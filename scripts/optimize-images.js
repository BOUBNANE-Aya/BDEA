/* One-off: compress the real BDEA project/service photos for web use. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(__dirname, '..', 'assets', 'images');
const OUT_DIR = path.join(SRC_DIR, 'optimized');

const sources = fs.readdirSync(SRC_DIR)
  .filter(f => /^(project|service)-\d+\.jpg$/i.test(f));

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ogDone = false;

  for (const file of sources) {
    const srcPath = path.join(SRC_DIR, file);
    const base = path.basename(file, '.jpg');
    const srcSize = fs.statSync(srcPath).size;

    const large = path.join(OUT_DIR, `${base}-1600.jpg`);
    const small = path.join(OUT_DIR, `${base}-800.jpg`);

    await sharp(srcPath).rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(large);

    await sharp(srcPath).rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(small);

    const largeSize = fs.statSync(large).size;
    const smallSize = fs.statSync(small).size;
    console.log(
      `${file}: ${(srcSize/1e6).toFixed(1)}MB -> ` +
      `${base}-1600.jpg ${(largeSize/1024).toFixed(0)}KB, ` +
      `${base}-800.jpg ${(smallSize/1024).toFixed(0)}KB`
    );

    // Use project-1 (a strong, representative interior shot) as the OG default crop.
    if (!ogDone && base === 'project-1') {
      const ogPath = path.join(OUT_DIR, 'og-default.jpg');
      await sharp(srcPath).rotate()
        .resize({ width: 1200, height: 630, fit: 'cover' })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(ogPath);
      console.log(`og-default.jpg -> ${(fs.statSync(ogPath).size/1024).toFixed(0)}KB`);
      ogDone = true;
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
