/* Armarios y vestidores · cálculo, tabla de precios, pantalla y PDF.
   Se carga antes que la app. Todo cuelga de window.ARM; si este archivo falla, las cocinas siguen igual.
   Especificación: 5_TARIFA_2026/docs/2026-11-05-armarios-diseno.md */
(function (root) {
  'use strict';
  var ARM = root.ARM || {};

  function num(v) { var n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function r2(v) { return Math.round(v * 100) / 100; }

  // Coste de compra = media de los 10 últimos precios (nunca el más barato).
  ARM.costeProducto = function (p) {
    if (!p || !p.historial || !p.historial.length) return null;
    var h = p.historial.slice(0, 10), s = 0;
    h.forEach(function (x) { s += num(x.eur); });
    return r2(s / h.length);
  };

  function buscar(tabla, cod) {
    if (!cod) return null;
    var cats = ['materiales', 'cantos', 'kits', 'perfiles', 'hojas', 'paneles', 'herrajes', 'interior'];
    for (var i = 0; i < cats.length; i++) { var c = tabla[cats[i]]; if (c && c[cod]) return c[cod]; }
    return null;
  }
  // Devuelve el coste y apunta en `falta` lo que no tiene precio.
  function coste(tabla, cod, falta) {
    var p = buscar(tabla, cod), c = ARM.costeProducto(p);
    if (c === null) { var n = (p && p.nombre) || cod || '¿?'; if (falta.indexOf(n) < 0) falta.push(n); return 0; }
    return c;
  }

  ARM.hojasCorredera = function (ancho, n, solape) {
    n = Math.max(1, Math.round(num(n))); solape = solape === undefined ? 3 : num(solape);
    return { n: n, ancho: r2((num(ancho) + solape * (n - 1)) / n) };
  };

  function bisagrasPorHoja(alto) { return alto <= 100 ? 2 : alto <= 180 ? 3 : 4; }

  ARM.despiece = function (t, tabla) {
    var A = num(t.ancho), H = num(t.alto), F = num(t.fondo), cuerpos = t.cuerpos || [], tt = tabla.taller || {};
    var piezas = [], m2 = {}, ml = 0, horas = num(tt.tramo), avisos = [], conCasco = t.clase !== 'solo_puertas';
    function pieza(n, cant, an, al, mat, canto) {
      if (!cant || an <= 0 || al <= 0) return;
      piezas.push({ n: n, cant: cant, an: r2(an), al: r2(al), mat: mat });
      m2[mat] = (m2[mat] || 0) + cant * an * al / 1e4;
      if (canto) ml += cant * canto / 100;
    }
    if (A <= 0) avisos.push('Falta el ancho');
    if (H <= 0) avisos.push('Falta el alto');
    if (conCasco && F <= 0) avisos.push('Falta el fondo');
    var mat = t.casco;
    if (conCasco) {
      var suma = 0; cuerpos.forEach(function (c) { suma += num(c.ancho); });
      if (cuerpos.length && Math.abs(suma - A) > 0.5) avisos.push('Los cuerpos suman ' + r2(suma) + ' de ' + r2(A) + ' cm');
      pieza('Costado', cuerpos.length + 1, F, H, mat, H);
      if (t.montaje === 'exento') ml += 2 * H / 100;   // costados extremos vistos
      cuerpos.forEach(function (c, i) {
        var an = num(c.ancho), est = Math.max(0, Math.round(num(c.estantes)));
        pieza('Techo y suelo (cuerpo ' + (i + 1) + ')', 2, an, F, mat, an);
        if (c.maletero) { pieza('Maletero (cuerpo ' + (i + 1) + ')', 1, an, F, mat, an); horas += num(tt.estante); }
        if (est) { pieza('Estante (cuerpo ' + (i + 1) + ')', est, an, F - 2, mat, an); horas += est * num(tt.estante); }
        horas += num(tt.cuerpo) + Math.max(0, Math.round(num(c.cajones))) * num(tt.cajon);
      });
      if (t.trasera && t.trasera !== 'sin') {
        var mt = t.trasera === 'tablero16' ? mat : ((tabla.traseras || {})[t.trasera] || mat);
        pieza('Trasera', 1, A, H, mt, 0);
      }
      if (t.zocalo) pieza('Zócalo', 1, A, num(t.alturaZocalo) || 10, mat, A);
    }
    // Puertas
    var p = t.puertas || {}, pu = { tipo: p.tipo || 'ninguna', hojas: [], m2: 0, ml: 0 };
    var altoHoja = H - (t.zocalo ? (num(t.alturaZocalo) || 10) : 0) - 4;
    if (/^corredera/.test(pu.tipo)) {
      var kit = buscar(tabla, p.kit) || {}, hc = ARM.hojasCorredera(A, p.hojas || 2, kit.solape === undefined ? 3 : kit.solape);
      for (var k = 0; k < hc.n; k++) pu.hojas.push({ an: hc.ancho, al: altoHoja });
      if (hc.ancho < 30) avisos.push('Hojas de menos de 30 cm');
      horas += hc.n * num(tt.corredera);
    } else if (/^abatible/.test(pu.tipo)) {
      cuerpos.forEach(function (c) {
        var an = num(c.ancho), n = an <= 50 ? 1 : 2;
        for (var k = 0; k < n; k++) pu.hojas.push({ an: r2(an / n), al: altoHoja });
      });
      horas += pu.hojas.length * num(tt.abatible);
    }
    pu.hojas.forEach(function (x) { pu.m2 += x.an * x.al / 1e4; pu.ml += 2 * (x.an + x.al) / 100; });
    return { piezas: piezas, m2: m2, ml_canto: r2(ml * 1000) / 1000, horas: horas, puertas: pu, avisos: avisos };
  };

  function nucleo(t, tabla, margen, gamaKey) {
    var d = ARM.despiece(t, tabla), falta = [], desp = 1 + num(tabla.desperdicio) / 100;
    var gama = (tabla.gamas || {})[gamaKey] || (tabla.gamas || {}).basica || {};
    var casco = 0, puertas = 0, herr = 0;
    Object.keys(d.m2).forEach(function (m) { casco += d.m2[m] * desp * coste(tabla, m, falta); });
    casco += d.ml_canto * coste(tabla, tabla.canto, falta);
    var p = t.puertas || {}, pu = d.puertas;
    if (pu.hojas.length) {
      var n = pu.hojas.length;
      if (pu.tipo === 'corredera_tablero' || pu.tipo === 'abatible_tablero') {
        puertas += pu.m2 * desp * coste(tabla, p.mat || t.casco, falta) + pu.ml * coste(tabla, tabla.canto, falta);
      } else if (pu.tipo === 'abatible_comprada') {
        puertas += pu.m2 * coste(tabla, p.hoja, falta);
      } else if (pu.tipo === 'corredera_perfil') {
        puertas += pu.m2 * desp * coste(tabla, p.panel, falta);
      }
      if (/^corredera/.test(pu.tipo)) {
        var guia = buscar(tabla, p.guia) || {};
        puertas += n * coste(tabla, p.kit, falta) + Math.ceil(num(t.ancho) / (num(guia.largo) || 200)) * coste(tabla, p.guia, falta);
      } else {
        pu.hojas.forEach(function (x) { puertas += bisagrasPorHoja(x.al) * coste(tabla, gama.bisagra, falta); });
      }
    }
    if (t.clase !== 'solo_puertas') (t.cuerpos || []).forEach(function (c) {
      var est = Math.max(0, Math.round(num(c.estantes))), caj = Math.max(0, Math.round(num(c.cajones)));
      if (est) herr += est * 4 * coste(tabla, tabla.soporte, falta);
      if (c.barra) herr += num(c.ancho) / 100 * coste(tabla, gama.barra, falta);
      if (caj) herr += caj * coste(tabla, gama.cajon, falta);
    });
    var col = tabla.colocacion || {}, ancho = num(t.ancho);
    var colocacion = t.clase === 'solo_puertas' ? num(col.solo_puertas) : ancho / 100 * num(t.clase === 'vestidor' ? col.vestidor : col.armario);
    var eurH = num((tabla.taller || {}).eur_h), extras = 0;
    (t.cuerpos || []).forEach(function (c) {
      (c.extras || []).forEach(function (x) { var u = Math.max(0, num(x.und) || 1); extras += u * (coste(tabla, x.cod, falta) + 0.25 * eurH); });
    });
    var materiales = casco + puertas + herr, taller = d.horas * eurH;
    var rec = 1 + num(t.recargo) / 100, m = num(margen);
    var sinExtras = ((materiales + taller) * (1 + m) + colocacion) * rec;
    var precio = ((materiales + taller + extras) * (1 + m) + colocacion) * rec;
    var cajones = 0; (t.cuerpos || []).forEach(function (c) { cajones += Math.max(0, Math.round(num(c.cajones))); });
    var ref = tabla.referencia || {}, referencia = (t.clase === 'solo_puertas' || t.clase === 'solo_interior') ? null
      : r2(ancho / 100 * num(ref.eur_m) + cajones * num(ref.eur_cajon));
    var sinPrecio = falta.length > 0;
    return { materiales: r2(materiales), casco: r2(casco), puertas: r2(puertas), herrajes: r2(herr), extras: r2(extras),
      horas: d.horas, taller: r2(taller), colocacion: r2(colocacion), coste: r2(materiales + taller + extras + colocacion),
      precio: sinPrecio ? null : r2(precio), sinExtras: sinPrecio ? null : r2(sinExtras), referencia: referencia,
      sinPrecio: falta, avisos: d.avisos, despiece: d };
  }
  // precioBase = gama básica y sin interiores: lo que se compara con la referencia del usuario.
  ARM.calcular = function (t, tabla, margen) {
    var g = t.gama || 'basica', r = nucleo(t, tabla, margen, g);
    r.precioBase = g === 'basica' ? r.sinExtras : nucleo(t, tabla, margen, 'basica').sinExtras;
    return r;
  };
  // Interiores que caben en un cuerpo de `ancho` cm, por familia y precio.
  ARM.interiorPara = function (ancho, tabla) {
    var c = tabla.interior || {}, a = num(ancho);
    return Object.keys(c).map(function (k) { var p = c[k]; return { cod: k, nombre: p.nombre, familia: p.familia || 'Otros', min: p.min, max: p.max, prov: p.prov, coste: ARM.costeProducto(p) }; })
      .filter(function (p) { return (p.min === undefined || a >= num(p.min)) && (p.max === undefined || a <= num(p.max)); })
      .sort(function (x, y) { return x.familia < y.familia ? -1 : x.familia > y.familia ? 1 : (x.coste || 0) - (y.coste || 0); });
  };

  ARM.semaforo = function (base, ref) {
    if (base === null || base === undefined || !ref) return null;
    var dif = Math.abs(base - ref) / ref;
    return dif <= 0.10 ? 'verde' : dif <= 0.25 ? 'amarillo' : 'rojo';
  };

  // ── Dentro de la app ──
  // Tabla: la guardada en el dispositivo/nube (armarios_v1) o, si no hay, la inicial de este archivo.
  // Se combina con la inicial para que los productos nuevos de una versión posterior aparezcan aunque el usuario
  // ya tenga su tabla guardada; sus ajustes y precios mandan, y los historiales se unen (10 más recientes).
  var CATS_P = ['materiales', 'cantos', 'kits', 'perfiles', 'hojas', 'paneles', 'herrajes', 'interior'];
  function fusionar(ini, g) {
    var t = JSON.parse(JSON.stringify(ini));
    Object.keys(g).forEach(function (k) {
      if (CATS_P.indexOf(k) >= 0) {
        t[k] = t[k] || {};
        Object.keys(g[k] || {}).forEach(function (cod) {
          var a = t[k][cod], b = g[k][cod];
          if (!a) { t[k][cod] = b; return; }
          var h = (b.historial || []).slice(), ver = {};
          h.forEach(function (x) { ver[x.fecha + '|' + x.eur + '|' + x.prov] = 1; });
          (a.historial || []).forEach(function (x) { if (!ver[x.fecha + '|' + x.eur + '|' + x.prov]) h.push(x); });
          h.sort(function (x, y) { return x.fecha < y.fecha ? 1 : x.fecha > y.fecha ? -1 : 0; });
          t[k][cod] = Object.assign({}, a, b, { historial: h.slice(0, 10) });
        });
      } else if (g[k] && typeof g[k] === 'object' && !Array.isArray(g[k])) t[k] = Object.assign({}, t[k] || {}, g[k]);
      else t[k] = g[k];
    });
    return t;
  }
  var _cacheTabla = { txt: null, t: null };
  ARM.tabla = function () {
    var txt = null;
    try { txt = root.localStorage.getItem('armarios_v1'); } catch (e) {}
    if (!txt) return ARM.TABLA_INICIAL;
    if (_cacheTabla.txt === txt) return _cacheTabla.t;
    var g = null; try { g = JSON.parse(txt); } catch (e) {}
    var t = g && g.materiales ? fusionar(ARM.TABLA_INICIAL, g) : ARM.TABLA_INICIAL;
    _cacheTabla = { txt: txt, t: t };
    return t;
  };
  ARM.guardarTabla = async function (t) {
    var txt = JSON.stringify(t);
    try { root.localStorage.setItem('armarios_v1', txt); } catch (e) {}
    if (typeof root.supaGuardarClave === 'function') return root.supaGuardarClave('armarios_v1', txt);
    return true;
  };
  function repintarArmarios() {
    ((root.ST && root.ST.groups) || []).forEach(function (g) { if (g.tipo === 'armario' && typeof root.renderLines === 'function') root.renderLines(g.id); });
    if (typeof root.upBan === 'function') root.upBan();
  }
  ARM.ponerAjuste = function (seccion, k, v) {
    var t = JSON.parse(JSON.stringify(ARM.tabla()));
    if (seccion === 'desperdicio') t.desperdicio = num(v); else { t[seccion] = t[seccion] || {}; t[seccion][k] = num(v); }
    var p = ARM.guardarTabla(t); repintarArmarios(); return p;
  };
  ARM.nuevoPrecio = function (cod, eur) {
    var t = JSON.parse(JSON.stringify(ARM.tabla()));
    for (var i = 0; i < CATS_P.length; i++) {
      var p = (t[CATS_P[i]] || {})[cod];
      if (!p) continue;
      if (!(num(eur) > 0)) return null;
      p.historial = [{ eur: num(eur), fecha: new Date().toISOString().slice(0, 10), prov: p.prov || '', origen: 'manual' }].concat(p.historial || []).slice(0, 10);
      var r = ARM.guardarTabla(t); repintarArmarios(); return r;
    }
    return null;
  };
  ARM.margenApp = function () {
    var p = root.ST && root.ST.params, v = p && p.margen_unico;
    return (v === undefined || v === null || isNaN(parseFloat(v)) ? 25 : parseFloat(v)) / 100;
  };
  ARM.calcularLinea = function (l) {
    if (!l || !l.arm || !l.arm.clase) return null;
    return ARM.calcular(l.arm, ARM.tabla(), ARM.margenApp());
  };
  ARM.precioLinea = function (l) {
    var r = ARM.calcularLinea(l);
    if (!r || r.precio === null) return 0;
    var b = r.precio * (l.und || 1);
    if (l.dif) b = b * (1 + l.dif / 100);
    return r2(b);
  };
  // Precio por unidad para la app y el PDF: null si falta algún precio (sale «—», como en las cocinas).
  ARM.precioUnidad = function (l) {
    var r = ARM.calcularLinea(l);
    if (!r || r.precio === null) return null;
    return r2(ARM.precioLinea(l) / (l.und || 1));
  };
  ARM.costeLinea = function (l) {
    var r = ARM.calcularLinea(l);
    return r ? r2(r.coste * (l.und || 1)) : 0;
  };
  // ── Datos nuevos ──
  ARM.nuevoTramo = function (clase) {
    var T = ARM.tabla(), k = T.kitDefecto || {};
    var c = function () { return { ancho: 100, estantes: 1, maletero: true, barra: true, cajones: 0, extras: [] }; };
    var t = { nombre: '', clase: clase || 'armario', ancho: 200, alto: 250, fondo: 60, casco: 'ROBLE16', trasera: 'tablero16', zocalo: true,
      montaje: 'empotrado', gama: 'basica', recargo: 0, cuerpos: [c(), c()],
      puertas: { tipo: 'corredera_tablero', hojas: 2, mat: 'ROBLE16', kit: k.kit, guia: k.guia, hoja: 'HOJA-LAM', panel: 'ESPEJO4' } };
    if (t.clase === 'vestidor' || t.clase === 'solo_interior') t.puertas.tipo = 'ninguna';
    if (t.clase === 'solo_puertas') { t.cuerpos = []; t.zocalo = false; t.trasera = 'sin'; }
    return t;
  };
  ARM.lineaNueva = function (clase) {
    return { id: typeof root.nid === 'function' ? root.nid() : Date.now(), m: 'ARMARIO', mo: '', med: '—', und: 1, arm: ARM.nuevoTramo(clase) };
  };
  ARM.repartir = function (t) {
    var n = (t.cuerpos || []).length; if (!n) return;
    var base = Math.floor(num(t.ancho) / n * 100) / 100, resto = r2(num(t.ancho) - base * n);
    t.cuerpos.forEach(function (c, i) { c.ancho = i < Math.round(resto * 100) ? r2(base + 0.01) : base; });
  };

  // ── Pantalla ──
  var CLASES = { armario: 'Armario', vestidor: 'Vestidor', solo_puertas: 'Solo puertas', solo_interior: 'Solo interior' };
  var PUERTAS = { corredera_tablero: 'Corredera de tablero', corredera_perfil: 'Corredera de perfil + panel', abatible_tablero: 'Abatible de tablero',
    abatible_comprada: 'Abatible comprada', ninguna: 'Sin puertas' };
  var TRASERAS = { tablero16: 'Tablero 16 mm (como el casco)', tablero10: 'Tablero 10 mm', dm3: 'DM 3 mm', sin: 'Sin trasera' };
  var GAMAS = { basica: 'Herraje básico', media: 'Herraje medio', alta: 'Herraje alto' };
  var abiertos = {};   // despiece desplegado por línea

  function eh(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function eur(v) { return typeof root.fmt === 'function' ? root.fmt(v) : r2(v).toFixed(2) + ' €'; }
  function cliente() { return !!root._clienteMode; }
  function opciones(obj, sel) { return Object.keys(obj).map(function (k) { return '<option value="' + eh(k) + '"' + (k === sel ? ' selected' : '') + '>' + eh(obj[k]) + '</option>'; }).join(''); }
  function prods(cat, sel, filtro) {
    var o = {}, c = ARM.tabla()[cat] || {};
    Object.keys(c).forEach(function (k) { if (!filtro || filtro(c[k])) { var e = ARM.costeProducto(c[k]); o[k] = c[k].nombre + (cliente() ? '' : ' · ' + (e === null ? 'sin precio' : r2(e).toFixed(2).replace('.', ',') + ' €') + ' · ' + (c[k].prov || '')); } });
    return opciones(o, sel);
  }
  function esTablero(x) { return x.unidad === 'm2' && !/^(DM3|TABLERO10)$/.test(x.cod || ''); }
  function campo(lbl, html, ancho) { return '<label style="display:flex;flex-direction:column;font-size:.72rem;color:#666;gap:2px;min-width:0;flex:' + (ancho || '1 1 70px') + '">' + lbl + html + '</label>'; }
  function inp(gid, lid, k, v, extra) { return '<input type="number" inputmode="decimal" value="' + eh(v) + '" style="width:100%;box-sizing:border-box" onchange="ARM.cambia(' + gid + ',' + lid + ',\'' + k + '\',this.value)"' + (extra || '') + '>'; }
  function sel(gid, lid, k, html) { return '<select style="width:100%;box-sizing:border-box" onchange="ARM.cambia(' + gid + ',' + lid + ',\'' + k + '\',this.value)">' + html + '</select>'; }
  function chk(on, js) { return '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="' + js + '">'; }

  ARM.resumen = function (t) {
    var p = t.puertas || {}, n = (t.cuerpos || []).length, h = p.tipo === 'ninguna' ? 0 : (/^corredera/.test(p.tipo) ? (p.hojas || 2) : null);
    var s = num(t.ancho) + ' × ' + num(t.alto) + ' × ' + num(t.fondo);
    if (t.clase !== 'solo_puertas') s += ' · ' + n + (n === 1 ? ' cuerpo' : ' cuerpos');
    if (/^corredera/.test(p.tipo)) s += ' · ' + h + ' correderas';
    else if (/^abatible/.test(p.tipo)) s += ' · puertas abatibles';
    else s += ' · sin puertas';
    return s;
  };

  function htmlTramo(g, l, i) {
    var t = l.arm, gid = g.id, lid = l.id, T = ARM.tabla(), r = ARM.calcularLinea(l), p = t.puertas || (t.puertas = {});
    var cab = '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:6px">'
      + '<b style="font-size:.85rem">' + (i + 1) + '.</b>'
      + '<input value="' + eh(t.nombre) + '" placeholder="' + eh(CLASES[t.clase]) + '" style="flex:1 1 120px;min-width:0" onchange="ARM.cambia(' + gid + ',' + lid + ',\'nombre\',this.value)">'
      + '<select onchange="ARM.cambia(' + gid + ',' + lid + ',\'clase\',this.value)">' + opciones(CLASES, t.clase) + '</select>'
      + '<button class="btn bdr bsm" data-arm="delTramo" onclick="ARM.accion(' + gid + ',' + lid + ',\'delTramo\')">✕</button></div>'
      + '<div style="font-size:.78rem;color:#555;margin-bottom:6px">' + eh(ARM.resumen(t)) + '</div>';
    var med = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">'
      + campo('Ancho (cm)', inp(gid, lid, 'ancho', t.ancho)) + campo('Alto', inp(gid, lid, 'alto', t.alto)) + campo('Fondo', inp(gid, lid, 'fondo', t.fondo))
      + (t.clase === 'solo_puertas' ? '' :
        campo('Casco', sel(gid, lid, 'casco', prods('materiales', t.casco, esTablero)), '2 1 160px')
        + campo('Trasera', sel(gid, lid, 'trasera', opciones(TRASERAS, t.trasera)), '1 1 120px')
        + campo('Montaje', sel(gid, lid, 'montaje', opciones({ empotrado: 'Empotrado', exento: 'Exento' }, t.montaje)), '1 1 100px')
        + campo('Zócalo', '<span>' + chk(t.zocalo, 'ARM.cambia(' + gid + ',' + lid + ',\'zocalo\',this.checked)') + '</span>', '0 0 50px'))
      + campo('Herraje', sel(gid, lid, 'gama', opciones(GAMAS, t.gama)), '1 1 110px')
      + campo('Difícil +20 %', '<span>' + chk(num(t.recargo) > 0, 'ARM.cambia(' + gid + ',' + lid + ',\'recargo\',this.checked?20:0)') + '</span>', '0 0 80px')
      + '</div>';
    var cu = '';
    if (t.clase !== 'solo_puertas') {
      cu = '<div style="font-size:.78rem;font-weight:600;margin:4px 0">Cuerpos</div>';
      (t.cuerpos || []).forEach(function (c, k) {
        var f = function (campoN, v, tipo) {
          return tipo === 'chk' ? chk(v, 'ARM.cambiaCuerpo(' + gid + ',' + lid + ',' + k + ',\'' + campoN + '\',this.checked)')
            : '<input type="number" inputmode="decimal" value="' + eh(v) + '" style="width:100%;box-sizing:border-box" onchange="ARM.cambiaCuerpo(' + gid + ',' + lid + ',' + k + ',\'' + campoN + '\',this.value)">';
        };
        cu += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;padding:4px 0;border-top:1px dashed #ddd">'
          + campo('Ancho', f('ancho', c.ancho), '1 1 60px') + campo('Estantes', f('estantes', c.estantes), '1 1 50px')
          + campo('Cajones', f('cajones', c.cajones), '1 1 50px')
          + campo('Maletero', '<span>' + f('maletero', c.maletero, 'chk') + '</span>', '0 0 56px')
          + campo('Barra', '<span>' + f('barra', c.barra, 'chk') + '</span>', '0 0 40px')
          + '<button class="btn bgh bsm" onclick="ARM.accion(' + gid + ',' + lid + ',\'delCuerpo\',' + k + ')">✕</button></div>'
          + htmlInteriores(gid, lid, k, c, T);
      });
      cu += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">'
        + '<button class="btn bgh bsm" data-arm="addCuerpo" onclick="ARM.accion(' + gid + ',' + lid + ',\'addCuerpo\')">+ cuerpo</button>'
        + '<button class="btn bgh bsm" onclick="ARM.accion(' + gid + ',' + lid + ',\'repartir\')">Repartir el ancho</button></div>';
    }
    var pu = '';
    if (t.clase !== 'solo_interior') {
      pu = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">'
        + campo('Puertas', '<select style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'tipo\',this.value)">' + opciones(PUERTAS, p.tipo) + '</select>', '2 1 160px');
      var sp = function (k, html, ancho) { return campo(k[0], '<select style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'' + k[1] + '\',this.value)">' + html + '</select>', ancho || '2 1 160px'); };
      if (/^corredera/.test(p.tipo)) pu += campo('Hojas', '<input type="number" min="1" max="6" value="' + eh(p.hojas) + '" style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'hojas\',this.value)">', '0 0 56px')
        + sp(['Kit de puerta', 'kit'], prods('kits', p.kit, function (x) { return x.solape !== undefined; }))
        + sp(['Guía', 'guia'], prods('kits', p.guia, function (x) { return x.largo !== undefined; }));
      if (p.tipo === 'corredera_tablero' || p.tipo === 'abatible_tablero') pu += sp(['Tablero de la puerta', 'mat'], prods('materiales', p.mat, esTablero));
      if (p.tipo === 'corredera_perfil') pu += sp(['Panel', 'panel'], prods('paneles', p.panel));
      if (p.tipo === 'abatible_comprada') pu += sp(['Hoja comprada', 'hoja'], prods('hojas', p.hoja));
      pu += '</div>';
    }
    var pie = '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:6px">';
    if (r && r.sinPrecio.length) pie += '<span class="arm-sinprecio" style="color:#b00020;font-weight:600">sin precio: ' + eh(r.sinPrecio.join(', ')) + '</span>';
    else if (r) pie += '<b style="font-size:.95rem">' + eur(ARM.precioLinea(l)) + '</b>';
    if (r && !cliente() && r.referencia !== null && r.precioBase !== null) {
      var sem = ARM.semaforo(r.precioBase, r.referencia), dif = Math.round((r.precioBase - r.referencia) / r.referencia * 100);
      var col = { verde: '#2e7d32', amarillo: '#b8860b', rojo: '#c62828' }[sem];
      pie += '<span class="arm-ref arm-' + sem + '" title="Referencia: ' + eh(num((T.referencia || {}).eur_m)) + ' €/m + ' + eh(num((T.referencia || {}).eur_cajon)) + ' €/cajón, herraje básico, sin interiores" style="font-size:.78rem;padding:2px 7px;border-radius:9px;border:1px solid ' + col + ';color:' + col + '">Ref. ' + eur(r.referencia) + ' · ' + (dif > 0 ? '+' : '') + dif + ' %</span>';
    }
    if (!cliente()) pie += '<button class="btn bgh bsm" onclick="ARM.accion(' + gid + ',' + lid + ',\'despiece\')">' + (abiertos[lid] ? 'Ocultar despiece' : 'Ver despiece') + '</button>';
    pie += '</div>';
    if (r && r.avisos.length) pie += '<div style="color:#b26a00;font-size:.78rem;margin-top:4px">⚠ ' + eh(r.avisos.join(' · ')) + '</div>';
    if (r && abiertos[lid] && !cliente()) pie += ARM.detalleInterno(t, T, r);
    return '<div class="arm-tramo" style="border:1px solid #ddd;border-radius:8px;padding:10px;margin:8px 0;background:#fff;max-width:100%;box-sizing:border-box">' + cab + med + cu + pu + pie + '</div>';
  }

  function htmlInteriores(gid, lid, k, c, T) {
    var h = '', cat = T.interior || {};
    (c.extras || []).forEach(function (x, j) {
      var p = cat[x.cod] || {}, e = ARM.costeProducto(p);
      h += '<div style="display:flex;align-items:center;gap:6px;font-size:.78rem;padding:2px 0 2px 8px">└ ' + eh(p.nombre || x.cod)
        + (cliente() ? '' : ' <span style="color:#888">' + (e === null ? '<span class="arm-sinprecio" style="color:#b00020">sin precio</span>' : r2(e).toFixed(2).replace('.', ',') + ' €') + ' · ' + eh(p.prov || '') + '</span>')
        + ' <button class="btn bgh bsm" onclick="ARM.delExtra(' + gid + ',' + lid + ',' + k + ',' + j + ')">✕</button></div>';
    });
    var lista = ARM.interiorPara(c.ancho, T), fams = {};
    lista.forEach(function (p) { (fams[p.familia] = fams[p.familia] || []).push(p); });
    if (!lista.length) return h;
    var opts = '<option value="">+ interior (cabe en ' + num(c.ancho) + ' cm)…</option>' + Object.keys(fams).map(function (f) {
      return '<optgroup label="' + eh(f) + '">' + fams[f].map(function (p) {
        return '<option value="' + eh(p.cod) + '">' + eh(p.nombre) + (cliente() ? '' : ' · ' + (p.coste === null ? 'sin precio' : r2(p.coste).toFixed(2).replace('.', ',') + ' €') + ' · ' + eh(p.prov || '')) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    return h + '<div style="padding:2px 0 4px 8px"><select data-arm="interior" style="max-width:100%;font-size:.78rem" onchange="ARM.addExtra(' + gid + ',' + lid + ',' + k + ',this.value)">' + opts + '</select></div>';
  }

  // Texto para el PDF del cliente: sin proveedores, precios de compra ni horas.
  ARM.descripcion = function (t, T) {
    if (!t || !t.clase) return 'Armario';
    T = T || ARM.tabla();
    var nom = function (cat, cod) { var p = ((T[cat] || {})[cod]) || {}; return String(p.nombre || cod || '').toLowerCase(); };
    var cab = { armario: 'Armario ' + (t.montaje === 'exento' ? 'exento' : 'empotrado'), vestidor: 'Vestidor', solo_puertas: 'Frente de puertas', solo_interior: 'Interior de armario' }[t.clase] || 'Armario';
    var partes = [cab + ' ' + num(t.ancho) + ' × ' + num(t.alto) + (t.clase === 'solo_puertas' ? '' : ' × ' + num(t.fondo)) + ' cm'];
    if (t.clase !== 'solo_puertas') partes.push('casco ' + nom('materiales', t.casco));
    var p = t.puertas || {}, n = /^corredera/.test(p.tipo) ? (p.hojas || 2) : ARM.despiece(t, T).puertas.hojas.length;
    if (p.tipo === 'corredera_tablero') partes.push(n + ' puertas correderas de ' + nom('materiales', p.mat || t.casco));
    else if (p.tipo === 'corredera_perfil') partes.push(n + ' puertas correderas de perfil de aluminio con ' + nom('paneles', p.panel));
    else if (p.tipo === 'abatible_tablero') partes.push(n + ' puertas abatibles de ' + nom('materiales', p.mat || t.casco));
    else if (p.tipo === 'abatible_comprada') partes.push(n + ' puertas abatibles (' + nom('hojas', p.hoja) + ')');
    else if (t.clase !== 'solo_interior') partes.push('sin puertas');
    var cs = t.clase === 'solo_puertas' ? [] : (t.cuerpos || []);
    if (cs.length) {
      var est = 0, caj = 0, barra = false, mal = false, ints = [];
      cs.forEach(function (c) {
        est += Math.max(0, Math.round(num(c.estantes))); caj += Math.max(0, Math.round(num(c.cajones)));
        barra = barra || !!c.barra; mal = mal || !!c.maletero;
        (c.extras || []).forEach(function (x) { var q = ((T.interior || {})[x.cod] || {}).nombre || x.cod; if (ints.indexOf(q) < 0) ints.push(q); });
      });
      var con = [];
      if (barra) con.push('barra'); if (mal) con.push('maletero');
      if (est) con.push(est + (est === 1 ? ' estante' : ' estantes')); if (caj) con.push(caj + (caj === 1 ? ' cajón' : ' cajones'));
      var txt = cs.length + (cs.length === 1 ? ' cuerpo' : ' cuerpos');
      if (con.length) txt += ' con ' + (con.length > 1 ? con.slice(0, -1).join(', ') + ' y ' + con[con.length - 1] : con[0]);
      partes.push(txt);
      if (ints.length) partes.push('interiores: ' + ints.join(', ').toLowerCase());
    }
    if (t.gama === 'media') partes.push('herrajes con cierre amortiguado');
    if (t.gama === 'alta') partes.push('herrajes de gama alta con cierre amortiguado');
    var s = partes.join(', ');
    return t.nombre ? t.nombre + ': ' + s : s;
  };

  ARM.detalleInterno = function (t, T, r) {
    r = r || ARM.calcular(t, T, ARM.margenApp());
    var d = r.despiece, filas = d.piezas.map(function (x) { return '<tr><td>' + eh(x.n) + '</td><td>' + x.cant + '</td><td>' + x.an + ' × ' + x.al + '</td></tr>'; }).join('');
    var mats = Object.keys(d.m2).map(function (m) { var p = (T.materiales || {})[m] || {}; return eh(p.nombre || m) + ' ' + r2(d.m2[m]) + ' m² (' + eh(p.prov || '') + ')'; }).join(' · ');
    return '<div class="arm-despiece" style="font-size:.75rem;margin-top:6px;overflow-x:auto"><table style="width:100%;border-collapse:collapse">' + filas + '</table>'
      + '<div style="margin-top:4px">' + mats + ' · canto ' + d.ml_canto + ' m · ' + d.horas + ' h de taller</div>'
      + '<div>Casco ' + eur(r.casco) + ' · puertas ' + eur(r.puertas) + ' · herrajes ' + eur(r.herrajes) + (r.extras ? ' · interiores ' + eur(r.extras) : '')
      + ' · taller ' + eur(r.taller) + ' · colocación ' + eur(r.colocacion) + ' · coste ' + eur(r.coste) + '</div></div>';
  };

  // Panel de precios (solo en el modo interno): horas, colocación, referencia y precios de compra.
  var panelAbierto = {};
  ARM.abrirPrecios = function (gid) { panelAbierto[gid] = !panelAbierto[gid]; repintarArmarios(); };
  function htmlPanel() {
    var T = ARM.tabla(), tt = T.taller || {}, co = T.colocacion || {}, re = T.referencia || {};
    var aj = function (lbl, sec, k, v) {
      return campo(lbl, '<input type="number" inputmode="decimal" step="0.05" value="' + eh(v) + '" style="width:100%;box-sizing:border-box" onchange="ARM.ponerAjuste(\'' + sec + '\',\'' + k + '\',this.value)">', '1 1 90px');
    };
    var h = '<div class="arm-panel" style="border:1px dashed #999;border-radius:8px;padding:10px;margin:8px 0;background:#fafafa;font-size:.8rem">'
      + '<b>Taller (21 €/h salvo que lo cambies)</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">'
      + aj('€/hora', 'taller', 'eur_h', tt.eur_h) + aj('Horas por tramo', 'taller', 'tramo', tt.tramo) + aj('Horas por cuerpo', 'taller', 'cuerpo', tt.cuerpo)
      + aj('Horas por estante', 'taller', 'estante', tt.estante) + aj('Horas por cajón', 'taller', 'cajon', tt.cajon)
      + aj('Horas por abatible', 'taller', 'abatible', tt.abatible) + aj('Horas por hoja corredera', 'taller', 'corredera', tt.corredera)
      + aj('Desperdicio %', 'desperdicio', '', T.desperdicio) + '</div>'
      + '<b>Colocación (sin margen)</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">'
      + aj('Armario €/ml', 'colocacion', 'armario', co.armario) + aj('Vestidor €/ml', 'colocacion', 'vestidor', co.vestidor) + aj('Solo puertas €/hueco', 'colocacion', 'solo_puertas', co.solo_puertas) + '</div>'
      + '<b>Referencia (solo orienta)</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">'
      + aj('€ por metro', 'referencia', 'eur_m', re.eur_m) + aj('€ por cajón', 'referencia', 'eur_cajon', re.eur_cajon) + '</div>'
      + '<b>Precios de compra</b> <span style="color:#777">(sin IVA; se usa la media de los 10 últimos; un precio nuevo se añade, no borra)</span>';
    var NOM = { materiales: 'Tableros', cantos: 'Cantos', kits: 'Kits de corredera', hojas: 'Hojas compradas', paneles: 'Paneles', herrajes: 'Herrajes por gama', interior: 'Interiores' };
    Object.keys(NOM).forEach(function (cat) {
      var c = T[cat] || {}, ks = Object.keys(c);
      if (!ks.length) return;
      h += '<details style="margin:4px 0"><summary>' + NOM[cat] + ' (' + ks.length + ')</summary><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
      ks.forEach(function (cod) {
        var p = c[cod], e = ARM.costeProducto(p), hh = p.historial || [];
        h += '<tr style="border-top:1px solid #eee"><td>' + eh(p.nombre) + (p.medida ? ' · ' + eh(p.medida) : '') + ' <span style="color:#888">' + eh(p.prov || '') + ' ' + eh(p.ref || '') + '</span></td>'
          + '<td style="white-space:nowrap">' + (e === null ? '<span style="color:#b00020">sin precio</span>' : r2(e).toFixed(2).replace('.', ',') + ' €') + ' <span style="color:#888">(' + hh.length + (hh.some(function (x) { return x.origen === 'estimado'; }) ? ', estimado' : '') + ')</span></td>'
          + '<td><input type="number" inputmode="decimal" step="0.01" placeholder="nuevo" style="width:76px" onchange="ARM.nuevoPrecio(\'' + eh(cod) + '\',this.value)"></td></tr>';
      });
      h += '</table></div></details>';
    });
    return h + '</div>';
  }

  ARM.render = function (g) {
    var h = (g.lines || []).map(function (l, i) { return l.arm ? htmlTramo(g, l, i) : ''; }).join('');
    return h + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">'
      + '<button class="btn bp bsm" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'armario\')">+ Tramo de armario</button>'
      + '<button class="btn bgh bsm" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'vestidor\')">+ Tramo de vestidor</button>'
      + '<button class="btn bgh bsm" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'solo_puertas\')">+ Solo puertas</button>'
      + (cliente() ? '' : '<button class="btn bgh bsm" data-arm="precios" onclick="ARM.abrirPrecios(' + g.id + ')">⚙ Precios de armarios</button>')
      + '</div>' + (!cliente() && panelAbierto[g.id] ? htmlPanel() : '');
  };

  // ── Cambios desde la pantalla ──
  function buscarLinea(gid, lid) {
    var g = (root.ST.groups || []).find(function (x) { return x.id === gid; });
    return { g: g, l: g && g.lines.find(function (x) { return x.id === lid; }) };
  }
  function repintar(gid) { if (typeof root.renderLines === 'function') root.renderLines(gid); if (typeof root.upBan === 'function') root.upBan(); }
  var NUMS = ['ancho', 'alto', 'fondo', 'estantes', 'cajones', 'hojas', 'recargo'];
  ARM.cambia = function (gid, lid, k, v) {
    var x = buscarLinea(gid, lid); if (!x.l) return;
    if (k === 'clase') { var n = ARM.nuevoTramo(v), t = x.l.arm; n.nombre = t.nombre; n.ancho = t.ancho; n.alto = t.alto; n.fondo = t.fondo; n.casco = t.casco; if (v !== 'solo_puertas' && t.cuerpos.length) n.cuerpos = t.cuerpos; x.l.arm = n; }
    else x.l.arm[k] = NUMS.indexOf(k) >= 0 ? num(v) : v;
    repintar(gid);
  };
  ARM.cambiaCuerpo = function (gid, lid, i, k, v) {
    var x = buscarLinea(gid, lid); if (!x.l || !x.l.arm.cuerpos[i]) return;
    x.l.arm.cuerpos[i][k] = typeof v === 'boolean' ? v : num(v);
    repintar(gid);
  };
  ARM.cambiaPuerta = function (gid, lid, k, v) {
    var x = buscarLinea(gid, lid); if (!x.l) return;
    x.l.arm.puertas[k] = k === 'hojas' ? Math.max(1, Math.round(num(v))) : v;
    repintar(gid);
  };
  ARM.addExtra = function (gid, lid, i, cod) {
    var x = buscarLinea(gid, lid); if (!x.l || !cod || !x.l.arm.cuerpos[i]) return;
    var c = x.l.arm.cuerpos[i]; (c.extras = c.extras || []).push({ cod: cod, und: 1 });
    repintar(gid);
  };
  ARM.delExtra = function (gid, lid, i, j) {
    var x = buscarLinea(gid, lid); if (!x.l || !x.l.arm.cuerpos[i]) return;
    x.l.arm.cuerpos[i].extras.splice(j, 1);
    repintar(gid);
  };
  ARM.accion = function (gid, lid, que, arg) {
    var x = buscarLinea(gid, lid), t = x.l && x.l.arm;
    if (que === 'addTramo' && x.g) x.g.lines.push(ARM.lineaNueva(arg));
    else if (que === 'delTramo' && x.g) { if (root.confirm && !root.confirm('¿Quitar este tramo?')) return; x.g.lines = x.g.lines.filter(function (l) { return l.id !== lid; }); }
    else if (que === 'addCuerpo' && t) { t.cuerpos.push({ ancho: 100, estantes: 1, maletero: true, barra: true, cajones: 0, extras: [] }); }
    else if (que === 'delCuerpo' && t) t.cuerpos.splice(arg, 1);
    else if (que === 'repartir' && t) ARM.repartir(t);
    else if (que === 'despiece') abiertos[lid] = !abiertos[lid];
    repintar(gid);
  };

  // Tabla de precios inicial (la genera `construir.py armarios`). La de la nube/dispositivo es `armarios_v1`.
  ARM.TABLA_INICIAL = {"materiales":{"ROBLE16":{"cod":"ROBLE16","prov":"MOR","ref":"0200306505","nombre":"Plastificado roble 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"factura"}]},"BLANCO16":{"cod":"BLANCO16","prov":"MOR","ref":"","nombre":"Melamina blanco liso 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"TEXTIL16":{"cod":"TEXTIL16","prov":"MOR","ref":"","nombre":"Melamina textil 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"DM16":{"cod":"DM16","prov":"MOR","ref":"0200408016","nombre":"DM (fibra) 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":7.14,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM19":{"cod":"DM19","prov":"MOR","ref":"","nombre":"DM (fibra) 19 mm","medida":"280x207","unidad":"m2","historial":[{"eur":8.48,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM3":{"cod":"DM3","prov":"MOR","ref":"","nombre":"DM 3 mm para trasera","medida":"244x122","unidad":"m2","historial":[{"eur":3.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]},"TABLERO10":{"cod":"TABLERO10","prov":"MOR","ref":"","nombre":"Tablero 10 mm para trasera","medida":"280x207","unidad":"m2","historial":[{"eur":7.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]}},"cantos":{"CANTO22":{"cod":"CANTO22","prov":"REI","ref":"2110","nombre":"Canto PVC 22x1 mm","medida":"","unidad":"m","historial":[{"eur":0.288,"fecha":"2023-01-25","prov":"REI","origen":"factura"}]}},"kits":{"EMU-KIT16":{"cod":"EMU-KIT16","prov":"FER","ref":"21000278","nombre":"Kit puerta corredera 16 mm blanco mate 2,6 m (Emuca)","medida":"2,6 m","unidad":"ud","historial":[{"eur":26.01,"fecha":"2025-11-28","prov":"FER","origen":"factura"}],"solape":3},"EMU-GUIA2":{"cod":"EMU-GUIA2","prov":"FER","ref":"21000256","nombre":"Kit guía corredera blanco mate 2 m (Emuca)","medida":"2 m","unidad":"ud","historial":[{"eur":26.21,"fecha":"2025-11-28","prov":"FER","origen":"factura"}],"largo":200},"TERRA-TR16":{"cod":"TERRA-TR16","prov":"BYS","ref":"","nombre":"Kit puerta Terra TR16 16 mm (Syskor)","medida":"","unidad":"ud","historial":[{"eur":39.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"TERRA-KG75":{"cod":"TERRA-KG75","prov":"BYS","ref":"","nombre":"Kit guías Terra KG75 (Syskor)","medida":"","unidad":"ud","historial":[{"eur":27.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"largo":200},"ATL-RT16":{"cod":"ATL-RT16","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT16","medida":"","unidad":"ud","historial":[{"eur":45.89,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3},"ATL-GUIA2":{"cod":"ATL-GUIA2","prov":"MEN","ref":"3921284","nombre":"Kit guías Atlántico 2 carriles 2 m plata","medida":"2 m","unidad":"ud","historial":[{"eur":34.09,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"largo":200},"ATL-RT10":{"cod":"ATL-RT10","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT10 (panel 10 mm, espejo o cristal)","medida":"","unidad":"ud","historial":[{"eur":47.86,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3}},"perfiles":{},"hojas":{"HOJA-LAC":{"cod":"HOJA-LAC","prov":"BRI","ref":"","nombre":"Hoja lacada a medida (media de grupos de cocina)","medida":"","unidad":"m2","historial":[{"eur":110.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}]},"HOJA-LAM":{"cod":"HOJA-LAM","prov":"BRI","ref":"","nombre":"Hoja laminada a medida","medida":"","unidad":"m2","historial":[{"eur":60.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}]}},"paneles":{"ESPEJO4":{"cod":"ESPEJO4","prov":"SAL","ref":"","nombre":"Espejo plata 4 mm","medida":"","unidad":"m2","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]},"CRISTAL4":{"cod":"CRISTAL4","prov":"SAL","ref":"","nombre":"Cristal 4 mm","medida":"","unidad":"m2","historial":[{"eur":30.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]}},"herrajes":{"SOPORTE":{"cod":"SOPORTE","prov":"BYS","ref":"","nombre":"Soporte de estante","medida":"","unidad":"ud","historial":[{"eur":0.25,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-B":{"cod":"BARRA-B","prov":"BYS","ref":"","nombre":"Barra oval cromada con soportes","medida":"","unidad":"m","historial":[{"eur":8.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-M":{"cod":"BARRA-M","prov":"BYS","ref":"","nombre":"Barra de aluminio ovalada con soportes","medida":"","unidad":"m","historial":[{"eur":12.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-A":{"cod":"BARRA-A","prov":"MEN","ref":"","nombre":"Barra de aluminio con LED","medida":"","unidad":"m","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"MEN","origen":"estimado"}]},"BISAGRA-B":{"cod":"BISAGRA-B","prov":"FER","ref":"","nombre":"Bisagra normal","medida":"","unidad":"ud","historial":[{"eur":1.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-M":{"cod":"BISAGRA-M","prov":"FER","ref":"","nombre":"Bisagra con freno","medida":"","unidad":"ud","historial":[{"eur":2.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-A":{"cod":"BISAGRA-A","prov":"FER","ref":"","nombre":"Bisagra con freno gama alta (Blum)","medida":"","unidad":"ud","historial":[{"eur":4.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-B":{"cod":"CAJON-B","prov":"FER","ref":"","nombre":"Cajón interior con guía de bolas (material)","medida":"","unidad":"ud","historial":[{"eur":20.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-M":{"cod":"CAJON-M","prov":"FER","ref":"","nombre":"Cajón interior con guía oculta y freno","medida":"","unidad":"ud","historial":[{"eur":32.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-A":{"cod":"CAJON-A","prov":"FER","ref":"","nombre":"Cajón interior de doble pared con freno","medida":"","unidad":"ud","historial":[{"eur":55.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]}},"interior":{"MEN-3007086":{"cod":"MEN-3007086","prov":"MEN","ref":"3007086","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"500-600","unidad":"ud","historial":[{"eur":89.42,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":53,"max":63,"familia":"Pantaloneros y faldas"},"MEN-3007108":{"cod":"MEN-3007108","prov":"MEN","ref":"3007108","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"600-700","unidad":"ud","historial":[{"eur":91.72,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":73,"familia":"Pantaloneros y faldas"},"MEN-3007130":{"cod":"MEN-3007130","prov":"MEN","ref":"3007130","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"700-800","unidad":"ud","historial":[{"eur":97.59,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":73,"max":83,"familia":"Pantaloneros y faldas"},"MEN-3007064":{"cod":"MEN-3007064","prov":"MEN","ref":"3007064","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"800-900","unidad":"ud","historial":[{"eur":102.62,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":93,"familia":"Pantaloneros y faldas"},"MEN-3008120":{"cod":"MEN-3008120","prov":"MEN","ref":"3008120","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 490 mm","medida":"600-700","unidad":"ud","historial":[{"eur":103.65,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":73,"familia":"Pantaloneros y faldas"},"MEN-3008142":{"cod":"MEN-3008142","prov":"MEN","ref":"3008142","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 490 mm","medida":"800-900","unidad":"ud","historial":[{"eur":120.15,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":93,"familia":"Pantaloneros y faldas"},"MEN-0100297":{"cod":"MEN-0100297","prov":"MEN","ref":"0100297","nombre":"Soporte pantalonero extraíble lateral con bandeja antracita","medida":"600-650","unidad":"ud","historial":[{"eur":116.4,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":68,"familia":"Pantaloneros y faldas"},"MEN-0100385":{"cod":"MEN-0100385","prov":"MEN","ref":"0100385","nombre":"Soporte pantalonero extraíble lateral con bandeja antracita","medida":"800-850","unidad":"ud","historial":[{"eur":133.16,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":88,"familia":"Pantaloneros y faldas"},"MEN-3007152":{"cod":"MEN-3007152","prov":"MEN","ref":"3007152","nombre":"Pantalonero CHIC de fijación lateral con guía de extracción total","medida":"475 mm","unidad":"ud","historial":[{"eur":62.77,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":51,"max":61,"familia":"Pantaloneros y faldas"},"MEN-3007174":{"cod":"MEN-3007174","prov":"MEN","ref":"3007174","nombre":"Pantalonero CHIC de fijación superior con bandeja","medida":"360 mm","unidad":"ud","historial":[{"eur":59.2,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":40,"max":50,"familia":"Pantaloneros y faldas"},"MEN-3007196":{"cod":"MEN-3007196","prov":"MEN","ref":"3007196","nombre":"Pantalonero doble CHIC de fijación superior con bandeja","medida":"700 mm","unidad":"ud","historial":[{"eur":69.84,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":74,"max":84,"familia":"Pantaloneros y faldas"},"MEN-3002496":{"cod":"MEN-3002496","prov":"MEN","ref":"3002496","nombre":"Pantalonero extraíble cromo para 9 pantalones (fijación superior)","medida":"330 mm","unidad":"ud","historial":[{"eur":32.87,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":37,"max":47,"familia":"Pantaloneros y faldas"},"MEN-3002485":{"cod":"MEN-3002485","prov":"MEN","ref":"3002485","nombre":"Pantalonero cromo para 18 pantalones (fijación superior)","medida":"662 mm","unidad":"ud","historial":[{"eur":38.08,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":70,"max":80,"familia":"Pantaloneros y faldas"},"MEN-3003771":{"cod":"MEN-3003771","prov":"MEN","ref":"3003771","nombre":"Zapatero extraíble sin frontal (mueble con puerta)","medida":"45-65 cm","unidad":"ud","historial":[{"eur":85.0,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":48,"max":68,"familia":"Zapateros"},"MEN-3003782":{"cod":"MEN-3003782","prov":"MEN","ref":"3003782","nombre":"Zapatero extraíble sin frontal (mueble con puerta)","medida":"64-100 cm","unidad":"ud","historial":[{"eur":98.62,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":67,"max":103,"familia":"Zapateros"},"MEN-3000913":{"cod":"MEN-3000913","prov":"MEN","ref":"3000913","nombre":"Zapatero extraíble con sujeción frontal","medida":"45-65 cm","unidad":"ud","historial":[{"eur":92.74,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":48,"max":68,"familia":"Zapateros"},"MEN-3000924":{"cod":"MEN-3000924","prov":"MEN","ref":"3000924","nombre":"Zapatero extraíble con sujeción frontal","medida":"64-100 cm","unidad":"ud","historial":[{"eur":107.15,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":67,"max":103,"familia":"Zapateros"},"MEN-0129935":{"cod":"MEN-0129935","prov":"MEN","ref":"0129935","nombre":"Juego soporte zapateros extraíble","medida":"500-600","unidad":"ud","historial":[{"eur":93.99,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":54,"max":64,"familia":"Zapateros"},"MEN-0129950":{"cod":"MEN-0129950","prov":"MEN","ref":"0129950","nombre":"Juego soporte zapateros extraíble","medida":"700-800","unidad":"ud","historial":[{"eur":97.55,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":74,"max":84,"familia":"Zapateros"},"MEN-0129961":{"cod":"MEN-0129961","prov":"MEN","ref":"0129961","nombre":"Juego soporte zapateros extraíble","medida":"800-900","unidad":"ud","historial":[{"eur":106.37,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":84,"max":94,"familia":"Zapateros"},"MEN-3003896":{"cod":"MEN-3003896","prov":"MEN","ref":"3003896","nombre":"Zapatero extraíble de fijación lateral cromado 320 x 600","medida":"600 mm","unidad":"ud","historial":[{"eur":128.01,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Zapateros"},"MEN-3006844":{"cod":"MEN-3006844","prov":"MEN","ref":"3006844","nombre":"Soporte zapatero CHIC para bandeja extraíble","medida":"600-700","unidad":"ud","historial":[{"eur":37.82,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":73,"familia":"Zapateros"},"MEN-3006866":{"cod":"MEN-3006866","prov":"MEN","ref":"3006866","nombre":"Soporte zapatero CHIC para bandeja extraíble","medida":"800-900","unidad":"ud","historial":[{"eur":38.84,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":93,"familia":"Zapateros"},"MEN-3000536":{"cod":"MEN-3000536","prov":"MEN","ref":"3000536","nombre":"Zapatero fijo extensible cromado","medida":"","unidad":"ud","historial":[{"eur":8.43,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":10.01,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Zapateros"},"MEN-3001251":{"cod":"MEN-3001251","prov":"MEN","ref":"3001251","nombre":"Corbatero/cinturonero extraíble lateral negro","medida":"500 mm","unidad":"ud","historial":[{"eur":30.03,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-0119973":{"cod":"MEN-0119973","prov":"MEN","ref":"0119973","nombre":"Corbatero/cinturonero extraíble lateral plata mate","medida":"500 mm","unidad":"ud","historial":[{"eur":39.6,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-3007262":{"cod":"MEN-3007262","prov":"MEN","ref":"3007262","nombre":"Corbatero cinturonero CHIC con tirador y guía de extracción","medida":"458 mm","unidad":"ud","historial":[{"eur":25.44,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-3000814":{"cod":"MEN-3000814","prov":"MEN","ref":"3000814","nombre":"Corbatero cinturonero fijo lateral","medida":"455 mm","unidad":"ud","historial":[{"eur":13.14,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-3002765":{"cod":"MEN-3002765","prov":"MEN","ref":"3002765","nombre":"Colgador abatible doble (elevador) económico","medida":"650-920 mm","unidad":"ud","historial":[{"eur":39.48,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":68,"max":95,"familia":"Colgadores abatibles"},"MEN-3002776":{"cod":"MEN-3002776","prov":"MEN","ref":"3002776","nombre":"Colgador abatible doble (elevador) económico","medida":"880-1270 mm","unidad":"ud","historial":[{"eur":40.01,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":91,"max":130,"familia":"Colgadores abatibles"},"MEN-3001461":{"cod":"MEN-3001461","prov":"MEN","ref":"3001461","nombre":"Colgador abatible doble (elevador) LIFT","medida":"750-1170 mm","unidad":"ud","historial":[{"eur":49.77,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":78,"max":120,"familia":"Colgadores abatibles"},"MEN-3000610":{"cod":"MEN-3000610","prov":"MEN","ref":"3000610","nombre":"Colgador abatible doble (elevador) SUPER LIFT con regulación de carga","medida":"750-1170 mm","unidad":"ud","historial":[{"eur":88.48,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":78,"max":120,"familia":"Colgadores abatibles"},"MEN-3007526":{"cod":"MEN-3007526","prov":"MEN","ref":"3007526","nombre":"Colgador abatible doble (elevador) CHIC","medida":"560-950 mm","unidad":"ud","historial":[{"eur":138.68,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":59,"max":98,"familia":"Colgadores abatibles"},"MEN-3000481":{"cod":"MEN-3000481","prov":"MEN","ref":"3000481","nombre":"Colgador abatible individual (elevador)","medida":"450-550 mm","unidad":"ud","historial":[{"eur":53.72,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":48,"max":58,"familia":"Colgadores abatibles"},"MEN-8700561":{"cod":"MEN-8700561","prov":"MEN","ref":"8700561","nombre":"Barra WARDROBE con LED y sensor de movimiento","medida":"600 mm","unidad":"ud","historial":[{"eur":56.14,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":60,"max":70,"familia":"Barras con LED"},"MEN-8700572":{"cod":"MEN-8700572","prov":"MEN","ref":"8700572","nombre":"Barra WARDROBE con LED y sensor de movimiento","medida":"1000 mm","unidad":"ud","historial":[{"eur":69.96,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":95,"max":110,"familia":"Barras con LED"},"MEN-8700583":{"cod":"MEN-8700583","prov":"MEN","ref":"8700583","nombre":"Barra WARDROBE con LED y sensor de movimiento","medida":"1200 mm","unidad":"ud","historial":[{"eur":80.1,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":115,"max":130,"familia":"Barras con LED"},"MEN-8317473":{"cod":"MEN-8317473","prov":"MEN","ref":"8317473","nombre":"Barra LYTHOS con LED y batería recargable","medida":"","unidad":"ud","historial":[{"eur":43.16,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":48.76,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":55.43,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras con LED"},"MEN-3004670":{"cod":"MEN-3004670","prov":"MEN","ref":"3004670","nombre":"Barra NEW KERRI rectangular antideslizante 2 m","medida":"2 m","unidad":"ud","historial":[{"eur":16.51,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3000275":{"cod":"MEN-3000275","prov":"MEN","ref":"3000275","nombre":"Barra NEW KERRI curva 90 grados para rincón 1+1 m","medida":"1+1 m","unidad":"ud","historial":[{"eur":63.9,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3000957":{"cod":"MEN-3000957","prov":"MEN","ref":"3000957","nombre":"Soporte de extracción total para perchas","medida":"360 mm","unidad":"ud","historial":[{"eur":22.23,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3000968":{"cod":"MEN-3000968","prov":"MEN","ref":"3000968","nombre":"Soporte de extracción total para perchas","medida":"445 mm","unidad":"ud","historial":[{"eur":25.07,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3002780":{"cod":"MEN-3002780","prov":"MEN","ref":"3002780","nombre":"Cuelgaperchas extensible tipo trompeta","medida":"80 cm","unidad":"ud","historial":[{"eur":46.39,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-0122821":{"cod":"MEN-0122821","prov":"MEN","ref":"0122821","nombre":"Espejo extraíble para el interior del armario","medida":"","unidad":"ud","historial":[{"eur":127.44,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":203.91,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Espejos y colgadores"},"MEN-3002791":{"cod":"MEN-3002791","prov":"MEN","ref":"3002791","nombre":"Soporte para trajes abatible de 3 posiciones","medida":"","unidad":"ud","historial":[{"eur":19.86,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Espejos y colgadores"},"MEN-3000990":{"cod":"MEN-3000990","prov":"MEN","ref":"3000990","nombre":"Protector de mangas y soporte para perchas","medida":"","unidad":"ud","historial":[{"eur":15.36,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Espejos y colgadores"},"MEN-0129880":{"cod":"MEN-0129880","prov":"MEN","ref":"0129880","nombre":"Kit bandeja extraíble","medida":"","unidad":"ud","historial":[{"eur":90.57,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":98.5,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":107.47,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles"},"MEN-3000979":{"cod":"MEN-3000979","prov":"MEN","ref":"3000979","nombre":"Juego de guías para estante extraíble","medida":"","unidad":"ud","historial":[{"eur":55.32,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles"},"MEN-3006778":{"cod":"MEN-3006778","prov":"MEN","ref":"3006778","nombre":"Juego de laterales CHIC con guía de extracción total para bandeja","medida":"492 mm","unidad":"ud","historial":[{"eur":59.3,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles"}},"gamas":{"basica":{"barra":"BARRA-B","bisagra":"BISAGRA-B","cajon":"CAJON-B"},"media":{"barra":"BARRA-M","bisagra":"BISAGRA-M","cajon":"CAJON-M"},"alta":{"barra":"BARRA-A","bisagra":"BISAGRA-A","cajon":"CAJON-A"}},"traseras":{"dm3":"DM3","tablero10":"TABLERO10"},"canto":"CANTO22","soporte":"SOPORTE","kitDefecto":{"kit":"EMU-KIT16","guia":"EMU-GUIA2"},"taller":{"eur_h":21,"tramo":4,"cuerpo":5,"estante":0.5,"cajon":1,"abatible":0.75,"corredera":1.5},"desperdicio":15,"colocacion":{"armario":90,"vestidor":70,"solo_puertas":60},"referencia":{"eur_m":540,"eur_cajon":50},"version":1};

  root.ARM = ARM;
  if (typeof module !== 'undefined' && module.exports) module.exports = ARM;
})(typeof window !== 'undefined' ? window : globalThis);
