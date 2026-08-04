const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = [
  'index.html','about.html','services.html','services-vehicule.html',
  'services-amenagement.html','services-carrosserie.html','contact.html',
  'faq.html','actualites.html','politique-confidentialite.html',
  'partenaires/auto-nejma.html','partenaires/mercedes-benz.html','partenaires/volkswagen.html'
];

let problems = 0;

for (const page of pages) {
  const filePath = path.join(root, page);
  const dir = path.dirname(filePath);
  const html = fs.readFileSync(filePath, 'utf8');

  const refs = new Set();
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) refs.add(m[1]);

  for (const ref of refs) {
    if (/^https?:\/\//.test(ref)) continue;      // external
    if (ref.startsWith('mailto:') || ref.startsWith('tel:')) continue;
    if (ref.startsWith('data:')) continue;
    if (ref === '#' || ref.startsWith('#')) continue; // in-page anchor
    let clean = ref.split('#')[0];
    if (!clean) continue;
    const resolved = path.resolve(dir, clean);
    if (!fs.existsSync(resolved)) {
      console.log(`BROKEN  ${page}  ->  ${ref}`);
      problems++;
    }
  }

  // cross-page in-page anchors like foo.html#section — check the section exists as an id in the target file
  for (const m of html.matchAll(/\b(?:href)="([^"#]+\.html)#([^"]+)"/g)) {
    const [, target, anchor] = m;
    const targetPath = path.resolve(dir, target);
    if (!fs.existsSync(targetPath)) continue; // already reported above
    const targetHtml = fs.readFileSync(targetPath, 'utf8');
    const idRegex = new RegExp(`id="${anchor}"`);
    if (!idRegex.test(targetHtml)) {
      console.log(`MISSING ANCHOR  ${page} -> ${target}#${anchor}`);
      problems++;
    }
  }
}

console.log(problems === 0 ? 'All local references resolve.' : `${problems} problem(s) found.`);
process.exit(problems === 0 ? 0 : 1);
