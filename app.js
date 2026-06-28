/**
 * NexusKey — App JavaScript
 * Smooth scroll · Cart · Particles · Cursor · Animations
 */

/* ========================================
   SMOOTH SCROLL WITH INERTIA (Lenis-style)
   ======================================== */
class SmoothScroller {
  constructor() {
    this.current = 0;
    this.target = 0;
    this.ease = 0.1;
    this.raf = null;
    this.isRunning = false;

    // Only enable on desktop where it feels natural
    if (window.innerWidth > 768 && !('ontouchstart' in window)) {
      this.init();
    }
  }

  init() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const wrapper = document.createElement('div');
    wrapper.id = 'smooth-wrapper';
    wrapper.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0;
      will-change: transform;
      z-index: 0;
    `;

    while (document.body.firstChild) {
      wrapper.appendChild(document.body.firstChild);
    }
    document.body.appendChild(wrapper);
    this.wrapper = wrapper;

    document.body.style.height = wrapper.scrollHeight + 'px';

    window.addEventListener('scroll', () => {
      this.target = window.scrollY;
    }, { passive: true });

    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.target += e.deltaY * 0.8;
      this.target = Math.max(0, Math.min(this.target, this.getMaxScroll()));
      window.scrollTo(0, this.target);
    }, { passive: false });

    this.start();

    // Update body height on resize
    const resizeObs = new ResizeObserver(() => {
      document.body.style.height = wrapper.scrollHeight + 'px';
    });
    resizeObs.observe(wrapper);
  }

  getMaxScroll() {
    return this.wrapper ? this.wrapper.scrollHeight - window.innerHeight : 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.run();
  }

  run() {
    this.current += (this.target - this.current) * this.ease;

    if (Math.abs(this.target - this.current) < 0.1) {
      this.current = this.target;
    }

    if (this.wrapper) {
      this.wrapper.style.transform = `translateY(${-this.current}px)`;
    }

    this.raf = requestAnimationFrame(() => this.run());
  }
}

/* ========================================
   PARTICLE SYSTEM
   ======================================== */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const count = Math.min(80, Math.floor(window.innerWidth / 20));
    this.particles = [];

    const colors = [
      'rgba(124, 58, 237, VAL)',
      'rgba(6, 182, 212, VAL)',
      'rgba(37, 99, 235, VAL)',
      'rgba(16, 185, 129, VAL)',
    ];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        color: color,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, i) => {
      // Update pulse
      p.pulse += p.pulseSpeed;
      const pOpacity = p.opacity + Math.sin(p.pulse) * 0.1;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Mouse interaction — gentle attraction
      const dx = this.mouseX - p.x;
      const dy = this.mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150 * 0.0008;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      // Damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Wrap
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Draw particle
      const colorStr = p.color.replace('VAL', Math.max(0, Math.min(1, pOpacity)));
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = colorStr;
      this.ctx.fill();

      // Draw connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dx2 = p.x - other.x;
        const dy2 = p.y - other.y;
        const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (d < 100) {
          const lineOpacity = (1 - d / 100) * 0.12;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(124, 58, 237, ${lineOpacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}

/* ========================================
   CUSTOM CURSOR
   ======================================== */
class CustomCursor {
  constructor() {
    this.cursor = document.getElementById('cursor');
    this.follower = document.getElementById('cursorFollower');
    this.mouseX = 0;
    this.mouseY = 0;
    this.followerX = 0;
    this.followerY = 0;

    if (!this.cursor || window.innerWidth <= 768) return;

    this.init();
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.cursor.style.left = e.clientX + 'px';
      this.cursor.style.top = e.clientY + 'px';
    });

    const hoverTargets = document.querySelectorAll(
      'a, button, .bento-cat, .product-card, .faq-item, .filter-btn, .testimonial-card'
    );

    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('cursor-hover');
        this.follower.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('cursor-hover');
        this.follower.classList.remove('cursor-hover');
      });
    });

    this.animateFollower();
  }

  animateFollower() {
    this.followerX += (this.mouseX - this.followerX) * 0.12;
    this.followerY += (this.mouseY - this.followerY) * 0.12;
    this.follower.style.left = this.followerX + 'px';
    this.follower.style.top = this.followerY + 'px';
    requestAnimationFrame(() => this.animateFollower());
  }
}

/* ========================================
   NAVBAR — scroll effect
   ======================================== */
const navbar = document.getElementById('navbar');

function updateNavbar() {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

/* ========================================
   HAMBURGER MENU
   ======================================== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');

  if (isOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close menu on link click
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity = '';
    });
  });
});

/* ========================================
   CART SYSTEM
   ======================================== */
let cart = [];

const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartBtn = document.getElementById('cartBtn');
const cartCountEl = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');

cartBtn.addEventListener('click', openCart);

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
  renderCart();
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

function addToCart(name, price, btn) {
  const existing = cart.find(item => item.name === name);

  if (existing) {
    showToast(`"${name}" ya está en tu carrito`);
    return;
  }

  cart.push({ name, price, qty: 1, id: Date.now() });

  updateCartCount();
  showToast(`${name} agregado al carrito`);

  // Button animation
  if (btn) {
    btn.classList.add('added');
    const original = btn.innerHTML;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Agregado`;

    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = original;
    }, 2000);
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = count;
  cartCountEl.classList.add('pop');
  setTimeout(() => cartCountEl.classList.remove('pop'), 300);
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <p>Tu carrito está vacío</p>
        <a href="#productos" onclick="closeCart()">Explorar productos</a>
      </div>
    `;
    cartTotalEl.textContent = '$0.00';
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotalEl.textContent = '$' + total.toFixed(2);

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>$${item.price.toFixed(2)}</span>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Eliminar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function checkout() {
  if (cart.length === 0) {
    showToast('Tu carrito está vacío', 'error');
    return;
  }

  // Guardamos el carrito en localStorage para que checkout.html lo lea
  try {
    localStorage.setItem('nexuskey_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('No se pudo guardar el carrito:', e);
  }

  // Redirigimos a la página de checkout
  showToast('Redirigiendo al checkout... 🛒', 'success');
  setTimeout(() => {
    window.location.href = 'checkout.html';
  }, 600);
}

function updateCart() {
  updateCartCount();
  renderCart();
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */
const toastContainer = document.getElementById('toastContainer');

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ========================================
   PRODUCT FILTER
   ======================================== */
function filterProducts(filter, btnEl) {
  // Update active button state
  document.querySelectorAll('.filter-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  if (btnEl) btnEl.classList.add('active');

  // Use direct style.display — 100% reliable, no CSS class race conditions
  var cards = document.querySelectorAll('#productsGrid .product-card');
  cards.forEach(function(card) {
    var cat = card.getAttribute('data-category');
    var match = (filter === 'all') || (cat === filter);
    card.style.display = match ? '' : 'none';
  });
}

function filterCategory(cat) {
  // Scroll to products
  document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });

  // Find and click the matching filter
  setTimeout(() => {
    const btn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
    if (btn) {
      filterProducts(cat, btn);
    }
  }, 600);
}

/* ========================================
   FAQ ACCORDION
   ======================================== */
function toggleFaq(el) {
  const isOpen = el.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(item => {
    if (item !== el) item.classList.remove('open');
  });

  // Toggle current
  el.classList.toggle('open', !isOpen);
}

/* ========================================
   COUNTER ANIMATION
   ======================================== */
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');

  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      counter.textContent = current >= 1000
        ? (current / 1000).toFixed(current >= 10000 ? 0 : 1) + 'k'
        : current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = target >= 1000
          ? (target / 1000).toFixed(target >= 10000 ? 0 : 1) + 'k'
          : target;
      }
    }

    requestAnimationFrame(update);
  });
}

/* ========================================
   SCROLL-TRIGGERED REVEAL ANIMATIONS
   ======================================== */
function initRevealAnimations() {
  const targets = document.querySelectorAll(
    '.bento-cat, .product-card, .bento-feat, .step-card, .testimonial-card, .faq-item, .section-header'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    // Stagger by index within parent
    const siblings = Array.from(el.parentElement.children);
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = `${idx * 0.07}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));

  // Hero stats counter — trigger when visible
  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        statsObserver.disconnect();
      }
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
  }
}

/* ========================================
   CARD GLOW BORDER EFFECT (mouse tracking)
   ======================================== */
function initGlowBorderEffect() {
  const cards = document.querySelectorAll('.product-card, .bento-feat, .bento-cat, .testimonial-card, .step-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });
}

/* ========================================
   INIT
   ======================================== */
document.addEventListener('DOMContentLoaded', function() {
  // Particles
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    new ParticleSystem(canvas);
  }

  // Custom cursor (desktop only)
  new CustomCursor();

  // Reveal animations
  initRevealAnimations();

  // Glow border effects
  initGlowBorderEffect();

  console.log(
    '%cNexusKey Store%c\n%cDesigned with passion for the perfect UX',
    'font-size:24px; font-weight:800; color:#7c3aed;',
    '',
    'font-size:13px; color:#94a3b8;'
  );
});

/* ========================================
   ACTIVE NAV LINK HIGHLIGHT
   ======================================== */
const sections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.5 });

sections.forEach(s => navObserver.observe(s));

/* ========================================
   QUICK VIEW MODAL
   ======================================== */
const qvOverlay  = document.getElementById('qvOverlay');
const qvModal    = document.getElementById('qvModal');
const qvClose    = document.getElementById('qvClose');
const qvBtnCart  = document.getElementById('qvBtnCart');

// Estado del producto actualmente en el modal
let _qvCurrent = null;

/**
 * Abre el modal e inyecta los datos del producto.
 * Usa optional chaining (?.) para ser robusto ante diferencias de HTML.
 * @param {HTMLElement} card — la tarjeta de producto clickeada
 */
function openQuickView(card) {
  if (!qvOverlay) return;  // modal no existe en esta página
  const d = card.dataset;

  // Inyectar datos básicos
  const imgEl = document.getElementById('qvImg');
  if (imgEl) { imgEl.src = d.qvImg || ''; imgEl.alt = d.qvName || ''; }
  const tagEl = document.getElementById('qvTag');
  if (tagEl) tagEl.textContent = d.qvTag || '';
  const titleEl = document.getElementById('qvTitle');
  if (titleEl) titleEl.textContent = d.qvName || '';
  const descEl = document.getElementById('qvDesc');
  if (descEl) descEl.textContent = d.qvDesc || '';

  // Estrellas dinámicas
  const stars   = parseInt(d.qvStars || '5');
  const reviews = d.qvReviews || '';
  const starsEl = document.getElementById('qvStars');
  if (starsEl) starsEl.innerHTML =
    '★'.repeat(stars) + '☆'.repeat(5 - stars) +
    (reviews ? `<span class="reviews">(${reviews})</span>` : '');

  // Precios y descuento
  const price    = parseFloat(d.qvPrice    || '0');
  const oldPrice = parseFloat(d.qvOldPrice || '0');
  const curPrEl  = document.getElementById('qvCurrentPrice');
  const oldPrEl  = document.getElementById('qvOldPrice');
  const discEl   = document.getElementById('qvDiscount');
  if (curPrEl) curPrEl.textContent = `$${price.toFixed(2)}`;
  if (oldPrEl) oldPrEl.textContent = `$${oldPrice.toFixed(2)}`;

  if (discEl) {
    if (oldPrice > price) {
      const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
      discEl.textContent    = `−${pct}%`;
      discEl.style.display  = '';
    } else {
      discEl.style.display = 'none';
    }
  }

  // Lista de beneficios (separados por |)
  const featureList = document.getElementById('qvFeatureList');
  if (featureList) {
    featureList.innerHTML = '';
    const features = (d.qvFeatures || '').split('|').filter(Boolean);
    features.forEach(feat => {
      const li = document.createElement('li');
      li.textContent = feat.trim();
      featureList.appendChild(li);
    });
  }

  // Imagen glow según el color de la tarjeta
  const glowMap = {
    blue:   'radial-gradient(ellipse at center, rgba(37,99,235,0.25), transparent 70%)',
    purple: 'radial-gradient(ellipse at center, rgba(124,58,237,0.25), transparent 70%)',
    green:  'radial-gradient(ellipse at center, rgba(16,185,129,0.25), transparent 70%)',
    cyan:   'radial-gradient(ellipse at center, rgba(6,182,212,0.25), transparent 70%)',
    orange: 'radial-gradient(ellipse at center, rgba(249,115,22,0.25), transparent 70%)',
    gold:   'radial-gradient(ellipse at center, rgba(245,158,11,0.25), transparent 70%)',
  };
  const glow    = d.qvGlow || 'blue';
  const glowEl  = document.getElementById('qvImgGlow');
  if (glowEl) glowEl.style.background = glowMap[glow] || glowMap.blue;

  // Actualizar la clase glow del modal (para el box-shadow)
  if (qvModal) qvModal.className = `qv-modal glow-${glow}`;

  // Guardar referencia para el botón de carrito
  _qvCurrent = { name: d.qvName, price };

  // Conectar el botón "Agregar al carrito" del modal
  if (qvBtnCart) {
    qvBtnCart.onclick = () => {
      addToCart(_qvCurrent.name, _qvCurrent.price, qvBtnCart);
      setTimeout(closeQuickView, 800);
    };
  }

  // Abrir con animación
  qvOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal con animación de salida.
 */
function closeQuickView() {
  if (!qvOverlay) return;
  qvOverlay.classList.remove('open');
  document.body.style.overflow = '';
  _qvCurrent = null;
}

// Cerrar con el botón X
qvClose?.addEventListener('click', closeQuickView);

// Cerrar al hacer clic en el overlay (fuera del modal)
qvOverlay?.addEventListener('click', (e) => {
  if (e.target === qvOverlay) closeQuickView();
});

// Cerrar con la tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && qvOverlay?.classList.contains('open')) {
    closeQuickView();
  }
});

// Event delegation global — funciona en index.html, catalogo.html y cualquier otra página
// Escucha en `document` para cubrir tarjetas cargadas en cualquier momento
document.addEventListener('click', (e) => {
  // Si el clic fue en el botón "Agregar al carrito" (o un hijo suyo), ignorar
  if (e.target.closest('.btn-add-cart')) return;

  // Busca la tarjeta más cercana que tenga data-qv-name (índice de que tiene datos para el modal)
  const card = e.target.closest('.product-card[data-qv-name]');
  if (!card) return;

  openQuickView(card);
});
