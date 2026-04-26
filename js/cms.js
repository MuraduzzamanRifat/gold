// Gold Kings CMS — runtime content injector
// Fetches content/site.json from GitHub raw CDN and patches the DOM.
// Fallback: if fetch fails or field missing, hardcoded HTML stays intact.

(function () {
  const RAW_BASE = 'https://raw.githubusercontent.com/MuraduzzamanRifat/gold/main/content/site.json';
  const CACHE_KEY = 'gk_cms_v3';
  const CACHE_TTL = 30 * 1000; // 30s — admin saves visible within half a minute
  // ?cms=fresh in the URL bypasses both JS and CDN cache (force-refresh escape hatch)
  const FORCE_FRESH = /[?&]cms=fresh\b/.test(location.search);

  // Bucket-based CDN buster: stable for 30s, changes after — defeats Fastly cache
  // without making every page-load a unique URL.
  function rawUrl() {
    const bucket = Math.floor(Date.now() / CACHE_TTL);
    const buster = FORCE_FRESH ? Date.now() : bucket;
    return `${RAW_BASE}?_=${buster}`;
  }

  function readCache() {
    if (FORCE_FRESH) return null;
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

    // ── Locations ──────────────────────────────────────────────────────────
    // Premium-rebuild (price-cine, locx) uses just city name without state suffix.
    // Address uses innerHTML so the JSON can include <br> for multi-line cards.
    if (Array.isArray(c.locations)) {
      c.locations.forEach((loc, i) => {
        const pfx = 'loc.' + i + '.';
        setText(`[data-cms="${pfx}city"]`, loc.city);
        set(`[data-cms="${pfx}address"]`, loc.address);
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

    // ── Per-page content ─────────────────────────────────────────────────────
    if (c.pages && typeof c.pages === 'object') {
      Object.keys(c.pages).forEach(pageKey => {
        walkAndBind(c.pages[pageKey], `page.${pageKey}`);
      });
    }

    // ── Tracking codes (Meta Pixel, GTM, GA4, custom HEAD/BODY) ──────────────
    if (c.tracking) injectTracking(c.tracking);
  }

  /* ----------------------------------------------------------------------------
     TRACKING INJECTION
     Idempotent — guards against double-injection if cms.js runs twice.
     ---------------------------------------------------------------------------- */
  function injectTracking(t) {
    if (window.__gkTrackingInjected) return;
    window.__gkTrackingInjected = true;

    // ── Google Tag Manager (head + noscript body) ─────────────────────────────
    if (t.gtmId && /^GTM-[A-Z0-9]+$/i.test(t.gtmId)) {
      const id = t.gtmId.trim();
      // head
      const s = document.createElement('script');
      s.text = "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" + id + "');";
      document.head.appendChild(s);
      // body noscript fallback
      if (document.body) {
        const ns = document.createElement('noscript');
        const ifr = document.createElement('iframe');
        ifr.src = 'https://www.googletagmanager.com/ns.html?id=' + id;
        ifr.height = '0'; ifr.width = '0';
        ifr.style.display = 'none'; ifr.style.visibility = 'hidden';
        ns.appendChild(ifr);
        document.body.insertBefore(ns, document.body.firstChild);
      }
    }

    // ── Google Analytics 4 (gtag) ─────────────────────────────────────────────
    if (t.gaMeasurementId && /^G-[A-Z0-9]+$/i.test(t.gaMeasurementId)) {
      const id = t.gaMeasurementId.trim();
      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      document.head.appendChild(s1);
      const s2 = document.createElement('script');
      s2.text = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + id + "');";
      document.head.appendChild(s2);
    }

    // ── Meta (Facebook) Pixel ─────────────────────────────────────────────────
    if (t.metaPixelId && /^\d{10,20}$/.test(t.metaPixelId.trim())) {
      const id = t.metaPixelId.trim();
      const s = document.createElement('script');
      s.text = "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" + id + "');fbq('track','PageView');";
      document.head.appendChild(s);
      if (document.body) {
        const ns = document.createElement('noscript');
        const img = document.createElement('img');
        img.height = 1; img.width = 1; img.style.display = 'none';
        img.src = 'https://www.facebook.com/tr?id=' + id + '&ev=PageView&noscript=1';
        ns.appendChild(img);
        document.body.appendChild(ns);
      }
    }

    // ── Custom HEAD / BODY raw HTML ───────────────────────────────────────────
    if (t.customHead && typeof t.customHead === 'string' && t.customHead.trim()) {
      injectRawHTML(t.customHead, document.head);
    }
    if (t.customBody && typeof t.customBody === 'string' && t.customBody.trim()) {
      if (document.body) injectRawHTML(t.customBody, document.body);
    }
  }

  const RE_ALT = /\.alt$/i;
  const RE_IMAGE = /\bimage\b|\bbackground\b|\.image$|\.bg$/i;
  const RE_HTML = /title|headline|line\d|\bsub\b|body|kicker|list/i;

  function walkAndBind(obj, prefix) {
    if (obj == null) return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walkAndBind(item, `${prefix}.${i}`));
      return;
    }
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(k => walkAndBind(obj[k], `${prefix}.${k}`));
      return;
    }
    const val = obj;
    if (val === '' || val == null) return;

    // .alt paths bind to the sibling .image's <img> (alt has no own data-cms attr in HTML)
    if (RE_ALT.test(prefix)) {
      const imgPath = prefix.replace(RE_ALT, '.image');
      document.querySelectorAll(`[data-cms="${imgPath}"]`).forEach(el => {
        if (el.tagName === 'IMG') el.alt = val;
      });
      return;
    }

    document.querySelectorAll(`[data-cms="${prefix}"]`).forEach(el => {
      if (el.tagName === 'META') { el.setAttribute('content', val); return; }
      if (RE_IMAGE.test(prefix)) {
        if (el.tagName === 'IMG') el.src = val;
        else if (el.tagName === 'LINK') el.href = val;
        return;
      }
      if (RE_HTML.test(prefix)) { el.innerHTML = val; return; }
      el.textContent = val;
    });
  }

  // Parses raw HTML string into nodes and re-creates <script> tags so they execute.
  // (innerHTML-injected scripts don't run; we have to clone them via createElement.)
  function injectRawHTML(html, target) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    Array.from(tpl.content.childNodes).forEach(node => {
      if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
        const s = document.createElement('script');
        for (const attr of node.attributes) s.setAttribute(attr.name, attr.value);
        s.text = node.textContent;
        target.appendChild(s);
      } else {
        target.appendChild(node.cloneNode(true));
      }
    });
  }

  // Expose content globally so main.js can use it (e.g. for testimonials)
  window.__cmsContent = null;

  const cached = readCache();
  if (cached) {
    window.__cmsContent = cached;
    applyContent(cached);
  } else {
    fetch(rawUrl())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(c => {
        window.__cmsContent = c;
        writeCache(c);
        applyContent(c);
      })
      .catch(() => { /* silent — hardcoded HTML stays */ });
  }
})();
