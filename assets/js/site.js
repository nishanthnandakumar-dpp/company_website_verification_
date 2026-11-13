/* Traceyon: the whole of the site's JavaScript. No libraries, nothing fetched, nothing reported.

   Four small jobs, and nothing else:
     1. mark the current page in the navigation
     2. the running section index on the home page (desktop; text only)
     3. the copper rule beside the four rules, drawn in proportion to scroll
     4. the ledger line, written once the first time it is seen

   Under prefers-reduced-motion: reduce, jobs 3 and 4 do not start: the rule is fully drawn
   and the ledger line is complete. Without JavaScript the same is true. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* 1 -------------------------------------------------------------- navigation */
  var links = document.querySelectorAll('.topbar nav a'), here = location.pathname.replace(/index\.html$/, '');
  for (var i = 0; i < links.length; i++) {
    var h = links[i].getAttribute('href');
    if (!h || h.charAt(0) === '#') continue;
    var p = new URL(h, location.href).pathname.replace(/index\.html$/, '');
    if (p !== '/' && here.indexOf(p) === 0) links[i].setAttribute('aria-current', 'page');
  }

  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var secs = document.querySelectorAll('[data-sec]'), label = document.getElementById('secindex');
  var rule = document.querySelector('.spine'), ruleBox = rule && rule.parentNode;
  var code = document.querySelector('.ledger code');
  if (!secs.length) return;
  if (!still) root.classList.add('js');

  /* 4 ----------------------------------------------------------------- ledger */
  var ln, ts, a, b, started;
  if (!still && code && 'IntersectionObserver' in window) {
    ln = code.querySelector('.ln'); ts = code.querySelector('.ts');
    if (ln && ts) {
      a = ln.textContent; b = ts.textContent; ln.textContent = ''; ts.textContent = '';
      new IntersectionObserver(function (e, o) {
        if (started || !e[0].isIntersecting) return;
        started = true; o.disconnect();
        var t0 = performance.now(), total = a.length + b.length;
        (function step(now) {
          var n = Math.round(Math.min(1, (now - t0) / 800) * total);     // 800 ms in all, left to right
          ln.textContent = a.slice(0, n); ts.textContent = b.slice(0, Math.max(0, n - a.length));
          if (n < total) requestAnimationFrame(step);
        })(t0);
      }, { threshold: 0.6 }).observe(code);
    }
  }

  /* 2 and 3 ------------------------------------------------- scroll: index and rule */
  var shown = null, queued = false;
  function frame() {
    queued = false;
    var vh = innerHeight, cur = null, k, r;
    for (k = 0; k < secs.length; k++) {
      r = secs[k].getBoundingClientRect();
      if (r.top <= vh * 0.4 && r.bottom > vh * 0.4) cur = secs[k];
    }
    var text = cur ? cur.getAttribute('data-sec') + ' / ' + cur.getAttribute('data-name') : '';
    if (label && text !== shown) { label.textContent = text; shown = text; }      // switches instantly
    if (rule && !still) {
      r = ruleBox.getBoundingClientRect();
      var p = (vh * 0.75 - r.top) / (r.height + vh * 0.3);                        // linear, no easing
      rule.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(4));
    }
  }
  function ask() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  frame();
})();
