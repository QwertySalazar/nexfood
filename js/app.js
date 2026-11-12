/* ════════════════════════════════════════════
   NEXFOOD 24 HORAS — Aplicación Principal & Navegación Móvil
   ════════════════════════════════════════════ */
'use strict';

var currentCategory = null; // null = vista de categorías (Hub); string = categoría abierta
var darkMode = false;

/* ════════════════════════════════════════════
   MODO OSCURO
   ════════════════════════════════════════════ */
function loadTheme() {
  try {
    var d = localStorage.getItem('nf_darkmode');
    if (d === '1') darkMode = true;
  } catch (e) { }
}

function saveDarkMode() {
  try { localStorage.setItem('nf_darkmode', darkMode ? '1' : '0'); } catch (e) { }
}

function applyDarkMode() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  var icons = document.querySelectorAll('.darkModeIcon');
  icons.forEach(function (icon) {
    icon.className = darkMode ? 'fas fa-sun darkModeIcon' : 'fas fa-moon darkModeIcon';
  });
}

function toggleDarkMode() {
  darkMode = !darkMode;
  saveDarkMode();
  applyDarkMode();
  pClick();
}

/* ════════════════════════════════════════════
   VISTA 1: HUB DE CATEGORÍAS EN TARJETAS ANIMADAS (0 KB IMÁGENES)
   ════════════════════════════════════════════ */
function renderCategoryHub() {
  var hub = document.getElementById('categoryGrid');
  if (!hub) return;

  var html = '';

  // Tarjeta especial de Favoritos si hay productos guardados
  var favCount = Object.keys(favorites).length;
  if (favCount > 0) {
    html += '<div class="cat-hub-card cat-card-favs" onclick="openSpecialCatalog(\'FAVORITOS\')" style="--card-color:#e0245e; --card-color2:#9c0f3d;">' +
      '<div class="cat-card-glow"></div>' +
      '<div class="anim-food-stage">' +
      '<div class="anim-food-shadow"></div>' +
      '<span class="anim-food-icon anim-heart">❤️</span>' +
      '<span class="anim-food-fx">✨</span>' +
      '</div>' +
      '<div class="cat-card-info">' +
      '<h3 class="cat-card-title">Mis Favoritos</h3>' +
      '<span class="cat-card-count-badge">' + favCount + ' plato' + (favCount > 1 ? 's' : '') + '</span>' +
      '</div>' +
      '</div>';
  }

  // Tarjeta especial de Más Vendidos
  var topCount = PRODUCTS.filter(function (p) { return p.tag === 'vendido'; }).length;
  if (topCount > 0) {
    html += '<div class="cat-hub-card cat-card-top" onclick="openSpecialCatalog(\'TOP\')" style="--card-color:#e65100; --card-color2:#bf360c;">' +
      '<div class="cat-card-glow"></div>' +
      '<div class="anim-food-stage">' +
      '<div class="anim-food-shadow"></div>' +
      '<span class="anim-food-icon anim-flame">🔥</span>' +
      '<span class="anim-food-fx">⭐</span>' +
      '</div>' +
      '<div class="cat-card-info">' +
      '<h3 class="cat-card-title">Más Vendidos</h3>' +
      '<span class="cat-card-count-badge">' + topCount + ' platos top</span>' +
      '</div>' +
      '</div>';
  }

  // Tarjetas individuales de cada categoría con visual animado
  CATEGORIES.forEach(function (c) {
    var fx = (typeof CATEGORY_FX !== 'undefined' && CATEGORY_FX[c.cat]) ? CATEGORY_FX[c.cat] : '✨';
    html += '<div class="cat-hub-card" data-cat="' + c.cat + '" onclick="openCategoryCatalog(\'' + c.cat + '\')" style="--card-color:' + c.color + '; --card-color2:' + c.color2 + ';">' +
      '<div class="cat-card-glow"></div>' +
      '<div class="anim-food-stage">' +
      '<div class="anim-food-shadow"></div>' +
      '<span class="anim-food-icon">' + c.emoji + '</span>' +
      '<span class="anim-food-fx">' + fx + '</span>' +
      '</div>' +
      '<div class="cat-card-info">' +
      '<h3 class="cat-card-title">' + c.label + '</h3>' +
      '<span class="cat-card-count-badge">' + c.count + ' platos</span>' +
      '</div>' +
      '</div>';
  });

  hub.innerHTML = html;
}

/* ════════════════════════════════════════════
   VISTA 2: CATÁLOGO DE CATEGORÍA SELECCIONADA
   ════════════════════════════════════════════ */
function openCategoryCatalog(catKey) {
  currentCategory = catKey;

  var hubView = document.getElementById('categoryHubSection');
  var catalogView = document.getElementById('categoryCatalogSection');

  if (hubView) hubView.style.display = 'none';
  if (catalogView) catalogView.style.display = 'block';

  // Actualizar encabezado del catálogo de la categoría
  var catInfo = CATEGORIES.find(function (c) { return c.cat === catKey; });
  var titleEl = document.getElementById('catCatalogTitle');
  var countEl = document.getElementById('catCatalogCount');
  var iconEl = document.getElementById('catCatalogIcon');

  if (catInfo) {
    if (titleEl) titleEl.textContent = catInfo.label;
    if (countEl) countEl.textContent = catInfo.count + ' platos disponibles';
    if (iconEl) iconEl.textContent = catInfo.emoji;
  }

  // Renderizar pills de acceso rápido superior
  renderCatalogPills(catKey);

  // Limpiar filtro de búsqueda interna y renderizar productos
  var searchInput = document.getElementById('catCatalogSearch');
  if (searchInput) searchInput.value = '';

  renderCategoryProducts(catKey, '');

  // Scroll al inicio de la página para ver los productos de inmediato
  window.scrollTo({ top: 0, behavior: 'smooth' });

  pClick();
}

function openSpecialCatalog(specialKey) {
  currentCategory = specialKey;

  var hubView = document.getElementById('categoryHubSection');
  var catalogView = document.getElementById('categoryCatalogSection');

  if (hubView) hubView.style.display = 'none';
  if (catalogView) catalogView.style.display = 'block';

  var titleEl = document.getElementById('catCatalogTitle');
  var countEl = document.getElementById('catCatalogCount');
  var iconEl = document.getElementById('catCatalogIcon');

  if (specialKey === 'FAVORITOS') {
    var count = Object.keys(favorites).length;
    if (titleEl) titleEl.textContent = 'Mis Favoritos';
    if (countEl) countEl.textContent = count + ' platos guardados';
    if (iconEl) iconEl.textContent = '❤️';
  } else if (specialKey === 'TOP') {
    var countTop = PRODUCTS.filter(function (p) { return p.tag === 'vendido'; }).length;
    if (titleEl) titleEl.textContent = 'Más Vendidos';
    if (countEl) countEl.textContent = countTop + ' platos favoritos';
    if (iconEl) iconEl.textContent = '🔥';
  }

  renderCatalogPills(specialKey);

  var searchInput = document.getElementById('catCatalogSearch');
  if (searchInput) searchInput.value = '';

  renderCategoryProducts(specialKey, '');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  pClick();
}

function closeCategoryCatalog() {
  currentCategory = null;

  var hubView = document.getElementById('categoryHubSection');
  var catalogView = document.getElementById('categoryCatalogSection');

  if (catalogView) catalogView.style.display = 'none';
  if (hubView) hubView.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  pClick();
}

/* ── Pills Horizontales para cambiar de categoría al instante ── */
function renderCatalogPills(activeCat) {
  var container = document.getElementById('catPillsContainer');
  if (!container) return;

  var html = '';

  CATEGORIES.forEach(function (c) {
    var isActive = c.cat === activeCat;
    html += '<button type="button" class="cat-pill ' + (isActive ? 'active' : '') + '" onclick="openCategoryCatalog(\'' + c.cat + '\')">' +
      '<span class="cp-emoji">' + c.emoji + '</span> ' + c.label +
      '</button>';
  });

  container.innerHTML = html;

  // Centrar el pill activo suavemente
  setTimeout(function () {
    var activePill = container.querySelector('.cat-pill.active');
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, 50);
}

/* ── Render de Productos de la Categoría ── */
function renderCategoryProducts(catKey, filterText) {
  var list = document.getElementById('catProductList');
  if (!list) return;

  var items = [];
  if (catKey === 'FAVORITOS') {
    items = PRODUCTS.filter(function (p) { return favorites[p.id]; });
  } else if (catKey === 'TOP') {
    items = PRODUCTS.filter(function (p) { return p.tag === 'vendido'; });
  } else {
    items = PRODUCTS.filter(function (p) { return p.cat === catKey; });
  }

  if (filterText && filterText.trim().length > 0) {
    var q = filterText.trim().toUpperCase();
    items = items.filter(function (p) {
      return p.nombre.toUpperCase().indexOf(q) >= 0;
    });
  }

  if (items.length === 0) {
    list.innerHTML = '<div class="cat-empty-msg">' +
      '<div class="cem-icon">🍽️</div>' +
      '<h4>No se encontraron platos</h4>' +
      '<p>' + (filterText ? 'Prueba con otro término de búsqueda.' : 'No hay platos disponibles en este momento.') + '</p>' +
      '</div>';
    return;
  }

  var html = '';
  items.forEach(function (p) {
    var qty = cart[p.id] || 0;
    var isFav = !!favorites[p.id];
    var tagHtml = p.tag ? '<span class="pcard-tag pcard-tag-' + p.tag + '">' + tagLabel(p.tag) + '</span>' : '';
    var fx = (typeof CATEGORY_FX !== 'undefined' && CATEGORY_FX[p.cat]) ? CATEGORY_FX[p.cat] : '✨';

    html += '<article class="cat-prod-card ' + (qty > 0 ? 'in-cart' : '') + '" data-id="' + p.id + '">' +
      '<div class="cpc-media">' +
      '<div class="cpc-anim-wrap">' +
      '<span class="cpc-food-icon">' + p.emoji + '</span>' +
      '<span class="cpc-food-fx">' + fx + '</span>' +
      '</div>' +
      tagHtml +
      '<button type="button" class="cpc-fav ' + (isFav ? 'active' : '') + '" onclick="toggleFavorite(' + p.id + ', event)" aria-label="Favorito">' +
      (isFav ? '❤️' : '🤍') +
      '</button>' +
      '</div>' +
      '<div class="cpc-body">' +
      '<div class="cpc-meta">' +
      '<span class="cpc-badge-cat" style="color:' + p.color + '">' + p.catLabel + '</span>' +
      '<span class="cpc-time"><i class="fas fa-clock"></i> ' + p.time + ' min</span>' +
      '</div>' +
      '<h4 class="cpc-name">' + p.nombre + '</h4>' +
      '<div class="cpc-foot">' +
      '<div class="cpc-price">' + fmt(p.precio) + '</div>' +
      '<div class="pcard-ctrl">' +
      '<button type="button" class="btn-add-initial" onclick="incQty(' + p.id + ')" style="display:' + (qty === 0 ? 'inline-flex' : 'none') + ';">' +
      '<i class="fas fa-plus"></i> Añadir' +
      '</button>' +
      '<div class="pcard-qty" style="display:' + (qty > 0 ? 'inline-flex' : 'none') + ';">' +
      '<button type="button" class="pq-btn pq-minus" onclick="decQty(' + p.id + ')" aria-label="Quitar uno">−</button>' +
      '<span class="pq-num">' + qty + '</span>' +
      '<button type="button" class="pq-btn pq-plus pq-add" onclick="incQty(' + p.id + ')" aria-label="Agregar uno">+</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</article>';
  });

  list.innerHTML = html;
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

function refreshAllProductCards() {
  document.querySelectorAll('.cat-prod-card').forEach(function (card) {
    var id = parseInt(card.getAttribute('data-id'), 10);
    if (!isNaN(id)) refreshProductCardQty(id);
  });
}

function toggleFavorite(id, ev) {
  if (ev) ev.stopPropagation();
  if (favorites[id]) {
    delete favorites[id];
  } else {
    favorites[id] = true;
  }
  saveFavorites();
  pClick();

  // Actualizar botón de favorito en la tarjeta
  var favBtns = document.querySelectorAll('.cat-prod-card[data-id="' + id + '"] .cpc-fav');
  favBtns.forEach(function (b) {
    var isFav = !!favorites[id];
    b.classList.toggle('active', isFav);
    b.textContent = isFav ? '❤️' : '🤍';
  });

  renderCategoryHub();
}

/* ════════════════════════════════════════════
   BÚSQUEDA RÁPIDA (Global & Interna)
   ════════════════════════════════════════════ */
function initSearch() {
  // 1. Búsqueda Global en la Barra Superior
  var mainInput = document.getElementById('menuSearch');
  var mainResults = document.getElementById('searchResults');

  if (mainInput && mainResults) {
    mainInput.addEventListener('input', function () {
      var q = mainInput.value.trim().toUpperCase();
      if (q.length < 2) {
        mainResults.classList.remove('show');
        mainResults.innerHTML = '';
        return;
      }
      var matches = PRODUCTS.filter(function (p) {
        return p.nombre.toUpperCase().indexOf(q) >= 0;
      }).slice(0, 8);

      if (matches.length === 0) {
        mainResults.innerHTML = '<div class="sr-empty">Sin resultados para "' + mainInput.value + '"</div>';
      } else {
        mainResults.innerHTML = matches.map(function (p) {
          return '<div class="sr-item" onclick="selectSearchProduct(' + p.id + ', \'' + p.cat + '\')">' +
            '<div class="sr-emoji" style="background:linear-gradient(135deg,' + p.color + ',' + p.color2 + ')">' + p.emoji + '</div>' +
            '<div class="sr-info"><div class="sr-name">' + p.nombre + '</div><div class="sr-cat">' + p.catLabel + ' · ' + fmt(p.precio) + '</div></div>' +
            '<button type="button" class="sr-add-btn" onclick="event.stopPropagation(); addToCart(' + p.id + ');">Agregar</button>' +
            '</div>';
        }).join('');
      }
      mainResults.classList.add('show');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.top-search-wrap') && !e.target.closest('.search-wrap-menu')) {
        mainResults.classList.remove('show');
      }
    });
  }

  // 2. Búsqueda en el Catálogo de la Categoría
  var catSearchInput = document.getElementById('catCatalogSearch');
  if (catSearchInput) {
    catSearchInput.addEventListener('input', function () {
      if (currentCategory) {
        renderCategoryProducts(currentCategory, catSearchInput.value);
      }
    });
  }
}

function selectSearchProduct(id, catKey) {
  var mainResults = document.getElementById('searchResults');
  var mainInput = document.getElementById('menuSearch');
  if (mainResults) mainResults.classList.remove('show');
  if (mainInput) mainInput.value = '';

  openCategoryCatalog(catKey);

  setTimeout(function () {
    var card = document.querySelector('.cat-prod-card[data-id="' + id + '"]');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight');
      setTimeout(function () { card.classList.remove('highlight'); }, 2000);
    }
  }, 350);
}

/* ════════════════════════════════════════════
   NAVEGACIÓN MÓVIL INFERIOR & NAVBAR
   ════════════════════════════════════════════ */
function initNavigation() {
  // Sticky navbar & Totop
  var nb = document.getElementById('navbar');
  var tt = document.getElementById('totop');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      if (nb) nb.classList.add('scrolled');
      if (tt) tt.classList.add('show');
    } else {
      if (nb) nb.classList.remove('scrolled');
      if (tt) tt.classList.remove('show');
    }
  }, { passive: true });

  // Sonido
  var sndBtn = document.getElementById('sndbtn');
  if (sndBtn) {
    sndBtn.addEventListener('click', function () {
      soundOn = !soundOn;
      var icon = sndBtn.querySelector('i');
      if (icon) icon.className = soundOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
      pClick();
    });
  }

  // Bottom Nav Buttons
  var bnavCats = document.getElementById('bnavCats');
  if (bnavCats) {
    bnavCats.addEventListener('click', function () {
      closeCategoryCatalog();
      pClick();
    });
  }

  var bnavSearch = document.getElementById('bnavSearch');
  if (bnavSearch) {
    bnavSearch.addEventListener('click', function () {
      var searchInput = document.getElementById('menuSearch');
      if (searchInput) {
        searchInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      pClick();
    });
  }

  var bnavCart = document.getElementById('bnavCart');
  if (bnavCart) {
    bnavCart.addEventListener('click', function () {
      openCart();
    });
  }
}

/* ════════════════════════════════════════════
   INICIALIZACIÓN INMEDIATA (0 ms de espera)
   ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  loadLocal();
  loadTheme();
  applyDarkMode();

  renderCategoryHub();
  updateCartUI();
  initSearch();
  initNavigation();

  var overlay = document.getElementById('cartOverlay');
  if (overlay) overlay.addEventListener('click', closeCart);
});
