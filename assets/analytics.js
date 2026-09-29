/* IMS public-site analytics. Basic consent: no Google Analytics tag before opt-in.
   This file is never installed in Coach OS. No forms, self-check results or chat
   contents are read. See /analytics-privacy.html and docs/GA4-INSTALLATION.md. */
(function () {
  'use strict';
  if (window.__imsAnalyticsV1) return;
  window.__imsAnalyticsV1 = true;
  var ID = 'G-9CYYFYT8ZY';
  var KEY = 'ims.analytics-consent.v2';
  var TTL = 180 * 24 * 60 * 60 * 1000;
  var HOSTS = ['imsmethod.com', 'www.imsmethod.com'];
  var PAGES = {
    '/': 'IMS | Home', '/index.html': 'IMS | Home',
    '/about.html': 'IMS | About', '/about': 'IMS | About',
    '/coaching.html': 'IMS | Coaching', '/coaching': 'IMS | Coaching',
    '/memberships.html': 'IMS | Memberships', '/memberships': 'IMS | Memberships',
    '/the-ims-method.html': 'IMS | Method', '/the-ims-method': 'IMS | Method',
    '/recovery-room.html': 'IMS | Recovery', '/recovery-room': 'IMS | Recovery',
    '/blog.html': 'IMS | Articles', '/blog': 'IMS | Articles',
    '/faq.html': 'IMS | FAQ', '/faq': 'IMS | FAQ',
    '/morning-routine.html': 'IMS | Morning routine', '/morning-routine': 'IMS | Morning routine'
  };
  var CAMPAIGNS = {
    utm_source: ['google', 'bing', 'instagram', 'facebook', 'newsletter'],
    utm_medium: ['organic', 'cpc', 'social', 'email', 'referral'],
    utm_campaign: ['gbp_profile', 'private_training', 'mobility', 'bod_pod_fuel']
  };
  var panel, status, accept, opener, active = false, started = false;
  var loaded = false, failed = false, previousFocus = null;
  window['ga-disable-' + ID] = true;
  function privacySignal() { return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1'; }
  function preference() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || 'null');
      return value && (value.choice === 'granted' || value.choice === 'denied') && Number.isFinite(value.expires) && value.expires > Date.now() && value.expires <= Date.now() + TTL + 60000 ? value.choice : null;
    } catch (_) { return null; }
  }
  function remember(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, expires: Date.now() + TTL })); return true; }
    catch (_) { return false; }
  }
  function allowedPage() {
    if (window.location.protocol !== 'https:' || HOSTS.indexOf(window.location.hostname) === -1 || window.location.port) return false;
    if (!Object.prototype.hasOwnProperty.call(PAGES, window.location.pathname) || window.location.hash || document.querySelector('form, iframe')) return false;
    var params = new URLSearchParams(window.location.search), seen = {}, ok = true;
    params.forEach(function (value, key) {
      if (!Object.prototype.hasOwnProperty.call(CAMPAIGNS, key) || seen[key] || CAMPAIGNS[key].indexOf(value) === -1) ok = false;
      seen[key] = true;
    });
    return ok;
  }
  function referrerOrigin() {
    try { var url = new URL(document.referrer); return url.protocol === 'https:' && !url.username && !url.password ? url.origin + '/' : ''; }
    catch (_) { return ''; }
  }
  function eraseCookies() {
    (document.cookie || '').split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (/^ims_ga4(?:_|$)/.test(name)) document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax; Secure';
    });
  }
  function showMessage(text) { if (status) status.textContent = text; }
  function stop(reload) {
    active = false; window['ga-disable-' + ID] = true; eraseCookies();
    var script = document.getElementById('ims-google-analytics'); if (script) script.remove();
    // Removing the element cannot unload executed third-party code; reload denied.
    if (reload && started) window.location.reload();
  }
  function start() {
    if (active || started) return;
    if (privacySignal()) { stop(false); showMessage('Analytics is off because your browser sends a privacy preference.'); return; }
    if (!allowedPage()) { showMessage('Choice saved. Analytics does not run on this page, URL, or preview domain.'); return; }
    if (document.querySelector('script[src*="googletagmanager.com/"],script[src*="google-analytics.com/"]') || typeof window.gtag === 'function') { showMessage('Another Google tag installation was detected. IMS did not load a second copy.'); return; }
    started = true; active = true; window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', ID, {
      send_page_view: true, page_title: PAGES[window.location.pathname], page_location: window.location.origin + window.location.pathname, page_referrer: referrerOrigin(),
      cookie_domain: 'none', cookie_prefix: 'ims_ga4', cookie_expires: 15552000, cookie_flags: 'SameSite=Lax;Secure', allow_google_signals: false, allow_ad_personalization_signals: false
    });
    var script = document.createElement('script'); script.id = 'ims-google-analytics'; script.async = true; script.referrerPolicy = 'no-referrer';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    script.onload = function () { loaded = true; if (active) showMessage('Analytics tag loaded. Google report delivery still needs verification.'); };
    script.onerror = function () { failed = true; stop(false); showMessage('Analytics could not load. The website still works; no repeated loading was attempted.'); };
    document.head.appendChild(script);
    showMessage('Analytics allowed. Loading the tag does not prove delivery to Google Analytics.');
  }
  // Only fixed engagement codes are accepted. No message or model-output payload.
  var chatEvents = ['ims_chat_open', 'ims_chat_send', 'ims_chat_answer', 'ims_chat_error', 'ims_chat_topic_assessment', 'ims_chat_topic_pricing', 'ims_chat_topic_recovery', 'ims_chat_booking_click', 'ims_chat_contact_click', 'ims_chat_phone_click'];
  var chatEventCount = 0;
  window.imsChatMetric = function (code) {
    if (arguments.length !== 1 || chatEvents.indexOf(code) === -1 || !active || !loaded || failed || privacySignal() || !allowedPage() || window['ga-disable-' + ID] !== false || typeof window.gtag !== 'function' || chatEventCount >= 50) return false;
    try {
      window.gtag('event', code, { send_to: ID, page_title: PAGES[window.location.pathname], page_location: window.location.origin + window.location.pathname, page_referrer: referrerOrigin() });
      chatEventCount += 1; return true;
    } catch (_) { return false; }
  };
  function choose(choice) {
    if (choice === 'granted' && privacySignal()) { showMessage('Your browser privacy preference keeps analytics off.'); return; }
    var saved = remember(choice);
    if (choice === 'granted') start(); else { stop(true); showMessage('Analytics is off.'); }
    if (!saved) { showMessage('Your browser could not save the preference. It applies only to this page; future pages ask again.'); return; }
    if (!failed) { panel.hidden = true; if (opener && previousFocus) previousFocus.focus(); }
  }
  function button(id, text, handler) { var el = document.createElement('button'); el.type = 'button'; el.id = id; el.textContent = text; el.addEventListener('click', handler); return el; }
  function openPreferences() {
    previousFocus = document.activeElement; panel.hidden = false;
    showMessage(privacySignal() ? 'Analytics is off because of your browser privacy preference.' : failed ? 'Analytics failed to load. The website remains usable.' : !allowedPage() ? 'Analytics does not run on this page, URL, or preview domain.' : active ? (loaded ? 'Analytics allowed; tag loaded. Report delivery is not verified here.' : 'Analytics allowed; tag loading.') : 'Analytics is off until you allow it.');
    panel.focus();
  }
  function setup() {
    var style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/assets/analytics.css?v=1'; document.head.appendChild(style);
    panel = document.createElement('section'); panel.id = 'ims-analytics-preferences'; panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', 'ims-analytics-title'); panel.setAttribute('tabindex', '-1'); panel.hidden = true;
    var heading = document.createElement('h2'); heading.id = 'ims-analytics-title'; heading.textContent = 'Optional website analytics'; panel.appendChild(heading);
    var copy = document.createElement('p'); copy.textContent = 'Allow Google Analytics to count visits and chatbot interactions on selected public pages? It is off until you agree. No advertising permission is requested. Booking, contact forms, movement self-checks and private coaching pages are excluded from this installation. Raw conversations are not sent to analytics.'; panel.appendChild(copy);
    var notice = document.createElement('a'); notice.href = '/analytics-privacy.html'; notice.textContent = 'Read the analytics privacy notice'; panel.appendChild(notice);
    status = document.createElement('p'); status.id = 'ims-analytics-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); panel.appendChild(status);
    var actions = document.createElement('div'); actions.className = 'ims-analytics-actions';
    actions.appendChild(button('ims-analytics-deny', 'Decline analytics', function () { choose('denied'); }));
    accept = button('ims-analytics-allow', 'Allow analytics', function () { choose('granted'); }); accept.disabled = privacySignal(); actions.appendChild(accept);
    actions.appendChild(button('ims-analytics-close', 'Close preferences', function () { panel.hidden = true; if (previousFocus) previousFocus.focus(); }));
    panel.appendChild(actions); document.body.appendChild(panel);
    var footer = document.querySelector('footer .legal') || document.querySelector('footer') || document.body;
    var links = document.createElement('p'); links.className = 'ims-analytics-footer';
    opener = button('ims-analytics-open', 'Analytics preferences', openPreferences); links.appendChild(opener);
    var policy = document.createElement('a'); policy.href = '/analytics-privacy.html'; policy.textContent = 'Analytics privacy notice'; links.appendChild(policy); footer.appendChild(links);
    if (/^\/privacy(?:\.html)?$/.test(window.location.pathname)) {
      var prose = document.querySelector('.prose');
      if (prose) { var supplement = document.createElement('p'); supplement.textContent = 'Optional Google Analytics page and chatbot interaction counts are available on selected public pages only after consent; raw conversations are excluded. See the analytics privacy supplement and use Analytics preferences to decline or withdraw consent. When direct contact delivery is enabled, Resend delivers contact messages and IMS Coach OS may retain the inquiry for follow-up. Other forms continue through Web3Forms.'; var link = document.createElement('a'); link.href = '/analytics-privacy.html'; link.textContent = ' Analytics privacy supplement'; supplement.appendChild(link); prose.appendChild(supplement); }
    }
    if (privacySignal()) { stop(false); showMessage('Analytics is off because your browser sends a privacy preference.'); }
    else if (preference() === 'granted') start();
    else if (preference() === null && Object.prototype.hasOwnProperty.call(PAGES, window.location.pathname)) { panel.hidden = false; showMessage('Declining will not affect booking or website access.'); }
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !panel.hidden) { panel.hidden = true; if (previousFocus) previousFocus.focus(); } });
    window.addEventListener('storage', function (event) { if (event.key === KEY || event.key === null) { if (preference() !== 'granted') stop(true); else if (!started) start(); } });
    window.addEventListener('pageshow', function (event) { if (event.persisted && (privacySignal() || preference() !== 'granted')) stop(true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
