// Mobile menu toggle with proper ARIA
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openNav = () => {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    // Focus first link for accessibility
    const firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeNav() : openNav();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && e.target !== toggle) {
      closeNav();
    }
  });

  // Ensure nav visible if resized to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 861) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});