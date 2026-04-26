import { initHero, initCard, initShowcase } from './webgl.js';
import { createNeuralField } from './neural.js';
import { heroImage, aboutImage, testimonials, locations, services, showcaseSlides } from './data.js';

gsap.registerPlugin(ScrollTrigger);

// Honor user's motion preference — drives WebGL gating and animation skipping
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
   PRELOADER
   ============================================================================ */

function runPreloader() {
  return new Promise(resolve => {
    const preloaderEl = document.getElementById('preloader');
    const canvasEl = document.getElementById('pre-canvas');
    const counterEl = document.getElementById('pc');
    const barEl = document.getElementById('pre-bar-fill');

    if (!preloaderEl) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      preloaderEl.style.display = 'none';
      resolve();
    };

    const failsafe = setTimeout(() => {
      console.warn('Preloader failsafe triggered');
      finish();
    }, 2500);

    let neural;
    try {
      neural = createNeuralField({
        canvas: canvasEl,
        nodeCount: 60,
        linkThreshold: 2.0,
        palette: { point: 0xC8A45A, line: 0xE2C06B }
      });
    } catch (e) {
      neural = { state: {}, destroy: () => {} };
    }

    const counter = { val: 0 };
    gsap.to(counter, {
      val: 100,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate() {
        const n = Math.floor(counter.val);
        if (counterEl) counterEl.textContent = String(n).padStart(2, '0');
        if (barEl) barEl.style.width = n + '%';
      },
      onComplete() {
        if (neural.state) neural.state.opacity = 0;
        gsap.to(preloaderEl, {
          yPercent: -100,
          duration: 0.6,
          ease: 'expo.inOut',
          onComplete() {
            clearTimeout(failsafe);
            if (neural.destroy) neural.destroy();
            finish();
          }
        });
      }
    });
  });
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

// Lazy-load the 3D coin — only on desktop with motion enabled
// Preloader has a guaranteed 3.2s minimum display so the stroke-draw +
// bar fill animation reads fully, regardless of how fast the WebGL loads.
function initCoinCenterpiece() {
  const PRELOADER_MIN_MS = 3200;
  const startedAt = performance.now();
  let coinReady = false;

  const dismiss = () => {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    pre.classList.add('is-out');
    setTimeout(() => pre.remove(), 1100);
  };

  // Schedule dismissal: wait until BOTH (a) min display elapsed AND (b) coin ready
  const tryDismiss = () => {
    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, PRELOADER_MIN_MS - elapsed);
    if (coinReady || wait > 0) {
      setTimeout(dismiss, wait);
    } else {
      dismiss();
    }
  };

  // Always dismiss after min duration even if coin fails — keeps the page from
  // ever getting stuck behind a stuck preloader
  setTimeout(() => { coinReady = true; tryDismiss(); }, PRELOADER_MIN_MS);

  if (REDUCED_MOTION || window.matchMedia('(max-width: 900px)').matches) {
    return;
  }
  const coinCanvas = document.getElementById('coin-canvas');
  if (!coinCanvas) return;

  import('./coin3d.js')
    .then(m => m.initCoin3D({
      canvas: coinCanvas,
      onReady: () => { coinReady = true; tryDismiss(); }
    }))
    .catch(err => {
      console.warn('Coin3D init failed', err);
      coinCanvas.style.display = 'none';
    });
}

/* ============================================================================
   GALLERY
   ============================================================================ */

function initFilters() {
  // Filters not needed for testimonials
}

async function buildGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  testimonials.forEach((item, i) => {
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
    grid.appendChild(el);
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

// Lightbox not needed for testimonials

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
  // Per-element reveal so each one triggers when it enters its own viewport zone
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true
      }
    });
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

/* Scroll-driven parallax — elements with [data-parallax="N"] translate at N×scroll */
function initParallax() {
  if (REDUCED_MOTION) return;
  const els = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!els.length) return;

  const cache = els.map(el => ({
    el,
    factor: parseFloat(el.dataset.parallax) || 0.1,
    base: 0
  }));

  const update = () => {
    const sy = window.scrollY;
    const vh = window.innerHeight;
    cache.forEach(({ el, factor }) => {
      const rect = el.getBoundingClientRect();
      // only animate while in/near viewport
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const fromCenter = (rect.top + rect.height / 2) - vh / 2;
      el.style.transform = `translate3d(0, ${-fromCenter * factor}px, 0)`;
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* 3D tilt cards — pointermove rotates element on perspective parent */
function initTiltCards() {
  if (REDUCED_MOTION) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const max = 8; // max degrees
    let raf = null;

    const onMove = e => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0..1
      const py = (e.clientY - rect.top)  / rect.height;
      const rx = (0.5 - py) * max;   // tilt up when mouse low
      const ry = (px - 0.5) * max;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
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
  initCursor();
  initSmoothScroll();
  initNavScroll();
  initParallax();
  initTiltCards();
  initMagneticCTAs();
  initCoinCenterpiece();

  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    // Reduced-motion users get a static cover image instead of the animated WebGL hero
    if (REDUCED_MOTION || window.matchMedia('(max-width: 900px)').matches) {
      const stage = document.querySelector('.hero__stage');
      if (stage) stage.style.cssText = `background:url('${heroImage}') center/cover no-repeat;min-height:100vh;`;
      heroCanvas.remove();
    } else {
      initHero({ canvas: heroCanvas, imageUrl: heroImage }).catch(() => {
        heroCanvas.style.cssText = `background:url('${heroImage}') center/cover;`;
      });
    }
  }
  // Reveal hero on any page that has one (including image-based hero on location pages)
  if (document.querySelector('.hero__title .line')) revealHero();

  requestAnimationFrame(async () => {
    try {
      initFilters();
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
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.closest('.gcard, .filter, .location-call')) {
      e.preventDefault();
      document.activeElement?.click?.();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('[role="dialog"]').forEach(el => { el.hidden = true; });
    }
  });
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
