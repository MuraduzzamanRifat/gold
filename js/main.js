// webgl.js statically imports 'three' (a bare specifier) which only resolves via
// the importmap on index.html. Dynamic-import it so this file has no bare
// specifiers and can run on every page (including the legal/content pages that
// have no WebGL and no importmap). Three.js parse cost is also skipped on
// pages that don't need it.
import { heroImage, testimonials, showcaseSlides } from './data.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================================
   CUSTOM CURSOR
   ============================================================================ */

function initCursor() {
  const cursor = document.querySelector('.cursor');
  if (!cursor || window.matchMedia('(max-width: 900px)').matches) {
    if (cursor) cursor.style.display = 'none';
    return;
  }

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let rx = tx, ry = ty;
  let dx = tx, dy = ty;

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const lab = cursor.querySelector('.cursor__label');

  window.addEventListener('pointermove', e => {
    tx = e.clientX;
    ty = e.clientY;
  });

  window.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  window.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));

  function tick() {
    dx += (tx - dx) * 0.35;
    dy += (ty - dy) * 0.35;
    rx += (tx - rx) * 0.15;
    ry += (ty - ry) * 0.15;

    dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    lab.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;

    requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor]');
    cursor.classList.remove('is-link', 'is-view');
    lab.textContent = '';
    if (!t) return;
    const mode = t.getAttribute('data-cursor');
    if (mode === 'link') cursor.classList.add('is-link');
    if (mode === 'view') {
      cursor.classList.add('is-view');
      lab.textContent = 'View';
    }
  });
}

/* ============================================================================
   SMOOTH SCROLL (LENIS)
   ============================================================================ */

function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return null;
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* ============================================================================
   HERO REVEAL
   ============================================================================ */

// Wrap each visible character in a <span class="char"> so we can stagger them.
// Preserves <em> tags by leaving any HTML tag content untouched.
function splitHeroChars() {
  document.querySelectorAll('.hero__title .line').forEach(line => {
    if (line.dataset.split === 'done') return;
    const html = line.innerHTML;
    // Tokenize: capture HTML tags OR single chars (incl. spaces)
    const out = html.replace(/(<\/?[a-zA-Z][^>]*>)|(\s)|(.)/g, (_, tag, space, ch) => {
      if (tag) return tag;
      if (space) return '<span class="char">&nbsp;</span>';
      return `<span class="char">${ch}</span>`;
    });
    line.innerHTML = out;
    line.dataset.split = 'done';
  });
}

function revealHero() {
  if (REDUCED_MOTION) return;
  splitHeroChars();
  const chars = document.querySelectorAll('.hero__title .char');
  gsap.from(chars, {
    yPercent: 110,
    opacity: 0,
    duration: 0.9,
    ease: 'power4.out',
    stagger: 0.022,
    delay: 0.25
  });

  gsap.from('.hero__eyebrow, .hero__foot', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 0.6
  });
}

// Magnetic pull on CTAs — button center drifts toward cursor when nearby
function initMagneticCTAs() {
  if (REDUCED_MOTION) return;
  const radius = 110;
  const pull = 0.35;
  document.querySelectorAll('.hero__cta').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        gsap.to(btn, { x: dx * pull, y: dy * pull, duration: 0.35, ease: 'power3.out' });
      }
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// Preloader is shown once per session (sessionStorage gate). On subsequent
// page navigations within the same tab it's removed immediately so the user
// isn't trapped behind it on every page change.
const PRELOADER_SEEN_KEY = 'gk_preloader_seen';

function initPreloader() {
  const pre = document.getElementById('preloader');
  if (!pre) return { skip: true };

  const removeNow = () => pre.remove();
  const slideOut = () => {
    pre.classList.add('is-out');
    setTimeout(removeNow, 1100);
  };

  // Returning visitor in this session: skip animation
  if (sessionStorage.getItem(PRELOADER_SEEN_KEY) === '1') {
    removeNow();
    return { skip: true };
  }

  // First visit: keep preloader for at least PRELOADER_MIN_MS so the
  // stroke-draw + bar-fill CSS animation reads fully.
  const PRELOADER_MIN_MS = 3200;
  const startedAt = performance.now();
  let dismissed = false;
  const dismissWhenReady = () => {
    if (dismissed) return;
    dismissed = true;
    const remaining = Math.max(0, PRELOADER_MIN_MS - (performance.now() - startedAt));
    setTimeout(() => {
      slideOut();
      sessionStorage.setItem(PRELOADER_SEEN_KEY, '1');
    }, remaining);
  };

  // Failsafe: always dismiss after min duration so a stuck load never traps the page.
  setTimeout(dismissWhenReady, PRELOADER_MIN_MS);
  return { skip: false, dismissWhenReady };
}

function initCoinCenterpiece(preloader) {
  if (REDUCED_MOTION || window.matchMedia('(max-width: 900px)').matches) return;
  const coinCanvas = document.getElementById('coin-canvas');
  if (!coinCanvas) return;

  import('./coin3d.js')
    .then(m => m.initCoin3D({
      canvas: coinCanvas,
      onReady: preloader?.dismissWhenReady
    }))
    .catch(err => {
      console.warn('Coin3D init failed', err);
      coinCanvas.style.display = 'none';
    });
}

/* ============================================================================
   GALLERY
   ============================================================================ */

async function buildGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  // Resolve testimonials from CMS first (admin-controlled), fall back to
  // hardcoded data.js if CMS is slow/unreachable. 800ms guard.
  const cmsTestimonials = await Promise.race([
    (window.__cmsReady || Promise.resolve(null)).then(c => Array.isArray(c?.testimonials) ? c.testimonials : null),
    new Promise(r => setTimeout(() => r(null), 800))
  ]);
  const items = cmsTestimonials || testimonials;

  function renderCards(arr) {
    grid.innerHTML = '';
    arr.forEach(item => {
      const el = document.createElement('article');
      el.className = 'gcard testimonial-card';
      el.setAttribute('data-category', item.category);
      el.setAttribute('role', 'listitem');
      el.setAttribute('tabindex', '0');
      el.innerHTML = `
        <div class="testimonial__content">
          <blockquote class="testimonial__quote">"${item.quote}"</blockquote>
          <footer class="testimonial__footer">
            <cite class="testimonial__name">${item.name}</cite>
            <span class="testimonial__tag" aria-label="Category: ${item.category}">${item.category}</span>
          </footer>
        </div>
      `;
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
      grid.appendChild(el);
    });
  }

  renderCards(items);

  // Late-arriving CMS data (post-render) replaces the cards in place.
  document.addEventListener('cms:ready', e => {
    const arr = Array.isArray(e.detail?.testimonials) ? e.detail.testimonials : null;
    if (arr) renderCards(arr);
  });

  if (!REDUCED_MOTION) {
    gsap.from('.testimonial-card', {
      y: 70,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.07,
      scrollTrigger: {
        trigger: '.gallery__grid',
        start: 'top 80%'
      }
    });
  }
}

/* ============================================================================
   SHOWCASE / SCROLL-PINNED
   ============================================================================ */

async function buildShowcase() {
  const canvas = document.getElementById('showcase-canvas');
  const scrollEl = document.getElementById('showcase-scroll');
  if (!canvas || !scrollEl) return;
  // Reduced-motion: skip the WebGL scroll-pinned showcase entirely
  if (REDUCED_MOTION) {
    canvas.style.display = 'none';
    return;
  }

  const { initShowcase } = await import('./webgl.js');
  const sc = await initShowcase({ canvas, slides: showcaseSlides });
  if (!sc) return;

  const dots = document.querySelectorAll('.sdot');
  const scrollDistance = (showcaseSlides.length - 1) * window.innerHeight;
  scrollEl.style.height = `${scrollDistance + window.innerHeight}px`;

  ScrollTrigger.create({
    trigger: '.showcase__sticky',
    start: 'top top',
    end: `+=${scrollDistance}`,
    pin: true,
    pinSpacing: false,
    scrub: 0.6,
    onUpdate(self) {
      const info = sc.setFromProgress(self.progress);
      document.getElementById('sc-k').textContent = showcaseSlides[info.idx].k;
      document.getElementById('sc-v').textContent = showcaseSlides[info.idx].v;
      dots.forEach((d, i) => d.classList.toggle('active', i === info.idx));
    }
  });
}

/* ============================================================================
   EDITORIAL REVEALS
   ============================================================================ */

function editorialReveals() {
  if (REDUCED_MOTION) return;
  // Single batched ScrollTrigger for all [data-reveal] elements (was 1-per-element)
  gsap.set('[data-reveal]', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, {
      y: 0,
      opacity: 1,
      duration: 1.0,
      ease: 'power3.out',
      stagger: 0.05
    })
  });

  gsap.from('.gallery__title, .about__title', {
    y: 30,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.gallery__title',
      start: 'top 85%'
    }
  });

  // Editorial mark drift in (page-hero variant or hero variant)
  const marks = document.querySelectorAll('.page-hero__mark, .hero__mark');
  marks.forEach(mark => {
    gsap.from(mark, {
      x: -80,
      opacity: 0,
      duration: 1.6,
      ease: 'expo.out',
      delay: 0.2
    });
  });
}

/* Scroll-driven parallax — elements with [data-parallax="N"] translate at N×scroll.
   Caches absolute element centers on init/resize; per-scroll math is pure arithmetic
   (no getBoundingClientRect → no forced sync layout) and RAF-coalesced. */
function initParallax() {
  if (REDUCED_MOTION) return;
  const els = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!els.length) return;

  let entries = [];
  const measure = () => {
    entries = els.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        factor: parseFloat(el.dataset.parallax) || 0.1,
        center: rect.top + window.scrollY + rect.height / 2,
        height: rect.height
      };
    });
  };

  let queued = false;
  const update = () => {
    queued = false;
    const center = window.scrollY + window.innerHeight / 2;
    const cull = window.innerHeight + 300;
    entries.forEach(({ el, factor, center: c, height }) => {
      const fromCenter = c - center;
      if (Math.abs(fromCenter) > cull + height / 2) return;
      el.style.transform = `translate3d(0, ${-fromCenter * factor}px, 0)`;
    });
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); update(); });
  measure();
  update();
}

/* 3D tilt cards — caches rect on enter, invalidates on scroll/resize. */
function initTiltCards() {
  if (REDUCED_MOTION) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const MAX_DEG = 8;
    let rect = null;
    let raf = null;

    const onEnter = () => { rect = card.getBoundingClientRect(); };
    const onMove = e => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top)  / rect.height;
      const rx = (0.5 - py) * MAX_DEG;
      const ry = (px - 0.5) * MAX_DEG;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      rect = null;
      card.style.transform = '';
    };
    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
  });
}

/* Hamburger menu toggle — only fires on mobile (button hidden on desktop via CSS) */
function initNavToggle() {
  const btn = document.getElementById('nav-toggle');
  const nav = document.querySelector('.nav');
  if (!btn || !nav) return;

  const setOpen = open => {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  };

  btn.addEventListener('click', () => {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });
  // Close on link click + on Escape
  nav.querySelectorAll('.nav__links a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
  });
}

/* Nav scroll behavior — adds .scrolled class for backdrop blur */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================================
   ABOUT PARALLAX
   ============================================================================ */

function aboutParallax() {
  if (REDUCED_MOTION || window.matchMedia('(max-width: 900px)').matches) return;
  gsap.to('.about__visual img', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: '.about__visual',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* ============================================================================
   BOOT
   ============================================================================ */

async function boot() {
  const preloader = initPreloader();
  initCursor();
  initSmoothScroll();
  initNavScroll();
  initNavToggle();
  initParallax();
  initTiltCards();
  initMagneticCTAs();
  // Coin centerpiece + rolling coins removed from homepage hero per user request
  // initCoinCenterpiece(preloader);

  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    // Resolve hero image URL: CMS first (admin-controlled), then hardcoded
    // fallback. 800ms guard means we don't block the hero render if the
    // CMS fetch is slow — falls back to data.js heroImage.
    const cmsImageUrl = Promise.race([
      (window.__cmsReady || Promise.resolve(null)).then(c => c?.hero?.backgroundImage || null),
      new Promise(r => setTimeout(() => r(null), 800))
    ]);
    cmsImageUrl.then(url => {
      const finalUrl = url || heroImage;
      // Reduced-motion users get a static cover image instead of the animated WebGL hero
      if (REDUCED_MOTION || window.matchMedia('(max-width: 900px)').matches) {
        const stage = document.querySelector('.hero__stage');
        if (stage) stage.style.cssText = `background:url('${finalUrl}') center/cover no-repeat;min-height:100vh;`;
        heroCanvas.remove();
      } else {
        import('./webgl.js')
          .then(({ initHero }) => initHero({ canvas: heroCanvas, imageUrl: finalUrl }))
          .catch(() => {
            heroCanvas.style.cssText = `background:url('${finalUrl}') center/cover;`;
          });
      }
    });
  }
  // Reveal hero on any page that has one (including image-based hero on location pages)
  if (document.querySelector('.hero__title .line')) revealHero();

  requestAnimationFrame(async () => {
    try {
      await buildGallery();
      await buildShowcase();
      editorialReveals();
      aboutParallax();
      initKeyboardNavigation();
      ScrollTrigger.refresh();
    } catch (err) {
      console.error('Boot error:', err);
    }
  });
}

/* ============================================================================
   KEYBOARD NAVIGATION (Accessibility)
   ============================================================================ */

function initKeyboardNavigation() {
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.closest('.gcard, .location-call')) {
      e.preventDefault();
      document.activeElement?.click?.();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('[role="dialog"]').forEach(el => { el.hidden = true; });
    }
  });
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
