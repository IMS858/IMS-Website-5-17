/**
 * IMS site assistant — chat widget
 * /assets/js/chatbot.js
 *
 * Self-contained: injects its own styles so it can't be broken by, or break,
 * the site stylesheet. Reads the brand tokens from :root when they exist and
 * falls back to literals when they don't.
 *
 * Talks to /api/chat. No dependencies. Degrades to nothing if JS is off.
 */
(function () {
  'use strict';

  if (window.__imsChat) return;
  window.__imsChat = true;

  var ENDPOINT = '/api/chat';
  var MAX_LEN = 2000;

  var GREETING =
    "Hi — I can answer questions about coaching, the Recovery Room, pricing, " +
    "and how to book. I'm an automated assistant, not a medical service, so " +
    "please don't share health details here.";

  var SUGGESTIONS = [
    'What happens at the free assessment?',
    'How much does coaching cost?',
    'What is in the Recovery Room?'
  ];

  /* ---------------------------------------------------------------
     Styles
     --------------------------------------------------------------- */
  var css = [
    '.imsc-btn{position:fixed;right:1.25rem;bottom:1.25rem;z-index:900;',
    'width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;',
    'background:var(--blue,#2a85be);color:#fff;display:flex;align-items:center;',
    'justify-content:center;box-shadow:0 4px 16px rgba(23,25,28,.22);',
    'transition:transform .2s ease,background .2s ease}',
    '.imsc-btn:hover{background:var(--blue-wall,#1c6a9c);transform:translateY(-2px)}',
    '.imsc-btn:focus-visible{outline:3px solid var(--blue-wall,#1c6a9c);outline-offset:3px}',
    '.imsc-btn svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;',
    'stroke-linecap:round;stroke-linejoin:round}',
    '.imsc-btn[aria-expanded="true"] .imsc-i-chat{display:none}',
    '.imsc-btn:not([aria-expanded="true"]) .imsc-i-x{display:none}',

    '.imsc-panel{position:fixed;right:1.25rem;bottom:5.5rem;z-index:901;',
    'width:min(380px,calc(100vw - 2.5rem));height:min(560px,calc(100vh - 8rem));',
    'background:#fff;border:1px solid var(--paper-3,#dfe5ea);border-radius:4px;',
    'box-shadow:0 12px 40px rgba(23,25,28,.18);display:flex;flex-direction:column;',
    'overflow:hidden;opacity:0;transform:translateY(10px);pointer-events:none;',
    'transition:opacity .22s ease,transform .22s ease}',
    '.imsc-panel.on{opacity:1;transform:none;pointer-events:auto}',

    '.imsc-head{background:var(--ink,#17191c);color:#fff;padding:.9rem 1rem;',
    'display:flex;align-items:center;gap:.7rem;flex:none}',
    '.imsc-head b{font-family:var(--util,system-ui),system-ui;font-size:.9375rem;',
    'font-weight:600;letter-spacing:.01em}',
    '.imsc-head span{font-family:var(--util,system-ui),system-ui;font-size:.75rem;',
    'color:#aeb6be;display:block;margin-top:.1rem}',
    '.imsc-dot{width:8px;height:8px;border-radius:50%;background:var(--blue,#2a85be);flex:none}',

    '.imsc-log{flex:1;overflow-y:auto;padding:1rem;display:flex;',
    'flex-direction:column;gap:.75rem;background:#fff}',

    '.imsc-msg{font-family:var(--util,system-ui),system-ui;font-size:.9063rem;',
    'line-height:1.55;padding:.65rem .85rem;max-width:85%;white-space:pre-wrap;',
    'overflow-wrap:break-word}',
    '.imsc-msg a{color:var(--blue-deep,#1f6d9e)}',
    '.imsc-bot{background:var(--paper-2,#f4f6f7);color:var(--ink,#17191c);align-self:flex-start}',
    '.imsc-me{background:var(--blue,#2a85be);color:#fff;align-self:flex-end}',
    '.imsc-err{background:#fdeceb;color:#8a2a22;align-self:flex-start}',

    '.imsc-typing{display:flex;gap:4px;align-items:center;padding:.75rem .85rem;',
    'background:var(--paper-2,#f4f6f7);align-self:flex-start}',
    '.imsc-typing i{width:6px;height:6px;border-radius:50%;background:#8a949e;',
    'animation:imsc-b 1.2s infinite ease-in-out}',
    '.imsc-typing i:nth-child(2){animation-delay:.15s}',
    '.imsc-typing i:nth-child(3){animation-delay:.3s}',
    '@keyframes imsc-b{0%,60%,100%{opacity:.3}30%{opacity:1}}',

    '.imsc-sugg{display:flex;flex-wrap:wrap;gap:.4rem;padding:0 1rem .75rem}',
    '.imsc-sugg button{font-family:var(--util,system-ui),system-ui;font-size:.8125rem;',
    'padding:.45rem .7rem;background:#fff;color:var(--ink,#17191c);cursor:pointer;',
    'border:1px solid var(--paper-3,#dfe5ea);border-radius:3px;text-align:left}',
    '.imsc-sugg button:hover{border-color:var(--blue,#2a85be);color:var(--blue-deep,#1f6d9e)}',

    '.imsc-foot{border-top:1px solid var(--paper-3,#dfe5ea);padding:.7rem;flex:none;background:#fff}',
    '.imsc-row{display:flex;gap:.5rem;align-items:flex-end}',
    '.imsc-row textarea{flex:1;resize:none;font-family:var(--util,system-ui),system-ui;',
    'font-size:.9375rem;line-height:1.4;padding:.6rem .7rem;border:1px solid var(--paper-3,#dfe5ea);',
    'border-radius:3px;max-height:100px;min-height:42px;color:var(--ink,#17191c);background:#fff}',
    '.imsc-row textarea:focus-visible{outline:2px solid var(--blue,#2a85be);outline-offset:0}',
    '.imsc-send{flex:none;width:42px;height:42px;border:0;border-radius:3px;cursor:pointer;',
    'background:var(--blue,#2a85be);color:#fff;display:flex;align-items:center;justify-content:center}',
    '.imsc-send:hover:not(:disabled){background:var(--blue-wall,#1c6a9c)}',
    '.imsc-send:disabled{opacity:.45;cursor:default}',
    '.imsc-send svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;',
    'stroke-linecap:round;stroke-linejoin:round}',
    '.imsc-note{font-family:var(--util,system-ui),system-ui;font-size:.75rem;',
    'color:#5f6971;margin:.5rem .1rem 0;line-height:1.45}',

    '.imsc-x{margin-left:auto;background:none;border:0;color:#aeb6be;cursor:pointer;',
    'width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:3px}',
    '.imsc-x:hover{color:#fff;background:rgba(255,255,255,.1)}',
    '.imsc-x svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}',

    '@media (max-width:30rem){.imsc-panel{right:.75rem;left:.75rem;width:auto;',
    'bottom:5rem;height:min(70vh,520px)}.imsc-btn{right:.75rem;bottom:.75rem}}',

    '@media (prefers-reduced-motion:reduce){.imsc-panel,.imsc-btn{transition:none}',
    '.imsc-typing i{animation:none;opacity:.6}}',

    '@media print{.imsc-btn,.imsc-panel{display:none!important}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------------------------------------------------------
     Markup
     --------------------------------------------------------------- */
  var btn = document.createElement('button');
  btn.className = 'imsc-btn';
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'imsc-panel');
  btn.setAttribute('aria-label', 'Open chat with the IMS assistant');
  btn.innerHTML =
    '<svg class="imsc-i-chat" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>' +
    '<svg class="imsc-i-x" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M18 6 6 18M6 6l12 12"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'imsc-panel';
  panel.id = 'imsc-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat with the IMS assistant');
  panel.innerHTML =
    '<div class="imsc-head">' +
      '<span class="imsc-dot" aria-hidden="true"></span>' +
      '<div><b>IMS assistant</b><span>Hours, pricing, and booking</span></div>' +
      '<button class="imsc-x" type="button" aria-label="Close chat">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
    '</div>' +
    '<div class="imsc-log" id="imsc-log" role="log" aria-live="polite" aria-atomic="false"></div>' +
    '<div class="imsc-sugg" id="imsc-sugg"></div>' +
    '<div class="imsc-foot">' +
      '<div class="imsc-row">' +
        '<label class="imsc-sr" for="imsc-in" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Your message</label>' +
        '<textarea id="imsc-in" rows="1" placeholder="Ask a question…" maxlength="' + MAX_LEN + '"></textarea>' +
        '<button class="imsc-send" type="button" aria-label="Send message">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
      '</div>' +
      '<p class="imsc-note">Automated assistant. Not medical advice &mdash; for anything health related, ' +
      'speak to a licensed provider or call <a href="tel:+16199371434">(619) 937-1434</a>.</p>' +
    '</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var log = panel.querySelector('#imsc-log');
  var input = panel.querySelector('#imsc-in');
  var send = panel.querySelector('.imsc-send');
  var closeX = panel.querySelector('.imsc-x');
  var suggWrap = panel.querySelector('#imsc-sugg');

  var history = [];
  var pending = false;
  var started = false;

  /* ---------------------------------------------------------------
     Rendering
     --------------------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // linkify site paths and phone/email only — never arbitrary HTML from upstream
  function fmt(text) {
    var s = esc(text);
    s = s.replace(/(^|\s)(\/[a-z0-9-]+\.html)/gi, '$1<a href="$2">$2</a>');
    s = s.replace(/\(619\)\s?937-1434/g, '<a href="tel:+16199371434">(619) 937-1434</a>');
    s = s.replace(/admin@imsfitnesscenter\.com/g, '<a href="mailto:admin@imsfitnesscenter.com">admin@imsfitnesscenter.com</a>');
    return s;
  }

  function add(role, text) {
    var d = document.createElement('div');
    d.className = 'imsc-msg ' + (role === 'user' ? 'imsc-me' : role === 'error' ? 'imsc-err' : 'imsc-bot');
    d.innerHTML = fmt(text);
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function typing(on) {
    var t = log.querySelector('.imsc-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'imsc-typing';
      t.setAttribute('aria-label', 'Assistant is typing');
      t.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else if (!on && t) {
      t.remove();
    }
  }

  function suggestions(show) {
    suggWrap.innerHTML = '';
    if (!show) return;
    SUGGESTIONS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', function () { ask(q); });
      suggWrap.appendChild(b);
    });
  }

  /* ---------------------------------------------------------------
     Sending
     --------------------------------------------------------------- */
  function ask(text) {
    text = (text || '').trim();
    if (!text || pending) return;

    suggestions(false);
    add('user', text);
    history.push({ role: 'user', content: text.slice(0, MAX_LEN) });

    input.value = '';
    input.style.height = 'auto';
    pending = true;
    send.disabled = true;
    typing(true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-20) })
    })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, data: d }; });
      })
      .then(function (res) {
        typing(false);
        if (!res.ok || res.data.error) {
          add('error', res.data.error ||
            "Sorry — I'm having trouble right now. Please call (619) 937-1434.");
          return;
        }
        var reply = res.data.reply || "I didn't catch that — could you rephrase?";
        add('bot', reply);
        history.push({ role: 'assistant', content: reply });
      })
      .catch(function () {
        typing(false);
        add('error', "I couldn't reach the assistant. Please call (619) 937-1434 " +
                     'or use the contact form.');
      })
      .finally(function () {
        pending = false;
        send.disabled = false;
        input.focus();
      });
  }

  /* ---------------------------------------------------------------
     Open / close
     --------------------------------------------------------------- */
  function open() {
    panel.classList.add('on');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close chat with the IMS assistant');
    if (!started) {
      started = true;
      add('bot', GREETING);
      suggestions(true);
    }
    setTimeout(function () { input.focus(); }, 120);
  }

  function close() {
    panel.classList.remove('on');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open chat with the IMS assistant');
    btn.focus();
  }

  btn.addEventListener('click', function () {
    panel.classList.contains('on') ? close() : open();
  });
  closeX.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('on')) close();
  });

  // keep focus inside the panel while it's open
  panel.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = panel.querySelectorAll('button, textarea, a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  send.addEventListener('click', function () { ask(input.value); });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input.value);
    }
  });

  // grow the textarea with its content, up to the CSS max
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });
})();
