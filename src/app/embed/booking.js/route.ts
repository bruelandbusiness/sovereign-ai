export const runtime = "edge";

export async function GET() {
  const js = `
(function() {
  // Prevent double-initialization
  if (window.__sovereignBookingLoaded) return;
  window.__sovereignBookingLoaded = true;

  // ---------------------------------------------------------------------------
  // 1. Read the client ID from the embedding script tag
  // ---------------------------------------------------------------------------
  var scripts = document.querySelectorAll('script[data-client-id]');
  var scriptTag = scripts[scripts.length - 1];
  if (!scriptTag) {
    console.error('[SovereignAI Booking] Missing data-client-id on script tag');
    return;
  }
  var clientId = scriptTag.getAttribute('data-client-id');
  if (!clientId) {
    console.error('[SovereignAI Booking] data-client-id is empty');
    return;
  }
  // Validate clientId format to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
    console.error('[SovereignAI Booking] Invalid data-client-id format');
    return;
  }

  // Derive the API base from the script src
  var scriptSrc = scriptTag.getAttribute('src') || '';
  var baseUrl = scriptSrc.replace(/\\/embed\\/booking\\.js.*$/, '');

  // Optional customization via data attributes (sanitized)
  var rawColor = scriptTag.getAttribute('data-color') || '#4c85ff';
  var customColor = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#4c85ff';
  var rawButtonText = scriptTag.getAttribute('data-button-text') || 'Book Now';
  var customButtonText = rawButtonText.replace(/[<>&"']/g, function(c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c;
  });
  var rawPosition = scriptTag.getAttribute('data-position') || 'right';
  var customPosition = (rawPosition === 'left' || rawPosition === 'right') ? rawPosition : 'right';

  // ---------------------------------------------------------------------------
  // 2. State
  // ---------------------------------------------------------------------------
  var isOpen = false;
  var isLoading = false;
  var config = null;
  var slots = [];
  var selectedDate = null;
  var selectedSlot = null;
  var step = 'date'; // date | time | form | success

  // ---------------------------------------------------------------------------
  // 3. Styles
  // ---------------------------------------------------------------------------
  var PRIMARY = customColor;
  var BG_DARK = '#1a1a2e';
  var BG_PANEL = '#16213e';
  var BG_INPUT = '#0f3460';
  var TEXT = '#e8e8e8';
  var TEXT_MUTED = '#a0a0b8';
  var BORDER = '#1f3a6e';

  var style = document.createElement('style');
  style.textContent = [
    '#sov-booking * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',

    '#sov-booking-bubble { position: fixed; bottom: 24px; ' + customPosition + ': 24px; height: 48px; border-radius: 24px; background: ' + PRIMARY + '; color: #fff; border: none; cursor: pointer; z-index: 2147483644; display: flex; align-items: center; gap: 8px; padding: 0 20px; box-shadow: 0 4px 14px rgba(76,133,255,0.45); transition: transform 0.2s ease, box-shadow 0.2s ease; font-size: 14px; font-weight: 600; }',
    '#sov-booking-bubble:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(76,133,255,0.6); }',
    '#sov-booking-bubble svg { width: 20px; height: 20px; fill: #fff; }',

    '#sov-booking-panel { position: fixed; bottom: 84px; ' + customPosition + ': 24px; width: 380px; max-height: 580px; background: ' + BG_DARK + '; border-radius: 16px; z-index: 2147483645; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5); border: 1px solid ' + BORDER + '; }',
    '#sov-booking-panel.sov-open { display: flex; }',

    '#sov-booking-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: ' + BG_PANEL + '; border-bottom: 1px solid ' + BORDER + '; }',
    '#sov-booking-header-title { color: #fff; font-size: 15px; font-weight: 600; }',
    '#sov-booking-close { background: none; border: none; cursor: pointer; color: ' + TEXT_MUTED + '; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }',
    '#sov-booking-close:hover { background: rgba(255,255,255,0.08); color: #fff; }',
    '#sov-booking-close svg { width: 18px; height: 18px; }',

    '#sov-booking-body { flex: 1; overflow-y: auto; padding: 16px; }',
    '#sov-booking-body::-webkit-scrollbar { width: 5px; }',
    '#sov-booking-body::-webkit-scrollbar-track { background: transparent; }',
    '#sov-booking-body::-webkit-scrollbar-thumb { background: ' + BORDER + '; border-radius: 4px; }',

    '.sov-booking-step-title { color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 12px; }',
    '.sov-booking-subtitle { color: ' + TEXT_MUTED + '; font-size: 12px; margin-bottom: 12px; }',

    '.sov-date-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }',
    '.sov-date-btn { background: ' + BG_PANEL + '; border: 1px solid ' + BORDER + '; border-radius: 10px; padding: 10px 8px; cursor: pointer; color: ' + TEXT + '; text-align: center; transition: all 0.15s; }',
    '.sov-date-btn:hover { border-color: ' + PRIMARY + '; }',
    '.sov-date-btn.selected { background: ' + PRIMARY + '; border-color: ' + PRIMARY + '; color: #fff; }',
    '.sov-date-btn .day { font-size: 11px; color: ' + TEXT_MUTED + '; margin-bottom: 2px; }',
    '.sov-date-btn.selected .day { color: rgba(255,255,255,0.8); }',
    '.sov-date-btn .num { font-size: 16px; font-weight: 700; }',
    '.sov-date-btn.empty { visibility: hidden; pointer-events: none; }',

    '.sov-time-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }',
    '.sov-time-btn { background: ' + BG_PANEL + '; border: 1px solid ' + BORDER + '; border-radius: 10px; padding: 10px; cursor: pointer; color: ' + TEXT + '; text-align: center; font-size: 13px; font-weight: 500; transition: all 0.15s; }',
    '.sov-time-btn:hover { border-color: ' + PRIMARY + '; }',
    '.sov-time-btn.selected { background: ' + PRIMARY + '; border-color: ' + PRIMARY + '; color: #fff; }',

    '.sov-booking-form { display: flex; flex-direction: column; gap: 10px; }',
    '.sov-booking-label { display: block; color: ' + TEXT_MUTED + '; font-size: 12px; font-weight: 600; margin-bottom: 2px; }',
    '.sov-booking-input { width: 100%; background: ' + BG_INPUT + '; border: 1px solid ' + BORDER + '; border-radius: 10px; padding: 10px 14px; color: ' + TEXT + '; font-size: 14px; outline: none; }',
    '.sov-booking-input::placeholder { color: ' + TEXT_MUTED + '; }',
    '.sov-booking-input:focus { border-color: ' + PRIMARY + '; }',

    '.sov-booking-submit { width: 100%; background: ' + PRIMARY + '; border: none; border-radius: 10px; padding: 12px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; margin-top: 4px; }',
    '.sov-booking-submit:disabled { opacity: 0.5; cursor: not-allowed; }',
    '.sov-booking-submit:hover:not(:disabled) { opacity: 0.9; }',

    '.sov-booking-back { background: none; border: none; color: ' + TEXT_MUTED + '; cursor: pointer; font-size: 12px; padding: 4px 0; transition: color 0.15s; }',
    '.sov-booking-back:hover { color: ' + TEXT + '; }',

    '.sov-booking-success { text-align: center; padding: 20px 0; }',
    '.sov-booking-success svg { width: 48px; height: 48px; margin: 0 auto 12px; }',
    '.sov-booking-success h3 { color: #fff; font-size: 18px; margin-bottom: 8px; }',
    '.sov-booking-success p { color: ' + TEXT_MUTED + '; font-size: 13px; }',

    '.sov-no-slots { text-align: center; color: ' + TEXT_MUTED + '; padding: 20px 0; font-size: 13px; }',
    '.sov-booking-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid ' + BORDER + '; border-top-color: ' + PRIMARY + '; border-radius: 50%; animation: sovBookingSpin 0.6s linear infinite; vertical-align: middle; margin-right: 6px; }',
    '@keyframes sovBookingSpin { to { transform: rotate(360deg); } }',

    '#sov-booking-footer { text-align: center; padding: 8px; background: ' + BG_PANEL + '; border-top: 1px solid ' + BORDER + '; }',
    '#sov-booking-footer a { color: ' + TEXT_MUTED + '; font-size: 11px; text-decoration: none; transition: color 0.15s; }',
    '#sov-booking-footer a:hover { color: ' + PRIMARY + '; }',

    '@media (max-width: 500px) {',
    '  #sov-booking-panel { bottom: 0; right: 0; left: 0; width: 100%; max-height: 100%; border-radius: 0; }',
    '  #sov-booking-bubble { bottom: 16px; ' + customPosition + ': 16px; }',
    '}'
  ].join('\\n');
  document.head.appendChild(style);

  // ---------------------------------------------------------------------------
  // 4. Build DOM
  // ---------------------------------------------------------------------------
  var root = document.createElement('div');
  root.id = 'sov-booking';

  // Bubble
  var bubble = document.createElement('button');
  bubble.id = 'sov-booking-bubble';
  bubble.setAttribute('aria-label', rawButtonText);
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>';
  var bubbleLabel = document.createElement('span');
  bubbleLabel.textContent = rawButtonText;
  bubble.appendChild(bubbleLabel);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'sov-booking-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'sov-booking-header-title');

  var header = document.createElement('div');
  header.id = 'sov-booking-header';
  var title = document.createElement('span');
  title.id = 'sov-booking-header-title';
  title.textContent = 'Book an Appointment';

  var closeBtn = document.createElement('button');
  closeBtn.id = 'sov-booking-close';
  closeBtn.setAttribute('aria-label', 'Close booking panel');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  header.appendChild(title);
  header.appendChild(closeBtn);

  var body = document.createElement('div');
  body.id = 'sov-booking-body';

  var footer = document.createElement('div');
  footer.id = 'sov-booking-footer';
  var footerLink = document.createElement('a');
  footerLink.href = 'https://sovereignai.com';
  footerLink.target = '_blank';
  footerLink.rel = 'noopener noreferrer';
  footerLink.textContent = 'Powered by Sovereign AI';
  footer.appendChild(footerLink);

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(footer);

  root.appendChild(bubble);
  root.appendChild(panel);
  document.body.appendChild(root);

  // ---------------------------------------------------------------------------
  // 5. Helpers
  // ---------------------------------------------------------------------------
  function formatTime(isoStr) {
    var d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateLabel(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    return {
      day: d.toLocaleDateString([], { weekday: 'short' }),
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Fetch config + slots
  // ---------------------------------------------------------------------------
  function fetchConfig() {
    fetch(baseUrl + '/api/services/booking/widget-config?clientId=' + encodeURIComponent(clientId))
      .then(function(res) {
        if (!res.ok) throw new Error('Config request failed');
        return res.json();
      })
      .then(function(data) {
        config = data;
        if (data.businessName) {
          title.textContent = 'Book with ' + data.businessName;
        }
      })
      .catch(function() { /* use defaults */ });
  }

  function fetchSlots(callback) {
    fetch(baseUrl + '/api/services/booking/slots?clientId=' + encodeURIComponent(clientId))
      .then(function(res) {
        if (!res.ok) throw new Error('Slots request failed');
        return res.json();
      })
      .then(function(data) {
        slots = data;
        if (callback) callback();
      })
      .catch(function() {
        slots = [];
        if (callback) callback();
      });
  }

  fetchConfig();

  // ---------------------------------------------------------------------------
  // 7. Render functions
  // ---------------------------------------------------------------------------
  function renderDateStep() {
    body.innerHTML = '';

    var stepTitle = document.createElement('div');
    stepTitle.className = 'sov-booking-step-title';
    stepTitle.textContent = 'Select a Date';
    body.appendChild(stepTitle);

    if (slots.length === 0) {
      var noSlots = document.createElement('div');
      noSlots.className = 'sov-no-slots';
      noSlots.textContent = 'No available slots right now. Please check back later.';
      body.appendChild(noSlots);
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'sov-date-grid';

    var hasAnySlots = false;
    for (var i = 0; i < slots.length; i++) {
      var dayData = slots[i];
      if (dayData.slots.length === 0) continue;
      hasAnySlots = true;

      var btn = document.createElement('button');
      btn.className = 'sov-date-btn';
      var labels = formatDateLabel(dayData.date);
      var dayLabel = document.createElement('div');
      dayLabel.className = 'day';
      dayLabel.textContent = labels.day;
      var numLabel = document.createElement('div');
      numLabel.className = 'num';
      numLabel.textContent = labels.date;
      btn.appendChild(dayLabel);
      btn.appendChild(numLabel);
      btn.setAttribute('data-date', dayData.date);
      btn.setAttribute('aria-label', labels.day + ' ' + labels.date);
      btn.addEventListener('click', function(e) {
        var d = e.currentTarget.getAttribute('data-date');
        selectedDate = d;
        step = 'time';
        renderTimeStep();
      });
      grid.appendChild(btn);
    }

    if (!hasAnySlots) {
      var noSlots2 = document.createElement('div');
      noSlots2.className = 'sov-no-slots';
      noSlots2.textContent = 'No available slots this week.';
      body.appendChild(noSlots2);
      return;
    }

    body.appendChild(grid);
  }

  function renderTimeStep() {
    body.innerHTML = '';

    var backBtn = document.createElement('button');
    backBtn.className = 'sov-booking-back';
    backBtn.setAttribute('aria-label', 'Go back to date selection');
    backBtn.textContent = '< Back to dates';
    backBtn.addEventListener('click', function() {
      step = 'date';
      selectedSlot = null;
      renderDateStep();
    });
    body.appendChild(backBtn);

    var stepTitle = document.createElement('div');
    stepTitle.className = 'sov-booking-step-title';
    stepTitle.style.marginTop = '8px';
    var dateLabel = formatDateLabel(selectedDate);
    stepTitle.textContent = 'Available Times — ' + dateLabel.day + ' ' + dateLabel.date;
    body.appendChild(stepTitle);

    var daySlots = null;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].date === selectedDate) {
        daySlots = slots[i].slots;
        break;
      }
    }

    if (!daySlots || daySlots.length === 0) {
      var noSlots = document.createElement('div');
      noSlots.className = 'sov-no-slots';
      noSlots.textContent = 'No slots available for this date.';
      body.appendChild(noSlots);
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'sov-time-grid';

    for (var j = 0; j < daySlots.length; j++) {
      var slot = daySlots[j];
      var btn = document.createElement('button');
      btn.className = 'sov-time-btn';
      btn.textContent = formatTime(slot.start);
      btn.setAttribute('aria-label', 'Select time ' + formatTime(slot.start));
      btn.setAttribute('data-start', slot.start);
      btn.setAttribute('data-end', slot.end);
      btn.addEventListener('click', function(e) {
        selectedSlot = {
          start: e.currentTarget.getAttribute('data-start'),
          end: e.currentTarget.getAttribute('data-end')
        };
        step = 'form';
        renderFormStep();
      });
      grid.appendChild(btn);
    }

    body.appendChild(grid);
  }

  function renderFormStep() {
    body.innerHTML = '';

    var backBtn = document.createElement('button');
    backBtn.className = 'sov-booking-back';
    backBtn.setAttribute('aria-label', 'Go back to time selection');
    backBtn.textContent = '< Back to times';
    backBtn.addEventListener('click', function() {
      step = 'time';
      renderTimeStep();
    });
    body.appendChild(backBtn);

    var stepTitle = document.createElement('div');
    stepTitle.className = 'sov-booking-step-title';
    stepTitle.style.marginTop = '8px';
    var dateLabel = formatDateLabel(selectedDate);
    stepTitle.textContent = dateLabel.day + ' ' + dateLabel.date + ' at ' + formatTime(selectedSlot.start);
    body.appendChild(stepTitle);

    var sub = document.createElement('div');
    sub.className = 'sov-booking-subtitle';
    sub.textContent = 'Enter your contact details to confirm the booking.';
    body.appendChild(sub);

    var form = document.createElement('form');
    form.className = 'sov-booking-form';
    form.setAttribute('novalidate', '');

    var nameLabel = document.createElement('label');
    nameLabel.className = 'sov-booking-label';
    nameLabel.textContent = 'Your Name *';
    var nameInput = document.createElement('input');
    nameInput.className = 'sov-booking-input';
    nameInput.type = 'text';
    nameInput.placeholder = 'Your Name';
    nameInput.required = true;
    nameInput.maxLength = 200;
    nameInput.setAttribute('aria-label', 'Your Name');
    nameLabel.appendChild(nameInput);

    var emailLabel = document.createElement('label');
    emailLabel.className = 'sov-booking-label';
    emailLabel.textContent = 'Email Address *';
    var emailInput = document.createElement('input');
    emailInput.className = 'sov-booking-input';
    emailInput.type = 'email';
    emailInput.placeholder = 'Email Address';
    emailInput.required = true;
    emailInput.maxLength = 254;
    emailInput.setAttribute('aria-label', 'Email Address');
    emailLabel.appendChild(emailInput);

    var phoneLabel = document.createElement('label');
    phoneLabel.className = 'sov-booking-label';
    phoneLabel.textContent = 'Phone (optional)';
    var phoneInput = document.createElement('input');
    phoneInput.className = 'sov-booking-input';
    phoneInput.type = 'tel';
    phoneInput.placeholder = 'Phone';
    phoneInput.maxLength = 30;
    phoneInput.setAttribute('aria-label', 'Phone number');
    phoneLabel.appendChild(phoneInput);

    var serviceLabel = document.createElement('label');
    serviceLabel.className = 'sov-booking-label';
    serviceLabel.textContent = 'Service Needed (optional)';
    var serviceInput = document.createElement('input');
    serviceInput.className = 'sov-booking-input';
    serviceInput.type = 'text';
    serviceInput.placeholder = 'Service Needed';
    serviceInput.maxLength = 200;
    serviceInput.setAttribute('aria-label', 'Service Needed');
    serviceLabel.appendChild(serviceInput);

    var submitBtn = document.createElement('button');
    submitBtn.className = 'sov-booking-submit';
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Confirm Booking';

    form.appendChild(nameLabel);
    form.appendChild(emailLabel);
    form.appendChild(phoneLabel);
    form.appendChild(serviceLabel);
    form.appendChild(submitBtn);
    body.appendChild(form);

    var errorMsg = document.createElement('div');
    errorMsg.setAttribute('role', 'alert');
    errorMsg.style.cssText = 'color: #ef4444; font-size: 12px; display: none; padding: 8px 0;';
    form.insertBefore(errorMsg, submitBtn);

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      errorMsg.style.display = 'none';
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      if (!name || !email) {
        errorMsg.textContent = 'Please enter your name and email.';
        errorMsg.style.display = 'block';
        return;
      }
      if (!/^[^@]+@[^@]+\\.[^@]+$/.test(email)) {
        errorMsg.textContent = 'Please enter a valid email address.';
        errorMsg.style.display = 'block';
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';

      fetch(baseUrl + '/api/services/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          customerName: name,
          customerEmail: email,
          customerPhone: phoneInput.value.trim() || undefined,
          serviceType: serviceInput.value.trim() || undefined,
          startsAt: selectedSlot.start,
          endsAt: selectedSlot.end,
        })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Booking failed');
        return res.json();
      })
      .then(function() {
        step = 'success';
        renderSuccess(name);
      })
      .catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
        errorMsg.textContent = 'Sorry, that slot may no longer be available. Please try another time.';
        errorMsg.style.display = 'block';
      });
    });
  }

  function renderSuccess(name) {
    body.innerHTML = '';

    var container = document.createElement('div');
    container.className = 'sov-booking-success';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="' + PRIMARY + '" stroke-width="2"/><path d="M8 12l2.5 2.5L16 9" stroke="' + PRIMARY + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var h3 = document.createElement('h3');
    h3.textContent = 'Booking Confirmed!';
    container.appendChild(h3);

    var p = document.createElement('p');
    var dateLabel = formatDateLabel(selectedDate);
    p.textContent = 'Thanks ' + name + '! You are booked for ' + dateLabel.day + ' ' + dateLabel.date + ' at ' + formatTime(selectedSlot.start) + '. We will send you a confirmation.';
    container.appendChild(p);

    var newBookingBtn = document.createElement('button');
    newBookingBtn.className = 'sov-booking-submit';
    newBookingBtn.style.marginTop = '16px';
    newBookingBtn.textContent = 'Book Another';
    newBookingBtn.addEventListener('click', function() {
      selectedDate = null;
      selectedSlot = null;
      step = 'date';
      fetchSlots(function() { renderDateStep(); });
    });
    container.appendChild(newBookingBtn);

    body.appendChild(container);
  }

  // ---------------------------------------------------------------------------
  // 8. Event handlers
  // ---------------------------------------------------------------------------
  function openPanel() {
    isOpen = true;
    panel.classList.add('sov-open');
    bubble.style.display = 'none';

    if (slots.length === 0) {
      body.innerHTML = '<div class="sov-no-slots" role="status" aria-live="polite"><span class="sov-booking-spinner"></span> Loading available times...</div>';
      fetchSlots(function() {
        step = 'date';
        renderDateStep();
      });
    } else {
      renderDateStep();
    }
    closeBtn.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('sov-open');
    bubble.style.display = 'flex';
    bubble.focus();
  }

  bubble.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      closePanel();
    }
  });
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
