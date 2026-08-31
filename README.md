# Bulletproof Ankle — Landing Page

Static single-page site. No build step, no framework.

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

## After attaching the custom domain

Find-and-replace **`SITE_ORIGIN_PLACEHOLDER`** in `index.html` with the
live host (no protocol, no trailing slash — e.g. `bulletproofankle.com`).
It appears 5 times, all inside the `<head>`: canonical, `og:url`,
`og:image`, and `twitter:image`.

## Arabic copy

Every string that still needs writing is marked `[[AR: some_key]]`.
Search the file for `[[AR:` to find them all.
