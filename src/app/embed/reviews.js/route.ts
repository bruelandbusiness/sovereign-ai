export const runtime = "edge";

export async function GET() {
  const js = `
(function() {
  // Prevent double-initialization
  if (window.__sovereignReviewsLoaded) return;
  window.__sovereignReviewsLoaded = true;

  // ---------------------------------------------------------------------------
  // 1. Read config from the embedding script tag
  // ---------------------------------------------------------------------------
  var scripts = document.querySelectorAll('script[data-client-id]');
  var scriptTag = scripts[scripts.length - 1];
  if (!scriptTag) {
    console.error('[SovereignAI Reviews] Missing data-client-id on script tag');
    return;
  }
  var clientId = scriptTag.getAttribute('data-client-id');
  if (!clientId) {
    console.error('[SovereignAI Reviews] data-client-id is empty');
    return;
  }
  // Validate clientId format to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
    console.error('[SovereignAI Reviews] Invalid data-client-id format');
    return;
  }

  // Config from data attributes (sanitized)
  var rawLayout = scriptTag.getAttribute('data-layout') || 'carousel';
  var allowedLayouts = ['carousel', 'grid', 'list'];
  var layout = allowedLayouts.indexOf(rawLayout) !== -1 ? rawLayout : 'carousel';
  var rawTheme = scriptTag.getAttribute('data-theme') || 'dark';
  var allowedThemes = ['dark', 'light'];
  var theme = allowedThemes.indexOf(rawTheme) !== -1 ? rawTheme : 'dark';
  var rawMax = parseInt(scriptTag.getAttribute('data-max') || '6', 10);
  var maxReviews = Math.max(1, Math.min(isNaN(rawMax) ? 6 : rawMax, 20));

  // Derive the API base from the script src
  var scriptSrc = scriptTag.getAttribute('src') || '';
  var baseUrl = scriptSrc.replace(/\\/embed\\/reviews\\.js.*$/, '');

  // Target container (optional — if data-target is set, render inside that element)
  var rawTarget = scriptTag.getAttribute('data-target') || '';
  var targetEl = rawTarget ? document.getElementById(rawTarget) : null;

  // ---------------------------------------------------------------------------
  // 2. Theme colors
  // ---------------------------------------------------------------------------
  var isDark = theme === 'dark';
  var BG = isDark ? '#1a1a2e' : '#ffffff';
  var BG_CARD = isDark ? '#16213e' : '#f8fafc';
  var TEXT = isDark ? '#e8e8e8' : '#1e293b';
  var TEXT_MUTED = isDark ? '#a0a0b8' : '#64748b';
  var BORDER = isDark ? '#1f3a6e' : '#e2e8f0';
  var STAR_COLOR = '#fbbf24';
  var PRIMARY = '#4c85ff';

  // ---------------------------------------------------------------------------
  // 3. Styles (self-contained, scoped via #sov-reviews)
  // ---------------------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent = [
    '#sov-reviews { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',
    '#sov-reviews * { box-sizing: border-box; margin: 0; padding: 0; }',

    '#sov-reviews .sov-reviews-container { background: ' + BG + '; border-radius: 12px; padding: 20px; border: 1px solid ' + BORDER + '; }',

    '#sov-reviews .sov-reviews-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }',
    '#sov-reviews .sov-reviews-title { font-size: 18px; font-weight: 700; color: ' + TEXT + '; }',
    '#sov-reviews .sov-reviews-summary { font-size: 13px; color: ' + TEXT_MUTED + '; display: flex; align-items: center; gap: 6px; }',
    '#sov-reviews .sov-reviews-avg { font-weight: 700; color: ' + STAR_COLOR + '; }',

    '#sov-reviews .sov-reviews-carousel { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; }',
    '#sov-reviews .sov-reviews-carousel::-webkit-scrollbar { display: none; }',
    '#sov-reviews .sov-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }',
    '#sov-reviews .sov-reviews-list { display: flex; flex-direction: column; gap: 12px; }',

    '#sov-reviews .sov-review-card { background: ' + BG_CARD + '; border: 1px solid ' + BORDER + '; border-radius: 10px; padding: 14px 16px; min-width: 280px; max-width: 340px; scroll-snap-align: start; flex-shrink: 0; }',
    '#sov-reviews .sov-reviews-grid .sov-review-card, #sov-reviews .sov-reviews-list .sov-review-card { max-width: 100%; min-width: 0; }',

    '#sov-reviews .sov-review-stars { color: ' + STAR_COLOR + '; font-size: 14px; letter-spacing: 1px; margin-bottom: 8px; }',
    '#sov-reviews .sov-review-text { color: ' + TEXT + '; font-size: 13px; line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }',
    '#sov-reviews .sov-review-author { display: flex; align-items: center; gap: 8px; }',
    '#sov-reviews .sov-review-avatar { width: 28px; height: 28px; border-radius: 50%; background: ' + PRIMARY + '; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }',
    '#sov-reviews .sov-review-name { font-size: 12px; font-weight: 600; color: ' + TEXT + '; }',
    '#sov-reviews .sov-review-date { font-size: 11px; color: ' + TEXT_MUTED + '; }',
    '#sov-reviews .sov-review-platform { font-size: 10px; color: ' + TEXT_MUTED + '; text-transform: uppercase; letter-spacing: 0.5px; }',

    '#sov-reviews .sov-reviews-nav { display: flex; gap: 6px; }',
    '#sov-reviews .sov-reviews-nav button { background: ' + BG_CARD + '; border: 1px solid ' + BORDER + '; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ' + TEXT_MUTED + '; transition: all 0.15s; }',
    '#sov-reviews .sov-reviews-nav button:hover { border-color: ' + PRIMARY + '; color: ' + PRIMARY + '; }',

    '#sov-reviews .sov-reviews-empty { text-align: center; padding: 24px; color: ' + TEXT_MUTED + '; font-size: 14px; }',
    '#sov-reviews .sov-reviews-error { text-align: center; padding: 24px; color: #ef4444; font-size: 13px; }',
    '#sov-reviews .sov-reviews-loading { text-align: center; padding: 24px; color: ' + TEXT_MUTED + '; font-size: 13px; }',

    '#sov-reviews-footer { text-align: center; padding-top: 12px; }',
    '#sov-reviews-footer a { color: ' + TEXT_MUTED + '; font-size: 11px; text-decoration: none; transition: color 0.15s; }',
    '#sov-reviews-footer a:hover { color: ' + PRIMARY + '; }',

    '@media (max-width: 500px) {',
    '  #sov-reviews .sov-review-card { min-width: 240px; }',
    '  #sov-reviews .sov-reviews-grid { grid-template-columns: 1fr; }',
    '}'
  ].join('\\n');
  document.head.appendChild(style);

  // ---------------------------------------------------------------------------
  // 4. Build DOM
  // ---------------------------------------------------------------------------
  var root = document.createElement('div');
  root.id = 'sov-reviews';

  var container = document.createElement('div');
  container.className = 'sov-reviews-container';

  var header = document.createElement('div');
  header.className = 'sov-reviews-header';
  var titleEl = document.createElement('div');
  titleEl.className = 'sov-reviews-title';
  titleEl.textContent = 'Customer Reviews';
  var summaryEl = document.createElement('div');
  summaryEl.className = 'sov-reviews-summary';
  var navEl = document.createElement('div');
  navEl.className = 'sov-reviews-nav';

  header.appendChild(titleEl);
  header.appendChild(summaryEl);

  var reviewsWrap = document.createElement('div');
  reviewsWrap.className = layout === 'carousel' ? 'sov-reviews-carousel'
    : layout === 'grid' ? 'sov-reviews-grid'
    : 'sov-reviews-list';
  reviewsWrap.setAttribute('role', 'list');
  reviewsWrap.setAttribute('aria-label', 'Customer reviews');

  // Loading state
  var loadingEl = document.createElement('div');
  loadingEl.className = 'sov-reviews-loading';
  loadingEl.setAttribute('role', 'status');
  loadingEl.setAttribute('aria-live', 'polite');
  loadingEl.textContent = 'Loading reviews...';
  reviewsWrap.appendChild(loadingEl);

  var footer = document.createElement('div');
  footer.id = 'sov-reviews-footer';
  var footerLink = document.createElement('a');
  footerLink.href = 'https://www.trysovereignai.com';
  footerLink.target = '_blank';
  footerLink.rel = 'noopener noreferrer';
  footerLink.textContent = 'Powered by Sovereign AI';
  footer.appendChild(footerLink);

  container.appendChild(header);
  container.appendChild(reviewsWrap);
  container.appendChild(footer);
  root.appendChild(container);

  if (targetEl) {
    targetEl.appendChild(root);
  } else {
    // Insert right before the script tag
    scriptTag.parentNode.insertBefore(root, scriptTag);
  }

  // ---------------------------------------------------------------------------
  // 5. Helpers
  // ---------------------------------------------------------------------------
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function starsHtml(rating) {
    var safeRating = Math.max(0, Math.min(5, Math.floor(Number(rating)) || 0));
    return '\\u2605'.repeat(safeRating) + '\\u2606'.repeat(5 - safeRating);
  }

  function relativeTime(dateStr) {
    try {
      var d = new Date(dateStr);
      var now = new Date();
      var diff = now.getTime() - d.getTime();
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 30) return days + ' days ago';
      if (days < 365) return Math.floor(days / 30) + ' months ago';
      return Math.floor(days / 365) + ' years ago';
    } catch(e) {
      return '';
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Fetch reviews
  // ---------------------------------------------------------------------------
  function fetchReviews() {
    fetch(baseUrl + '/api/services/social-proof/feed?clientId=' + encodeURIComponent(clientId) + '&type=review&limit=' + maxReviews)
      .then(function(res) {
        if (!res.ok) throw new Error('Reviews request failed (' + res.status + ')');
        return res.json();
      })
      .then(function(data) {
        renderReviews(data.events || data.reviews || []);
      })
      .catch(function(err) {
        console.warn('[SovereignAI Reviews] Failed to fetch reviews:', err);
        reviewsWrap.innerHTML = '';
        var errorEl = document.createElement('div');
        errorEl.className = 'sov-reviews-error';
        errorEl.setAttribute('role', 'alert');
        errorEl.textContent = 'Unable to load reviews. Please try again later.';
        reviewsWrap.appendChild(errorEl);
      });
  }

  // ---------------------------------------------------------------------------
  // 7. Render reviews
  // ---------------------------------------------------------------------------
  function renderReviews(reviews) {
    reviewsWrap.innerHTML = '';

    if (!reviews || reviews.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'sov-reviews-empty';
      emptyEl.textContent = 'No reviews yet.';
      reviewsWrap.appendChild(emptyEl);
      return;
    }

    // Calculate average rating
    var totalRating = 0;
    var ratedCount = 0;
    for (var i = 0; i < reviews.length; i++) {
      if (reviews[i].rating) {
        totalRating += Number(reviews[i].rating);
        ratedCount++;
      }
    }

    if (ratedCount > 0) {
      var avg = (totalRating / ratedCount).toFixed(1);
      summaryEl.innerHTML = '<span class="sov-reviews-avg">' + escapeHtml(avg) + '</span> ' + escapeHtml(starsHtml(Math.round(avg))) + ' <span>(' + ratedCount + ')</span>';
    }

    // Render cards
    for (var j = 0; j < reviews.length; j++) {
      var r = reviews[j];
      var card = document.createElement('div');
      card.className = 'sov-review-card';
      card.setAttribute('role', 'listitem');

      var stars = document.createElement('div');
      stars.className = 'sov-review-stars';
      stars.setAttribute('aria-label', (r.rating || 5) + ' out of 5 stars');
      stars.textContent = starsHtml(r.rating || 5);
      card.appendChild(stars);

      var text = document.createElement('div');
      text.className = 'sov-review-text';
      text.textContent = r.subtitle || r.text || r.title || '';
      card.appendChild(text);

      var author = document.createElement('div');
      author.className = 'sov-review-author';

      var avatar = document.createElement('div');
      avatar.className = 'sov-review-avatar';
      var authorName = r.authorName || r.title || 'A';
      avatar.textContent = authorName.charAt(0).toUpperCase();
      author.appendChild(avatar);

      var nameWrap = document.createElement('div');
      var nameEl = document.createElement('div');
      nameEl.className = 'sov-review-name';
      nameEl.textContent = authorName;
      nameWrap.appendChild(nameEl);

      if (r.timestamp) {
        var dateEl = document.createElement('div');
        dateEl.className = 'sov-review-date';
        dateEl.textContent = relativeTime(r.timestamp);
        nameWrap.appendChild(dateEl);
      }

      if (r.platform) {
        var platformEl = document.createElement('div');
        platformEl.className = 'sov-review-platform';
        platformEl.textContent = r.platform;
        nameWrap.appendChild(platformEl);
      }

      author.appendChild(nameWrap);
      card.appendChild(author);
      reviewsWrap.appendChild(card);
    }

    // Add carousel navigation if carousel layout
    if (layout === 'carousel' && reviews.length > 2) {
      var prevBtn = document.createElement('button');
      prevBtn.setAttribute('aria-label', 'Previous reviews');
      prevBtn.innerHTML = '\\u2190';
      prevBtn.addEventListener('click', function() {
        reviewsWrap.scrollBy({ left: -300, behavior: 'smooth' });
      });

      var nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next reviews');
      nextBtn.innerHTML = '\\u2192';
      nextBtn.addEventListener('click', function() {
        reviewsWrap.scrollBy({ left: 300, behavior: 'smooth' });
      });

      navEl.appendChild(prevBtn);
      navEl.appendChild(nextBtn);
      header.appendChild(navEl);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Initialize
  // ---------------------------------------------------------------------------
  fetchReviews();
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
