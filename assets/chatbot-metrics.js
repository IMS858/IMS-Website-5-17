/* Fixed chatbot engagement codes only. No text, model output or identifiers. */
(function () {
  'use strict';
  if (window.__imsChatMetricsV1) return;
  window.__imsChatMetricsV1 = true;
  function track(code) {
    try { if (typeof window.imsChatMetric === 'function') window.imsChatMetric(code); }
    catch (_) { /* Analytics must never interrupt the conversation. */ }
  }
  var topics = ['ims_chat_topic_assessment', 'ims_chat_topic_pricing', 'ims_chat_topic_recovery'];
  // Capture before the widget removes the preset buttons. Their order is a
  // tested contract, and their displayed text is never read by analytics.
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    var suggestion = target && target.closest('#imsc-sugg button');
    if (!suggestion) return;
    var buttons = document.querySelectorAll('#imsc-sugg button');
    if (buttons.length !== topics.length) return;
    var index = Array.prototype.indexOf.call(buttons, suggestion);
    if (index >= 0) track(topics[index]);
  }, true);
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) return;
    var toggle = target.closest('.imsc-btn');
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') track('ims_chat_open');
    var link = target.closest('#imsc-panel a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (href === '/book.html') track('ims_chat_booking_click');
    else if (href === '/contact.html') track('ims_chat_contact_click');
    else if (href === 'tel:+16199371434') track('ims_chat_phone_click');
  });
  function attach() {
    var log = document.getElementById('imsc-log'), suggestions = document.getElementById('imsc-sugg');
    if (!log || !suggestions) return false;
    // Observe new rendered bubbles without reading their contents. The first
    // bot bubble is the widget greeting, not a generated answer.
    var greeted = !!log.querySelector('.imsc-bot');
    var bubbles = new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (!node.matches) return;
          if (node.matches('.imsc-me')) track('ims_chat_send');
          else if (node.matches('.imsc-err')) track('ims_chat_error');
          else if (node.matches('.imsc-bot')) {
            if (greeted) track('ims_chat_answer'); else greeted = true;
          }
        });
      });
    });
    bubbles.observe(log, { childList: true });
    return true;
  }
  if (typeof MutationObserver !== 'function') return;
  if (!attach()) {
    var pending = new MutationObserver(function () { if (attach()) pending.disconnect(); });
    pending.observe(document.body, { childList: true, subtree: true });
  }
})();
