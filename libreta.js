// Libreta Taller → presupuesto. La Libreta (misma web) deja la cocina o el vestidor medidos en
// localStorage 'libreta_a_presupuesto' y abre esta app; aquí se pregunta y se crea un presupuesto NUEVO en borrador.
// Todo lo que entra es editable como si se hubiera metido a mano. Lo que no casa con el catálogo (tipo, modelo o medida
// que no existen) no se inventa: va al grupo «Revisar (de la libreta)» como texto, para elegirlo a mano.
(function () {
  var CLAVE = 'libreta_a_presupuesto', MAX_EDAD = 60 * 60 * 1000;

  // ¿Existe en el catálogo? (tipo, modelo y medida tal cual)
  function enCatalogo(l) {
    var t = (typeof CAT_MODULES !== 'undefined') && CAT_MODULES[l.m];
    return !!(t && t[l.mo] && t[l.mo].indexOf(String(l.med)) >= 0);
  }
  // Medida más cercana que sí exista para ese tipo y modelo (para la nota de «revisar»).
  function cercana(l) {
    var t = (typeof CAT_MODULES !== 'undefined') && CAT_MODULES[l.m], ms = t && t[l.mo];
    if (!ms || !ms.length) return null;
    var n = parseFloat(l.med), d = Math.min.apply(null, ms.map(function (x) { return Math.abs(parseFloat(x) - n); }));
    return ms.filter(function (x) { return Math.abs(parseFloat(x) - n) === d; }).join(' o ');
  }

  // Construye los grupos del presupuesto a partir del paquete de la libreta.
  function grupos(p) {
    var out = [], revisar = [], ci = 0;
    var color = function () { return (ci++) % (typeof GCOLS !== 'undefined' ? GCOLS.length : 8); };
    (p.grupos || []).forEach(function (g) {
      if (g.tipo === 'muebles') {
        var cal = (typeof CALS !== 'undefined' && CALS.indexOf(g.cal) >= 0) ? g.cal : (typeof CALS !== 'undefined' ? CALS[1] : 'BÁSICO');
        var casco = cascoNuevo();
        if (g.casco && typeof CASCO_ACABADOS !== 'undefined' && CASCO_ACABADOS.indexOf(g.casco) >= 0) casco.acab = g.casco;
        var lines = [];
        (g.lineas || []).forEach(function (l) {
          if (enCatalogo(l)) lines.push({ id: nid(), m: l.m, mo: l.mo, med: String(l.med), und: l.und || 1, extras: [] });
          else {
            var c = cercana(l);
            revisar.push('⚠ ' + (l.texto || (l.m + ' ' + l.mo + ' ' + l.med)) + ': no está en el catálogo' + (c ? ' (la más cercana: ' + l.m + ' ' + l.mo + ' ' + c + ')' : ''));
          }
        });
        if (lines.length) out.push({ id: nid(), name: g.nombre, tipo: 'muebles', cal: cal, ci: color(), lines: lines, open: true, casco: casco, herr: herrNuevo() });
      } else if (g.tipo === 'armario' && window.ARM) {
        var lines2 = (g.tramos || []).map(function (t) {
          var l = ARM.lineaNueva('vestidor'), a = l.arm;
          a.nombre = t.nombre || '';
          if (t.ancho) a.ancho = t.ancho;
          if (t.alto) a.alto = t.alto;
          if (t.cuerpos && t.cuerpos.length) a.cuerpos = t.cuerpos.map(function (c) { return { ancho: c.ancho, estantes: c.estantes || 0, maletero: false, barra: c.barra || 0, cajones: c.cajones || 0, extras: [] }; });
          if (t.puertas) a.puertas.tipo = t.puertas;
          return l;
        });
        if (lines2.length) out.push({ id: nid(), name: g.nombre, tipo: 'armario', cal: '', ci: color(), lines: lines2, open: true });
      } else if (g.tipo === 'revisar') {
        (g.lineas || []).forEach(function (t) { revisar.push(t); });
      }
    });
    if (revisar.length) out.push({ id: nid(), name: 'Revisar (de la libreta)', tipo: 'libre', cal: 'ENTRADA', ci: color(),
      lines: revisar.map(function (t) { return { id: nid(), m: t, mo: '', med: '—', und: 1, precio: 0, extras: [], dif: 0 }; }), open: true, casco: cascoNuevo(), herr: herrNuevo() });
    return out;
  }

  function importar(p) {
    var ok = confirm('Crear un presupuesto nuevo con ' + (p.titulo || 'lo medido en la libreta') + '?\n\n'
      + (p.resumen || '') + '\n\nLo que tengas abierto ahora se cierra: guárdalo antes si no lo está.');
    if (!ok) return false;
    ST.groups = grupos(p);
    ST.proyectoActual = null; ST.curNum = null; ST.estado = 'borrador'; ST.fechaEnvio = null; ST.fechaAceptado = null; ST.opcionDe = null; ST.bloqueado = false; ST.fzInst = null;
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

  // Espera a que arranque la app (se carga después de bajar los datos de la nube) y mira si hay algo de la libreta.
  var intentos = 0;
  (function esperar() {
    if (typeof renderGroups !== 'function' || typeof ST === 'undefined' || typeof CAT_MODULES === 'undefined' || typeof nid !== 'function') {
      if (++intentos < 60) setTimeout(esperar, 300);
      return;
    }
    var p = null;
    try { p = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {}
    if (!p) return;
    // Se quita siempre (se haga o no): solo se ofrece una vez.
    try { localStorage.removeItem(CLAVE); } catch (e) {}
    if (!p.creado || Date.now() - Date.parse(p.creado) > MAX_EDAD) return;
    setTimeout(function () { importar(p); }, 400);
  })();

  window.LIBRETA = { grupos: grupos, importar: importar, enCatalogo: enCatalogo };
})();
