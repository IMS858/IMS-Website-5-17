/* =========================================================
   IMS — Innovative Movement Solutions
   Site-wide JavaScript (vanilla)
   ========================================================= */

(function () {
  'use strict';

  // ---- Mobile navigation toggle ----
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');

  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on link click
    nav.querySelectorAll('.nav__mobile a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Active nav link highlighting ----
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html') ||
        (path === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ---- Reveal on scroll ----
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.classList.add('is-revealed');
    });
  }

  // ---- Lead-magnet form handler (front-end only — connect to GoHighLevel) ----
  document.querySelectorAll('form[data-form="lead-magnet"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (!email || !email.value) return;

      // TODO: Replace with real GoHighLevel form endpoint
      // fetch('https://api.gohighlevel.com/...', { method: 'POST', body: ... })

      form.innerHTML =
        '<div style="padding: 1.25rem; background: var(--white); border: 1.5px solid var(--blue);' +
        ' border-radius: 4px; color: var(--charcoal); text-align: center;">' +
        '<strong>Check your inbox.</strong><br>' +
        '<span style="font-size: 0.92rem; color: var(--charcoal-soft);">' +
        'The CARs routine PDF + walkthrough video are on their way.</span></div>';
    });
  });

  // ---- Contact form handler (front-end only) ----
  document.querySelectorAll('form[data-form="contact"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // TODO: wire to backend / email service / GoHighLevel
      form.innerHTML =
        '<div style="padding: 1.5rem; background: var(--cream-soft); border-radius: 8px; text-align: center;">' +
        '<h3 style="font-family: var(--display); margin-bottom: 0.5rem;">Got it — talk soon.</h3>' +
        '<p style="color: var(--charcoal-soft); margin: 0;">Jason will reach out within one business day. ' +
        'For anything urgent, call <strong>(619) 937-1434</strong>.</p></div>';
    });
  });

  // ---- Year in footer ----
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

})();
