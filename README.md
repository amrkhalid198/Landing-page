# Bulletproof Ankle — Landing Page

Static Arabic RTL landing page with one optional Vercel function for aggregate interaction logs. No framework or production build step.

## Content facts

- The owner confirmed **6 athletes enrolled** on 23 October 2026. Both visible counts are static, cumulative enrollments; update them only from real records.
- There are no published reviews or aggregate ratings. The review form prepares a WhatsApp message for a participant to review and send. It supports all 1–5 ratings and an optional publication-consent checkbox. It does not upload, store, publish, or verify a review automatically.
- Standard costs 900 EGP and includes 90 days of program access from account delivery, without personal coaching.
- VIP costs 2,000 EGP (displayed previous price 2,500 EGP), includes permanent program access/updates, and personal coaching until return to sport (RTS).
- Do not add qualifications, refund wording, or support-hour promises without new owner instructions. None are inferred by this implementation.

## Files and local verification

- `index.html`: content, semantic sections, dialogs, public offer metadata.
- `styles.css`: shared tokens, component styles and responsive conditions.
- `app.js`: plan selection, truthful clipboard feedback, accessible dialogs, review-message preparation and allowlisted event reporting.
- `api/events.js`: POST-only same-origin event collector. Logs accepted aggregate events to Vercel function logs; no database, user identity, review text, receipt contents, or health data is accepted. DNT and GPC signals are respected. Clicks are not recorded as completed purchases.
- `fonts/`: self-hosted existing font families with their SIL Open Font Licenses.
- `images/`: responsive hero derivatives. The original image remains the social preview asset.

Use Node 22 or later:

```sh
npm ci
npx playwright install chromium
npm test
npm run preview
```

The preview serves at `http://127.0.0.1:4173`. Its event route is a no-op. Browser tests cover plan/price persistence, payment gating, keyboard FAQs, clipboard failure states, review consent/privacy, screenshot dialogs, real metadata, mobile/tablet/desktop layouts and zoom. The GitHub workflow runs the same suite.

## Review workflow

Send participants the page URL with `#reviews`. The button opens a form; without dialog support/JavaScript its primary action has a WhatsApp fallback. The participant sees the message and presses Send inside WhatsApp themselves. Check their participation and publication permission before using their words on the site. Do not label someone verified without actually checking their enrollment, or create an average/star count from unpublished or missing reviews.

Review messages contain participant-entered text; keep them out of aggregate analytics. The collector rejects unexpected keys and does not infer a completed enrollment from a payment-link click.

## Domain and payment changes

The current origin is `https://landing-page-five-pied-29.vercel.app`. When changing domains, update canonical/Open Graph/Twitter URLs, JSON-LD offers, robots.txt, and sitemap.xml together. Each offer URL supports `?plan=standard#price` or `?plan=vip#price`.

WhatsApp and wallet details must match the owner's real accounts. The public Paymob link is shared by both plans; the page displays the selected amount and adds it to the receipt message, but does not claim to create a plan-specific provider session or verify a payment. Confirm the intended amount and recipient in the provider app/browser before a customer charge.

## Deploy (Vercel)

Import the repo on Vercel and pick **Other** as the framework preset.
Leave Build Command empty and set Output Directory to the repo root
(`.`). `index.html` and the images sit at the root, so they are served
at `/index.html`, `/brand.png`, and so on — which is what every asset
path in the HTML now assumes.

`vercel.json` sets:

- `cleanUrls` / `trailingSlash: false` — no `.html` in URLs.
- Image caching: `max-age=604800, stale-while-revalidate=2592000`.
  Deliberately **not** `immutable`: filenames are not content-hashed,
  so replacing e.g. `coach.jpg` must still reach visitors. A week of
  cache with a month of background revalidation is the safe middle.
- `index.html`: `max-age=0, must-revalidate` so copy edits go live at once.
- `nosniff`, `Referrer-Policy`, `X-Frame-Options`.
