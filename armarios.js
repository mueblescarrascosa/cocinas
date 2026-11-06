/* Armarios y vestidores · cálculo, tabla de precios, pantalla y PDF.
   Se carga antes que la app. Todo cuelga de window.ARM; si este archivo falla, las cocinas siguen igual.
   Especificación: 5_TARIFA_2026/docs/2026-11-05-armarios-diseno.md */
(function (root) {
  'use strict';
  var ARM = root.ARM || {};

  function num(v) { var n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function r2(v) { return Math.round(v * 100) / 100; }

  // Coste de compra = media de los 10 últimos precios (nunca el más barato), con el recargo del proveedor.
  // Un juego (`componentes`) cuesta la suma de sus piezas; si falta una, no tiene precio.
  // Un material lacado = tablero base + lacado + horas de lacado por m².
  ARM.costeProducto = function (p, tabla, _prof) {
    if (!p) return null;
    tabla = tabla || (typeof ARM.tabla === 'function' && root.document ? ARM.tabla() : {}) || {};
    _prof = (_prof || 0) + 1; if (_prof > 5) return null;
    if (p.componentes && p.componentes.length) {
      var s = 0;
      for (var i = 0; i < p.componentes.length; i++) {
        var x = p.componentes[i], c = ARM.costeProducto(buscar(tabla, x.cod), tabla, _prof);
        if (c === null) return null;
        s += c * (num(x.und) || 1);
      }
      return r2(s);
    }
    if (p.lacado) {
      var b = ARM.costeProducto(buscar(tabla, p.lacado.base), tabla, _prof), l = ARM.costeProducto(buscar(tabla, p.lacado.lac), tabla, _prof);
      if (b === null || l === null) return null;
      return r2(b + l + num(p.lacado.horas_m2) * num((tabla.taller || {}).eur_h));
    }
    if (!p.historial || !p.historial.length) return null;
    var h = p.historial.slice(0, 10), t = 0;
    h.forEach(function (x) { t += num(x.eur); });
    var rec = num((tabla.recargoProv || {})[p.prov]);
    return r2(t / h.length * (1 + rec / 100));
  };

  var CATS_BUSCAR = ['materiales', 'lacados', 'cantos', 'kits', 'perfiles', 'hojas', 'paneles', 'herrajes', 'interior'];
  function buscar(tabla, cod) {
    if (!cod || !tabla) return null;
    for (var i = 0; i < CATS_BUSCAR.length; i++) { var c = tabla[CATS_BUSCAR[i]]; if (c && c[cod]) return c[cod]; }
    return null;
  }
  // Devuelve el coste y apunta en `falta` lo que no tiene precio.
  function coste(tabla, cod, falta) {
    var p = buscar(tabla, cod), c = ARM.costeProducto(p, tabla);
    if (c === null) { var n = (p && p.nombre) || cod || '¿?'; if (falta.indexOf(n) < 0) falta.push(n); return 0; }
    return c;
  }

  ARM.hojasCorredera = function (ancho, n, solape) {
    n = Math.max(1, Math.round(num(n))); solape = solape === undefined ? 3 : num(solape);
    return { n: n, ancho: r2((num(ancho) + solape * (n - 1)) / n) };
  };

  function juntar(lista) {
    var o = [], idx = {};
    lista.forEach(function (x) { if (idx[x.cod] === undefined) { idx[x.cod] = o.length; o.push({ cod: x.cod, und: 0 }); } o[idx[x.cod]].und += x.und; });
    return o;
  }
  // Guías de un sistema para cubrir `ancho` cm con `hojas` puertas: 3 carriles si hay 3 hojas o más y existe guía triple;
  // la más corta que cubra el ancho y, si ninguna llega, la más larga tantas veces como haga falta más la que cubra el resto.
  ARM.guiasPara = function (s, ancho, hojas) {
    var g = (s && s.guias) || [], n = Math.max(1, Math.round(num(hojas)) || 1);
    if (!g.length) return [];
    var maxC = 0; g.forEach(function (x) { maxC = Math.max(maxC, num(x.carriles)); });
    var quiero = n >= 3 && maxC >= 3 ? 3 : Math.min(n, 2);
    var uso = g.filter(function (x) { return num(x.carriles) === quiero; });
    if (!uso.length) uso = g.filter(function (x) { return num(x.carriles) === maxC; });
    uso = uso.slice().sort(function (a, b) { return num(a.largo) - num(b.largo); });
    var largo = uso[uso.length - 1], resto = num(ancho), out = [];
    if (!(num(largo.largo) > 0)) return [{ cod: largo.cod, und: 1 }];
    while (resto > 0) {
      var cubre = uso.filter(function (x) { return num(x.largo) >= resto; })[0];
      if (cubre) { out.push({ cod: cubre.cod, und: 1 }); break; }
      out.push({ cod: largo.cod, und: 1 }); resto -= num(largo.largo);
    }
    return juntar(out);
  };
  function sistemaDe(t, tabla) { var p = t.puertas || {}; return p.sistema ? (tabla.sistemas || {})[p.sistema] || null : null; }
  // Piezas de compra de unas puertas correderas: [{cod, und}] y avisos.
  // Hojas por defecto de cada tipo de puerta
  function hojasDe(t) {
    var p = t.puertas || {}, d = t.clase === 'puerta_paso' ? 1 : p.tipo === 'plegable_tablero' ? 4 : 2;
    if (p.hojasAuto && /^corredera/.test(p.tipo || '') && t.clase !== 'puerta_paso' && (t.cuerpos || []).length) return t.cuerpos.length;
    return Math.max(1, Math.round(num(p.hojas)) || d);
  }
  // Plegables (Slido Fold): un juego de herrajes por cada par de hojas (izquierdo y derecho alternos) y carriles de 2,5 m.
  function piezasPlegable(t, tabla, n) {
    var P = tabla.plegable || {}, piezas = [], avisos = [], A = num(t.ancho), j = Math.ceil(n / 2);
    for (var i = 0; i < j; i++) piezas.push({ cod: i % 2 ? P.juegoDer : P.juegoIzq, und: 1 });
    piezas.push({ cod: P.carril, und: Math.max(1, Math.ceil(A / (num(P.largo) || 250))) });
    if (P.anchoMax && A / n > num(P.anchoMax)) avisos.push('Plegable: hojas de ' + r2(A / n) + ' cm (máximo ' + num(P.anchoMax) + ' cm); pon más hojas');
    return { piezas: juntar(piezas), avisos: avisos };
  }
  // Escamoteables (Slido F-Park71): un kit por hoja con sus bisagras. La hoja se mete en el mueble: hace falta
  // que el kit «retraiga» al menos el ancho de la hoja y que su guía quepa en el fondo útil (fondo − 3 cm).
  function piezasEscamoteable(t, tabla, n) {
    var E = tabla.escamoteable || {}, avisos = [], A = num(t.ancho), anH = A / n;
    var alto = num(t.alto) - (t.zocalo ? (num(t.alturaZocalo) || 10) : 0) - 4, util = (num(t.fondo) - 3) * 10;
    var kits = (E.kits || []).slice().sort(function (a, b) { return num(a.guia) - num(b.guia); }), el;
    if (E.kitAlto && alto > num(E.altoMax || 150)) {
      el = E.kitAlto;
      if (alto > num(el.altoMax)) avisos.push('Escamoteable: hoja de ' + r2(alto) + ' cm de alto (máximo ' + num(el.altoMax) + ' cm)');
      if (num(el.retrae) < anH * 10) avisos.push('Escamoteable: con el kit alto, hojas de hasta ' + num(el.retrae) / 10 + ' cm de ancho (ahora ' + r2(anH) + '); pon más hojas');
      if (num(el.guia) > util) avisos.push('Escamoteable: el kit alto necesita ' + Math.ceil(num(el.guia) / 10 + 3) + ' cm de fondo');
    } else {
      var caben = kits.filter(function (k) { return num(k.guia) <= util; });
      el = caben.filter(function (k) { return num(k.retrae) >= anH * 10; })[0];
      if (!el) {
        el = caben[caben.length - 1] || kits[0];
        avisos.push('Escamoteable: con ' + r2(num(t.fondo)) + ' cm de fondo no se esconde una hoja de ' + r2(anH) + ' cm; pon más hojas o más fondo');
      }
    }
    if (anH > 70) avisos.push('Escamoteable: hojas de ' + r2(anH) + ' cm (máximo 70 cm)');
    return { piezas: el ? [{ cod: el.cod, und: n }] : [], avisos: avisos };
  }
  ARM.piezasPuertas = function (t, tabla) {
    var p = t.puertas || {}, n = hojasDe(t);
    if (p.tipo === 'plegable_tablero' && t.clase !== 'puerta_paso') return piezasPlegable(t, tabla, n);
    if (p.tipo === 'escamoteable_tablero' && t.clase !== 'puerta_paso') return piezasEscamoteable(t, tabla, n);
    var ancho = num(t.ancho) * (t.clase === 'puerta_paso' ? 2 : 1), s = sistemaDe(t, tabla), piezas = [], avisos = [];
    if (p.sistema && !s) avisos.push('No encuentro el sistema ' + p.sistema);
    if (!s) {
      var guia = buscar(tabla, p.guia) || {};
      if (p.kit) piezas.push({ cod: p.kit, und: n });
      if (p.guia) piezas.push({ cod: p.guia, und: Math.ceil(ancho / (num(guia.largo) || 200)) });
      return { piezas: piezas, avisos: avisos };
    }
    if (s.tipo === 'hueco') {
      var hs = (s.huecos || []).slice(), aw = num(t.ancho);
      var exactos = hs.filter(function (x) { return num(x.hojas) === n; });
      if (exactos.length) {
        var caben = exactos.filter(function (x) { return x.anchoMax === undefined || aw <= num(x.anchoMax); })
          .sort(function (a, b) { return num(a.anchoMax) - num(b.anchoMax); });
        var el = caben[0];
        if (!el) { el = exactos.sort(function (a, b) { return num(b.anchoMax) - num(a.anchoMax); })[0]; avisos.push(s.nombre + ': ' + r2(aw) + ' cm pasa del ancho máximo (' + num(el.anchoMax) + ' cm)'); }
        piezas.push({ cod: el.cod, und: 1 });
      } else if (hs.length) {
        hs.sort(function (a, b) { return num(b.hojas) - num(a.hojas); });
        var div = hs.filter(function (x) { return n % num(x.hojas) === 0; })[0];
        if (div) piezas.push({ cod: div.cod, und: n / num(div.hojas) });
        else piezas.push({ cod: hs[0].cod, und: Math.ceil(n / num(hs[0].hojas)) });
        avisos.push(s.nombre + ': no hay carros para ' + n + ' hojas; se combinan los que hay');
      }
    } else if (s.kit) piezas.push({ cod: s.kit, und: n });
    return { piezas: juntar(piezas.concat(ARM.guiasPara(s, ancho, n))), avisos: avisos };
  };
  // Fuentes de LED para `m` metros: de 6 m mientras pasen de 3 m, y una de 3 m para el resto.
  ARM.fuentesLed = function (m, tabla) {
    var L = tabla.led || {}, out = [], r = num(m);
    while (r > 1e-9) { if (r > 3) { out.push({ cod: L.fuente6, und: 1 }); r -= 6; } else { out.push({ cod: L.fuente3, und: 1 }); r -= 3; } }
    return juntar(out);
  };

  // Tarifa de puertas de cocina por alto y ancho (precios de coste de la plantilla importada en la app: MODMAP).
  // Fuera de la app (pruebas) se usa tabla.puertasCocina. Devuelve [{alto, precios:{ancho:[G1..G8]}}] de menor a mayor alto.
  var ALTOS_COCINA = { 'ALTO 45': 45, 'ALTO 70-80': 80, 'ALTO 90-100': 100, 'SEMICOLUMNA 135-145': 145, 'COLUMNA 200-215': 215, 'COLUMNA 220-240': 240 };
  ARM.puertasCocina = function (tabla) {
    var M = root.MODMAP, out = {};
    if (M && typeof M === 'object') {
      Object.keys(M).forEach(function (k) {
        var m = /^(.+) 1 PUERTA (\d+)$/.exec(k), alto = m && ALTOS_COCINA[m[1]], f = M[k] && M[k].f1;
        if (!alto || !f || num(M[k].cant1) !== 1) return;
        (out[alto] = out[alto] || { alto: alto, precios: {} }).precios[m[2]] = f;
      });
    }
    var l = Object.keys(out).map(function (a) { return out[a]; });
    if (!l.length) l = ((tabla && tabla.puertasCocina) || []).slice();
    return l.sort(function (a, b) { return a.alto - b.alto; });
  };
  // Altos de puerta que suman el alto pedido: la menor que llegue; si ninguna llega, la más alta y se repite con el resto.
  function altosPuerta(h, esc) {
    var out = [], resto = h, max = esc[esc.length - 1].alto;
    while (resto > 0.5 && out.length < 6) {
      var una = esc.filter(function (e) { return e.alto >= resto - 0.5; })[0];
      if (una) { out.push(una.alto); break; }
      out.push(max); resto -= max;
    }
    return out;
  }
  function precioPuertaCocina(esc, an, al, grupo) {
    var e = esc.filter(function (x) { return x.alto === al; })[0]; if (!e) return null;
    var anchos = Object.keys(e.precios).map(Number).sort(function (a, b) { return a - b; });
    var col = anchos.filter(function (w) { return w >= an - 0.5; })[0] || anchos[anchos.length - 1];
    var p = (e.precios[col] || [])[num(grupo) - 1];
    return p === undefined || p === null ? null : num(p);
  }

  function bisagrasPorHoja(alto) { return alto <= 100 ? 2 : alto <= 180 ? 3 : 4; }

  ARM.despiece = function (t, tabla) {
    var A = num(t.ancho), H = num(t.alto), F = num(t.fondo), cuerpos = t.cuerpos || [], tt = tabla.taller || {};
    var paso = t.clase === 'puerta_paso', interior = t.clase === 'solo_interior';   // solo interior: hueco existente, sin casco
    var piezas = [], m2 = {}, ml = 0, horas = paso ? num(tt.paso) : interior ? 0 : num(tt.tramo), avisos = [], conCasco = t.clase !== 'solo_puertas' && !paso && !interior;
    function pieza(n, cant, an, al, mat, canto) {
      if (!cant || an <= 0 || al <= 0) return;
      piezas.push({ n: n, cant: cant, an: r2(an), al: r2(al), mat: mat });
      m2[mat] = (m2[mat] || 0) + cant * an * al / 1e4;
      if (canto) ml += cant * canto / 100;
    }
    // División vertical dentro de un cuerpo: tablero de fondo − 2 y alto interior, canteado por delante
    function divisiones(c, i, alto) {
      var dv = Math.max(0, Math.round(num(c.divisiones)));
      if (!dv) return 0;
      pieza('División (cuerpo ' + (i + 1) + ')', dv, F - 2, r2(alto), mat, alto);
      return dv * num(tt.division === undefined ? 0.5 : tt.division);
    }
    if (A <= 0) avisos.push('Falta el ancho');
    if (H <= 0) avisos.push('Falta el alto');
    if ((conCasco || interior) && F <= 0) avisos.push('Falta el fondo');
    var mat = t.casco, alt = Math.max(0, num(t.altillo)), bajoAlt = alt > 0 ? alt + 1.6 : 0;
    function maleteroOAltillo(c, i, an) {
      if (alt > 0) { pieza('Suelo de altillo (cuerpo ' + (i + 1) + ')', 1, an, F, mat, an); horas += num(tt.estante); }
      else if (c.maletero) { pieza('Maletero (cuerpo ' + (i + 1) + ')', 1, an, F, mat, an); horas += num(tt.estante); }
    }
    if (conCasco) {
      var suma = 0; cuerpos.forEach(function (c) { suma += num(c.ancho); });
      if (cuerpos.length && Math.abs(suma - A) > 0.5) avisos.push('Los cuerpos suman ' + r2(suma) + ' de ' + r2(A) + ' cm');
      pieza('Costado', cuerpos.length + 1, F, H, mat, H);
      if (t.montaje === 'exento') ml += 2 * H / 100;   // costados extremos vistos
      cuerpos.forEach(function (c, i) {
        var an = num(c.ancho), est = Math.max(0, Math.round(num(c.estantes)));
        pieza('Techo y suelo (cuerpo ' + (i + 1) + ')', 2, an, F, mat, an);
        maleteroOAltillo(c, i, an);
        if (est) { pieza('Estante (cuerpo ' + (i + 1) + ')', est, an, F - 2, mat, an); horas += est * num(tt.estante); }
        horas += divisiones(c, i, H - (t.zocalo ? (num(t.alturaZocalo) || 10) : 0) - 3.2 - bajoAlt);
        horas += num(tt.cuerpo) + Math.max(0, Math.round(num(c.cajones))) * num(tt.cajon);
      });
      if (t.trasera && t.trasera !== 'sin') {
        var mt = t.trasera === 'tablero16' ? mat : ((tabla.traseras || {})[t.trasera] || mat);
        pieza('Trasera', 1, A, H, mt, 0);
      }
      if (t.zocalo) pieza('Zócalo', 1, A, num(t.alturaZocalo) || 10, mat, A);
    } else if (interior) {
      cuerpos.forEach(function (c, i) {
        var an = num(c.ancho), est = Math.max(0, Math.round(num(c.estantes)));
        maleteroOAltillo(c, i, an);
        if (est) { pieza('Estante (cuerpo ' + (i + 1) + ')', est, an, F - 2, mat, an); horas += est * num(tt.estante); }
        horas += divisiones(c, i, H - bajoAlt);
        horas += num(tt.interior === undefined ? 1 : tt.interior) + Math.max(0, Math.round(num(c.cajones))) * num(tt.cajon);
      });
    }
    // Puertas
    var p = t.puertas || {}, pu = { tipo: p.tipo || 'ninguna', hojas: [], m2: 0, ml: 0 };
    var altoHoja = H - (t.zocalo ? (num(t.alturaZocalo) || 10) : 0) - 4;
    var sis = sistemaDe(t, tabla);
    if (paso) {
      // Hoja de paso: tapa el hueco 3 cm por cada lado y por arriba (solape del kit).
      var kp = buscar(tabla, sis ? sis.kit : p.kit) || {}, sp = kp.solape === undefined ? 3 : num(kp.solape);
      for (var q = 0; q < Math.max(1, Math.round(num(p.hojas)) || 1); q++) pu.hojas.push({ an: r2(A + 2 * sp), al: r2(H + sp) });
    } else if (/^corredera/.test(pu.tipo)) {
      var kit = buscar(tabla, sis && sis.kit ? sis.kit : p.kit) || {}, hc = ARM.hojasCorredera(A, hojasDe(t), kit.solape === undefined ? 3 : kit.solape);
      for (var k = 0; k < hc.n; k++) pu.hojas.push({ an: hc.ancho, al: altoHoja });
      if (hc.ancho < 30) avisos.push('Hojas de menos de 30 cm');
      horas += hc.n * num(tt.corredera);
    } else if (pu.tipo === 'plegable_tablero' || pu.tipo === 'escamoteable_tablero') {
      var nh = hojasDe(t);
      for (var w = 0; w < nh; w++) pu.hojas.push({ an: r2(A / nh), al: altoHoja });
      horas += nh * num(pu.tipo === 'plegable_tablero' ? tt.plegable : tt.escamoteable);
    } else if (/^abatible/.test(pu.tipo)) {
      var hp = pu.tipo === 'abatible_comprada' ? buscar(tabla, p.hoja) : null, esc = hp && hp.grupo ? ARM.puertasCocina(tabla) : [];
      cuerpos.forEach(function (c) {
        var an = num(c.ancho), n = an <= 50 ? 1 : 2;
        for (var k = 0; k < n; k++) {
          var tramosAlto = alt > 0 && alt < altoHoja ? [r2(altoHoja - alt), alt] : [altoHoja];
          if (!esc.length) { tramosAlto.forEach(function (al) { pu.hojas.push({ an: r2(an / n), al: al }); }); continue; }
          var anH = an / n, partes = Math.max(1, Math.ceil(anH / 60 - 1e-9)), altos = [];
          tramosAlto.forEach(function (h) { altos = altos.concat(altosPuerta(h, esc)); });
          for (var w = 0; w < partes; w++) altos.forEach(function (al) { pu.hojas.push({ an: r2(anH / partes), al: al, tarifa: true }); });
        }
      });
      if (esc.length) pu.grupo = num(hp.grupo);
      if (hp && hp.grupo && !esc.length) avisos.push('No encuentro la tarifa de puertas de cocina; la hoja va por m²');
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
      if (pu.tipo === 'corredera_tablero' || pu.tipo === 'abatible_tablero' || pu.tipo === 'plegable_tablero' || pu.tipo === 'escamoteable_tablero') {
        puertas += pu.m2 * desp * coste(tabla, p.mat || t.casco, falta) + pu.ml * coste(tabla, tabla.canto, falta);
      } else if (pu.tipo === 'abatible_comprada' && pu.grupo) {
        var escN = ARM.puertasCocina(tabla);
        pu.hojas.forEach(function (x) {
          var pr = precioPuertaCocina(escN, x.an, x.al, pu.grupo);
          if (pr === null) { var nm = 'Puerta de cocina grupo ' + pu.grupo + ' ' + x.an + '×' + x.al; if (falta.indexOf(nm) < 0) falta.push(nm); } else puertas += pr;
        });
      } else if (pu.tipo === 'abatible_comprada') {
        puertas += pu.m2 * coste(tabla, p.hoja, falta);
      } else if (pu.tipo === 'corredera_perfil') {
        puertas += pu.m2 * desp * coste(tabla, p.panel, falta);
      }
      if (/^corredera/.test(pu.tipo) || t.clase === 'puerta_paso' || pu.tipo === 'plegable_tablero' || pu.tipo === 'escamoteable_tablero') {
        var pp = ARM.piezasPuertas(Object.assign({}, t, { puertas: Object.assign({}, p, { hojas: n }) }), tabla);
        pp.piezas.forEach(function (x) { puertas += x.und * coste(tabla, x.cod, falta); });
        pp.avisos.forEach(function (a) { d.avisos.push(a); });
      } else {
        pu.hojas.forEach(function (x) { puertas += bisagrasPorHoja(x.al) * coste(tabla, gama.bisagra, falta); });
      }
    }
    var conCasco = t.clase !== 'solo_puertas' && t.clase !== 'puerta_paso';
    if (conCasco) (t.cuerpos || []).forEach(function (c) {
      var est = Math.max(0, Math.round(num(c.estantes))), caj = Math.max(0, Math.round(num(c.cajones)));
      if (est) herr += est * 4 * coste(tabla, tabla.soporte, falta);
      if (c.barra) herr += num(c.ancho) / 100 * coste(tabla, gama.barra, falta);
      if (caj) herr += caj * coste(tabla, gama.cajon, falta);
    });
    var col = tabla.colocacion || {}, ancho = num(t.ancho);
    var colocacion = t.clase === 'solo_puertas' ? num(col.solo_puertas) : t.clase === 'puerta_paso' ? num(col.puerta_paso)
      : ancho / 100 * num(t.clase === 'vestidor' ? col.vestidor : t.clase === 'solo_interior' ? (col.solo_interior === undefined ? 50 : col.solo_interior) : col.armario);
    var eurH = num((tabla.taller || {}).eur_h), extras = 0, extrasCol = 0, ledM = 0;
    (t.cuerpos || []).forEach(function (c) {
      (c.extras || []).forEach(function (x) { var u = Math.max(0, num(x.und) || 1); extras += u * (coste(tabla, x.cod, falta) + 0.25 * eurH); });
    });
    // LED y baldas de cristal por cuerpo: extras (no cuentan en la referencia). Solo con casco.
    if (conCasco) {
      var H = num(t.alto), F = num(t.fondo), alt0 = Math.max(0, num(t.altillo)), util = H - (t.zocalo ? (num(t.alturaZocalo) || 10) : 0) - (alt0 > 0 ? alt0 + 1.6 : 0);
      var L = tabla.led || {}, C = tabla.cristal || {};
      (t.cuerpos || []).forEach(function (c) {
        if (c.ledCostados) ledM += 2 * util / 100;
        if (c.ledArriba) ledM += num(c.ancho) / 100;
        var ec = Math.max(0, Math.round(num(c.estantesCristal)));
        if (ec) extras += ec * (num(c.ancho) * (F - 2) / 1e4 * coste(tabla, C.cod, falta) + 4 * coste(tabla, C.soporte, falta) + num(C.horas) * eurH);
      });
      ledM = r2(ledM);
      if (ledM > 0) {
        extras += ledM * coste(tabla, L.tira, falta);
        ARM.fuentesLed(ledM, tabla).forEach(function (x) { extras += x.und * coste(tabla, x.cod, falta); });
        extrasCol += ledM * num(col.led);
      }
    }
    var materiales = casco + puertas + herr, taller = d.horas * eurH;
    var rec = 1 + num(t.recargo) / 100, m = num(margen);
    var sinExtras = ((materiales + taller) * (1 + m) + colocacion) * rec;
    var precio = ((materiales + taller + extras) * (1 + m) + colocacion + extrasCol) * rec;
    var cajones = 0; (t.cuerpos || []).forEach(function (c) { cajones += Math.max(0, Math.round(num(c.cajones))); });
    var ref = tabla.referencia || {}, referencia = (t.clase === 'solo_puertas' || t.clase === 'solo_interior' || t.clase === 'puerta_paso') ? null
      : r2(ancho / 100 * num(ref.eur_m) + cajones * num(ref.eur_cajon));
    var sinPrecio = falta.length > 0;
    return { materiales: r2(materiales), casco: r2(casco), puertas: r2(puertas), herrajes: r2(herr), extras: r2(extras),
      ledMetros: ledM, colocacionExtras: r2(extrasCol),
      horas: d.horas, taller: r2(taller), colocacion: r2(colocacion + extrasCol), coste: r2(materiales + taller + extras + colocacion + extrasCol),
      precio: sinPrecio ? null : r2(precio), sinExtras: sinPrecio ? null : r2(sinExtras), referencia: referencia,
      sinPrecio: falta, avisos: d.avisos, despiece: d };
  }
  // precioBase = gama básica y sin interiores: lo que se compara con la referencia del usuario.
  ARM.calcular = function (t, tabla, margen) {
    var g = t.gama || 'basica', r = nucleo(t, tabla, margen, g);
    r.precioBase = g === 'basica' ? r.sinExtras : nucleo(t, tabla, margen, 'basica').sinExtras;
    return r;
  };
  // Orden en el desplegable: lo que más se usa primero. Las familias que no estén aquí van al final, por orden alfabético.
  var FAM_ORDEN = ['Juegos', 'Cajoneras con cristal', 'Cajones GTV Élite', 'Cajones y organizadores', 'Cajones metálicos (Vertex)', 'Moka', 'Joyeros', 'Bandejas y organizadores',
    'Zapateros', 'Pantaloneros y faldas', 'Barras', 'Barras con LED', 'Iluminación', 'Electricidad', 'Colgadores abatibles', 'Elevadores',
    'Corbateros y cinturoneros', 'Espejos y colgadores', 'Cestas extraíbles', 'Cestos de ropa', 'Planchado', 'Seguridad',
    'Tiradores y cerraduras', 'IKEA', 'Otros'];
  function posFam(f) { var i = FAM_ORDEN.indexOf(f); return i < 0 ? FAM_ORDEN.length : i; }
  // Interiores que caben en un cuerpo de `ancho` cm (y, si se da, en un armario de `fondo` cm), por familia y precio.
  // `hasta` (opcional): ancho máximo del hueco si la división se puede mover; vale lo que quepa en algún ancho entre `ancho` y `hasta`.
  ARM.interiorPara = function (ancho, tabla, fondo, hasta) {
    var c = tabla.interior || {}, a = num(ancho), b = hasta ? Math.max(a, num(hasta)) : a, f = fondo === undefined || fondo === null || fondo === '' ? null : num(fondo);
    return Object.keys(c).map(function (k) { var p = c[k]; return { cod: k, nombre: p.nombre, familia: p.familia || 'Otros', min: p.min, max: p.max, prov: p.prov, fondoMin: p.fondoMin, fondoMax: p.fondoMax, coste: ARM.costeProducto(p, tabla) }; })
      .filter(function (p) { return (p.min === undefined || b >= num(p.min)) && (p.max === undefined || a <= num(p.max))
        && (f === null || ((p.fondoMin === undefined || f >= num(p.fondoMin)) && (p.fondoMax === undefined || f <= num(p.fondoMax)))); })
      .sort(function (x, y) {
        var a2 = posFam(x.familia), b2 = posFam(y.familia);
        if (a2 !== b2) return a2 - b2;
        return x.familia < y.familia ? -1 : x.familia > y.familia ? 1 : (x.coste || 0) - (y.coste || 0);
      });
  };

  // Tableros enteros por material: m² de casco + puertas del mismo tablero, con el desperdicio, entre el tablero estándar
  // (280×207, o la medida del material si la tiene, p. ej. 244x122). Es una cuenta por superficie, no un despiece optimizado.
  ARM.tableros = function (t, tabla) {
    var d = ARM.despiece(t, tabla), p = t.puertas || {}, m2 = {}, desp = 1 + num(tabla.desperdicio) / 100;
    Object.keys(d.m2).forEach(function (m) { m2[m] = (m2[m] || 0) + d.m2[m]; });
    if (d.puertas.m2 && /_tablero$/.test(d.puertas.tipo)) { var pm = p.mat || t.casco; m2[pm] = (m2[pm] || 0) + d.puertas.m2; }
    return Object.keys(m2).map(function (m) {
      var mp = buscar(tabla, m) || {}, md = /(\d+)\s*[x×]\s*(\d+)/.exec(mp.medida || '') || [0, 280, 207];
      var a = num(md[1]), b = num(md[2]);
      return { mat: m, nombre: mp.nombre || m, m2: r2(m2[m]), medida: a + '×' + b, tableros: Math.ceil(m2[m] * desp / (a * b / 1e4) - 1e-9) };
    });
  };
  ARM.anchoHueco = function (c) {
    var dv = Math.max(0, Math.round(num(c && c.divisiones))), an = num(c && c.ancho);
    return dv ? r2((an - 1.6 * dv) / (dv + 1)) : an;   // hueco 100 con una división de 1,6 → 2 de 49,2
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
  var CATS_P = ['materiales', 'lacados', 'cantos', 'kits', 'perfiles', 'hojas', 'paneles', 'herrajes', 'interior'];
  var REPRECIO_V4 = ['DM19', 'LAC-BL-2C', 'LAC-BL-1C', 'LAC-CO-2C', 'LAC-CO-1C'];
  function fusionar(ini, g) {
    var t = JSON.parse(JSON.stringify(ini));
    var vieja = num(g.version || 1) < num(ini.version || 1);
    Object.keys(g).forEach(function (k) {
      if (k === 'version') return;                 // manda la versión de la tabla inicial
      if (k === 'gamas' && vieja) return;          // las gamas de una tabla anterior no tapan las nuevas
      if (k === 'colocacion' && num(g.version || 1) < 3 && g[k]) {   // v3: vestidor a 95 €/ml (lleva más remates)
        var c3 = Object.assign({}, g[k]); delete c3.vestidor; t[k] = Object.assign({}, t[k] || {}, c3); return;
      }
      if (CATS_P.indexOf(k) >= 0) {
        t[k] = t[k] || {};
        Object.keys(g[k] || {}).forEach(function (cod) {
          var a = t[k][cod], b = g[k][cod];
          if (!a) { t[k][cod] = b; return; }
          // DM 19 y lacado: manda el maestro de fabricación propia (datos/fab_propia_precios.csv); de la tabla guardada solo los precios metidos a mano
          if (REPRECIO_V4.indexOf(cod) >= 0) {
            var hm = (b.historial || []).filter(function (x) { return x.origen === 'manual'; }).concat(a.historial || []);
            hm.sort(function (x, y) { return x.fecha < y.fecha ? 1 : x.fecha > y.fecha ? -1 : 0; });
            t[k][cod] = Object.assign({}, b, a, { historial: hm.slice(0, 10) }); return;
          }
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
      puertas: { tipo: 'corredera_tablero', hojas: 2, mat: 'ROBLE16', kit: k.kit, guia: k.guia, hoja: 'HOJA-LAM', panel: 'ESPEJO4',
        sistema: (T.sistemas || {})['EMU-BL'] ? 'EMU-BL' : '', hojasAuto: true } };
    if (t.clase === 'vestidor' || t.clase === 'solo_interior') t.puertas.tipo = 'ninguna';
    if (t.clase === 'solo_interior') { t.zocalo = false; t.trasera = 'sin'; }
    if (t.clase === 'solo_puertas') { t.cuerpos = []; t.zocalo = false; t.trasera = 'sin'; }
    if (t.clase === 'puerta_paso') {
      t.ancho = 90; t.alto = 210; t.fondo = 0; t.cuerpos = []; t.zocalo = false; t.trasera = 'sin';
      t.puertas = { tipo: 'corredera_tablero', hojas: 1, mat: 'ROBLE16', sistema: (T.sistemas || {}).SENSUS40 ? 'SENSUS40' : '', hoja: 'HOJA-LAM' };
    }
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
  var CLASES = { armario: 'Armario', vestidor: 'Vestidor', solo_puertas: 'Solo puertas', solo_interior: 'Solo interior', puerta_paso: 'Puerta de paso' };
  var PUERTAS_PASO = { corredera_tablero: 'Hoja de tablero (también lacado)', abatible_comprada: 'Hoja comprada' };
  function conCuerpos(t) { return t.clase !== 'solo_puertas' && t.clase !== 'puerta_paso'; }
  // Sistemas de corredera para un uso ('armario' o 'paso'); en armarios, también kit y guía sueltos.
  var GRUPOS_SIS = { EMU: 'Emuca (Fermagina)', TERRA16: 'Terra TR16', TERRAMIN: 'Terra TR16 minimalista', TERRA19: 'Terra TR19',
    VOLARE: 'Colgadas Volare', MURANO: 'Coplanar Murano', SENSUS40: 'Klein Sensus', SENSUS80: 'Klein Sensus', K40: 'Klein K', K75: 'Klein K', NK50: 'Klein NK', NK80: 'Klein NK' };
  function opcSistemas(T, uso, selv) {
    var S = T.sistemas || {}, grupos = {}, orden = [], h = '';
    if (uso !== 'paso' && !selv) h += '<option value="" selected>Kit y guía sueltos (tramo antiguo)</option>';
    Object.keys(S).forEach(function (k) {
      if ((S[k].uso || 'armario') !== uso) return;
      var gname = GRUPOS_SIS[k.split('-')[0]] || 'Otros';
      if (!grupos[gname]) { grupos[gname] = []; orden.push(gname); }
      grupos[gname].push('<option value="' + eh(k) + '"' + (k === selv ? ' selected' : '') + '>' + eh(S[k].nombre + (S[k].tipo === 'hueco' ? ' (por hueco)' : '')) + '</option>');
    });
    orden.forEach(function (gname) { h += '<optgroup label="' + eh(gname) + '">' + grupos[gname].join('') + '</optgroup>'; });
    return h;
  }
  // Lo que lleva la puerta (kit por hoja y guía según la medida), para verlo debajo del selector
  function htmlLleva(t, T) {
    var r = ARM.piezasPuertas(t, T);
    if (!r.piezas.length) return '';
    return '<div data-arm="lleva" style="flex:1 1 100%;font-size:.74rem;color:#555">Lleva: ' + r.piezas.map(function (x) {
      var p = buscar(T, x.cod) || {}; return x.und + ' × ' + eh(String(p.nombre || x.cod).toLowerCase());
    }).join(' · ') + '</div>';
  }
  var PUERTAS = { corredera_tablero: 'Corredera de tablero', corredera_perfil: 'Corredera de perfil + panel', abatible_tablero: 'Abatible de tablero',
    abatible_comprada: 'Abatible comprada', plegable_tablero: 'Plegable de tablero (librillo)', escamoteable_tablero: 'Escamoteable de tablero', ninguna: 'Sin puertas' };
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
    var p = t.puertas || {}, n = (t.cuerpos || []).length, h = p.tipo === 'ninguna' ? 0 : (/^corredera/.test(p.tipo) ? hojasDe(t) : null);
    if (t.clase === 'puerta_paso') return 'Hueco ' + num(t.ancho) + ' × ' + num(t.alto) + ' · puerta corredera de paso';
    var s = num(t.ancho) + ' × ' + num(t.alto) + ' × ' + num(t.fondo);
    if (t.clase !== 'solo_puertas') s += ' · ' + n + (n === 1 ? ' cuerpo' : ' cuerpos') + (num(t.altillo) > 0 ? ' · altillo ' + num(t.altillo) : '');
    if (/^corredera/.test(p.tipo)) s += ' · ' + h + ' correderas';
    else if (p.tipo === 'plegable_tablero') s += ' · ' + hojasDe(t) + ' plegables';
    else if (p.tipo === 'escamoteable_tablero') s += ' · ' + hojasDe(t) + ' escamoteables';
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
      + campo(t.clase === 'puerta_paso' ? 'Ancho del hueco' : 'Ancho (cm)', inp(gid, lid, 'ancho', t.ancho))
      + campo(t.clase === 'puerta_paso' ? 'Alto del hueco' : 'Alto', inp(gid, lid, 'alto', t.alto))
      + (t.clase === 'puerta_paso' ? '' : campo('Fondo', inp(gid, lid, 'fondo', t.fondo)))
      + (conCuerpos(t) ? campo('Altillo (cm)', inp(gid, lid, 'altillo', t.altillo || 0).replace('<input', '<input data-arm="altillo" title="0 = sin altillo; la balda del maletero pasa a ser su suelo"')) : '')
      + (t.clase === 'solo_interior' ? campo('Tablero de estantes y maletero', sel(gid, lid, 'casco', prods('materiales', t.casco, esTablero)), '2 1 160px') : '')
      + (!conCuerpos(t) || t.clase === 'solo_interior' ? '' :
        campo('Casco', sel(gid, lid, 'casco', prods('materiales', t.casco, esTablero)), '2 1 160px')
        + campo('Trasera', sel(gid, lid, 'trasera', opciones(TRASERAS, t.trasera)), '1 1 120px')
        + campo('Montaje', sel(gid, lid, 'montaje', opciones({ empotrado: 'Empotrado', exento: 'Exento' }, t.montaje)), '1 1 100px')
        + campo('Zócalo', '<span>' + chk(t.zocalo, 'ARM.cambia(' + gid + ',' + lid + ',\'zocalo\',this.checked)') + '</span>', '0 0 50px'))
      + campo('Herraje', sel(gid, lid, 'gama', opciones(GAMAS, t.gama)), '1 1 110px')
      + campo('Difícil +20 %', '<span>' + chk(num(t.recargo) > 0, 'ARM.cambia(' + gid + ',' + lid + ',\'recargo\',this.checked?20:0)') + '</span>', '0 0 80px')
      + '</div>';
    var cu = '';
    if (conCuerpos(t)) {
      cu = '<div style="font-size:.78rem;font-weight:600;margin:4px 0">Cuerpos</div>';
      (t.cuerpos || []).forEach(function (c, k) {
        var f = function (campoN, v, tipo) {
          return tipo === 'chk' ? chk(v, 'ARM.cambiaCuerpo(' + gid + ',' + lid + ',' + k + ',\'' + campoN + '\',this.checked)')
            : '<input type="number" inputmode="decimal" value="' + eh(v) + '" style="width:100%;box-sizing:border-box" onchange="ARM.cambiaCuerpo(' + gid + ',' + lid + ',' + k + ',\'' + campoN + '\',this.value)">';
        };
        cu += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;padding:4px 0;border-top:1px dashed #ddd">'
          + campo('Ancho', f('ancho', c.ancho), '1 1 60px') + campo('Estantes', f('estantes', c.estantes), '1 1 50px')
          + campo('Cajones', f('cajones', c.cajones), '1 1 50px')
          + campo('Divisiones', f('divisiones', c.divisiones || 0).replace('<input', '<input data-arm="divisiones"'), '1 1 56px')
          + campo('Maletero', '<span>' + f('maletero', c.maletero, 'chk') + '</span>', '0 0 56px')
          + campo('Barra', '<span>' + f('barra', c.barra, 'chk') + '</span>', '0 0 40px')
          + campo('LED costados', '<span>' + f('ledCostados', c.ledCostados, 'chk').replace('<input', '<input data-arm="ledCostados"') + '</span>', '0 0 74px')
          + campo('LED arriba', '<span>' + f('ledArriba', c.ledArriba, 'chk').replace('<input', '<input data-arm="ledArriba"') + '</span>', '0 0 64px')
          + campo('Baldas cristal', f('estantesCristal', c.estantesCristal || 0).replace('<input', '<input data-arm="estantesCristal"'), '1 1 60px')
          + '<button class="btn bgh bsm" onclick="ARM.accion(' + gid + ',' + lid + ',\'delCuerpo\',' + k + ')">✕</button></div>'
          + htmlInteriores(gid, lid, k, c, T, t.fondo);
      });
      cu += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">'
        + '<button class="btn bgh bsm" data-arm="addCuerpo" onclick="ARM.accion(' + gid + ',' + lid + ',\'addCuerpo\')">+ cuerpo</button>'
        + '<button class="btn bgh bsm" onclick="ARM.accion(' + gid + ',' + lid + ',\'repartir\')">Repartir el ancho</button></div>';
    }
    var pu = '';
    if (t.clase !== 'solo_interior') {
      var paso = t.clase === 'puerta_paso';
      pu = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">'
        + campo(paso ? 'Hoja' : 'Puertas', '<select style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'tipo\',this.value)">' + opciones(paso ? PUERTAS_PASO : PUERTAS, p.tipo) + '</select>', '2 1 160px');
      var sp = function (k, html, ancho) { return campo(k[0], '<select data-arm="' + k[1] + '" style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'' + k[1] + '\',this.value)">' + html + '</select>', ancho || '2 1 160px'); };
      if (paso) pu += sp(['Sistema de paso', 'sistema'], opcSistemas(T, 'paso', p.sistema)) + htmlLleva(t, T);
      else if (/^corredera/.test(p.tipo)) {
        pu += campo(p.hojasAuto ? 'Hojas (= cuerpos)' : 'Hojas', '<input type="number" min="1" max="8" value="' + eh(hojasDe(t)) + '" style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'hojas\',this.value)">', '0 0 74px')
          + (p.hojasAuto || !(t.cuerpos || []).length ? '' : '<button class="btn bgh bsm" data-arm="hojasAuto" title="Una corredera por cuerpo" onclick="ARM.accion(' + gid + ',' + lid + ',\'hojasAuto\')">= cuerpos</button>')
          + sp(['Sistema', 'sistema'], opcSistemas(T, 'armario', p.sistema));
        if (!p.sistema) pu += sp(['Kit de puerta', 'kit'], prods('kits', p.kit, function (x) { return x.solape !== undefined; }))
          + sp(['Guía', 'guia'], prods('kits', p.guia, function (x) { return x.largo !== undefined; }));
        pu += htmlLleva(t, T);
      } else if (p.tipo === 'plegable_tablero' || p.tipo === 'escamoteable_tablero') {
        pu += campo('Hojas', '<input type="number" min="1" max="8" value="' + eh(hojasDe(t)) + '" style="width:100%" onchange="ARM.cambiaPuerta(' + gid + ',' + lid + ',\'hojas\',this.value)">', '0 0 56px');
      }
      if (p.tipo === 'corredera_tablero' || p.tipo === 'abatible_tablero' || p.tipo === 'plegable_tablero' || p.tipo === 'escamoteable_tablero') pu += sp(['Tablero de la puerta', 'mat'], prods('materiales', p.mat, esTablero));
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

  function htmlInteriores(gid, lid, k, c, T, fondo) {
    var h = '', cat = T.interior || {};
    (c.extras || []).forEach(function (x, j) {
      var p = cat[x.cod] || {}, e = ARM.costeProducto(p);
      h += '<div style="display:flex;align-items:center;gap:6px;font-size:.78rem;padding:2px 0 2px 8px">└ ' + eh(p.nombre || x.cod)
        + (cliente() ? '' : ' <span style="color:#888">' + (e === null ? '<span class="arm-sinprecio" style="color:#b00020">sin precio</span>' : r2(e).toFixed(2).replace('.', ',') + ' €') + ' · ' + eh(p.prov || '') + '</span>')
        + ' <button class="btn bgh bsm" onclick="ARM.delExtra(' + gid + ',' + lid + ',' + k + ',' + j + ')">✕</button></div>';
    });
    var hueco = ARM.anchoHueco(c), conDiv = hueco !== num(c.ancho), hasta = conDiv ? r2(num(c.ancho) * 0.75) : null;
    var lista = ARM.interiorPara(hueco, T, fondo, hasta), fams = {};
    lista.forEach(function (p) { (fams[p.familia] = fams[p.familia] || []).push(p); });
    if (!lista.length) return h;
    var opts = '<option value="">+ interior (cabe en ' + String(hueco).replace('.', ',') + ' cm' + (conDiv ? ' por hueco (hasta ' + String(hasta).replace('.', ',') + ' moviendo la división)' : '') + ')…</option>' + Object.keys(fams).map(function (f) {
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
    var p = t.puertas || {}, sis = p.sistema ? (T.sistemas || {})[p.sistema] : null;
    if (t.clase === 'puerta_paso') {
      var pp = ['Puerta corredera de paso ' + num(t.ancho) + ' × ' + num(t.alto) + ' cm',
        p.tipo === 'abatible_comprada' ? 'hoja ' + nom('hojas', p.hoja) : 'hoja de ' + nom('materiales', p.mat)];
      if (sis) pp.push('sistema ' + sis.nombre.replace(/\s*\([^)]*\)/g, '').toLowerCase());
      var sp2 = pp.join(', ');
      return t.nombre ? t.nombre + ': ' + sp2 : sp2;
    }
    var cab = { armario: 'Armario ' + (t.montaje === 'exento' ? 'exento' : 'empotrado'), vestidor: 'Vestidor', solo_puertas: 'Frente de puertas', solo_interior: 'Interior de armario' }[t.clase] || 'Armario';
    var partes = [cab + ' ' + num(t.ancho) + ' × ' + num(t.alto) + (t.clase === 'solo_puertas' ? '' : ' × ' + num(t.fondo)) + ' cm'];
    if (t.clase === 'solo_interior') partes.push('tablero ' + nom('materiales', t.casco));
    else if (t.clase !== 'solo_puertas') partes.push('casco ' + nom('materiales', t.casco));
    var n = /^corredera|^plegable|^escamoteable/.test(p.tipo) ? hojasDe(t) : ARM.despiece(t, T).puertas.hojas.length;
    if (p.tipo === 'corredera_tablero') partes.push(n + ' puertas correderas de ' + nom('materiales', p.mat || t.casco));
    else if (p.tipo === 'corredera_perfil') partes.push(n + ' puertas correderas de perfil de aluminio con ' + nom('paneles', p.panel));
    else if (p.tipo === 'abatible_tablero') partes.push(n + ' puertas abatibles de ' + nom('materiales', p.mat || t.casco));
    else if (p.tipo === 'abatible_comprada') partes.push(n + ' puertas abatibles (' + nom('hojas', p.hoja) + ')');
    else if (p.tipo === 'plegable_tablero') partes.push(n + ' puertas plegables de ' + nom('materiales', p.mat || t.casco));
    else if (p.tipo === 'escamoteable_tablero') partes.push(n + ' puertas escamoteables de ' + nom('materiales', p.mat || t.casco));
    else if (t.clase !== 'solo_interior') partes.push('sin puertas');
    if (sis && /^corredera/.test(p.tipo)) partes.push('sistema ' + sis.nombre.replace(/\s*\([^)]*\)/g, '').toLowerCase());
    var cs = t.clase === 'solo_puertas' ? [] : (t.cuerpos || []);
    if (cs.length) {
      var est = 0, caj = 0, barra = false, mal = false, ints = [], cris = 0, led = false, dvs = 0;
      cs.forEach(function (c) {
        est += Math.max(0, Math.round(num(c.estantes))); caj += Math.max(0, Math.round(num(c.cajones)));
        cris += Math.max(0, Math.round(num(c.estantesCristal))); led = led || !!c.ledCostados || !!c.ledArriba;
        dvs += Math.max(0, Math.round(num(c.divisiones)));
        barra = barra || !!c.barra; mal = mal || !!c.maletero;
        (c.extras || []).forEach(function (x) { var q = ((T.interior || {})[x.cod] || {}).nombre || x.cod; if (ints.indexOf(q) < 0) ints.push(q); });
      });
      var con = [];
      if (barra) con.push('barra'); if (mal) con.push('maletero');
      if (est) con.push(est + (est === 1 ? ' estante' : ' estantes'));
      if (cris) con.push(cris + (cris === 1 ? ' balda de cristal' : ' baldas de cristal'));
      if (caj) con.push(caj + (caj === 1 ? ' cajón' : ' cajones'));
      if (dvs) con.push(dvs + (dvs === 1 ? ' división' : ' divisiones'));
      var txt = cs.length + (cs.length === 1 ? ' cuerpo' : ' cuerpos');
      if (con.length) txt += ' con ' + (con.length > 1 ? con.slice(0, -1).join(', ') + ' y ' + con[con.length - 1] : con[0]);
      partes.push(txt);
      if (num(t.altillo) > 0) partes.push('altillo de ' + num(t.altillo) + ' cm');
      if (led) partes.push('iluminación LED con sensor');
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
    var mats = ARM.tableros(t, T).map(function (x) { var p = (T.materiales || {})[x.mat] || {}; return eh(x.nombre) + ' ' + String(x.m2).replace('.', ',') + ' m² → <b>' + x.tableros + (x.tableros === 1 ? ' tablero' : ' tableros') + ' de ' + x.medida + '</b> (' + eh(p.prov || '') + ')'; }).join(' · ');
    return '<div class="arm-despiece" style="font-size:.75rem;margin-top:6px;overflow-x:auto"><table style="width:100%;border-collapse:collapse">' + filas + '</table>'
      + '<div style="margin-top:4px">' + mats + ' · canto ' + d.ml_canto + ' m · ' + d.horas + ' h de taller' + (r.ledMetros ? ' · LED ' + String(r.ledMetros).replace('.', ',') + ' m' : '') + '</div>'
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
      + aj('Horas por división', 'taller', 'division', tt.division) + aj('Horas por cuerpo (solo interior)', 'taller', 'interior', tt.interior) + aj('Horas por puerta de paso', 'taller', 'paso', tt.paso) + aj('Horas por hoja plegable', 'taller', 'plegable', tt.plegable)
      + aj('Horas por hoja escamoteable', 'taller', 'escamoteable', tt.escamoteable)
      + aj('Desperdicio %', 'desperdicio', '', T.desperdicio) + '</div>'
      + '<b>Colocación (sin margen)</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">'
      + aj('Armario €/ml', 'colocacion', 'armario', co.armario) + aj('Vestidor €/ml', 'colocacion', 'vestidor', co.vestidor) + aj('Solo puertas €/hueco', 'colocacion', 'solo_puertas', co.solo_puertas)
      + aj('Solo interior €/ml', 'colocacion', 'solo_interior', co.solo_interior) + aj('Puerta de paso €/hueco', 'colocacion', 'puerta_paso', co.puerta_paso) + aj('LED €/m', 'colocacion', 'led', co.led) + '</div>'
      + '<b>Referencia (solo orienta)</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">'
      + aj('€ por metro', 'referencia', 'eur_m', re.eur_m) + aj('€ por cajón', 'referencia', 'eur_cajon', re.eur_cajon) + '</div>'
      + '<b>Precios de compra</b> <span style="color:#777">(sin IVA; se usa la media de los 10 últimos; un precio nuevo se añade, no borra)</span>';
    var NOM = { materiales: 'Tableros', lacados: 'Lacados (Aloanco)', cantos: 'Cantos', kits: 'Kits y sistemas de corredera', hojas: 'Hojas compradas', paneles: 'Paneles y cristal', herrajes: 'Herrajes, LED y soportes', interior: 'Interiores y juegos' };
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
      + '<button class="btn bgh bsm" data-arm="addInterior" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'solo_interior\')">+ Solo interior</button>'
      + '<button class="btn bgh bsm" data-arm="addPaso" onclick="ARM.accion(' + g.id + ',0,\'addTramo\',\'puerta_paso\')">+ Puerta de paso</button>'
      + (cliente() ? '' : '<button class="btn bgh bsm" data-arm="precios" onclick="ARM.abrirPrecios(' + g.id + ')">⚙ Precios de armarios</button>')
      + '</div>' + (!cliente() && panelAbierto[g.id] ? htmlPanel() : '');
  };

  // ── Cambios desde la pantalla ──
  function buscarLinea(gid, lid) {
    var g = (root.ST.groups || []).find(function (x) { return x.id === gid; });
    return { g: g, l: g && g.lines.find(function (x) { return x.id === lid; }) };
  }
  function repintar(gid) { if (typeof root.renderLines === 'function') root.renderLines(gid); if (typeof root.upBan === 'function') root.upBan(); }
  var NUMS = ['ancho', 'alto', 'fondo', 'estantes', 'cajones', 'hojas', 'recargo', 'altillo'];
  ARM.cambia = function (gid, lid, k, v) {
    var x = buscarLinea(gid, lid); if (!x.l) return;
    if (k === 'clase') { var n = ARM.nuevoTramo(v), t = x.l.arm; n.nombre = t.nombre; n.ancho = t.ancho; n.alto = t.alto; n.fondo = t.fondo; n.casco = t.casco; if (v !== 'solo_puertas' && v !== 'puerta_paso' && t.clase !== 'puerta_paso' && t.cuerpos.length) n.cuerpos = t.cuerpos; if (v === 'puerta_paso' || t.clase === 'puerta_paso') { n.ancho = ARM.nuevoTramo(v).ancho; n.alto = ARM.nuevoTramo(v).alto; n.fondo = ARM.nuevoTramo(v).fondo; } x.l.arm = n; }
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
    if (k === 'hojas') x.l.arm.puertas.hojasAuto = false;
    if (k === 'kit') {
      var S = ARM.tabla().sistemas || {}, par = Object.keys(S).filter(function (c) { return S[c].kit === v && (S[c].uso || 'armario') !== 'paso'; })[0];
      if (par) x.l.arm.puertas.sistema = par;
    }
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
    else if (que === 'hojasAuto' && t) t.puertas.hojasAuto = true;
    repintar(gid);
  };

  // Tabla de precios inicial (la genera `construir.py armarios`). La de la nube/dispositivo es `armarios_v1`.
  ARM.TABLA_INICIAL = {"materiales":{"ROBLE16":{"cod":"ROBLE16","prov":"MOR","ref":"0200306505","nombre":"Plastificado roble 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"factura"}]},"BLANCO16":{"cod":"BLANCO16","prov":"MOR","ref":"","nombre":"Melamina blanco liso 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"TEXTIL16":{"cod":"TEXTIL16","prov":"MOR","ref":"","nombre":"Melamina textil 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"DM16":{"cod":"DM16","prov":"MOR","ref":"0200408016","nombre":"DM (fibra) 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":7.14,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM19":{"cod":"DM19","prov":"MOR","ref":"","nombre":"DM 19 mm (precio de datos/fab_propia_precios.csv, igual que cocinas)","medida":"280x207","unidad":"m2","historial":[{"eur":13.99,"fecha":"2026-11-06","prov":"MOR","origen":"fab_propia"}]},"DM3":{"cod":"DM3","prov":"MOR","ref":"","nombre":"DM 3 mm para trasera","medida":"244x122","unidad":"m2","historial":[{"eur":3.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]},"TABLERO10":{"cod":"TABLERO10","prov":"MOR","ref":"","nombre":"Tablero 10 mm para trasera","medida":"280x207","unidad":"m2","historial":[{"eur":7.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]},"DM16-LBL":{"cod":"DM16-LBL","prov":"ALO","ref":"","nombre":"DM 16 mm lacado blanco 2 caras","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM16","lac":"LAC-BL-2C","horas_m2":0.3}},"DM16-LCO":{"cod":"DM16-LCO","prov":"ALO","ref":"","nombre":"DM 16 mm lacado color 2 caras","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM16","lac":"LAC-CO-2C","horas_m2":0.3}},"DM16-LBL1":{"cod":"DM16-LBL1","prov":"ALO","ref":"","nombre":"DM 16 mm lacado blanco 1 cara","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM16","lac":"LAC-BL-1C","horas_m2":0.3}},"DM16-LCO1":{"cod":"DM16-LCO1","prov":"ALO","ref":"","nombre":"DM 16 mm lacado color 1 cara (melamina blanca detrás)","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM16","lac":"LAC-CO-1C","horas_m2":0.3}},"DM19-LBL":{"cod":"DM19-LBL","prov":"ALO","ref":"","nombre":"DM 19 mm lacado blanco 2 caras","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM19","lac":"LAC-BL-2C","horas_m2":0.3}},"DM19-LCO":{"cod":"DM19-LCO","prov":"ALO","ref":"","nombre":"DM 19 mm lacado color 2 caras","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM19","lac":"LAC-CO-2C","horas_m2":0.3}},"DM19-LBL1":{"cod":"DM19-LBL1","prov":"ALO","ref":"","nombre":"DM 19 mm lacado blanco 1 cara","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM19","lac":"LAC-BL-1C","horas_m2":0.3}},"DM19-LCO1":{"cod":"DM19-LCO1","prov":"ALO","ref":"","nombre":"DM 19 mm lacado color 1 cara (melamina blanca detrás)","medida":"","unidad":"m2","historial":[],"lacado":{"base":"DM19","lac":"LAC-CO-1C","horas_m2":0.3}}},"lacados":{"LAC-BL-2C":{"cod":"LAC-BL-2C","prov":"ALO","ref":"","nombre":"Lacado blanco 2 caras (Aloanco, tarifa de cocinas: 33 + 5 %)","medida":"","unidad":"m2","historial":[{"eur":34.65,"fecha":"2026-11-06","prov":"ALO","origen":"fab_propia"}]},"LAC-BL-1C":{"cod":"LAC-BL-1C","prov":"ALO","ref":"","nombre":"Lacado blanco 1 cara (Aloanco: 29 + 5 %, como en cocinas)","medida":"","unidad":"m2","historial":[{"eur":30.45,"fecha":"2026-11-06","prov":"ALO","origen":"fab_propia"}]},"LAC-CO-2C":{"cod":"LAC-CO-2C","prov":"ALO","ref":"","nombre":"Lacado color 2 caras (Aloanco, tarifa de cocinas: 42,90 + 5 %)","medida":"","unidad":"m2","historial":[{"eur":45.05,"fecha":"2026-11-06","prov":"ALO","origen":"fab_propia"}]},"LAC-CO-1C":{"cod":"LAC-CO-1C","prov":"ALO","ref":"","nombre":"Lacado color 1 cara sobre MDF con melamina blanca detrás (Aloanco: 22 + 5 %, estimado)","medida":"","unidad":"m2","historial":[{"eur":23.1,"fecha":"2026-11-06","prov":"ALO","origen":"fab_propia"}]}},"cantos":{"CANTO22":{"cod":"CANTO22","prov":"REI","ref":"2110","nombre":"Canto PVC 22x1 mm","medida":"","unidad":"m","historial":[{"eur":0.288,"fecha":"2023-01-25","prov":"REI","origen":"factura"}]}},"kits":{"EMU-KIT16":{"cod":"EMU-KIT16","prov":"FER","ref":"21000278","nombre":"Kit puerta corredera 16 mm blanco mate 2,6 m (Emuca)","medida":"2,6 m","unidad":"ud","historial":[{"eur":26.01,"fecha":"2025-11-28","prov":"FER","origen":"factura"},{"eur":29.92,"fecha":"2025-01-31","prov":"FER","origen":"factura"}],"solape":3},"EMU-GUIA2":{"cod":"EMU-GUIA2","prov":"FER","ref":"21000256","nombre":"Kit guía corredera blanco mate 2 m (Emuca)","medida":"2 m","unidad":"ud","historial":[{"eur":26.21,"fecha":"2025-11-28","prov":"FER","origen":"factura"},{"eur":25.45,"fecha":"2025-01-31","prov":"FER","origen":"factura"}],"largo":200,"carriles":2},"TERRA-TR16":{"cod":"TERRA-TR16","prov":"BYS","ref":"","nombre":"Kit puerta Terra TR16 16 mm (Syskor)","medida":"","unidad":"ud","historial":[{"eur":39.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"TERRA-KG75":{"cod":"TERRA-KG75","prov":"BYS","ref":"","nombre":"Kit guías Terra KG75 (Syskor)","medida":"","unidad":"ud","historial":[{"eur":27.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"largo":200},"ATL-RT16":{"cod":"ATL-RT16","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT16","medida":"","unidad":"ud","historial":[{"eur":45.89,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3},"ATL-GUIA2":{"cod":"ATL-GUIA2","prov":"MEN","ref":"3921284","nombre":"Kit guías Atlántico 2 carriles 2 m plata","medida":"2 m","unidad":"ud","historial":[{"eur":34.09,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"largo":200},"ATL-RT10":{"cod":"ATL-RT10","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT10 (panel 10 mm, espejo o cristal)","medida":"","unidad":"ud","historial":[{"eur":47.86,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3},"EMU-KIT16NE":{"cod":"EMU-KIT16NE","prov":"FER","ref":"21000154","nombre":"Kit puerta corredera 16 mm negro mate 2,6 m (Emuca)","medida":"2,6 m","unidad":"ud","historial":[{"eur":32.7,"fecha":"2025-01-31","prov":"FER","origen":"factura"}],"solape":3},"EMU-GUIA4NE":{"cod":"EMU-GUIA4NE","prov":"FER","ref":"21000198","nombre":"Kit guía corredera negro 4 m ancho 80 mm (Emuca)","medida":"4 m","unidad":"ud","historial":[{"eur":48.13,"fecha":"2025-01-31","prov":"FER","origen":"factura"}],"carriles":2,"largo":400},"KPTR16PM260":{"cod":"KPTR16PM260","prov":"BYS","ref":"KPTR16PM260","nombre":"Kit puerta corredera terra tr16 plata mate 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":39.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16BL260":{"cod":"KPTR16BL260","prov":"BYS","ref":"KPTR16BL260","nombre":"Kit puerta corredera terra tr16 blanco brillo 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":40.28,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16BR260":{"cod":"KPTR16BR260","prov":"BYS","ref":"KPTR16BR260","nombre":"Kit puerta corredera terra tr16 bronce 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":48.2,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16OM260":{"cod":"KPTR16OM260","prov":"BYS","ref":"KPTR16OM260","nombre":"Kit puerta corredera terra tr16 oro mate 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":45.11,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINPM260":{"cod":"KPTR16MINPM260","prov":"BYS","ref":"KPTR16MINPM260","nombre":"Kit puerta corredera terra tr16min plata mate 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":39.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINBL260":{"cod":"KPTR16MINBL260","prov":"BYS","ref":"KPTR16MINBL260","nombre":"Kit puerta corredera terra tr16min blanco brillo 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":40.28,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINBM260":{"cod":"KPTR16MINBM260","prov":"BYS","ref":"KPTR16MINBM260","nombre":"Kit puerta corredera terra tr16min blanco mate 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":46.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINNM260":{"cod":"KPTR16MINNM260","prov":"BYS","ref":"KPTR16MINNM260","nombre":"Kit puerta corredera terra tr16min negro mokka 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":46.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINPABL260":{"cod":"KPTR16MINPABL260","prov":"BYS","ref":"KPTR16MINPABL260","nombre":"Kit puerta corredera terra tr16min papel blanco 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":42.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINCE260":{"cod":"KPTR16MINCE260","prov":"BYS","ref":"KPTR16MINCE260","nombre":"Kit puerta corredera terra tr16min cerezo sin barniz 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":55.13,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINHA260":{"cod":"KPTR16MINHA260","prov":"BYS","ref":"KPTR16MINHA260","nombre":"Kit puerta corredera terra tr16min haya sin barniz 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":50.01,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINPI260":{"cod":"KPTR16MINPI260","prov":"BYS","ref":"KPTR16MINPI260","nombre":"Kit puerta corredera terra tr16min pino sin barniz 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":50.01,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINRO260":{"cod":"KPTR16MINRO260","prov":"BYS","ref":"KPTR16MINRO260","nombre":"Kit puerta corredera terra tr16min roble sin barniz 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":51.5,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR16MINSA260":{"cod":"KPTR16MINSA260","prov":"BYS","ref":"KPTR16MINSA260","nombre":"Kit puerta corredera terra tr16min sapelly sin barniz 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":48.47,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR19PM260":{"cod":"KPTR19PM260","prov":"BYS","ref":"KPTR19PM260","nombre":"Kit puerta corredera terra tr19 plata mate 2,60","medida":"","unidad":"ud","historial":[{"eur":44.93,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR19BL260":{"cod":"KPTR19BL260","prov":"BYS","ref":"KPTR19BL260","nombre":"Kit puerta corredera terra tr19 blanco brillo 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":44.86,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KPTR19NM260":{"cod":"KPTR19NM260","prov":"BYS","ref":"KPTR19NM260","nombre":"Kit puerta corredera terra tr19 negro mokka 2,60 metros","medida":"","unidad":"ud","historial":[{"eur":53.13,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"KG7520PLATA":{"cod":"KG7520PLATA","prov":"BYS","ref":"KG7520PLATA","nombre":"Kit guías sistema terra kg75-20 plata mate 2 metros","medida":"","unidad":"ud","historial":[{"eur":27.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":200},"KG7530PLATA":{"cod":"KG7530PLATA","prov":"BYS","ref":"KG7530PLATA","nombre":"Kit guías sistema terra kg75-30 plata mate 3 metros","medida":"","unidad":"ud","historial":[{"eur":41.81,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540PLATA":{"cod":"KG7540PLATA","prov":"BYS","ref":"KG7540PLATA","nombre":"Kit guías sistema terra kg75-40 plata 4 metros","medida":"","unidad":"ud","historial":[{"eur":55.75,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7520BLANCO":{"cod":"KG7520BLANCO","prov":"BYS","ref":"KG7520BLANCO","nombre":"Kit guías sistema terra kg75-20 blanco brillo 2 metros","medida":"","unidad":"ud","historial":[{"eur":27.93,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":200},"KG7530BLANCO":{"cod":"KG7530BLANCO","prov":"BYS","ref":"KG7530BLANCO","nombre":"Kit guías sistema terra kg75-30 blanco brillo 3 metros","medida":"","unidad":"ud","historial":[{"eur":41.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540BLANCO":{"cod":"KG7540BLANCO","prov":"BYS","ref":"KG7540BLANCO","nombre":"Kit guías sistema terra kg75-40 blanco brillo 4 metros","medida":"","unidad":"ud","historial":[{"eur":55.86,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7520BM":{"cod":"KG7520BM","prov":"BYS","ref":"KG7520BM","nombre":"Kit guías sistema terra kg75-20 blanco mate 2 metros","medida":"","unidad":"ud","historial":[{"eur":34.55,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":200},"KG7530BM":{"cod":"KG7530BM","prov":"BYS","ref":"KG7530BM","nombre":"Kit guías sistema terra kg75-30 blanco mate 3 metros","medida":"","unidad":"ud","historial":[{"eur":48.48,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540BM":{"cod":"KG7540BM","prov":"BYS","ref":"KG7540BM","nombre":"Kit guías sistema terra kg75-40 blanco mate 4 metros","medida":"","unidad":"ud","historial":[{"eur":62.43,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7520NM":{"cod":"KG7520NM","prov":"BYS","ref":"KG7520NM","nombre":"Kit guías sistema terra kg75-20 negro mokka 2 metros","medida":"","unidad":"ud","historial":[{"eur":34.55,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":200},"KG7530NM":{"cod":"KG7530NM","prov":"BYS","ref":"KG7530NM","nombre":"Kit guías sistema terra kg75-30 negro mokka 3 metros","medida":"","unidad":"ud","historial":[{"eur":48.48,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540NM":{"cod":"KG7540NM","prov":"BYS","ref":"KG7540NM","nombre":"Kit guías sistema terra kg75-40 negro mokka 4 metros","medida":"","unidad":"ud","historial":[{"eur":62.43,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7530BRONCE":{"cod":"KG7530BRONCE","prov":"BYS","ref":"KG7530BRONCE","nombre":"Kit guías sistema terra kg75-30 bronce 3 metros","medida":"","unidad":"ud","historial":[{"eur":49.42,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540BRONCE":{"cod":"KG7540BRONCE","prov":"BYS","ref":"KG7540BRONCE","nombre":"Kit guías sistema terra kg75-40 bronce 4 metros","medida":"","unidad":"ud","historial":[{"eur":79.63,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7520OM":{"cod":"KG7520OM","prov":"BYS","ref":"KG7520OM","nombre":"Kit guías sistema terra kg75-20 oro mate 2 metros","medida":"","unidad":"ud","historial":[{"eur":30.12,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":200},"KG7530OM":{"cod":"KG7530OM","prov":"BYS","ref":"KG7530OM","nombre":"Kit guías sistema terra kg75-20 oro mate 3 metros","medida":"","unidad":"ud","historial":[{"eur":45.17,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7530P84":{"cod":"KG7530P84","prov":"BYS","ref":"KG7530P84","nombre":"Kit guías sistema terra kg75-30 papel blanco 3 metros","medida":"","unidad":"ud","historial":[{"eur":49.18,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7530CEREZO":{"cod":"KG7530CEREZO","prov":"BYS","ref":"KG7530CEREZO","nombre":"Kit guías sistema terra kg75-30 cerezo 3 metros","medida":"","unidad":"ud","historial":[{"eur":58.33,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7530HAYA":{"cod":"KG7530HAYA","prov":"BYS","ref":"KG7530HAYA","nombre":"Kit guías sistema terra kg75-30 haya 3 metros","medida":"","unidad":"ud","historial":[{"eur":56.33,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7530PINO":{"cod":"KG7530PINO","prov":"BYS","ref":"KG7530PINO","nombre":"Kit guías sistema terra kg75-30 pino 3 metros","medida":"","unidad":"ud","historial":[{"eur":56.33,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540PINO":{"cod":"KG7540PINO","prov":"BYS","ref":"KG7540PINO","nombre":"Kit guías sistema terra kg75-40 pino 4 metros","medida":"","unidad":"ud","historial":[{"eur":75.12,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7530ROBLE":{"cod":"KG7530ROBLE","prov":"BYS","ref":"KG7530ROBLE","nombre":"Kit guías sistema terra kg75-30 roble 3 metros","medida":"","unidad":"ud","historial":[{"eur":57.81,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540ROBLE":{"cod":"KG7540ROBLE","prov":"BYS","ref":"KG7540ROBLE","nombre":"Kit guías sistema terra kg75-40 roble 4 metros","medida":"","unidad":"ud","historial":[{"eur":77.1,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"KG7530SAPELLY":{"cod":"KG7530SAPELLY","prov":"BYS","ref":"KG7530SAPELLY","nombre":"Kit guías sistema terra kg75-30 sapelly 3 metros","medida":"","unidad":"ud","historial":[{"eur":57.05,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"KG7540SAPELLY":{"cod":"KG7540SAPELLY","prov":"BYS","ref":"KG7540SAPELLY","nombre":"Kit guías sistema terra kg75-40 sapelly 4 metros","medida":"","unidad":"ud","historial":[{"eur":76.06,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"308A02300":{"cod":"308A02300","prov":"BYS","ref":"308A02300","nombre":"Kit guías triple terra kg75 3 metros plata mate","medida":"","unidad":"ud","historial":[{"eur":69.3,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":3,"largo":300},"V80A00K2P":{"cod":"V80A00K2P","prov":"BYS","ref":"V80A00K2P","nombre":"Kit carros volare v80 adapta 2 puertas","medida":"","unidad":"ud","historial":[{"eur":78.1,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2},"V80A00K3P":{"cod":"V80A00K3P","prov":"BYS","ref":"V80A00K3P","nombre":"Kit carros volare v80 adapta 3 puertas","medida":"","unidad":"ud","historial":[{"eur":103.68,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":3},"V80ACK200":{"cod":"V80ACK200","prov":"BYS","ref":"V80ACK200","nombre":"Kit guías volare v80 adapta 2 metros","medida":"","unidad":"ud","historial":[{"eur":40.73,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":200},"V80ACK300":{"cod":"V80ACK300","prov":"BYS","ref":"V80ACK300","nombre":"Kit guías volare v80 adapta 3 metros","medida":"","unidad":"ud","historial":[{"eur":61.09,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":300},"V80ACK400":{"cod":"V80ACK400","prov":"BYS","ref":"V80ACK400","nombre":"Kit guías volare v80 adapta 4 metros","medida":"","unidad":"ud","historial":[{"eur":81.45,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":2,"largo":400},"VK60S2A02":{"cod":"VK60S2A02","prov":"ALA","ref":"VK60S2A02","nombre":"Volare V60 Adapta kit 2 puertas simétrico plata (Syskor)","medida":"4000 mm","unidad":"ud","historial":[{"eur":327.34,"fecha":"2026-11-05","prov":"ALA","origen":"web"}],"hojas":2},"VK60A2AM9":{"cod":"VK60A2AM9","prov":"ALA","ref":"VK60A2AM9","nombre":"Volare V60 Adapta kit 2 puertas asimétrico black mokka (Syskor)","medida":"4000 mm","unidad":"ud","historial":[{"eur":346.43,"fecha":"2026-11-05","prov":"ALA","origen":"web"}],"hojas":2},"V80AMK200":{"cod":"V80AMK200","prov":"ALA","ref":"V80AMK200-1","nombre":"Kit guías Volare Adapta 2 m black mokka (Syskor)","medida":"2 m","unidad":"ud","historial":[{"eur":64.95,"fecha":"2026-11-05","prov":"ALA","origen":"web"}],"carriles":2,"largo":200},"V80AMK300":{"cod":"V80AMK300","prov":"ALA","ref":"V80AMK300-1","nombre":"Kit guías Volare Adapta 3 m black mokka (Syskor)","medida":"3 m","unidad":"ud","historial":[{"eur":97.42,"fecha":"2026-11-05","prov":"ALA","origen":"web"}],"carriles":2,"largo":300},"V80AMK400":{"cod":"V80AMK400","prov":"ALA","ref":"V80AMK400-1","nombre":"Kit guías Volare Adapta 4 m black mokka (Syskor)","medida":"4 m","unidad":"ud","historial":[{"eur":129.89,"fecha":"2026-11-05","prov":"ALA","origen":"web"}],"carriles":2,"largo":400},"MIL001600":{"cod":"MIL001600","prov":"BYS","ref":"MIL001600","nombre":"Murano inline coplanar syskor 2 puertas 1600 mm","medida":"","unidad":"ud","historial":[{"eur":630.55,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":160},"MIL001800":{"cod":"MIL001800","prov":"BYS","ref":"MIL001800","nombre":"Murano inline coplanar syskor 2 puertas 1800 mm","medida":"","unidad":"ud","historial":[{"eur":655.26,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":180},"MIL002000":{"cod":"MIL002000","prov":"BYS","ref":"MIL002000","nombre":"Murano inline coplanar syskor 2 puertas 2000 mm","medida":"","unidad":"ud","historial":[{"eur":672.77,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":200},"MIL002200":{"cod":"MIL002200","prov":"BYS","ref":"MIL002200","nombre":"Murano inline coplanar syskor 2 puertas 2200 mm","medida":"","unidad":"ud","historial":[{"eur":689.87,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":220},"MIL002400":{"cod":"MIL002400","prov":"BYS","ref":"MIL002400","nombre":"Murano inline coplanar syskor 2 puertas 2400 mm","medida":"","unidad":"ud","historial":[{"eur":712.57,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":240},"MIL002600":{"cod":"MIL002600","prov":"BYS","ref":"MIL002600","nombre":"Murano inline coplanar syskor 2 puertas 2600 mm","medida":"","unidad":"ud","historial":[{"eur":730.12,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":260},"MIL002800":{"cod":"MIL002800","prov":"BYS","ref":"MIL002800","nombre":"Murano inline coplanar syskor 2 puertas 2800 mm","medida":"","unidad":"ud","historial":[{"eur":747.84,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"hojas":2,"anchoMax":280},"SENSUS3779":{"cod":"SENSUS3779","prov":"BYS","ref":"SENSUS3779","nombre":"Juego accesorios sensus 40 kg superior","medida":"","unidad":"ud","historial":[{"eur":26.51,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"SENSUS3823":{"cod":"SENSUS3823","prov":"BYS","ref":"SENSUS3823","nombre":"Juego accesorios sensus 80 kg superior","medida":"","unidad":"ud","historial":[{"eur":27.32,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"K40852":{"cod":"K40852","prov":"BYS","ref":"K40852","nombre":"Juego accesorios k40","medida":"","unidad":"ud","historial":[{"eur":14.59,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"K75862":{"cod":"K75862","prov":"BYS","ref":"K75862","nombre":"Juegos accesorios k75","medida":"","unidad":"ud","historial":[{"eur":21.23,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"NK503450":{"cod":"NK503450","prov":"BYS","ref":"NK503450","nombre":"Juego accesorios nk50","medida":"","unidad":"ud","historial":[{"eur":20.96,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"NK80858":{"cod":"NK80858","prov":"BYS","ref":"NK80858","nombre":"Juego accesorios nk80","medida":"","unidad":"ud","historial":[{"eur":25.77,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"SENSUS3793":{"cod":"SENSUS3793","prov":"BYS","ref":"SENSUS3793","nombre":"Perfil aluminio sensus 40 kg 3 metros natural","medida":"","unidad":"ud","historial":[{"eur":38.35,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":1,"largo":300},"SENSUS3863":{"cod":"SENSUS3863","prov":"BYS","ref":"SENSUS3863","nombre":"Perfil aluminio sensus 80 kg 3 metros natural","medida":"","unidad":"ud","historial":[{"eur":59.44,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":1,"largo":300},"K40873M3":{"cod":"K40873M3","prov":"BYS","ref":"K40873M3","nombre":"Perfil k40 y k75 3 metros","medida":"","unidad":"ud","historial":[{"eur":18.75,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":1,"largo":300},"NK452019":{"cod":"NK452019","prov":"BYS","ref":"NK452019","nombre":"Perfil aluminio nk45 y nk50 3 metros","medida":"","unidad":"ud","historial":[{"eur":37.58,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":1,"largo":300},"NK802013":{"cod":"NK802013","prov":"BYS","ref":"NK802013","nombre":"Perfil aluminio nk80 3 metros","medida":"","unidad":"ud","historial":[{"eur":46.84,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"carriles":1,"largo":300},"40931605":{"cod":"40931605","prov":"BYS","ref":"40931605","nombre":"Carril Slido Fold para puerta plegable 2,5 m","medida":"2,5 m","unidad":"ud","historial":[{"eur":37.33,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40936040":{"cod":"40936040","prov":"BYS","ref":"40936040","nombre":"Juego de herrajes Slido Fold 50 kg para 2 puertas plegables, izquierda","medida":"","unidad":"ud","historial":[{"eur":77.51,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40936041":{"cod":"40936041","prov":"BYS","ref":"40936041","nombre":"Juego de herrajes Slido Fold 50 kg para 2 puertas plegables, derecha","medida":"","unidad":"ud","historial":[{"eur":77.51,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825007":{"cod":"40825007","prov":"BYS","ref":"40825007","nombre":"Herraje puerta escamoteable Slido F-Park71 340/230 (por hoja, con bisagras)","medida":"340/230","unidad":"ud","historial":[{"eur":42.99,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825008":{"cod":"40825008","prov":"BYS","ref":"40825008","nombre":"Herraje puerta escamoteable Slido F-Park71 408/294 (por hoja, con bisagras)","medida":"408/294","unidad":"ud","historial":[{"eur":43.37,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825009":{"cod":"40825009","prov":"BYS","ref":"40825009","nombre":"Herraje puerta escamoteable Slido F-Park71 440/326 (por hoja, con bisagras)","medida":"440/326","unidad":"ud","historial":[{"eur":43.96,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825010":{"cod":"40825010","prov":"BYS","ref":"40825010","nombre":"Herraje puerta escamoteable Slido F-Park71 504/390 (por hoja, con bisagras)","medida":"504/390","unidad":"ud","historial":[{"eur":45.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825011":{"cod":"40825011","prov":"BYS","ref":"40825011","nombre":"Herraje puerta escamoteable Slido F-Park71 536/422 (por hoja, con bisagras)","medida":"536/422","unidad":"ud","historial":[{"eur":41.33,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825012":{"cod":"40825012","prov":"BYS","ref":"40825012","nombre":"Herraje puerta escamoteable Slido F-Park71 600/486 (por hoja, con bisagras)","medida":"600/486","unidad":"ud","historial":[{"eur":49.22,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40825004":{"cod":"40825004","prov":"BYS","ref":"40825004","nombre":"Kit herraje puerta escamoteable triple Slido F-Park71 25B 536/422, hasta 2.300 mm","medida":"536/422","unidad":"ud","historial":[{"eur":80.13,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]}},"perfiles":{},"hojas":{"HOJA-LAC":{"cod":"HOJA-LAC","prov":"BRI","ref":"","nombre":"Hoja lacada a medida (tarifa de puertas de cocina, grupo 4)","medida":"","unidad":"m2","historial":[{"eur":110.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}],"grupo":4},"HOJA-LAM":{"cod":"HOJA-LAM","prov":"BRI","ref":"","nombre":"Hoja laminada (tarifa de puertas de cocina, grupo 2)","medida":"","unidad":"m2","historial":[{"eur":60.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}],"grupo":2}},"paneles":{"ESPEJO4":{"cod":"ESPEJO4","prov":"SAL","ref":"","nombre":"Espejo plata 4 mm","medida":"","unidad":"m2","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]},"CRISTAL4":{"cod":"CRISTAL4","prov":"SAL","ref":"","nombre":"Cristal 4 mm","medida":"","unidad":"m2","historial":[{"eur":30.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]},"CRISTAL8":{"cod":"CRISTAL8","prov":"SAL","ref":"","nombre":"Balda de cristal templado 8 mm","medida":"","unidad":"m2","historial":[{"eur":60.0,"fecha":"2026-11-06","prov":"SAL","origen":"estimado"}]}},"herrajes":{"SOPORTE":{"cod":"SOPORTE","prov":"BYS","ref":"","nombre":"Soporte de estante","medida":"","unidad":"ud","historial":[{"eur":0.25,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-B":{"cod":"BARRA-B","prov":"BYS","ref":"","nombre":"Barra oval cromada con soportes","medida":"","unidad":"m","historial":[{"eur":8.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-M":{"cod":"BARRA-M","prov":"BYS","ref":"","nombre":"Barra de aluminio ovalada con soportes","medida":"","unidad":"m","historial":[{"eur":12.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-A":{"cod":"BARRA-A","prov":"MEN","ref":"","nombre":"Barra de aluminio con LED","medida":"","unidad":"m","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"MEN","origen":"estimado"}]},"BISAGRA-B":{"cod":"BISAGRA-B","prov":"FER","ref":"","nombre":"Bisagra normal","medida":"","unidad":"ud","historial":[{"eur":1.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-M":{"cod":"BISAGRA-M","prov":"FER","ref":"","nombre":"Bisagra con freno","medida":"","unidad":"ud","historial":[{"eur":2.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-A":{"cod":"BISAGRA-A","prov":"FER","ref":"","nombre":"Bisagra con freno gama alta (Blum)","medida":"","unidad":"ud","historial":[{"eur":4.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-B":{"cod":"CAJON-B","prov":"FER","ref":"","nombre":"Cajón interior con guía de bolas (material)","medida":"","unidad":"ud","historial":[{"eur":20.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-M":{"cod":"CAJON-M","prov":"FER","ref":"","nombre":"Cajón interior con guía oculta y freno","medida":"","unidad":"ud","historial":[{"eur":32.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-A":{"cod":"CAJON-A","prov":"FER","ref":"","nombre":"Cajón interior de doble pared con freno","medida":"","unidad":"ud","historial":[{"eur":55.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"EMU-RUEDASUP":{"cod":"EMU-RUEDASUP","prov":"FER","ref":"21000073","nombre":"Rueda superior para guía de 80 mm (Emuca)","medida":"","unidad":"ud","historial":[{"eur":0.72,"fecha":"2025-01-31","prov":"FER","origen":"factura"}]},"EMU-RUEDAINF":{"cod":"EMU-RUEDAINF","prov":"FER","ref":"21000072","nombre":"Rueda inferior grande de acero (Emuca)","medida":"","unidad":"ud","historial":[{"eur":1.68,"fecha":"2025-01-31","prov":"FER","origen":"factura"}]},"804RETACK040":{"cod":"804RETACK040","prov":"BYS","ref":"804RETACK040","nombre":"Kit autocierre terra s75 y s85 puertas 40kg","medida":"","unidad":"ud","historial":[{"eur":17.1,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"804RETACK060":{"cod":"804RETACK060","prov":"BYS","ref":"804RETACK060","nombre":"Kit autocierre terra s75 y s85 puertas 60kg","medida":"","unidad":"ud","historial":[{"eur":22.8,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"804RETCEN":{"cod":"804RETCEN","prov":"BYS","ref":"804RETCEN","nombre":"Kit retenedor central sistema terra para armarios 3 puertas","medida":"","unidad":"ud","historial":[{"eur":30.65,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"104S75ES3":{"cod":"104S75ES3","prov":"BYS","ref":"104S75ES3","nombre":"Kit ruedas altas con autocierre terra s75 easy soft","medida":"","unidad":"ud","historial":[{"eur":17.1,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"802ANV000":{"cod":"802ANV000","prov":"BYS","ref":"802ANV000","nombre":"Rueda superior antivuelco terra","medida":"","unidad":"ud","historial":[{"eur":0.53,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"101D60002":{"cod":"101D60002","prov":"BYS","ref":"101D60002","nombre":"Rueda inferior terra s75 y s85 ø60 diente negro","medida":"","unidad":"ud","historial":[{"eur":3.68,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"102RODS75":{"cod":"102RODS75","prov":"BYS","ref":"102RODS75","nombre":"Rueda superior modelo terra s75","medida":"","unidad":"ud","historial":[{"eur":1.41,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"V80A00K1F":{"cod":"V80A00K1F","prov":"BYS","ref":"V80A00K1F","nombre":"Kit freno amortiguado alto-bajo volare","medida":"","unidad":"ud","historial":[{"eur":8.96,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"LED-TIRA":{"cod":"LED-TIRA","prov":"BYS","ref":"LDCOB24V20+PAGLAXMNKAL","nombre":"Tira LED con perfil","medida":"","unidad":"m","historial":[{"eur":4.46,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"LED-F3":{"cod":"LED-F3","prov":"BYS","ref":"LDZAS30WEC2430+AEWBBUNI10DIM","nombre":"Fuente LED con sensor hasta 3 m","medida":"","unidad":"ud","historial":[{"eur":20.49,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"LED-F6":{"cod":"LED-F6","prov":"BYS","ref":"LDZAS60WEC2430+AEWBBUNI10DIM","nombre":"Fuente LED con sensor hasta 6 m","medida":"","unidad":"ud","historial":[{"eur":27.52,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"SOP-CRIS":{"cod":"SOP-CRIS","prov":"BYS","ref":"","nombre":"Soporte de balda de cristal","medida":"","unidad":"ud","historial":[{"eur":1.2,"fecha":"2026-11-06","prov":"BYS","origen":"estimado"}]},"BARRA-OVAL":{"cod":"BARRA-OVAL","prov":"BYS","ref":"3015TOCR+3OV9006","nombre":"Barra oval cromada 30x15 con soportes laterales","medida":"","unidad":"m","historial":[{"eur":2.98,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"BARRA-RECT":{"cod":"BARRA-RECT","prov":"BYS","ref":"196APM+1954PM","nombre":"Barra rectangular con goma plata mate con soportes laterales","medida":"","unidad":"m","historial":[{"eur":8.5,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"BARRA-LED":{"cod":"BARRA-LED","prov":"MEN","ref":"8700572","nombre":"Barra WARDROBE con LED y sensor (precio de 1 m)","medida":"","unidad":"m","historial":[{"eur":69.96,"fecha":"2026-11-05","prov":"MEN","origen":"web"}]},"40800412":{"cod":"40800412","prov":"BYS","ref":"40800412","nombre":"Bisagra con base, montaje solapado 16-19 mm, sin amortiguación","medida":"","unidad":"ud","historial":[{"eur":1.3,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"40800406":{"cod":"40800406","prov":"BYS","ref":"40800406","nombre":"Bisagra con base, montaje solapado 16-19 mm, con amortiguación","medida":"","unidad":"ud","historial":[{"eur":1.3,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"CAJON-GTV":{"cod":"CAJON-GTV","prov":"BYS","ref":"WGCESTO60NE","nombre":"Cajón metálico GTV Élite (media de M60 a M90)","medida":"","unidad":"ud","historial":[{"eur":53.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"},{"eur":62.12,"fecha":"2026-11-05","prov":"BYS","origen":"web"},{"eur":64.56,"fecha":"2026-11-05","prov":"BYS","origen":"web"},{"eur":66.79,"fecha":"2026-11-05","prov":"BYS","origen":"web"}]},"MEN-3006800":{"cod":"MEN-3006800","prov":"MEN","ref":"3006800","nombre":"Laterales CHIC h=175 antracita con guía de extracción total y cierre amortiguado, fondo 492 mm","medida":"492 mm","unidad":"ud","historial":[{"eur":81.58,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007966":{"cod":"MEN-3007966","prov":"MEN","ref":"3007966","nombre":"Laterales CHIC h=175 antracita con guía de extracción total y cierre amortiguado, fondo 322 mm","medida":"322 mm","unidad":"ud","historial":[{"eur":77.5,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007746":{"cod":"MEN-3007746","prov":"MEN","ref":"3007746","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 400-500 mm","medida":"400-500 mm","unidad":"ud","historial":[{"eur":29.62,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007757":{"cod":"MEN-3007757","prov":"MEN","ref":"3007757","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 500-600 mm","medida":"500-600 mm","unidad":"ud","historial":[{"eur":30.68,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007768":{"cod":"MEN-3007768","prov":"MEN","ref":"3007768","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 600-700 mm","medida":"600-700 mm","unidad":"ud","historial":[{"eur":33.06,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007779":{"cod":"MEN-3007779","prov":"MEN","ref":"3007779","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 700-800 mm","medida":"700-800 mm","unidad":"ud","historial":[{"eur":39.26,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007790":{"cod":"MEN-3007790","prov":"MEN","ref":"3007790","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 800-900 mm","medida":"800-900 mm","unidad":"ud","historial":[{"eur":40.19,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3007801":{"cod":"MEN-3007801","prov":"MEN","ref":"3007801","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 900-1000 mm","medida":"900-1000 mm","unidad":"ud","historial":[{"eur":41.13,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3008537":{"cod":"MEN-3008537","prov":"MEN","ref":"3008537","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 1000-1100 mm","medida":"1000-1100 mm","unidad":"ud","historial":[{"eur":47.44,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"MEN-3008538":{"cod":"MEN-3008538","prov":"MEN","ref":"3008538","nombre":"Cristales fumé CHIC frontal y trasera h=161, mueble de 1100-1200 mm","medida":"1100-1200 mm","unidad":"ud","historial":[{"eur":48.06,"fecha":"2026-11-06","prov":"MEN","origen":"web"}]},"IKEA-OVER46":{"cod":"IKEA-OVER46","prov":"IKE","ref":"","nombre":"ÖVERSIDAN tira LED de armario con sensor, regulable, 46 cm","medida":"","unidad":"ud","historial":[{"eur":10.74,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}]},"IKEA-OVER71":{"cod":"IKEA-OVER71","prov":"IKE","ref":"","nombre":"ÖVERSIDAN tira LED de armario con sensor, regulable, 71 cm","medida":"","unidad":"ud","historial":[{"eur":14.04,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}]},"IKEA-OVER96":{"cod":"IKEA-OVER96","prov":"IKE","ref":"","nombre":"ÖVERSIDAN tira LED de armario con sensor, regulable, 96 cm","medida":"","unidad":"ud","historial":[{"eur":16.52,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}]},"IKEA-TRADFRI30":{"cod":"IKEA-TRADFRI30","prov":"IKE","ref":"","nombre":"TRÅDFRI driver de 30 W para control inalámbrico","medida":"","unidad":"ud","historial":[{"eur":23.97,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}]},"IKEA-FORNIMMA":{"cod":"IKEA-FORNIMMA","prov":"IKE","ref":"","nombre":"FÖRNIMMA cable de alimentación 3,5 m","medida":"","unidad":"ud","historial":[{"eur":4.13,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}]}},"interior":{"MEN-3007086":{"cod":"MEN-3007086","prov":"MEN","ref":"3007086","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"500-600","unidad":"ud","historial":[{"eur":89.42,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":53,"max":63,"familia":"Pantaloneros y faldas"},"MEN-3007108":{"cod":"MEN-3007108","prov":"MEN","ref":"3007108","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"600-700","unidad":"ud","historial":[{"eur":91.72,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":73,"familia":"Pantaloneros y faldas"},"MEN-3007130":{"cod":"MEN-3007130","prov":"MEN","ref":"3007130","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"700-800","unidad":"ud","historial":[{"eur":97.59,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":73,"max":83,"familia":"Pantaloneros y faldas"},"MEN-3007064":{"cod":"MEN-3007064","prov":"MEN","ref":"3007064","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 350 mm","medida":"800-900","unidad":"ud","historial":[{"eur":102.62,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":93,"familia":"Pantaloneros y faldas"},"MEN-3008120":{"cod":"MEN-3008120","prov":"MEN","ref":"3008120","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 490 mm","medida":"600-700","unidad":"ud","historial":[{"eur":103.65,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":73,"familia":"Pantaloneros y faldas"},"MEN-3008142":{"cod":"MEN-3008142","prov":"MEN","ref":"3008142","nombre":"Pantalonero CHIC con tirador y cierre amortiguado 490 mm","medida":"800-900","unidad":"ud","historial":[{"eur":120.15,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":93,"familia":"Pantaloneros y faldas"},"MEN-0100297":{"cod":"MEN-0100297","prov":"MEN","ref":"0100297","nombre":"Soporte pantalonero extraíble lateral con bandeja antracita","medida":"600-650","unidad":"ud","historial":[{"eur":116.4,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":68,"familia":"Pantaloneros y faldas"},"MEN-0100385":{"cod":"MEN-0100385","prov":"MEN","ref":"0100385","nombre":"Soporte pantalonero extraíble lateral con bandeja antracita","medida":"800-850","unidad":"ud","historial":[{"eur":133.16,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":88,"familia":"Pantaloneros y faldas"},"MEN-3007152":{"cod":"MEN-3007152","prov":"MEN","ref":"3007152","nombre":"Pantalonero CHIC de fijación lateral con guía de extracción total","medida":"475 mm","unidad":"ud","historial":[{"eur":62.77,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":51,"max":61,"familia":"Pantaloneros y faldas"},"MEN-3007174":{"cod":"MEN-3007174","prov":"MEN","ref":"3007174","nombre":"Pantalonero CHIC de fijación superior con bandeja","medida":"360 mm","unidad":"ud","historial":[{"eur":59.2,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":40,"max":50,"familia":"Pantaloneros y faldas"},"MEN-3007196":{"cod":"MEN-3007196","prov":"MEN","ref":"3007196","nombre":"Pantalonero doble CHIC de fijación superior con bandeja","medida":"700 mm","unidad":"ud","historial":[{"eur":69.84,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":74,"max":84,"familia":"Pantaloneros y faldas"},"MEN-3002496":{"cod":"MEN-3002496","prov":"MEN","ref":"3002496","nombre":"Pantalonero extraíble cromo para 9 pantalones (fijación superior)","medida":"330 mm","unidad":"ud","historial":[{"eur":32.87,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":37,"max":47,"familia":"Pantaloneros y faldas"},"MEN-3002485":{"cod":"MEN-3002485","prov":"MEN","ref":"3002485","nombre":"Pantalonero cromo para 18 pantalones (fijación superior)","medida":"662 mm","unidad":"ud","historial":[{"eur":38.08,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":70,"max":80,"familia":"Pantaloneros y faldas"},"MEN-3003771":{"cod":"MEN-3003771","prov":"MEN","ref":"3003771","nombre":"Zapatero extraíble sin frontal (mueble con puerta)","medida":"45-65 cm","unidad":"ud","historial":[{"eur":85.0,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":48,"max":68,"familia":"Zapateros"},"MEN-3003782":{"cod":"MEN-3003782","prov":"MEN","ref":"3003782","nombre":"Zapatero extraíble sin frontal (mueble con puerta)","medida":"64-100 cm","unidad":"ud","historial":[{"eur":98.62,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":67,"max":103,"familia":"Zapateros"},"MEN-3000913":{"cod":"MEN-3000913","prov":"MEN","ref":"3000913","nombre":"Zapatero extraíble con sujeción frontal","medida":"45-65 cm","unidad":"ud","historial":[{"eur":92.74,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":48,"max":68,"familia":"Zapateros"},"MEN-3000924":{"cod":"MEN-3000924","prov":"MEN","ref":"3000924","nombre":"Zapatero extraíble con sujeción frontal","medida":"64-100 cm","unidad":"ud","historial":[{"eur":107.15,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":67,"max":103,"familia":"Zapateros"},"MEN-0129935":{"cod":"MEN-0129935","prov":"MEN","ref":"0129935","nombre":"Juego soporte zapateros extraíble","medida":"500-600","unidad":"ud","historial":[{"eur":93.99,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":54,"max":64,"familia":"Zapateros"},"MEN-0129950":{"cod":"MEN-0129950","prov":"MEN","ref":"0129950","nombre":"Juego soporte zapateros extraíble","medida":"700-800","unidad":"ud","historial":[{"eur":97.55,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":74,"max":84,"familia":"Zapateros"},"MEN-0129961":{"cod":"MEN-0129961","prov":"MEN","ref":"0129961","nombre":"Juego soporte zapateros extraíble","medida":"800-900","unidad":"ud","historial":[{"eur":106.37,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":84,"max":94,"familia":"Zapateros"},"MEN-3003896":{"cod":"MEN-3003896","prov":"MEN","ref":"3003896","nombre":"Zapatero extraíble de fijación lateral cromado 320 x 600","medida":"600 mm","unidad":"ud","historial":[{"eur":128.01,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Zapateros"},"MEN-3006844":{"cod":"MEN-3006844","prov":"MEN","ref":"3006844","nombre":"Soporte zapatero CHIC para bandeja extraíble","medida":"600-700","unidad":"ud","historial":[{"eur":37.82,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":63,"max":73,"familia":"Zapateros"},"MEN-3006866":{"cod":"MEN-3006866","prov":"MEN","ref":"3006866","nombre":"Soporte zapatero CHIC para bandeja extraíble","medida":"800-900","unidad":"ud","historial":[{"eur":38.84,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":83,"max":93,"familia":"Zapateros"},"MEN-3000536":{"cod":"MEN-3000536","prov":"MEN","ref":"3000536","nombre":"Zapatero fijo extensible cromado","medida":"","unidad":"ud","historial":[{"eur":8.43,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":10.01,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Zapateros"},"MEN-3001251":{"cod":"MEN-3001251","prov":"MEN","ref":"3001251","nombre":"Corbatero/cinturonero extraíble lateral negro","medida":"500 mm","unidad":"ud","historial":[{"eur":30.03,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-0119973":{"cod":"MEN-0119973","prov":"MEN","ref":"0119973","nombre":"Corbatero/cinturonero extraíble lateral plata mate","medida":"500 mm","unidad":"ud","historial":[{"eur":39.6,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-3007262":{"cod":"MEN-3007262","prov":"MEN","ref":"3007262","nombre":"Corbatero cinturonero CHIC con tirador y guía de extracción","medida":"458 mm","unidad":"ud","historial":[{"eur":25.44,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-3000814":{"cod":"MEN-3000814","prov":"MEN","ref":"3000814","nombre":"Corbatero cinturonero fijo lateral","medida":"455 mm","unidad":"ud","historial":[{"eur":13.14,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Corbateros y cinturoneros"},"MEN-3002765":{"cod":"MEN-3002765","prov":"MEN","ref":"3002765","nombre":"Colgador abatible doble (elevador) económico","medida":"650-920 mm","unidad":"ud","historial":[{"eur":39.48,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":68,"max":95,"familia":"Colgadores abatibles"},"MEN-3002776":{"cod":"MEN-3002776","prov":"MEN","ref":"3002776","nombre":"Colgador abatible doble (elevador) económico","medida":"880-1270 mm","unidad":"ud","historial":[{"eur":40.01,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":91,"max":130,"familia":"Colgadores abatibles"},"MEN-3001461":{"cod":"MEN-3001461","prov":"MEN","ref":"3001461","nombre":"Colgador abatible doble (elevador) LIFT","medida":"750-1170 mm","unidad":"ud","historial":[{"eur":49.77,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":78,"max":120,"familia":"Colgadores abatibles"},"MEN-3000610":{"cod":"MEN-3000610","prov":"MEN","ref":"3000610","nombre":"Colgador abatible doble (elevador) SUPER LIFT con regulación de carga","medida":"750-1170 mm","unidad":"ud","historial":[{"eur":88.48,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":78,"max":120,"familia":"Colgadores abatibles"},"MEN-3007526":{"cod":"MEN-3007526","prov":"MEN","ref":"3007526","nombre":"Colgador abatible doble (elevador) CHIC","medida":"560-950 mm","unidad":"ud","historial":[{"eur":138.68,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":59,"max":98,"familia":"Colgadores abatibles"},"MEN-3000481":{"cod":"MEN-3000481","prov":"MEN","ref":"3000481","nombre":"Colgador abatible individual (elevador)","medida":"450-550 mm","unidad":"ud","historial":[{"eur":53.72,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":48,"max":58,"familia":"Colgadores abatibles"},"MEN-8700561":{"cod":"MEN-8700561","prov":"MEN","ref":"8700561","nombre":"Barra WARDROBE con LED y sensor de movimiento","medida":"600 mm","unidad":"ud","historial":[{"eur":56.14,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":60,"max":70,"familia":"Barras con LED"},"MEN-8700572":{"cod":"MEN-8700572","prov":"MEN","ref":"8700572","nombre":"Barra WARDROBE con LED y sensor de movimiento","medida":"1000 mm","unidad":"ud","historial":[{"eur":69.96,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":95,"max":110,"familia":"Barras con LED"},"MEN-8700583":{"cod":"MEN-8700583","prov":"MEN","ref":"8700583","nombre":"Barra WARDROBE con LED y sensor de movimiento","medida":"1200 mm","unidad":"ud","historial":[{"eur":80.1,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"min":115,"max":130,"familia":"Barras con LED"},"MEN-8317473":{"cod":"MEN-8317473","prov":"MEN","ref":"8317473","nombre":"Barra LYTHOS con LED y batería recargable","medida":"","unidad":"ud","historial":[{"eur":43.16,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":48.76,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":55.43,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras con LED"},"MEN-3004670":{"cod":"MEN-3004670","prov":"MEN","ref":"3004670","nombre":"Barra NEW KERRI rectangular antideslizante 2 m","medida":"2 m","unidad":"ud","historial":[{"eur":16.51,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3000275":{"cod":"MEN-3000275","prov":"MEN","ref":"3000275","nombre":"Barra NEW KERRI curva 90 grados para rincón 1+1 m","medida":"1+1 m","unidad":"ud","historial":[{"eur":63.9,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3000957":{"cod":"MEN-3000957","prov":"MEN","ref":"3000957","nombre":"Soporte de extracción total para perchas","medida":"360 mm","unidad":"ud","historial":[{"eur":22.23,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3000968":{"cod":"MEN-3000968","prov":"MEN","ref":"3000968","nombre":"Soporte de extracción total para perchas","medida":"445 mm","unidad":"ud","historial":[{"eur":25.07,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-3002780":{"cod":"MEN-3002780","prov":"MEN","ref":"3002780","nombre":"Cuelgaperchas extensible tipo trompeta","medida":"80 cm","unidad":"ud","historial":[{"eur":46.39,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Barras"},"MEN-0122821":{"cod":"MEN-0122821","prov":"MEN","ref":"0122821","nombre":"Espejo extraíble para el interior del armario","medida":"","unidad":"ud","historial":[{"eur":127.44,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":203.91,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Espejos y colgadores"},"MEN-3002791":{"cod":"MEN-3002791","prov":"MEN","ref":"3002791","nombre":"Soporte para trajes abatible de 3 posiciones","medida":"","unidad":"ud","historial":[{"eur":19.86,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Espejos y colgadores"},"MEN-3000990":{"cod":"MEN-3000990","prov":"MEN","ref":"3000990","nombre":"Protector de mangas y soporte para perchas","medida":"","unidad":"ud","historial":[{"eur":15.36,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Espejos y colgadores"},"MEN-0129880":{"cod":"MEN-0129880","prov":"MEN","ref":"0129880","nombre":"Kit bandeja extraíble","medida":"","unidad":"ud","historial":[{"eur":90.57,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":98.5,"fecha":"2026-11-05","prov":"MEN","origen":"web"},{"eur":107.47,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles"},"MEN-3000979":{"cod":"MEN-3000979","prov":"MEN","ref":"3000979","nombre":"Juego de guías para estante extraíble","medida":"","unidad":"ud","historial":[{"eur":55.32,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles"},"MEN-3006778":{"cod":"MEN-3006778","prov":"MEN","ref":"3006778","nombre":"Juego de laterales CHIC con guía de extracción total para bandeja","medida":"492 mm","unidad":"ud","historial":[{"eur":59.3,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles"},"WGCESTO60NE":{"cod":"WGCESTO60NE","prov":"BYS","ref":"WGCESTO60NE","nombre":"Cajón gtv élite cesto varillas m60 negro","medida":"","unidad":"ud","historial":[{"eur":53.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":58,"max":63,"familia":"Cajones GTV Élite"},"WGCESTO70NE":{"cod":"WGCESTO70NE","prov":"BYS","ref":"WGCESTO70NE","nombre":"Cajón gtv élite cesto varillas m70 negro","medida":"","unidad":"ud","historial":[{"eur":62.12,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":68,"max":73,"familia":"Cajones GTV Élite"},"WGCESTO80NE":{"cod":"WGCESTO80NE","prov":"BYS","ref":"WGCESTO80NE","nombre":"Cajón gtv élite cesto varillas m80 negro","medida":"","unidad":"ud","historial":[{"eur":64.56,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":78,"max":83,"familia":"Cajones GTV Élite"},"WGCESTO90NE":{"cod":"WGCESTO90NE","prov":"BYS","ref":"WGCESTO90NE","nombre":"Cajón gtv élite cesto varillas m90 negro","medida":"","unidad":"ud","historial":[{"eur":66.79,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":88,"max":93,"familia":"Cajones GTV Élite"},"WGJOYERO60NE":{"cod":"WGJOYERO60NE","prov":"BYS","ref":"WGJOYERO60NE","nombre":"Cajón gtv élite joyero m60 negro","medida":"","unidad":"ud","historial":[{"eur":61.36,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":58,"max":63,"familia":"Cajones GTV Élite"},"WGJOYERO70NE":{"cod":"WGJOYERO70NE","prov":"BYS","ref":"WGJOYERO70NE","nombre":"Cajón gtv élite joyero m70 negro","medida":"","unidad":"ud","historial":[{"eur":68.09,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":68,"max":73,"familia":"Cajones GTV Élite"},"WGJOYERO80NE":{"cod":"WGJOYERO80NE","prov":"BYS","ref":"WGJOYERO80NE","nombre":"Cajón gtv élite joyero m80 negro","medida":"","unidad":"ud","historial":[{"eur":73.08,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":78,"max":83,"familia":"Cajones GTV Élite"},"WGJOYERO90NE":{"cod":"WGJOYERO90NE","prov":"BYS","ref":"WGJOYERO90NE","nombre":"Cajón gtv élite joyero m90 negro","medida":"","unidad":"ud","historial":[{"eur":78.46,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":88,"max":93,"familia":"Cajones GTV Élite"},"WGPANT60NE":{"cod":"WGPANT60NE","prov":"BYS","ref":"WGPANT60NE","nombre":"Cajón gtv élite pantalonero m60 negro","medida":"","unidad":"ud","historial":[{"eur":47.65,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":58,"max":63,"familia":"Cajones GTV Élite"},"WGPANT70NE":{"cod":"WGPANT70NE","prov":"BYS","ref":"WGPANT70NE","nombre":"Cajón gtv élite pantalonero m70 negro","medida":"","unidad":"ud","historial":[{"eur":53.04,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":68,"max":73,"familia":"Cajones GTV Élite"},"WGPANT80NE":{"cod":"WGPANT80NE","prov":"BYS","ref":"WGPANT80NE","nombre":"Cajón gtv élite pantalonero m80 negro","medida":"","unidad":"ud","historial":[{"eur":55.7,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":78,"max":83,"familia":"Cajones GTV Élite"},"WGPANT90NE":{"cod":"WGPANT90NE","prov":"BYS","ref":"WGPANT90NE","nombre":"Cajón gtv élite pantalonero m90 negro","medida":"","unidad":"ud","historial":[{"eur":59.57,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":88,"max":93,"familia":"Cajones GTV Élite"},"WGZAP60NE":{"cod":"WGZAP60NE","prov":"BYS","ref":"WGZAP60NE","nombre":"Cajón gtv élite zapatero m60 negro","medida":"","unidad":"ud","historial":[{"eur":49.06,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":58,"max":63,"familia":"Cajones GTV Élite"},"WGZAP70NE":{"cod":"WGZAP70NE","prov":"BYS","ref":"WGZAP70NE","nombre":"Cajón gtv élite zapatero m70 negro","medida":"","unidad":"ud","historial":[{"eur":55.26,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":68,"max":73,"familia":"Cajones GTV Élite"},"WGZAP80NE":{"cod":"WGZAP80NE","prov":"BYS","ref":"WGZAP80NE","nombre":"Cajón gtv élite zapatero m80 negro","medida":"","unidad":"ud","historial":[{"eur":58.67,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":78,"max":83,"familia":"Cajones GTV Élite"},"WGZAP90NE":{"cod":"WGZAP90NE","prov":"BYS","ref":"WGZAP90NE","nombre":"Cajón gtv élite zapatero m90 negro","medida":"","unidad":"ud","historial":[{"eur":59.43,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":88,"max":93,"familia":"Cajones GTV Élite"},"42050014":{"cod":"42050014","prov":"BYS","ref":"42050014","nombre":"Zapatero extraíble 400/500 mm","medida":"","unidad":"ud","historial":[{"eur":88.28,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":43,"max":53,"familia":"Zapateros"},"42052014":{"cod":"42052014","prov":"BYS","ref":"42052014","nombre":"Zapatero extraíble 500/600 mm","medida":"","unidad":"ud","historial":[{"eur":89.98,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":53,"max":63,"familia":"Zapateros"},"42054014":{"cod":"42054014","prov":"BYS","ref":"42054014","nombre":"Zapatero extraíble 600/700 mm","medida":"","unidad":"ud","historial":[{"eur":91.55,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":63,"max":73,"familia":"Zapateros"},"42056014":{"cod":"42056014","prov":"BYS","ref":"42056014","nombre":"Zapatero extraíble 700/800 mm","medida":"","unidad":"ud","historial":[{"eur":93.4,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":73,"max":83,"familia":"Zapateros"},"42058014":{"cod":"42058014","prov":"BYS","ref":"42058014","nombre":"Zapatero extraíble 800/900 mm","medida":"","unidad":"ud","historial":[{"eur":101.84,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":83,"max":93,"familia":"Zapateros"},"42060014":{"cod":"42060014","prov":"BYS","ref":"42060014","nombre":"Zapatero extraíble 900/1.000 mm","medida":"","unidad":"ud","historial":[{"eur":103.42,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":93,"max":103,"familia":"Zapateros"},"42113014":{"cod":"42113014","prov":"BYS","ref":"42113014","nombre":"Pantalonero extraíble 8 pantalones acero plata","medida":"","unidad":"ud","historial":[{"eur":92.79,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Pantaloneros y faldas"},"42088014":{"cod":"42088014","prov":"BYS","ref":"42088014","nombre":"Pantalonero extraíble 10 pantalones acero plata","medida":"","unidad":"ud","historial":[{"eur":98.78,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Pantaloneros y faldas"},"42110014":{"cod":"42110014","prov":"BYS","ref":"42110014","nombre":"Pantalonero extraíble 12 pantalones acero plata","medida":"","unidad":"ud","historial":[{"eur":109.14,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Pantaloneros y faldas"},"42111014":{"cod":"42111014","prov":"BYS","ref":"42111014","nombre":"Pantalonero extraíble 14 pantalones acero plata","medida":"","unidad":"ud","historial":[{"eur":115.03,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Pantaloneros y faldas"},"42073014":{"cod":"42073014","prov":"BYS","ref":"42073014","nombre":"Soporte perchas extraíble 240 mm","medida":"","unidad":"ud","historial":[{"eur":17.77,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Barras"},"42074014":{"cod":"42074014","prov":"BYS","ref":"42074014","nombre":"Soporte perchas extraíble 290 mm","medida":"","unidad":"ud","historial":[{"eur":18.75,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Barras"},"42075014":{"cod":"42075014","prov":"BYS","ref":"42075014","nombre":"Soporte perchas extraíble 360 mm","medida":"","unidad":"ud","historial":[{"eur":21.31,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Barras"},"42076014":{"cod":"42076014","prov":"BYS","ref":"42076014","nombre":"Soporte perchas extraíble 445 mm","medida":"","unidad":"ud","historial":[{"eur":24.03,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Barras"},"HMU0244560":{"cod":"HMU0244560","prov":"BYS","ref":"HMU0244560","nombre":"Perchero abatible aluminio 45-60 cm plata mate","medida":"","unidad":"ud","historial":[{"eur":29.62,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":48,"max":63,"familia":"Elevadores"},"HMU0246083":{"cod":"HMU0246083","prov":"BYS","ref":"HMU0246083","nombre":"Perchero abatible aluminio 60-83 cm plata mate","medida":"","unidad":"ud","historial":[{"eur":29.62,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":63,"max":86,"familia":"Elevadores"},"HMU02483115":{"cod":"HMU02483115","prov":"BYS","ref":"HMU02483115","nombre":"Perchero abatible aluminio 83-115 cm plata mate","medida":"","unidad":"ud","historial":[{"eur":29.62,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"min":86,"max":118,"familia":"Elevadores"},"42093014":{"cod":"42093014","prov":"BYS","ref":"42093014","nombre":"Espejo extraíble 600h plata","medida":"","unidad":"ud","historial":[{"eur":122.01,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Espejos y colgadores"},"42094014":{"cod":"42094014","prov":"BYS","ref":"42094014","nombre":"Espejo extraíble 1400h plata","medida":"","unidad":"ud","historial":[{"eur":195.23,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Espejos y colgadores"},"EA06523":{"cod":"EA06523","prov":"BYS","ref":"EA06523","nombre":"Espejo extraíble y giratorio para armario 1200x355mm","medida":"","unidad":"ud","historial":[{"eur":51.76,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"familia":"Espejos y colgadores"},"MOKA-BAST":{"cod":"MOKA-BAST","prov":"MUI","ref":"","nombre":"Bastidor Moka con guías de cierre suave, hueco 764-814 mm (Emuca)","medida":"764-814 mm","unidad":"ud","historial":[{"eur":124.79,"fecha":"2026-11-05","prov":"MUI","origen":"web-pvp"}],"familia":"Moka","min":80,"max":85},"MOKA-CAJ775":{"cod":"MOKA-CAJ775","prov":"MUI","ref":"","nombre":"Cajón metálico Moka 775 mm (Emuca)","medida":"775 mm","unidad":"ud","historial":[{"eur":132.23,"fecha":"2026-11-05","prov":"MUI","origen":"web-pvp"}],"familia":"Moka","min":80,"max":85},"MOKA-CESTO":{"cod":"MOKA-CESTO","prov":"MUI","ref":"","nombre":"Cesto de ropa sucia Moka con tapa (Emuca)","medida":"","unidad":"ud","historial":[{"eur":71.9,"fecha":"2026-11-05","prov":"MUI","origen":"web-pvp"}],"familia":"Moka","min":80,"max":85},"MOKA-ZAPBAST":{"cod":"MOKA-ZAPBAST","prov":"MUI","ref":"","nombre":"Cajón zapatero Moka con bastidor de cierre suave (Emuca)","medida":"","unidad":"ud","historial":[{"eur":187.6,"fecha":"2026-11-05","prov":"MUI","origen":"web-pvp"}],"familia":"Juegos","min":80,"max":85},"MOKA-JOYBAST":{"cod":"MOKA-JOYBAST","prov":"MUI","ref":"","nombre":"Kit joyero Moka con bastidor, módulo de 900 (Emuca)","medida":"","unidad":"ud","historial":[{"eur":136.36,"fecha":"2026-11-05","prov":"MUI","origen":"web-pvp"}],"familia":"Juegos","min":88,"max":93},"J-MOKA-CAJ":{"cod":"J-MOKA-CAJ","prov":"MUI","ref":"","nombre":"Juego Moka: bastidor + cajón metálico 775","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"MOKA-BAST","und":1},{"cod":"MOKA-CAJ775","und":1}],"familia":"Juegos","min":80,"max":85},"J-MOKA-CESTO":{"cod":"J-MOKA-CESTO","prov":"MUI","ref":"","nombre":"Juego Moka: bastidor + cesto de ropa","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"MOKA-BAST","und":1},{"cod":"MOKA-CESTO","und":1}],"familia":"Juegos","min":80,"max":85},"J-CHIC60-4050":{"cod":"J-CHIC60-4050","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"400-500 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3007746","und":1}],"familia":"Cajoneras con cristal","min":43,"max":53,"fondoMin":55},"J-CHIC60-5060":{"cod":"J-CHIC60-5060","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"500-600 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3007757","und":1}],"familia":"Cajoneras con cristal","min":53,"max":63,"fondoMin":55},"J-CHIC60-6070":{"cod":"J-CHIC60-6070","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"600-700 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3007768","und":1}],"familia":"Cajoneras con cristal","min":63,"max":73,"fondoMin":55},"J-CHIC60-7080":{"cod":"J-CHIC60-7080","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"700-800 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3007779","und":1}],"familia":"Cajoneras con cristal","min":73,"max":83,"fondoMin":55},"J-CHIC60-8090":{"cod":"J-CHIC60-8090","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"800-900 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3007790","und":1}],"familia":"Cajoneras con cristal","min":83,"max":93,"fondoMin":55},"J-CHIC60-90100":{"cod":"J-CHIC60-90100","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"900-1000 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3007801","und":1}],"familia":"Cajoneras con cristal","min":93,"max":103,"fondoMin":55},"J-CHIC60-100110":{"cod":"J-CHIC60-100110","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"1000-1100 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3008537","und":1}],"familia":"Cajoneras con cristal","min":103,"max":113,"fondoMin":55},"J-CHIC60-110120":{"cod":"J-CHIC60-110120","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 60","medida":"1100-1200 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3006800","und":1},{"cod":"MEN-3008538","und":1}],"familia":"Cajoneras con cristal","min":113,"max":123,"fondoMin":55},"J-CHIC40-4050":{"cod":"J-CHIC40-4050","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"400-500 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3007746","und":1}],"familia":"Cajoneras con cristal","min":43,"max":53,"fondoMin":35,"fondoMax":54},"J-CHIC40-5060":{"cod":"J-CHIC40-5060","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"500-600 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3007757","und":1}],"familia":"Cajoneras con cristal","min":53,"max":63,"fondoMin":35,"fondoMax":54},"J-CHIC40-6070":{"cod":"J-CHIC40-6070","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"600-700 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3007768","und":1}],"familia":"Cajoneras con cristal","min":63,"max":73,"fondoMin":35,"fondoMax":54},"J-CHIC40-7080":{"cod":"J-CHIC40-7080","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"700-800 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3007779","und":1}],"familia":"Cajoneras con cristal","min":73,"max":83,"fondoMin":35,"fondoMax":54},"J-CHIC40-8090":{"cod":"J-CHIC40-8090","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"800-900 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3007790","und":1}],"familia":"Cajoneras con cristal","min":83,"max":93,"fondoMin":35,"fondoMax":54},"J-CHIC40-90100":{"cod":"J-CHIC40-90100","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"900-1000 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3007801","und":1}],"familia":"Cajoneras con cristal","min":93,"max":103,"fondoMin":35,"fondoMax":54},"J-CHIC40-100110":{"cod":"J-CHIC40-100110","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"1000-1100 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3008537","und":1}],"familia":"Cajoneras con cristal","min":103,"max":113,"fondoMin":35,"fondoMax":54},"J-CHIC40-110120":{"cod":"J-CHIC40-110120","prov":"MEN","ref":"","nombre":"Cajonera CHIC con cristal fumé (laterales + cristales), armario de fondo 40","medida":"1100-1200 mm","unidad":"ud","historial":[],"componentes":[{"cod":"MEN-3007966","und":1},{"cod":"MEN-3008538","und":1}],"familia":"Cajoneras con cristal","min":113,"max":123,"fondoMin":35,"fondoMax":54},"MEN-3005766":{"cod":"MEN-3005766","prov":"MEN","ref":"3005766","nombre":"Bandeja extraíble tipo joyero antracita, hueco 464-514 mm","medida":"464-514 mm","unidad":"ud","historial":[{"eur":145.1,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Joyeros","min":49,"max":55,"fondoMin":50},"MEN-3005777":{"cod":"MEN-3005777","prov":"MEN","ref":"3005777","nombre":"Bandeja extraíble tipo joyero antracita, hueco 564-614 mm","medida":"564-614 mm","unidad":"ud","historial":[{"eur":150.13,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Joyeros","min":59,"max":65,"fondoMin":50},"MEN-3005788":{"cod":"MEN-3005788","prov":"MEN","ref":"3005788","nombre":"Bandeja extraíble tipo joyero antracita, hueco 664-714 mm","medida":"664-714 mm","unidad":"ud","historial":[{"eur":155.15,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Joyeros","min":69,"max":75,"fondoMin":50},"MEN-3005799":{"cod":"MEN-3005799","prov":"MEN","ref":"3005799","nombre":"Bandeja extraíble tipo joyero antracita, hueco 764-814 mm","medida":"764-814 mm","unidad":"ud","historial":[{"eur":163.57,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Joyeros","min":79,"max":85,"fondoMin":50},"MEN-3005810":{"cod":"MEN-3005810","prov":"MEN","ref":"3005810","nombre":"Bandeja extraíble tipo joyero antracita, hueco 864-914 mm","medida":"864-914 mm","unidad":"ud","historial":[{"eur":171.94,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Joyeros","min":89,"max":95,"fondoMin":50},"MEN-3005821":{"cod":"MEN-3005821","prov":"MEN","ref":"3005821","nombre":"Bandeja extraíble tipo joyero antracita, hueco 964-1014 mm","medida":"964-1014 mm","unidad":"ud","historial":[{"eur":180.32,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Joyeros","min":99,"max":105,"fondoMin":50},"EMU-QZ-ZAP4":{"cod":"EMU-QZ-ZAP4","prov":"LER","ref":"96472965","nombre":"Zapatero extraíble lateral Emuca Quartz 4 pares","medida":"56,2-58,8 cm","unidad":"ud","historial":[{"eur":78.43,"fecha":"2026-11-06","prov":"LER","origen":"web-pvp"}],"familia":"Zapateros","min":59,"max":62},"EMU-QZ-ZAP8":{"cod":"EMU-QZ-ZAP8","prov":"LER","ref":"96911429","nombre":"Zapatero extraíble lateral Emuca Quartz 8 pares","medida":"76,2-78,8 cm","unidad":"ud","historial":[{"eur":98.35,"fecha":"2026-11-06","prov":"LER","origen":"web-pvp"}],"familia":"Zapateros","min":79,"max":82},"EMU-QZ-ZAP12":{"cod":"EMU-QZ-ZAP12","prov":"LER","ref":"84804240","nombre":"Zapatero extraíble lateral Emuca Quartz 12 pares","medida":"86-89,4 cm","unidad":"ud","historial":[{"eur":91.74,"fecha":"2026-11-06","prov":"LER","origen":"web-pvp"}],"familia":"Zapateros","min":89,"max":93},"EMU-QZ-ORG60":{"cod":"EMU-QZ-ORG60","prov":"LER","ref":"96472983","nombre":"Kit cajón organizador Emuca Quartz con bastidor regulable, módulo 60","medida":"60 cm","unidad":"ud","historial":[{"eur":90.08,"fecha":"2026-11-06","prov":"LER","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":59,"max":62},"EMU-QZ-ORG80":{"cod":"EMU-QZ-ORG80","prov":"LER","ref":"96473184","nombre":"Kit cajón organizador Emuca Quartz con bastidor regulable, módulo 80","medida":"80 cm","unidad":"ud","historial":[{"eur":106.61,"fecha":"2026-11-06","prov":"LER","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":79,"max":82},"EMU-CASTOR-558":{"cod":"EMU-CASTOR-558","prov":"TEL","ref":"","nombre":"Barra Emuca Castor con LED, batería y sensor, regulable 558-708 mm","medida":"","unidad":"ud","historial":[{"eur":32.66,"fecha":"2026-11-06","prov":"TEL","origen":"web-pvp"}],"familia":"Barras con LED","min":59,"max":74},"EMU-CASTOR-708":{"cod":"EMU-CASTOR-708","prov":"CAM","ref":"","nombre":"Barra Emuca Castor con LED, batería y sensor, regulable 708-858 mm","medida":"","unidad":"ud","historial":[{"eur":31.93,"fecha":"2026-11-06","prov":"CAM","origen":"web-pvp"}],"familia":"Barras con LED","min":74,"max":89},"EMU-CASTOR-1008":{"cod":"EMU-CASTOR-1008","prov":"CAM","ref":"","nombre":"Barra Emuca Castor con LED, batería y sensor, regulable 1008-1158 mm","medida":"","unidad":"ud","historial":[{"eur":36.79,"fecha":"2026-11-06","prov":"CAM","origen":"web-pvp"}],"familia":"Barras con LED","min":104,"max":119},"EMU-CESTO-MOKA60":{"cod":"EMU-CESTO-MOKA60","prov":"MAN","ref":"","nombre":"Kit cesto de ropa Emuca con bastidor de guías y bandejas, moka, hueco 564-614 mm","medida":"564-614 mm","unidad":"ud","historial":[{"eur":68.59,"fecha":"2026-11-06","prov":"MAN","origen":"web-pvp"}],"familia":"Cestos de ropa","min":60,"max":65},"PLANCHA-INTOO":{"cod":"PLANCHA-INTOO","prov":"VIV","ref":"NEXO","nombre":"Tabla de planchar extraíble Intoo Nexo (cierre suave, guías sincronizadas)","medida":"","unidad":"ud","historial":[{"eur":125.88,"fecha":"2026-11-06","prov":"VIV","origen":"web-pvp"}],"familia":"Planchado"},"PLANCHA-ALA":{"cod":"PLANCHA-ALA","prov":"ALA","ref":"705.932.077","nombre":"Tabla de planchar extraíble para interior de armario (Alaybe)","medida":"","unidad":"ud","historial":[{"eur":345.87,"fecha":"2026-11-06","prov":"ALA","origen":"web"}],"familia":"Planchado"},"CAJAF-FAC100":{"cod":"CAJAF-FAC100","prov":"NTS","ref":"FAC 100 LL","nombre":"Caja fuerte de empotrar FAC serie 100 con llave","medida":"","unidad":"ud","historial":[{"eur":89.48,"fecha":"2026-11-06","prov":"NTS","origen":"web-pvp"}],"familia":"Seguridad"},"CAJAF-ARREGUI":{"cod":"CAJAF-ARREGUI","prov":"CEF","ref":"Kuro","nombre":"Caja fuerte de empotrar Arregui Kuro con huella dactilar","medida":"","unidad":"ud","historial":[{"eur":96.69,"fecha":"2026-11-06","prov":"CEF","origen":"web-pvp"}],"familia":"Seguridad"},"CAJAF-BTVJADE":{"cod":"CAJAF-BTVJADE","prov":"TCF","ref":"Jade","nombre":"Caja fuerte de empotrar BTV Jade, llave y electrónica","medida":"","unidad":"ud","historial":[{"eur":148.76,"fecha":"2026-11-06","prov":"TCF","origen":"web-pvp"}],"familia":"Seguridad"},"LED-SENSOR-PUERTA":{"cod":"LED-SENSOR-PUERTA","prov":"LUZ","ref":"SM5","nombre":"Sensor de apertura de puertas para LED de armario (puerta simple o doble)","medida":"","unidad":"ud","historial":[{"eur":29.0,"fecha":"2026-11-06","prov":"LUZ","origen":"web-pvp"}],"familia":"Iluminación"},"UNERO-40":{"cod":"UNERO-40","prov":"LER","ref":"16068990","nombre":"Tiradores uñero de embutir 40 mm níquel (2 uds.)","medida":"","unidad":"ud","historial":[{"eur":6.6,"fecha":"2026-11-06","prov":"LER","origen":"web-pvp"}],"familia":"Tiradores y cerraduras"},"CERR-CORR":{"cod":"CERR-CORR","prov":"OBR","ref":"","nombre":"Cerradura de puerta corredera","medida":"","unidad":"ud","historial":[{"eur":12.81,"fecha":"2026-11-06","prov":"OBR","origen":"web"}],"familia":"Tiradores y cerraduras"},"KIT-UNERO-MULET":{"cod":"KIT-UNERO-MULET","prov":"OBR","ref":"","nombre":"Kit uñero + muletilla inox para puerta corredera","medida":"","unidad":"ud","historial":[{"eur":14.0,"fecha":"2026-11-06","prov":"OBR","origen":"web"}],"familia":"Tiradores y cerraduras"},"IKEA-ZAP100":{"cod":"IKEA-ZAP100","prov":"IKE","ref":"","nombre":"KOMPLEMENT estante zapatero extraíble 100x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":33.06,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101,"fondoMin":60},"IKEA-PANT50":{"cod":"IKEA-PANT50","prov":"IKE","ref":"","nombre":"KOMPLEMENT pantalonero extraíble 50x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":28.93,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":49,"max":51,"fondoMin":60},"IKEA-PANT100":{"cod":"IKEA-PANT100","prov":"IKE","ref":"","nombre":"KOMPLEMENT pantalonero extraíble 100x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":37.19,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101,"fondoMin":60},"IKEA-CAJVID100":{"cod":"IKEA-CAJVID100","prov":"IKE","ref":"","nombre":"KOMPLEMENT cajón con frente de vidrio 100x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":41.32,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101,"fondoMin":60},"IKEA-BANDACC50":{"cod":"IKEA-BANDACC50","prov":"IKE","ref":"19249519","nombre":"KOMPLEMENT bandeja extraíble con accesorio de compartimentos 50x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":38.84,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":49,"max":51,"fondoMin":60},"MEN-3005832":{"cod":"MEN-3005832","prov":"MEN","ref":"3005832","nombre":"Cesto extraíble multifunción de cuero antracita, hueco 464-514 mm","medida":"464-514 mm","unidad":"ud","historial":[{"eur":127.37,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":49,"max":55,"fondoMin":50},"MEN-3005843":{"cod":"MEN-3005843","prov":"MEN","ref":"3005843","nombre":"Cesto extraíble multifunción de cuero antracita, hueco 564-614 mm","medida":"564-614 mm","unidad":"ud","historial":[{"eur":136.08,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":59,"max":65,"fondoMin":50},"MEN-3005854":{"cod":"MEN-3005854","prov":"MEN","ref":"3005854","nombre":"Cesto extraíble multifunción de cuero antracita, hueco 664-714 mm","medida":"664-714 mm","unidad":"ud","historial":[{"eur":147.42,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":69,"max":75,"fondoMin":50},"MEN-3005865":{"cod":"MEN-3005865","prov":"MEN","ref":"3005865","nombre":"Cesto extraíble multifunción de cuero antracita, hueco 764-814 mm","medida":"764-814 mm","unidad":"ud","historial":[{"eur":160.52,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":79,"max":85,"fondoMin":50},"MEN-3005876":{"cod":"MEN-3005876","prov":"MEN","ref":"3005876","nombre":"Cesto extraíble multifunción de cuero antracita, hueco 864-914 mm","medida":"864-914 mm","unidad":"ud","historial":[{"eur":175.34,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":89,"max":95,"fondoMin":50},"MEN-3005887":{"cod":"MEN-3005887","prov":"MEN","ref":"3005887","nombre":"Cesto extraíble multifunción de cuero antracita, hueco 964-1014 mm","medida":"964-1014 mm","unidad":"ud","historial":[{"eur":191.91,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":99,"max":105,"fondoMin":50},"MEN-3005700":{"cod":"MEN-3005700","prov":"MEN","ref":"3005700","nombre":"Bandeja extraíble multifunción de cuero con compartimentos antracita, hueco 464-514 mm","medida":"464-514 mm","unidad":"ud","historial":[{"eur":170.1,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores","min":49,"max":55,"fondoMin":50},"MEN-3005711":{"cod":"MEN-3005711","prov":"MEN","ref":"3005711","nombre":"Bandeja extraíble multifunción de cuero con compartimentos antracita, hueco 564-614 mm","medida":"564-614 mm","unidad":"ud","historial":[{"eur":178.81,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores","min":59,"max":65,"fondoMin":50},"MEN-3005722":{"cod":"MEN-3005722","prov":"MEN","ref":"3005722","nombre":"Bandeja extraíble multifunción de cuero con compartimentos antracita, hueco 664-714 mm","medida":"664-714 mm","unidad":"ud","historial":[{"eur":190.15,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores","min":69,"max":75,"fondoMin":50},"MEN-3005733":{"cod":"MEN-3005733","prov":"MEN","ref":"3005733","nombre":"Bandeja extraíble multifunción de cuero con compartimentos antracita, hueco 764-814 mm","medida":"764-814 mm","unidad":"ud","historial":[{"eur":204.97,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores","min":79,"max":85,"fondoMin":50},"MEN-3005744":{"cod":"MEN-3005744","prov":"MEN","ref":"3005744","nombre":"Bandeja extraíble multifunción de cuero con compartimentos antracita, hueco 864-914 mm","medida":"864-914 mm","unidad":"ud","historial":[{"eur":223.3,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores","min":89,"max":95,"fondoMin":50},"MEN-3005755":{"cod":"MEN-3005755","prov":"MEN","ref":"3005755","nombre":"Bandeja extraíble multifunción de cuero con compartimentos antracita, hueco 964-1014 mm","medida":"964-1014 mm","unidad":"ud","historial":[{"eur":244.26,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores","min":99,"max":105,"fondoMin":50},"MEN-3005898":{"cod":"MEN-3005898","prov":"MEN","ref":"3005898","nombre":"Cesto extraíble de alambre antracita, hueco 464-514 mm","medida":"464-514 mm","unidad":"ud","historial":[{"eur":89.84,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":49,"max":55,"fondoMin":50},"MEN-3005909":{"cod":"MEN-3005909","prov":"MEN","ref":"3005909","nombre":"Cesto extraíble de alambre antracita, hueco 564-614 mm","medida":"564-614 mm","unidad":"ud","historial":[{"eur":94.22,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":59,"max":65,"fondoMin":50},"MEN-3005920":{"cod":"MEN-3005920","prov":"MEN","ref":"3005920","nombre":"Cesto extraíble de alambre antracita, hueco 664-714 mm","medida":"664-714 mm","unidad":"ud","historial":[{"eur":101.17,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":69,"max":75,"fondoMin":50},"MEN-3005931":{"cod":"MEN-3005931","prov":"MEN","ref":"3005931","nombre":"Cesto extraíble de alambre antracita, hueco 764-814 mm","medida":"764-814 mm","unidad":"ud","historial":[{"eur":108.17,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":79,"max":85,"fondoMin":50},"MEN-3005942":{"cod":"MEN-3005942","prov":"MEN","ref":"3005942","nombre":"Cesto extraíble de alambre antracita, hueco 864-914 mm","medida":"864-914 mm","unidad":"ud","historial":[{"eur":115.13,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":89,"max":95,"fondoMin":50},"MEN-3005953":{"cod":"MEN-3005953","prov":"MEN","ref":"3005953","nombre":"Cesto extraíble de alambre antracita, hueco 964-1014 mm","medida":"964-1014 mm","unidad":"ud","historial":[{"eur":123.85,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestas extraíbles","min":99,"max":105,"fondoMin":50},"MEN-3005964":{"cod":"MEN-3005964","prov":"MEN","ref":"3005964","nombre":"Zapatero extraíble de alambre antracita, hueco 464-514 mm","medida":"464-514 mm","unidad":"ud","historial":[{"eur":83.87,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":49,"max":55,"fondoMin":50},"MEN-3005975":{"cod":"MEN-3005975","prov":"MEN","ref":"3005975","nombre":"Zapatero extraíble de alambre antracita, hueco 564-614 mm","medida":"564-614 mm","unidad":"ud","historial":[{"eur":91.42,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":59,"max":65,"fondoMin":50},"MEN-3005986":{"cod":"MEN-3005986","prov":"MEN","ref":"3005986","nombre":"Zapatero extraíble de alambre antracita, hueco 664-714 mm","medida":"664-714 mm","unidad":"ud","historial":[{"eur":99.8,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":69,"max":75,"fondoMin":50},"MEN-3005997":{"cod":"MEN-3005997","prov":"MEN","ref":"3005997","nombre":"Zapatero extraíble de alambre antracita, hueco 764-814 mm","medida":"764-814 mm","unidad":"ud","historial":[{"eur":108.22,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":79,"max":85,"fondoMin":50},"MEN-3006008":{"cod":"MEN-3006008","prov":"MEN","ref":"3006008","nombre":"Zapatero extraíble de alambre antracita, hueco 864-914 mm","medida":"864-914 mm","unidad":"ud","historial":[{"eur":116.59,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":89,"max":95,"fondoMin":50},"MEN-3006019":{"cod":"MEN-3006019","prov":"MEN","ref":"3006019","nombre":"Zapatero extraíble de alambre antracita, hueco 964-1014 mm","medida":"964-1014 mm","unidad":"ud","historial":[{"eur":124.96,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":99,"max":105,"fondoMin":50},"MEN-3007218":{"cod":"MEN-3007218","prov":"MEN","ref":"3007218","nombre":"Tolva para ropa CHIC con guías de extracción total, mueble 500-550 mm, fondo 322","medida":"500-550 mm","unidad":"ud","historial":[{"eur":154.02,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestos de ropa","min":53,"max":58,"fondoMin":35,"fondoMax":54},"MEN-3007240":{"cod":"MEN-3007240","prov":"MEN","ref":"3007240","nombre":"Tolva para ropa CHIC con guías de extracción total, mueble 550-600 mm, fondo 322","medida":"550-600 mm","unidad":"ud","historial":[{"eur":154.96,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestos de ropa","min":58,"max":63,"fondoMin":35,"fondoMax":54},"MEN-3008065":{"cod":"MEN-3008065","prov":"MEN","ref":"3008065","nombre":"Tolva para ropa CHIC con guías de extracción total, mueble 500-550 mm, fondo 492","medida":"500-550 mm","unidad":"ud","historial":[{"eur":155.64,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestos de ropa","min":53,"max":58,"fondoMin":55},"MEN-3008087":{"cod":"MEN-3008087","prov":"MEN","ref":"3008087","nombre":"Tolva para ropa CHIC con guías de extracción total, mueble 550-600 mm, fondo 492","medida":"550-600 mm","unidad":"ud","historial":[{"eur":156.59,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Cestos de ropa","min":58,"max":63,"fondoMin":55},"MEN-3007020":{"cod":"MEN-3007020","prov":"MEN","ref":"3007020","nombre":"Zapatero CHIC extraíble lateral 3 bandejas (6 zapatos), alto 650","medida":"","unidad":"ud","historial":[{"eur":132.94,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":30,"fondoMin":55},"MEN-3007042":{"cod":"MEN-3007042","prov":"MEN","ref":"3007042","nombre":"Zapatero CHIC extraíble lateral 5 bandejas (10 zapatos), alto 1200","medida":"","unidad":"ud","historial":[{"eur":189.97,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":30,"fondoMin":55},"MEN-3006228":{"cod":"MEN-3006228","prov":"MEN","ref":"3006228","nombre":"Zapatero giratorio con bandejas antracita, alto 1875-1945, ancho 700","medida":"","unidad":"ud","historial":[{"eur":596.25,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Zapateros","min":73,"fondoMin":40},"MEN-CAJA-TELA":{"cod":"MEN-CAJA-TELA","prov":"MEN","ref":"","nombre":"Caja de tela con tapa antracita (medida pequeña)","medida":"","unidad":"ud","historial":[{"eur":58.2,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores"},"MEN-CAJA-CUERO-COMP":{"cod":"MEN-CAJA-CUERO-COMP","prov":"MEN","ref":"","nombre":"Caja de cuero con compartimentos antracita (medida pequeña)","medida":"","unidad":"ud","historial":[{"eur":50.64,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores"},"MEN-CAJA-RELOJ":{"cod":"MEN-CAJA-RELOJ","prov":"MEN","ref":"","nombre":"Caja relojero de cuero con tapa antracita","medida":"","unidad":"ud","historial":[{"eur":50.64,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores"},"MEN-CAJA-JOYERO":{"cod":"MEN-CAJA-JOYERO","prov":"MEN","ref":"","nombre":"Caja tipo joyero de cuero antracita","medida":"","unidad":"ud","historial":[{"eur":50.64,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Bandejas y organizadores"},"MEN-3901353":{"cod":"MEN-3901353","prov":"MEN","ref":"3901353","nombre":"Maletero: juego de 3 perfiles de apoyo plata mate 2 m (para embutir)","medida":"2 m","unidad":"ud","historial":[{"eur":30.37,"fecha":"2026-11-06","prov":"MEN","origen":"web"}],"familia":"Otros"},"ALA-PANTO-545":{"cod":"ALA-PANTO-545","prov":"ALA","ref":"711.912.70x","nombre":"Barra abatible (pantógrafo) ELITE con gas, regulable 545-700 mm, 12 kg","medida":"545-700 mm","unidad":"ud","historial":[{"eur":34.53,"fecha":"2026-11-06","prov":"ALA","origen":"web"}],"familia":"Elevadores","min":57,"max":73},"ALA-PANTO-645":{"cod":"ALA-PANTO-645","prov":"ALA","ref":"711.912.70x","nombre":"Barra abatible (pantógrafo) ELITE con gas, regulable 645-910 mm, 12 kg","medida":"645-910 mm","unidad":"ud","historial":[{"eur":34.53,"fecha":"2026-11-06","prov":"ALA","origen":"web"}],"familia":"Elevadores","min":67,"max":94},"ALA-PANTO-875":{"cod":"ALA-PANTO-875","prov":"ALA","ref":"711.912.70x","nombre":"Barra abatible (pantógrafo) ELITE con gas, regulable 875-1200 mm, 12 kg","medida":"875-1200 mm","unidad":"ud","historial":[{"eur":34.53,"fecha":"2026-11-06","prov":"ALA","origen":"web"}],"familia":"Elevadores","min":90,"max":123},"EMU-QZ-CAJMET90":{"cod":"EMU-QZ-CAJMET90","prov":"EMU","ref":"","nombre":"Kit cajón metálico Emuca Quartz con bastidor regulable, módulo 90","medida":"","unidad":"ud","historial":[{"eur":123.73,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":89,"max":93,"fondoMin":50},"EMU-QZ-ORG90":{"cod":"EMU-QZ-ORG90","prov":"EMU","ref":"","nombre":"Kit cajón organizador Emuca Quartz con bastidor regulable, módulo 90","medida":"","unidad":"ud","historial":[{"eur":100.18,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":89,"max":93,"fondoMin":50},"EMU-QZ-PANTC80":{"cod":"EMU-QZ-PANTC80","prov":"EMU","ref":"","nombre":"Kit Emuca Quartz pantalonero 7 varillas + cesto + bastidor, módulo 80","medida":"","unidad":"ud","historial":[{"eur":101.27,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":79,"max":82,"fondoMin":50},"EMU-QZ-PANTC90":{"cod":"EMU-QZ-PANTC90","prov":"EMU","ref":"","nombre":"Kit Emuca Quartz pantalonero 7 varillas + cesto + bastidor, módulo 90","medida":"","unidad":"ud","historial":[{"eur":103.63,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":89,"max":93,"fondoMin":50},"EMU-QZ-ZAPK70":{"cod":"EMU-QZ-ZAPK70","prov":"EMU","ref":"","nombre":"Kit cajón zapatero Emuca Quartz con bastidor, módulo 70","medida":"","unidad":"ud","historial":[{"eur":85.57,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Zapateros","min":69,"max":72,"fondoMin":50},"EMU-QZ-ZAPK90":{"cod":"EMU-QZ-ZAPK90","prov":"EMU","ref":"","nombre":"Kit cajón zapatero Emuca Quartz con bastidor, módulo 90","medida":"","unidad":"ud","historial":[{"eur":66.82,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Zapateros","min":89,"max":93,"fondoMin":50},"EMU-MOKA-PANT60":{"cod":"EMU-MOKA-PANT60","prov":"EMU","ref":"","nombre":"Kit pantalonero Emuca Moka 7 varillas con bastidor regulable, módulo 600","medida":"","unidad":"ud","historial":[{"eur":62.17,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":60,"max":65,"fondoMin":50},"EMU-MOKA-PANT80":{"cod":"EMU-MOKA-PANT80","prov":"EMU","ref":"","nombre":"Kit pantalonero Emuca Moka 7 varillas con bastidor regulable, módulo 800","medida":"","unidad":"ud","historial":[{"eur":81.36,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":80,"max":85,"fondoMin":50},"EMU-MOKA-PANT90":{"cod":"EMU-MOKA-PANT90","prov":"EMU","ref":"","nombre":"Kit pantalonero Emuca Moka 7 varillas con bastidor regulable, módulo 900","medida":"","unidad":"ud","historial":[{"eur":70.09,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":90,"max":95,"fondoMin":50},"EMU-HACK-ORG60":{"cod":"EMU-HACK-ORG60","prov":"EMU","ref":"","nombre":"Kit cajón organizador Emuca Hack con bastidor, módulo 600","medida":"","unidad":"ud","historial":[{"eur":101.88,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":60,"max":65,"fondoMin":50},"EMU-HACK-GAV90":{"cod":"EMU-HACK-GAV90","prov":"EMU","ref":"","nombre":"Organizador Emuca Hack con gavetas, hueco 860-894 mm","medida":"860-894 mm","unidad":"ud","historial":[{"eur":128.09,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":89,"max":93,"fondoMin":50},"EMU-HACK-PANT80":{"cod":"EMU-HACK-PANT80","prov":"EMU","ref":"","nombre":"Kit pantalonero Emuca Hack 7 varillas con bastidor, módulo 800","medida":"","unidad":"ud","historial":[{"eur":105.78,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":80,"max":85,"fondoMin":50},"EMU-CASTOR-858":{"cod":"EMU-CASTOR-858","prov":"EMU","ref":"","nombre":"Barra Emuca Castor con LED, batería y sensor, regulable 858-1008 mm","medida":"","unidad":"ud","historial":[{"eur":31.74,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Barras con LED","min":89,"max":104},"EMU-ESPEJO-1000":{"cod":"EMU-ESPEJO-1000","prov":"EMU","ref":"7018025","nombre":"Espejo extraíble y orientable Emuca 340x1000 mm (fondo útil mínimo 380)","medida":"","unidad":"ud","historial":[{"eur":65.82,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Espejos y colgadores","fondoMin":40},"EMU-VTX-45":{"cod":"EMU-VTX-45","prov":"EST","ref":"","nombre":"Kit cajón Emuca Vertex 178 mm con fondo y trasera, módulo 45 (frente aparte)","medida":"","unidad":"ud","historial":[{"eur":46.83,"fecha":"2026-11-06","prov":"EST","origen":"web"}],"familia":"Cajones metálicos (Vertex)","min":45,"max":50,"fondoMin":50},"EMU-VTX-60":{"cod":"EMU-VTX-60","prov":"EST","ref":"","nombre":"Kit cajón Emuca Vertex 178 mm con fondo y trasera, módulo 60 (frente aparte)","medida":"","unidad":"ud","historial":[{"eur":65.71,"fecha":"2026-11-06","prov":"EST","origen":"web"}],"familia":"Cajones metálicos (Vertex)","min":60,"max":65,"fondoMin":50},"EMU-VTX-90":{"cod":"EMU-VTX-90","prov":"EST","ref":"","nombre":"Kit cajón Emuca Vertex 178 mm con fondo y trasera, módulo 90 (frente aparte)","medida":"","unidad":"ud","historial":[{"eur":72.54,"fecha":"2026-11-06","prov":"EST","origen":"web"}],"familia":"Cajones metálicos (Vertex)","min":90,"max":95,"fondoMin":50},"BLUM-TIPON":{"cod":"BLUM-TIPON","prov":"SER","ref":"956.1004","nombre":"Apertura push Blum Tip-On para puerta abatible (sin tirador)","medida":"","unidad":"ud","historial":[{"eur":4.71,"fecha":"2026-11-06","prov":"SER","origen":"web-pvp"}],"familia":"Tiradores y cerraduras"},"SYMO-CORR":{"cod":"SYMO-CORR","prov":"BYS","ref":"23230620","nombre":"Cerradura de sobreponer Häfele SYMO para puerta corredera","medida":"","unidad":"ud","historial":[{"eur":5.3,"fecha":"2026-11-06","prov":"BYS","origen":"web-pvp"}],"familia":"Tiradores y cerraduras"},"CERR-MAG-CAJ4":{"cod":"CERR-MAG-CAJ4","prov":"BYS","ref":"SH1106B","nombre":"Cerraduras magnéticas para cajón (4 uds.)","medida":"","unidad":"ud","historial":[{"eur":6.65,"fecha":"2026-11-06","prov":"BYS","origen":"web-pvp"}],"familia":"Tiradores y cerraduras"},"EMU-USB2":{"cod":"EMU-USB2","prov":"EMU","ref":"","nombre":"Enchufe empotrable Emuca redondo con 2 USB (taladro de 25 mm)","medida":"","unidad":"ud","historial":[{"eur":32.53,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Electricidad"},"TEC-LINE-USB":{"cod":"TEC-LINE-USB","prov":"TEC","ref":"Line","nombre":"Enchufe con doble USB para mueble Tecnoloop Line","medida":"","unidad":"ud","historial":[{"eur":29.0,"fecha":"2026-11-06","prov":"TEC","origen":"web"}],"familia":"Electricidad"},"LED-PERF-BALDA55":{"cod":"LED-PERF-BALDA55","prov":"OBR","ref":"25056848","nombre":"Perfil LED para balda de cristal 55 cm","medida":"55 cm","unidad":"ud","historial":[{"eur":5.37,"fecha":"2026-11-06","prov":"OBR","origen":"web-pvp"}],"familia":"Iluminación"},"LED-PERF-BALDA200":{"cod":"LED-PERF-BALDA200","prov":"OBR","ref":"25056839","nombre":"Perfil LED para balda de cristal 200 cm (cortable)","medida":"200 cm","unidad":"ud","historial":[{"eur":22.31,"fecha":"2026-11-06","prov":"OBR","origen":"web-pvp"}],"familia":"Iluminación"},"EMU-LUXE-900":{"cod":"EMU-LUXE-900","prov":"EMU","ref":"","nombre":"Kit barra Emuca Luxe con LED 24 V, sensor RF y convertidor, 900 mm","medida":"900 mm","unidad":"ud","historial":[{"eur":54.17,"fecha":"2026-11-06","prov":"EMU","origen":"web-pvp"}],"familia":"Barras con LED","min":90,"max":96},"REJILLA-450":{"cod":"REJILLA-450","prov":"VER","ref":"","nombre":"Rejilla de ventilación de aluminio para zócalo 450x70","medida":"","unidad":"ud","historial":[{"eur":5.64,"fecha":"2026-11-06","prov":"VER","origen":"web-pvp"}],"familia":"Otros"},"IKEA-CAJ100":{"cod":"IKEA-CAJ100","prov":"IKE","ref":"","nombre":"KOMPLEMENT cajón 100x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":30.58,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101,"fondoMin":60},"OBR-PANT60":{"cod":"OBR-PANT60","prov":"OBR","ref":"","nombre":"Pantalonero para módulo de 60 (Obramat)","medida":"","unidad":"ud","historial":[{"eur":51.24,"fecha":"2026-11-06","prov":"OBR","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":60,"max":63},"OBR-PANT80":{"cod":"OBR-PANT80","prov":"OBR","ref":"","nombre":"Pantalonero para módulo de 80 (Obramat)","medida":"","unidad":"ud","historial":[{"eur":59.5,"fecha":"2026-11-06","prov":"OBR","origen":"web-pvp"}],"familia":"Pantaloneros y faldas","min":80,"max":83},"OBR-ORG60":{"cod":"OBR-ORG60","prov":"OBR","ref":"","nombre":"Organizador de accesorios para módulo de 60 (Obramat)","medida":"","unidad":"ud","historial":[{"eur":61.98,"fecha":"2026-11-06","prov":"OBR","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":60,"max":63},"OBR-ORG80":{"cod":"OBR-ORG80","prov":"OBR","ref":"","nombre":"Organizador de accesorios para módulo de 80 (Obramat)","medida":"","unidad":"ud","historial":[{"eur":70.25,"fecha":"2026-11-06","prov":"OBR","origen":"web-pvp"}],"familia":"Cajones y organizadores","min":80,"max":83},"J-IKEA-LED46":{"cod":"J-IKEA-LED46","prov":"IKE","ref":"","nombre":"Iluminación IKEA ÖVERSIDAN 46 cm con sensor: tira + driver TRÅDFRI + cable (conjunto completo)","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"IKEA-OVER46","und":1},{"cod":"IKEA-TRADFRI30","und":1},{"cod":"IKEA-FORNIMMA","und":1}],"familia":"IKEA","min":49,"max":73},"IKEA-OVER46-SOLA":{"cod":"IKEA-OVER46-SOLA","prov":"IKE","ref":"","nombre":"Tira ÖVERSIDAN 46 cm adicional (un driver de 30 W alimenta varias, el driver va en otro cuerpo)","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"IKEA-OVER46","und":1}],"familia":"IKEA","min":49,"max":73},"J-IKEA-LED71":{"cod":"J-IKEA-LED71","prov":"IKE","ref":"","nombre":"Iluminación IKEA ÖVERSIDAN 71 cm con sensor: tira + driver TRÅDFRI + cable (conjunto completo)","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"IKEA-OVER71","und":1},{"cod":"IKEA-TRADFRI30","und":1},{"cod":"IKEA-FORNIMMA","und":1}],"familia":"IKEA","min":74,"max":98},"IKEA-OVER71-SOLA":{"cod":"IKEA-OVER71-SOLA","prov":"IKE","ref":"","nombre":"Tira ÖVERSIDAN 71 cm adicional (un driver de 30 W alimenta varias, el driver va en otro cuerpo)","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"IKEA-OVER71","und":1}],"familia":"IKEA","min":74,"max":98},"J-IKEA-LED96":{"cod":"J-IKEA-LED96","prov":"IKE","ref":"","nombre":"Iluminación IKEA ÖVERSIDAN 96 cm con sensor: tira + driver TRÅDFRI + cable (conjunto completo)","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"IKEA-OVER96","und":1},{"cod":"IKEA-TRADFRI30","und":1},{"cod":"IKEA-FORNIMMA","und":1}],"familia":"IKEA","min":99,"max":130},"IKEA-OVER96-SOLA":{"cod":"IKEA-OVER96-SOLA","prov":"IKE","ref":"","nombre":"Tira ÖVERSIDAN 96 cm adicional (un driver de 30 W alimenta varias, el driver va en otro cuerpo)","medida":"","unidad":"ud","historial":[],"componentes":[{"cod":"IKEA-OVER96","und":1}],"familia":"IKEA","min":99,"max":130},"IKEA-STYRBAR":{"cod":"IKEA-STYRBAR","prov":"IKE","ref":"","nombre":"STYRBAR mando a distancia para la iluminación IKEA (opcional)","medida":"","unidad":"ud","historial":[{"eur":8.26,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA"},"IKEA-CESTO100":{"cod":"IKEA-CESTO100","prov":"IKE","ref":"","nombre":"KOMPLEMENT cesto de rejilla con riel extraíble 100x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":14.05,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101,"fondoMin":60},"IKEA-BAND100":{"cod":"IKEA-BAND100","prov":"IKE","ref":"","nombre":"KOMPLEMENT bandeja extraíble 100x58 (taladros tipo PAX)","medida":"","unidad":"ud","historial":[{"eur":28.93,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101,"fondoMin":60},"IKEA-DIV100":{"cod":"IKEA-DIV100","prov":"IKE","ref":"","nombre":"KOMPLEMENT divisor para armario 75-100x58","medida":"","unidad":"ud","historial":[{"eur":28.93,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":74,"max":101,"fondoMin":60},"IKEA-ZAPEST50":{"cod":"IKEA-ZAPEST50","prov":"IKE","ref":"","nombre":"KOMPLEMENT estante para zapatos 50x35","medida":"","unidad":"ud","historial":[{"eur":6.61,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":49,"max":51,"fondoMin":35},"IKEA-BARRA100":{"cod":"IKEA-BARRA100","prov":"IKE","ref":"","nombre":"KOMPLEMENT barra para armario 100 cm","medida":"","unidad":"ud","historial":[{"eur":7.44,"fecha":"2026-11-06","prov":"IKE","origen":"web-pvp"}],"familia":"IKEA","min":99,"max":101}},"sistemas":{"EMU-BL":{"nombre":"Emuca blanco mate (Fermagina)","tipo":"puerta","uso":"armario","guias":[{"cod":"EMU-GUIA2","carriles":2,"largo":200}],"kit":"EMU-KIT16"},"EMU-NE":{"nombre":"Emuca negro mate (Fermagina)","tipo":"puerta","uso":"armario","guias":[{"cod":"EMU-GUIA4NE","carriles":2,"largo":400}],"kit":"EMU-KIT16NE"},"TERRA16-PM":{"nombre":"Terra TR16 plata mate","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520PLATA","carriles":2,"largo":200},{"cod":"KG7530PLATA","carriles":2,"largo":300},{"cod":"KG7540PLATA","carriles":2,"largo":400},{"cod":"308A02300","carriles":3,"largo":300}],"kit":"KPTR16PM260"},"TERRA16-BL":{"nombre":"Terra TR16 blanco brillo","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520BLANCO","carriles":2,"largo":200},{"cod":"KG7530BLANCO","carriles":2,"largo":300},{"cod":"KG7540BLANCO","carriles":2,"largo":400}],"kit":"KPTR16BL260"},"TERRA16-BR":{"nombre":"Terra TR16 bronce","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530BRONCE","carriles":2,"largo":300},{"cod":"KG7540BRONCE","carriles":2,"largo":400}],"kit":"KPTR16BR260"},"TERRA16-OM":{"nombre":"Terra TR16 oro mate","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520OM","carriles":2,"largo":200},{"cod":"KG7530OM","carriles":2,"largo":300}],"kit":"KPTR16OM260"},"TERRAMIN-PM":{"nombre":"Terra TR16 minimalista plata mate","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520PLATA","carriles":2,"largo":200},{"cod":"KG7530PLATA","carriles":2,"largo":300},{"cod":"KG7540PLATA","carriles":2,"largo":400},{"cod":"308A02300","carriles":3,"largo":300}],"kit":"KPTR16MINPM260"},"TERRAMIN-BL":{"nombre":"Terra TR16 minimalista blanco brillo","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520BLANCO","carriles":2,"largo":200},{"cod":"KG7530BLANCO","carriles":2,"largo":300},{"cod":"KG7540BLANCO","carriles":2,"largo":400}],"kit":"KPTR16MINBL260"},"TERRAMIN-BM":{"nombre":"Terra TR16 minimalista blanco mate","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520BM","carriles":2,"largo":200},{"cod":"KG7530BM","carriles":2,"largo":300},{"cod":"KG7540BM","carriles":2,"largo":400}],"kit":"KPTR16MINBM260"},"TERRAMIN-NM":{"nombre":"Terra TR16 minimalista negro mokka","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520NM","carriles":2,"largo":200},{"cod":"KG7530NM","carriles":2,"largo":300},{"cod":"KG7540NM","carriles":2,"largo":400}],"kit":"KPTR16MINNM260"},"TERRAMIN-PABL":{"nombre":"Terra TR16 minimalista papel blanco","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530P84","carriles":2,"largo":300}],"kit":"KPTR16MINPABL260"},"TERRAMIN-CE":{"nombre":"Terra TR16 minimalista cerezo","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530CEREZO","carriles":2,"largo":300}],"kit":"KPTR16MINCE260"},"TERRAMIN-HA":{"nombre":"Terra TR16 minimalista haya","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530HAYA","carriles":2,"largo":300}],"kit":"KPTR16MINHA260"},"TERRAMIN-PI":{"nombre":"Terra TR16 minimalista pino","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530PINO","carriles":2,"largo":300},{"cod":"KG7540PINO","carriles":2,"largo":400}],"kit":"KPTR16MINPI260"},"TERRAMIN-RO":{"nombre":"Terra TR16 minimalista roble","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530ROBLE","carriles":2,"largo":300},{"cod":"KG7540ROBLE","carriles":2,"largo":400}],"kit":"KPTR16MINRO260"},"TERRAMIN-SA":{"nombre":"Terra TR16 minimalista sapelly","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7530SAPELLY","carriles":2,"largo":300},{"cod":"KG7540SAPELLY","carriles":2,"largo":400}],"kit":"KPTR16MINSA260"},"TERRA19-PM":{"nombre":"Terra TR19 plata mate","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520PLATA","carriles":2,"largo":200},{"cod":"KG7530PLATA","carriles":2,"largo":300},{"cod":"KG7540PLATA","carriles":2,"largo":400},{"cod":"308A02300","carriles":3,"largo":300}],"kit":"KPTR19PM260"},"TERRA19-BL":{"nombre":"Terra TR19 blanco brillo","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520BLANCO","carriles":2,"largo":200},{"cod":"KG7530BLANCO","carriles":2,"largo":300},{"cod":"KG7540BLANCO","carriles":2,"largo":400}],"kit":"KPTR19BL260"},"TERRA19-NM":{"nombre":"Terra TR19 negro mokka","tipo":"puerta","uso":"armario","guias":[{"cod":"KG7520NM","carriles":2,"largo":200},{"cod":"KG7530NM","carriles":2,"largo":300},{"cod":"KG7540NM","carriles":2,"largo":400}],"kit":"KPTR19NM260"},"VOLARE-V80":{"nombre":"Volare V80 Adapta colgada","tipo":"hueco","uso":"armario","guias":[{"cod":"V80ACK200","carriles":2,"largo":200},{"cod":"V80ACK300","carriles":2,"largo":300},{"cod":"V80ACK400","carriles":2,"largo":400}],"huecos":[{"cod":"V80A00K2P","hojas":2},{"cod":"V80A00K3P","hojas":3}]},"VOLARE-V60-PM":{"nombre":"Volare V60 Adapta colgada plata (Syskor)","tipo":"hueco","uso":"armario","guias":[{"cod":"V80ACK200","carriles":2,"largo":200},{"cod":"V80ACK300","carriles":2,"largo":300},{"cod":"V80ACK400","carriles":2,"largo":400}],"huecos":[{"cod":"VK60S2A02","hojas":2}]},"VOLARE-V60-NM":{"nombre":"Volare V60 Adapta colgada black mokka (Syskor)","tipo":"hueco","uso":"armario","guias":[{"cod":"V80AMK200","carriles":2,"largo":200},{"cod":"V80AMK300","carriles":2,"largo":300},{"cod":"V80AMK400","carriles":2,"largo":400}],"huecos":[{"cod":"VK60A2AM9","hojas":2}]},"MURANO":{"nombre":"Murano Inline coplanar (Syskor)","tipo":"hueco","uso":"armario","guias":[],"huecos":[{"cod":"MIL001600","hojas":2,"anchoMax":160},{"cod":"MIL001800","hojas":2,"anchoMax":180},{"cod":"MIL002000","hojas":2,"anchoMax":200},{"cod":"MIL002200","hojas":2,"anchoMax":220},{"cod":"MIL002400","hojas":2,"anchoMax":240},{"cod":"MIL002600","hojas":2,"anchoMax":260},{"cod":"MIL002800","hojas":2,"anchoMax":280}]},"SENSUS40":{"nombre":"Klein Sensus 40 kg","tipo":"puerta","uso":"paso","guias":[{"cod":"SENSUS3793","carriles":1,"largo":300}],"kit":"SENSUS3779"},"SENSUS80":{"nombre":"Klein Sensus 80 kg","tipo":"puerta","uso":"paso","guias":[{"cod":"SENSUS3863","carriles":1,"largo":300}],"kit":"SENSUS3823"},"K40":{"nombre":"Klein K40","tipo":"puerta","uso":"paso","guias":[{"cod":"K40873M3","carriles":1,"largo":300}],"kit":"K40852"},"K75":{"nombre":"Klein K75","tipo":"puerta","uso":"paso","guias":[{"cod":"K40873M3","carriles":1,"largo":300}],"kit":"K75862"},"NK50":{"nombre":"Klein NK50","tipo":"puerta","uso":"paso","guias":[{"cod":"NK452019","carriles":1,"largo":300}],"kit":"NK503450"},"NK80":{"nombre":"Klein NK80","tipo":"puerta","uso":"paso","guias":[{"cod":"NK802013","carriles":1,"largo":300}],"kit":"NK80858"}},"gamas":{"basica":{"barra":"BARRA-OVAL","bisagra":"40800412","cajon":"CAJON-B"},"media":{"barra":"BARRA-RECT","bisagra":"40800406","cajon":"CAJON-M"},"alta":{"barra":"BARRA-LED","bisagra":"BISAGRA-A","cajon":"CAJON-GTV"}},"traseras":{"dm3":"DM3","tablero10":"TABLERO10"},"canto":"CANTO22","soporte":"SOPORTE","kitDefecto":{"kit":"EMU-KIT16","guia":"EMU-GUIA2"},"taller":{"eur_h":21,"tramo":4,"cuerpo":5,"estante":0.5,"cajon":1,"abatible":0.75,"corredera":1.5,"paso":1.5,"plegable":1,"escamoteable":1.5,"interior":1,"division":0.5},"desperdicio":15,"colocacion":{"armario":90,"vestidor":95,"solo_puertas":60,"led":25,"puerta_paso":90,"solo_interior":50},"recargoProv":{"FER":10},"plegable":{"carril":"40931605","largo":250,"juegoIzq":"40936040","juegoDer":"40936041","anchoMax":60},"escamoteable":{"altoMax":150,"kits":[{"cod":"40825007","guia":340,"retrae":230},{"cod":"40825008","guia":408,"retrae":294},{"cod":"40825009","guia":440,"retrae":326},{"cod":"40825010","guia":504,"retrae":390},{"cod":"40825011","guia":536,"retrae":422},{"cod":"40825012","guia":600,"retrae":486}],"kitAlto":{"cod":"40825004","guia":536,"retrae":422,"altoMax":230}},"led":{"tira":"LED-TIRA","fuente3":"LED-F3","fuente6":"LED-F6"},"cristal":{"cod":"CRISTAL8","soporte":"SOP-CRIS","horas":0.25},"referencia":{"eur_m":540,"eur_cajon":50},"version":4};

  root.ARM = ARM;
  if (typeof module !== 'undefined' && module.exports) module.exports = ARM;
})(typeof window !== 'undefined' ? window : globalThis);
