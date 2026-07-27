/* IMS — shared behaviour.
   No dependencies. Everything degrades to a working static page. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');

  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav--open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'CLOSE' : 'MENU';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'MENU';
        toggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     Section reveal
     --------------------------------------------------------- */
  var items = document.querySelectorAll('.rise');

  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Hero goniometer readout.
     The number is read from the ray's actual rotation rather
     than run on a parallel timer — one source of truth, so the
     two can't drift apart on a slow device.
     --------------------------------------------------------- */
  var out = document.getElementById('gonN');
  var ray = document.querySelector('.gon-ray');

  if (out && ray) {
    if (reduce) {
      out.textContent = '132';
    } else {
      var running = true;
      ray.addEventListener('animationend', function (e) {
        if (e.animationName === 'sweep') {
          out.textContent = '132';
          running = false;
        }
      });
      (function track() {
        var m = getComputedStyle(ray).transform;
        if (m && m !== 'none') {
          var n = m.slice(m.indexOf('(') + 1, -1).split(',');
          out.textContent = Math.round(
            Math.abs(Math.atan2(parseFloat(n[1]), parseFloat(n[0])) * 180 / Math.PI)
          );
        }
        if (running) requestAnimationFrame(track);
      })();
    }
  }

  /* ---------------------------------------------------------
     Measurement rail.
     Scroll position drives one custom property; CSS does the
     rest. Markers latch to each major band. Recomputed on
     resize because band offsets move with the layout.
     --------------------------------------------------------- */
  var rail = document.getElementById('rail');
  if (!rail) return;

  var railN = rail.querySelector('.rail__n');
  var dotWrap = rail.querySelector('.rail__dots');
  var bands = document.querySelectorAll('main .band, main .hero, main .phero');
  var dots = [];

  Array.prototype.forEach.call(bands, function (b, i) {
    var d = document.createElement('span');
    d.className = 'rail__dot';
    d.setAttribute('aria-hidden', 'true');
    dotWrap.appendChild(d);
    dots.push({ el: d, band: b });
  });

  var ticking = false;

  function paint() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;

    rail.style.setProperty('--p', p.toFixed(4));
    if (railN) railN.textContent = Math.round(p * 100) + '\u00B0';

    // mark every band whose top has passed the viewport middle
    var mid = window.scrollY + window.innerHeight * 0.5;
    dots.forEach(function (d) {
      var top = d.band.getBoundingClientRect().top + window.scrollY;
      d.el.classList.toggle('on', mid >= top);
    });

    // flip the readout colour when the rail sits over a light band
    var probe = document.elementFromPoint(
      window.innerWidth - 60,
      window.innerHeight / 2
    );
    var light = probe && probe.closest && probe.closest('.band--paper');
    rail.classList.toggle('on-paper', !!light);

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(paint);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  paint();
})();
