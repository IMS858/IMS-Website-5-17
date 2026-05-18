/* IMS chatbot — vanilla JS, no dependencies.
 * Drops a floating "chat with IMS" bubble bottom-right on every page.
 * Calls /api/chat (serverless function) for AI replies.
 * Captures leads via Web3Forms.
 *
 * To enable email capture: replace WEB3FORMS_KEY below with your real key
 * from https://web3forms.com (free, sends to admin@imsfitnesscenter.com).
 */
(function () {
  'use strict';

  const WEB3FORMS_KEY = '6d3e0e8a-4ee6-4451-baa9-a1c634ffbb88';

  // Don't initialize twice
  if (window.__imsChatbotLoaded) return;
  window.__imsChatbotLoaded = true;

  const STYLES = `
    .ims-cb-bubble {
      position: fixed; bottom: 20px; right: 20px; z-index: 9998;
      width: 58px; height: 58px; border-radius: 50%;
      background: #2A85BE; border: none; cursor: pointer;
      box-shadow: 0 6px 24px rgba(14,58,87,0.35);
      display: grid; place-items: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ims-cb-bubble:hover { transform: scale(1.05); box-shadow: 0 8px 28px rgba(14,58,87,0.45); }
    .ims-cb-bubble svg { width: 26px; height: 26px; }
    .ims-cb-bubble[data-open="true"] svg.ims-cb-chat { display: none; }
    .ims-cb-bubble[data-open="false"] svg.ims-cb-close { display: none; }

    .ims-cb-panel {
      position: fixed; bottom: 90px; right: 20px; z-index: 9997;
      width: min(380px, calc(100vw - 32px));
      height: min(560px, calc(100vh - 130px));
      background: #FAF7F2; border-radius: 14px;
      box-shadow: 0 14px 40px rgba(14,58,87,0.25);
      display: flex; flex-direction: column; overflow: hidden;
      font-family: 'Spline Sans', system-ui, -apple-system, sans-serif;
      opacity: 0; transform: translateY(10px); pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
    }
    .ims-cb-panel[data-open="true"] { opacity: 1; transform: translateY(0); pointer-events: auto; }

    .ims-cb-header {
      background: #174E70; color: white; padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
    }
    .ims-cb-logo {
      width: 38px; height: 38px; border-radius: 6px;
      background: rgba(255,255,255,0.12); padding: 7px;
      display: grid; place-items: center; flex-shrink: 0;
    }
    .ims-cb-logo svg { width: 100%; height: 100%; display: block; }
    .ims-cb-titles { line-height: 1.2; }
    .ims-cb-title { font-family: 'Fraunces', serif; font-weight: 500; font-size: 0.98rem; }
    .ims-cb-sub { font-size: 0.72rem; opacity: 0.7; letter-spacing: 0.05em; margin-top: 2px; }

    .ims-cb-messages {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .ims-cb-msg {
      max-width: 82%; padding: 9px 13px; font-size: 0.9rem; line-height: 1.5;
      white-space: pre-wrap; word-wrap: break-word;
    }
    .ims-cb-msg-bot {
      background: #fff; color: #2B2723; align-self: flex-start;
      border: 1px solid #E3DCD0; border-radius: 14px 14px 14px 4px;
    }
    .ims-cb-msg-user {
      background: #2A85BE; color: white; align-self: flex-end;
      border-radius: 14px 14px 4px 14px;
    }
    .ims-cb-msg-system {
      align-self: center; background: transparent; color: #5A524C;
      font-size: 0.78rem; text-align: center; font-style: italic;
    }
    .ims-cb-typing { display: flex; gap: 4px; padding: 11px 14px; background: #fff; border: 1px solid #E3DCD0; border-radius: 14px 14px 14px 4px; align-self: flex-start; }
    .ims-cb-dot { width: 6px; height: 6px; border-radius: 50%; background: #5A524C; animation: ims-cb-bounce 1.2s infinite ease-in-out; }
    .ims-cb-dot:nth-child(2) { animation-delay: 0.15s; }
    .ims-cb-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes ims-cb-bounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }

    .ims-cb-starters {
      padding: 10px 14px; border-top: 1px solid #E3DCD0;
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .ims-cb-starter {
      background: white; border: 1px solid #E3DCD0; padding: 7px 11px;
      border-radius: 999px; font-size: 0.78rem; cursor: pointer; color: #174E70;
      font-family: inherit; transition: background 0.15s;
    }
    .ims-cb-starter:hover { background: #E5F0F8; }

    .ims-cb-input-row {
      padding: 10px; border-top: 1px solid #E3DCD0; background: white;
      display: flex; gap: 8px;
    }
    .ims-cb-input {
      flex: 1; padding: 9px 11px; border: 1px solid #E3DCD0; border-radius: 6px;
      font-size: 0.92rem; font-family: inherit; outline: none; resize: none;
      max-height: 100px; line-height: 1.4; color: #2B2723;
    }
    .ims-cb-input:focus { border-color: #2A85BE; }
    .ims-cb-send {
      width: 36px; height: 36px; border-radius: 6px; border: none;
      background: #2A85BE; color: white; cursor: pointer;
      display: grid; place-items: center; flex-shrink: 0; align-self: flex-end;
    }
    .ims-cb-send:disabled { background: #E3DCD0; cursor: not-allowed; }

    .ims-cb-lead {
      padding: 14px; background: #E5F0F8; border-top: 1px solid #E3DCD0;
    }
    .ims-cb-lead-title { font-family: 'Fraunces', serif; font-size: 1rem; margin: 0 0 4px; color: #0E3A57; }
    .ims-cb-lead-sub { font-size: 0.82rem; color: #5A524C; margin: 0 0 10px; line-height: 1.4; }
    .ims-cb-lead input, .ims-cb-lead textarea {
      width: 100%; padding: 8px 10px; border: 1px solid #E3DCD0; border-radius: 5px;
      font-size: 0.88rem; font-family: inherit; margin-bottom: 8px; box-sizing: border-box; outline: none;
    }
    .ims-cb-lead input:focus, .ims-cb-lead textarea:focus { border-color: #2A85BE; }
    .ims-cb-lead-actions { display: flex; gap: 8px; }
    .ims-cb-lead-submit {
      flex: 1; padding: 9px; background: #2A85BE; color: white; border: none; border-radius: 5px;
      font-size: 0.82rem; font-weight: 600; cursor: pointer; letter-spacing: 0.3px; text-transform: uppercase;
      font-family: inherit;
    }
    .ims-cb-lead-submit:disabled { background: #E3DCD0; }
    .ims-cb-lead-skip {
      padding: 9px 14px; background: transparent; color: #5A524C; border: 1px solid #E3DCD0; border-radius: 5px;
      font-size: 0.82rem; cursor: pointer; font-family: inherit;
    }
    .ims-cb-error {
      padding: 8px 10px; background: #FBEEEC; color: #B8463A; font-size: 0.8rem; border-radius: 4px;
      margin: 8px 14px; border: 1px solid #B8463A33;
    }
  `;

  const LOGO_SVG = `<svg viewBox="0 0 1547 995" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,995) scale(0.1,-0.1)" fill-rule="evenodd"><path fill="#FFFFFF" d="M422 8795 l3 -735 735 0 735 0 3 735 2 735 -740 0 -740 0 2 -735z M3818 5898 c-3 -3362 -4 -3608 -20 -3680 -75 -336 -227 -516 -549 -648 -219 -91 -478 -103 -686 -33 -327 109 -552 367 -635 728 l-22 100 -3 2143 -3 2142 -744 0 -744 0 -7 -92 c-4 -51 -5 -1027 -2 -2168 4 -2061 4 -2076 25 -2230 28 -199 35 -234 67 -360 131 -521 387 -900 790 -1167 425 -283 1069 -431 1711 -393 480 28 811 100 1124 247 585 274 962 794 1085 1498 8 44 17 98 21 120 4 22 9 1188 11 2592 l4 2551 87 7 c48 4 94 8 103 11 21 6 36 -61 159 -681 55 -280 108 -541 116 -580 19 -91 674 -3366 685 -3425 4 -25 22 -112 39 -195 31 -153 50 -247 234 -1180 121 -610 124 -622 142 -652 36 -57 6 -55 716 -54 644 1 653 2 660 21 4 11 37 168 73 348 145 717 514 2550 661 3282 85 426 159 793 164 815 9 45 32 160 56 280 8 44 19 98 24 120 4 22 15 76 24 120 9 44 27 134 41 200 13 66 106 527 205 1024 210 1050 216 1079 280 1271 144 437 333 742 636 1029 163 155 331 270 557 384 101 51 137 77 137 101 0 3 -479 6 -1064 6 l-1065 0 -25 -22 c-29 -27 -29 -23 -162 -738 -14 -74 -30 -157 -35 -185 -6 -27 -14 -72 -19 -100 -5 -27 -23 -122 -40 -210 -28 -149 -47 -247 -70 -370 -5 -27 -16 -88 -25 -135 -9 -47 -20 -107 -25 -135 -5 -27 -23 -122 -40 -210 -17 -88 -37 -194 -44 -235 -8 -41 -33 -172 -56 -290 -22 -118 -45 -237 -50 -265 -5 -27 -34 -183 -65 -345 -53 -281 -74 -393 -95 -505 -5 -27 -22 -120 -39 -205 -16 -85 -32 -168 -35 -185 -28 -150 -89 -470 -97 -510 -5 -27 -12 -66 -15 -85 -3 -19 -16 -89 -29 -155 -13 -66 -35 -181 -49 -255 -46 -247 -85 -453 -132 -695 -25 -132 -50 -265 -55 -295 -6 -30 -21 -109 -34 -175 -20 -104 -37 -195 -87 -458 -6 -33 -15 -56 -22 -54 -10 3 -19 47 -86 402 -17 88 -35 180 -40 205 -5 25 -23 119 -40 210 -17 91 -37 197 -45 235 -15 74 -46 238 -90 470 -14 77 -32 172 -40 210 -8 39 -26 133 -40 210 -15 77 -35 183 -45 235 -10 52 -28 147 -40 210 -12 63 -32 169 -45 235 -13 66 -38 194 -55 285 -17 91 -35 185 -40 210 -10 49 -36 188 -44 234 -6 36 -50 265 -81 421 -20 103 -36 189 -95 500 -6 28 -16 84 -25 125 -8 41 -33 172 -55 290 -55 289 -81 426 -129 680 -106 553 -132 688 -141 730 -5 25 -23 119 -40 210 -17 91 -35 188 -41 215 -5 28 -20 104 -32 170 l-23 120 -1217 3 -1217 2 -2 -3602z M12025 9484 c-607 -72 -1080 -246 -1435 -529 -388 -310 -659 -790 -750 -1330 -34 -205 -43 -337 -43 -610 1 -270 13 -419 47 -595 136 -689 502 -1213 1132 -1625 66 -42 131 -86 146 -96 15 -10 29 -19 31 -19 3 0 52 -29 110 -64 106 -66 456 -253 842 -451 325 -167 653 -343 729 -392 259 -167 429 -385 520 -664 75 -231 78 -602 6 -831 -128 -412 -449 -662 -894 -698 -123 -10 -309 1 -423 25 -277 58 -503 217 -615 431 -127 244 -143 425 -147 1614 -1 394 -5 629 -12 653 -15 55 -71 111 -166 168 -396 233 -716 495 -925 754 -103 129 -174 235 -292 439 -62 105 -116 191 -121 191 -19 0 -26 -590 -20 -1810 7 -1471 16 -1736 70 -2028 68 -362 221 -701 436 -962 63 -77 216 -228 294 -291 258 -208 654 -384 1030 -460 11 -2 40 -8 65 -13 58 -12 202 -37 310 -52 131 -19 690 -21 825 -3 341 44 633 114 877 209 190 75 393 184 544 293 129 93 326 291 416 418 215 305 324 594 395 1054 26 165 25 873 0 1095 -40 338 -105 568 -233 815 -172 335 -430 611 -804 860 -52 35 -113 75 -135 90 -42 28 -293 177 -380 225 -27 16 -122 69 -210 118 -239 135 -419 233 -620 337 -343 177 -603 321 -705 390 -78 53 -194 162 -261 247 -238 299 -299 801 -143 1184 110 270 324 461 614 546 91 27 103 28 305 27 194 -1 218 -3 309 -27 380 -102 608 -368 680 -795 12 -71 36 -334 36 -396 0 -14 77 -16 755 -16 l755 0 0 263 c0 311 -20 476 -85 722 -71 267 -220 561 -392 775 -62 77 -231 245 -313 311 -151 123 -429 274 -630 342 -222 76 -472 130 -755 162 -162 18 -613 18 -770 -1z"/></g></svg>`;

  const STARTERS = [
    "Tell me about the IMS Method",
    "How much is coaching?",
    "What's the Recovery Room?",
    "Can I just try one session?",
  ];

  const WELCOME = "Hey, I'm Jason's assistant. Happy to answer questions about the IMS Method, pricing, or the Recovery Room — or help you book a free Movement Assessment. What's on your mind?";

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // Build DOM
  const bubble = document.createElement('button');
  bubble.className = 'ims-cb-bubble';
  bubble.setAttribute('data-open', 'false');
  bubble.setAttribute('aria-label', 'Open chat with IMS');
  bubble.innerHTML = `
    <svg class="ims-cb-chat" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg class="ims-cb-close" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="white" stroke-width="2.2" stroke-linecap="round"/></svg>
  `;
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.className = 'ims-cb-panel';
  panel.setAttribute('data-open', 'false');
  panel.innerHTML = `
    <div class="ims-cb-header">
      <div class="ims-cb-logo">${LOGO_SVG}</div>
      <div class="ims-cb-titles">
        <div class="ims-cb-title">IMS Assistant</div>
        <div class="ims-cb-sub">Usually replies in a few seconds</div>
      </div>
    </div>
    <div class="ims-cb-messages" id="ims-cb-messages"></div>
    <div class="ims-cb-starters" id="ims-cb-starters"></div>
    <div class="ims-cb-input-row">
      <textarea class="ims-cb-input" id="ims-cb-input" rows="1" placeholder="Type a message…"></textarea>
      <button class="ims-cb-send" id="ims-cb-send" disabled aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l14-7-7 14-2-5-5-2z" stroke="white" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  // State
  let isOpen = false;
  let messages = [];
  let pending = false;
  let leadShown = false;

  const messagesEl = panel.querySelector('#ims-cb-messages');
  const startersEl = panel.querySelector('#ims-cb-starters');
  const inputEl = panel.querySelector('#ims-cb-input');
  const sendBtn = panel.querySelector('#ims-cb-send');

  function toggle() {
    isOpen = !isOpen;
    bubble.setAttribute('data-open', String(isOpen));
    panel.setAttribute('data-open', String(isOpen));
    if (isOpen && messages.length === 0) {
      addBotMessage(WELCOME);
      renderStarters();
    }
    if (isOpen) setTimeout(() => inputEl.focus(), 200);
  }

  bubble.addEventListener('click', toggle);

  function renderStarters() {
    startersEl.innerHTML = '';
    if (messages.length > 2) { startersEl.style.display = 'none'; return; }
    startersEl.style.display = 'flex';
    STARTERS.forEach(text => {
      const btn = document.createElement('button');
      btn.className = 'ims-cb-starter';
      btn.textContent = text;
      btn.addEventListener('click', () => sendMessage(text));
      startersEl.appendChild(btn);
    });
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addBotMessage(text) {
    messages.push({ role: 'assistant', content: text });
    const el = document.createElement('div');
    el.className = 'ims-cb-msg ims-cb-msg-bot';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', content: text });
    const el = document.createElement('div');
    el.className = 'ims-cb-msg ims-cb-msg-user';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'ims-cb-msg ims-cb-msg-system';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'ims-cb-typing';
    el.id = 'ims-cb-typing';
    el.innerHTML = '<span class="ims-cb-dot"></span><span class="ims-cb-dot"></span><span class="ims-cb-dot"></span>';
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('ims-cb-typing');
    if (el) el.remove();
  }

  function showError(text) {
    const el = document.createElement('div');
    el.className = 'ims-cb-error';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  async function sendMessage(text) {
    if (pending || !text.trim()) return;
    addUserMessage(text.trim());
    inputEl.value = '';
    sendBtn.disabled = true;
    renderStarters();
    pending = true;
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      hideTyping();
      if (!res.ok) {
        showError('Sorry — having trouble connecting. Try again in a moment, or call (619) 937-1434.');
        return;
      }
      const data = await res.json();
      const reply = data.reply || 'Sorry, I didn\'t catch that.';
      addBotMessage(reply);

      // Show lead capture after 2+ exchanges
      if (!leadShown && messages.filter(m => m.role === 'user').length >= 2) {
        showLeadForm();
        leadShown = true;
      }
    } catch (e) {
      hideTyping();
      showError('Connection failed. Try again or call (619) 937-1434.');
    } finally {
      pending = false;
    }
  }

  function showLeadForm() {
    const form = document.createElement('div');
    form.className = 'ims-cb-lead';
    form.innerHTML = `
      <p class="ims-cb-lead-title">Want Jason to follow up?</p>
      <p class="ims-cb-lead-sub">Drop your contact and he'll reach out within a day.</p>
      <input type="text" id="ims-cb-name" placeholder="Your name" autocomplete="name" />
      <input type="email" id="ims-cb-email" placeholder="Email" autocomplete="email" />
      <textarea id="ims-cb-note" placeholder="Anything specific Jason should know? (optional)" rows="2"></textarea>
      <div class="ims-cb-lead-actions">
        <button class="ims-cb-lead-submit" id="ims-cb-lead-submit">Send to Jason</button>
        <button class="ims-cb-lead-skip" id="ims-cb-lead-skip">Skip</button>
      </div>
    `;
    messagesEl.appendChild(form);
    scrollToBottom();

    form.querySelector('#ims-cb-lead-submit').addEventListener('click', () => submitLead(form));
    form.querySelector('#ims-cb-lead-skip').addEventListener('click', () => form.remove());
  }

  async function submitLead(form) {
    const name = form.querySelector('#ims-cb-name').value.trim();
    const email = form.querySelector('#ims-cb-email').value.trim();
    const note = form.querySelector('#ims-cb-note').value.trim();
    if (!name || !email) {
      form.querySelector('.ims-cb-lead-sub').textContent = 'Name and email required.';
      return;
    }
    const submitBtn = form.querySelector('#ims-cb-lead-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const conversation = messages.map(m => `${m.role === 'user' ? 'Visitor' : 'Bot'}: ${m.content}`).join('\n\n');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New chat lead from IMS site: ${name}`,
          from_name: 'IMS Chatbot',
          name, email,
          message: `${note ? note + '\n\n---\n\n' : ''}Conversation:\n${conversation}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        form.innerHTML = `<p class="ims-cb-lead-title">Got it.</p><p class="ims-cb-lead-sub">Jason will reach out shortly. Talk soon.</p>`;
      } else {
        throw new Error(data.message || 'Submit failed');
      }
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send to Jason';
      const sub = form.querySelector('.ims-cb-lead-sub');
      sub.textContent = 'Failed to send. Try again or text (619) 937-1434.';
      sub.style.color = '#B8463A';
    }
  }

  inputEl.addEventListener('input', () => {
    sendBtn.disabled = !inputEl.value.trim() || pending;
    // Auto-grow
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
})();
