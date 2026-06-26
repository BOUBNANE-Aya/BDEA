/* ===== BDEA Carrosserie — Lightweight JS ===== */
/* No libraries. One IntersectionObserver + vanilla event listeners. */

document.addEventListener('DOMContentLoaded', () => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
