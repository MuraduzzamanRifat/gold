/* Location Page - self-contained (no main.js import) */

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

  let rafId = null;
  function tick() {
    if (document.hidden) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    dx += (tx - dx) * 0.35;
    dy += (ty - dy) * 0.35;
    rx += (tx - rx) * 0.15;
    ry += (ty - ry) * 0.15;

    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    const lab = cursor.querySelector('.cursor__label');

    if (dot) dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    if (lab) lab.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;

    rafId = requestAnimationFrame(tick);
  }
  tick();
}

initCursor();

/* Smooth scroll enhancement */
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = time => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
}

/* Simple reveal animations */
function observeElements() {
  if (!('IntersectionObserver' in window)) return;

  const revealElements = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', observeElements)
  : observeElements();
