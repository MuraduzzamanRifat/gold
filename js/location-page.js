import { initCursor } from './main.js';

/* Initialize cursor for location pages */
initCursor();

/* Smooth scroll enhancement */
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });

  lenis.on('scroll', () => {
    /* Update animations on scroll */
  });

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    let lastTime = 0;
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
