// Asistente (v160): el presupuesto paso a paso para quien empieza, sin tocar los cálculos.
//  1 Cliente · 2 Muebles · 3 Transporte e imágenes · 4 Colores · 5 Revisar y enviar
// Cada paso dice qué hacer ahí. Abajo, «Atrás» y «Siguiente». Con «Ver todo junto» se ve la página entera como antes
// (se recuerda en este ordenador). También: «Guardar» siempre a la vista, «Ajustes avanzados» (Catálogo y Configuración,
// con aviso), «Letra grande», textos en los botones de iconos, los detalles técnicos de cada grupo plegados,
// una bienvenida la primera vez y un presupuesto de ejemplo para practicar.
(function () {
  'use strict';
  var LS_TODO = 'asis_ver_todo', LS_LETRA = 'asis_letra_grande', LS_HOLA = 'asis_bienvenida_v1', LS_PASO = 'asis_paso';
  var PASOS = [
    { id: 'cliente', t: 'Cliente', ayuda: 'Escribe el nombre del cliente y, si los tienes, su dirección y teléfono. La fecha ya está puesta. Luego pulsa «Siguiente».' },
    { id: 'muebles', t: 'Muebles', ayuda: 'Los muebles van en grupos (por ejemplo «Bajos» y «Altos»). En cada grupo elige la calidad y añade los muebles: tipo, modelo y medida, y pulsa «Añadir mueble». Para otra cosa (electrodomésticos, extras, armario) pulsa «+ Nuevo grupo».' },
    { id: 'otros', t: 'Transporte e imágenes', ayuda: 'Si hay transporte, escribe lo que cuesta. La instalación se calcula sola. Puedes añadir fotos o planos del diseño: salen en el PDF.' },
    { id: 'colores', t: 'Colores', ayuda: 'Abre la guía de colores para enseñar al cliente hasta cinco propuestas (distintas en cada estilo) con su suelo y su cocina. La que elija queda guardada en el presupuesto y sale en el PDF.' },
    { id: 'enviar', t: 'Revisar y enviar', ayuda: 'Comprueba el total y las condiciones. Guarda el presupuesto y sácalo en PDF para el cliente, o envíalo por WhatsApp o email.' },
  ];
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} },
  };
  var $ = function (id) { return document.getElementById(id); };
  var eh = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pb, paso = 0, montado = false;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'onclick') e.onclick = attrs[k]; else e.setAttribute(k, attrs[k]); });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function montar() {
    pb = $('pb');
    if (!pb || montado) return;
    montado = true;
    document.body.classList.add('asis');
    var cards = Array.prototype.filter.call(pb.children, function (c) { return c.classList.contains('card'); });
    var datos = cards[0], grupos = cards[1], costes = cards[2], imagenes = cards[3];
    if (!datos || !grupos) return;
    datos.setAttribute('data-paso', '0');
    grupos.setAttribute('data-paso', '1');
    if (costes) costes.setAttribute('data-paso', '2');
    if (imagenes) imagenes.setAttribute('data-paso', '2');

    // Paso 1: para seguir con uno que ya existe.
    var abrirG = el('div', { class: 'asis-abrir' });
    abrirG.innerHTML = '<span>¿Es un presupuesto que ya empezaste?</span> <button type="button" class="btn bgh" id="ASIS-ABRIR-GUARDADO">&#x1F4C2; Abrir un presupuesto guardado</button>';
    var ctD = datos.querySelector('.ct'); (ctD ? ctD.parentNode : datos).insertBefore(abrirG, ctD ? ctD.nextSibling : datos.firstChild);
    $('ASIS-ABRIR-GUARDADO').onclick = function () { if (typeof openHistory === 'function') openHistory(); };
    // Paso 2: qué es cada calidad (de la lista de modelos de la tarifa).
    var cals = el('details', { class: 'asis-calidades', id: 'ASIS-CALIDADES' });
    cals.innerHTML = '<summary>&#x2753; ¿Qué es cada calidad?</summary><div></div>';
    var ctG = grupos.querySelector('.ct'); (ctG ? ctG.parentNode : grupos).insertBefore(cals, ctG ? ctG.nextSibling : grupos.firstChild);
    cals.lastChild.innerHTML = textoCalidades();
    cals.addEventListener('toggle', function () { if (cals.open) cals.lastChild.innerHTML = textoCalidades(); });

    // Paso 4: colores.
    var colores = el('div', { class: 'card', 'data-paso': '3', id: 'ASIS-COLORES' });
    colores.innerHTML = '<div class="ct">&#x1F3A8; Colores de la cocina</div><div id="ASIS-COL-RES" class="asis-col-res"></div>'
      + '<button type="button" class="btn bp asis-grande" id="ASIS-ABRIR-COLORES">&#x1F3A8; Abrir la guía de colores</button>';
    // Paso 5: revisar y enviar (se mueven aquí IVA, validez, entrega, señal, estado y los textos del PDF).
    var enviar = el('div', { class: 'card', 'data-paso': '4', id: 'ASIS-ENVIAR' });
    enviar.innerHTML = '<div class="ct">&#x2705; Revisar y enviar</div>'
      + '<div class="asis-aviso" id="ASIS-AVISO" hidden></div>'
      + '<div class="asis-total" id="ASIS-TOTAL"></div>'
      + '<div class="asis-cond"><div class="asis-sub">Condiciones</div><div class="g4 asis-campos" id="ASIS-CAMPOS"></div></div>'
      + '<div id="ASIS-PDF"></div>'
      + '<div class="asis-sub">Y ahora</div>'
      + '<div class="asis-acciones">'
      + '<button type="button" class="btn bp asis-grande" data-asis="guardar">&#x1F4BE; Guardar el presupuesto</button>'
      + '<button type="button" class="btn bgold asis-grande" data-asis="pdf">&#x1F4C4; PDF para el cliente</button>'
      + '<button type="button" class="btn bgh asis-grande" data-asis="whatsapp">&#x1F4AC; Enviar por WhatsApp</button>'
      + '<button type="button" class="btn bgh asis-grande" data-asis="email">&#x2709;&#xFE0F; Enviar por email</button>'
      + '<button type="button" class="btn bgh asis-grande" data-asis="taller">&#x1F4CB; Ficha de taller (sin precios)</button>'
      + '<button type="button" class="btn bgh asis-grande hide-cliente" data-asis="rentabilidad">&#x1F4CA; Rentabilidad (privado)</button>'
      + '<button type="button" class="btn bgh asis-grande hide-cliente" data-asis="comparar">&#x2696; Comparar calidades</button>'
      + '</div>';
    var ultimo = imagenes || costes || grupos;
    ultimo.parentNode.insertBefore(colores, ultimo.nextSibling);
    colores.parentNode.insertBefore(enviar, colores.nextSibling);
    var campos = $('ASIS-CAMPOS');
    ['F-IVA', 'F-ELECTRO-IVA', 'F-VALIDEZ', 'F-PLAZO', 'F-SENAL', 'F-ESTADO'].forEach(function (id) {
      var i = $(id); if (!i) return;
      var g4 = datos.querySelector('.g4'), caja = i;
      while (caja && caja.parentNode !== g4) caja = caja.parentNode;
      if (caja) campos.appendChild(caja);
    });
    var det = $('PDF-DETALLE'); if (det && det.parentNode) $('ASIS-PDF').appendChild(det.parentNode);
    var txt = $('TXTPDF'); if (txt) $('ASIS-PDF').appendChild(txt);
    var acc = { guardar: function () { guardarProyecto(); }, pdf: function () { showPDF(); }, whatsapp: function () { compartirWhatsApp(); }, email: function () { compartirEmail(); },
      taller: function () { fichaTaller(); }, rentabilidad: function () { openRentabilidad(); }, comparar: function () { openComparador(); } };
    enviar.querySelectorAll('[data-asis]').forEach(function (b) { b.onclick = function () { var f = acc[b.dataset.asis]; if (f) f(); }; });
    $('ASIS-ABRIR-COLORES').onclick = function () { if (window.abrirGuiaColores) abrirGuiaColores(); };

    // Barra de pasos (arriba) y botones Atrás / Siguiente (abajo).
    var barra = el('div', { class: 'asis-pasos', id: 'ASIS-PASOS', role: 'navigation', 'aria-label': 'Pasos del presupuesto' });
    barra.innerHTML = '<ol>' + PASOS.map(function (p, i) { return '<li><button type="button" data-ir="' + i + '"><span class="asis-num">' + (i + 1) + '</span>' + p.t + '</button></li>'; }).join('') + '</ol>'
      + '<button type="button" class="asis-vertodo" id="ASIS-VERTODO"></button>';
    var ayuda = el('div', { class: 'asis-ayuda', id: 'ASIS-AYUDA' });
    // Banda fija mientras se practica con el presupuesto de ejemplo (que no se confunda con uno de verdad).
    var bandaEj = el('div', { class: 'asis-ejemplo', id: 'ASIS-EJEMPLO', hidden: 'hidden' });
    bandaEj.innerHTML = '&#x1F393; <b>Presupuesto de EJEMPLO</b> para practicar: no es de ningún cliente. Cuando acabes, «Nuevo presupuesto» para empezar uno de verdad.';
    var ban = pb.querySelector('.ban');
    ban.parentNode.insertBefore(barra, ban.nextSibling);
    barra.parentNode.insertBefore(bandaEj, barra.nextSibling);
    bandaEj.parentNode.insertBefore(ayuda, bandaEj.nextSibling);
    var pie = el('div', { class: 'asis-pie', id: 'ASIS-PIE' });
    pie.innerHTML = '<button type="button" class="btn bgh asis-grande" id="ASIS-ATRAS">&#x2190; Atrás</button><button type="button" class="btn bp asis-grande" id="ASIS-SIGUIENTE">Siguiente &#x2192;</button>';
    pb.appendChild(pie);
    barra.querySelectorAll('[data-ir]').forEach(function (b) { b.onclick = function () { ir(+b.dataset.ir); }; });
    $('ASIS-ATRAS').onclick = function () { ir(paso - 1); };
    $('ASIS-SIGUIENTE').onclick = function () { ir(paso + 1); };
    $('ASIS-VERTODO').onclick = function () { ls.set(LS_TODO, document.body.classList.contains('asis-todo') ? null : '1'); aplicarTodo(); };

    // «Guardar» siempre a la vista, junto al total.
    var ba = pb.querySelector('.ba');
    if (ba) {
      var g = el('button', { type: 'button', class: 'btn bp asis-guardar', id: 'ASIS-GUARDAR', title: 'Guarda este presupuesto para seguir otro día' }, '&#x1F4BE; Guardar');
      g.onclick = function () { guardarProyecto(); };
      ba.insertBefore(g, ba.firstChild);
    }
    navegacion();
    simplificarGrupos();
    paso = Math.max(0, Math.min(PASOS.length - 1, parseInt(ls.get(LS_PASO) || '0', 10) || 0));
    aplicarTodo();
    ir(paso, true);
    letra(ls.get(LS_LETRA) === '1');
    if (!ls.get(LS_HOLA)) setTimeout(bienvenida, 600);
    setInterval(refrescar, 1500);
  }

  function aplicarTodo() {
    var todo = ls.get(LS_TODO) === '1';
    document.body.classList.toggle('asis-todo', todo);
    $('ASIS-VERTODO').innerHTML = todo ? '&#x1F9ED; Volver al paso a paso' : '&#x1F4C4; Ver todo junto';
    ir(paso, true);
  }
  function ir(n, sinScroll) {
    paso = Math.max(0, Math.min(PASOS.length - 1, n));
    ls.set(LS_PASO, String(paso));
    pb.setAttribute('data-paso-actual', String(paso));
    $('ASIS-PASOS').querySelectorAll('[data-ir]').forEach(function (b, i) { b.classList.toggle('on', i === paso); b.classList.toggle('hecho', i < paso); b.setAttribute('aria-current', i === paso ? 'step' : 'false'); });
    var p = PASOS[paso], todo = document.body.classList.contains('asis-todo');
    $('ASIS-AYUDA').innerHTML = todo ? '' : '<b>Paso ' + (paso + 1) + ' de ' + PASOS.length + ': ' + p.t + '.</b> ' + p.ayuda + ' <a href="guia-uso.html#' + p.id + '" target="_blank" rel="noopener" class="asis-masayuda">Más ayuda</a>';
    $('ASIS-ATRAS').style.visibility = paso === 0 ? 'hidden' : 'visible';
    var sig = $('ASIS-SIGUIENTE');
    sig.style.visibility = paso === PASOS.length - 1 ? 'hidden' : 'visible';
    if (paso < PASOS.length - 1) sig.innerHTML = 'Siguiente: ' + PASOS[paso + 1].t + ' &#x2192;';
    if (todo) { var c = pb.querySelector('[data-paso="' + paso + '"]'); if (c && !sinScroll) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (!sinScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    refrescar();
  }

  // Lo que se ve en los pasos 4 y 5 (la elegida y el total), al día.
  function refrescar() {
    if (!montado) return;
    var bEj = $('ASIS-EJEMPLO'); if (bEj) bEj.hidden = !(window.ST && ST._ejemplo && $('FC') && $('FC').value === 'Cliente de ejemplo');
    var col = window.ST && ST.colores, r = $('ASIS-COL-RES');
    if (r) r.innerHTML = col ? '<p>Elegida: <b>' + eh(col.titulo) + '</b> · bajos ' + eh((col.bajos || {}).nombre) + (col.altos && col.bajos && col.altos.id !== col.bajos.id ? ', altos ' + eh(col.altos.nombre) : '') + (col.encimera ? ', encimera ' + eh(col.encimera.nombre) : '') + '.</p>'
      : '<p class="mut">Aún no hay colores elegidos. No es obligatorio: si el cliente ya lo tiene claro, pasa al siguiente paso.</p>';
    var av = $('ASIS-AVISO');
    if (av) {
      var falta = [];
      if (!($('FC') && $('FC').value.trim())) falta.push('<li>Falta el <b>nombre del cliente</b>. <button type="button" class="btn bgh bsm" data-ir-a="0">Ir al paso 1</button></li>');
      if (typeof totalL === 'function' && !totalL()) falta.push('<li>No hay <b>ningún mueble</b>. <button type="button" class="btn bgh bsm" data-ir-a="1">Ir al paso 2</button></li>');
      av.hidden = !falta.length;
      av.innerHTML = falta.length ? '<b>&#x26A0; Antes de enviarlo:</b><ul>' + falta.join('') + '</ul>' : '';
      av.querySelectorAll('[data-ir-a]').forEach(function (b) { b.onclick = function () { ir(+b.dataset.irA); }; });
    }
    var t = $('ASIS-TOTAL'), bto = $('BTO'), biv = $('BIV'), bco = $('BCO');
    if (t && bto) t.innerHTML = '<div><span>Muebles</span><b>' + (bco ? bco.textContent : '') + '</b></div><div><span>Total sin IVA</span><b>' + bto.textContent + '</b></div><div><span>Total con IVA</span><b class="asis-final">' + (biv ? biv.textContent : '') + '</b></div>';
    var sg = $('ASIS-GUARDAR'), dirty = $('dirty-ind');
    if (sg && dirty) sg.classList.toggle('pendiente', dirty.style.display !== 'none');
  }

  // Menú de arriba: «Buscar una función», «Ajustes avanzados» y «Letra grande».
  function navegacion() {
    var todoBtn = $('ntodo'); if (todoBtn) { todoBtn.innerHTML = '&#x1F50D; Buscar una función'; todoBtn.title = 'Busca cualquier cosa que haga la app (PDF, herrajes, copia, IVA…)'; }
    var nc = $('nc'), ns = $('ns'), nav = nc && nc.parentNode;
    if (!nav) return;
    nc.classList.add('asis-oculto'); ns.classList.add('asis-oculto');
    var av = el('button', { type: 'button', id: 'nadv', class: 'hide-cliente', title: 'Catálogo de precios y configuración' }, '&#x2699;&#xFE0F; Ajustes avanzados');
    av.onclick = avisoAvanzados;
    nav.insertBefore(av, todoBtn);
    var lg = el('button', { type: 'button', id: 'nletra', title: 'Agranda o reduce la letra en este ordenador' }, 'A+ Letra grande');
    lg.onclick = function () { letra(!document.body.classList.contains('asis-letra')); };
    nav.insertBefore(lg, $('nclient'));
    // Al volver de Catálogo o Configuración se marca «Presupuesto».
  }
  function letra(on) {
    document.body.classList.toggle('asis-letra', on);
    ls.set(LS_LETRA, on ? '1' : null);
    var b = $('nletra'); if (b) b.innerHTML = on ? 'A&#x2212; Letra normal' : 'A+ Letra grande';
  }
  function modal(html, botones) {
    var m = el('div', { class: 'asis-modal', role: 'dialog', 'aria-modal': 'true' });
    m.innerHTML = '<div class="asis-caja">' + html + '<div class="asis-botones"></div></div>';
    var zona = m.querySelector('.asis-botones');
    botones.forEach(function (b) { var x = el('button', { type: 'button', class: 'btn asis-grande ' + (b.clase || 'bgh') }, b.t); x.onclick = function () { m.remove(); if (b.f) b.f(); }; zona.appendChild(x); });
    m.addEventListener('click', function (ev) { if (ev.target === m) m.remove(); });
    document.body.appendChild(m);
    var primero = zona.querySelector('button'); if (primero) primero.focus();
    return m;
  }
  function avisoAvanzados() {
    modal('<h2>&#x2699;&#xFE0F; Ajustes avanzados</h2><p>Aquí están los <b>precios del catálogo</b> y la <b>configuración</b> (márgenes, extras, plantilla Excel, datos de la empresa). Un cambio aquí afecta a <b>todos los presupuestos</b>.</p><p>Si solo vas a hacer un presupuesto, no hace falta entrar.</p>', [
      { t: '&#x1F4DA; Catálogo de precios', clase: 'bgh', f: function () { go('c'); } },
      { t: '&#x2699;&#xFE0F; Configuración', clase: 'bgh', f: function () { go('s'); } },
      { t: 'Volver al presupuesto', clase: 'bp' },
    ]);
  }

  // Bienvenida la primera vez.
  function bienvenida() {
    ls.set(LS_HOLA, '1');
    modal('<h2>Bienvenido al presupuestador</h2><p>Un presupuesto se hace en <b>5 pasos</b>, que ves arriba:</p><ol class="asis-lista">'
      + PASOS.map(function (p) { return '<li><b>' + p.t + '</b></li>'; }).join('') + '</ol>'
      + '<p>En cada paso hay una explicación. Pasa de uno a otro con <b>«Siguiente»</b>. Lo que hagas se guarda con <b>«Guardar»</b>, arriba a la derecha.</p>'
      + '<p>Si quieres practicar sin miedo, abre un <b>presupuesto de ejemplo</b>: no se guarda si no lo guardas tú.</p>', [
      { t: 'Empezar', clase: 'bp' },
      { t: '&#x1F9EA; Practicar con un ejemplo', clase: 'bgh', f: ejemplo },
      { t: '&#x1F4D6; Guía de uso', clase: 'bgh', f: function () { window.open('guia-uso.html', '_blank', 'noopener'); } },
    ]);
  }
  window.asisBienvenida = bienvenida;

  // Cada calidad (grupo de precio) con las marcas y modelos de puertas que entran, de menos a más precio.
  function textoCalidades() {
    var cals = window.CALS || [], mg = window.MODELOS_GRUPOS || [];
    var nombre = function (m) { return String(m).toLowerCase().replace(/(^|\s)\S/g, function (x) { return x.toUpperCase(); }); };
    return '<p>De menos a más precio. La calidad es la de las <b>puertas</b>; el mueble por dentro es el mismo.</p><ol>' + cals.map(function (c, i) {
      var ms = mg.filter(function (m) { return m.g === i + 1 && m.f; }), marcas = [];
      ms.forEach(function (m) { var n = nombre(m.marca); if (marcas.indexOf(n) < 0) marcas.push(n); });
      return '<li><b>' + eh(c) + '</b>' + (ms.length ? ': ' + ms.length + ' modelos de ' + eh(marcas.join(', ')) : '') + '</li>';
    }).join('') + '</ol>';
  }
  window.asisCalidades = textoCalidades;

  // Presupuesto de ejemplo: unos muebles del catálogo en un grupo, para practicar.
  function ejemplo() {
    if (typeof totalL === 'function' && totalL() && !confirm('Tienes un presupuesto abierto. ¿Lo cambias por el de ejemplo? (Si no lo has guardado, se pierde.)')) return;
    var cat = window.CAT_MODULES || {}, quiero = [['BAJO', /2 PUERTAS/, '80'], ['BAJO', /1 PUERTA/, '60'], ['FREGADERO', /./, '80'], ['ALTO', /2 PUERTAS/, '80'], ['COLUMNA', /./, '60']];
    var lineas = [];
    quiero.forEach(function (q) {
      var tipo = Object.keys(cat).filter(function (k) { return k.indexOf(q[0]) === 0; })[0]; if (!tipo) return;
      var mo = Object.keys(cat[tipo]).filter(function (k) { return q[1].test(k); })[0] || Object.keys(cat[tipo])[0]; if (!mo) return;
      var meds = cat[tipo][mo] || [], med = meds.indexOf(q[2]) >= 0 ? q[2] : meds[0]; if (!med) return;
      lineas.push({ id: nid(), m: tipo, mo: mo, med: String(med), und: 1, extras: [] });
    });
    var cal = (window.CALS || [])[1] || 'BÁSICO';
    ST.groups = [{ id: nid(), name: 'Cocina de ejemplo', tipo: 'muebles', cal: cal, ci: 0, lines: lineas, open: true, casco: typeof cascoNuevo === 'function' ? cascoNuevo() : undefined, herr: typeof herrNuevo === 'function' ? herrNuevo() : undefined }];
    ST.colores = null; ST.coloresEntrada = null; ST.proyectoActual = null; ST._ejemplo = true;
    $('FC').value = 'Cliente de ejemplo'; $('FD').value = 'Calle de práctica 1'; $('FT').value = '';
    var notas = $('F-NOTAS'); if (notas) notas.value = 'Presupuesto de ejemplo para practicar. Puedes cambiar todo lo que quieras.';
    if (typeof renderGroups === 'function') renderGroups();
    if (typeof upBan === 'function') upBan();
    ir(0);
    if (typeof toast === 'function') toast('Presupuesto de ejemplo abierto: practica con él');
  }
  window.asisEjemplo = ejemplo;

  // Grupos: los detalles técnicos (casco, herrajes, ajuste, modelo de puertas) plegados en «Detalles técnicos»,
  // y texto en los botones de iconos.
  var TEXTOS = [[/^toggleG\(/, '&#x25BE;<span class="asis-txt"> Plegar</span>', 'Plegar o desplegar este grupo'], [/^removeGroup\(/, '&#x2715;<span class="asis-txt"> Quitar grupo</span>', 'Quitar este grupo y sus muebles'],
    [/^remLine\(/, '&#x2715;<span class="asis-txt"> Quitar</span>', 'Quitar este mueble'], [/^dupLine\(/, '&#x29C9;<span class="asis-txt"> Duplicar</span>', 'Duplicar este mueble'],
    [/^moveLine\([^)]*,-1\)/, '&#x25B2;', 'Subir este mueble en la lista'], [/^moveLine\([^)]*,1\)/, '&#x25BC;', 'Bajar este mueble en la lista'],
    [/^moveGroup\([^)]*,-1\)/, '&#x25B2;<span class="asis-txt"> Subir</span>', 'Subir este grupo'], [/^moveGroup\([^)]*,1\)/, '&#x25BC;<span class="asis-txt"> Bajar</span>', 'Bajar este grupo']];
  function simplificarGrupos() {
    var gw = $('GW'); if (!gw) return;
    var arreglar = function () {
      gw.querySelectorAll('.gb').forEach(function (gb) {
        var gid = gb.id.replace('gb', '');
        if (!gb.querySelector('.asis-tecnico-btn') && (gb.querySelector('[id^="gcasco"]') || gb.querySelector('[id^="gherr"]'))) {
          var b = el('button', { type: 'button', class: 'btn bgh bsm asis-tecnico-btn', 'aria-expanded': 'false' }, '&#x2699; Detalles técnicos (casco, herrajes, descuento, modelo de puerta)');
          b.onclick = function () { var on = gb.classList.toggle('asis-tecnico'); b.setAttribute('aria-expanded', on ? 'true' : 'false'); ls.set('asis_tec_' + gid, on ? '1' : null); };
          if (ls.get('asis_tec_' + gid) === '1') { gb.classList.add('asis-tecnico'); b.setAttribute('aria-expanded', 'true'); }
          var tabs = gb.querySelector('.mtabs');
          gb.insertBefore(b, tabs ? tabs.nextSibling : gb.firstChild);
        }
      });
      gw.querySelectorAll('button[onclick]').forEach(function (b) {
        if (b.dataset.asisTxt) return;
        var oc = b.getAttribute('onclick') || '';
        TEXTOS.forEach(function (t) { if (t[0].test(oc)) { b.innerHTML = t[1]; b.title = t[2]; b.dataset.asisTxt = '1'; } });
      });
      gw.querySelectorAll('.btn.bp.bsm').forEach(function (b) { if (/^\+ Añadir$/.test(b.textContent.trim())) b.textContent = '+ Añadir mueble'; });
    };
    new MutationObserver(function () { arreglar(); }).observe(gw, { childList: true, subtree: true });
    arreglar();
  }

  function esperar() {
    if (typeof renderGroups !== 'function' || !document.getElementById('pb') || typeof guardarProyecto !== 'function') return setTimeout(esperar, 200);
    montar();
    // Lo de los pasos 4 y 5 (total, guardado, banda del ejemplo) al día con cada cambio del presupuesto.
    if (typeof window.upBan === 'function' && !window.upBan._asis) {
      var orig = window.upBan;
      window.upBan = function () { var r = orig.apply(this, arguments); try { refrescar(); } catch (e) {} return r; };
      window.upBan._asis = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', esperar); else esperar();
  window.ASISTENTE = { ir: function (n) { ir(n); }, paso: function () { return paso; }, letra: letra, ejemplo: ejemplo, bienvenida: bienvenida };
})();
