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

  root.ARM = ARM;
  if (typeof module !== 'undefined' && module.exports) module.exports = ARM;
})(typeof window !== 'undefined' ? window : globalThis);
