/**
 * FJMedia Lead Bot — Embeddable Widget
 * Drop this script tag into any HTML page:
 * <script src="https://your-vercel-url.vercel.app/widget.js"><\/script>
 *
 * The widget auto-injects the chat bubble into the page.
 * API calls go to the same Vercel deployment.
 */

(function () {
  const API_URL = 'https://fjmedia-ai.vercel.app/api/chat';

  // --- Styles ---
  const style = document.createElement('style');
  style.textContent = `
    #fjm-widget-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a84c, #e8c96d);
      border: none;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(201,168,76,.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      transition: transform .2s, box-shadow .2s;
    }
    #fjm-widget-btn:hover { transform: scale(1.08); box-shadow: 0 10px 32px rgba(201,168,76,.55); }
    #fjm-widget-btn svg { width: 26px; height: 26px; fill: #0b1120; }

    #fjm-widget-badge {
      position: fixed;
      bottom: 80px;
      right: 28px;
      background: #ef4444;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fjm-badge-pop .3s ease;
    }
    @keyframes fjm-badge-pop {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    #fjm-chat-panel {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 360px;
      max-height: 540px;
      background: #111827;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9997;
      font-family: 'Inter', -apple-system, sans-serif;
      transform: translateY(20px) scale(.95);
      opacity: 0;
      pointer-events: none;
      transition: transform .25s ease, opacity .25s ease;
    }
    #fjm-chat-panel.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: all;
    }

    #fjm-chat-header {
      padding: 16px 20px;
      background: #0b1120;
      border-bottom: 1px solid rgba(255,255,255,.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #fjm-chat-header-left { display: flex; align-items: center; gap: 12px; }
    .fjm-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #c9a84c, #e8c96d);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: #0b1120; flex-shrink: 0;
    }
    .fjm-header-info h4 { color: #fff; font-size: 14px; font-weight: 600; margin: 0; }
    .fjm-header-info p { color: #6b7280; font-size: 11px; margin: 2px 0 0; }
    .fjm-online { display: inline-block; width: 7px; height: 7px; background: #22c55e; border-radius: 50%; margin-right: 4px; animation: fjm-pulse 2s infinite; }
    @keyframes fjm-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    #fjm-close-btn {
      background: none; border: none; cursor: pointer; color: #6b7280;
      font-size: 20px; line-height: 1; padding: 4px; transition: color .2s;
    }
    #fjm-close-btn:hover { color: #fff; }

    #fjm-messages {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth;
    }
    #fjm-messages::-webkit-scrollbar { width: 3px; }
    #fjm-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }

    .fjm-msg { display: flex; gap: 7px; max-width: 85%; animation: fjm-msg-in .2s ease; }
    @keyframes fjm-msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .fjm-msg.bot { align-self: flex-start; }
    .fjm-msg.user { align-self: flex-end; flex-direction: row-reverse; }

    .fjm-msg-av {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #c9a84c, #e8c96d);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: #0b1120; flex-shrink: 0; margin-top: 2px;
    }
    .fjm-bubble {
      padding: 10px 13px; border-radius: 14px;
      font-size: 13px; line-height: 1.55;
    }
    .fjm-msg.bot .fjm-bubble { background: #1e293b; color: #e2e8f0; border-bottom-left-radius: 3px; }
    .fjm-msg.user .fjm-bubble { background: linear-gradient(135deg,#c9a84c,#e8c96d); color: #0b1120; font-weight: 500; border-bottom-right-radius: 3px; }

    .fjm-typing { display: flex; gap: 7px; align-self: flex-start; }
    .fjm-typing-bubble { background: #1e293b; border-radius: 14px; border-bottom-left-radius: 3px; padding: 12px 15px; display: flex; gap: 4px; align-items: center; }
    .fjm-dot { width: 6px; height: 6px; background: #6b7280; border-radius: 50%; animation: fjm-bounce .8s infinite; }
    .fjm-dot:nth-child(2){animation-delay:.15s} .fjm-dot:nth-child(3){animation-delay:.3s}
    @keyframes fjm-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }

    #fjm-input-area {
      padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,.06);
      display: flex; gap: 8px; background: #0b1120;
    }
    #fjm-input {
      flex: 1; background: #1e293b; border: 1px solid rgba(255,255,255,.08);
      border-radius: 10px; padding: 10px 13px; color: #e2e8f0;
      font-size: 13px; font-family: inherit; outline: none;
      transition: border-color .2s; resize: none; line-height: 1.4; max-height: 80px;
    }
    #fjm-input:focus { border-color: rgba(201,168,76,.4); }
    #fjm-input::placeholder { color: #4b5563; }
    #fjm-send {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg,#c9a84c,#e8c96d);
      border: none; cursor: pointer; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; align-self: flex-end;
      transition: opacity .2s, transform .15s;
    }
    #fjm-send:hover { opacity: .88; transform: scale(1.05); }
    #fjm-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }
    #fjm-send svg { width: 16px; height: 16px; fill: #0b1120; }
    #fjm-powered { text-align: center; padding: 6px; font-size: 10px; color: #374151; background: #0b1120; }

    @media (max-width: 480px) {
      #fjm-chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 90px; }
      #fjm-widget-btn { right: 16px; bottom: 20px; }
    }
  `;
  document.head.appendChild(style);

  // --- HTML ---
  const panel = document.createElement('div');
  panel.id = 'fjm-chat-panel';
  panel.innerHTML = `
    <div id="fjm-chat-header">
      <div id="fjm-chat-header-left">
        <div class="fjm-avatar">FJ</div>
        <div class="fjm-header-info">
          <h4>FJMedia AI</h4>
          <p><span class="fjm-online"></span>Online now</p>
        </div>
      </div>
      <button id="fjm-close-btn">&#x2715;</button>
    </div>
    <div id="fjm-messages"></div>
    <div id="fjm-input-area">
      <textarea id="fjm-input" placeholder="Type your message..." rows="1"></textarea>
      <button id="fjm-send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
    <div id="fjm-powered">Powered by FJMedia AI</div>
  `;
  document.body.appendChild(panel);

  const btn = document.createElement('button');
  btn.id = 'fjm-widget-btn';
  btn.setAttribute('aria-label', 'Open FJMedia chat');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
  document.body.appendChild(btn);

  // --- State ---
  let history = [];
  let loading = false;
  let opened = false;

  const messagesEl = document.getElementById('fjm-messages');
  const inputEl = document.getElementById('fjm-input');
  const sendEl = document.getElementById('fjm-send');

  function togglePanel() {
    panel.classList.toggle('open');
    removeBadge();
    if (!opened && panel.classList.contains('open')) {
      opened = true;
      setTimeout(greet, 500);
    }
  }

  function removeBadge() {
    const b = document.getElementById('fjm-widget-badge');
    if (b) b.remove();
  }

  function addBadge() {
    if (document.getElementById('fjm-widget-badge') || panel.classList.contains('open')) return;
    const b = document.createElement('div');
    b.id = 'fjm-widget-badge';
    b.textContent = '1';
    document.body.appendChild(b);
  }

  btn.addEventListener('click', togglePanel);
  document.getElementById('fjm-close-btn').addEventListener('click', () => panel.classList.remove('open'));

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendEl.addEventListener('click', sendMessage);

  function addMsg(role, text) {
    const d = document.createElement('div');
    d.className = `fjm-msg ${role}`;
    if (role === 'bot') {
      d.innerHTML = `<div class="fjm-msg-av">FJ</div><div class="fjm-bubble">${text}</div>`;
    } else {
      d.innerHTML = `<div class="fjm-bubble">${text}</div>`;
    }
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'fjm-typing'; t.id = 'fjm-typing';
    t.innerHTML = `<div class="fjm-msg-av">FJ</div><div class="fjm-typing-bubble"><div class="fjm-dot"></div><div class="fjm-dot"></div><div class="fjm-dot"></div></div>`;
    messagesEl.appendChild(t);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('fjm-typing');
    if (t) t.remove();
  }

  function greet() {
    showTyping();
    setTimeout(() => {
      hideTyping();
      const msg = "Hey! I'm FJ, your guide to working with FJMedia. What kind of business do you run?";
      history.push({ role: 'assistant', content: msg });
      addMsg('bot', msg);
    }, 900);
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || loading) return;
    loading = true;
    sendEl.disabled = true;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    showTyping();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      hideTyping();
      if (data.reply) {
        history.push({ role: 'assistant', content: data.reply });
        addMsg('bot', data.reply);
        if (!panel.classList.contains('open')) addBadge();
      } else {
        addMsg('bot', 'Something went wrong. Try again in a moment.');
      }
    } catch {
      hideTyping();
      addMsg('bot', 'Connection issue. Please try again.');
    }
    loading = false;
    sendEl.disabled = false;
  }

  // Show badge after 8s to prompt engagement
  setTimeout(() => {
    if (!opened) addBadge();
  }, 8000);
})();
