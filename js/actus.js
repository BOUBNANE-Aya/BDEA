/* Actualités — timeline rail progress + article photo lightbox. */
document.addEventListener('DOMContentLoaded', function () {

  /* ── Timeline: fill the rail as the list scrolls past ── */
  var tl = document.getElementById('tl');
  var fill = document.getElementById('tl-fill');
  if (tl && fill && document.documentElement.classList.contains('anim')) {
    var ticking = false;
    var paint = function () {
      var rect = tl.getBoundingClientRect();
      var mid = window.innerHeight * 0.5;
      var p = (mid - rect.top) / rect.height;
      fill.style.height = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '%';
      ticking = false;
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  }

  /* ── Article gallery lightbox ── */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.ar-shot'));
  var lb = document.getElementById('bdea-lb');
  if (!shots.length || !lb) return;

  var img = document.getElementById('bdea-lb-img');
  var cap = document.getElementById('bdea-lb-cap');
  var count = document.getElementById('bdea-lb-count');
  var idx = 0;
  var last = null;

  function paintLb() {
    var s = shots[idx];
    img.src = s.dataset.full;
    img.alt = s.dataset.cap || '';
    cap.textContent = s.dataset.cap || '';
    count.textContent = (idx + 1) + ' / ' + shots.length;
  }
  function open(i) {
    idx = i;
    paintLb();
    lb.classList.add('open');
    last = document.activeElement;
    document.getElementById('bdea-lb-close').focus();
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    img.removeAttribute('src');
    document.body.style.overflow = '';
    if (last) { last.focus(); last = null; }
  }
  function go(d) {
    idx = (idx + d + shots.length) % shots.length;
    paintLb();
  }

  shots.forEach(function (s, i) { s.addEventListener('click', function () { open(i); }); });
  document.getElementById('bdea-lb-close').addEventListener('click', close);
  document.getElementById('bdea-lb-prev').addEventListener('click', function () { go(-1); });
  document.getElementById('bdea-lb-next').addEventListener('click', function () { go(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
});
