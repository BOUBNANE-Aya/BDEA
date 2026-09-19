/* One-off: the supplied logo PNGs carry ~40% transparent padding, which makes the
   mark render far smaller than its box. Trim to the artwork so CSS heights are honest. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'assets', 'images', 'MAIN LOGO BDEA');

async function run() {
  for (const name of ['dark-logo', 'light-logo']) {
    const out = path.join(DIR, `${name}-trim.png`);
    const buf = await sharp(path.join(DIR, `${name}.png`))
      .trim({ threshold: 1 })
      .png({ palette: true, colours: 32, compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(out, buf);
    const m = await sharp(out).metadata();
    console.log(`${name}-trim.png  ${m.width}x${m.height}  ${(buf.length / 1024).toFixed(0)}KB`);
  }
}
run().catch(e => { console.error(e); process.exit(1); });
