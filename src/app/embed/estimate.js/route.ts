export const runtime = "edge";

export async function GET() {
  const js = `
(function() {
  // Prevent double-initialization
  if (window.__sovereignEstimateLoaded) return;
  window.__sovereignEstimateLoaded = true;

  // ---------------------------------------------------------------------------
  // 1. Read the client ID from the embedding script tag
  // ---------------------------------------------------------------------------
  var scripts = document.querySelectorAll('script[data-client-id]');
  var scriptTag = scripts[scripts.length - 1];
  if (!scriptTag) {
    console.error('[SovereignAI] Missing data-client-id on script tag');
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
  var rawVertical = scriptTag.getAttribute('data-vertical') || 'hvac';
  var allowedVerticals = ['hvac', 'plumbing', 'roofing', 'electrical', 'general'];
  var vertical = allowedVerticals.indexOf(rawVertical) !== -1 ? rawVertical : 'hvac';

  // Derive the API base from the script src
  var scriptSrc = scriptTag.getAttribute('src') || '';
  var baseUrl = scriptSrc.replace(/\\/embed\\/estimate\\.js.*$/, '');

  // ---------------------------------------------------------------------------
  // 2. State
  // ---------------------------------------------------------------------------
  var isOpen = false;
  var isAnalyzing = false;
  var selectedFile = null;

  // ---------------------------------------------------------------------------
  // 3. Styles (self-contained, scoped via #sov-estimate)
  // ---------------------------------------------------------------------------
  var PRIMARY = '#f59e0b';
  var PRIMARY_DARK = '#d97706';
  var BG_DARK = '#1a1a2e';
  var BG_PANEL = '#16213e';
  var BG_INPUT = '#0f3460';
  var TEXT = '#e8e8e8';
  var TEXT_MUTED = '#a0a0b8';
  var BORDER = '#1f3a6e';

  var style = document.createElement('style');
  style.textContent = [
    '#sov-estimate * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',

    /* -- Floating Button -- */
    '#sov-estimate-btn { position: fixed; bottom: 24px; right: 24px; padding: 14px 24px; border-radius: 50px; background: linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + '); color: #fff; border: none; cursor: pointer; z-index: 2147483646; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px rgba(245,158,11,0.45); transition: transform 0.2s ease, box-shadow 0.2s ease; }',
    '#sov-estimate-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(245,158,11,0.6); }',
    '#sov-estimate-btn svg { width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 2; }',

    /* -- Modal Overlay -- */
    '#sov-estimate-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2147483647; display: none; align-items: center; justify-content: center; }',
    '#sov-estimate-overlay.sov-open { display: flex; }',

    /* -- Modal -- */
    '#sov-estimate-modal { width: 95%; max-width: 500px; max-height: 90vh; background: ' + BG_DARK + '; border-radius: 16px; overflow-y: auto; border: 1px solid ' + BORDER + '; }',

    /* -- Header -- */
    '#sov-estimate-hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: ' + BG_PANEL + '; border-bottom: 1px solid ' + BORDER + '; }',
    '#sov-estimate-hdr h2 { color: #fff; font-size: 17px; font-weight: 700; }',
    '#sov-estimate-hdr button { background: none; border: none; cursor: pointer; color: ' + TEXT_MUTED + '; padding: 4px; border-radius: 6px; }',
    '#sov-estimate-hdr button:hover { color: #fff; background: rgba(255,255,255,0.08); }',
    '#sov-estimate-hdr button svg { width: 18px; height: 18px; }',

    /* -- Body -- */
    '#sov-estimate-body { padding: 20px; }',
    '#sov-estimate-body label { display: block; margin-bottom: 4px; color: ' + TEXT_MUTED + '; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }',
    '#sov-estimate-body input, #sov-estimate-body select { width: 100%; padding: 10px 14px; background: ' + BG_INPUT + '; border: 1px solid ' + BORDER + '; border-radius: 10px; color: ' + TEXT + '; font-size: 14px; outline: none; margin-bottom: 14px; }',
    '#sov-estimate-body input:focus, #sov-estimate-body select:focus { border-color: ' + PRIMARY + '; }',
    '#sov-estimate-body input::placeholder { color: ' + TEXT_MUTED + '; }',
    '#sov-estimate-body select option { background: ' + BG_INPUT + '; color: ' + TEXT + '; }',

    /* -- Upload zone -- */
    '.sov-upload-zone { border: 2px dashed ' + BORDER + '; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 14px; }',
    '.sov-upload-zone:hover, .sov-upload-zone.dragover { border-color: ' + PRIMARY + '; background: rgba(245,158,11,0.05); }',
    '.sov-upload-zone p { color: ' + TEXT_MUTED + '; font-size: 14px; }',
    '.sov-upload-zone .sov-icon { color: ' + PRIMARY + '; margin-bottom: 8px; }',
    '.sov-upload-zone .sov-filename { color: ' + PRIMARY + '; font-weight: 600; margin-top: 8px; font-size: 13px; }',
    '.sov-upload-zone .sov-preview { max-width: 200px; max-height: 150px; border-radius: 8px; margin-top: 8px; }',

    /* -- Submit button -- */
    '#sov-estimate-submit { width: 100%; padding: 14px; background: linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + '); border: none; border-radius: 12px; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }',
    '#sov-estimate-submit:disabled { opacity: 0.5; cursor: not-allowed; }',
    '#sov-estimate-submit:hover:not(:disabled) { opacity: 0.9; }',

    /* -- Results -- */
    '#sov-estimate-results { display: none; }',
    '.sov-result-card { background: ' + BG_PANEL + '; border: 1px solid ' + BORDER + '; border-radius: 12px; padding: 16px; margin-bottom: 12px; }',
    '.sov-result-card h3 { color: #fff; font-size: 15px; font-weight: 700; margin-bottom: 8px; }',
    '.sov-result-card p { color: ' + TEXT_MUTED + '; font-size: 13px; line-height: 1.5; }',
    '.sov-estimate-range { text-align: center; padding: 20px; background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1)); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; margin-bottom: 12px; }',
    '.sov-estimate-range .sov-price { font-size: 28px; font-weight: 800; color: ' + PRIMARY + '; }',
    '.sov-estimate-range .sov-label { font-size: 12px; color: ' + TEXT_MUTED + '; margin-top: 4px; }',
    '.sov-confidence { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }',
    '.sov-confidence-high { background: rgba(16,185,129,0.15); color: #10b981; }',
    '.sov-confidence-medium { background: rgba(245,158,11,0.15); color: #f59e0b; }',
    '.sov-confidence-low { background: rgba(239,68,68,0.15); color: #ef4444; }',

    /* -- CTA -- */
    '#sov-estimate-cta { display: none; width: 100%; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; }',
    '#sov-estimate-cta:hover { opacity: 0.9; }',

    /* -- Spinner -- */
    '.sov-spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: sovSpin 0.6s linear infinite; }',
    '@keyframes sovSpin { to { transform: rotate(360deg); } }',

    /* -- Footer -- */
    '#sov-estimate-foot { text-align: center; padding: 10px; border-top: 1px solid ' + BORDER + '; }',
    '#sov-estimate-foot a { color: ' + TEXT_MUTED + '; font-size: 11px; text-decoration: none; }',
    '#sov-estimate-foot a:hover { color: ' + PRIMARY + '; }',

    /* -- Mobile -- */
    '@media (max-width: 500px) {',
    '  #sov-estimate-modal { width: 100%; max-width: 100%; height: 100%; max-height: 100%; border-radius: 0; }',
    '  #sov-estimate-btn { bottom: 16px; right: 16px; padding: 12px 18px; font-size: 14px; }',
    '}'
  ].join('\\n');
  document.head.appendChild(style);

  // ---------------------------------------------------------------------------
  // 4. Build DOM
  // ---------------------------------------------------------------------------
  var root = document.createElement('div');
  root.id = 'sov-estimate';

  // Floating button
  var btn = document.createElement('button');
  btn.id = 'sov-estimate-btn';
  btn.setAttribute('aria-label', 'Get Instant Estimate');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> Get Instant Estimate';

  // Modal overlay
  var overlay = document.createElement('div');
  overlay.id = 'sov-estimate-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-labelledby', 'sov-estimate-title');
  overlay.setAttribute('aria-modal', 'true');

  var modal = document.createElement('div');
  modal.id = 'sov-estimate-modal';

  // Header
  var hdr = document.createElement('div');
  hdr.id = 'sov-estimate-hdr';
  var hdrTitle = document.createElement('h2');
  hdrTitle.id = 'sov-estimate-title';
  hdrTitle.textContent = 'Get an Instant AI Estimate';
  var closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  hdr.appendChild(hdrTitle);
  hdr.appendChild(closeBtn);

  // Body
  var body = document.createElement('div');
  body.id = 'sov-estimate-body';

  // Form section
  var formSection = document.createElement('div');
  formSection.id = 'sov-estimate-form';

  // Upload zone
  var uploadZone = document.createElement('div');
  uploadZone.className = 'sov-upload-zone';
  uploadZone.setAttribute('role', 'button');
  uploadZone.setAttribute('tabindex', '0');
  uploadZone.setAttribute('aria-label', 'Upload a photo for estimate');
  uploadZone.innerHTML = '<div class="sov-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div><p>Tap to take a photo or upload an image</p>';
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.capture = 'environment';
  fileInput.style.display = 'none';
  fileInput.setAttribute('aria-label', 'Choose an image file');

  // Name
  var nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'sov-estimate-name');
  nameLabel.textContent = 'Your Name';
  var nameInput = document.createElement('input');
  nameInput.id = 'sov-estimate-name';
  nameInput.type = 'text';
  nameInput.placeholder = 'John Smith';

  // Phone
  var phoneLabel = document.createElement('label');
  phoneLabel.setAttribute('for', 'sov-estimate-phone');
  phoneLabel.textContent = 'Phone Number';
  var phoneInput = document.createElement('input');
  phoneInput.id = 'sov-estimate-phone';
  phoneInput.type = 'tel';
  phoneInput.placeholder = '(555) 123-4567';

  // Email
  var emailLabel = document.createElement('label');
  emailLabel.setAttribute('for', 'sov-estimate-email');
  emailLabel.textContent = 'Email (optional)';
  var emailInput = document.createElement('input');
  emailInput.id = 'sov-estimate-email';
  emailInput.type = 'email';
  emailInput.placeholder = 'john@example.com';

  // Vertical selector
  var vertLabel = document.createElement('label');
  vertLabel.setAttribute('for', 'sov-estimate-vertical');
  vertLabel.textContent = 'Issue Type';
  var vertSelect = document.createElement('select');
  vertSelect.id = 'sov-estimate-vertical';
  vertSelect.innerHTML = '<option value="hvac">HVAC / Air Conditioning</option><option value="plumbing">Plumbing</option><option value="roofing">Roofing</option><option value="electrical">Electrical</option><option value="general">General Home Repair</option>';
  vertSelect.value = vertical;

  // Submit
  var submitBtn = document.createElement('button');
  submitBtn.id = 'sov-estimate-submit';
  submitBtn.textContent = 'Analyze Photo & Get Estimate';
  submitBtn.disabled = true;

  var sovEstimateError = document.createElement('div');
  sovEstimateError.setAttribute('role', 'alert');
  sovEstimateError.style.cssText = 'color: #ef4444; font-size: 13px; display: none; padding: 8px 0; text-align: center;';

  formSection.appendChild(uploadZone);
  formSection.appendChild(fileInput);
  formSection.appendChild(nameLabel);
  formSection.appendChild(nameInput);
  formSection.appendChild(phoneLabel);
  formSection.appendChild(phoneInput);
  formSection.appendChild(emailLabel);
  formSection.appendChild(emailInput);
  formSection.appendChild(vertLabel);
  formSection.appendChild(vertSelect);
  formSection.appendChild(sovEstimateError);
  formSection.appendChild(submitBtn);

  // Results section
  var results = document.createElement('div');
  results.id = 'sov-estimate-results';
  results.setAttribute('role', 'status');
  results.setAttribute('aria-live', 'polite');

  var ctaBtn = document.createElement('button');
  ctaBtn.id = 'sov-estimate-cta';
  ctaBtn.textContent = 'Book a Technician';

  body.appendChild(formSection);
  body.appendChild(results);
  body.appendChild(ctaBtn);

  // Footer
  var foot = document.createElement('div');
  foot.id = 'sov-estimate-foot';
  var footLink = document.createElement('a');
  footLink.href = 'https://sovereignai.com';
  footLink.target = '_blank';
  footLink.rel = 'noopener noreferrer';
  footLink.textContent = 'Powered by Sovereign AI';
  foot.appendChild(footLink);

  modal.appendChild(hdr);
  modal.appendChild(body);
  modal.appendChild(foot);
  overlay.appendChild(modal);
  root.appendChild(btn);
  root.appendChild(overlay);
  document.body.appendChild(root);

  // ---------------------------------------------------------------------------
  // 5. Event handlers
  // ---------------------------------------------------------------------------
  function openModal() {
    isOpen = true;
    overlay.classList.add('sov-open');
    btn.style.display = 'none';
    closeBtn.focus();
  }

  function closeModal() {
    isOpen = false;
    overlay.classList.remove('sov-open');
    btn.style.display = 'flex';
    btn.focus();
  }

  btn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      closeModal();
    }
  });

  // Upload zone
  uploadZone.addEventListener('click', function() { fileInput.click(); });
  uploadZone.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  uploadZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', function() {
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', function() {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    selectedFile = file;
    submitBtn.disabled = false;

    // Show preview
    var reader = new FileReader();
    reader.onload = function(e) {
      uploadZone.innerHTML = '';
      var img = document.createElement('img');
      img.className = 'sov-preview';
      img.src = e.target.result;
      img.alt = 'Preview';
      var nameDiv = document.createElement('div');
      nameDiv.className = 'sov-filename';
      nameDiv.textContent = file.name;
      uploadZone.appendChild(img);
      uploadZone.appendChild(nameDiv);
    };
    reader.readAsDataURL(file);
  }

  // Submit
  submitBtn.addEventListener('click', function() {
    if (!selectedFile || isAnalyzing) return;
    isAnalyzing = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="sov-spinner"></span> Analyzing...';

    var formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('clientId', clientId);
    formData.append('vertical', vertSelect.value);
    if (nameInput.value.trim()) formData.append('customerName', nameInput.value.trim());
    if (phoneInput.value.trim()) formData.append('customerPhone', phoneInput.value.trim());
    if (emailInput.value.trim()) formData.append('customerEmail', emailInput.value.trim());

    // Validate file size on the client side (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      sovEstimateError.textContent = 'Image must be under 5MB. Please choose a smaller file.';
      sovEstimateError.style.display = 'block';
      submitBtn.innerHTML = 'Analyze Photo & Get Estimate';
      submitBtn.disabled = false;
      isAnalyzing = false;
      return;
    }
    sovEstimateError.style.display = 'none';

    fetch(baseUrl + '/api/estimate/analyze', {
      method: 'POST',
      body: formData
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Analysis failed (' + res.status + ')');
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) throw new Error('Unexpected response format');
      return res.json();
    })
    .then(function(data) {
      showResults(data);
    })
    .catch(function(err) {
      console.error('[SovereignAI] Estimate error:', err);
      submitBtn.innerHTML = 'Analyze Photo & Get Estimate';
      submitBtn.disabled = false;
      isAnalyzing = false;
      sovEstimateError.textContent = 'Sorry, we could not analyze your photo. Please try again.';
      sovEstimateError.style.display = 'block';
    });
  });

  function showResults(data) {
    formSection.style.display = 'none';
    results.style.display = 'block';

    var low = data.estimateLow ? '$' + Math.round(data.estimateLow / 100).toLocaleString() : '$--';
    var high = data.estimateHigh ? '$' + Math.round(data.estimateHigh / 100).toLocaleString() : '$--';
    var rawConf = (data.confidence || 'medium').replace(/[^a-zA-Z]/g, '');
    var confClass = 'sov-confidence-' + rawConf;

    results.innerHTML = '' +
      '<div class="sov-estimate-range">' +
        '<div class="sov-price">' + escapeHtml(low + ' - ' + high) + '</div>' +
        '<div class="sov-label">Estimated Repair Cost</div>' +
      '</div>' +
      '<div class="sov-result-card">' +
        '<h3>What We Found</h3>' +
        '<p>' + escapeHtml(data.issueDescription || 'Analysis complete.') + '</p>' +
        '<div style="margin-top:8px"><span class="sov-confidence ' + confClass + '">' + escapeHtml(data.confidence || 'medium') + ' confidence</span></div>' +
      '</div>';

    ctaBtn.style.display = 'block';
    isAnalyzing = false;
  }

  // CTA — could link to a booking page or scroll to contact form
  ctaBtn.addEventListener('click', function() {
    // Try to find a contact form or booking link on the page
    var bookingLink = document.querySelector('a[href*="book"], a[href*="schedule"], a[href*="contact"]');
    if (bookingLink) {
      bookingLink.click();
    } else {
      // Default: scroll to top where the contact form likely is
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    closeModal();
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
