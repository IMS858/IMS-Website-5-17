/* Progressive enhancement: preserve the existing provider unless direct sending
   is configured and explicitly enabled. Never fall back after a possible send. */
(function () {
  'use strict';
  if (window.__imsDirectContactV1) return;
  window.__imsDirectContactV1 = true;
  function setup() {
    var form = document.querySelector('form[action="https://api.web3forms.com/submit"]');
    if (!form || !/^\/contact(?:\.html)?$/.test(window.location.pathname)) return;
    fetch('/api/contact', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (r) { if (r && r.direct_delivery === true) enhance(form); })
      .catch(function () { /* Existing form continues to work. */ });
  }
  function enhance(form) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    var status = document.createElement('p'); status.className = 'form__note';
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); form.appendChild(status);
    var notice = document.createElement('p'); notice.className = 'form__note';
    notice.textContent = 'This message is delivered using Resend and may be recorded in IMS Coach OS. Please do not include medical records or sensitive health details. See our privacy policy.'; form.appendChild(notice);
    var busy = false, pending = null, completed = false;
    var fields = form.querySelectorAll('input, textarea, select');
    function lock(locked) { Array.prototype.forEach.call(fields, function (input) { input.disabled = locked; }); }
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy || completed) return;
      if (!pending) {
        if (!form.reportValidity()) return;
        var values = new FormData(form);
        pending = JSON.stringify({ name: values.get('name'), email: values.get('email'), phone: values.get('phone') || '', message: values.get('message'), botcheck: values.get('botcheck') || '' });
      }
      busy = true; lock(true); button.disabled = true; status.textContent = 'Sending…';
      try {
        var response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: pending, signal: AbortSignal.timeout(30000) });
        var receipt = await response.json().catch(function () { return null; });
        if (response.ok && receipt && receipt.ok === true) {
          completed = true; pending = null; form.reset();
          status.textContent = 'Your message was accepted. The studio will respond personally; this is not an appointment confirmation.';
          button.textContent = 'Message accepted';
        } else if (response.status === 400 || response.status === 413) {
          pending = null; lock(false); status.textContent = 'Please check your name, email and message length, then try again.';
        } else {
          status.textContent = 'We could not confirm acceptance. Retry the same message using the button below. Your fields are held unchanged to reduce duplicates. You may also call (619) 937-1434.';
          button.textContent = 'Retry same message';
        }
      } catch (_) {
        status.textContent = 'The connection was interrupted. Retry the same message; we will not automatically send it through another provider.';
        button.textContent = 'Retry same message';
      } finally { busy = false; button.disabled = completed; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
