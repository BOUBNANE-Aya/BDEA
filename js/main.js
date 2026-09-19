/* ===== BDEA Carrosserie — Lightweight JS ===== */
/* No libraries. One IntersectionObserver + vanilla event listeners. */

document.addEventListener('DOMContentLoaded', () => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Resolve the client's image library for every existing gallery surface. */
  const imageSets = {
    sprinter: [
      'assets/images/Mercedes Sprinter - Project/MB - Sprinter Premuim/1.png',
      'assets/images/Mercedes Sprinter - Project/MB - Luxe Bordo/1.png',
      'assets/images/Mercedes Sprinter - Project/MB - Luxe Marron/1.png',
      'assets/images/Mercedes Sprinter - Project/MB - Luxe Noir/1.png',
      'assets/images/Mercedes Sprinter - Project/MB - Premuim Gris Cuire/1.png',
      'assets/images/Mercedes Sprinter - Special/MB - Tourer Model 1/1.png'
    ],
    crafter: [
      'assets/images/Volkswagen Crafter/1_VW Model 10 - 17 P/1.png',
      'assets/images/Volkswagen Crafter/2_VW Model 4 - 18 P/1.png',
      'assets/images/Volkswagen Crafter/3_VW Model 8 - 18 p/1.png',
      'assets/images/VW Crafter New Model 2026/VW Crafter - Black/1.png',
      'assets/images/VW Crafter New Model 2026/VW Crafter - Broown/1.png',
      'assets/images/VW Crafter New Model 2026/VW Crafter - Red/1.png'
    ],
    master: [
      'assets/images/Renault Master/Renault Master - Model 1/1.png',
      'assets/images/Renault Master/Renault Master - Model 2/1.png',
      'assets/images/Renault Master/Renault Master - Model 1/2.png'
    ],
    autres: [
      'assets/images/Minibus Iveco/1.png',
      'assets/images/Minibus Iveco/2.png',
      'assets/images/Jac - Marron/1.png'
    ],
    autoNejma: [
      'assets/images/Mercedes Sprinter - Special with Auto Nejma/MB - Airport Budas/1.png',
      'assets/images/Mercedes Sprinter - Special with Auto Nejma/MB - Sprinter VIP LIGHT/1.png',
      'assets/images/Mercedes Sprinter - Special with Auto Nejma/MB - Sprinter VIP Rafi/1.png'
    ],
    intro: [
      'assets/images/Intro and main Page pictures/1.png',
      'assets/images/Intro and main Page pictures/2.png',
      'assets/images/Intro and main Page pictures/3.png',
      'assets/images/Intro and main Page pictures/4.png',
      'assets/images/Intro and main Page pictures/5.png',
      'assets/images/Intro and main Page pictures/6.png'
    ]
  };

  const toPartnerPath = (path) => window.location.pathname.includes('/partenaires/') ? '../' + path : path;
  const chooseImage = (key, index) => toPartnerPath(imageSets[key] && imageSets[key][index % imageSets[key].length] || imageSets.intro[index % imageSets.intro.length]);
  const serviceImage = (label, index) => {
    const value = label.toLowerCase();
    if (value.includes('sprinter') || value.includes('vip')) return chooseImage('sprinter', index);
    if (value.includes('crafter') || value.includes('midibus')) return chooseImage('crafter', index);
    if (value.includes('master')) return chooseImage('master', index);
    if (value.includes('iveco') || value.includes('minibus') || value.includes('autocar')) return chooseImage('autres', index);
    return chooseImage('intro', index);
  };

  const replaceClientImages = () => {
    let fallbackIndex = 0;
    document.querySelectorAll('img, video').forEach((media) => {
      const current = media.getAttribute('src') || media.getAttribute('poster') || '';
      const isPlaceholder = /unsplash|optimized\//.test(current);
      if (!isPlaceholder) return;

      const tile = media.closest('.real-tile');
      const gamme = media.closest('.gamme-card');
      const variant = media.closest('[data-nej-variant]') || media;
      const alt = (media.getAttribute('alt') || media.getAttribute('aria-label') || '').toLowerCase();
      let path;

      if (variant.hasAttribute('data-nej-variant')) {
        const variantMap = { tabaco: 'autoNejma', noir: 'sprinter', gris: 'sprinter', bordo: 'sprinter' };
        path = chooseImage(variantMap[variant.getAttribute('data-nej-variant')] || 'autoNejma', fallbackIndex);
      } else if (tile && tile.dataset.cat) {
        const categoryMap = {
          touristique: 'sprinter', personnel: 'master', scolaire: 'crafter', vip: 'sprinter', caravane: 'master',
          minibus: 'autres', midibus: 'crafter', autocar: 'autres', rallongement: 'intro'
        };
        path = chooseImage(categoryMap[tile.dataset.cat] || tile.dataset.cat, fallbackIndex);
      } else if (tile && tile.dataset.brand) {
        const brandMap = { 'auto-nejma': 'autoNejma', mercedes: 'sprinter', volkswagen: 'crafter', fiat: 'master', iveco: 'autres', man: 'autres' };
        path = chooseImage(brandMap[tile.dataset.brand] || 'intro', fallbackIndex);
      } else if (gamme) {
        const panel = gamme.closest('.gamme-panel');
        const panelKey = panel ? panel.id.replace('gpanel-', '') : '';
        path = chooseImage(panelKey === 'man' || panelKey === 'ducato' ? panelKey === 'ducato' ? 'master' : 'autres' : panelKey || 'intro', fallbackIndex);
      } else if (document.title.includes('Auto Nejma')) {
        path = chooseImage('autoNejma', fallbackIndex);
      } else if (document.title.includes('Mercedes')) {
        path = chooseImage('sprinter', fallbackIndex);
      } else if (document.title.includes('Volkswagen')) {
        path = chooseImage('crafter', fallbackIndex);
      } else {
        path = serviceImage(alt, fallbackIndex);
      }

      if (media.tagName === 'VIDEO') media.setAttribute('poster', path);
      else media.setAttribute('src', path);
      ['data-lb-src', 'data-glb-src', 'data-nej-lb-src'].forEach((attribute) => {
        if (media.hasAttribute(attribute)) media.setAttribute(attribute, path);
      });
      fallbackIndex++;
    });

    document.querySelectorAll('[data-lb-src], [data-glb-src], [data-nej-lb-src]').forEach((element) => {
      const childImage = element.querySelector('img');
      const resolvedChild = childImage && childImage.getAttribute('src');
      ['data-lb-src', 'data-glb-src', 'data-nej-lb-src'].forEach((attribute) => {
        if (/unsplash|optimized\//.test(element.getAttribute(attribute) || '')) {
          element.setAttribute(attribute, resolvedChild || chooseImage('intro', fallbackIndex++));
        }
      });
    });
  };
  replaceClientImages();

  /* ── Navbar: transparent → solid ── */
  const navbar = document.getElementById('navbar');
  /* Pages name their opening banner #hero or #intro; without a fallback the navbar
     stayed transparent (white links, pale logo) over light content and vanished. */
  const banner = document.getElementById('hero') || document.getElementById('intro');
  if (navbar && banner) {
    new IntersectionObserver(([entry]) => {
      navbar.classList.toggle('scrolled', !entry.isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(banner);
  } else if (navbar) {
    /* No banner at all (gallery, contact, partner pages) — go solid on any scroll. */
    const syncNavbar = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    syncNavbar();
    window.addEventListener('scroll', syncNavbar, { passive: true });
  }

  /* ── Mobile menu ── */
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── "Nos services" dropdown (desktop navbar) ──
     Shared here (not duplicated per-page) so every page gets working
     dropdown behavior automatically, including any new page. */
  const svcTrigger = document.getElementById('svc-trigger');
  const svcBtn = document.getElementById('svc-btn');
  if (svcTrigger && svcBtn) {
    svcBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = svcTrigger.classList.toggle('open');
      svcBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!svcTrigger.contains(e.target)) {
        svcTrigger.classList.remove('open');
        svcBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && svcTrigger.classList.contains('open')) {
        svcTrigger.classList.remove('open');
        svcBtn.setAttribute('aria-expanded', 'false');
        svcBtn.focus();
      }
    });
  }

  /* ── Reveal on scroll ── */
  if (!reducedMotion) {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  }

  /* ── Marquee: clone until always full, set shift to one-set width ── */
  const track = document.querySelector('.marquee-track');
  if (track) {
    const original = track.innerHTML;
    const oneSetWidth = track.scrollWidth;
    const copies = Math.ceil((window.innerWidth * 2) / oneSetWidth) + 1;
    for (let i = 0; i < copies; i++) track.innerHTML += original;
    const totalSets = copies + 1;
    const pct = (100 / totalSets).toFixed(4);
    track.style.setProperty('--marquee-shift', '-' + pct + '%');
  }

  /* ── Smooth anchor scrolling (native, no library) ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── Lazy-load hero video ── */
  const video = document.querySelector('#hero video');
  if (video) {
    video.play().catch(() => {});
  }

  /* ── Lazy-load 3D viewer (only when section scrolls into view) ── */
  const viewer3d = document.getElementById('viewer-3d');
  if (viewer3d) {
    new IntersectionObserver(([entry], self) => {
      if (entry.isIntersecting) {
        const tpl = document.getElementById('viewer-3d-template');
        if (tpl) {
          viewer3d.innerHTML = '';
          viewer3d.appendChild(tpl.content.cloneNode(true));
        }
        self.unobserve(viewer3d);
      }
    }, { rootMargin: '200px' }).observe(viewer3d);
  }

  /* ── Chiffres clés: count up from 0 once the row scrolls into view ── */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    const render = (el, value) =>
      el.textContent = (el.dataset.countPrefix || '') + value + (el.dataset.countSuffix || '');

    /* The final figure is in the HTML so it survives without JS; zero it only once
       we know we can animate it back up. */
    if (!reducedMotion) counters.forEach(el => render(el, 0));

    const countUp = el => {
      const target = parseInt(el.dataset.countTo, 10);
      if (reducedMotion) { render(el, target); return; }
      const duration = 1600;
      const start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);   /* easeOutCubic */
        render(el, Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries, self) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        self.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => counterObserver.observe(el));
  }

  /* ── Showcase slider (home) ── */
  const shx = document.getElementById('shx');
  if (shx) {
    const rail   = document.getElementById('shx-rail');
    const thumbs = Array.from(rail.querySelectorAll('.shx-thumb'));
    const railWrap = rail.parentElement;
    const layers = [document.getElementById('shx-a'), document.getElementById('shx-b')];
    const cap    = document.getElementById('shx-cap');
    const count  = document.getElementById('shx-count');
    const total  = thumbs.length;

    let index = 0;      // slide currently on the stage
    let front = 0;      // which of the two stage layers is visible
    let timer = null;

    const srcFor = i => 'assets/images/showcase/' + String(i + 1).padStart(2, '0') + '.jpg';

    /* Slide the rail so the current square sits in the middle of the strip. */
    const centreRail = () => {
      const current = thumbs[index];
      const offset = current.offsetLeft + current.offsetWidth / 2 - railWrap.offsetWidth / 2;
      rail.style.transform = 'translateX(' + (-offset) + 'px)';
    };

    const markThumbs = () => {
      thumbs.forEach((t, i) => {
        t.classList.toggle('is-current', i === index);
        t.classList.toggle('is-past', i < index);
        t.classList.toggle('is-next', i > index);
        t.setAttribute('aria-selected', i === index ? 'true' : 'false');
        t.setAttribute('tabindex', i === index ? '0' : '-1');
      });
    };

    const show = i => {
      const next = ((i % total) + total) % total;
      if (next === index) return;
      index = next;

      const text = thumbs[index].dataset.cap || '';
      const back = layers[1 - front];

      /* Paint the hidden layer first, then crossfade — avoids a blank flash. */
      back.src = srcFor(index);
      back.alt = text;
      const reveal = () => {
        back.classList.add('active');
        layers[front].classList.remove('active');
        layers[front].setAttribute('aria-hidden', 'true');
        back.removeAttribute('aria-hidden');
        front = 1 - front;
      };
      if (back.decode) back.decode().then(reveal).catch(reveal);
      else back.onload = reveal;

      cap.textContent = text;
      count.innerHTML = '<b>' + String(index + 1).padStart(2, '0') + '</b>&thinsp;/&thinsp;' + total;
      markThumbs();
      centreRail();
    };

    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (!reducedMotion && !timer) timer = setInterval(() => show(index + 1), 4500); };

    document.getElementById('shx-prev').addEventListener('click', () => { show(index - 1); stop(); start(); });
    document.getElementById('shx-next').addEventListener('click', () => { show(index + 1); stop(); start(); });

    thumbs.forEach((t, i) => {
      t.addEventListener('click', () => { show(i); stop(); start(); });
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + total) % total;
        show(n);
        thumbs[n].focus();
        stop(); start();
      });
    });

    shx.addEventListener('mouseenter', stop);
    shx.addEventListener('mouseleave', start);
    shx.addEventListener('focusin', stop);
    shx.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    markThumbs();
    /* Wait for layout (thumb widths) before the first centring. */
    requestAnimationFrame(centreRail);
    window.addEventListener('resize', centreRail);

    /* Only autoplay while the section is actually on screen. */
    new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop(); },
      { threshold: 0.25 }).observe(shx);
  }

  /* ── Before/After slider ── */
  document.querySelectorAll('.ba-slider').forEach(slider => {
    const afterWrap = slider.querySelector('.ba-after');
    const handle = slider.querySelector('.ba-handle');
    if (!afterWrap || !handle) return;
    const move = (x) => {
      const rect = slider.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.max(2, Math.min(98, pct));
      afterWrap.style.width = pct + '%';
      handle.style.left = pct + '%';
    };
    const onPointer = (e) => { e.preventDefault(); move(e.clientX || e.touches[0].clientX); };
    slider.addEventListener('pointerdown', (e) => {
      onPointer(e);
      const up = () => { document.removeEventListener('pointermove', onPointer); document.removeEventListener('pointerup', up); };
      document.addEventListener('pointermove', onPointer);
      document.addEventListener('pointerup', up);
    });
  });

  /* ── Count-up stats ── */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (reducedMotion) { el.textContent = prefix + target + suffix; return; }
    new IntersectionObserver(([entry], self) => {
      if (!entry.isIntersecting) return;
      self.unobserve(el);
      let start = 0;
      const duration = 1800;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(ease * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 }).observe(el);
  });

  /* ── Orb parallax (lightweight scroll-driven) ── */
  if (!reducedMotion) {
    const orbs = document.querySelectorAll('.partner-orb');
    if (orbs.length) {
      const onScroll = () => {
        const sy = window.scrollY;
        orbs.forEach(orb => {
          const speed = parseFloat(orb.dataset.speed || '0.04');
          const section = orb.closest('section');
          if (!section) return;
          const offset = section.offsetTop;
          orb.style.transform = 'translateY(' + ((sy - offset) * speed) + 'px)';
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  /* ── Web3Forms contact form ── */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('contact-submit');
      const status = document.getElementById('form-status');
      btn.disabled = true;
      btn.textContent = 'Envoi…';
      status.classList.add('hidden');

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
        });
        const data = await res.json();
        if (data.success) {
          status.textContent = '✓ Message envoyé ! On vous recontacte bientôt.';
          status.classList.remove('hidden');
          status.classList.add('text-green-300');
          form.reset();
        } else {
          throw new Error(data.message || 'Erreur');
        }
      } catch (err) {
        status.textContent = 'Erreur lors de l\'envoi. Réessayez ou appelez-nous.';
        status.classList.remove('hidden');
        status.classList.add('text-red-300');
      }
      btn.disabled = false;
      btn.innerHTML = 'Envoyer <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 8h14M9 2l6 6-6 6"/></svg>';
    });
  }

});
