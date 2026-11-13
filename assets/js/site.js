/* ============================================================================
   Traceyon — the whole of the site's JavaScript.

   No libraries. Nothing is fetched. Nothing is measured or reported anywhere.
   Rules kept, and checkable:
     - opacity and transform only, so nothing forces layout
     - every entrance plays once, then the observer stops watching it
     - nothing loops
     - under prefers-reduced-motion this file adds no class, registers no
       observer and binds no scroll listener; the CSS is already static
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Mark the current page in the navigation. This runs regardless of motion
     preference — it is information, not decoration. */
  (function currentPage() {
    var here = location.pathname.replace(/index\.html$/, '');
    var links = document.querySelectorAll('.topbar nav a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || href.charAt(0) === '#') continue;
      var path = new URL(href, location.href).pathname.replace(/index\.html$/, '');
      if (path !== '/' && here.indexOf(path) === 0) {
        links[i].setAttribute('aria-current', 'page');
      }
    }
  })();

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('js');

  /* The hero's entrance is pure CSS (see "PROOF" in site.css), switched on by
     a class set in the page's head before first paint. Nothing to do here. */

  /* --------------------------------------------------------- on scroll in */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);                        // once, and only once

        if (el.hasAttribute('data-stagger')) {
          var kids = el.querySelectorAll('[data-rise]');
          for (var i = 0; i < kids.length; i++) {
            (function (k, d) {
              setTimeout(function () { k.classList.add('in'); }, d);
            })(kids[i], i * 60);
          }
        }
        el.classList.add('in');

        if (el.classList.contains('timeline')) timeline(el);
        if (el.classList.contains('ledger')) typeLedger(el);
      });
    }, { threshold: 0.2 });

    var watch = document.querySelectorAll(
      '[data-rise],[data-stagger],.timeline,.ledger,.contact,.note');
    for (var i = 0; i < watch.length; i++) io.observe(watch[i]);
  } else {
    // no observer: show everything rather than hide it
    root.classList.remove('js');
  }

  function timeline(el) {
    var stops = el.querySelectorAll('.tl-stop');
    for (var i = 0; i < stops.length; i++) {
      (function (s, d) { setTimeout(function () { s.classList.add('in'); }, d); })
        (stops[i], 120 + i * 110);
    }
    var lock = el.querySelector('.tl-lock');
    if (lock) setTimeout(function () { lock.classList.add('closed'); }, 300);
  }

  /* the ledger line is written out, like a record being written */
  function typeLedger(el) {
    var code = el.querySelector('code');
    if (!code || code.dataset.typed) return;
    code.dataset.typed = '1';
    var full = code.textContent, n = full.length, t0 = performance.now();
    code.textContent = '';
    (function step(now) {
      var p = Math.min(1, (now - t0) / 600);
      code.textContent = full.slice(0, Math.round(p * n));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ----------------------------------------------- the bar and the spine */
  var topbar = document.querySelector('.topbar');
  var spine = document.querySelector('.spine i');
  var spineBox = document.querySelector('.spine');

  function onScroll() {
    if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 80);
    if (spine && spineBox) {
      var r = spineBox.getBoundingClientRect();
      var t = (window.innerHeight - r.top) / (window.innerHeight * 0.9 + r.height * 0.35);
      spine.style.transform = 'scaleY(' + Math.max(0, Math.min(1, t)).toFixed(4) + ')';
    }
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  /* ------------------------------------- the mark tilts, desktop pointers */
  var art = document.querySelector('.hero .art');
  if (art && !matchMedia('(pointer: coarse)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var tick = function () {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      art.style.transform = 'perspective(1400px) rotateY(' + cx.toFixed(3) +
        'deg) rotateX(' + cy.toFixed(3) + 'deg)';
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        raf = requestAnimationFrame(tick);
      } else { raf = 0; }
    };
    addEventListener('pointermove', function (e) {
      var r = art.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)) * 4;
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)) * -4;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    addEventListener('DOMContentLoaded', onScroll);
  } else { onScroll(); }
})();
