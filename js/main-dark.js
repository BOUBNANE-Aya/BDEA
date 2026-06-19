/* ===== BDEA Carrosserie — Dark Theme JavaScript (Enhanced Animations) ===== */

document.addEventListener('DOMContentLoaded', () => {

  // ───── Navbar: transparent → solid on scroll ─────
  const nav = document.getElementById('navbar');

  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.classList.add('nav-solid');
    } else {
      nav.classList.remove('nav-solid');
    }
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ───── Mobile menu ─────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ───── Hero word-by-word reveal ─────
  const heroWords = document.querySelectorAll('.hero-word');
  if (heroWords.length) {
    heroWords.forEach((word, i) => {
      setTimeout(() => {
        word.classList.add('revealed');
      }, 300 + i * 120);
    });
  }

  // ───── Scroll reveal animations (all variant classes) ─────
  const animateSelectors = [
    '.animate-on-scroll',
    '.animate-fade-left',
    '.animate-fade-right',
    '.animate-scale-in',
    '.animate-rotate-in'
  ];

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -8% 0px'
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        setTimeout(() => {
          el.classList.add('is-visible');
        }, parseInt(delay));
        scrollObserver.unobserve(el);
      }
    });
  }, observerOptions);

  animateSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      scrollObserver.observe(el);
    });
  });

  // ───── Process steps ─────
  const processSteps = document.querySelectorAll('.process-step');
  if (processSteps.length) {
    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || 0;
          setTimeout(() => el.classList.add('is-visible'), parseInt(delay));
          stepObserver.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    processSteps.forEach(el => stepObserver.observe(el));
  }

  // ───── Timeline line draw ─────
  const timelineLine = document.querySelector('.timeline-line-fill');
  if (timelineLine) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          timelineLine.classList.add('is-visible');
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    timelineObserver.observe(timelineLine.parentElement);
  }

  // ───── Animated counters ─────
  const counters = document.querySelectorAll('[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.target);
        const suffix = counter.dataset.suffix || '';
        const prefix = counter.dataset.prefix || '';
        const duration = 2200;
        const start = performance.now();

        function easeOutExpo(t) {
          return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function updateCounter(currentTime) {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutExpo(progress);
          const current = Math.floor(easedProgress * target);

          counter.textContent = prefix + current.toLocaleString('fr-FR') + suffix;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = prefix + target.toLocaleString('fr-FR') + suffix;
          }
        }

        requestAnimationFrame(updateCounter);
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });

  counters.forEach(c => counterObserver.observe(c));

  // ───── Smooth scroll for anchor links ─────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 0;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ───── Back to top button ─────
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    function handleBackToTopVisibility() {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    }
    window.addEventListener('scroll', handleBackToTopVisibility, { passive: true });
    handleBackToTopVisibility();

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ───── Active nav link highlighting ─────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function highlightNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('font-semibold');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('font-semibold');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });

  // ───── Parallax effect on decorative elements ─────
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const rect = el.parentElement.getBoundingClientRect();
        const offset = (rect.top + scrollY - scrollY) * speed;
        el.style.transform = `translateY(${offset * 0.3}px)`;
      });
    }, { passive: true });
  }

  // ───── Mouse-follow glow on hero ─────
  const heroGlow = document.getElementById('hero-mouse-glow');
  const heroSection = document.getElementById('hero');
  if (heroGlow && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      heroGlow.style.left = x + 'px';
      heroGlow.style.top = y + 'px';
    });
  }

  // ───── Tilt effect on service cards ─────
  document.querySelectorAll('.card-hover-tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -4;
      const rotateY = (x - centerX) / centerX * 4;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });

});
