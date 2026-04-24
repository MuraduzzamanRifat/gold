import { initHero, initCard, initShowcase } from './webgl.js';
import { createNeuralField } from './neural.js';
import { heroImage, aboutImage, testimonials, locations, services, showcaseSlides } from './data.js';

gsap.registerPlugin(ScrollTrigger);

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

    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    const lab = cursor.querySelector('.cursor__label');

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

    const neural = createNeuralField({
      canvas: canvasEl,
      nodeCount: 60,
      linkThreshold: 2.0,
      palette: { point: 0xC8A45A, line: 0xE2C06B }
    });

    const counter = { val: 0 };
    gsap.to(counter, {
      val: 100,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate() {
        const n = Math.floor(counter.val);
        counterEl.textContent = String(n).padStart(2, '0');
        barEl.style.width = n + '%';
      },
      onComplete() {
        neural.state.opacity = 0;
        gsap.to(preloaderEl, {
          yPercent: -100,
          duration: 0.6,
          ease: 'expo.inOut',
          onComplete() {
            preloaderEl.style.display = 'none';
            neural.destroy();
            resolve();
          }
        });
      }
    });
  });
}

/* ============================================================================
   HERO REVEAL
   ============================================================================ */

function revealHero() {
  const lines = document.querySelectorAll('.hero__title .line');
  gsap.from(lines, {
    y: 60,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    stagger: 0.08,
    delay: 0.2
  });

  gsap.from('.hero__eyebrow, .hero__foot', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 0.5
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

// Lightbox not needed for testimonials

/* ============================================================================
   SHOWCASE / SCROLL-PINNED
   ============================================================================ */

async function buildShowcase() {
  const canvas = document.getElementById('showcase-canvas');
  const scrollEl = document.getElementById('showcase-scroll');
  if (!canvas || !scrollEl) return;

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
  gsap.from('[data-reveal]', {
    y: 40,
    opacity: 0,
    duration: 1.0,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '[data-reveal]',
      start: 'top 85%'
    }
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
}

/* ============================================================================
   ABOUT PARALLAX
   ============================================================================ */

function aboutParallax() {
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
  await runPreloader();

  const heroCanvas = document.getElementById('hero-canvas');
  initHero({ canvas: heroCanvas, imageUrl: heroImage }).catch(() => {
    heroCanvas.style.cssText = `background:url('${heroImage}') center/cover;`;
  });

  revealHero();

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
  // Allow Enter/Space to activate buttons
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.closest('.gcard, .filter, .location-call')) {
      e.preventDefault();
      document.activeElement?.click?.();
    }
  });

  // Escape to close modals (future enhancement)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[hidden], [role="dialog"]').forEach(el => {
        el.hidden = true;
      });
    }
  });
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
