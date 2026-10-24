/* Read every assets/events/<Event DDMMYYYY>/*.docx and emit scripts/events-raw.json.

   A .docx is a zip; word/document.xml holds the paragraphs. We keep each paragraph plus
   whether Word styled it as a heading, which is what gives the articles their structure.

   Run: node scripts/extract-events.js */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EVENTS = path.join(ROOT, 'assets', 'events');
const OUT = path.join(__dirname, 'events-raw.json');

/* Minimal zip reader via PowerShell's Expand-Archive would be slow; unzip the one entry
   we need with Node's built-in zlib by parsing the central directory. */
function readZipEntry(file, wanted) {
  const buf = fs.readFileSync(file);
  const zlib = require('zlib');
  // locate End of Central Directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 70000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip: ' + file);
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const cmtLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (name === wanted) {
      const method = buf.readUInt16LE(localOff + 8);
      const nL = buf.readUInt16LE(localOff + 26);
      const eL = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + nL + eL;
      const compSize = buf.readUInt32LE(off + 20);
      const raw = buf.slice(start, start + compSize);
      return method === 0 ? raw : zlib.inflateRawSync(raw);
    }
    off += 46 + nameLen + extraLen + cmtLen;
  }
  throw new Error('entry not found: ' + wanted);
}

const unescape = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");

function paragraphs(xml) {
  const out = [];
  const paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  for (const p of paras) {
    const text = unescape((p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
      .map(t => t.replace(/<[^>]+>/g, '')).join('')).trim();
    if (!text) continue;
    const styleM = p.match(/<w:pStyle w:val="([^"]+)"/);
    const style = styleM ? styleM[1] : '';
    const bold = /<w:b\/>|<w:b /.test(p);
    out.push({ text, heading: /^Heading|^Titre/i.test(style) || (bold && text.length < 110), style });
  }
  return out;
}

const result = [];
for (const dir of fs.readdirSync(EVENTS)) {
  const full = path.join(EVENTS, dir);
  if (!fs.statSync(full).isDirectory()) continue;
  const m = dir.match(/(\d{2})(\d{2})(\d{4})/);
  const files = fs.readdirSync(full);
  const docx = files.find(f => /\.docx$/i.test(f) && !f.startsWith('~$'));

  const entry = {
    folder: dir,
    date: m ? `${m[3]}-${m[2]}-${m[1]}` : null,
    docx: docx || null,
    paras: [],
    media: files.filter(f => !/\.docx$/i.test(f) && !f.startsWith('~$')),
  };
  if (docx) {
    try {
      const xml = readZipEntry(path.join(full, docx), 'word/document.xml').toString('utf8');
      entry.paras = paragraphs(xml);
    } catch (e) {
      entry.error = String(e.message);
    }
  }
  result.push(entry);
}

result.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
fs.writeFileSync(OUT, JSON.stringify(result, null, 1), 'utf8');

console.log(`${result.length} events -> ${OUT}`);
for (const e of result) {
  console.log(`  ${e.date || '????-??-??'}  ${String(e.paras.length).padStart(3)} paras  ` +
    `${String(e.media.length).padStart(2)} media  ${e.docx ? '' : '[NO DOCX] '}${e.error || ''}`);
}
