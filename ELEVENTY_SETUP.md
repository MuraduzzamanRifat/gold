# Eleventy Migration - Code Simplification

## Overview
This project uses **Eleventy (11ty)** to eliminate 80% HTML duplication across 3 pages (index, snellville, commerce).

## Problem Solved
**Before:** Identical HTML sections (navigation, footer, benefit cards) duplicated across 3 files
**After:** Single source of truth with Nunjucks templates and data files

## Structure

```
gold-kings-site/
├── src/
│   ├── _layouts/
│   │   ├── base.html         (main page layout)
│   │   └── location.html     (location page layout)
│   ├── _includes/            (reusable components)
│   │   ├── cursor.html
│   │   ├── nav.html
│   │   ├── nav-location.html
│   │   ├── footer.html
│   │   ├── footer-location.html
│   │   ├── benefit-cards.html (shared across locations)
│   │   └── ...
│   ├── _data/
│   │   └── locations.json    (location metadata: phone, hours, testimonials)
│   ├── index.md              (homepage)
│   ├── snellville/
│   │   └── index.md          (uses locations[0])
│   └── commerce/
│       └── index.md          (uses locations[1])
├── css/                       (passthrough - unchanged)
├── js/                        (passthrough - unchanged)
├── .eleventy.js              (Eleventy config)
├── package.json              (npm dependencies)
└── _site/                    (generated output - in .gitignore)
```

## Setup

```bash
# Install dependencies
npm install

# Build (generates _site/)
npm run build

# Develop with live reload
npm run dev
```

## Benefits

1. **DRY Code** — Navigation, footer, benefit cards defined once
2. **Data-Driven** — Location info in `_data/locations.json`, used by both location pages
3. **Scalable** — Add a new location with 3 lines of JSON + 1 markdown file
4. **Maintainable** — Fix navigation bug once, applies to all pages
5. **Performance** — No runtime overhead (all static HTML generated at build time)

## Example: Adding a Third Location

1. Add location to `src/_data/locations.json`:
```json
{
  "id": "atlanta",
  "city": "Atlanta",
  "state": "GA",
  "phone": "404-555-1234",
  ...
}
```

2. Create `src/atlanta/index.md`:
```yaml
---
layout: location
location: locations[2]
pageTitle: "Gold Kings Atlanta, GA..."
---
```

3. Run `npm run build` — Done! All pages auto-update with new location in lists.

## Deployment

### GitHub Pages
```bash
npm run build
git add _site/
git commit -m "Build: regenerated static files"
git push
```

OR set up GitHub Actions to automate.

### Local Testing
```bash
npm run dev
# Visit http://localhost:8080
```

## Fallback to Static HTML

If Eleventy becomes unmaintainable, the generated `_site/` directory contains fully static HTML files. These can be served as-is without any build tool.

## Notes

- `pathPrefix: "/gold/"` in `.eleventy.js` handles GitHub Pages subdirectory
- Relative paths with `./` work on localhost and production
- All CSS/JS are passthrough; no changes to existing styling logic
