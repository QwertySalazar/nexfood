/* ════════════════════════════════════════════
   NEXFOOD 24 HORAS — Tramitación de Pedido (Checkout)
   ════════════════════════════════════════════ */
'use strict';

var pendingWaUrl = '';
var cobrarEnvio = true;

function getShippingCost() {
  if (!cobrarEnvio) return 0;
  return typeof DOMICILIO_COST !== 'undefined' ? DOMICILIO_COST : 3.99;
}

function toggleCobrarEnvio() {
  var check = document.getElementById('coCobrarEnvio');
  if (check) cobrarEnvio = check.checked;
  renderCheckoutSummary();
  pClick();
}

function toggleNoteChip(el) {
  el.classList.toggle('active');
  pClick();
}

function getSelectedNotes() {
  var selected = [];
  document.querySelectorAll('.co-note-chip.active').forEach(function (chip) {
    selected.push(chip.getAttribute('data-note'));
  });
  var custom = document.getElementById('coNotas') ? document.getElementById('coNotas').value.trim() : '';
  
  var parts = [];
  if (selected.length > 0) {
    parts.push(selected.join(', '));
  }
  if (custom) {
    parts.push(custom);
  }
  return parts.join(' | ');
}

function openCheckout() {
  if (cartCount() === 0) {
    alert('Tu carrito está vacío. Agrega productos antes de continuar.');
    return;
  }
  closeCart();
  var modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('show');
  
  // Asegurar estado inicial del check de envío
  var checkEnvio = document.getElementById('coCobrarEnvio');
  if (checkEnvio) checkEnvio.checked = cobrarEnvio;

  renderCheckoutSummary();
  pClick();
}

function closeCheckout() {
  var modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('show');
}

function renderCheckoutSummary() {
  var sub = cartSubtotal();
  var dom = getShippingCost();
  var total = sub + dom;

  var subEl = document.getElementById('coSubtotal');
  var domEl = document.getElementById('coDomicilio');
  var totEl = document.getElementById('coTotal');
  var countEl = document.getElementById('coItemCount');
  var descEl = document.getElementById('coShippingDesc');

  if (subEl) subEl.textContent = fmt(sub);
  if (domEl) {
    if (dom === 0) {
      domEl.innerHTML = '<span class="co-free-badge">GRATIS</span>';
    } else {
      domEl.textContent = fmt(dom);
    }
  }
  if (totEl) totEl.textContent = fmt(total);
  if (countEl) countEl.textContent = cartCount();
  if (descEl) {
    descEl.textContent = dom === 0
      ? 'Envío sin coste (Gratis o Recogida en local)'
      : 'Incluye entrega en moto por ' + fmt(dom) + ' (desmarca para envío gratis o recoger)';
  }

  var ageBox = document.getElementById('ageCheckRow');
  if (ageBox) ageBox.style.display = cartHasRegulated() ? 'flex' : 'none';

  var pagoSel = document.getElementById('coPago');
  if (pagoSel && pagoSel.value === 'Efectivo') {
    renderCashPresets();
  }
}

function onPaymentChange() {
  var pago = document.getElementById('coPago').value;
  var box = document.getElementById('coEfectivoBox');
  if (!box) return;
  if (pago === 'Efectivo') {
    box.style.display = 'block';
    renderCashPresets();
  } else {
    box.style.display = 'none';
  }
  pClick();
}

function renderCashPresets() {
  var sub = cartSubtotal();
  var dom = getShippingCost();
  var total = sub + dom;
  var container = document.getElementById('coCashPresets');
  var input = document.getElementById('coPagaCon');
  if (!container || !input) return;

  container.innerHTML = '';

  var presets = [
    { label: 'Exacto (' + fmt(total) + ')', val: total }
  ];

  var bills = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100];
  bills.forEach(function (b) {
    if (b > total && presets.length < 5) {
      presets.push({ label: b + ' €', val: b });
    }
  });

  var curVal = parseFloat(String(input.value).replace(',', '.'));

  presets.forEach(function (p, i) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'co-cash-chip';
    chip.textContent = p.label;
    if ((!isNaN(curVal) && Math.abs(curVal - p.val) < 0.01) || (isNaN(curVal) && i === 0)) {
      chip.classList.add('active');
    }
    chip.onclick = function () {
      input.value = p.val.toFixed(2);
      document.querySelectorAll('.co-cash-chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      updateChangeCalc();
      pClick();
    };
    container.appendChild(chip);
  });

  if (!input.value || isNaN(parseFloat(String(input.value).replace(',', '.')))) {
    input.value = total.toFixed(2);
    if (container.firstChild) container.firstChild.classList.add('active');
  }

  updateChangeCalc();
}

function onPagaConInput() {
  document.querySelectorAll('.co-cash-chip').forEach(function (c) {
    c.classList.remove('active');
  });
  updateChangeCalc();
}

function updateChangeCalc() {
  var sub = cartSubtotal();
  var dom = getShippingCost();
  var total = sub + dom;
  var input = document.getElementById('coPagaCon');
  var info = document.getElementById('coCambioInfo');
  if (!info || !input) return;

  var val = parseFloat(String(input.value).replace(',', '.'));
  if (isNaN(val) || val <= 0) {
    info.className = 'co-cambio-info warn';
    info.style.display = 'block';
    info.innerHTML = '⚠️ Por favor indica con cuánto vas a abonar.';
    return;
  }

  if (val < total - 0.009) {
    info.className = 'co-cambio-info warn';
    info.style.display = 'block';
    info.innerHTML = '⚠️ El monto ingresado (' + fmt(val) + ') es menor al total del pedido (' + fmt(total) + ').';
  } else {
    var vuelto = Math.max(0, val - total);
    info.className = 'co-cambio-info ok';
    info.style.display = 'block';
    if (vuelto < 0.005) {
      info.innerHTML = '💵 <strong>Pago exacto: ' + fmt(val) + '</strong><br><span style="font-size:0.84rem;color:inherit;opacity:0.85;">El repartidor NO necesita llevar cambio.</span>';
    } else {
      info.innerHTML = '💵 <strong>Pagas con: ' + fmt(val) + '</strong>' +
        '<span class="co-vuelto-pill">🪙 VUELTO AL CLIENTE: ' + fmt(vuelto) + '</span>';
    }
  }
}

function sendOrderWhatsApp() {
  var nombre = document.getElementById('coNombre').value.trim();
  var telefono = document.getElementById('coTelefono').value.trim();
  var direccion = document.getElementById('coDireccion').value.trim();
  var pisoEl = document.getElementById('coPiso');
  var piso = pisoEl ? pisoEl.value.trim() : '';
  var cp = document.getElementById('coCP').value.trim();
  var pago = document.getElementById('coPago').value;
  var notas = getSelectedNotes();

  // Validación: Nombre obligatorio
  if (!nombre) {
    alert('Por favor completa tu nombre.');
    document.getElementById('coNombre').focus();
    return;
  }
  // Validación: Celular obligatorio
  if (!telefono) {
    alert('Por favor ingresa tu número de celular para que el repartidor pueda contactarte.');
    document.getElementById('coTelefono').focus();
    return;
  }
  // Validación: Dirección de entrega obligatoria
  if (!direccion) {
    alert('Por favor ingresa la dirección de entrega obligatoria.');
    document.getElementById('coDireccion').focus();
    return;
  }
  // Validación: Medio de pago obligatorio
  if (!pago) {
    alert('Por favor elige el método de pago (Efectivo, Tarjeta o Bizum).');
    document.getElementById('coPago').focus();
    return;
  }

  var sub = cartSubtotal();
  var dom = getShippingCost();
  var total = sub + dom;

  var esEfectivo = String(pago).toLowerCase().indexOf('efectivo') >= 0;
  var pagaCon = 0;
  var vuelto = 0;

  if (esEfectivo) {
    var pagaInput = document.getElementById('coPagaCon');
    var pVal = pagaInput ? parseFloat(String(pagaInput.value).replace(',', '.')) : 0;
    if (isNaN(pVal) || pVal <= 0) {
      pagaCon = total;
    } else {
      pagaCon = pVal;
    }
    if (pagaCon < total - 0.009) {
      alert('El monto con el que pagas (' + fmt(pagaCon) + ') es menor que el total del pedido (' + fmt(total) + '). Por favor ingresa un monto mayor o igual.');
      if (pagaInput) pagaInput.focus();
      return;
    }
    vuelto = Math.max(0, pagaCon - total);
  }

  if (cartHasRegulated()) {
    var ageCheck = document.getElementById('ageConfirm');
    if (ageCheck && !ageCheck.checked) {
      alert('Tu pedido incluye bebidas alcohólicas o tabaco. Por favor confirma que eres mayor de edad.');
      return;
    }
  }

  var pdfItems = [];
  var lines = [];
  lines.push('🍔 *NUEVO PEDIDO*');
  lines.push('');
  lines.push('👤 *CLIENTE:* ' + nombre.toUpperCase());
  lines.push('📱 *TELÉFONO REPARTIDOR:* ' + telefono);
  lines.push('📍 *DIRECCIÓN DE ENTREGA:* ' + direccion);
  if (piso) lines.push('🚪 *PISO / HABITACIÓN:* ' + piso.toUpperCase());
  if (cp) lines.push('📮 *CÓDIGO POSTAL:* ' + cp);
  var pLower = String(pago || '').toLowerCase();
  var esEfectivo = pLower.indexOf('efectivo') >= 0;
  var esTarjeta = pLower.indexOf('tarjeta') >= 0;
  var esBizum = pLower.indexOf('bizum') >= 0;

  var tk = ticketMadrid();
  lines.push('🧾 *Tirilla N°:* ' + tk.num);
  lines.push('');
  lines.push('🧾 *DESGLOSE DEL PEDIDO:*');
  Object.keys(cart).forEach(function (idStr) {
    var id = parseInt(idStr, 10);
    var p = getProduct(id);
    if (!p) return;
    var qty = cart[idStr];
    var itemTotal = p.precio * qty;
    lines.push('• ' + qty + 'x ' + p.nombre + ' — ' + fmt(itemTotal));
    pdfItems.push({ cat: p.cat, nombre: p.nombre, qty: qty, total: itemTotal });
  });
  lines.push('');
  lines.push('Subtotal: ' + fmt(sub));
  lines.push('Envío: ' + (dom > 0 ? fmt(dom) : 'GRATIS'));
  lines.push('💰 *TOTAL DEL PEDIDO: ' + fmt(total) + '*');
  lines.push('');
  if (esEfectivo) {
    lines.push('💵 *FORMA DE COBRO: EFECTIVO*');
    if (pagaCon && pagaCon > 0 && vuelto > 0.005) {
      lines.push('💵 El cliente paga con: ' + fmt(pagaCon));
      lines.push('🪙 *>>> COBRAR EFECTIVO Y DAR VUELTO: ' + fmt(vuelto) + ' <<<*');
    } else {
      if (pagaCon && pagaCon > 0) lines.push('💵 El cliente paga con: ' + fmt(pagaCon));
      lines.push('🪙 *>>> COBRAR EFECTIVO: PAGO EXACTO (Sin vuelto) <<<*');
    }
  } else if (esTarjeta) {
    lines.push('💳 *FORMA DE COBRO: TARJETA*');
    lines.push('💳 *>>> COBRAR CON TARJETA (Llevar datáfono/TPV) <<<*');
  } else if (esBizum) {
    lines.push('📱 *FORMA DE COBRO: BIZUM*');
    lines.push('📱 *>>> VERIFICAR EL BIZUM (Comprobar recepción) <<<*');
  } else {
    lines.push('💳 *FORMA DE COBRO:* ' + pago.toUpperCase());
  }
  if (notas) {
    lines.push('');
    lines.push('📝 *NOTAS / INSTRUCCIONES:* ' + notas);
  }
  lines.push('');
  lines.push('_Pedido generado desde el Menú Digital_');

  saveOrderHistory({
    date: new Date().toISOString(),
    nombre: nombre,
    telefono: telefono,
    direccion: direccion,
    piso: piso,
    pago: pago,
    pagaCon: pagaCon,
    vuelto: vuelto,
    dom: dom,
    total: total,
    notas: notas,
    items: Object.keys(cart).map(function (id) { return { id: parseInt(id, 10), qty: cart[id] }; })
  });

  var pdfOk = generateOrderPDF(nombre, direccion, piso, cp, telefono, pago, pagaCon, vuelto, notas, pdfItems, sub, dom, total, tk);

  var cobroLine = '';
  if (esEfectivo) {
    cobroLine = '💵 *FORMA DE COBRO: EFECTIVO*\n' +
      (pagaCon && pagaCon > 0 ? ('💵 *Paga con:* ' + fmt(pagaCon) + '\n') : '') +
      (vuelto > 0.005 ? ('🪙 *>>> COBRAR EFECTIVO Y DAR VUELTO: ' + fmt(vuelto) + ' <<<*\n') : '🪙 *>>> COBRAR EFECTIVO: PAGO EXACTO (Sin vuelto) <<<*\n');
  } else if (esTarjeta) {
    cobroLine = '💳 *FORMA DE COBRO: TARJETA*\n' +
      '💳 *>>> COBRAR CON TARJETA (Llevar datáfono/TPV) <<<*\n';
  } else if (esBizum) {
    cobroLine = '📱 *FORMA DE COBRO: BIZUM*\n' +
      '📱 *>>> VERIFICAR EL BIZUM (Comprobar recepción) <<<*\n';
  } else {
    cobroLine = '💳 *FORMA DE COBRO:* ' + pago.toUpperCase() + '\n';
  }

  var attachMsg = '🍔 *NUEVO PEDIDO*\n' +
    '👤 *CLIENTE:* ' + nombre.toUpperCase() + '\n' +
    '📱 *TELÉFONO:* ' + telefono + '\n' +
    '📍 *DIRECCIÓN:* ' + direccion + '\n' +
    (piso ? ('🚪 *PISO / HAB:* ' + piso.toUpperCase() + '\n') : '') +
    '🛵 *ENVÍO:* ' + (dom > 0 ? fmt(dom) : 'GRATIS') + '\n' +
    '💰 *TOTAL FINAL: ' + fmt(total) + '*\n' +
    cobroLine +
    (notas ? ('📝 *NOTAS:* ' + notas + '\n\n') : '\n') +
    '📎 Envíanos con este mensaje el PDF de tu tirilla descargada (' + ticketFileName(tk) + '). Toca el clip 📎, elige Documento y selecciónalo.';
  var message = pdfOk ? attachMsg : lines.join('\n');
  var waNum = typeof WA_NUMBER !== 'undefined' ? WA_NUMBER : '34650362108';
  pendingWaUrl = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(message);

  showOrderConfirmation(pdfOk, ticketFileName(tk));
}

function showOrderConfirmation(pdfOk, fileName) {
  closeCheckout();
  var conf = document.getElementById('orderConfirmation');
  var title = document.getElementById('ocTitle');
  var msgEl = document.getElementById('ocPdfMsg');
  var fileEl = document.getElementById('ocFile');
  if (title) title.textContent = pdfOk ? 'Tu tirilla se descargó' : '¡Pedido listo!';
  if (msgEl) msgEl.textContent = pdfOk
    ? 'Ahora pulsa Abrir WhatsApp y adjunta el PDF antes de enviar el mensaje.'
    : 'Pulsa Abrir WhatsApp para enviarnos tu pedido.';
  if (fileEl) fileEl.textContent = pdfOk ? 'Archivo: ' + fileName : '';
  if (conf) conf.classList.add('show');
}

function closeOrderConfirmation(clearCart) {
  var conf = document.getElementById('orderConfirmation');
  if (conf) conf.classList.remove('show');
  if (clearCart) {
    cart = {};
    updateCartUI();
    if (typeof refreshAllProductCards === 'function') refreshAllProductCards();
  }
}

function openWhatsAppOrder() {
  if (pendingWaUrl) window.open(pendingWaUrl, '_blank');
  closeOrderConfirmation(true);
}
