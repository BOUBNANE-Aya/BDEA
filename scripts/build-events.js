/* Turn assets/events/* into publishable content:
     - parses each .docx article into title / date / location / sections
     - converts the hand-picked photos (incl. iPhone HEIC) to WebP at two widths
     - writes js/events-data.js for actualites.html and the article pages

   Run: node scripts/extract-events.js && node scripts/build-events.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const ROOT = path.join(__dirname, '..');
const EVENTS = path.join(ROOT, 'assets', 'events');
const OUT_IMG = path.join(ROOT, 'assets', 'actus');
const RAW = require('./events-raw.json');

/* Photos chosen from the contact sheets (1-based, in sorted filename order).
   3–4 per event, as requested. */
const PICKS = {
  'Event 10032022': [3, 6, 11, 26],
  'Event 26052022': [2, 3, 4, 5],
  'Event 12102022': [2, 3, 6, 1],
  'Event 14092023': [1, 3, 5],
  'Event 18072024': [4, 1, 2, 3],
  'Event 11092024': [1, 2, 5, 7],
  'Event 27112024': [5, 6, 9, 13],
  'Event 23092025': [5, 3, 2, 1],
  'Event 26032026': [4, 3, 1, 2],
  'Event 30032026': [2, 3, 4, 1],
  'Event 28092026': [3, 2, 6, 8],
  // 'Event 28022024' has no .docx — held back until the client supplies the article.
};

const SLUGS = {
  'Event 10032022': 'apci-premiere-reunion-2022',
  'Event 26052022': 'busworld-istanbul-2022',
  'Event 12102022': 'auto-nejma-sprinter-2023',
  'Event 14092023': 'iveco-reunion-2023',
  'Event 18072024': 'certification-iso-9001-2024',
  'Event 11092024': 'apci-assemblee-generale-2024',
  'Event 27112024': 'forum-transport-touristique-marrakech-2024',
  'Event 23092025': 'jac-collaboration-2025',
  'Event 26032026': 'cac-volkswagen-crafter-casablanca-2026',
  'Event 30032026': 'cac-volkswagen-crafter-fes-2026',
  'Event 28092026': 'cac-fntt-accord-2026',
};

const MONTHS = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
};

const IMAGE = /\.(jpe?g|png|heic)$/i;

/* "27 et 28 novembre 2024  |  Musée de l'Eau, Marrakech" -> date + place */
function parseDateLine(line) {
  const m = line.match(/(\d{1,2})(?:\s*(?:et|–|-)\s*\d{1,2})?\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (!m) return null;
  const mon = MONTHS[m[2].toLowerCase()];
  if (!mon) return null;
  const place = line.split('|').slice(1).join('|').trim();
  return {
    iso: `${m[3]}-${String(mon).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`,
    display: line.split('|')[0].trim(),
    place,
  };
}

function parseArticle(paras) {
  const lines = paras.map(p => ({ ...p }));
  /* Drop the "BDEA CARROSSERIE | ACTUALITÉS" kicker if present. */
  if (lines.length && /ACTUALIT/i.test(lines[0].text) && lines[0].text.length < 60) lines.shift();

  const title = lines.shift().text;
  let when = null;
  if (lines.length && parseDateLine(lines[0].text)) when = parseDateLine(lines.shift().text);

  const intro = [];
  while (lines.length && !lines[0].heading) intro.push(lines.shift().text);

  const sections = [];
  let cur = null;
  for (const l of lines) {
    if (l.heading) {
      cur = { h: l.text, paras: [] };
      sections.push(cur);
    } else if (cur) {
      cur.paras.push(l.text);
    } else {
      intro.push(l.text);
    }
  }
  return { title, when, intro, sections };
}

async function decode(file) {
  if (/\.heic$/i.test(file)) {
    return Buffer.from(await heicConvert({ buffer: fs.readFileSync(file), format: 'JPEG', quality: 0.92 }));
  }
  return fs.readFileSync(file);
}

(async () => {
  fs.mkdirSync(OUT_IMG, { recursive: true });
  const out = [];

  for (const ev of RAW) {
    const picks = PICKS[ev.folder];
    if (!picks || !ev.paras.length) {
      console.log(`skip ${ev.folder} ${picks ? '(no article text)' : '(no picks — awaiting article)'}`);
      continue;
    }
    const slug = SLUGS[ev.folder];
    const article = parseArticle(ev.paras);
    const dir = path.join(EVENTS, ev.folder);
    const images = fs.readdirSync(dir).filter(f => IMAGE.test(f) && !f.startsWith('~$')).sort();

    const destDir = path.join(OUT_IMG, slug);
    fs.mkdirSync(destDir, { recursive: true });

    const photos = [];
    for (let i = 0; i < picks.length; i++) {
      const src = images[picks[i] - 1];
      if (!src) { console.log(`  !! ${ev.folder}: pick ${picks[i]} out of range`); continue; }
      const buf = await decode(path.join(dir, src));
      const meta = await sharp(buf).rotate().metadata();
      const n = String(i + 1).padStart(2, '0');
      /* Four widths so srcset can match the real slot: the timeline renders a 98px
         thumb and a 196px hero, so shipping one 800px file was ~65x the pixels needed.
         AVIF alongside WebP buys a further ~29%. */
      const made = [];
      for (const [w, wq, aq] of [[240, 72, 50], [480, 74, 52], [800, 76, 54], [1600, 80, 56]]) {
        if (meta.width && meta.width < w * 0.75 && w > 240) continue;
        made.push(w);
        const base = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true });
        await base.clone().webp({ quality: wq, effort: 5 }).toFile(path.join(destDir, `${n}-${w}.webp`));
        await base.clone().avif({ quality: aq, effort: 4 }).toFile(path.join(destDir, `${n}-${w}.avif`));
      }
      photos.push({ base: `assets/actus/${slug}/${n}`, widths: made, w: meta.width, h: meta.height, src });
    }

    out.push({
      slug,
      folder: ev.folder,
      date: article.when ? article.when.iso : ev.date,
      dateDisplay: article.when ? article.when.display : '',
      place: article.when ? article.when.place : '',
      title: article.title,
      intro: article.intro,
      sections: article.sections,
      photos,
    });
    console.log(`${slug.padEnd(42)} ${photos.length} photos  ${article.sections.length} sections`);
  }

  out.sort((a, b) => b.date.localeCompare(a.date));   // newest first for the feed
  fs.writeFileSync(path.join(ROOT, 'js', 'events-data.js'),
    '/* Auto-generated by scripts/build-events.js — do not hand-edit. */\n' +
    'const EVENTS = ' + JSON.stringify(out, null, 1) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, 'events-built.json'), JSON.stringify(out, null, 1), 'utf8');
  console.log(`\n${out.length} articles -> js/events-data.js`);
})().catch(e => { console.error(e); process.exit(1); });
