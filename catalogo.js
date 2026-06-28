/**
 * NexusKey — Catálogo JavaScript
 * Tabs activos · Sticky nav · Smooth scroll · Glow effect · Partículas · Cursor
 */

/* ─────────────────────────────────────────
   TABS — Activo según sección visible
───────────────────────────────────────── */
const sections = document.querySelectorAll('.cat-section');
const tabs     = document.querySelectorAll('.cat-tab');
const quickNav = document.querySelector('.cat-quick-nav');

// IntersectionObserver para resaltar la tab de la sección visible
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === id);
      });
    }
  });
}, {
  threshold: 0.3,
  rootMargin: '-80px 0px -40% 0px'
});

sections.forEach(s => sectionObserver.observe(s));

/* ─────────────────────────────────────────
   STICKY NAV — Se pega al hacer scroll
───────────────────────────────────────── */
const navTriggerY = quickNav ? quickNav.getBoundingClientRect().top + window.scrollY + 20 : 400;

function updateStickyNav() {
  if (!quickNav) return;
  const shouldStick = window.scrollY > navTriggerY;
  quickNav.classList.toggle('sticky', shouldStick);
}

window.addEventListener('scroll', updateStickyNav, { passive: true });

/* ─────────────────────────────────────────
   SMOOTH SCROLL en tabs
───────────────────────────────────────── */
tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    const href = tab.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        // Offset para la navbar + la barra sticky
        const offset = 140;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

// Mismo smooth scroll para los .cat-nav-link del navbar
document.querySelectorAll('.cat-nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 140;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        // Cierra el menú hamburguesa si está abierto
        document.getElementById('navLinks')?.classList.remove('open');
      }
    }
  });
});

/* ─────────────────────────────────────────
   GLOW EFFECT — Mouse tracking en cards
───────────────────────────────────────── */
function initCatalogGlow() {
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x    = ((e.clientX - rect.left) / rect.width)  * 100;
      const y    = ((e.clientY - rect.top)  / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });
}

/* ─────────────────────────────────────────
   REVEAL ANIMATIONS (scroll-triggered)
───────────────────────────────────────── */
function initReveal() {
  const targets = document.querySelectorAll('.product-card, .cat-section-header');
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    const siblings = Array.from(el.parentElement.children);
    el.style.transitionDelay = `${siblings.indexOf(el) * 0.06}s`;
  });

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => revealObs.observe(el));
}

/* ─────────────────────────────────────────
   PARTICLES (heredado)
───────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (canvas && typeof ParticleSystem !== 'undefined') {
    new ParticleSystem(canvas);
  }
}

/* ─────────────────────────────────────────
   CURSOR (heredado)
───────────────────────────────────────── */
function initCursor() {
  if (typeof CustomCursor !== 'undefined') {
    new CustomCursor();
  }
}

/* ─────────────────────────────────────────
   NAVBAR SCROLL EFFECT (heredado)
───────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const update = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─────────────────────────────────────────
   HAMBURGER MENU (heredado)
───────────────────────────────────────── */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans  = hamburger.querySelectorAll('span');
    const isOpen = navLinks.classList.contains('open');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCursor();
  initReveal();
  initCatalogGlow();
  initNavbar();
  initHamburger();

  console.log(
    '%cNexusKey Catálogo%c loaded',
    'font-size:16px; font-weight:800; color:#7c3aed;',
    'color:#94a3b8;'
  );
});
