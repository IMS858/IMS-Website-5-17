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

  // ---- Web3Forms access key (shared with chatbot) ----
  const WEB3FORMS_KEY = '6d3e0e8a-4ee6-4451-baa9-a1c634ffbb88';

  // ---- Helper: submit JSON to Web3Forms ----
  function submitToWeb3Forms(payload) {
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ access_key: WEB3FORMS_KEY }, payload)),
    }).then(function (r) { return r.json(); });
  }

  // ---- Helper: render a result panel inside a form ----
  function renderFormResult(form, ok, title, body) {
    const bg = ok ? 'var(--cream-soft)' : '#FBEEEC';
    const accent = ok ? 'var(--blue)' : '#B8463A';
    form.innerHTML =
      '<div style="padding: 1.5rem; background: ' + bg + '; border-radius: 8px; text-align: center; border-left: 3px solid ' + accent + ';">' +
        '<h3 style="font-family: var(--display); margin: 0 0 0.5rem; color: var(--charcoal);">' + title + '</h3>' +
        '<p style="color: var(--charcoal-soft); margin: 0; line-height: 1.5;">' + body + '</p>' +
      '</div>';
  }

  // ---- Lead-magnet form (CARs Routine waitlist) ----
  document.querySelectorAll('form[data-form="lead-magnet"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value.trim()) return;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      submitToWeb3Forms({
        subject: 'New CARs Routine waitlist signup — IMS site',
        from_name: 'IMS Website',
        email: emailInput.value.trim(),
        message: 'Visitor signed up for the CARs Routine on the IMS homepage. Send the routine when it launches.',
      }).then(function (data) {
        if (data && data.success) {
          renderFormResult(form, true,
            "You're on the list.",
            "Jason will email you the 5-Minute Morning CARs Routine the moment it's ready. No spam in the meantime.");
        } else {
          renderFormResult(form, false,
            "Hmm — that didn't go through.",
            "Try again in a moment, or text (619) 937-1434.");
        }
      }).catch(function () {
        renderFormResult(form, false,
          "Hmm — that didn't go through.",
          "Try again in a moment, or text (619) 937-1434.");
      });
    });
  });

  // ---- Contact form ----
  document.querySelectorAll('form[data-form="contact"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name    = form.querySelector('[name="name"]');
      const email   = form.querySelector('[name="email"]');
      const phone   = form.querySelector('[name="phone"]');
      const message = form.querySelector('[name="message"]');

      if (!name || !name.value.trim() || !email || !email.value.trim() || !message || !message.value.trim()) {
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      submitToWeb3Forms({
        subject: 'New contact-form message from IMS site: ' + name.value.trim(),
        from_name: 'IMS Website',
        name:    name.value.trim(),
        email:   email.value.trim(),
        phone:   phone && phone.value ? phone.value.trim() : '',
        message: message.value.trim(),
      }).then(function (data) {
        if (data && data.success) {
          renderFormResult(form, true,
            "Got it — talk soon.",
            "Jason will reach out within one business day. For anything urgent, call <strong>(619) 937-1434</strong>.");
        } else {
          renderFormResult(form, false,
            "Hmm — that didn't go through.",
            "Try again, or call <strong>(619) 937-1434</strong> directly.");
        }
      }).catch(function () {
        renderFormResult(form, false,
          "Hmm — that didn't go through.",
          "Try again, or call <strong>(619) 937-1434</strong> directly.");
      });
    });
  });

  // ---- Year in footer ----
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

})();
