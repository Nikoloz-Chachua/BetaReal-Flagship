# BetaReal Flagship

Standalone Vite + React + TypeScript sales/demo platform for `https://yourrestaurant.betareal.ge`.

## Local Commands

- `npm install`
- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run e2e`

## Architecture

- Routes: `/` and `/demo/:segment` where segment is `luxury`, `cafe`, `fast-casual`, or `social-dining`.
- Segment content lives in `src/data/segments.ts`; adding a fifth segment should only require config, assets/theme, and optional preview data.
- Public UI copy is in `src/data/i18n.ts`.
- Analytics helper is in `src/lib/analytics.ts`; it pushes to `window.dataLayer` when available and dispatches a `betareal:analytics` `CustomEvent`.
- 3D/AR is poster-first. The Google model-viewer script is injected when a model-enabled card nears the viewport or after an explicit 3D/AR visitor action.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback is provided by `public/_redirects`.
- Security headers are provided by `public/_headers`, including CSP for the Vite bundle, Google `model-viewer`, public R2 model/poster assets, blob workers, no framing, and conservative cache rules. Top-level WhatsApp/mailto exits are left compatible with current Chromium CSP support.
- Future custom domain: add `yourrestaurant.betareal.ge` as a Cloudflare Pages custom domain, configure DNS, and keep canonical metadata as `https://yourrestaurant.betareal.ge/`.

## Verified Contacts

- Email: `betareal.ar@gmail.com`
- WhatsApp/tel: `+995 593 19 17 07`
- Secondary tel: `+995 599 00 03 05`

## Demo URL Map

- Fine Dining & Luxury: `https://restaurant-ar.pages.dev/?tenant=luxury`
- Modern Café & Lifestyle: `https://monday-greens.betareal.ge`
- Premium Fast Casual: `https://restaurant-ar.pages.dev/?tenant=mugsy-main`
- Social Dining: `https://restaurant-ar.pages.dev/?tenant=social-dining`

## Notes And Limitations

- The static lead form prepares WhatsApp and email messages; it does not store or send leads server-side.
- AR availability depends on the visitor's browser/device support. Unsupported devices open the interactive 3D viewer with a plain explanation.
- Luxury, fast-casual, and social-dining chapters are labeled design studies and do not imply client endorsement.
- See `docs/ASSET_PROVENANCE.md` for copied asset details.
