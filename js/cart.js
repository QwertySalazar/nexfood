/* ════════════════════════════════════════════
   NEXFOOD 24 HORAS — Estado del Carrito y Audio
   ════════════════════════════════════════════ */
'use strict';

/* ── Estado Global ── */
var cart = {};          // {productId: qty}
var favorites = {};     // {productId: true}
var soundOn = false;
var AC = null;

/* ── Persistencia Local ── */
function loadLocal() {
  try {
    var f = localStorage.getItem('nf_favorites');
    if (f) favorites = JSON.parse(f);
  } catch (e) { }
}

function saveFavorites() {
  try { localStorage.setItem('nf_favorites', JSON.stringify(favorites)); } catch (e) { }
}

function saveOrderHistory(order) {
  try {
    var hist = JSON.parse(localStorage.getItem('nf_history') || '[]');
    hist.unshift(order);
    if (hist.length > 20) hist = hist.slice(0, 20);
    localStorage.setItem('nf_history', JSON.stringify(hist));
  } catch (e) { }
}

function getOrderHistory() {
  try { return JSON.parse(localStorage.getItem('nf_history') || '[]'); } catch (e) { return []; }
}

/* ── Audio / Feedback Háptico Suave ── */
function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}

function beep(f, d, v) {
  if (!soundOn) return;
  try {
    var ctx = getAC();
    if (ctx.state === 'suspended') ctx.resume();
    var o = ctx.createOscillator(), g = ctx.createGain();
    var o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o2.connect(g2); g2.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * 2;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
    g2.gain.setValueAtTime(0, ctx.currentTime);
    g2.gain.linearRampToValueAtTime(v * 0.3, ctx.currentTime + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d * 0.7);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + d);
    o2.start(ctx.currentTime); o2.stop(ctx.currentTime + d);
  } catch (e) { }
}

function pClick() { beep(523, 0.3, 0.07); }
function pAdd() { beep(659, 0.18, 0.09); }
function pHover() { beep(659, 0.15, 0.03); }

/* ── Helpers de Formateo y Búsqueda ── */
function fmt(n) { return '€' + Number(n).toFixed(2); }

function getProduct(id) {
  if (typeof PRODUCTS === 'undefined') return null;
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) return PRODUCTS[i];
  }
  return null;
}

function cartCount() {
  var t = 0;
  for (var k in cart) { t += cart[k]; }
  return t;
}

function cartSubtotal() {
  var t = 0;
  for (var k in cart) {
    var p = getProduct(parseInt(k, 10));
    if (p) t += p.precio * cart[k];
  }
  return t;
}

function cartHasRegulated() {
  for (var k in cart) {
    var p = getProduct(parseInt(k, 10));
    if (p && p.reg) return true;
  }
  return false;
}

function tagLabel(tag) {
  if (tag === 'vendido') return '🔥 Más vendido';
  if (tag === 'nuevo') return '🆕 Nuevo';
  if (tag === 'promo') return '⭐ Promoción';
  return '';
}

/* ── Acciones del Carrito ── */
function addToCart(id, qty) {
  qty = qty || 1;
  cart[id] = (cart[id] || 0) + qty;
  pAdd();
  updateCartUI();
  bumpCartFab();
  refreshProductCardQty(id);
}

function removeFromCart(id) {
  delete cart[id];
  updateCartUI();
  renderCartPanel();
  refreshProductCardQty(id);
}

function setQty(id, qty) {
  if (qty <= 0) { removeFromCart(id); return; }
  cart[id] = qty;
  updateCartUI();
  renderCartPanel();
  refreshProductCardQty(id);
}

function incQty(id) {
  cart[id] = (cart[id] || 0) + 1;
  pClick();
  updateCartUI();
  renderCartPanel();
  refreshProductCardQty(id);
}

function decQty(id) {
  if (!cart[id]) return;
  cart[id]--;
  if (cart[id] <= 0) delete cart[id];
  pClick();
  updateCartUI();
  renderCartPanel();
  refreshProductCardQty(id);
}

var addedTimer = null;
function bumpCartFab() {
  var fab = document.getElementById('cartFab');
  var txt = document.getElementById('cbText');
  if (!fab || !txt) return;
  txt.textContent = '✅ Agregado al carrito';
  fab.classList.add('added');
  clearTimeout(addedTimer);
  addedTimer = setTimeout(function () {
    txt.textContent = 'Ver mi pedido';
    fab.classList.remove('added');
  }, 1500);
}

function updateCartUI() {
  var count = cartCount();
  var sub = cartSubtotal();

  // Badges (navbar y bottom nav)
  var badges = document.querySelectorAll('.cart-badge, #cartBadge, #bnavCartBadge, #bnavHeaderBadge');
  badges.forEach(function (b) {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-flex' : 'none';
  });

  var fabCount = document.getElementById('cartCountFab');
  if (fabCount) fabCount.textContent = count;

  // Floating Action Button
  var fab = document.getElementById('cartFab');
  if (fab) {
    fab.classList.toggle('has-items', count > 0);
  }

  document.body.classList.toggle('cartbar-on', count > 0);

  var tot = document.getElementById('cbTotal');
  if (tot) tot.textContent = fmt(sub);

  var bnavTotal = document.getElementById('bnavCartTotal');
  if (bnavTotal) bnavTotal.textContent = fmt(sub);
}

function refreshProductCardQty(id) {
  var qty = cart[id] || 0;
  var cards = document.querySelectorAll('.cat-prod-card[data-id="' + id + '"]');
  cards.forEach(function (card) {
    card.classList.toggle('in-cart', qty > 0);
    var addBtn = card.querySelector('.btn-add-initial');
    var qtyBox = card.querySelector('.pcard-qty');
    var numEl = card.querySelector('.pq-num');
    if (addBtn) addBtn.style.display = qty === 0 ? 'inline-flex' : 'none';
    if (qtyBox) qtyBox.style.display = qty > 0 ? 'inline-flex' : 'none';
    if (numEl) numEl.textContent = qty;
  });
}

/* ── Panel Lateral del Carrito ── */
function openCart() {
  var panel = document.getElementById('cartPanel');
  var overlay = document.getElementById('cartOverlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('show');
  renderCartPanel();
  pClick();
}

function closeCart() {
  var panel = document.getElementById('cartPanel');
  var overlay = document.getElementById('cartOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

function renderCartPanel() {
  var body = document.getElementById('cartBody');
  var footer = document.getElementById('cartFooter');
  if (!body) return;

  var ids = Object.keys(cart);
  if (ids.length === 0) {
    body.innerHTML = '<div class="cart-empty">' +
      '<div class="ce-icon">🛒</div>' +
      '<p>Tu carrito está vacío</p>' +
      '<span>Selecciona productos del menú para comenzar tu pedido</span>' +
      '<button type="button" class="btn-continue-shopping" style="margin-top:1.5rem;max-width:220px;" onclick="closeCart()"><i class="fas fa-utensils"></i> Explorar menú</button>' +
      '</div>';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';
  var html = '';
  ids.forEach(function (idStr) {
    var id = parseInt(idStr, 10);
    var p = getProduct(id);
    if (!p) return;
    var qty = cart[idStr];
    html += '<div class="cart-item">' +
      '<div class="ci-emoji" style="background:linear-gradient(135deg,' + p.color + ',' + p.color2 + ')">' + p.emoji + '</div>' +
      '<div class="ci-info">' +
      '<div class="ci-name">' + p.nombre + '</div>' +
      '<div class="ci-price">' + fmt(p.precio) + ' c/u</div>' +
      '</div>' +
      '<div class="ci-qty">' +
      '<button class="ci-btn" onclick="decQty(' + id + ')" aria-label="Quitar uno">−</button>' +
      '<span class="ci-num">' + qty + '</span>' +
      '<button class="ci-btn" onclick="incQty(' + id + ')" aria-label="Agregar uno">+</button>' +
      '</div>' +
      '<div class="ci-total">' + fmt(p.precio * qty) + '</div>' +
      '<button class="ci-del" onclick="removeFromCart(' + id + ')" aria-label="Eliminar">×</button>' +
      '</div>';
  });
  body.innerHTML = html;

  var sub = cartSubtotal();
  var dom = typeof DOMICILIO_COST !== 'undefined' ? DOMICILIO_COST : 3.99;
  var total = sub + dom;

  var subEl = document.getElementById('cartSubtotal');
  var domEl = document.getElementById('cartDomicilio');
  var totEl = document.getElementById('cartTotal');
  if (subEl) subEl.textContent = fmt(sub);
  if (domEl) domEl.textContent = fmt(dom);
  if (totEl) totEl.textContent = fmt(total);

  var ageWarn = document.getElementById('ageWarning');
  if (ageWarn) ageWarn.style.display = cartHasRegulated() ? 'flex' : 'none';
}

