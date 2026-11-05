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

  ARM.calcular = function (t, tabla, margen) {
    var d = ARM.despiece(t, tabla), falta = [], desp = 1 + num(tabla.desperdicio) / 100;
    var gama = (tabla.gamas || {})[t.gama || 'basica'] || (tabla.gamas || {}).basica || {};
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
    var materiales = casco + puertas + herr, taller = d.horas * num((tabla.taller || {}).eur_h);
    var rec = 1 + num(t.recargo) / 100, m = num(margen);
    var precio = ((materiales + taller) * (1 + m) + colocacion) * rec;
    var cajones = 0; (t.cuerpos || []).forEach(function (c) { cajones += Math.max(0, Math.round(num(c.cajones))); });
    var ref = tabla.referencia || {}, referencia = (t.clase === 'solo_puertas' || t.clase === 'solo_interior') ? null
      : r2(ancho / 100 * num(ref.eur_m) + cajones * num(ref.eur_cajon));
    var sinPrecio = falta.length > 0;
    return { materiales: r2(materiales), casco: r2(casco), puertas: r2(puertas), herrajes: r2(herr), extras: 0,
      horas: d.horas, taller: r2(taller), colocacion: r2(colocacion), coste: r2(materiales + taller + colocacion),
      precio: sinPrecio ? null : r2(precio), precioBase: sinPrecio ? null : r2(precio), referencia: referencia,
      sinPrecio: falta, avisos: d.avisos, despiece: d };
  };

  ARM.semaforo = function (base, ref) {
    if (base === null || base === undefined || !ref) return null;
    var dif = Math.abs(base - ref) / ref;
    return dif <= 0.10 ? 'verde' : dif <= 0.25 ? 'amarillo' : 'rojo';
  };

  // ── Dentro de la app ──
  // Tabla: la guardada en el dispositivo/nube (armarios_v1) o, si no hay, la inicial de este archivo.
  ARM.tabla = function () {
    try { var t = JSON.parse(root.localStorage.getItem('armarios_v1') || 'null'); if (t && t.materiales) return t; } catch (e) {}
    return ARM.TABLA_INICIAL;
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
          + '<button class="btn bgh bsm" onclick="ARM.accion(' + gid + ',' + lid + ',\'delCuerpo\',' + k + ')">✕</button></div>';
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

  ARM.detalleInterno = function (t, T, r) {
    r = r || ARM.calcular(t, T, ARM.margenApp());
    var d = r.despiece, filas = d.piezas.map(function (x) { return '<tr><td>' + eh(x.n) + '</td><td>' + x.cant + '</td><td>' + x.an + ' × ' + x.al + '</td></tr>'; }).join('');
    var mats = Object.keys(d.m2).map(function (m) { var p = (T.materiales || {})[m] || {}; return eh(p.nombre || m) + ' ' + r2(d.m2[m]) + ' m² (' + eh(p.prov || '') + ')'; }).join(' · ');
    return '<div class="arm-despiece" style="font-size:.75rem;margin-top:6px;overflow-x:auto"><table style="width:100%;border-collapse:collapse">' + filas + '</table>'
      + '<div style="margin-top:4px">' + mats + ' · canto ' + d.ml_canto + ' m · ' + d.horas + ' h de taller</div>'
      + '<div>Casco ' + eur(r.casco) + ' · puertas ' + eur(r.puertas) + ' · herrajes ' + eur(r.herrajes) + (r.extras ? ' · interiores ' + eur(r.extras) : '')
      + ' · taller ' + eur(r.taller) + ' · colocación ' + eur(r.colocacion) + ' · coste ' + eur(r.coste) + '</div></div>';
  };

  ARM.render = function (g) {
    var h = (g.lines || []).map(function (l, i) { return l.arm ? htmlTramo(g, l, i) : ''; }).join('');
    return h + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">'
      + '<button class="btn bp bsm" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'armario\')">+ Tramo de armario</button>'
      + '<button class="btn bgh bsm" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'vestidor\')">+ Tramo de vestidor</button>'
      + '<button class="btn bgh bsm" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'solo_puertas\')">+ Solo puertas</button></div>';
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
  ARM.TABLA_INICIAL = {"materiales":{"ROBLE16":{"cod":"ROBLE16","prov":"MOR","ref":"0200306505","nombre":"Plastificado roble 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"factura"}]},"BLANCO16":{"cod":"BLANCO16","prov":"MOR","ref":"","nombre":"Melamina blanco liso 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"TEXTIL16":{"cod":"TEXTIL16","prov":"MOR","ref":"","nombre":"Melamina textil 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"DM16":{"cod":"DM16","prov":"MOR","ref":"0200408016","nombre":"DM (fibra) 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":7.14,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM19":{"cod":"DM19","prov":"MOR","ref":"","nombre":"DM (fibra) 19 mm","medida":"280x207","unidad":"m2","historial":[{"eur":8.48,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM3":{"cod":"DM3","prov":"MOR","ref":"","nombre":"DM 3 mm para trasera","medida":"244x122","unidad":"m2","historial":[{"eur":3.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]},"TABLERO10":{"cod":"TABLERO10","prov":"MOR","ref":"","nombre":"Tablero 10 mm para trasera","medida":"280x207","unidad":"m2","historial":[{"eur":7.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]}},"cantos":{"CANTO22":{"cod":"CANTO22","prov":"REI","ref":"2110","nombre":"Canto PVC 22x1 mm","medida":"","unidad":"m","historial":[{"eur":0.288,"fecha":"2023-01-25","prov":"REI","origen":"factura"}]}},"kits":{"EMU-KIT16":{"cod":"EMU-KIT16","prov":"FER","ref":"21000278","nombre":"Kit puerta corredera 16 mm blanco mate 2,6 m (Emuca)","medida":"2,6 m","unidad":"ud","historial":[{"eur":26.01,"fecha":"2025-11-28","prov":"FER","origen":"factura"}],"solape":3},"EMU-GUIA2":{"cod":"EMU-GUIA2","prov":"FER","ref":"21000256","nombre":"Kit guía corredera blanco mate 2 m (Emuca)","medida":"2 m","unidad":"ud","historial":[{"eur":26.21,"fecha":"2025-11-28","prov":"FER","origen":"factura"}],"largo":200},"TERRA-TR16":{"cod":"TERRA-TR16","prov":"BYS","ref":"","nombre":"Kit puerta Terra TR16 16 mm (Syskor)","medida":"","unidad":"ud","historial":[{"eur":39.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"TERRA-KG75":{"cod":"TERRA-KG75","prov":"BYS","ref":"","nombre":"Kit guías Terra KG75 (Syskor)","medida":"","unidad":"ud","historial":[{"eur":27.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"largo":200},"ATL-RT16":{"cod":"ATL-RT16","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT16","medida":"","unidad":"ud","historial":[{"eur":45.89,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3},"ATL-GUIA2":{"cod":"ATL-GUIA2","prov":"MEN","ref":"3921284","nombre":"Kit guías Atlántico 2 carriles 2 m plata","medida":"2 m","unidad":"ud","historial":[{"eur":34.09,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"largo":200},"ATL-RT10":{"cod":"ATL-RT10","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT10 (panel 10 mm, espejo o cristal)","medida":"","unidad":"ud","historial":[{"eur":47.86,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3}},"perfiles":{},"hojas":{"HOJA-LAC":{"cod":"HOJA-LAC","prov":"BRI","ref":"","nombre":"Hoja lacada a medida (media de grupos de cocina)","medida":"","unidad":"m2","historial":[{"eur":110.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}]},"HOJA-LAM":{"cod":"HOJA-LAM","prov":"BRI","ref":"","nombre":"Hoja laminada a medida","medida":"","unidad":"m2","historial":[{"eur":60.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}]}},"paneles":{"ESPEJO4":{"cod":"ESPEJO4","prov":"SAL","ref":"","nombre":"Espejo plata 4 mm","medida":"","unidad":"m2","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]},"CRISTAL4":{"cod":"CRISTAL4","prov":"SAL","ref":"","nombre":"Cristal 4 mm","medida":"","unidad":"m2","historial":[{"eur":30.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]}},"herrajes":{"SOPORTE":{"cod":"SOPORTE","prov":"BYS","ref":"","nombre":"Soporte de estante","medida":"","unidad":"ud","historial":[{"eur":0.25,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-B":{"cod":"BARRA-B","prov":"BYS","ref":"","nombre":"Barra oval cromada con soportes","medida":"","unidad":"m","historial":[{"eur":8.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-M":{"cod":"BARRA-M","prov":"BYS","ref":"","nombre":"Barra de aluminio ovalada con soportes","medida":"","unidad":"m","historial":[{"eur":12.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-A":{"cod":"BARRA-A","prov":"MEN","ref":"","nombre":"Barra de aluminio con LED","medida":"","unidad":"m","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"MEN","origen":"estimado"}]},"BISAGRA-B":{"cod":"BISAGRA-B","prov":"FER","ref":"","nombre":"Bisagra normal","medida":"","unidad":"ud","historial":[{"eur":1.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-M":{"cod":"BISAGRA-M","prov":"FER","ref":"","nombre":"Bisagra con freno","medida":"","unidad":"ud","historial":[{"eur":2.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-A":{"cod":"BISAGRA-A","prov":"FER","ref":"","nombre":"Bisagra con freno gama alta (Blum)","medida":"","unidad":"ud","historial":[{"eur":4.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-B":{"cod":"CAJON-B","prov":"FER","ref":"","nombre":"Cajón interior con guía de bolas (material)","medida":"","unidad":"ud","historial":[{"eur":20.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-M":{"cod":"CAJON-M","prov":"FER","ref":"","nombre":"Cajón interior con guía oculta y freno","medida":"","unidad":"ud","historial":[{"eur":32.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-A":{"cod":"CAJON-A","prov":"FER","ref":"","nombre":"Cajón interior de doble pared con freno","medida":"","unidad":"ud","historial":[{"eur":55.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]}},"interior":{},"gamas":{"basica":{"barra":"BARRA-B","bisagra":"BISAGRA-B","cajon":"CAJON-B"},"media":{"barra":"BARRA-M","bisagra":"BISAGRA-M","cajon":"CAJON-M"},"alta":{"barra":"BARRA-A","bisagra":"BISAGRA-A","cajon":"CAJON-A"}},"traseras":{"dm3":"DM3","tablero10":"TABLERO10"},"canto":"CANTO22","soporte":"SOPORTE","kitDefecto":{"kit":"EMU-KIT16","guia":"EMU-GUIA2"},"taller":{"eur_h":21,"tramo":4,"cuerpo":5,"estante":0.5,"cajon":1,"abatible":0.75,"corredera":1.5},"desperdicio":15,"colocacion":{"armario":90,"vestidor":70,"solo_puertas":60},"referencia":{"eur_m":540,"eur_cajon":50},"version":1};

  root.ARM = ARM;
  if (typeof module !== 'undefined' && module.exports) module.exports = ARM;
})(typeof window !== 'undefined' ? window : globalThis);
