export const runtime = "edge";

export async function GET() {
  const js = `
(function() {
  // Prevent double-initialization
  if (window.__sovereignSocialProofLoaded) return;
  window.__sovereignSocialProofLoaded = true;

  // ---------------------------------------------------------------------------
  // 1. Read config from the embedding script tag
  // ---------------------------------------------------------------------------
  var scripts = document.querySelectorAll('script[data-client-id]');
  var scriptTag = scripts[scripts.length - 1];
  if (!scriptTag) {
    console.error('[SovereignAI] Missing data-client-id on social proof script tag');
    return;
  }
  var clientId = scriptTag.getAttribute('data-client-id');
  if (!clientId) {
    console.error('[SovereignAI] data-client-id is empty');
    return;
  }
  // Validate clientId format to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
    console.error('[SovereignAI] Invalid data-client-id format');
    return;
  }

  // Config from data attributes (sanitized)
  var rawPosition = scriptTag.getAttribute('data-position') || 'bottom-left';
  var allowedPositions = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
  var position = allowedPositions.indexOf(rawPosition) !== -1 ? rawPosition : 'bottom-left';
  var delay = Math.max(1000, Math.min(parseInt(scriptTag.getAttribute('data-delay') || '5000', 10) || 5000, 60000));
  var duration = Math.max(1000, Math.min(parseInt(scriptTag.getAttribute('data-duration') || '4000', 10) || 4000, 30000));
  var maxPerVisit = Math.max(1, Math.min(parseInt(scriptTag.getAttribute('data-max') || '5', 10) || 5, 50));
  var rawStyle = scriptTag.getAttribute('data-style') || 'toast';
  var allowedStyles = ['toast', 'banner'];
  var style = allowedStyles.indexOf(rawStyle) !== -1 ? rawStyle : 'toast';

  // Derive the API base from the script src
  var scriptSrc = scriptTag.getAttribute('src') || '';
  var baseUrl = scriptSrc.replace(/\\/embed\\/social-proof\\.js.*$/, '');

  // ---------------------------------------------------------------------------
  // 2. Check cookie for notification count
  // ---------------------------------------------------------------------------
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? parseInt(match[2], 10) : 0;
  }
  function setCookie(name, value) {
    document.cookie = name + '=' + value + '; path=/; max-age=86400; SameSite=Lax';
  }

  var shown = getCookie('sov_sp_count');
  if (shown < 0 || shown > 1000 || isNaN(shown)) shown = 0;
  if (shown >= maxPerVisit) return;

  // ---------------------------------------------------------------------------
  // 3. Styles
  // ---------------------------------------------------------------------------
  var positionCSS = '';
  switch (position) {
    case 'bottom-right':
      positionCSS = 'bottom: 24px; right: 24px;';
      break;
    case 'top-left':
      positionCSS = 'top: 24px; left: 24px;';
      break;
    case 'top-right':
      positionCSS = 'top: 24px; right: 24px;';
      break;
    default:
      positionCSS = 'bottom: 24px; left: 24px;';
  }

  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '#sov-social-proof { position: fixed; ' + positionCSS + ' z-index: 2147483640; pointer-events: none; }',
    '#sov-social-proof * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',
    '.sov-sp-notification { pointer-events: auto; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; max-width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease, transform 0.4s ease; display: flex; align-items: center; gap: 12px; }',
    '.sov-sp-notification.sov-sp-visible { opacity: 1; transform: translateY(0); }',
    '.sov-sp-notification.sov-sp-hiding { opacity: 0; transform: translateY(-10px); }',
    '.sov-sp-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(76,133,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #4c85ff; font-size: 16px; }',
    '.sov-sp-content { flex: 1; }',
    '.sov-sp-title { color: #fff; font-size: 13px; font-weight: 600; line-height: 1.3; }',
    '.sov-sp-subtitle { color: #a0a0b8; font-size: 11px; margin-top: 2px; }',
    '.sov-sp-close { background: none; border: none; color: #a0a0b8; cursor: pointer; font-size: 14px; padding: 4px; line-height: 1; position: absolute; top: 6px; right: 8px; }',
    '.sov-sp-close:hover { color: #fff; }',
    '.sov-sp-stars { color: #fbbf24; font-size: 12px; letter-spacing: 1px; }',
    '@media (max-width: 500px) {',
    '  #sov-social-proof { left: 12px; right: 12px; bottom: 12px; }',
    '  .sov-sp-notification { max-width: 100%; }',
    '}'
  ].join('\\n');
  document.head.appendChild(styleEl);

  // ---------------------------------------------------------------------------
  // 4. Create container
  // ---------------------------------------------------------------------------
  var container = document.createElement('div');
  container.id = 'sov-social-proof';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Recent activity notifications');
  document.body.appendChild(container);

  // ---------------------------------------------------------------------------
  // 5. Fetch social proof feed
  // ---------------------------------------------------------------------------
  var feedItems = [];
  var currentIndex = 0;

  function fetchFeed() {
    fetch(baseUrl + '/api/services/social-proof/feed?clientId=' + encodeURIComponent(clientId))
      .then(function(res) {
        if (!res.ok) throw new Error('Feed request failed (' + res.status + ')');
        return res.json();
      })
      .then(function(data) {
        if (data && data.events && data.events.length > 0) {
          feedItems = data.events;
          setTimeout(showNext, delay);
        }
      })
      .catch(function(err) {
        console.warn('[SovereignAI] Failed to fetch social proof feed:', err);
      });
  }

  // ---------------------------------------------------------------------------
  // 6. Show notification
  // ---------------------------------------------------------------------------
  function showNext() {
    if (shown >= maxPerVisit || feedItems.length === 0) return;

    var item = feedItems[currentIndex % feedItems.length];
    currentIndex++;

    var notification = document.createElement('div');
    notification.className = 'sov-sp-notification';
    notification.style.position = 'relative';
    notification.setAttribute('role', 'status');

    var iconEmoji = '\\u2605';
    if (item.type === 'booking') iconEmoji = '\\uD83D\\uDCC5';
    if (item.type === 'lead') iconEmoji = '\\u26A1';

    var starsHTML = '';
    if (item.type === 'review' && item.rating) {
      starsHTML = '<div class="sov-sp-stars">' + '\\u2605'.repeat(item.rating) + '</div>';
    }

    notification.innerHTML = [
      '<div class="sov-sp-icon">' + iconEmoji + '</div>',
      '<div class="sov-sp-content">',
      '  <div class="sov-sp-title">' + escapeHtml(item.title) + '</div>',
      starsHTML,
      '  <div class="sov-sp-subtitle">' + escapeHtml(item.subtitle) + '</div>',
      '</div>',
      '<button class="sov-sp-close" aria-label="Close">&times;</button>'
    ].join('');

    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        notification.classList.add('sov-sp-visible');
      });
    });

    // Close button
    notification.querySelector('.sov-sp-close').addEventListener('click', function() {
      hideNotification(notification);
    });

    // Auto-hide
    setTimeout(function() {
      hideNotification(notification);
    }, duration);

    shown++;
    setCookie('sov_sp_count', shown);

    // Schedule next
    if (shown < maxPerVisit) {
      var nextDelay = 15000 + Math.floor(Math.random() * 15000);
      setTimeout(showNext, nextDelay);
    }
  }

  function hideNotification(el) {
    el.classList.remove('sov-sp-visible');
    el.classList.add('sov-sp-hiding');
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 400);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // 7. Initialize
  // ---------------------------------------------------------------------------
  fetchFeed();
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
