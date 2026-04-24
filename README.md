# Gold Kings Online — Premium WebGL Luxury Gallery

A fully-featured, production-ready luxury jewelry website with advanced WebGL effects, smooth animations, and Instagram-style imagery.

## Features

- **Preloader** — Animated gold neural field with progress counter
- **Hero Section** — Full-screen WebGL with warm gold shimmer shader + responsive overlay
- **Gallery Grid** — 12 luxury jewelry cards with:
  - Per-card WebGL hover distortion
  - Filter tabs (Rings, Necklaces, Bangles, Pendants)
  - Lightbox modal on click
  - Lazy-loaded WebGL via IntersectionObserver
- **Scroll-Pinned Showcase** — 4 collection slides with scroll-driven crossfade and gold shimmer transitions
- **About Strip** — Parallax editorial image + 3 key stats
- **Footer** — 4-column dark luxury footer with social links

## Tech Stack

- **Three.js r165** — WebGL rendering (importmap, no build step)
- **GSAP 3.12.5** — Animation timeline, scroll triggers, staggering
- **Lenis 1.0.42** — Smooth scroll integration
- **CSS 4** — Design tokens, responsive grid, custom properties
- **Fonts** — Cormorant Garamond (serif) + Montserrat (sans)

## Styling Highlights

- **Palette** — Deep black (#0A0804), rich gold (#C8A45A), champagne accents (#F5E6C8)
- **Typography** — Serif display headlines, sans-serif UI, 0.28em letter-spacing for editorial feel
- **Effects** — Film grain overlay, glass nav backdrop, cursor tracking, gold pulse animations
- **Responsive** — clamp() scaling, grid-based layout, mobile optimized

## GLSL Shader Adaptations for Gold

Three.js shaders adapted from premium-webgl-site with warm gold palette:
- **Hero:** Warm tone bias, diagonal shimmer sweep, gold hover glow
- **Card:** Warm saturation flip on hover, gold edge glow
- **Showcase:** Warm editorial grade, gold shimmer during collection transitions

## Images

All 15 images sourced from Unsplash CDN (CORS-safe, reliable):
- 1 hero background (luxury gold jewelry flat lay)
- 12 gallery cards (rings, necklaces, bangles, pendants)
- 4 showcase slides (collection pillars)
- 1 about strip (craftsmanship/atelier)

## How to Run Locally

```bash
cd C:\Users\Mj\gold-kings-site
python -m http.server 8080
# Then open http://localhost:8080 in your browser
```

**Note:** `file://` protocol won't work due to ES modules CORS restriction. Must use HTTP server.

## File Structure

```
gold-kings-site/
├── index.html              (9.3 KB — full page markup)
├── css/
│   └── style.css           (32 KB — all styling + design tokens)
└── js/
    ├── data.js             (5 KB — image URLs + gallery/showcase data)
    ├── shaders.js          (8 KB — GLSL shaders with gold modifications)
    ├── webgl.js            (9 KB — Three.js init functions)
    ├── neural.js           (4 KB — preloader neural field)
    └── main.js             (14 KB — boot, GSAP, lightbox, scroll wiring)
```

## Verification Checklist

- [x] Preloader animates gold particles → counter 0→100 → slides out
- [x] Hero canvas loads with warm gold shimmer shader
- [x] Gallery 12 cards populate with lazy WebGL distortion on hover
- [x] Filter tabs toggle card visibility with smooth GSAP transitions
- [x] Lightbox opens on card click with image + metadata
- [x] Showcase section pins to screen, scrolls through 4 collections
- [x] Collection slides crossfade with gold shimmer transitions
- [x] About strip has upward parallax on scroll
- [x] Footer renders with 4-col layout + social links
- [x] Custom cursor tracks with split animation and hover labels
- [x] Smooth scroll (Lenis) integrated throughout
- [x] Film grain overlay subtle on dark background

## Browser Support

- Chrome 90+ (WebGL 2)
- Firefox 88+
- Safari 15+
- Edge 90+

WebGL shaders use `highp` precision, require modern GPU.

## Design Inspiration

Luxury aesthetic inspired by:
- Premium jewelry brand websites (Cartier, Bulgari, Tiffany)
- Minimal editorial photography
- Gold metallic color psychology
- Serif typography hierarchy
