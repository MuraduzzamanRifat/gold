// Gold Kings CMS — runtime content injector
// Fetches content/site.json from GitHub raw CDN and patches the DOM.
// Fallback: if fetch fails or field missing, hardcoded HTML stays intact.
// Caches in sessionStorage for 5 minutes to avoid redundant fetches.

(function () {
  const RAW = 'https://raw.githubusercontent.com/MuraduzzamanRifat/gold/main/content/site.json';
  const CACHE_KEY = 'gk_cms_v1';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch (_) {}
    return null;
  }

  function writeCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
  }

  function set(selector, value, attr) {
    if (!value) return;
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
      if (attr) { el.setAttribute(attr, value); }
      else { el.innerHTML = value; }
    });
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => el.textContent = value);
  }

  function applyContent(c) {
    // ── Topbar ──────────────────────────────────────────────────────────────
    if (c.topbar) {
      setText('[data-cms="topbar.message"]', c.topbar.message);
      document.querySelectorAll('[data-cms="topbar.phoneSnellville"]').forEach(el => {
        el.textContent = 'Snellville: ' + c.topbar.phoneSnellville;
        if (el.tagName === 'A') el.href = 'tel:+1' + c.topbar.phoneSnellville.replace(/\D/g,'');
      });
      document.querySelectorAll('[data-cms="topbar.phoneCommerce"]').forEach(el => {
        el.textContent = 'Commerce: ' + c.topbar.phoneCommerce;
        if (el.tagName === 'A') el.href = 'tel:+1' + c.topbar.phoneCommerce.replace(/\D/g,'');
      });
    }

    // ── Hero ────────────────────────────────────────────────────────────────
    if (c.hero) {
      setText('[data-cms="hero.eyebrow"]', c.hero.eyebrow);
      set('[data-cms="hero.headline1"]', c.hero.headline1);
      set('[data-cms="hero.headline2"]', c.hero.headline2);
      setText('[data-cms="hero.ctaText"]', c.hero.ctaText);
      if (c.hero.backgroundImage) {
        // webgl hero reads heroImage from data.js — patch window global so
        // initHero() uses the CMS image if called after this runs.
        window.__cmsHeroImage = c.hero.backgroundImage;
      }
    }

    // ── CTA section ─────────────────────────────────────────────────────────
    if (c.cta) {
      set('[data-cms="cta.eyebrow"]', c.cta.eyebrow);
      set('[data-cms="cta.title"]', c.cta.title);
      setText('[data-cms="cta.subtitle"]', c.cta.subtitle);
    }

    // ── Locations list in CTA section ───────────────────────────────────────
    if (Array.isArray(c.locations)) {
      c.locations.forEach((loc, i) => {
        const pfx = 'loc.' + i + '.';
        setText(`[data-cms="${pfx}city"]`, loc.city + ', ' + loc.state);
        setText(`[data-cms="${pfx}address"]`, loc.address);
        setText(`[data-cms="${pfx}hours"]`, loc.hours);
        document.querySelectorAll(`[data-cms="${pfx}phone"]`).forEach(el => {
          el.textContent = loc.phone;
          if (el.tagName === 'A') el.href = 'tel:' + loc.phoneRaw;
        });
        document.querySelectorAll(`[data-cms="${pfx}callBtn"]`).forEach(el => {
          if (el.tagName === 'A') el.href = 'tel:' + loc.phoneRaw;
          el.textContent = 'Call ' + loc.phone;
        });
      });
    }

    // ── Testimonials ─────────────────────────────────────────────────────────
    if (Array.isArray(c.testimonials) && window.__cmsTestimonialsCallback) {
      window.__cmsTestimonialsCallback(c.testimonials);
    }

    // ── Locations section ────────────────────────────────────────────────────
    if (c.locationsSection) {
      const ls = c.locationsSection;
      set('[data-cms="ls.eyebrow"]', ls.eyebrow);
      set('[data-cms="ls.title"]', ls.title);
      setText('[data-cms="ls.body"]', ls.body);
      if (ls.image) {
        document.querySelectorAll('[data-cms="ls.image"]').forEach(el => {
          el.src = ls.image;
          if (ls.imageCaption) el.alt = ls.imageCaption;
        });
      }
      setText('[data-cms="ls.imageCaption"]', ls.imageCaption);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    if (c.footer) {
      setText('[data-cms="footer.desc"]', c.footer.desc);
      document.querySelectorAll('[data-cms="footer.email"]').forEach(el => {
        el.textContent = c.footer.email;
        if (el.tagName === 'A') el.href = 'mailto:' + c.footer.email;
      });
      setText('[data-cms="footer.copyright"]', c.footer.copyright);
    }
  }

  // Expose content globally so main.js can use it (e.g. for testimonials)
  window.__cmsContent = null;

  const cached = readCache();
  if (cached) {
    window.__cmsContent = cached;
    applyContent(cached);
  } else {
    fetch(RAW)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(c => {
        window.__cmsContent = c;
        writeCache(c);
        applyContent(c);
      })
      .catch(() => { /* silent — hardcoded HTML stays */ });
  }
})();
