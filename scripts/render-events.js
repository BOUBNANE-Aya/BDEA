/* Render the news section from scripts/events-built.json:
     - actualites.html          : a chronological timeline of every article
     - actualite-<slug>.html x N : the full article with its photo gallery

   Navbar, mobile menu and footer are lifted from actualites.html so every page keeps
   the same shared chrome.

   Run: node scripts/render-events.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = require('./events-built.json');

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* <picture> with AVIF + WebP and a srcset, so the browser downloads a file that matches
   the slot instead of the largest one. `sizes` describes the rendered CSS width. */
function pic(photo, alt, sizes, wanted, cls, extra) {
  const base = photo.base;
  /* Small originals never got the larger variants — never point at a file we didn't write. */
  const avail = photo.widths || [240, 480, 800, 1600];
  const widths = wanted.filter(w => avail.includes(w));
  if (!widths.length) widths.push(avail[avail.length - 1]);
  const set = f => widths.map(w => `${base}-${w}.${f} ${w}w`).join(', ');
  return `<picture>
            <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
            <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
            <img${cls ? ` class="${cls}"` : ''} src="${base}-${widths[widths.length - 1]}.webp" alt="${alt}"${extra || ''}>
          </picture>`;
}

/* Largest variant actually written for a photo (small originals stop before 1600). */
const biggest = p => { const w = p.widths || [1600]; return w[w.length - 1]; };

const shell = fs.readFileSync(path.join(ROOT, 'actualites.html'), 'utf8');
const slice = (from, to) => shell.slice(shell.indexOf(from), shell.indexOf(to));
const NAVBAR = slice('<!-- ===== Navbar ===== -->', '<main>');
const FOOTER = shell.slice(shell.indexOf('<!-- ===== Footer ===== -->'));

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const longDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const HEAD = (title, desc, canonical, ogImage) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">

  <link rel="canonical" href="https://www.bdeacarrosserie.com/${canonical}">
  <link rel="alternate" hreflang="fr" href="https://www.bdeacarrosserie.com/${canonical}">
  <link rel="alternate" hreflang="x-default" href="https://www.bdeacarrosserie.com/${canonical}">

  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="fr_MA">
  <meta property="og:url" content="https://www.bdeacarrosserie.com/${canonical}">
  <meta property="og:image" content="https://www.bdeacarrosserie.com/${ogImage}">

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect rx='18' width='100' height='100' fill='%23212677'/><text y='72' x='14' font-size='58' fill='white' font-weight='bold'>B</text></svg>">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
  tailwind.config={theme:{extend:{colors:{brand:{blue:'#212677',ink:'#050062',purple:'#7660A8',lilac:'#9D8EBF',paper:'#FFFAFA',mist:'#6B6B86',line:'#ECEAF2'}},fontFamily:{display:['"Clash Display"','sans-serif'],sans:['Inter','sans-serif'],mono:['"Space Mono"','monospace']}}}}
  </script>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/actus.css">
  <script>
  document.documentElement.classList.add('js');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('anim');
  </script>
</head>

<body class="bg-brand-paper text-[#2C2C3A] font-sans antialiased">
`;

const LIGHTBOX = `
<div id="bdea-lb" role="dialog" aria-modal="true" aria-label="Visionneuse d'images">
  <span id="bdea-lb-count"></span>
  <img id="bdea-lb-img" alt="" width="1600" height="1067">
  <p id="bdea-lb-cap"></p>
  <button id="bdea-lb-close" aria-label="Fermer"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg></button>
  <button id="bdea-lb-prev" aria-label="Image précédente"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2L4 8l6 6"/></svg></button>
  <button id="bdea-lb-next" aria-label="Image suivante"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2l6 6-6 6"/></svg></button>
</div>
`;

/* ───────────────────────── index: the timeline ───────────────────────── */
function renderIndex() {
  const years = [...new Set(DATA.map(e => e.date.slice(0, 4)))];
  const entries = [];
  let lastYear = null;

  DATA.forEach((e, i) => {
    const year = e.date.slice(0, 4);
    if (year !== lastYear) {
      entries.push(`      <div class="tl-year" data-year="${year}"><span>${year}</span></div>`);
      lastYear = year;
    }
    const hero = e.photos[0];
    const rest = e.photos.slice(1, 3);
    const excerpt = (e.intro[0] || '').slice(0, 185).replace(/\s+\S*$/, '') + '…';
    entries.push(`      <article class="tl-item" data-reveal>
        <a class="tl-link" href="actualite-${e.slug}.html" aria-label="${esc(e.title)}"></a>
        <div class="tl-media">
          ${pic(hero, esc(e.title), '(min-width:768px) 196px, 60vw', [240, 480, 800], 'tl-hero', ' loading="lazy" width="800" height="600"')}
          ${rest.map(p => pic(p, '', '(min-width:768px) 98px, 30vw', [240, 480], 'tl-thumb', ' loading="lazy" width="480" height="360"')).join('\n          ')}
          <span class="tl-count">${e.photos.length} photos</span>
        </div>
        <div class="tl-body">
          <p class="tl-date"><time datetime="${e.date}">${longDate(e.date)}</time>${e.place ? ` · <span>${esc(e.place)}</span>` : ''}</p>
          <h2 class="tl-title">${esc(e.title)}</h2>
          <p class="tl-excerpt">${esc(excerpt)}</p>
          <span class="tl-more">Lire l'article
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 8h14M9 2l6 6-6 6"/></svg>
          </span>
        </div>
      </article>`);
  });

  const main = `<main>

<!-- ===== Hero ===== -->
<section id="hero" class="pt-32 md:pt-40 pb-16 md:pb-20 relative overflow-hidden bg-brand-ink">
  <div class="absolute inset-0 opacity-25 pointer-events-none" style="background:radial-gradient(ellipse 70% 60% at 50% 0%,#7660A8,transparent)"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-5">
    <p data-reveal class="font-mono text-[11px] font-semibold tracking-[0.3em] uppercase text-brand-lilac mb-5">Actualités</p>
    <h1 data-reveal data-delay="1" class="font-display font-bold text-white leading-[1.05] tracking-tight" style="font-size:clamp(2.4rem,6vw,4.5rem)">
      Nos rencontres,<br>salons et partenariats.
    </h1>
    <p data-reveal data-delay="2" class="mt-6 text-white/60 text-lg max-w-2xl leading-relaxed">
      Réunions professionnelles, salons internationaux et accords signés — le parcours de BDEA Carrosserie, raconté événement par événement.
    </p>
    <div data-reveal data-delay="3" class="mt-10 flex flex-wrap gap-x-10 gap-y-4 pt-8 border-t border-white/15">
      <div><p class="font-display font-bold text-white text-2xl md:text-3xl leading-none">${DATA.length}</p>
        <p class="mt-1.5 text-white/45 text-xs font-mono tracking-widest uppercase">Événements</p></div>
      <div><p class="font-display font-bold text-white text-2xl md:text-3xl leading-none">${years[years.length - 1]}–${years[0]}</p>
        <p class="mt-1.5 text-white/45 text-xs font-mono tracking-widest uppercase">Années couvertes</p></div>
      <div><p class="font-display font-bold text-white text-2xl md:text-3xl leading-none">${DATA.reduce((n, e) => n + e.photos.length, 0)}</p>
        <p class="mt-1.5 text-white/45 text-xs font-mono tracking-widest uppercase">Photos</p></div>
    </div>
  </div>
</section>

<!-- ===== Timeline ===== -->
<section class="py-16 md:py-24">
  <div class="max-w-5xl mx-auto px-5">
    <div class="tl" id="tl">
      <div class="tl-rail" aria-hidden="true"><span class="tl-rail-fill" id="tl-fill"></span></div>
${entries.join('\n')}
    </div>
  </div>
</section>

<!-- ===== CTA ===== -->
<section class="py-20 md:py-28 relative overflow-hidden" style="background:linear-gradient(160deg,#05006a 0%,#050062 45%,#12003a 100%)">
  <div class="absolute inset-0 pointer-events-none opacity-30" style="background:radial-gradient(ellipse 70% 50% at 50% 60%,#7660A8,transparent)"></div>
  <div class="relative z-10 max-w-2xl mx-auto px-5 text-center">
    <h2 data-reveal class="font-display font-bold text-white leading-tight" style="font-size:clamp(1.8rem,4.5vw,3rem)">Un projet en tête&nbsp;?</h2>
    <p data-reveal data-delay="1" class="mt-4 text-white/55 text-lg">Parlons de votre prochain aménagement.</p>
    <div data-reveal data-delay="2" class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="contact.html" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple text-white font-semibold text-sm">Demander un devis
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 8h14M9 2l6 6-6 6"/></svg></a>
      <a href="gallery.html" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/25 text-white/80 font-medium text-sm hover:border-white/50 hover:text-white transition-colors">Voir la galerie</a>
    </div>
  </div>
</section>

</main>
`;

  const out = HEAD(
    'Actualités — BDEA Carrosserie',
    `Les ${DATA.length} événements de BDEA Carrosserie entre ${years[years.length - 1]} et ${years[0]} : réunions professionnelles, salons et partenariats.`,
    'actualites.html',
    `${DATA[0].photos[0].base}-${biggest(DATA[0].photos[0])}.webp`
  ) + NAVBAR + main + FOOTER.replace(/<script src="js\/main.js"[^>]*><\/script>/, '<script src="js/main.js" defer></script>\n<script src="js/actus.js" defer></script>');

  fs.writeFileSync(path.join(ROOT, 'actualites.html'), out, 'utf8');
  console.log('actualites.html  ->', DATA.length, 'entries');
}

/* ───────────────────────── article pages ───────────────────────── */
function renderArticle(e, prev, next) {
  const hero = e.photos[0];
  const body = [
    ...e.intro.map(p => `      <p class="ar-lede">${esc(p)}</p>`),
    ...e.sections.flatMap(s => [
      `      <h2 class="ar-h2">${esc(s.h)}</h2>`,
      ...s.paras.map(p => `      <p>${esc(p)}</p>`),
    ]),
  ].join('\n');

  const gallery = e.photos.map((p, i) => `        <button class="ar-shot" data-i="${i}" data-full="${p.base}-${biggest(p)}.webp" data-cap="${esc(e.title)}" aria-label="Agrandir la photo ${i + 1}">
          ${pic(p, esc(e.title) + ' — photo ' + (i + 1), '(min-width:640px) 170px, 44vw', [240, 480, 800], '', ' loading="lazy" width="800" height="600"')}
        </button>`).join('\n');

  const nav = [
    prev ? `        <a class="ar-nav-link" href="actualite-${prev.slug}.html"><span>Précédent</span><strong>${esc(prev.title.slice(0, 70))}…</strong></a>` : '<span></span>',
    next ? `        <a class="ar-nav-link ar-nav-next" href="actualite-${next.slug}.html"><span>Suivant</span><strong>${esc(next.title.slice(0, 70))}…</strong></a>` : '<span></span>',
  ].join('\n');

  const ld = {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: e.title, datePublished: e.date,
    image: [`https://www.bdeacarrosserie.com/${hero.base}-${biggest(hero)}.webp`],
    author: { '@type': 'Organization', name: 'BDEA Carrosserie' },
    publisher: { '@type': 'Organization', name: 'BDEA Carrosserie' },
    ...(e.place ? { contentLocation: { '@type': 'Place', name: e.place } } : {}),
  };

  const main = `<main>

<article class="ar">
  <!-- ===== Article hero ===== -->
  <header class="ar-hero">
    ${pic(hero, esc(e.title), '100vw', [480, 800, 1600], 'ar-hero-img', ' width="1600" height="1067" fetchpriority="high"')}
    <div class="ar-hero-scrim" aria-hidden="true"></div>
    <div class="ar-hero-inner">
      <a class="ar-back" href="actualites.html">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2L4 8l6 6"/></svg>
        Toutes les actualités
      </a>
      <p class="ar-meta"><time datetime="${e.date}">${longDate(e.date)}</time>${e.place ? ` · ${esc(e.place)}` : ''}</p>
      <h1 class="ar-title">${esc(e.title)}</h1>
    </div>
  </header>

  <!-- ===== Body ===== -->
  <div class="ar-wrap">
    <div class="ar-body">
${body}
    </div>

    <section class="ar-gallery" aria-label="Photos de l'événement">
      <p class="ar-gallery-label">${e.photos.length} photos</p>
      <div class="ar-shots">
${gallery}
      </div>
    </section>

    <nav class="ar-nav" aria-label="Navigation entre articles">
${nav}
    </nav>
  </div>
</article>

<!-- ===== CTA ===== -->
<section class="py-20 md:py-28 relative overflow-hidden" style="background:linear-gradient(160deg,#05006a 0%,#050062 45%,#12003a 100%)">
  <div class="absolute inset-0 pointer-events-none opacity-30" style="background:radial-gradient(ellipse 70% 50% at 50% 60%,#7660A8,transparent)"></div>
  <div class="relative z-10 max-w-2xl mx-auto px-5 text-center">
    <h2 class="font-display font-bold text-white leading-tight" style="font-size:clamp(1.8rem,4.5vw,3rem)">Travaillons ensemble.</h2>
    <p class="mt-4 text-white/55 text-lg">Un projet d'aménagement ou de transformation&nbsp;? Parlons-en.</p>
    <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="contact.html" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple text-white font-semibold text-sm">Demander un devis
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 8h14M9 2l6 6-6 6"/></svg></a>
      <a href="gallery.html" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/25 text-white/80 font-medium text-sm hover:border-white/50 hover:text-white transition-colors">Voir la galerie</a>
    </div>
  </div>
</section>

</main>
${LIGHTBOX}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
`;

  const desc = (e.intro[0] || e.title).slice(0, 180);
  const out = HEAD(e.title + ' — BDEA Carrosserie', desc, `actualite-${e.slug}.html`, `${hero.base}-${biggest(hero)}.webp`)
    + NAVBAR + main
    + FOOTER.replace(/<script src="js\/main.js"[^>]*><\/script>/, '<script src="js/main.js" defer></script>\n<script src="js/actus.js" defer></script>');

  fs.writeFileSync(path.join(ROOT, `actualite-${e.slug}.html`), out, 'utf8');
}

renderIndex();
DATA.forEach((e, i) => renderArticle(e, DATA[i - 1], DATA[i + 1]));
console.log(DATA.length, 'article pages written');
