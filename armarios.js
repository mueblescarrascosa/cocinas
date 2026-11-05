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
  ARM.render = function (g) { return '<div class="arm-wrap" id="arm' + g.id + '"></div>'; };

  // Tabla de precios inicial (la genera `construir.py armarios`). La de la nube/dispositivo es `armarios_v1`.
  ARM.TABLA_INICIAL = {"materiales":{"ROBLE16":{"cod":"ROBLE16","prov":"MOR","ref":"0200306505","nombre":"Plastificado roble 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"factura"}]},"BLANCO16":{"cod":"BLANCO16","prov":"MOR","ref":"","nombre":"Melamina blanco liso 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"TEXTIL16":{"cod":"TEXTIL16","prov":"MOR","ref":"","nombre":"Melamina textil 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":9.89,"fecha":"2025-07-16","prov":"MOR","origen":"estimado"}]},"DM16":{"cod":"DM16","prov":"MOR","ref":"0200408016","nombre":"DM (fibra) 16 mm","medida":"280x207","unidad":"m2","historial":[{"eur":7.14,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM19":{"cod":"DM19","prov":"MOR","ref":"","nombre":"DM (fibra) 19 mm","medida":"280x207","unidad":"m2","historial":[{"eur":8.48,"fecha":"2025-07-09","prov":"MOR","origen":"factura"}]},"DM3":{"cod":"DM3","prov":"MOR","ref":"","nombre":"DM 3 mm para trasera","medida":"244x122","unidad":"m2","historial":[{"eur":3.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]},"TABLERO10":{"cod":"TABLERO10","prov":"MOR","ref":"","nombre":"Tablero 10 mm para trasera","medida":"280x207","unidad":"m2","historial":[{"eur":7.5,"fecha":"2026-11-05","prov":"MOR","origen":"estimado"}]}},"cantos":{"CANTO22":{"cod":"CANTO22","prov":"REI","ref":"2110","nombre":"Canto PVC 22x1 mm","medida":"","unidad":"m","historial":[{"eur":0.288,"fecha":"2023-01-25","prov":"REI","origen":"factura"}]}},"kits":{"EMU-KIT16":{"cod":"EMU-KIT16","prov":"FER","ref":"21000278","nombre":"Kit puerta corredera 16 mm blanco mate 2,6 m (Emuca)","medida":"2,6 m","unidad":"ud","historial":[{"eur":26.01,"fecha":"2025-11-28","prov":"FER","origen":"factura"}],"solape":3},"EMU-GUIA2":{"cod":"EMU-GUIA2","prov":"FER","ref":"21000256","nombre":"Kit guía corredera blanco mate 2 m (Emuca)","medida":"2 m","unidad":"ud","historial":[{"eur":26.21,"fecha":"2025-11-28","prov":"FER","origen":"factura"}],"largo":200},"TERRA-TR16":{"cod":"TERRA-TR16","prov":"BYS","ref":"","nombre":"Kit puerta Terra TR16 16 mm (Syskor)","medida":"","unidad":"ud","historial":[{"eur":39.9,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"solape":3},"TERRA-KG75":{"cod":"TERRA-KG75","prov":"BYS","ref":"","nombre":"Kit guías Terra KG75 (Syskor)","medida":"","unidad":"ud","historial":[{"eur":27.88,"fecha":"2026-11-05","prov":"BYS","origen":"web"}],"largo":200},"ATL-RT16":{"cod":"ATL-RT16","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT16","medida":"","unidad":"ud","historial":[{"eur":45.89,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3},"ATL-GUIA2":{"cod":"ATL-GUIA2","prov":"MEN","ref":"3921284","nombre":"Kit guías Atlántico 2 carriles 2 m plata","medida":"2 m","unidad":"ud","historial":[{"eur":34.09,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"largo":200},"ATL-RT10":{"cod":"ATL-RT10","prov":"MEN","ref":"","nombre":"Kit perfiles Atlántico RT10 (panel 10 mm, espejo o cristal)","medida":"","unidad":"ud","historial":[{"eur":47.86,"fecha":"2026-11-05","prov":"MEN","origen":"web"}],"solape":3}},"perfiles":{},"hojas":{"HOJA-LAC":{"cod":"HOJA-LAC","prov":"BRI","ref":"","nombre":"Hoja lacada a medida (media de grupos de cocina)","medida":"","unidad":"m2","historial":[{"eur":110.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}]},"HOJA-LAM":{"cod":"HOJA-LAM","prov":"BRI","ref":"","nombre":"Hoja laminada a medida","medida":"","unidad":"m2","historial":[{"eur":60.0,"fecha":"2026-11-05","prov":"BRI","origen":"estimado"}]}},"paneles":{"ESPEJO4":{"cod":"ESPEJO4","prov":"SAL","ref":"","nombre":"Espejo plata 4 mm","medida":"","unidad":"m2","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]},"CRISTAL4":{"cod":"CRISTAL4","prov":"SAL","ref":"","nombre":"Cristal 4 mm","medida":"","unidad":"m2","historial":[{"eur":30.0,"fecha":"2026-11-05","prov":"SAL","origen":"estimado"}]}},"herrajes":{"SOPORTE":{"cod":"SOPORTE","prov":"BYS","ref":"","nombre":"Soporte de estante","medida":"","unidad":"ud","historial":[{"eur":0.25,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-B":{"cod":"BARRA-B","prov":"BYS","ref":"","nombre":"Barra oval cromada con soportes","medida":"","unidad":"m","historial":[{"eur":8.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-M":{"cod":"BARRA-M","prov":"BYS","ref":"","nombre":"Barra de aluminio ovalada con soportes","medida":"","unidad":"m","historial":[{"eur":12.0,"fecha":"2026-11-05","prov":"BYS","origen":"estimado"}]},"BARRA-A":{"cod":"BARRA-A","prov":"MEN","ref":"","nombre":"Barra de aluminio con LED","medida":"","unidad":"m","historial":[{"eur":35.0,"fecha":"2026-11-05","prov":"MEN","origen":"estimado"}]},"BISAGRA-B":{"cod":"BISAGRA-B","prov":"FER","ref":"","nombre":"Bisagra normal","medida":"","unidad":"ud","historial":[{"eur":1.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-M":{"cod":"BISAGRA-M","prov":"FER","ref":"","nombre":"Bisagra con freno","medida":"","unidad":"ud","historial":[{"eur":2.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"BISAGRA-A":{"cod":"BISAGRA-A","prov":"FER","ref":"","nombre":"Bisagra con freno gama alta (Blum)","medida":"","unidad":"ud","historial":[{"eur":4.5,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-B":{"cod":"CAJON-B","prov":"FER","ref":"","nombre":"Cajón interior con guía de bolas (material)","medida":"","unidad":"ud","historial":[{"eur":20.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-M":{"cod":"CAJON-M","prov":"FER","ref":"","nombre":"Cajón interior con guía oculta y freno","medida":"","unidad":"ud","historial":[{"eur":32.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]},"CAJON-A":{"cod":"CAJON-A","prov":"FER","ref":"","nombre":"Cajón interior de doble pared con freno","medida":"","unidad":"ud","historial":[{"eur":55.0,"fecha":"2026-11-05","prov":"FER","origen":"estimado"}]}},"interior":{},"gamas":{"basica":{"barra":"BARRA-B","bisagra":"BISAGRA-B","cajon":"CAJON-B"},"media":{"barra":"BARRA-M","bisagra":"BISAGRA-M","cajon":"CAJON-M"},"alta":{"barra":"BARRA-A","bisagra":"BISAGRA-A","cajon":"CAJON-A"}},"traseras":{"dm3":"DM3","tablero10":"TABLERO10"},"canto":"CANTO22","soporte":"SOPORTE","kitDefecto":{"kit":"EMU-KIT16","guia":"EMU-GUIA2"},"taller":{"eur_h":21,"tramo":4,"cuerpo":5,"estante":0.5,"cajon":1,"abatible":0.75,"corredera":1.5},"desperdicio":15,"colocacion":{"armario":90,"vestidor":70,"solo_puertas":60},"referencia":{"eur_m":540,"eur_cajon":50},"version":1};

  root.ARM = ARM;
  if (typeof module !== 'undefined' && module.exports) module.exports = ARM;
})(typeof window !== 'undefined' ? window : globalThis);
