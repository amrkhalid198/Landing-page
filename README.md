# Bulletproof Ankle landing page

The design and page copy are restored from commit 4f1980c11508c3ade7607d1c8b753985eaa8e2cf at the owner's request. Original CSS is inline in index.html. The previous redesign stylesheet is unused.

Retained functional improvements: native keyboard FAQs, preserved URL query strings and anchors, selected-plan persistence and precise receipt messages, truthful clipboard failure handling, HTTPS wallet links, screenshot enlargement, and privacy-limited interaction logs through api/events.js. No forced page-load scroll reset. WhatsApp links have HTML fallbacks.

hero-ankle-aligned.webp is the corrected hero artwork. hero-ankle-aligned.jpg shows the same artwork on the dark page background for social previews. Open Graph and Twitter tags point to the versioned JPEG. Sharing services can retain cached cards until they refresh.

Built-in image-editing prompt: Align the shin tops, ankle heights and sole baselines, keeping natural equal proportions, the injured/armored comparison, orange arrow and diagonal divider, original illustration style and transparent background. The edited PNG was resized and exported without further composition changes.

No review form or invented testimonials are displayed. The owner will supply approved quotes, locations, sports and optional photos for manual review cards later. No enrollment counter is displayed in the restored design.

Use Node 22+: npm ci, npx playwright install chromium, npm test, npm run preview. Production: https://landing-page-five-pied-29.vercel.app/ . Vercel serves the static root with no build command. When changing domains, update canonical, Open Graph, Twitter, robots.txt and sitemap.xml together. The payment provider links do not verify payment or create plan-specific sessions; the selected plan and amount are carried into the receipt message.
