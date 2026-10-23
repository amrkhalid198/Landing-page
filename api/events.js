'use strict';

const names = new Set(['cta_click', 'plan_select', 'payment_click', 'receipt_click', 'review_open', 'review_prepare']);
const values = {
  plan: new Set(['standard', 'vip']),
  method: new Set(['card', 'vodafone', 'instapay']),
  placement: new Set(['hero', 'header', 'mobile-sticky', 'footer'])
};

// Aggregate interaction logs only. Never accept review text, receipts, names or health information.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (req.headers.dnt === '1' || req.headers['sec-gpc'] === '1') return res.status(204).end();
  const host = req.headers.host;
  if (!host || req.headers.origin !== `https://${host}`) return res.status(403).end();
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).end();
  if (Number(req.headers['content-length'] || 0) > 1024) return res.status(413).end();
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { return res.status(400).end(); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 1024 || !names.has(body.name)) return res.status(400).end();
  const allowedKeys = new Set(['name', ...Object.keys(values), 'utm_source', 'utm_medium', 'utm_campaign']);
  if (Object.keys(body).some(key => !allowedKeys.has(key))) return res.status(400).end();
  const event = { name: body.name };
  for (const [key, allowed] of Object.entries(values)) {
    if (body[key] !== undefined) {
      if (!allowed.has(body[key])) return res.status(400).end();
      event[key] = body[key];
    }
  }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'string' || !/^[a-zA-Z0-9._ -]{1,64}$/.test(body[key])) return res.status(400).end();
      event[key] = body[key];
    }
  }
  console.info(JSON.stringify({ type: 'landing_event', event }));
  return res.status(204).end();
};
