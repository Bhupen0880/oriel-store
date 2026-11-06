# ORIEL

A demo storefront for circadian recovery: sunrise light, red light, heat, cold, and the objects that sit between them. It is a portfolio piece, not a shop. Nothing is for sale and nothing ships.

Designed as a showpiece for [@King088_](https://x.com/King088_).

## Brand

- **Niche.** At-home sleep and recovery. The objects people are actually buying right now: sunrise lamps, red-light panels and wands, infrared blankets, discreet wearables, compression, cooling bedding, magnesium baths, and apartment-scale cold.
- **Name.** ORIEL. An oriel is a window that catches light.
- **Palette.** Warm paper `#f3eee6`, ink `#1c1915`, clay `#9a3d1c`, moss `#243028`.
- **Type.** Fraunces for the wordmark and headlines. Outfit for everything you read in a hurry. Both are open-source (SIL Open Font License); license texts are in `public/fonts/`.

## The edit

| Object | Category | Price |
| --- | --- | --- |
| Field Panel | Recovery | $468 |
| The Aperture | Light | $168 |
| The Kiln | Heat | $589 |
| Halo Band | Wear | $229 |
| Meridian Boots | Recovery | $640 |
| Ember Wand | Light | $158 |
| Contrast Pail | Cold | $124 |
| River | Sleep | $148 |
| Still | Recovery | $189 |
| Veil | Sleep | $64 |
| Brass Mist | Sleep | $92 |
| Night Salt | Sleep | $36 |

## Run it locally

Node 20 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4721](http://127.0.0.1:4721).

The cart, the category filters, the product view, and the newsletter all run in the browser. The bag is stored in `localStorage`. The mailing list never leaves the browser. Checkout writes a pretend order and does not take payment.

## Build

```bash
npm run build
```

Static files land in `dist/`. Preview them with:

```bash
npm run preview
```

## Deploy

Any static host works. Upload the contents of `dist/`, or connect the repo and use the build command above.

- **Netlify.** `netlify.toml` is already set (`npm run build`, publish `dist`). Drop the repo on Netlify, or drag the `dist` folder onto the Netlify drop page.
- **Cloudflare Pages.** Build command `npm run build`, output directory `dist`.
- **GitHub Pages.** Build, then publish `dist`. If the site is served from a subpath, set `base` in `vite.config.js` to that path and rebuild.
- **Anywhere else.** `dist` is plain HTML, CSS, JS, and images. No server code.

### Link preview on X

After the site has a public URL, set absolute addresses in `index.html` so the card renders when the link is posted:

```html
<meta property="og:image" content="https://YOUR-DOMAIN/og.jpg" />
<meta name="twitter:image" content="https://YOUR-DOMAIN/og.jpg" />
```

`public/og.jpg` is a 1200×630 card (the lamp, the wordmark, the line). It is copied into `dist` on build.

## What’s included

- Hero, trending grid with category filters, product dialog, bag (add, quantity, remove, shipping, total), demo checkout confirmation
- Trust section for shipping, returns, and checkout
- Newsletter form that only stores a flag in this browser
- Footer credit: demo store designed by @King088_
- Responsive layout, reduced-motion support, keyboard access, and dialog focus handling
- SEO description, Open Graph, and Twitter card meta

No customer reviews are invented. Prices are part of the fiction of the demo.
