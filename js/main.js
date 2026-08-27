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
  const hero   = document.getElementById('hero');
  if (navbar && hero) {
    new IntersectionObserver(([entry]) => {
      navbar.classList.toggle('scrolled', !entry.isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
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

  /* ── 3D Image wheel ── */
  const ring = document.getElementById('wheel-ring');
  if (ring) {
    const cards = ring.querySelectorAll('.wheel-card');
    const n = cards.length;
    const angle = 360 / n;
    const radius = Math.round(ring.offsetWidth * 1.4) || 280;

    cards.forEach((card, i) => {
      const deg = angle * i;
      card.style.transform = 'rotateY(' + deg + 'deg) translateZ(' + radius + 'px)';
      card.dataset.angle = deg;
    });

    let current = 0;
    ring.style.transform = 'rotateY(0deg)';

    const updateFade = () => {
      const ringAngle = ((current % 360) + 360) % 360;
      cards.forEach(card => {
        const cardAngle = parseFloat(card.dataset.angle);
        let diff = ((cardAngle + ringAngle) % 360 + 360) % 360;
        if (diff > 180) diff = 360 - diff;
        const isBehind = diff > 90;
        card.style.opacity = isBehind ? '0.35' : '1';
        card.style.filter = isBehind ? 'brightness(0.7)' : 'none';
      });
    };
    updateFade();

    if (!reducedMotion) {
      setInterval(() => {
        current -= angle;
        ring.style.transform = 'rotateY(' + current + 'deg)';
        setTimeout(updateFade, 600);
      }, 2500);
    }
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
