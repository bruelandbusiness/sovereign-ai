export const runtime = "edge";

export async function GET() {
  const js = `
(function() {
  // Prevent double-initialization
  if (window.__sovereignChatbotLoaded) return;
  window.__sovereignChatbotLoaded = true;

  // ---------------------------------------------------------------------------
  // 1. Read the chatbot ID from the embedding script tag
  // ---------------------------------------------------------------------------
  var scripts = document.querySelectorAll('script[data-chatbot-id]');
  var scriptTag = scripts[scripts.length - 1];
  if (!scriptTag) {
    console.error('[SovereignAI] Missing data-chatbot-id on script tag');
    return;
  }
  var chatbotId = scriptTag.getAttribute('data-chatbot-id');
  if (!chatbotId) {
    console.error('[SovereignAI] data-chatbot-id is empty');
    return;
  }
  // Validate chatbotId format to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(chatbotId)) {
    console.error('[SovereignAI] Invalid data-chatbot-id format');
    return;
  }

  // Derive the API base from the script src so the widget works regardless of domain
  var scriptSrc = scriptTag.getAttribute('src') || '';
  var baseUrl = scriptSrc.replace(/\\/embed\\/chatbot\\.js.*$/, '');

  // ---------------------------------------------------------------------------
  // 2. State
  // ---------------------------------------------------------------------------
  var conversationId = null;
  var isOpen = false;
  var isLoading = false;
  var greeting = 'Hello! How can I help you today?';

  // ---------------------------------------------------------------------------
  // 3. Styles (self-contained, scoped via #sov-chatbot)
  // ---------------------------------------------------------------------------
  var PRIMARY = '#4c85ff';
  var BG_DARK = '#1a1a2e';
  var BG_PANEL = '#16213e';
  var BG_INPUT = '#0f3460';
  var TEXT = '#e8e8e8';
  var TEXT_MUTED = '#a0a0b8';
  var BORDER = '#1f3a6e';

  var style = document.createElement('style');
  style.textContent = [
    '#sov-chatbot * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',

    /* -- Bubble -- */
    '#sov-chatbot-bubble { position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; border-radius: 50%; background: ' + PRIMARY + '; color: #fff; border: none; cursor: pointer; z-index: 2147483646; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(76,133,255,0.45); transition: transform 0.2s ease, box-shadow 0.2s ease; }',
    '#sov-chatbot-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(76,133,255,0.6); }',
    '#sov-chatbot-bubble svg { width: 28px; height: 28px; fill: #fff; }',

    /* -- Panel -- */
    '#sov-chatbot-panel { position: fixed; bottom: 96px; right: 24px; width: 400px; height: 550px; background: ' + BG_DARK + '; border-radius: 16px; z-index: 2147483647; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5); border: 1px solid ' + BORDER + '; }',
    '#sov-chatbot-panel.sov-open { display: flex; }',

    /* -- Header -- */
    '#sov-chatbot-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: ' + BG_PANEL + '; border-bottom: 1px solid ' + BORDER + '; }',
    '#sov-chatbot-header-title { color: #fff; font-size: 15px; font-weight: 600; }',
    '#sov-chatbot-header-actions { display: flex; gap: 6px; }',
    '#sov-chatbot-header-actions button { background: none; border: none; cursor: pointer; color: ' + TEXT_MUTED + '; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }',
    '#sov-chatbot-header-actions button:hover { background: rgba(255,255,255,0.08); color: #fff; }',
    '#sov-chatbot-header-actions button svg { width: 18px; height: 18px; }',

    /* -- Messages area -- */
    '#sov-chatbot-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }',
    '#sov-chatbot-messages::-webkit-scrollbar { width: 5px; }',
    '#sov-chatbot-messages::-webkit-scrollbar-track { background: transparent; }',
    '#sov-chatbot-messages::-webkit-scrollbar-thumb { background: ' + BORDER + '; border-radius: 4px; }',

    '#sov-chatbot .sov-msg { max-width: 82%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; color: ' + TEXT + '; word-wrap: break-word; white-space: pre-wrap; }',
    '#sov-chatbot .sov-msg-assistant { align-self: flex-start; background: ' + BG_PANEL + '; border: 1px solid ' + BORDER + '; border-bottom-left-radius: 4px; }',
    '#sov-chatbot .sov-msg-user { align-self: flex-end; background: ' + PRIMARY + '; color: #fff; border-bottom-right-radius: 4px; }',

    /* -- Typing indicator -- */
    '#sov-chatbot .sov-typing { align-self: flex-start; display: flex; gap: 5px; padding: 10px 16px; }',
    '#sov-chatbot .sov-typing-dot { width: 8px; height: 8px; border-radius: 50%; background: ' + TEXT_MUTED + '; animation: sovBounce 1.4s infinite ease-in-out both; }',
    '#sov-chatbot .sov-typing-dot:nth-child(1) { animation-delay: -0.32s; }',
    '#sov-chatbot .sov-typing-dot:nth-child(2) { animation-delay: -0.16s; }',
    '@keyframes sovBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }',

    /* -- Input area -- */
    '#sov-chatbot-input-area { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: ' + BG_PANEL + '; border-top: 1px solid ' + BORDER + '; }',
    '#sov-chatbot-input { flex: 1; background: ' + BG_INPUT + '; border: 1px solid ' + BORDER + '; border-radius: 10px; padding: 10px 14px; color: ' + TEXT + '; font-size: 14px; outline: none; resize: none; min-height: 40px; max-height: 100px; }',
    '#sov-chatbot-input::placeholder { color: ' + TEXT_MUTED + '; }',
    '#sov-chatbot-input:focus { border-color: ' + PRIMARY + '; }',
    '#sov-chatbot-send { background: ' + PRIMARY + '; border: none; border-radius: 10px; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s; flex-shrink: 0; }',
    '#sov-chatbot-send:disabled { opacity: 0.4; cursor: not-allowed; }',
    '#sov-chatbot-send svg { width: 18px; height: 18px; fill: #fff; }',

    /* -- Footer -- */
    '#sov-chatbot-footer { text-align: center; padding: 8px; background: ' + BG_PANEL + '; border-top: 1px solid ' + BORDER + '; }',
    '#sov-chatbot-footer a { color: ' + TEXT_MUTED + '; font-size: 11px; text-decoration: none; transition: color 0.15s; }',
    '#sov-chatbot-footer a:hover { color: ' + PRIMARY + '; }',

    /* -- Mobile -- */
    '@media (max-width: 500px) {',
    '  #sov-chatbot-panel { bottom: 0; right: 0; left: 0; width: 100%; height: 100%; border-radius: 0; }',
    '  #sov-chatbot-bubble { bottom: 16px; right: 16px; }',
    '}'
  ].join('\\n');
  document.head.appendChild(style);

  // ---------------------------------------------------------------------------
  // 4. Build DOM
  // ---------------------------------------------------------------------------
  var root = document.createElement('div');
  root.id = 'sov-chatbot';

  // Chat bubble
  var bubble = document.createElement('button');
  bubble.id = 'sov-chatbot-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';

  // Chat panel
  var panel = document.createElement('div');
  panel.id = 'sov-chatbot-panel';

  // Header
  var header = document.createElement('div');
  header.id = 'sov-chatbot-header';
  var title = document.createElement('span');
  title.id = 'sov-chatbot-header-title';
  title.textContent = 'Chat with us';
  var actions = document.createElement('div');
  actions.id = 'sov-chatbot-header-actions';

  var minimizeBtn = document.createElement('button');
  minimizeBtn.setAttribute('aria-label', 'Minimize chat');
  minimizeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>';

  var closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close chat');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  actions.appendChild(minimizeBtn);
  actions.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(actions);

  // Messages container
  var messages = document.createElement('div');
  messages.id = 'sov-chatbot-messages';

  // Input area
  var inputArea = document.createElement('div');
  inputArea.id = 'sov-chatbot-input-area';
  var input = document.createElement('textarea');
  input.id = 'sov-chatbot-input';
  input.placeholder = 'Type a message...';
  input.rows = 1;
  var sendBtn = document.createElement('button');
  sendBtn.id = 'sov-chatbot-send';
  sendBtn.setAttribute('aria-label', 'Send message');
  sendBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);

  // Footer
  var footer = document.createElement('div');
  footer.id = 'sov-chatbot-footer';
  var footerLink = document.createElement('a');
  footerLink.href = 'https://www.trysovereignai.com';
  footerLink.target = '_blank';
  footerLink.rel = 'noopener noreferrer';
  footerLink.textContent = 'Powered by Sovereign AI';
  footer.appendChild(footerLink);

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(messages);
  panel.appendChild(inputArea);
  panel.appendChild(footer);

  root.appendChild(bubble);
  root.appendChild(panel);
  document.body.appendChild(root);

  // ---------------------------------------------------------------------------
  // 5. Helpers
  // ---------------------------------------------------------------------------
  function addMessage(text, role) {
    var el = document.createElement('div');
    el.className = 'sov-msg sov-msg-' + role;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'sov-typing';
    el.id = 'sov-typing-indicator';
    el.innerHTML = '<div class="sov-typing-dot"></div><div class="sov-typing-dot"></div><div class="sov-typing-dot"></div>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('sov-typing-indicator');
    if (el) el.remove();
  }

  function autoResizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  // ---------------------------------------------------------------------------
  // 6. Fetch config (greeting)
  // ---------------------------------------------------------------------------
  function fetchConfig() {
    fetch(baseUrl + '/api/services/chatbot/config?id=' + encodeURIComponent(chatbotId))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.greeting) {
          greeting = data.greeting;
        }
      })
      .catch(function() { /* use default greeting */ });
  }
  fetchConfig();

  // ---------------------------------------------------------------------------
  // 7. Send message
  // ---------------------------------------------------------------------------
  function sendMessage() {
    var text = input.value.trim();
    if (!text || isLoading) return;

    addMessage(text, 'user');
    input.value = '';
    input.style.height = 'auto';
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    fetch(baseUrl + '/api/services/chatbot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatbotId: chatbotId,
        conversationId: conversationId,
        message: text
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Chat request failed');

      // Check if the response is a stream (SSE) or JSON
      var contentType = res.headers.get('content-type') || '';
      if (contentType.indexOf('text/event-stream') !== -1) {
        // Handle SSE streaming response
        removeTyping();
        var assistantEl = addMessage('', 'assistant');
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        var fullText = '';

        function readStream() {
          reader.read().then(function(result) {
            if (result.done) {
              isLoading = false;
              sendBtn.disabled = false;
              return;
            }
            buffer += decoder.decode(result.value, { stream: true });

            // Process SSE lines
            var lines = buffer.split('\\n');
            buffer = lines.pop() || '';

            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (line.indexOf('data: ') === 0) {
                var data = line.substring(6);
                if (data === '[DONE]') {
                  isLoading = false;
                  sendBtn.disabled = false;
                  return;
                }
                try {
                  var parsed = JSON.parse(data);
                  if (parsed.token) {
                    fullText += parsed.token;
                    assistantEl.textContent = fullText;
                    messages.scrollTop = messages.scrollHeight;
                  }
                  if (parsed.conversationId) {
                    conversationId = parsed.conversationId;
                  }
                } catch(e) { /* skip malformed lines */ }
              }
            }
            readStream();
          }).catch(function() {
            isLoading = false;
            sendBtn.disabled = false;
          });
        }
        readStream();
      } else {
        // Handle standard JSON response -- display word-by-word
        return res.json().then(function(data) {
          removeTyping();
          if (data.conversationId) {
            conversationId = data.conversationId;
          }
          if (data.reply) {
            // Animate word-by-word
            var words = data.reply.split(' ');
            var assistantEl = addMessage('', 'assistant');
            var idx = 0;
            function showNextWord() {
              if (idx < words.length) {
                assistantEl.textContent += (idx > 0 ? ' ' : '') + words[idx];
                messages.scrollTop = messages.scrollHeight;
                idx++;
                setTimeout(showNextWord, 35);
              } else {
                isLoading = false;
                sendBtn.disabled = false;
              }
            }
            showNextWord();
          } else {
            isLoading = false;
            sendBtn.disabled = false;
          }
        });
      }
    })
    .catch(function() {
      removeTyping();
      addMessage('Sorry, something went wrong. Please try again.', 'assistant');
      isLoading = false;
      sendBtn.disabled = false;
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Event handlers
  // ---------------------------------------------------------------------------
  function openPanel() {
    isOpen = true;
    panel.classList.add('sov-open');
    bubble.style.display = 'none';
    // Show greeting if this is the first open
    if (messages.children.length === 0) {
      addMessage(greeting, 'assistant');
    }
    input.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('sov-open');
    bubble.style.display = 'flex';
  }

  bubble.addEventListener('click', openPanel);
  minimizeBtn.addEventListener('click', closePanel);
  closeBtn.addEventListener('click', closePanel);

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('input', autoResizeInput);
})();
`;

  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
