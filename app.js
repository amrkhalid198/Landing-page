'use strict';

(() => {
  const contactNumber = '201017201075';
  const plans = {
    standard: { name: 'Standard', price: 900, display: '900', access: 'وصول لمدة 90 يوم، بدون متابعة شخصية' },
    vip: { name: 'VIP', price: 2000, display: '2,000', access: 'وصول دائم ومتابعة لحد العودة للرياضة (RTS)' }
  };
  const allowedEvents = new Set(['cta_click', 'plan_select', 'payment_click', 'receipt_click', 'review_open', 'review_prepare']);
  let selectedPlan = null;
  const waUrl = text => `https://wa.me/${contactNumber}?text=${encodeURIComponent(text)}`;
  const store = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* The page works without storage. */ } }
  };

  // Only allowlisted interaction metadata is sent. Reviews, receipts and health data never enter this path.
  function track(name, metadata = {}) {
    if (!allowedEvents.has(name) || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
    const payload = { name };
    if (plans[metadata.plan]) payload.plan = metadata.plan;
    if (['card', 'vodafone', 'instapay'].includes(metadata.method)) payload.method = metadata.method;
    if (['hero', 'header', 'mobile-sticky', 'footer'].includes(metadata.placement)) payload.placement = metadata.placement;
    const params = new URLSearchParams(location.search);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      const value = params.get(key);
      if (value && /^[a-zA-Z0-9._ -]{1,64}$/.test(value)) payload[key] = value;
    }
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }))) return;
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'omit' }).catch(() => {});
    } catch { /* Tracking never blocks enrollment or feedback. */ }
  }

  function renderPlan(id) {
    if (!plans[id]) return;
    selectedPlan = id;
    const plan = plans[id];
    store.set('bp-selected-plan-v1', id);
    for (const card of document.querySelectorAll('[data-plan-card]')) {
      const active = card.dataset.planCard === id;
      card.classList.toggle('is-selected', active);
      card.querySelector('.selected-badge').hidden = !active;
      const link = card.querySelector('[data-select-plan]');
      if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    }
    const summary = document.getElementById('selected-plan-text');
    summary.replaceChildren();
    const name = document.createElement('bdi');
    name.textContent = `${plan.name} — ${plan.display} EGP`;
    summary.append(name, document.createElement('br'), document.createTextNode(plan.access));
    document.getElementById('payment-error').hidden = true;
    for (const link of document.querySelectorAll('[data-receipt-link]')) {
      link.href = waUrl(`السلام عليكم، عايز أفعّل اشتراكي في Bulletproof Ankle.\nالباقة: ${plan.name}\nالمبلغ: ${plan.price} جنيه\nهرفق إيصال الدفع للمراجعة.`);
    }
  }

  const requestedPlan = new URLSearchParams(location.search).get('plan');
  const savedPlan = requestedPlan || store.get('bp-selected-plan-v1');
  if (plans[savedPlan]) renderPlan(savedPlan);

  for (const link of document.querySelectorAll('[data-select-plan]')) {
    link.addEventListener('click', () => {
      renderPlan(link.dataset.selectPlan);
      track('plan_select', { plan: selectedPlan });
    });
  }
  function requirePlan(event) {
    if (selectedPlan) return true;
    event.preventDefault();
    const error = document.getElementById('payment-error');
    error.textContent = 'اختار Standard أو VIP الأول عشان تتأكد من المبلغ الصحيح.';
    error.hidden = false;
    document.querySelector('[data-select-plan]').focus();
    return false;
  }
  for (const link of document.querySelectorAll('[data-payment-method]')) {
    link.addEventListener('click', event => {
      if (requirePlan(event)) track('payment_click', { plan: selectedPlan, method: link.dataset.paymentMethod });
    });
  }
  for (const link of document.querySelectorAll('[data-receipt-link]')) {
    link.addEventListener('click', event => {
      if (requirePlan(event)) track('receipt_click', { plan: selectedPlan });
    });
  }
  for (const link of document.querySelectorAll('[data-track]')) {
    link.addEventListener('click', () => track('cta_click', { placement: link.dataset.track }));
  }

  async function copyValue(button) {
    const source = document.getElementById(button.dataset.copy);
    const status = document.getElementById('copy-status');
    if (!source) return;
    const text = source.textContent.trim();
    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch { /* Try the selection-based fallback below. */ }
    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('aria-label', 'القيمة المطلوب نسخها');
      textarea.style.cssText = 'position:fixed;inset:0 auto auto 0;opacity:0;pointer-events:none';
      document.body.append(textarea);
      textarea.select();
      try { copied = typeof document.execCommand === 'function' && document.execCommand('copy') === true; } catch { copied = false; }
      textarea.remove();
      button.focus({ preventScroll: true });
    }
    if (copied) {
      button.textContent = 'تم النسخ';
      button.classList.add('copied');
      status.textContent = 'تم نسخ البيانات.';
      clearTimeout(button.copyTimer);
      button.copyTimer = setTimeout(() => { button.textContent = 'انسخ'; button.classList.remove('copied'); }, 2000);
    } else {
      button.textContent = 'انسخ يدويًا';
      button.classList.remove('copied');
      status.textContent = 'النسخ التلقائي مش متاح. حدّد الرقم أو المعرّف وانسخه يدويًا.';
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      if (selection) { selection.removeAllRanges(); selection.addRange(range); }
    }
  }
  for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', () => copyValue(button));

  let dialogOpener = null;
  function openDialog(dialog, opener) {
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    dialogOpener = opener;
    dialog.showModal();
    return true;
  }
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true }); });
  }
  for (const button of document.querySelectorAll('[data-image-open]')) {
    button.addEventListener('click', () => {
      const source = button.querySelector('img');
      const image = document.getElementById('expanded-image');
      image.src = source.src;
      image.alt = source.alt;
      document.getElementById('image-caption').textContent = button.closest('figure').querySelector('figcaption').textContent;
      if (!openDialog(document.getElementById('image-dialog'), button)) window.open(source.src, '_blank', 'noopener,noreferrer');
    });
  }
  for (const opener of document.querySelectorAll('[data-review-open]')) {
    opener.addEventListener('click', event => {
      if (openDialog(document.getElementById('review-dialog'), opener)) {
        event.preventDefault();
        track('review_open');
      }
    });
  }
  const reviewForm = document.getElementById('review-form');
  reviewForm.addEventListener('input', () => { document.getElementById('review-result').hidden = true; });
  reviewForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!reviewForm.reportValidity()) return;
    const data = new FormData(reviewForm);
    const message = [
      'تجربتي مع Bulletproof Ankle',
      `الاسم: ${String(data.get('name')).trim()}`,
      `الرياضة: ${String(data.get('sport')).trim() || 'مش مذكورة'}`,
      `المدة: ${data.get('duration')}`,
      `التقييم: ${data.get('rating')}`,
      `تجربتي وملاحظاتي: ${String(data.get('experience')).trim()}`,
      `إذن النشر بالاسم الأول والرياضة: ${data.has('consent') ? 'موافق' : 'غير موافق؛ الرأي خاص'}`
    ].join('\n');
    document.getElementById('review-message').value = message;
    document.getElementById('review-send').href = waUrl(message);
    document.getElementById('review-result').hidden = false;
    document.getElementById('review-send').focus();
    track('review_prepare');
  });

  const bar = document.querySelector('.mobile-enroll');
  const fab = document.querySelector('.wa-fab');
  const hero = document.querySelector('.hero');
  const payment = document.getElementById('payment');
  let heroVisible = true;
  let paymentVisible = false;
  function updateFloatingControls() {
    const onPhone = matchMedia('(max-width: 600px)').matches;
    const modalOpen = Boolean(document.querySelector('dialog[open]'));
    const showBar = onPhone && !heroVisible && !paymentVisible && !modalOpen;
    bar.hidden = !showBar;
    document.body.classList.toggle('has-enroll-bar', showBar);
    fab.classList.toggle('is-hidden', paymentVisible || showBar || modalOpen);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; updateFloatingControls(); }).observe(hero);
    new IntersectionObserver(entries => { paymentVisible = entries[0].isIntersecting; updateFloatingControls(); }).observe(payment);
    addEventListener('resize', updateFloatingControls);
    new MutationObserver(updateFloatingControls).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  }
})();
