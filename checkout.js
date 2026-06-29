/**
 * NexusKey — Checkout JavaScript
 * Maneja: lectura del carrito, descuentos, WhatsApp y Telegram
 */

/* ─────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────── */
const WHATSAPP_NUMBER  = "5491131678989";   // Tu número de WhatsApp (sin + ni espacios)
const TELEGRAM_USER    = "nexuskeystore";   // Tu usuario de Telegram (sin @)

/* ── CÓDIGOS DE AFILIADO ──────────────────────────────────────────
   Todos otorgan 10% de descuento al cliente final.
   El código se incluye en el pedido de WhatsApp para
   identificar al afiliado que generó cada venta.
──────────────────────────────────────────────── */
const DISCOUNT_CODES = {
  // ─ Generales: 10% sobre cualquier producto ─
  "NEXUSVIP":  { pct: 10, label: "10% de descuento aplicado 🎉" },
  "PROMO10":   { pct: 10, label: "10% de descuento aplicado 🎉" },
  "DIGITAL10": { pct: 10, label: "10% de descuento aplicado 🎉" },
  "TECNO10":   { pct: 10, label: "10% de descuento aplicado 🎉" },
  "OFERTA10":  { pct: 10, label: "10% de descuento aplicado 🎉" },

  // ─ Específicos de producto ─
  // product: subcadena que debe estar en item.name (se usa .includes)
  "GEMINI15":  { pct: 15, label: "15% OFF en Google AI Pro aplicado 🚀",
                 product: "Google AI Pro" },
};

/* ─────────────────────────────────────────
   ESTADO GLOBAL
───────────────────────────────────────── */
let cart          = [];
let discountApplied = null;   // { code, pct } | null

/**
 * Formatea un número como precio en Pesos Argentinos.
 * Ejemplo: 12000 → "$ 12.000" | 12.99 → "$ 12,99"
 */
const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

/* ─────────────────────────────────────────
   INICIALIZACIÓN
───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  renderOrderSummary();
  renderPricing();
  initGlowEffect();
  initNavbarScroll();
  bindDiscountKeyboard();
});

/* ─────────────────────────────────────────
   CARRITO — Lectura desde localStorage
───────────────────────────────────────── */
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem("nexuskey_cart");
    cart = raw ? JSON.parse(raw) : [];
  } catch {
    cart = [];
  }

  // Leer código de afiliado aplicado en el carrito lateral
  try {
    const rawAff = localStorage.getItem("nexuskey_affiliate");
    if (rawAff) {
      const aff = JSON.parse(rawAff);
      if (aff && DISCOUNT_CODES[aff.code]) {
        discountApplied = { code: aff.code, pct: aff.pct };
        // Pre-rellenar el campo de código y bloquearlo
        setTimeout(() => {
          const inp = document.getElementById("discountCode");
          const btn = document.getElementById("applyDiscountBtn");
          const tag = document.getElementById("discountCodeTag");
          if (inp) { inp.value = aff.code; inp.disabled = true; }
          if (btn) { btn.disabled = true; btn.style.opacity = "0.5"; }
          if (tag) tag.textContent = aff.code;
        }, 0);
      }
    }
  } catch { /* ignorar */ }

  if (cart.length === 0) {
    document.getElementById("checkoutEmpty").style.display  = "flex";
    document.getElementById("orderItemsList").style.display = "none";
    document.getElementById("itemCountBadge").textContent   = "Vacío";
    disableCTAButtons();
  }
}

/* ─────────────────────────────────────────
   RENDER — Lista de productos
───────────────────────────────────────── */
function renderOrderSummary() {
  const list  = document.getElementById("orderItemsList");
  const badge = document.getElementById("itemCountBadge");

  if (cart.length === 0) return;

  badge.textContent = `${cart.length} ${cart.length === 1 ? "ítem" : "ítems"}`;

  list.innerHTML = cart.map((item, idx) => `
    <div class="order-item" style="animation-delay:${idx * 0.07}s">
      <div class="order-item-icon">
        ${getProductIcon(item.name)}
      </div>
      <div class="order-item-info">
        <div class="order-item-name">${escHtml(item.name)}</div>
        <div class="order-item-meta">Licencia digital · Entrega inmediata</div>
      </div>
      <div class="order-item-price">${fmt(item.price)}</div>
    </div>
  `).join("");
}

/* Devuelve un SVG según palabras clave del nombre del producto */
function getProductIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("windows"))
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
  if (n.includes("office") || n.includes("365") || n.includes("word"))
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  if (n.includes("adobe") || n.includes("photoshop") || n.includes("illustrator"))
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
  if (n.includes("vpn") || n.includes("nord"))
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  if (n.includes("kaspersky") || n.includes("antivirus") || n.includes("bitdefender"))
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
  if (n.includes("autocad") || n.includes("cad") || n.includes("solidworks"))
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`;
  // Genérico
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
}

/* ─────────────────────────────────────────
   RENDER — Precios
───────────────────────────────────────── */
function renderPricing() {
  const subtotal      = calcSubtotal();
  const discountAmt   = discountApplied ? +(subtotal * discountApplied.pct / 100).toFixed(2) : 0;
  const total         = +(subtotal - discountAmt).toFixed(2);

  document.getElementById("subtotalVal").textContent = fmt(subtotal);

  // Fila de descuento
  const discountRow = document.getElementById("discountRow");
  if (discountApplied) {
    discountRow.style.display          = "flex";
    document.getElementById("discountVal").textContent      = `-${fmt(discountAmt)}`;
    document.getElementById("discountCodeTag").textContent  = discountApplied.code;
    // Precio tachado
    const oldTotal = document.getElementById("priceOldTotal");
    oldTotal.style.display    = "inline";
    oldTotal.textContent      = fmt(subtotal);
  } else {
    discountRow.style.display                    = "none";
    document.getElementById("priceOldTotal").style.display = "none";
  }

  // Total con animación
  const totalEl = document.getElementById("totalVal");
  totalEl.textContent = fmt(total);
  totalEl.classList.remove("price-updated");
  void totalEl.offsetWidth; // reflow para reiniciar animación
  totalEl.classList.add("price-updated");
}

function calcSubtotal() {
  return +cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0).toFixed(2);
}

/* ─────────────────────────────────────────
   DESCUENTOS
───────────────────────────────────────── */
function applyDiscount() {
  const input   = document.getElementById("discountCode");
  const code    = input.value.trim().toUpperCase();
  const msgEl   = document.getElementById("discountMessage");
  const iconEl  = document.getElementById("discountStatusIcon");

  // Reset estado visual
  input.classList.remove("input-success", "input-error");
  iconEl.textContent = "";
  msgEl.className    = "discount-message";
  msgEl.textContent  = "";

  if (!code) {
    setDiscountFeedback("error", "✕", "Ingresá un código de descuento.", input, iconEl, msgEl);
    return;
  }

  const discount = DISCOUNT_CODES[code];

  if (!discount) {
    discountApplied = null;
    setDiscountFeedback("error", "✕", "Código inválido. Verificá que esté bien escrito.", input, iconEl, msgEl);
    renderPricing();
    return;
  }

  // Validación de producto específico
  if (discount.product) {
    const hasProduct = cart.some(
      item => item.name.toLowerCase().includes(discount.product.toLowerCase()) ||
              discount.product.toLowerCase().includes(item.name.toLowerCase())
    );
    if (!hasProduct) {
      discountApplied = null;
      setDiscountFeedback(
        "error", "✕",
        `El código “${code}” es exclusivo para ${discount.product}. Agrégalo al carrito primero.`,
        input, iconEl, msgEl
      );
      renderPricing();
      return;
    }
  }

  // Código válido ✔
  discountApplied = { code, pct: discount.pct, product: discount.product || null };
  setDiscountFeedback("success", "✓", discount.label, input, iconEl, msgEl);
  input.disabled = true;
  document.getElementById("applyDiscountBtn").disabled = true;
  document.getElementById("applyDiscountBtn").style.opacity = "0.5";

  renderPricing();
}

function setDiscountFeedback(type, icon, message, inputEl, iconEl, msgEl) {
  inputEl.classList.add(type === "success" ? "input-success" : "input-error");
  iconEl.textContent   = icon;
  iconEl.style.color   = type === "success" ? "var(--neon-green)" : "#f87171";
  msgEl.className      = `discount-message ${type}`;
  msgEl.textContent    = message;
}

function bindDiscountKeyboard() {
  const input = document.getElementById("discountCode");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyDiscount();
  });
}

/* ─────────────────────────────────────────
   MENSAJE ESTRUCTURADO
───────────────────────────────────────── */
function buildMessage() {
  const subtotal    = calcSubtotal();
  const discountAmt = discountApplied ? +(subtotal * discountApplied.pct / 100).toFixed(2) : 0;
  const total       = +(subtotal - discountAmt).toFixed(2);

  let msg = "¡Hola! Quiero finalizar mi compra en NexusKey.\n\n";
  msg    += "*🛠️ Detalle de mi pedido:*\n";

  // Listado completo de productos (importante para cálculo de márgenes)
  cart.forEach(item => {
    msg += `  ▸ ${item.name} — ${fmt(item.price)}\n`;
  });

  msg += `\n*Subtotal:* ${fmt(subtotal)}`;

  // Tracking de afiliado — siempre presente si se usó un código
  if (discountApplied) {
    msg += `\n🏷️ *Código de Afiliado:* ${discountApplied.code}`;
    msg += `\n*Descuento (${discountApplied.pct}%):* -${fmt(discountAmt)}`;
  }

  msg += `\n\n⭐ *Total a pagar:* ${fmt(total)}\n\n`;
  msg += "¿Me pasás los datos para transferir?";

  return msg;
}

/* ─────────────────────────────────────────
   BOTONES DE COMPRA
───────────────────────────────────────── */
function buyViaWhatsApp() {
  if (cart.length === 0) {
    showToast("Tu carrito está vacío", "error");
    return;
  }

  const msg = buildMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  showToast("¡Abriendo WhatsApp! 💬", "success");
  setTimeout(() => window.location.href = url, 600);
}

function buyViaTelegram() {
  if (cart.length === 0) {
    showToast("Tu carrito está vacío", "error");
    return;
  }

  const msg = buildMessage();
  const url = `https://t.me/${TELEGRAM_USER}?text=${encodeURIComponent(msg)}`;

  showToast("¡Abriendo Telegram! ✈️", "success");
  setTimeout(() => window.location.href = url, 600);
}

function disableCTAButtons() {
  ["btnWhatsApp", "btnTelegram"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.4";
      btn.style.cursor  = "not-allowed";
    }
  });
}

/* ─────────────────────────────────────────
   GLOW EFFECT (mouse tracking en cards)
───────────────────────────────────────── */
function initGlowEffect() {
  document.querySelectorAll(".glow-card-checkout").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      card.style.setProperty("--mouse-x", x + "%");
      card.style.setProperty("--mouse-y", y + "%");
    });
  });
}

/* ─────────────────────────────────────────
   NAVBAR — Efecto scroll
───────────────────────────────────────── */
function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  function update() {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast     = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ─────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────── */
function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
