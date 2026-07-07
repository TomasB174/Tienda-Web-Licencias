/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   NexusKey — CSV Product Loader                                  ║
 * ║   Carga productos.csv y actualiza dinámicamente los precios      ║
 * ║   y datos de las tarjetas de producto en el HTML.                ║
 * ║                                                                  ║
 * ║   USO EN HTML:                                                   ║
 * ║   Agrega data-product-id="ID_PRODUCTO" a cada card.             ║
 * ║   Ej: <div class="product-card" data-product-id="WIN11-PRO">    ║
 * ║                                                                  ║
 * ║   FORMATO DE PRECIOS EN CSV:                                     ║
 * ║   Soporta formato ARS con punto como separador de miles.         ║
 * ║   Ej: "12.000", "274.063", "494.086" → se limpian antes de      ║
 * ║   convertir a número para evitar errores de cálculo.             ║
 * ║                                                                  ║
 * ║   Para actualizar precios: solo subí un nuevo productos.csv.     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────────────
  // Configuración
  // ──────────────────────────────────────────────────────────────────
  const CSV_PATH = 'csv/productos.csv';

  // ──────────────────────────────────────────────────────────────────
  // Parseo del CSV
  // ──────────────────────────────────────────────────────────────────

  /**
   * Parsea una línea CSV respetando campos entre comillas.
   * @param {string} line
   * @returns {string[]}
   */
  function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  /**
   * Convierte el texto CSV en un array de objetos.
   * @param {string} csvText
   * @returns {Object[]}
   */
  function parseCSV(csvText) {
    const lines = csvText
      .split('\n')
      .map(l => l.replace(/\r$/, ''))   // eliminar \r en Windows
      .filter(l => l.trim() !== '');

    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h.trim()] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(obj);
    }
    return rows;
  }

  // ──────────────────────────────────────────────────────────────────
  // Utilidades de formato y parseo de precios
  // ──────────────────────────────────────────────────────────────────

  /**
   * parsePrecioARS()
   * Convierte un string de precio en formato ARS a número entero.
   *
   * ✅ Soporta ambos formatos del CSV:
   *    - Formato nuevo (con separador de miles): "12.000" → 12000
   *    - Formato anterior (sin separador):       "12000"  → 12000
   *    - Valores ya numéricos:                    12000    → 12000
   *
   * ⚠️ IMPORTANTE: NO usa /\D/g porque eliminamos SOLO los puntos
   *    de miles. Si en el futuro se agregan comas decimales, esta
   *    función deberá ampliarse.
   *
   * @param {string|number} value  - Valor del CSV
   * @returns {number}             - Entero limpio, o 0 si no parseable
   */
  function parsePrecioARS(value) {
    if (value === null || value === undefined || value === '') return 0;
    // Si ya es número, devolver directamente
    if (typeof value === 'number') return Math.round(value);
    // Limpiar: eliminar puntos de miles (separador ARS), espacios y el símbolo $
    const clean = String(value)
      .replace(/\./g, '')   // ← CLAVE: elimina puntos de miles ("12.000" → "12000")
      .replace(/[^\d]/g, '') // elimina cualquier otro carácter no numérico
      .trim();
    const parsed = parseInt(clean, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Formatea un número como precio ARS con puntos de miles.
   * Acepta tanto números como strings con formato ARS.
   * Ej: 12000      → "ARS $12.000"
   *     "12.000"   → "ARS $12.000"  (limpia antes de formatear)
   * @param {string|number} value
   * @returns {string}
   */
  function formatPriceARS(value) {
    const num = parsePrecioARS(value);
    if (!num) return String(value);
    return 'ARS $' + num.toLocaleString('es-AR');
  }

  /**
   * Calcula el porcentaje de descuento entre dos precios.
   * @param {number} original
   * @param {number} oferta
   * @returns {string}  Ej: "72% OFF"
   */
  function calcDiscount(original, oferta) {
    if (!original || !oferta || original <= oferta) return '';
    const pct = Math.round(((original - oferta) / original) * 100);
    return pct + '% OFF';
  }

  // ──────────────────────────────────────────────────────────────────
  // Actualización del DOM
  // ──────────────────────────────────────────────────────────────────

  /**
   * Aplica los datos de un producto a su tarjeta HTML.
   * @param {Element} card  — Elemento con data-product-id
   * @param {Object}  prod  — Fila del CSV parseada
   */
  function updateCard(card, prod) {
    // parsePrecioARS() maneja tanto "12.000" (formato ARS) como "12000" (sin separador)
    const precioOriginal = parsePrecioARS(prod['Precio_Original_ARS']);
    const precioOferta   = parsePrecioARS(prod['Precio_Oferta_ARS']);
    const etiqueta       = prod['Etiqueta_Promocional'] || '';
    const caracteristicas = (prod['Caracteristicas'] || '').split('|');

    // ── Precio tachado ───────────────────────────────────────────────
    const priceOldEl = card.querySelector('.price-old');
    if (priceOldEl && precioOriginal) {
      priceOldEl.textContent = formatPriceARS(precioOriginal);
    }

    // ── Precio actual ────────────────────────────────────────────────
    const priceCurrentEl = card.querySelector('.price-current, .bundle-price');
    if (priceCurrentEl && precioOferta) {
      priceCurrentEl.textContent = formatPriceARS(precioOferta);
    }

    // ── data-qv-price (Quick View modal) ─────────────────────────────
    if (precioOferta)   card.dataset.qvPrice    = precioOferta;
    if (precioOriginal) card.dataset.qvPriceOld = precioOriginal;

    // ── Características (feature pills) ──────────────────────────────
    const featuresEl = card.querySelector('.product-features');
    if (featuresEl && caracteristicas.length > 0 && caracteristicas[0] !== '') {
      const spans = featuresEl.querySelectorAll('span');
      caracteristicas.forEach((feat, i) => {
        if (spans[i]) spans[i].textContent = feat.trim();
      });
    }

    // ── Etiqueta (badge) ──────────────────────────────────────────────
    // Solo actualiza el primer badge si la etiqueta no está vacía
    if (etiqueta) {
      const badgeEl = card.querySelector('.product-badge');
      if (badgeEl) {
        // No sobrescribir badges de "Sin Stock"
        if (!badgeEl.textContent.toLowerCase().includes('stock')) {
          badgeEl.textContent = etiqueta;
        }
      }
    }

    // ── Calcula descuento y lo refleja en el data-qv-discount ─────────
    const discount = calcDiscount(precioOriginal, precioOferta);
    if (discount) card.dataset.qvDiscount = discount;

    // ── Actualiza el botón "Agregar al carrito" con el precio correcto ─
    const addBtn = card.querySelector('[onclick*="addToCart"]');
    if (addBtn && precioOferta) {
      const currentOnclick = addBtn.getAttribute('onclick') || '';
      // Reemplaza el precio en la llamada addToCart(nombre, PRECIO, this)
      const updated = currentOnclick.replace(
        /addToCart\(([^,]+),\s*[\d.,]+,\s*this\)/,
        `addToCart($1, ${precioOferta}, this)`
      );
      addBtn.setAttribute('onclick', updated);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Función principal exportada
  // ──────────────────────────────────────────────────────────────────

  /**
   * cargarProductos()
   * Carga csv/productos.csv, lo parsea y actualiza todas las tarjetas
   * del documento que tengan el atributo data-product-id.
   *
   * @returns {Promise<Object[]>}  Array de productos cargados (útil para debug).
   */
  function cargarProductos() {
    return fetch(CSV_PATH)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('No se pudo cargar ' + CSV_PATH + ' (HTTP ' + res.status + ')');
        }
        return res.text();
      })
      .then(function (csvText) {
        const productos = parseCSV(csvText);

        // Construir mapa ID → producto
        const mapaProductos = {};
        productos.forEach(function (p) {
          const id = (p['ID_Producto'] || '').trim().toUpperCase();
          if (id) mapaProductos[id] = p;
        });

        // Encontrar todas las tarjetas con data-product-id
        const tarjetas = document.querySelectorAll('[data-product-id]');
        let actualizadas = 0;

        tarjetas.forEach(function (card) {
          const id = (card.dataset.productId || '').trim().toUpperCase();
          if (mapaProductos[id]) {
            updateCard(card, mapaProductos[id]);
            actualizadas++;
          } else {
            console.warn('[NexusKey CSV] ID no encontrado en CSV:', id);
          }
        });

        console.log(
          '[NexusKey CSV] ✅ ' + actualizadas + ' tarjeta(s) actualizadas desde ' + CSV_PATH
        );
        return productos;
      })
      .catch(function (err) {
        console.error('[NexusKey CSV] ❌ Error al cargar productos:', err.message);
        // Silencioso para el usuario final — la web sigue funcionando con los precios del HTML
      });
  }

  // ──────────────────────────────────────────────────────────────────
  // Auto-inicialización al cargar el DOM
  // ──────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarProductos);
  } else {
    cargarProductos();
  }

  // Exponer globalmente para uso manual o debugging desde consola
  window.NexusKeyCSV = {
    cargarProductos: cargarProductos,
    parseCSV: parseCSV,
    parsePrecioARS: parsePrecioARS,
    formatPriceARS: formatPriceARS,
    calcDiscount: calcDiscount
  };

})();
