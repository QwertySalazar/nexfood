/* NEXFOOD — Generación de Tirilla PDF (80 mm) */
'use strict';

function ticketMadrid() {
  var f = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  var o = {};
  f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
  if (o.hour === '24') o.hour = '00';
  return { fecha: o.day + '/' + o.month + '/' + o.year, hora: o.hour + ':' + o.minute, num: o.day + o.month + '-' + o.hour + o.minute };
}

function ticketEur(x) { return x.toFixed(2).replace('.', ',') + ' €'; }

function ticketWrap(text, width) {
  var words = String(text).split(/\s+/), out = [], cur = '';
  words.forEach(function (w) {
    while (w.length > width) {
      if (cur) { out.push(cur); cur = ''; }
      out.push(w.slice(0, width)); w = w.slice(width);
    }
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= width) cur += ' ' + w;
    else { out.push(cur); cur = w; }
  });
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

function generateOrderPDF(nombre, direccion, piso, cp, telefono, pago, pagaCon, vuelto, notas, items, sub, dom, total, tk) {
  try {
    var jsPDFLib = window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPDFLib) { console.warn('jsPDF no disponible'); return false; }

    var COLS = 46, ML = 5, PW = 80;
    function lr(l, r) { return l + new Array(Math.max(1, COLS - l.length - r.length) + 1).join(' ') + r; }
    function rep(ch) { return new Array(COLS + 1).join(ch); }

    var t = tk || ticketMadrid();
    var L = [];
    function add(txt, st, al, size) { L.push({ t: txt || '', s: st || 'n', a: al || 'l', z: size || 0 }); }
    var BASE = 7.1;                                   /* tamaño normal (pt) */
    function fitPt(len) { return 69 / (Math.max(len, 1) * 0.602 * 0.3528); } /* tamaño máximo que cabe en 69 mm */

    add('TICKET DE PEDIDO', 'big', 'c', 13);
    add('Servicio a Domicilio', 'sm', 'c');
    add();
    add(rep('='));
    add(lr('TIRILLA Nº', t.num), 'b');
    add(lr('FECHA', t.fecha));
    add(lr('HORA (Madrid)', t.hora));
    add(rep('='));
    add();

    /* ════ SECCIÓN REPARTIDOR: DATOS DE ENTREGA ════ */
    add('*** DATOS DE ENTREGA (REPARTIDOR) ***', 'b', 'c', 8.5);
    add(rep('-'));

    add('CLIENTE:', 'b', 'l', 7.5);
    ticketWrap(nombre, Math.floor(COLS / 2) - 1).forEach(function (ln) {
      add(ln.toUpperCase(), 'b', 'l', Math.min(BASE * 2.2, fitPt(ln.length)));
    });
    add();

    add('TELÉFONO (LLAMAR AQUÍ):', 'b', 'l', 7.5);
    add(telefono, 'b', 'l', Math.min(BASE * 2.4, fitPt(telefono.length)));
    add();

    add('DIRECCIÓN DE ENTREGA:', 'b', 'l', 7.5);
    if (direccion) {
      ticketWrap(direccion, Math.floor(COLS / 2) - 1).forEach(function (ln) {
        add(ln.toUpperCase(), 'b', 'l', Math.min(BASE * 2.2, fitPt(ln.length)));
      });
    } else {
      add('(No indicada - consultar con cliente)', 'b', 'l', Math.min(BASE * 1.4, fitPt(36)));
    }

    if (piso) {
      add();
      add('PISO / HABITACIÓN / PUERTA:', 'b', 'l', 8);
      ticketWrap(piso, Math.floor(COLS / 2) - 1).forEach(function (ln) {
        add(ln.toUpperCase(), 'b', 'l', Math.min(BASE * 2.4, fitPt(ln.length)));
      });
    }

    if (cp) {
      add();
      add(lr('CÓDIGO POSTAL:', cp), 'b');
    }

    add();
    add(rep('-'));

    /* ════ SECCIÓN REPARTIDOR: COBRO Y PAGO ════ */
    add('*** FORMA DE PAGO (REPARTIDOR) ***', 'b', 'c', 8.5);
    add(rep('-'));

    var pLower = String(pago || '').toLowerCase();
    var esEfectivo = pLower.indexOf('efectivo') >= 0;
    var esTarjeta = pLower.indexOf('tarjeta') >= 0;
    var esBizum = pLower.indexOf('bizum') >= 0;

    if (esEfectivo) {
      add('FORMA DE PAGO: EFECTIVO', 'b', 'l', 9.5);
      add();
      add(rep('*'));
      add('TOTAL A COBRAR EN EFECTIVO:', 'b', 'c', 10);
      add(ticketEur(total), 'b', 'c', 22); // MONTO FINAL EXTRA GRANDE
      add(rep('*'));
      add();

      if (pagaCon && pagaCon > 0) {
        add(lr('EL CLIENTE PAGA CON:', ticketEur(pagaCon)), 'b', 'l', 9.5);
        add();
        if (vuelto > 0.005) {
          add(rep('='));
          add('>>> COBRAR EFECTIVO Y DAR VUELTO <<<', 'b', 'c', 10.5);
          add('DAR DE VUELTO: ' + ticketEur(vuelto), 'b', 'c', 17); // VUELTO EXTRA GRANDE
          add(rep('='));
        } else {
          add(rep('*'));
          add('>>> COBRAR EFECTIVO: PAGO EXACTO <<<', 'b', 'c', 10.5);
          add('(No requiere cambio / importe exacto)', 'sm', 'c');
          add(rep('*'));
        }
      } else {
        add(rep('*'));
        add('>>> COBRAR EFECTIVO: PAGO EXACTO <<<', 'b', 'c', 10.5);
        add(rep('*'));
      }
    } else if (esTarjeta) {
      add('FORMA DE PAGO: TARJETA (TPV)', 'b', 'l', 9.5);
      add();
      add(rep('*'));
      add('>>> COBRAR CON TARJETA <<<', 'b', 'c', 12);
      add('LLEVAR DATÁFONO / TPV AL CLIENTE', 'b', 'c', 9);
      add();
      add('TOTAL A COBRAR CON TARJETA:', 'b', 'c', 10);
      add(ticketEur(total), 'b', 'c', 22); // MONTO FINAL EXTRA GRANDE
      add(rep('*'));
    } else if (esBizum) {
      add('FORMA DE PAGO: BIZUM', 'b', 'l', 9.5);
      add();
      add(rep('*'));
      add('>>> VERIFICAR EL BIZUM <<<', 'b', 'c', 12);
      add('Comprobar recepción antes de entregar', 'b', 'c', 8.5);
      add();
      add('TOTAL PAGADO POR BIZUM:', 'b', 'c', 10);
      add(ticketEur(total), 'b', 'c', 22); // MONTO FINAL EXTRA GRANDE
      add(rep('*'));
    } else {
      add('FORMA DE PAGO: ' + String(pago).toUpperCase(), 'b', 'l', 9.5);
      add();
      add(rep('*'));
      add('TOTAL: ' + ticketEur(total), 'b', 'c', 22);
      add(rep('*'));
    }
    add();
    add(rep('='));
    add('DESGLOSE DEL PEDIDO', 'b');

    var order = (typeof CATEGORIES !== 'undefined') ? CATEGORIES.map(function (c) { return c.cat; }) : [];
    var groups = {}, seen = [];
    items.forEach(function (it) {
      if (!groups[it.cat]) { groups[it.cat] = []; seen.push(it.cat); }
      groups[it.cat].push(it);
    });
    var cats = seen.slice().sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    cats.forEach(function (cat) {
      add();
      add('[ ' + String(cat).replace('GUARNICION', 'GUARNICIÓN') + ' ]', 'b');
      groups[cat].forEach(function (it) {
        var price = ticketEur(it.total);
        var lines = ticketWrap(it.qty + 'x ' + it.nombre, COLS - price.length - 1);
        add(lr(lines[0], price));
        for (var i = 1; i < lines.length; i++) add('   ' + lines[i]);
      });
    });

    add();
    add(rep('-'));
    add(lr('Subtotal productos', ticketEur(sub)));
    add(lr('Envío domicilio', dom > 0 ? ticketEur(dom) : 'GRATIS'), 'b');
    add(rep('='));
    add('TOTAL DEL PEDIDO:', 'b', 'c', 10.5);
    add(ticketEur(total), 'b', 'c', 22); // MONTO FINAL RESUMEN EXTRA GRANDE
    add(rep('='));
    if (esEfectivo) {
      if (pagaCon && pagaCon > 0) {
        add(lr('Paga con:', ticketEur(pagaCon)), 'b');
        if (vuelto > 0.005) {
          add(lr('DAR DE VUELTO:', ticketEur(vuelto)), 'b', 'l', 11);
        } else {
          add(lr('Vuelto:', '0,00 € (Pago exacto)'), 'b');
        }
      } else {
        add(lr('Cobro:', 'COBRAR EFECTIVO (Exacto)'), 'b');
      }
    } else if (esTarjeta) {
      add(lr('Forma de cobro:', 'COBRAR CON TARJETA (TPV)'), 'b', 'l', 9.5);
    } else if (esBizum) {
      add(lr('Forma de cobro:', 'VERIFICAR EL BIZUM'), 'b', 'l', 9.5);
    } else {
      add(lr('Forma de cobro:', String(pago).toUpperCase()), 'b');
    }
    add(rep('='));
    if (notas) {
      add();
      add(rep('*'));
      add('*** NOTAS / INSTRUCCIONES DEL CLIENTE ***', 'b', 'c', 8.5);
      ticketWrap(notas, COLS).forEach(function (ln) { add(ln, 'b', 'l', 8); });
      add(rep('*'));
    }
    add();
    add('¡Gracias por tu pedido!', 'b', 'c');
    add('Servicio de entrega a domicilio', 'sm', 'c');

    var LH = { big: 6.2, b: 3.6, n: 3.6, sm: 3.3 };
    var H = 10;
    function lineH(l) { return l.z ? l.z * 0.3528 * 1.2 : LH[l.s]; }
    L.forEach(function (l) { H += lineH(l); });
    H += 8;

    var doc = new jsPDFLib({ unit: 'mm', format: [PW, Math.max(H, 50)] });
    var fontName = 'courier';
    try {
      doc.addFileToVFS('TicketMono.ttf', TICKET_FONT_REG);
      doc.addFont('TicketMono.ttf', 'TicketMono', 'normal');
      doc.addFileToVFS('TicketMono-Bold.ttf', TICKET_FONT_BOLD);
      doc.addFont('TicketMono-Bold.ttf', 'TicketMono', 'bold');
      fontName = 'TicketMono';
    } catch (e) { console.warn('fuente tirilla, uso courier:', e); }

    var y = 8;
    L.forEach(function (l) {
      doc.setFont(fontName, (l.s === 'b' || l.s === 'big') ? 'bold' : 'normal');
      doc.setFontSize(l.z ? l.z : (l.s === 'big' ? 13 : (l.s === 'sm' ? 6.2 : 7.1)));
      var h = lineH(l);
      y += h;
      if (l.t) {
        if (l.a === 'c') doc.text(l.t, PW / 2, y - h * 0.25, { align: 'center' });
        else if (l.a === 'r') doc.text(l.t, PW - ML, y - h * 0.25, { align: 'right' });
        else doc.text(l.t, ML, y - h * 0.25);
      }
    });
    doc.save(ticketFileName(t));
    return true;
  } catch (e) { console.error('PDF error:', e); return false; }
}

function ticketFileName(t) { return 'Tirilla-' + t.num + '.pdf'; }
