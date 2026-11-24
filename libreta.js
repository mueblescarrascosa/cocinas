// Libreta Taller → presupuesto. La Libreta (misma web) deja la cocina o el vestidor medidos en
// localStorage 'libreta_a_presupuesto' y abre esta app; aquí se pregunta y se crea un presupuesto NUEVO en borrador.
// Todo lo que entra es editable como si se hubiera metido a mano. Lo que no casa con el catálogo (tipo, modelo o medida
// que no existen) no se inventa: va al grupo «Revisar (de la libreta)» como texto, para elegirlo a mano.
(function () {
  var CLAVE = 'libreta_a_presupuesto', MAX_EDAD = 60 * 60 * 1000;

  // El catálogo de un tipo: el de la app y el vivo (el de la plantilla importada, que puede traer muebles nuevos:
  // ALTO PUENTE 70-80, columnas desayunador…), juntos.
  function tipoCatalogo(m) {
    var a = (typeof CAT_MODULES !== 'undefined') && CAT_MODULES[m], vivo = (typeof ST !== 'undefined' && ST && (ST.cats && ST.cats.muebles || ST.cat)) || null, b = vivo && vivo[m];
    if (!a && !b) return null;
    var t = {};
    [a, b].forEach(function (x) { if (x) Object.keys(x).forEach(function (mo) { t[mo] = (t[mo] || []).concat((x[mo] || []).filter(function (v) { return (t[mo] || []).indexOf(v) < 0; })); }); });
    return t;
  }
  // ¿Existe en el catálogo? (tipo, modelo y medida tal cual)
  function enCatalogo(l) {
    var t = tipoCatalogo(l.m);
    return !!(t && t[l.mo] && t[l.mo].indexOf(String(l.med)) >= 0);
  }
  // Medida del catálogo para una medida que no está: la inmediatamente superior (55 → 60; si no hay ninguna mayor,
  // la más grande). Los rincones, la más cercana (un rincón de 93×93 es el de 90), y si empatan, la menor.
  function medidaCatalogo(l) {
    var t = tipoCatalogo(l.m), ms = t && t[l.mo];
    if (!ms || !ms.length) return null;
    var n = parseFloat(String(l.med).replace(',', '.')), nums = ms.map(function (x) { return parseFloat(x); });
    if (isNaN(n)) return null;
    if (/RINC/i.test(l.mo)) {
      var mejor = null;
      ms.forEach(function (x, i) { var d = Math.abs(nums[i] - n); if (mejor === null || d < mejor.d || (d === mejor.d && nums[i] < mejor.v)) mejor = { x: x, d: d, v: nums[i] }; });
      return mejor.x;
    }
    var mayores = ms.filter(function (x, i) { return nums[i] >= n; });
    if (mayores.length) return mayores.reduce(function (a, b) { return parseFloat(a) <= parseFloat(b) ? a : b; });
    return ms.reduce(function (a, b) { return parseFloat(a) >= parseFloat(b) ? a : b; });
  }
  // Medida más cercana que sí exista para ese tipo y modelo (para la nota de «revisar»).
  function cercana(l) {
    var t = tipoCatalogo(l.m), ms = t && t[l.mo];
    if (!ms || !ms.length) return null;
    var n = parseFloat(l.med), d = Math.min.apply(null, ms.map(function (x) { return Math.abs(parseFloat(x) - n); }));
    return ms.filter(function (x) { return Math.abs(parseFloat(x) - n) === d; }).join(' o ');
  }

  // Construye los grupos del presupuesto a partir del paquete de la libreta.
  function grupos(p) {
    var out = [], revisar = [], ci = 0, recs = [];
    var color = function () { return (ci++) % (typeof GCOLS !== 'undefined' ? GCOLS.length : 8); };
    (p.grupos || []).forEach(function (g) {
      if (g.tipo === 'muebles') {
        var cal = (typeof CALS !== 'undefined' && CALS.indexOf(g.cal) >= 0) ? g.cal : (typeof CALS !== 'undefined' ? CALS[1] : 'BÁSICO');
        var casco = cascoNuevo();
        if (g.casco && typeof CASCO_ACABADOS !== 'undefined' && CASCO_ACABADOS.indexOf(g.casco) >= 0) casco.acab = g.casco;
        var lines = [], recRecargo = [];
        (g.lineas || []).forEach(function (l) {
          var otra = enCatalogo(l) ? null : medidaCatalogo(l);
          if (enCatalogo(l)) lines.push({ id: nid(), m: l.m, mo: l.mo, med: String(l.med), und: l.und || 1, extras: [] });
          else if (otra) {
            // Se pone la del catálogo y se avisa en «Revisar» de que se ha cambiado la medida.
            lines.push({ id: nid(), m: l.m, mo: l.mo, med: String(otra), und: l.und || 1, extras: [] });
            revisar.push('ℹ ' + (l.texto || (l.m + ' ' + l.mo + ' ' + l.med)) + ': medido ' + String(l.med).replace('.', ',') + ', puesto el de ' + otra);
          }
          // Recargo por complicación (cajeado por pilar…): una línea aparte con su % del precio de este mueble.
          if (l.recargo && (enCatalogo(l) || otra)) recRecargo.push({ line: lines[lines.length - 1], r: l.recargo, frac: 1 });
          if (!enCatalogo(l) && !otra) {
            var c = cercana(l);
            revisar.push('⚠ ' + (l.texto || (l.m + ' ' + l.mo + ' ' + l.med)) + ': no está en el catálogo' + (c ? ' (la más cercana: ' + l.m + ' ' + l.mo + ' ' + c + ')' : ''));
          }
        });
        if (lines.length) {
          var gm = { id: nid(), name: g.nombre, tipo: 'muebles', cal: cal, ci: color(), lines: lines, open: true, casco: casco, herr: herrNuevo() };
          out.push(gm);
          recRecargo.forEach(function (x) { x.g = gm; recs.push(x); });
        }
      } else if (g.tipo === 'armario' && window.ARM) {
        var recRec2 = [];
        var lines2 = (g.tramos || []).map(function (t) {
          var l = ARM.lineaNueva('vestidor'), a = l.arm;
          a.nombre = t.nombre || '';
          if (t.ancho) a.ancho = t.ancho;
          if (t.alto) a.alto = t.alto;
          if (t.cuerpos && t.cuerpos.length) a.cuerpos = t.cuerpos.map(function (c) { return { ancho: c.ancho, estantes: c.estantes || 0, maletero: false, barra: c.barra || 0, cajones: c.cajones || 0, extras: [] }; });
          if (t.puertas) a.puertas.tipo = t.puertas;
          // Recargos de cuerpos: su parte del tramo (ancho del cuerpo / ancho del tramo).
          (t.recargos || []).forEach(function (r) { if (t.ancho > 0 && r.ancho > 0) recRec2.push({ line: l, r: r, frac: Math.min(1, r.ancho / t.ancho) }); });
          return l;
        });
        if (lines2.length) {
          var ga = { id: nid(), name: g.nombre, tipo: 'armario', cal: '', ci: color(), lines: lines2, open: true };
          out.push(ga);
          recRec2.forEach(function (x) { x.g = ga; recs.push(x); });
        }
      } else if (g.tipo === 'extras') {
        // Encimera de la libreta: cada línea, si está en los extras (o con su nombre antiguo); si no, a «Revisar».
        var exg = (typeof ST !== 'undefined' && ST.exg) || {}, hay = function (c, n) { return !!(exg[c] && Object.prototype.hasOwnProperty.call(exg[c], n)); };
        var lineasEx = [];
        (g.lineas || []).forEach(function (l) {
          var cat = l.cat, item = l.item;
          if (!hay(cat, item) && l.otro && hay(l.otro[0], l.otro[1])) { cat = l.otro[0]; item = l.otro[1]; }
          if (hay(cat, item)) lineasEx.push({ id: nid(), m: cat, mo: item, med: '—', und: l.und || 1 });
          else revisar.push('⚠ ' + (l.texto || (l.cat + ' ' + l.item)) + ' × ' + (l.und || 1) + ': no está en los extras');
        });
        if (lineasEx.length) out.push({ id: nid(), name: g.nombre || 'Encimera', tipo: 'extras', cal: 'ENTRADA', ci: color(), lines: lineasEx, open: true, casco: cascoNuevo(), herr: herrNuevo() });
      } else if (g.tipo === 'libre') {
        var lib = (g.lineas || []).map(function (l) { return { id: nid(), m: l.texto, mo: '', med: '—', und: l.und || 1, precio: l.precio || 0, extras: [], dif: 0 }; });
        if (lib.length) out.push({ id: nid(), name: g.nombre || 'Otros', tipo: 'libre', cal: 'ENTRADA', ci: color(), lines: lib, open: true, casco: cascoNuevo(), herr: herrNuevo() });
      } else if (g.tipo === 'revisar') {
        (g.lineas || []).forEach(function (t) { revisar.push(t); });
      }
    });
    // Complicaciones (recargos de la libreta): «Cajeado por pilar – Bajo 60 (pared A) (+20 %)» con su importe, editable.
    if (recs.length) {
      var lc = recs.map(function (x) {
        var base = 0;
        try { base = (typeof _enVivo === 'function' ? _enVivo(function () { return lineTotal(x.line, x.g); }) : lineTotal(x.line, x.g)) * x.frac; } catch (e) { base = 0; }
        var pct = parseFloat(x.r.pct) || 0;
        return { id: nid(), m: (x.r.texto || 'Complicación') + ' (+' + String(pct).replace('.', ',') + ' %)', mo: '', med: '—', und: 1, precio: Math.round(base * pct) / 100, extras: [], dif: 0 };
      });
      out.push({ id: nid(), name: 'Complicaciones', tipo: 'libre', cal: 'ENTRADA', ci: color(), lines: lc, open: true, casco: cascoNuevo(), herr: herrNuevo() });
    }
    if (revisar.length) out.push({ id: nid(), name: 'Revisar (de la libreta)', tipo: 'libre', cal: 'ENTRADA', ci: color(),
      lines: revisar.map(function (t) { return { id: nid(), m: t, mo: '', med: '—', und: 1, precio: 0, extras: [], dif: 0 }; }), open: true, casco: cascoNuevo(), herr: herrNuevo() });
    return out;
  }

  function importar(p) {
    var ok = confirm('Crear un presupuesto nuevo con ' + (p.titulo || 'lo medido en la libreta') + '?\n\n'
      + (p.resumen || '') + '\n\nLo que tengas abierto ahora se cierra: guárdalo antes si no lo está.');
    if (!ok) return false;
    ST.groups = grupos(p);
    ST.proyectoActual = null; ST.curNum = null; ST.estado = 'borrador'; ST.fechaEnvio = null; ST.fechaAceptado = null; ST.opcionDe = null; ST.bloqueado = false; ST.fzInst = null; ST.colores = null; ST.coloresEntrada = null;
    ST.libreta3d = p.plano3d && p.plano3d.datos ? p.plano3d : null;   // para la vista 3D con los colores
    if (ST.libreta3d && window.GUIA_COLORES) GUIA_COLORES.cargar3d();
    ST.images = [];
    var poner = function (id, v) { var e = document.getElementById(id); if (e) e.value = v || ''; };
    poner('FC', p.cliente); poner('FD', p.direccion); poner('FT', p.telefono);
    var d = new Date(); poner('FF', String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear());
    var notas = document.getElementById('F-NOTAS');
    if (notas && p.notas) notas.value = p.notas + (notas.value ? '\n' + notas.value : '');
    try { if (typeof activarMotor === 'function' && typeof hayMotor2 === 'function') activarMotor(hayMotor2() ? 2 : 1); } catch (e) {}
    try { if (typeof _aplicarEstadoUI === 'function') _aplicarEstadoUI(); } catch (e) {}
    renderGroups(); upBan();
    try { if (typeof markDirty === 'function') markDirty(); } catch (e) {}
    if (typeof toast === 'function') toast('Presupuesto creado desde la libreta ✓');
    return true;
  }

  // Espera a que arranque la app y a que termine de bajar la nube: si la nube trae cambios la app se recarga, y lo de
  // la libreta se perdería. Por eso el paquete solo se quita de localStorage cuando ya se ha preguntado; si hay que
  // entrar (login) o la página se recarga, se ofrece al volver.
  // ── Solo calcular: el «Coste estimado» de la Libreta abre esta app por dentro (iframe oculto, ?estimar=1), le manda lo
  // medido y recibe los totales con la tarifa de este dispositivo. No se guarda nada: el presupuesto abierto se deja como estaba.
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  function estimar(p) {
    var antes = { groups: ST.groups, bloqueado: ST.bloqueado, fzInst: ST.fzInst }, dif = document.getElementById('F-DIFICULTAD'), difAntes = dif ? dif.checked : null;
    try {
      ST.groups = grupos(p); ST.bloqueado = false; ST.fzInst = null; if (dif) dif.checked = false;
      var gs = ST.groups.map(function (g) {
        var sin = g.tipo === 'libre' ? g.lines.filter(function (l) { return !(parseFloat(l.precio) > 0); }).map(function (l) { return l.m; }) : [];
        return { nombre: g.name, tipo: g.tipo, total: r2(gsub(g)), sinPrecio: sin };
      });
      var sub = grandT(), inst = getInstalacion();
      return { grupos: gs, subtotal: sub, instalacion: inst, total: r2(sub + inst) };
    } finally { ST.groups = antes.groups; ST.bloqueado = antes.bloqueado; ST.fzInst = antes.fzInst; if (dif) dif.checked = difAntes; }
  }
  var MODO_ESTIMAR = /[?&]estimar(=|&|$)/.test(location.search) && window.parent !== window;
  if (MODO_ESTIMAR) {
    window.addEventListener('message', function (ev) {
      if (ev.origin !== location.origin || !ev.data || ev.data.tipo !== 'libreta-estimar') return;
      var responder = function (o) { ev.source.postMessage(Object.assign({ tipo: 'libreta-estimacion', id: ev.data.id }, o), location.origin); };
      (function listo(n) {
        var ok = typeof ST !== 'undefined' && ST && ST.params && typeof CAT_MODULES !== 'undefined' && typeof nid === 'function' && typeof gsub === 'function' && typeof getInstalacion === 'function';
        if (!ok) { if (n < 100) { setTimeout(function () { listo(n + 1); }, 200); return; } responder({ ok: false, error: 'no-arranca' }); return; }
        try { responder({ ok: true, resultado: estimar(ev.data.paquete) }); } catch (e) { responder({ ok: false, error: String((e && e.message) || e) }); }
      })(0);
    });
    try { window.parent.postMessage({ tipo: 'libreta-lista' }, location.origin); } catch (e) {}
  }

  var intentos = 0;
  if (!MODO_ESTIMAR) (function esperar() {
    var fase = window._syncFase, arrancada = typeof renderGroups === 'function' && typeof ST !== 'undefined' && typeof CAT_MODULES !== 'undefined' && typeof nid === 'function';
    // Hasta 30 s esperando a la nube; si no contesta, se sigue con lo del dispositivo.
    if (!arrancada || fase === 'recargando' || fase === 'login' || (!fase && intentos < 100)) {
      if (fase !== 'recargando' && fase !== 'login' && ++intentos < 200) setTimeout(esperar, 300);
      return;
    }
    var p = null;
    try { p = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {}
    if (!p) return;
    if (!p.creado || Date.now() - Date.parse(p.creado) > MAX_EDAD) { try { localStorage.removeItem(CLAVE); } catch (e) {} return; }
    setTimeout(function () {
      // Se quita al preguntar (se haga o no): solo se ofrece una vez.
      try { localStorage.removeItem(CLAVE); } catch (e) {}
      importar(p);
    }, 300);
  })();

  window.LIBRETA = { grupos: grupos, importar: importar, estimar: estimar, enCatalogo: enCatalogo, medidaCatalogo: medidaCatalogo, modoEstimar: MODO_ESTIMAR };
})();
