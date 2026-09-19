/* Scan the real client photo folders and emit js/gallery-data.js, consumed by
   gallery.html. Every image carries facets (vehicle, colour, seats, usage) so the
   gallery can be filtered and deep-linked from the service pages.

   Run: node scripts/generate-gallery-data.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
const OUT_FILE = path.join(ROOT, 'js', 'gallery-data.js');

/* Folders that hold site furniture rather than realisations. */
const SKIP = new Set(['MAIN LOGO BDEA', 'showcase', 'expertises']);

/* ── Vehicles (facet 1) ─────────────────────────────────────────────── */
const VEHICLES = {
  sprinter: 'Mercedes Sprinter',
  crafter: 'Volkswagen Crafter',
  master: 'Renault Master',
  iveco: 'Minibus Iveco',
  jac: 'JAC',
};

/* ── Colours (facet 2) — swatch drives the dot shown on the filter ──── */
const COLORS = {
  noir: { label: 'Noir', swatch: '#1C1C22' },
  'noir-premium': { label: 'Noir Premium', swatch: '#33333D' },
  marron: { label: 'Marron', swatch: '#6B4A2F' },
  bordo: { label: 'Bordo', swatch: '#6E1F2E' },
  gris: { label: 'Gris Cuir', swatch: '#8A8A94' },
  rouge: { label: 'Rouge', swatch: '#A32232' },
  'marron-noir': { label: 'Marron & Noir', swatch: 'linear-gradient(135deg,#6B4A2F 0 50%,#1C1C22 50% 100%)' },
};

/* ── Usages (facet 4) — what the vehicle was built for ──────────────── */
const USAGES = {
  tourisme: 'Transport touristique',
  scolaire: 'Transport scolaire',
  personnel: 'Transport de personnel',
  vip: 'VIP & semi-VIP',
  atelier: 'Atelier & fabrication',
};

/* Per-folder facets. `sub` is the caption shown on the tile.
   NOTE: the five Sprinter colours come only from "Mercedes Sprinter - Project";
   the two "Special" trees are one-off custom builds, so they carry no colour. */
const FOLDERS = {
  // ── Mercedes Sprinter — standard range (the 5 colours) ──
  'MB - Luxe Bordo': { v: 'sprinter', color: 'bordo', usage: ['vip'], sub: 'Sprinter Luxe — Bordo' },
  'MB - Luxe Marron': { v: 'sprinter', color: 'marron', usage: ['vip'], sub: 'Sprinter Luxe — Marron' },
  'MB - Luxe Noir': { v: 'sprinter', color: 'noir', usage: ['vip'], sub: 'Sprinter Luxe — Noir' },
  'MB - Premuim Gris Cuire': { v: 'sprinter', color: 'gris', usage: ['tourisme'], sub: 'Sprinter Premium — Gris Cuir' },
  'MB - Sprinter Premuim': { v: 'sprinter', color: 'noir-premium', usage: ['tourisme'], sub: 'Sprinter Premium — Noir' },

  // ── Mercedes Sprinter — projets spéciaux (no colour facet) ──
  'MB - Tourer Model 1': { v: 'sprinter', special: true, usage: ['tourisme'], sub: 'Sprinter Tourer — Modèle 1' },
  'MB - Tourer Model 2': { v: 'sprinter', special: true, usage: ['tourisme'], sub: 'Sprinter Tourer — Modèle 2' },
  'MB - Tourer Model 3': { v: 'sprinter', special: true, usage: ['tourisme'], sub: 'Sprinter Tourer — Modèle 3' },
  'MB - Airport Budas': { v: 'sprinter', special: true, usage: ['personnel', 'tourisme'], sub: 'Sprinter — Navette aéroport' },
  'MB - Sprinter VIP LIGHT': { v: 'sprinter', special: true, usage: ['vip'], sub: 'Sprinter VIP Light' },
  'MB - Sprinter VIP Rafi': { v: 'sprinter', special: true, usage: ['vip'], sub: 'Sprinter VIP Rafi' },

  // ── Volkswagen Crafter — nouveau modèle 2026 (colours) ──
  'VW Crafter - Black': { v: 'crafter', color: 'noir', year: 2026, usage: ['vip'], sub: 'Crafter 2026 — Noir' },
  'VW Crafter - Broown': { v: 'crafter', color: 'marron', year: 2026, usage: ['vip'], sub: 'Crafter 2026 — Marron' },
  'VW Crafter - Red': { v: 'crafter', color: 'rouge', year: 2026, usage: ['vip'], sub: 'Crafter 2026 — Rouge' },

  // ── Renault Master ──
  'Renault Master - Model 1': { v: 'master', color: 'noir', usage: ['scolaire', 'personnel'], sub: 'Renault Master — Noir' },
  'Renault Master - Model 2': { v: 'master', color: 'marron', usage: ['scolaire', 'personnel'], sub: 'Renault Master — Marron' },

  // ── Single-folder vehicles ──
  'Minibus Iveco': { v: 'iveco', color: 'marron-noir', usage: ['tourisme'], sub: 'Minibus Iveco' },
  'Jac - Marron': { v: 'jac', color: 'marron', usage: ['personnel'], sub: 'JAC — Marron' },

  // ── Atelier ──
  Cleaning: { usage: ['atelier'], sub: 'Nettoyage' },
  Electricity: { usage: ['atelier'], sub: 'Électricité' },
  Finition: { usage: ['atelier'], sub: 'Finition' },
  Menuiserie: { usage: ['atelier'], sub: 'Menuiserie' },
  Peintre: { usage: ['atelier'], sub: 'Peinture' },
  'Quality control': { usage: ['atelier'], sub: 'Contrôle qualité' },
  Soudeur: { usage: ['atelier'], sub: 'Soudure' },

  'Intro and main Page pictures': { sub: 'Sélection BDEA' },
};

/* "1_VW Model 10 - 17 P" -> { seats: 17, sub: 'Crafter — Modèle 10 (17 places)' } */
function crafterFolder(name) {
  const m = name.match(/VW Model (\d+)\s*-\s*(\d+)\s*P/i);
  if (!m) return null;
  return {
    v: 'crafter',
    seats: parseInt(m[2], 10),
    usage: ['tourisme', 'scolaire'],
    sub: `Crafter — Modèle ${m[1]} (${m[2]} places)`,
  };
}

const isImage = f => /\.(png|jpe?g)$/i.test(f);
const entries = [];

function walk(dir, inherited) {
  const items = fs.readdirSync(dir);
  const files = items.filter(f => isImage(f) && fs.statSync(path.join(dir, f)).isFile());
  const dirs = items.filter(f => fs.statSync(path.join(dir, f)).isDirectory());

  files.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  if (files.length && inherited) {
    files.forEach((f, i) => {
      const rel = path.relative(ROOT, path.join(dir, f)).split(path.sep).join('/');
      const item = { src: rel, sub: inherited.sub, n: i + 1 };
      if (inherited.v) { item.v = inherited.v; item.vLabel = VEHICLES[inherited.v]; }
      if (inherited.color) { item.color = inherited.color; item.colorLabel = COLORS[inherited.color].label; }
      if (inherited.seats) item.seats = inherited.seats;
      if (inherited.year) item.year = inherited.year;
      if (inherited.special) item.special = 1;
      if (inherited.usage) item.usage = inherited.usage;
      entries.push(item);
    });
  }

  dirs.forEach(d => walk(path.join(dir, d), FOLDERS[d] || crafterFolder(d) || null));
}

for (const top of fs.readdirSync(IMAGES_DIR)) {
  if (SKIP.has(top)) continue;
  const topPath = path.join(IMAGES_DIR, top);
  if (!fs.statSync(topPath).isDirectory()) continue;
  walk(topPath, FOLDERS[top] || null);
}

/* Stable, useful order: vehicles first (grouped), then atelier, then the rest. */
const V_ORDER = ['sprinter', 'crafter', 'master', 'iveco', 'jac'];
entries.sort((a, b) => {
  const ai = a.v ? V_ORDER.indexOf(a.v) : (a.usage ? 90 : 99);
  const bi = b.v ? V_ORDER.indexOf(b.v) : (b.usage ? 90 : 99);
  if (ai !== bi) return ai - bi;
  if (a.sub !== b.sub) return a.sub.localeCompare(b.sub, 'fr');
  return a.n - b.n;
});

const payload = {
  vehicles: VEHICLES,
  colors: COLORS,
  usages: USAGES,
  items: entries,
};

const js = '/* Auto-generated by scripts/generate-gallery-data.js — do not hand-edit. */\n' +
  'const GALLERY = ' + JSON.stringify(payload, null, 1) + ';\n';
fs.writeFileSync(OUT_FILE, js, 'utf8');

/* ── Report, so the usage tagging can be reviewed ── */
const byVehicle = {};
entries.forEach(e => { const k = e.v || (e.usage ? e.usage[0] : 'autre'); byVehicle[k] = (byVehicle[k] || 0) + 1; });
console.log(`${entries.length} images ->`, OUT_FILE);
console.log('\nper vehicle/group:', byVehicle);

const seen = new Map();
entries.forEach(e => {
  if (seen.has(e.sub)) return;
  seen.set(e.sub, e);
});
console.log('\nfolder -> facets');
for (const [sub, e] of seen) {
  console.log('  %s | v=%s color=%s seats=%s usage=%s%s',
    sub.padEnd(34), (e.v || '-').padEnd(9), (e.color || '-').padEnd(13),
    String(e.seats || '-').padEnd(4), (e.usage || []).join(',') || '-',
    e.special ? '  [projet spécial]' : '');
}
