// Guía de colores (v159). Con el suelo, la cocina y lo que quiere el cliente propone tres combinaciones de frentes,
// encimera y tirador con los colores que se venden, sin pasar del grupo de precio del presupuesto, y la elegida se
// guarda en el presupuesto (sale en el PDF para el cliente y en la ficha de taller).
//  · Frentes: tarifas de Briforma, Monpuertas y Dossia, y la laca propia en cualquier NCS o RAL (selección + código).
//    Cada serie va enlazada a su modelo de MODELOS_GRUPOS para saber su grupo (1 ECONÓMICO … 8 EXCLUSIVO).
//  · Encimeras: laminado Egger (Briforma), cuarzo, porcelánico, granito y mármol, compacto y madera.
//  · Tiradores: vistos (plata, negro, antracita, blanco, oro, bronce, madera), integrados, gola y uñero.
// Los tonos son orientativos (puestos a mano o calculados del código): en «Mis colores» se corrigen, quitan o añaden.
// Lo que se recuerda va en localStorage 'guia_colores_v1' (sincronizado); la elegida, en el presupuesto (ST.colores).
(function () {
  'use strict';
  var CLAVE = 'guia_colores_v1';
  var F = 'frente', E = 'encimera', T = 'tirador';
  var BASE = [];
  // Una serie: mismo fabricante, material y modelo del catálogo; cada color [id, nombre, familia, tono 1-3, temp c/n/f, hex, modelo propio].
  function serie(fab, nombreSerie, mat, uso, mod, colores, extra) {
    colores.forEach(function (x) {
      BASE.push(Object.assign({ id: x[0], nombre: x[1], fab: fab, serie: nombreSerie, mat: mat, uso: uso, mod: x[6] || mod, fam: x[2], tono: x[3], temp: x[4], hex: x[5] }, extra || {}));
    });
  }
  // ── Briforma · laminados ──
  serie('Briforma', 'Suiza', 'Laminado', F, 'SUIZA (G-35)', [['bf-suiza-blanco', 'Blanco', 'blanco', 1, 'n', '#f4f3ef'], ['bf-suiza-trufa', 'Roble trufa', 'madera_media', 2, 'n', '#8f7a66'],
    ['bf-suiza-natural', 'Roble natural', 'madera_clara', 1, 'c', '#c9a77c'], ['bf-suiza-luna', 'Gris luna', 'gris_claro', 1, 'f', '#c9cbcb']]);
  serie('Briforma', 'Austria', 'Laminado', F, 'AUSTRIA (G-35)', [['bf-austria-amundsen', 'Roble Amundsen', 'madera_clara', 1, 'c', '#c7a985'], ['bf-austria-antracita', 'Antracita', 'oscuro', 3, 'f', '#3c3f42'],
    ['bf-austria-mallado', 'Roble mallado', 'madera_media', 2, 'c', '#a07f5c']]);
  serie('Briforma', 'Roma', 'Laminado', F, 'ROMA (G-31)', [['bf-roma-glacial', 'Azul glacial', 'azul', 1, 'f', '#a9bccb'], ['bf-roma-beige', 'Beige', 'crema', 1, 'c', '#d9cbb3'],
    ['bf-roma-caramelo', 'Caramelo', 'terracota', 2, 'c', '#b98a5e'], ['bf-roma-oleo', 'Verde óleo', 'verde', 2, 'n', '#6f7a5c'], ['bf-roma-miel', 'Roble miel', 'madera_media', 2, 'c', '#b88a55'],
    ['bf-roma-bolnat', 'Bolívar natural', 'madera_media', 2, 'c', '#9c7553'], ['bf-roma-bolcas', 'Bolívar castaño', 'madera_oscura', 3, 'c', '#5e4331']]);
  serie('Briforma', 'Boston', 'Laminado', F, 'BOSTON (G-31)', [['bf-boston-nebraska', 'Roble Nebraska', 'madera_media', 2, 'c', '#b08d68'], ['bf-boston-artico', 'Gris ártico', 'gris_claro', 1, 'f', '#d3d6d6']]);
  serie('Briforma', 'Alabama', 'Laminado', F, 'ALABAMA (G-31)', [['bf-alabama-blanco', 'Blanco premium', 'blanco', 1, 'n', '#f6f5f1'], ['bf-alabama-coco', 'Coco', 'crema', 1, 'c', '#cfc3b0'],
    ['bf-alabama-piedra', 'Gris piedra', 'gris', 2, 'n', '#8e8b84'], ['bf-alabama-arcilla', 'Arcilla', 'terracota', 2, 'c', '#b98f78'], ['bf-alabama-mineral', 'Verde mineral', 'verde', 2, 'f', '#7f8f84'],
    ['bf-alabama-hamilton', 'Roble Hamilton', 'madera_media', 2, 'c', '#a98462']]);
  serie('Briforma', 'Toronto', 'Laminado', F, 'TORONTO (G-40)', [['bf-toronto-cemento', 'Cemento claro', 'gris', 2, 'n', '#a8a6a0'], ['bf-toronto-tiza', 'Tiza', 'crema', 1, 'c', '#e7e2d8']]);
  serie('Briforma', 'Petra', 'Laminado', F, 'PETRA (G-40)', [['bf-petra-marmol', 'Mármol blanco', 'marmol', 1, 'f', '#ecebe8'], ['bf-petra-pizarra', 'Pizarra', 'oscuro', 3, 'f', '#45474a']]);
  serie('Briforma', 'Canadá', 'Laminado', F, 'CANADÁ (G-40)', [['bf-canada-nudos', 'Roble nudos', 'madera_media', 2, 'c', '#b18e69'], ['bf-canada-eucalipto', 'Eucalipto', 'madera_clara', 1, 'n', '#bfae98'],
    ['bf-canada-gris', 'Roble gris', 'madera_media', 2, 'f', '#8f8a82']]);
  serie('Briforma', 'Jaén', 'Laminado', F, 'JAÉN (G-31)', [['bf-jaen-roble', 'Roble', 'madera_media', 2, 'c', '#ad8a64'], ['bf-jaen-nogal', 'Nogal', 'madera_oscura', 3, 'c', '#6b4c36']]);
  serie('Briforma', 'Sil (poro sincronizado)', 'Laminado', F, 'SIL (G-45)', [['bf-sil-halifax', 'Halifax natural', 'madera_media', 2, 'c', '#a7845f'], ['bf-sil-tabaco', 'Halifax tabaco', 'madera_oscura', 3, 'c', '#6a4b33'],
    ['bf-sil-blanco', 'Blanco premium', 'blanco', 1, 'n', '#f6f5f1'], ['bf-sil-casella', 'Casella natural', 'madera_clara', 1, 'c', '#c3a27c'], ['bf-sil-casnogal', 'Casella nogal', 'madera_oscura', 3, 'c', '#6f5038']]);
  serie('Briforma', 'Berlín (uñero integrado)', 'Laminado', F, 'BERLÍN Uñero Integrado VETH (G-54)', [['bf-berlin-natural', 'Natural', 'madera_clara', 1, 'c', '#c4a37f'], ['bf-berlin-tabaco', 'Tabaco', 'madera_oscura', 3, 'c', '#6b4c35'],
    ['bf-berlin-conac', 'Coñac', 'madera_media', 2, 'c', '#93633f'], ['bf-berlin-blanco', 'Blanco', 'blanco', 1, 'n', '#f4f3ef']], { unero: true });
  serie('Briforma', 'Luxemburgo (supermate antihuella)', 'Laminado', F, 'LUXEMBURGO (G-23)', [['bf-lux-blanco', 'Blanco', 'blanco', 1, 'n', '#f3f3f1'], ['bf-lux-grisclaro', 'Gris claro', 'gris_claro', 1, 'n', '#cfcfcc'],
    ['bf-lux-aguamarina', 'Aguamarina', 'azul', 2, 'f', '#8fb3ad'], ['bf-lux-negro', 'Negro', 'negro', 3, 'n', '#222324'], ['bf-lux-forest', 'Forest', 'verde', 3, 'f', '#2f4a3e']], { antihuella: true });
  serie('Briforma', 'Miño (estratificado brillo)', 'Laminado', F, 'MIÑO COLOR (G-26)', [['bf-mino-blanco', 'Blanco brillo', 'blanco', 1, 'f', '#f7f7f7', 'MIÑO BLANCO (G-04)'], ['bf-mino-perla', 'Gris perla brillo', 'gris_claro', 1, 'f', '#cdcccb']], { brillo: true });
  serie('Briforma', 'Lugo (estratificado mate)', 'Laminado', F, 'LUGO (G-04)', [['bf-lugo-blanco', 'Blanco mate', 'blanco', 1, 'n', '#f2f2ef'], ['bf-lugo-perla', 'Gris perla mate', 'gris_claro', 1, 'n', '#cbc9c5']]);
  serie('Briforma', 'Materia (ultramate antihuella)', 'Laminado', F, 'MATERIA (G-54)', [['bf-materia-aura', 'Blanco Aura', 'blanco', 1, 'n', '#f1f0ec'], ['bf-materia-alba', 'Alba', 'crema', 1, 'c', '#e8e2d6'],
    ['bf-materia-serena', 'Serena', 'gris_claro', 1, 'c', '#cbc4b8'], ['bf-materia-taupe', 'Taupe', 'gris', 2, 'c', '#8f8476'], ['bf-materia-plomo', 'Plomo', 'gris', 2, 'f', '#6f7275'],
    ['bf-materia-carbon', 'Carbón', 'negro', 3, 'n', '#2b2b2c']], { antihuella: true });
  serie('Briforma', 'Sidney (PET)', 'PET', F, 'SIDNEY COLOR (G-26)', [['bf-sidney-blanco', 'Blanco mate', 'blanco', 1, 'n', '#f3f3f1', 'SIDNEY BLANCO (G-22)'], ['bf-sidney-coco', 'Coco mate', 'crema', 1, 'c', '#cdc1ad'],
    ['bf-sidney-grisosc', 'Gris oscuro mate', 'oscuro', 3, 'n', '#4a4b4c'], ['bf-sidney-cacao', 'Cacao', 'madera_oscura', 3, 'c', '#5b4436'], ['bf-sidney-latte', 'Café latte', 'crema', 2, 'c', '#b9a58c'],
    ['bf-sidney-liquen', 'Verde liquen', 'verde', 2, 'n', '#8e9478'], ['bf-sidney-terra', 'Terra', 'terracota', 2, 'c', '#a8735a'], ['bf-sidney-ceniza', 'Ceniza', 'gris', 2, 'n', '#9a9690'],
    ['bf-sidney-negro', 'Negro mate', 'negro', 3, 'n', '#232323']], { antihuella: true });
  // ── Monpuertas ──
  serie('Monpuertas', 'Laminado', 'Laminado', F, 'BERNA', [['mp-lam-blanco', 'Blanco 3091', 'blanco', 1, 'n', '#f3f2ee'], ['mp-lam-pergamon', 'Pergamon R0810', 'crema', 1, 'c', '#e4dccb'],
    ['mp-lam-antracita', 'Antracita R0806', 'oscuro', 3, 'f', '#3d4043'], ['mp-lam-negro', 'Negro R0805', 'negro', 3, 'n', '#232323']]);
  serie('Monpuertas', 'Laminado antihuella', 'Laminado', F, 'LANZAROTE', [['mp-ant-blanco', 'Blanco R1001', 'blanco', 1, 'n', '#f1f0ed'], ['mp-ant-negro', 'Negro R1004', 'negro', 3, 'n', '#242424'],
    ['mp-ant-antracita', 'Antracita R1006', 'oscuro', 3, 'f', '#3b3e41'], ['mp-ant-piedra', 'Gris piedra R1008', 'gris', 2, 'n', '#8b8881'], ['mp-ant-plomo', 'Plomo R1015', 'gris', 2, 'f', '#6c6f72'],
    ['mp-ant-tierra', 'Tierra R1018', 'terracota', 2, 'c', '#9b7a63'], ['mp-ant-verdehumo', 'Verde humo R1019', 'verde', 2, 'f', '#7d877e']], { antihuella: true });
  serie('Monpuertas', 'Laca (color G1)', 'Laca', F, 'BAHIA GRUPO 1 MATE', [['mp-laca-blanco', 'Blanco', 'blanco', 1, 'n', '#f5f5f2']]);
  serie('Monpuertas', 'Laca (color G2)', 'Laca', F, 'BAHIA GRUPO 2 MATE', [['mp-laca-hueso', 'Hueso nº 8', 'crema', 1, 'c', '#ece4d2'], ['mp-laca-azul', 'Azul nº 9', 'azul', 2, 'f', '#7d93a6'],
    ['mp-laca-beig', 'Beige nº 55', 'crema', 1, 'c', '#d8c9ae'], ['mp-laca-marron', 'Marrón nº 58', 'madera_oscura', 3, 'c', '#6a5241'], ['mp-laca-pergamon', 'Pergamon nº 1006', 'crema', 1, 'c', '#e5dcc8'],
    ['mp-laca-arena', 'Arena nº 1007', 'crema', 1, 'c', '#d6c6a8'], ['mp-laca-verde', 'Verde nº 88', 'verde', 2, 'n', '#7f8e72'], ['mp-laca-antracita', 'Antracita nº 1008', 'oscuro', 3, 'f', '#3c3f42'],
    ['mp-laca-capuchino', 'Capuchino nº 1009', 'gris', 2, 'c', '#a3907c'], ['mp-laca-perla', 'Gris perla nº 1010', 'gris_claro', 1, 'n', '#cfcdc8'], ['mp-laca-roto', 'Blanco roto nº 1011', 'crema', 1, 'c', '#efebe1'],
    ['mp-laca-vcemento', 'Verde cemento nº 1016', 'verde', 2, 'f', '#959c92'], ['mp-laca-aguamarina', 'Aguamarina nº 1017', 'azul', 2, 'f', '#9db8b3']]);
  serie('Monpuertas', 'Laca (color G3)', 'Laca', F, 'BAHIA GRUPO 3 MATE', [['mp-laca-rojo', 'Rojo nº 1005', 'terracota', 3, 'c', '#9b2f2a'], ['mp-laca-pacifico', 'Azul Pacífico nº 1013', 'azul', 3, 'f', '#2f4f6b'],
    ['mp-laca-polar', 'Blanco polar', 'blanco', 1, 'f', '#fafafa'], ['mp-laca-negro', 'Negro', 'negro', 3, 'n', '#1f1f1f'], ['mp-laca-grafito', 'Grafito', 'oscuro', 3, 'n', '#4a4a48']]);
  serie('Monpuertas', 'Madera', 'Madera', F, 'PALERMO GRUPO 1', [['mp-mad-roble', 'Roble claro', 'madera_clara', 1, 'c', '#cdae86'], ['mp-mad-nogal', 'Nature nogal', 'madera_oscura', 3, 'c', '#6c4e38'],
    ['mp-mad-latte', 'Nature latte', 'madera_clara', 1, 'c', '#d4c0a3', 'PALERMO GRUPO 2'], ['mp-mad-ceniza', 'Nature ceniza', 'madera_media', 2, 'f', '#9d958a', 'PALERMO GRUPO 2'],
    ['mp-mad-blanco', 'Nature blanco (poro)', 'blanco', 1, 'c', '#efebe3', 'PALERMO GRUPO 3'], ['mp-mad-vcemento', 'Nature verde cemento', 'verde', 2, 'f', '#939a90', 'PALERMO GRUPO 3']]);
  // ── Dossia · laca (colores estándar) ──
  serie('Dossia', 'Laca estándar', 'Laca', F, 'Nua Color Satinado', [['do-blanco', 'Blanco estándar nº 00', 'blanco', 1, 'n', '#f5f5f2', 'Nua Blanco Satinado'], ['do-roto', 'Blanco roto nº 02', 'crema', 1, 'c', '#efeadf'],
    ['do-viejo', 'Blanco viejo nº 03', 'crema', 1, 'c', '#e8e0cf'], ['do-perla', 'Gris perla nº 04', 'gris_claro', 1, 'n', '#cfcdc8'], ['do-negro', 'Negro nº 05', 'negro', 3, 'n', '#1f1f1f'],
    ['do-grey', 'Grey nº 06', 'gris', 2, 'f', '#8d9093'], ['do-marengo', 'Gris marengo nº 07', 'oscuro', 3, 'f', '#4b4f54'], ['do-hueso', 'Hueso nº 08', 'crema', 1, 'c', '#ebe3d0'],
    ['do-oceanic', 'Oceanic nº 09', 'azul', 3, 'f', '#33505f'], ['do-chocolate', 'Chocolate nº 10', 'madera_oscura', 3, 'c', '#4f3a2f'], ['do-azulclaro', 'Azul claro nº 15', 'azul', 1, 'f', '#b9c9d4'],
    ['do-terra', 'Marrón terra nº 17', 'terracota', 2, 'c', '#8e6a52'], ['do-vison', 'Visón nº 20', 'gris', 2, 'c', '#9d9183'], ['do-capuchino', 'Capuchino nº 21', 'gris', 2, 'c', '#a5927d'],
    ['do-plomo', 'Plomo claro nº 22', 'gris', 2, 'f', '#a3a6a8'], ['do-aguamarina', 'Aguamarina nº 23', 'azul', 2, 'f', '#9fbab4'], ['do-cachemir', 'Cachemir nº 30', 'crema', 1, 'c', '#d8ccba'],
    ['do-crema', 'Crema oscuro nº 31', 'crema', 2, 'c', '#d2c09d'], ['do-piedra', 'Piedra nº 33', 'gris', 2, 'c', '#b3aa9b'], ['do-vnature', 'Verde nature nº 34', 'verde', 2, 'n', '#8a957a'],
    ['do-arcilla', 'Rojo arcilla nº 36', 'terracota', 2, 'c', '#a8604b'], ['do-salvia', 'Verde salvia nº 40', 'verde', 2, 'n', '#9daa94'], ['do-vmedio', 'Verde medio nº 42', 'verde', 2, 'n', '#6f8266'],
    ['do-azulpiedra', 'Azul piedra nº 45', 'azul', 2, 'f', '#6e8391'], ['do-musgo', 'Verde musgo nº 46', 'verde', 3, 'c', '#4f5a3c'], ['do-cafe', 'Café nº 51', 'madera_oscura', 3, 'c', '#6a5544'],
    ['do-terracota', 'Terracota nova nº 60', 'terracota', 2, 'c', '#b5684b'], ['do-griosc', 'Gris oscuro nº 67', 'oscuro', 3, 'n', '#4c4c4b'], ['do-varcilla', 'Verde arcilla nº 73', 'verde', 2, 'c', '#8f8d6f'],
    ['do-pergamon', 'Pergamon nº 216', 'crema', 1, 'c', '#e4dbc6']]);
  // ── Laca propia: selección de NCS y RAL para cocina (cualquier otro código se escribe) ──
  var LACA_PROPIA = [
    ['RAL 9016', 'Blanco tráfico', 'blanco', 1, 'f', '#f6f6f4'], ['RAL 9010', 'Blanco puro', 'blanco', 1, 'n', '#f3f1e8'], ['RAL 9003', 'Blanco señales', 'blanco', 1, 'f', '#f4f4f2'],
    ['NCS S 0500-N', 'Blanco', 'blanco', 1, 'n', '#f2f1ec'], ['RAL 9001', 'Blanco crema', 'crema', 1, 'c', '#efe8d8'], ['NCS S 0502-Y', 'Blanco roto cálido', 'crema', 1, 'c', '#f0ede3'],
    ['RAL 1013', 'Blanco perla', 'crema', 1, 'c', '#e6dfcc'], ['NCS S 1002-Y', 'Blanco hueso', 'crema', 1, 'c', '#e3dfd3'], ['RAL 1015', 'Marfil claro', 'crema', 1, 'c', '#e4d5b7'],
    ['NCS S 1505-Y20R', 'Lino', 'crema', 1, 'c', '#dbd0bc'], ['NCS S 2005-Y20R', 'Arena', 'crema', 1, 'c', '#cdc3b1'], ['NCS S 2010-Y30R', 'Arena rosada', 'crema', 2, 'c', '#d2bfa6'],
    ['NCS S 1502-Y50R', 'Greige rosado', 'gris_claro', 1, 'c', '#d7cec6'], ['RAL 9002', 'Blanco grisáceo', 'gris_claro', 1, 'n', '#e5e5dc'], ['NCS S 1002-G', 'Gris verdoso muy claro', 'gris_claro', 1, 'f', '#dde0d9'],
    ['RAL 7035', 'Gris luminoso', 'gris_claro', 1, 'f', '#cbd0cc'], ['RAL 7044', 'Gris seda', 'gris_claro', 1, 'c', '#b7b3a8'], ['NCS S 2005-B20G', 'Gris azulado claro', 'gris_claro', 1, 'f', '#c7cfcf'],
    ['NCS S 3005-Y20R', 'Greige', 'gris', 2, 'c', '#b6ac9c'], ['RAL 7032', 'Gris guijarro', 'gris', 2, 'c', '#b5b0a1'], ['NCS S 3502-Y', 'Gris cálido', 'gris', 2, 'c', '#ada9a0'],
    ['RAL 7030', 'Gris piedra', 'gris', 2, 'n', '#8f8b82'], ['RAL 7036', 'Gris platino', 'gris', 2, 'n', '#9a9697'], ['NCS S 5502-Y', 'Gris topo', 'gris', 2, 'c', '#7f7c75'],
    ['RAL 7039', 'Gris cuarzo', 'oscuro', 3, 'c', '#6c6960'], ['RAL 7022', 'Gris sombra', 'oscuro', 3, 'n', '#4d4a44'], ['NCS S 7502-Y', 'Gris pizarra cálido', 'oscuro', 3, 'c', '#4c4a46'],
    ['RAL 7016', 'Gris antracita', 'oscuro', 3, 'f', '#383e42'], ['RAL 7021', 'Gris negruzco', 'negro', 3, 'f', '#2e3234'], ['NCS S 8502-B', 'Casi negro', 'negro', 3, 'f', '#2d2f31'],
    ['RAL 9005', 'Negro intenso', 'negro', 3, 'n', '#141416'],
    ['NCS S 2010-G30Y', 'Verde salvia claro', 'verde', 1, 'n', '#b7bca3'], ['NCS S 3010-G30Y', 'Verde salvia', 'verde', 2, 'n', '#a3a78e'], ['RAL 6021', 'Verde pálido', 'verde', 2, 'n', '#89ac76'],
    ['NCS S 4010-G50Y', 'Verde oliva suave', 'verde', 2, 'c', '#8e8f72'], ['RAL 6013', 'Verde caña', 'verde', 2, 'c', '#7d765a'], ['RAL 6011', 'Verde reseda', 'verde', 2, 'n', '#6c7c59'],
    ['NCS S 6010-G50Y', 'Verde oliva oscuro', 'verde', 3, 'c', '#5e5f4b'], ['RAL 6003', 'Verde oliva', 'verde', 3, 'c', '#50533c'], ['NCS S 7010-B10G', 'Verde petróleo', 'verde', 3, 'f', '#3f4a4b'],
    ['RAL 6009', 'Verde abeto', 'verde', 3, 'f', '#27352a'],
    ['NCS S 3010-B10G', 'Azul niebla', 'azul', 1, 'f', '#a3b1b4'], ['RAL 5024', 'Azul pastel', 'azul', 2, 'f', '#6f93ab'], ['RAL 5014', 'Azul paloma', 'azul', 2, 'f', '#637d96'],
    ['NCS S 4020-B', 'Azul grisáceo', 'azul', 2, 'f', '#7d93a6'], ['NCS S 6020-B10G', 'Azul petróleo', 'azul', 3, 'f', '#4a6170'], ['RAL 5008', 'Azul grisáceo oscuro', 'azul', 3, 'f', '#2b3a44'],
    ['RAL 5011', 'Azul acero', 'azul', 3, 'f', '#1a2b3c'], ['NCS S 8005-B20G', 'Azul noche', 'azul', 3, 'f', '#2e3538'],
    ['RAL 1001', 'Beige', 'crema', 2, 'c', '#cbb48e'], ['RAL 1019', 'Beige grisáceo', 'gris', 2, 'c', '#a3967e'], ['NCS S 3020-Y40R', 'Terracota suave', 'terracota', 2, 'c', '#c49a7a'],
    ['RAL 3012', 'Rojo beige', 'terracota', 2, 'c', '#c1876b'], ['NCS S 4030-Y50R', 'Terracota', 'terracota', 2, 'c', '#a8704f'], ['RAL 8023', 'Marrón anaranjado', 'terracota', 3, 'c', '#a65e2e'],
    ['NCS S 5020-Y70R', 'Arcilla rojiza', 'terracota', 3, 'c', '#8f6151'], ['RAL 3009', 'Rojo óxido', 'terracota', 3, 'c', '#642424'], ['RAL 1011', 'Marrón beige', 'madera_media', 2, 'c', '#8a6642'],
    ['RAL 8025', 'Marrón pálido', 'madera_oscura', 3, 'c', '#765d4d'], ['RAL 8019', 'Marrón grisáceo', 'madera_oscura', 3, 'c', '#403a3a'],
  ];
  function lacaPropia(codigo, nombre, fam, tono, temp, hex, id) {
    return { id: id || 'lp-' + codigo.replace(/\W+/g, '-').toLowerCase(), nombre: nombre ? codigo + ' ' + nombre : codigo, codigo: codigo, fab: 'Fabricación propia', serie: 'Laca NCS / RAL',
      mat: 'Laca propia', uso: F, mod: fam === 'blanco' ? 'Frente/puerta liso BLANCO' : 'Frente/puerta liso COLOR', fam: fam, tono: tono, temp: temp, hex: hex, unero: true, brilloOpc: true };
  }
  LACA_PROPIA.forEach(function (x) { BASE.push(lacaPropia(x[0], x[1], x[2], x[3], x[4], x[5])); });
  // ── Encimeras ──
  serie('Briforma', 'Encimera Egger', 'Laminado', E, null, [['en-marmol', 'Mármol blanco F-812', 'marmol', 1, 'f', '#ecebe8'], ['en-pizarra', 'Pizarra F-235', 'oscuro', 3, 'f', '#45474a'],
    ['en-hamilton', 'Roble Hamilton H-3303', 'madera_media', 2, 'c', '#a98462'], ['en-roblenat', 'Roble natural H-1145', 'madera_clara', 1, 'c', '#c6a47c'],
    ['en-halifax', 'Halifax natural H-1180', 'madera_media', 2, 'c', '#a7845f'], ['en-halifaxt', 'Halifax tabaco H-1181', 'madera_oscura', 3, 'c', '#6a4b33'],
    ['en-casella', 'Casella natural H-1367', 'madera_clara', 1, 'c', '#c3a27c'], ['en-casellan', 'Casella nogal H-1386', 'madera_oscura', 3, 'c', '#6f5038'],
    ['en-blanco', 'Blanco premium W-1000', 'blanco', 1, 'n', '#f6f5f1'], ['en-grisclaro', 'Gris claro U-708', 'gris_claro', 1, 'n', '#c4c3c0'],
    ['en-grafito', 'Gris grafito U-961', 'oscuro', 3, 'n', '#4a4b4c'], ['en-negro', 'Negro U-999', 'negro', 3, 'n', '#222222'],
    ['en-hormigon', 'Hormigón claro F-186', 'piedra', 1, 'n', '#b8b5ae'], ['en-hormigonosc', 'Hormigón oscuro F-275', 'piedra', 3, 'n', '#5c5b58'],
    ['en-pietra', 'Piedra antracita F-205', 'piedra', 3, 'f', '#4e4f50'], ['en-quarzb', 'Quarz blanco', 'piedra', 1, 'n', '#e9e7e2'], ['en-quarzn', 'Quarz negro', 'negro', 3, 'n', '#2a2a2a']]);
  serie('Silestone', 'Cuarzo', 'Cuarzo', E, null, [['en-sil-zeus', 'Blanco Zeus', 'blanco', 1, 'n', '#f4f4f2'], ['en-sil-calacatta', 'Calacatta Gold', 'marmol', 1, 'c', '#eeebe5'],
    ['en-sil-ethereal', 'Ethereal Glow', 'marmol', 1, 'f', '#edeae5'], ['en-sil-lagoon', 'Lagoon', 'piedra', 1, 'n', '#c9c7c0'], ['en-sil-desert', 'Desert Silver', 'gris', 2, 'n', '#8e8e8c'],
    ['en-sil-charcoal', 'Charcoal Soapstone', 'oscuro', 3, 'n', '#3a3b3c'], ['en-sil-marquina', 'Eternal Marquina', 'negro', 3, 'n', '#1e1e1f'], ['en-sil-arcilla', 'Arcilla Red', 'terracota', 2, 'c', '#9b4e3b']]);
  serie('Compac', 'Cuarzo', 'Cuarzo', E, null, [['en-com-absolute', 'Absolute Blanc', 'blanco', 1, 'n', '#f7f7f5'], ['en-com-calacatta', 'Unique Calacatta', 'marmol', 1, 'f', '#eceae5'],
    ['en-com-snow', 'Snow', 'blanco', 1, 'c', '#f5f4f0']]);
  serie('Dekton', 'Porcelánico (sinterizado)', 'Porcelánico', E, null, [['en-dek-aura', 'Aura', 'marmol', 1, 'f', '#efede8'], ['en-dek-entzo', 'Entzo', 'marmol', 1, 'c', '#ece7de'],
    ['en-dek-danae', 'Danae', 'piedra', 1, 'c', '#d7d0c3'], ['en-dek-kreta', 'Kreta', 'piedra', 2, 'n', '#a9a6a0'], ['en-dek-bromo', 'Bromo', 'oscuro', 3, 'n', '#5e5c59'],
    ['en-dek-trilium', 'Trilium', 'piedra', 3, 'c', '#4a4642'], ['en-dek-laurent', 'Laurent', 'madera_oscura', 3, 'c', '#3b302a'], ['en-dek-kelya', 'Kelya', 'negro', 3, 'n', '#2a2a2a'], ['en-dek-sirius', 'Sirius', 'negro', 3, 'n', '#222222']]);
  serie('Neolith', 'Porcelánico (sinterizado)', 'Porcelánico', E, null, [['en-neo-arctic', 'Arctic White', 'blanco', 1, 'n', '#f5f5f3'], ['en-neo-calacatta', 'Calacatta', 'marmol', 1, 'f', '#efede9'],
    ['en-neo-basalt', 'Basalt Beige', 'piedra', 2, 'c', '#c2b8a8'], ['en-neo-iron', 'Iron Copper', 'piedra', 3, 'c', '#5b4a3e'], ['en-neo-nero', 'Nero Zimbabwe', 'negro', 3, 'n', '#232323']]);
  serie('', 'Granito', 'Granito', E, null, [['en-gra-perla', 'Gris Perla', 'gris', 2, 'n', '#a4a2a0'], ['en-gra-cristal', 'Blanco Cristal', 'piedra', 1, 'n', '#d9d8d4'],
    ['en-gra-porrino', 'Rosa Porriño', 'terracota', 2, 'c', '#b79c93'], ['en-gra-zimbabwe', 'Negro Zimbabwe', 'negro', 3, 'n', '#1e1e1e'], ['en-gra-sudafrica', 'Negro Sudáfrica', 'negro', 3, 'n', '#2b2b2b']]);
  serie('', 'Mármol', 'Mármol', E, null, [['en-mar-macael', 'Blanco Macael', 'marmol', 1, 'f', '#ecece8'], ['en-mar-crema', 'Crema Marfil', 'crema', 1, 'c', '#e4d7be'],
    ['en-mar-emperador', 'Marrón Emperador', 'madera_oscura', 3, 'c', '#5b4436']]);
  serie('', 'Compacto', 'Compacto', E, null, [['en-cpt-blanco', 'Compacto blanco', 'blanco', 1, 'n', '#f3f3f1'], ['en-cpt-gris', 'Compacto gris', 'gris', 2, 'n', '#8c8c8a'], ['en-cpt-negro', 'Compacto negro', 'negro', 3, 'n', '#222222']]);
  serie('', 'Madera maciza', 'Madera maciza', E, null, [['en-mad-roble', 'Roble macizo', 'madera_clara', 1, 'c', '#c49a6c'], ['en-mad-nogal', 'Nogal macizo', 'madera_oscura', 3, 'c', '#6b4c36']]);
  // ── Tiradores (tipo: visto, integrado, sin) ──
  serie('', 'Tirador visto', 'Tirador', T, null, [['ti-plata', 'Plata / inox', 'metal', 1, 'f', '#b9bcbe'], ['ti-negro', 'Negro', 'negro', 3, 'n', '#1f1f1f'], ['ti-antracita', 'Antracita', 'oscuro', 3, 'n', '#3d3f41'],
    ['ti-blanco', 'Blanco', 'blanco', 1, 'n', '#f2f2f0'], ['ti-oro', 'Oro / latón', 'oro', 2, 'c', '#c3a35a'], ['ti-bronce', 'Bronce', 'bronce', 3, 'c', '#7a5b3c'], ['ti-madera', 'Madera', 'madera_media', 2, 'c', '#b08d68']], { tipoTir: 'visto' });
  serie('', 'Tirador integrado', 'Tirador', T, null, [['ti-int-inox', 'Integrado inox (forma, grada, lineal)', 'metal', 1, 'f', '#c4c6c7'], ['ti-int-negro', 'Integrado negro (vector)', 'negro', 3, 'n', '#202020']], { tipoTir: 'integrado' });
  serie('', 'Sin tirador', 'Tirador', T, null, [['ti-gola', 'Gola', 'gola', 0, 'n', '#9aa0a6'], ['ti-unero', 'Uñero', 'gola', 0, 'n', '#a7a29b']], { tipoTir: 'sin' });

  var FAM = { blanco: 'Blanco', crema: 'Crema y beige', gris_claro: 'Gris claro', gris: 'Gris medio', oscuro: 'Antracita', negro: 'Negro', madera_clara: 'Madera clara', madera_media: 'Madera media',
    madera_oscura: 'Madera oscura', verde: 'Verde', azul: 'Azul', terracota: 'Terracota y tierra', marmol: 'Mármol', piedra: 'Piedra y hormigón', metal: 'Metal', oro: 'Oro', bronce: 'Bronce', gola: 'Gola o uñero' };
  // Familias que el cliente puede querer o no querer ver.
  var FAM_CLIENTE = [['blanco', 'Blanco'], ['crema', 'Crema'], ['gris', 'Gris'], ['oscuro', 'Oscuro y negro'], ['madera', 'Madera'], ['verde', 'Verde'], ['azul', 'Azul'], ['terracota', 'Terracota'], ['marmol', 'Vetas tipo mármol']];
  var enFamCliente = function (k, fam) { return k === fam || (k === 'gris' && /^gris/.test(fam)) || (k === 'oscuro' && (fam === 'oscuro' || fam === 'negro')) || (k === 'madera' && /^madera/.test(fam)); };
  var esMadera = function (f) { return /^madera/.test(f); };
  var claros = ['blanco', 'crema', 'gris_claro', 'marmol'];
  var NOMBRE_GRUPO = ['', 'ECONÓMICO', 'BÁSICO', 'ENTRADA', 'DM-LACA MEDIO', 'DM-LACA ALTO', 'DM-LACA PREMIUM', 'ALTO GAMA', 'EXCLUSIVO'];

  // ── Grupo de precio de un frente (de MODELOS_GRUPOS del catálogo) ──
  // Grupo de cada modelo según la tarifa 2026 (si en este dispositivo la lista de modelos es más antigua y no lo tiene).
  var GRUPO_MODELO = { 'SUIZA (G-35)': 1, 'AUSTRIA (G-35)': 1, 'ROMA (G-31)': 1, 'BOSTON (G-31)': 1, 'ALABAMA (G-31)': 1, 'JAÉN (G-31)': 1, 'TORONTO (G-40)': 1, 'PETRA (G-40)': 1,
    'CANADÁ (G-40)': 1, 'MIÑO BLANCO (G-04)': 1, 'LUGO (G-04)': 1, 'SIDNEY BLANCO (G-22)': 1, 'SIL (G-45)': 2, 'LUXEMBURGO (G-23)': 2, 'MIÑO COLOR (G-26)': 2, 'SIDNEY COLOR (G-26)': 2,
    'BERLÍN Uñero Integrado VETH (G-54)': 3, 'MATERIA (G-54)': 3, 'BERNA': 2, 'LANZAROTE': 3, 'BAHIA GRUPO 1 MATE': 3, 'BAHIA GRUPO 2 MATE': 4, 'BAHIA GRUPO 3 MATE': 4,
    'PALERMO GRUPO 1': 3, 'PALERMO GRUPO 2': 3, 'PALERMO GRUPO 3': 3, 'Nua Blanco Satinado': 3, 'Nua Color Satinado': 4, 'Frente/puerta liso BLANCO': 1, 'Frente/puerta liso COLOR': 2 };
  function grupoDe(c) {
    if (c.uso !== F) return null;
    var lista = window.MODELOS_GRUPOS || [];
    for (var i = 0; i < lista.length; i++) if (lista[i].modelo === c.mod) return lista[i].g;
    return GRUPO_MODELO[c.mod] || c.g || null;
  }
  // Tope del presupuesto abierto: el grupo más alto de sus grupos de muebles con líneas (null si no hay).
  function grupoPresupuesto() {
    var cals = window.CALS || NOMBRE_GRUPO.slice(1), st = window.ST, max = 0;
    ((st && st.groups) || []).forEach(function (g) {
      if ((g.tipo || 'muebles') !== 'muebles' || !(g.lines || []).length) return;
      var i = cals.indexOf(g.cal); if (i + 1 > max) max = i + 1;
    });
    return max || null;
  }

  // ── NCS y RAL escritos a mano: color aproximado ──
  var NCS_HUE = { Y: [240, 200, 30], R: [200, 40, 50], B: [20, 110, 180], G: [20, 150, 100] }, ORDEN_NCS = ['Y', 'R', 'B', 'G'];
  function ncsHex(codigo) {
    var m = /S?\s*(\d{2})(\d{2})-(N|([YRBG])(?:(\d{2})([YRBG]))?)/i.exec(String(codigo).replace(/\s+/g, ' '));
    if (!m) return null;
    var s = +m[1] / 100, c = +m[2] / 100, hue = [128, 128, 128];
    if (m[3].toUpperCase() !== 'N') {
      var h1 = m[4].toUpperCase(), h2 = m[6] ? m[6].toUpperCase() : h1, t = m[5] ? +m[5] / 100 : 0;
      if (m[6] && ORDEN_NCS[(ORDEN_NCS.indexOf(h1) + 1) % 4] !== h2) return null;
      var a = NCS_HUE[h1], b = NCS_HUE[h2];
      hue = a.map(function (v, i) { return v + (b[i] - v) * t; });
    } else c = 0;
    var w = Math.max(0, 1 - s - c), rgb = hue.map(function (v) { return Math.round(255 * w * 0.96 + v * c); });
    return '#' + rgb.map(function (v) { return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }).join('');
  }
  function datosHex(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, l = r * 0.3 + g * 0.59 + b * 0.11;
    var tono = l > 185 ? 1 : l > 105 ? 2 : 3, temp = r - b > 14 ? 'c' : b - r > 6 ? 'f' : 'n', sat = Math.max(r, g, b) - Math.min(r, g, b);
    var fam = sat < 22 ? (tono === 1 ? (l > 228 ? 'blanco' : 'gris_claro') : tono === 2 ? 'gris' : l < 50 ? 'negro' : 'oscuro')
      : g >= r && g >= b ? 'verde' : b >= r ? 'azul' : (r - g > 40 ? 'terracota' : tono === 1 ? 'crema' : 'madera_media');
    return { tono: tono, temp: temp, fam: fam };
  }
  // «RAL 6021», «ncs s 2010-g30y»… → color de laca propia (o null si no se entiende).
  function colorDeCodigo(texto) {
    var t = String(texto || '').trim().toUpperCase().replace(/\s+/g, ' ');
    var ral = /^RAL ?(\d{4})$/.exec(t);
    if (ral) {
      var cod = 'RAL ' + ral[1], ya = BASE.filter(function (c) { return c.codigo === cod; })[0];
      if (ya) return ya;
      return lacaPropia(cod, '', 'gris', 2, 'n', '#9a9a9a', 'mio-' + cod.replace(/\W+/g, '-').toLowerCase());
    }
    var ncs = /^(NCS )?(S ?)?(\d{4}-(N|[YRBG](\d{2}[YRBG])?))$/.exec(t);
    if (ncs) {
      var codN = 'NCS S ' + ncs[3], yaN = BASE.filter(function (c) { return c.codigo === codN; })[0];
      if (yaN) return yaN;
      var hex = ncsHex(codN); if (!hex) return null;
      var dh = datosHex(hex);
      return lacaPropia(codN, '', dh.fam, dh.tono, dh.temp, hex, 'mio-' + codN.replace(/\W+/g, '-').toLowerCase());
    }
    return null;
  }

  // ── Lo guardado ──
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') || {}; } catch (e) { return {}; } }
  function guardar(o) { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} }   // se sube sola a la nube (CLAVES_SYNC)
  function catalogo() {
    var g = leer(), quitados = g.quitados || [], cambios = g.cambios || {};
    return BASE.map(function (c) { return cambios[c.id] ? Object.assign({}, c, cambios[c.id]) : c; })
      .concat(g.mios || []).filter(function (c) { return quitados.indexOf(c.id) < 0; })
      .map(function (c) { return c.uso === F ? Object.assign({}, c, { g: grupoDe(c) }) : c; });
  }
  var porId = function (cat, id) { return id ? cat.filter(function (c) { return c.id === id; })[0] || null : null; };

  // ── Suelo y pared ──
  var SUELO_HEX = { madera: { 1: '#d2b48c', 2: '#a57b52', 3: '#5f4330' }, piedra: { 1: '#ddd6c9', 2: '#a59d90', 3: '#57534d' }, cemento: { 1: '#c9c7c2', 2: '#97958f', 3: '#5a5a58' },
    ceramica: { 1: '#e9e6df', 2: '#b9b2a6', 3: '#4c4a47' }, barro: { 1: '#d8a27a', 2: '#b5714b', 3: '#7d4a32' } };
  function sueloHex(e) { if (e.sueloHex) return e.sueloHex; var t = SUELO_HEX[e.sueloTipo] || SUELO_HEX.ceramica; return t[e.sueloTono] || t[2]; }
  var PARED_HEX = { blanco: '#f7f6f2', claro: '#ebe4d6', color: '#c9d3cb', azulejo: '#e3e1dc' };
  function paredHex(e) { return e.paredHex || PARED_HEX[e.pared] || PARED_HEX.blanco; }

  // ── Recomendación ──
  var ESTILO = {
    moderno: { fr: ['blanco', 'gris_claro', 'gris', 'oscuro', 'negro', 'madera_media'], en: ['marmol', 'piedra', 'blanco', 'negro', 'oscuro'], ti: ['ti-plata', 'ti-int-inox', 'ti-negro', 'ti-gola'] },
    minimalista: { fr: ['blanco', 'gris_claro', 'negro', 'oscuro', 'gris'], en: ['blanco', 'negro', 'oscuro', 'piedra'], ti: ['ti-gola', 'ti-unero', 'ti-int-inox'] },
    nordico: { fr: ['blanco', 'crema', 'gris_claro', 'madera_clara', 'verde', 'azul'], en: ['madera_clara', 'blanco', 'piedra'], ti: ['ti-madera', 'ti-negro', 'ti-blanco'] },
    japandi: { fr: ['madera_clara', 'negro', 'oscuro', 'crema', 'gris'], en: ['piedra', 'madera_clara', 'negro', 'blanco'], ti: ['ti-negro', 'ti-madera', 'ti-unero'] },
    clasico: { fr: ['crema', 'blanco', 'verde', 'azul', 'gris_claro'], en: ['marmol', 'piedra', 'madera_media'], ti: ['ti-oro', 'ti-bronce', 'ti-plata'] },
    vintage: { fr: ['verde', 'azul', 'crema', 'terracota', 'blanco'], en: ['marmol', 'madera_media', 'blanco'], ti: ['ti-oro', 'ti-bronce', 'ti-plata'] },
    boho: { fr: ['crema', 'terracota', 'verde', 'madera_clara', 'blanco'], en: ['blanco', 'madera_clara', 'piedra', 'marmol'], ti: ['ti-bronce', 'ti-madera', 'ti-oro'] },
    industrial: { fr: ['oscuro', 'negro', 'gris', 'madera_media', 'madera_oscura'], en: ['piedra', 'madera_media', 'oscuro'], ti: ['ti-negro', 'ti-antracita', 'ti-int-negro'] },
    rustico: { fr: ['madera_media', 'crema', 'verde', 'terracota', 'madera_oscura'], en: ['madera_media', 'piedra', 'marmol'], ti: ['ti-bronce', 'ti-negro', 'ti-madera'] },
  };
  var NOMBRE_ESTILO = { moderno: 'moderno', minimalista: 'minimalista', nordico: 'nórdico', japandi: 'japandi', clasico: 'clásico', vintage: 'vintage', boho: 'boho o mediterráneo', industrial: 'industrial', rustico: 'rústico' };
  var NIVEL_ENC = { Laminado: 1, Compacto: 2, Cuarzo: 2, Granito: 2, 'Madera maciza': 2, 'Porcelánico': 3, 'Mármol': 3 };
  var esBrillo = function (c) { return !!c.brillo || /brillo/i.test(c.nombre); };
  var cuida = function (e) { return (e.uso || []).some(function (u) { return u === 'ninos' || u === 'mascotas'; }); };

  // quiero: { fams, tono, fab, rol: 'altos'|'bajos'|'ambos', noFams, dejarOscuro }
  function puntuar(c, e, quiero) {
    var s = 0, est = ESTILO[e.estilo] || ESTILO.moderno, lista = c.uso === E ? est.en : est.fr;
    var k = lista.indexOf(c.fam); if (k >= 0) s += 6 - k;
    var qi = quiero.fams ? quiero.fams.indexOf(c.fam) : -1; if (qi >= 0) s += Math.max(3, 9 - qi * 2);
    if (quiero.tono && c.tono === quiero.tono) s += 4;
    if (quiero.fab && c.fab === quiero.fab) s += 10;   // altos y bajos del mismo fabricante: un solo pedido
    if (quiero.noFams && quiero.noFams.indexOf(c.fam) >= 0) s -= 30;
    if (e.sueloTemp && c.temp === e.sueloTemp) s += 2;
    if (e.sueloTemp && e.sueloTemp !== 'n' && c.temp !== 'n' && c.temp !== e.sueloTemp) s -= 2;
    if (e.sueloTipo === 'madera' && esMadera(c.fam) && Math.abs(c.tono - e.sueloTono) < 2) s -= 12;   // dos maderas parecidas chocan
    if (c.uso === F && e.sueloTipo === 'barro' && c.fam === 'terracota') s -= 12;
    if ((e.gusta || []).some(function (g) { return enFamCliente(g, c.fam); })) s += 7;
    if (c.uso === F) {
      if (c.tono === 3 && (e.luz === 'poca' || e.tam === 'pequena') && !quiero.dejarOscuro) s -= 10;
      if (e.acabado === 'brillo') s += esBrillo(c) || c.brilloOpc ? 6 : -2;
      if (e.acabado === 'madera') s += esMadera(c.fam) ? 7 : -2;
      // Niños o mascotas: en los bajos nada de brillo ni blanco puro; mejor antihuella y tonos que disimulan.
      if (cuida(e) && quiero.rol !== 'altos') { if (esBrillo(c)) s -= 8; if (c.fam === 'blanco') s -= 5; if (c.antihuella) s += 4; if (c.tono === 2) s += 2; }
      if (e.tirador === 'sin' && c.unero) s += 3;
    } else if (c.uso === E) {
      // La encimera va con el nivel del presupuesto (si el cliente no ha elegido material): laminado en los grupos bajos, piedra en los altos.
      var nivel = NIVEL_ENC[c.mat] || 2, tope = e.tope || 8, quiere = tope <= 2 ? 1 : tope <= 4 ? 2 : 3;
      if (!(e.encs && e.encs.length)) s += nivel === quiere ? 5 : nivel < quiere ? 1 : -4 * (nivel - quiere);
      if ((e.uso || []).indexOf('cocina') >= 0) s += /Cuarzo|Porcelánico|Compacto|Granito/.test(c.mat) ? 5 : /Madera maciza|Mármol/.test(c.mat) ? -8 : -1;
      if (quiero.evitar && quiero.evitar.indexOf(c.id) >= 0) s -= 6;   // otra encimera que en las otras propuestas, si se puede
    }
    return s;
  }
  // Lo que se puede proponer: sin lo que no quiere el cliente, dentro del grupo tope y de los materiales elegidos.
  function filtrar(cat, e) {
    var tope = e.tope || 8;
    return cat.filter(function (c) {
      if (c.uso !== T && (e.noQuiere || []).some(function (k) { return enFamCliente(k, c.fam); })) return false;
      if (c.uso === F) {
        if (c.g && c.g > tope) return false;
        if (e.mats && e.mats.length && e.mats.indexOf(c.mat) < 0) return false;
        if (e.acabado === 'mate' && esBrillo(c)) return false;
      }
      if (c.uso === E && e.encs && e.encs.length && e.encs.indexOf(c.mat) < 0) return false;
      if (c.uso === T && e.tirador && e.tirador !== c.tipoTir) return false;
      return true;
    });
  }
  function mejor(lista, e, quiero, evitar) {
    var c = lista.filter(function (x) { return !evitar || evitar.indexOf(x.id) < 0; })
      .map(function (x) { return [puntuar(x, e, quiero), x]; }).sort(function (a, b) { return b[0] - a[0] || a[1].nombre.localeCompare(b[1].nombre); });
    return c.length ? c[0][1] : null;
  }

  function recomendar(e, catTodo) {
    catTodo = catTodo || catalogo();
    var cat = filtrar(catTodo, e);
    var fr = cat.filter(function (c) { return c.uso === F; }), en = cat.filter(function (c) { return c.uso === E; }), ti = cat.filter(function (c) { return c.uso === T; });
    if (!ti.length) ti = catTodo.filter(function (c) { return c.uso === T; });
    var fijo = e.fijo || {}, fA = porId(catTodo, fijo.altos), fB = porId(catTodo, fijo.bajos), fE = porId(catTodo, fijo.encimera);
    var oscuroSuelo = e.sueloTono === 3, claroSuelo = e.sueloTono === 1, cerrada = e.luz === 'poca' || e.tam === 'pequena';
    var usados = [], encUsadas = [], combos = [];
    function encimeraPara(frentes, variar) {
      if (fE) return fE;
      var tonos = frentes.map(function (f) { return f.tono; }), todoClaro = tonos.every(function (t) { return t === 1; });
      var q = todoClaro ? { fams: esMadera(frentes[0].fam) ? ['marmol', 'piedra', 'blanco'] : ['madera_media', 'madera_clara', 'marmol', 'piedra', 'oscuro'] }
        : tonos.indexOf(3) >= 0 ? { fams: ['marmol', 'madera_media', 'madera_clara', 'piedra'], tono: 1 } : { fams: ['marmol', 'piedra', 'madera_media', 'blanco'] };
      q.noFams = frentes.map(function (f) { return f.fam; }).filter(function (f) { return !esMadera(f) || frentes[0].id === frentes[frentes.length - 1].id; });
      q.evitar = encUsadas; return mejor(en, e, q, variar ? encUsadas : []);
    }
    function tiradorPara(frentes) {
      var est = ESTILO[e.estilo] || ESTILO.moderno, orden = est.ti.slice();
      if (frentes.some(function (f) { return esMadera(f.fam); }) && e.estilo !== 'minimalista') orden.unshift('ti-negro');
      for (var i = 0; i < orden.length; i++) { var t = porId(ti, orden[i]); if (t) return t; }
      return ti.filter(function (t) { return e.tirador || t.tipoTir === 'visto'; })[0] || ti[0];
    }
    function anadir(titulo, altos, bajos, razones) {
      if (!altos || !bajos) return;
      var mismo = function (x, enc) { return x.altos.id === altos.id && x.bajos.id === bajos.id && (x.encimera && x.encimera.id) === (enc && enc.id); };
      var enc = encimeraPara([bajos, altos], false);
      if (combos.some(function (x) { return mismo(x, enc); })) enc = encimeraPara([bajos, altos], true) || enc;   // por lo fijado salía igual: otra encimera
      if (combos.some(function (x) { return mismo(x, enc); })) return;
      if (enc) encUsadas.push(enc.id);
      var r = razones.slice();
      if (enc && !fE) r.push(esMadera(enc.fam) ? 'La encimera de madera da calidez.' : enc.tono === 3 ? 'La encimera oscura marca la línea de trabajo.' : enc.tono === 1 && (altos.tono > 1 || bajos.tono > 1) ? 'La encimera clara equilibra el color de los frentes.' : 'La encimera de aspecto piedra o mármol es fácil de combinar y de limpiar.');
      if (cuida(e) && !esBrillo(bajos) && bajos.fam !== 'blanco') r.push('Con niños o mascotas: bajos mate' + (bajos.antihuella ? ' y antihuella' : '') + ', que disimulan golpes y huellas.');
      if (fA || fB || fE) r.push('Respeta lo que el cliente ya ha elegido.');
      var g = Math.max(altos.g || 0, bajos.g || 0) || null;
      combos.push({ titulo: titulo, altos: altos, bajos: bajos, encimera: enc, tirador: tiradorPara([bajos, altos]), razones: r, g: g });
    }
    // 1. Luminosa: frentes claros en toda la cocina.
    var a = mejor(fr, e, { fams: claros, tono: 1, rol: 'ambos' }, usados);
    var A1 = fA || (fB && fB.tono === 1 ? fB : null) || (fB ? mejor(fr, e, { fams: claros, tono: 1, fab: fB.fab, rol: 'altos' }, []) : a), B1 = fB || A1;
    if (A1 && B1) {
      usados.push(A1.id, B1.id);
      var r1 = [cerrada ? 'Con poca luz o poco espacio, los frentes claros hacen la cocina más grande y luminosa.' : 'Frentes claros: la cocina se ve amplia y limpia, y no pasa de moda.'];
      if (oscuroSuelo) r1.push('Contrastan con el suelo oscuro, que gana protagonismo.');
      if (claroSuelo) r1.push('Con un suelo tan claro, la encimera pone el contraste para que no quede todo plano.');
      anadir('Luminosa', A1, B1, r1);
    }
    // 2. Bitono: bajos con más peso y altos claros, del mismo fabricante.
    var famsB = { moderno: ['madera_media', 'oscuro', 'gris', 'madera_oscura'], industrial: ['oscuro', 'madera_oscura', 'madera_media', 'negro'], nordico: ['madera_clara', 'madera_media', 'verde', 'azul'],
      clasico: ['verde', 'azul', 'madera_media', 'gris'], rustico: ['madera_media', 'verde', 'madera_oscura', 'terracota'], minimalista: ['gris', 'oscuro', 'negro'], boho: ['terracota', 'verde', 'madera_clara'],
      japandi: ['madera_clara', 'madera_media', 'oscuro'], vintage: ['verde', 'azul', 'terracota'] }[e.estilo] || ['madera_media', 'oscuro', 'verde'];
    var suave = oscuroSuelo || ['nordico', 'clasico', 'boho', 'japandi', 'vintage'].indexOf(e.estilo) >= 0;
    var B2 = fB || mejor(fr, e, { fams: famsB, tono: suave ? 2 : 3, dejarOscuro: true, rol: 'bajos' }, usados);
    var A2 = fA || (B2 && mejor(fr, e, { fams: ['blanco', 'crema', 'gris_claro'], tono: 1, fab: B2.fab, rol: 'altos' }, [B2.id]));
    if (A2 && B2) {
      usados.push(B2.id);
      var r2 = ['Altos claros que no pesan y bajos con más color: aguanta mejor el día a día (abajo se notan menos las marcas).'];
      if (e.sueloTipo === 'madera' && esMadera(B2.fam)) r2.push('La madera de los bajos es de otro tono que el suelo, para que no parezca que no casan.');
      else if (esMadera(B2.fam)) r2.push('La madera en los bajos da calidez sin oscurecer la cocina.');
      if (cerrada) r2.push('Lo oscuro va abajo: así no se cierra el espacio.');
      if (A2.fab === B2.fab) r2.push('Altos y bajos del mismo fabricante: un solo pedido.');
      anadir('Bitono', A2, B2, r2);
    }
    // 3. Con carácter: un color con personalidad según el estilo y lo que le gusta (suave si la cocina es pequeña o sin luz).
    var fams3 = { moderno: ['oscuro', 'negro', 'madera_media'], nordico: ['verde', 'azul', 'madera_clara'], clasico: ['verde', 'azul', 'crema'], industrial: ['negro', 'oscuro', 'madera_oscura'], rustico: ['verde', 'terracota', 'madera_media'],
      minimalista: ['negro', 'oscuro', 'gris'], boho: ['terracota', 'verde', 'madera_clara'], japandi: ['negro', 'madera_clara', 'oscuro'], vintage: ['verde', 'azul', 'terracota'] }[e.estilo] || ['verde', 'azul'];
    var gustan = (e.gusta || []).filter(function (g) { return ['verde', 'azul', 'terracota', 'madera', 'oscuro'].indexOf(g) >= 0; });
    if (gustan.length) fams3 = gustan.map(function (g) { return g === 'madera' ? 'madera_media' : g; }).concat(fams3);
    var C3 = fB || mejor(fr, e, { fams: fams3, tono: cerrada ? 2 : 3, dejarOscuro: !cerrada, rol: 'bajos' }, usados);
    if (C3) {
      var A3 = fA || (C3.tono >= 2 && cerrada ? mejor(fr, e, { fams: ['blanco', 'crema'], tono: 1, fab: C3.fab, rol: 'altos' }, []) : C3);
      var r3 = [cerrada ? 'Un color con personalidad, pero suave para que la cocina no se cierre.' : 'Un color con personalidad que encaja con el estilo ' + (NOMBRE_ESTILO[e.estilo] || '') + '.'];
      if (A3 !== C3 && !fA) r3.push('Los altos van claros para que entre la luz.');
      if (gustan.length && !fB) r3.push('Con los colores que le gustan al cliente.');
      if (e.pared === 'color') r3.push('Con la pared de color, que no compita con los frentes (mejor pared blanca o suave).');
      anadir('Con carácter', A3, C3, r3);
    }
    return combos;
  }

  // ── Dibujo ──
  var eh = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function dibujo(cb, e, alto) {
    var w = 300, H = alto || 190, ti = cb.tirador, sinTir = ti && ti.tipoTir === 'sin', integrado = ti && ti.tipoTir === 'integrado';
    var hx = function (c, d) { return c ? c.hex : d; };
    var s = '<svg viewBox="0 0 ' + w + ' ' + H + '" class="gc-svg" role="img" aria-label="Combinación ' + eh(cb.titulo) + '">'
      + '<rect width="' + w + '" height="' + H + '" fill="' + paredHex(e) + '"/><rect y="' + (H - 34) + '" width="' + w + '" height="34" fill="' + sueloHex(e) + '"/>';
    for (var i = 0; i < 4; i++) {
      var x = 22 + i * 64;
      s += '<rect x="' + x + '" y="18" width="62" height="52" fill="' + hx(cb.altos, '#eee') + '" stroke="rgba(0,0,0,.18)"/>'
        + '<rect x="' + x + '" y="96" width="62" height="' + (H - 34 - 96 - 8) + '" fill="' + hx(cb.bajos, '#ddd') + '" stroke="rgba(0,0,0,.18)"/>';
      if (ti && !sinTir) {
        if (integrado) s += '<rect x="' + x + '" y="96" width="62" height="3" fill="' + ti.hex + '"/><rect x="' + x + '" y="67" width="62" height="3" fill="' + ti.hex + '"/>';
        else s += '<rect x="' + (x + 8) + '" y="62" width="20" height="3" rx="1.5" fill="' + ti.hex + '"/><rect x="' + (x + 8) + '" y="103" width="20" height="3" rx="1.5" fill="' + ti.hex + '"/>';
      }
    }
    if (sinTir) s += '<rect x="22" y="100" width="256" height="3" fill="rgba(0,0,0,.28)"/>';
    s += '<rect x="18" y="86" width="264" height="10" fill="' + hx(cb.encimera, '#999') + '" stroke="rgba(0,0,0,.25)"/><rect x="22" y="' + (H - 42) + '" width="256" height="8" fill="rgba(0,0,0,.35)"/>';
    return s + '</svg>';
  }
  function detalle(c) { return [c.fab, c.serie, c.uso === F && c.mat && c.mat !== c.serie ? c.mat : ''].filter(Boolean).join(' · '); }
  function fila(et, c) {
    if (!c) return '';
    return '<div class="gc-fila"><span class="gc-mu" style="background:' + c.hex + '"></span><span><small>' + et + '</small><b>' + eh(c.nombre) + '</b>'
      + (detalle(c) ? '<em>' + eh(detalle(c)) + '</em>' : '') + '</span></div>';
  }
  function textoGrupo(cb, tope) {
    if (!cb.g) return '';
    return '<div class="gc-grupo' + (tope && cb.g > tope ? ' sube' : '') + '">Grupo ' + NOMBRE_GRUPO[cb.g]
      + (tope ? (cb.g < tope ? ' · por debajo del presupuesto' : cb.g === tope ? ' · como el presupuesto' : ' · sube de grupo') : '') + '</div>';
  }

  // ── Pantalla ──
  var OPC = {
    sueloTipo: [['madera', 'Madera o imitación'], ['piedra', 'Piedra o porcelánico piedra'], ['cemento', 'Cemento o gris'], ['ceramica', 'Cerámica lisa'], ['barro', 'Barro o terracota']],
    sueloTono: [[1, 'Claro'], [2, 'Medio'], [3, 'Oscuro']],
    sueloTemp: [['c', 'Cálido (amarillo o rojizo)'], ['n', 'Neutro'], ['f', 'Frío (gris o azulado)']],
    pared: [['blanco', 'Blanca'], ['claro', 'Clara o beige'], ['color', 'De color'], ['azulejo', 'Azulejo']],
    luz: [['mucha', 'Mucha luz'], ['normal', 'Normal'], ['poca', 'Poca luz']],
    tam: [['pequena', 'Pequeña'], ['media', 'Mediana'], ['grande', 'Grande o abierta']],
    estilo: [['moderno', 'Moderno'], ['minimalista', 'Minimalista'], ['nordico', 'Nórdico'], ['japandi', 'Japandi'], ['clasico', 'Clásico'], ['vintage', 'Vintage / retro'], ['boho', 'Boho / mediterráneo'], ['industrial', 'Industrial'], ['rustico', 'Rústico']],
    acabado: [['', 'Da igual'], ['mate', 'Mate'], ['brillo', 'Brillo'], ['madera', 'Textura madera']],
    tirador: [['', 'Da igual'], ['visto', 'Tirador visto'], ['integrado', 'Integrado (discreto)'], ['sin', 'Sin tirador (gola o uñero)']],
  };
  var TIT = { sueloTipo: 'Suelo', sueloTono: 'Tono del suelo', sueloTemp: 'Color del suelo', pared: 'Paredes', luz: 'Luz', tam: 'Tamaño', estilo: 'Estilo', acabado: 'Acabado de los frentes', tirador: 'Tirador' };
  var USOS = [['ninos', 'Niños'], ['mascotas', 'Mascotas'], ['cocina', 'Cocina mucho']];
  var MATS = ['Laminado', 'PET', 'Laca', 'Laca propia', 'Madera'];
  var MATS_ENC = ['Laminado', 'Cuarzo', 'Porcelánico', 'Granito', 'Mármol', 'Compacto', 'Madera maciza'];
  var DEF = { sueloTipo: 'madera', sueloTono: 2, sueloTemp: 'c', pared: 'blanco', luz: 'normal', tam: 'media', estilo: 'moderno', mats: [], encs: [], gusta: [], noQuiere: [], uso: [], acabado: '', tirador: '', fijo: {}, tope: null, topeAuto: true };
  function entrada() {
    var g = leer(), e = Object.assign({}, DEF, g.ultimo || {});
    ['mats', 'encs', 'gusta', 'noQuiere', 'uso'].forEach(function (k) { e[k] = (e[k] || []).slice(); });
    e.fijo = Object.assign({}, e.fijo || {});
    if (e.topeAuto !== false) e.tope = grupoPresupuesto();
    return e;
  }
  function cambiar(f) { var g = leer(), u = entrada(); f(u); g.ultimo = u; guardar(g); pintar(); }
  function chips(k, e) {
    return '<div class="gc-campo"><label>' + TIT[k] + '</label><div class="gc-chips">' + OPC[k].map(function (o) {
      return '<button type="button" class="gc-chip' + (String(e[k] || '') === String(o[0]) ? ' on' : '') + '" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div></div>';
  }
  function chipsLista(k, titulo, opciones, e, nota) {
    return '<div class="gc-campo"><label>' + titulo + '</label><div class="gc-chips">' + opciones.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<button type="button" class="gc-chip' + (e[k].indexOf(v) >= 0 ? ' on' : '') + '" data-l="' + k + '" data-v="' + eh(v) + '">' + eh(t) + '</button>';
    }).join('') + '</div>' + (nota ? '<small class="gc-nota">' + nota + '</small>' : '') + '</div>';
  }
  function selFijo(rol, titulo, cat, e) {
    var lista = cat.filter(function (c) { return rol === 'encimera' ? c.uso === E : c.uso === F; }), grupos = {};
    lista.forEach(function (c) { var k = [c.fab, c.serie].filter(Boolean).join(' · '); (grupos[k] = grupos[k] || []).push(c); });
    return '<div class="gc-fijo"><label>' + titulo + '</label><select data-fijo="' + rol + '"><option value="">— que proponga —</option>'
      + Object.keys(grupos).map(function (k) { return '<optgroup label="' + eh(k) + '">' + grupos[k].map(function (c) { return '<option value="' + c.id + '"' + (e.fijo[rol] === c.id ? ' selected' : '') + '>' + eh(c.nombre) + '</option>'; }).join('') + '</optgroup>'; }).join('')
      + '</select></div>';
  }
  function seccion(t, html, abierta, clave) { return '<details class="gc-sec" data-sec="' + clave + '"' + (abierta ? ' open' : '') + '><summary>' + t + '</summary>' + html + '</details>'; }

  function pintarForm(e, cat) {
    var m = document.getElementById('GC-MOD'), ab = {};
    m.querySelectorAll('.gc-form details').forEach(function (d) { ab[d.dataset.sec] = d.open; });
    var abierta = function (k, def) { return k in ab ? ab[k] : def; }, tp = grupoPresupuesto();
    var html = seccion('Suelo y cocina', ['sueloTipo', 'sueloTono', 'sueloTemp'].map(function (k) { return chips(k, e); }).join('')
        + '<div class="gc-campo"><button type="button" class="btn bgh bsm" data-acc="gc-foto">📷 Coger el color de una foto</button>'
        + (e.sueloHex || e.paredHex ? ' <button type="button" class="btn bgh bsm" data-acc="gc-sin-foto">Quitar colores de la foto</button>' : '')
        + '<input type="file" accept="image/*" capture="environment" id="GC-FOTO" hidden><div class="gc-foto" hidden><canvas></canvas>'
        + '<div class="gc-chips"><button type="button" class="gc-chip on" data-para="suelo">Tocar el suelo</button><button type="button" class="gc-chip" data-para="pared">Tocar la pared</button></div>'
        + '<small class="gc-nota">Toca la foto donde está el suelo (o la pared).</small></div>'
        + (e.sueloHex ? '<div class="gc-nota">Suelo de la foto <span class="gc-mini" style="background:' + e.sueloHex + '"></span></div>' : '')
        + (e.paredHex ? '<div class="gc-nota">Pared de la foto <span class="gc-mini" style="background:' + e.paredHex + '"></span></div>' : '') + '</div>'
        + ['pared', 'luz', 'tam', 'estilo'].map(function (k) { return chips(k, e); }).join(''), abierta('suelo', true), 'suelo')
      + seccion('Lo que quiere el cliente', chipsLista('gusta', 'Le gusta', FAM_CLIENTE, e) + chipsLista('noQuiere', 'No quiere ver', FAM_CLIENTE, e, 'Lo que no quiere no sale nunca.')
        + chipsLista('uso', 'En casa', USOS, e) + chips('acabado', e) + chips('tirador', e), abierta('cliente', false), 'cliente')
      + seccion('Ya elegido (se respeta)', selFijo('altos', 'Altos', cat, e) + selFijo('bajos', 'Bajos', cat, e) + selFijo('encimera', 'Encimera', cat, e)
        + '<div class="gc-campo"><label>Laca propia: escribe un NCS o RAL</label><div class="gc-codigo"><input id="GC-COD" placeholder="RAL 6021 · NCS S 2010-G30Y">'
        + '<button type="button" class="btn bgh bsm" data-cod="bajos">Bajos</button><button type="button" class="btn bgh bsm" data-cod="altos">Altos</button><button type="button" class="btn bgh bsm" data-cod="todo">Toda</button></div>'
        + '<small class="gc-nota" id="GC-COD-MSG">Liso mate, liso brillo o uñero en cualquier color de la carta.</small></div>', abierta('fijo', false), 'fijo')
      + seccion('Precio y materiales', '<div class="gc-campo"><label>Hasta el grupo</label><select id="GC-TOPE">'
        + '<option value="auto"' + (e.topeAuto !== false ? ' selected' : '') + '>Como el presupuesto' + (tp ? ' (' + NOMBRE_GRUPO[tp] + ')' : ' (sin muebles: todos)') + '</option>'
        + NOMBRE_GRUPO.slice(1).map(function (n, i) { return '<option value="' + (i + 1) + '"' + (e.topeAuto === false && e.tope === i + 1 ? ' selected' : '') + '>' + n + '</option>'; }).join('')
        + '</select></div>' + chipsLista('mats', 'Frentes de', MATS, e, 'Sin marcar: todos.') + chipsLista('encs', 'Encimera de', MATS_ENC, e, 'Sin marcar: todas.'), abierta('precio', false), 'precio');
    m.querySelector('.gc-form').innerHTML = html;
    m.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { cambiar(function (u) { u[b.dataset.k] = b.dataset.k === 'sueloTono' ? +b.dataset.v : b.dataset.v; if (/^suelo/.test(b.dataset.k)) u.sueloHex = null; if (b.dataset.k === 'pared') u.paredHex = null; }); }; });
    m.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { cambiar(function (u) {
      var l = u[b.dataset.l], i = l.indexOf(b.dataset.v); if (i >= 0) l.splice(i, 1); else l.push(b.dataset.v);
      if (i < 0 && (b.dataset.l === 'gusta' || b.dataset.l === 'noQuiere')) { var otro = u[b.dataset.l === 'gusta' ? 'noQuiere' : 'gusta'], j = otro.indexOf(b.dataset.v); if (j >= 0) otro.splice(j, 1); }
    }); }; });
    m.querySelectorAll('[data-fijo]').forEach(function (s) { s.onchange = function () { cambiar(function (u) { if (s.value) u.fijo[s.dataset.fijo] = s.value; else delete u.fijo[s.dataset.fijo]; }); }; });
    document.getElementById('GC-TOPE').onchange = function (ev) { var v = ev.target.value; cambiar(function (u) { if (v === 'auto') u.topeAuto = true; else { u.topeAuto = false; u.tope = +v; } }); };
    m.querySelectorAll('[data-cod]').forEach(function (b) { b.onclick = function () { usarCodigo(document.getElementById('GC-COD').value, b.dataset.cod); }; });
    // Foto: tocar el suelo o la pared para coger su color.
    var file = document.getElementById('GC-FOTO'), caja = m.querySelector('.gc-foto'), para = 'suelo';
    m.querySelector('[data-acc="gc-foto"]').onclick = function () { file.click(); };
    var sin = m.querySelector('[data-acc="gc-sin-foto"]'); if (sin) sin.onclick = function () { cambiar(function (u) { u.sueloHex = null; u.paredHex = null; }); };
    caja.querySelectorAll('[data-para]').forEach(function (b) { b.onclick = function () { para = b.dataset.para; caja.querySelectorAll('[data-para]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    file.onchange = function () {
      var f = file.files && file.files[0]; if (!f) return;
      var img = new Image(); img.onload = function () {
        var cv = caja.querySelector('canvas'), k = Math.min(1, 520 / Math.max(img.width, img.height));
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); caja.hidden = false; URL.revokeObjectURL(img.src);
      }; img.src = URL.createObjectURL(f);
    };
    caja.querySelector('canvas').onclick = function (ev) {
      var cv = ev.target, r = cv.getBoundingClientRect(), x = Math.round((ev.clientX - r.left) * cv.width / r.width), y = Math.round((ev.clientY - r.top) * cv.height / r.height);
      tomarColor(colorMedio(cv, x, y), para);
    };
  }
  // Color de la foto para el suelo o la pared (también se usa desde las pruebas).
  function tomarColor(hex, para) {
    var d = datosHex(hex);
    cambiar(function (u) {
      if (para === 'pared') { u.paredHex = hex; u.pared = d.fam === 'verde' || d.fam === 'azul' || d.tono > 1 ? 'color' : d.fam === 'blanco' ? 'blanco' : 'claro'; }
      else { u.sueloHex = hex; u.sueloTono = d.tono; u.sueloTemp = d.temp; }
    });
  }
  // Color medio de un cuadrado de 15×15 alrededor del punto tocado.
  function colorMedio(cv, x, y) {
    var r = 7, d = cv.getContext('2d').getImageData(Math.max(0, x - r), Math.max(0, y - r), r * 2 + 1, r * 2 + 1).data, s = [0, 0, 0], n = 0;
    for (var i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++; }
    return '#' + s.map(function (v) { return ('0' + Math.round(v / n).toString(16)).slice(-2); }).join('');
  }
  function usarCodigo(texto, rol) {
    var c = colorDeCodigo(texto), msg = document.getElementById('GC-COD-MSG');
    if (!c) { if (msg) msg.textContent = 'No entiendo ese código. Ejemplos: RAL 6021, NCS S 2010-G30Y.'; return; }
    var g = leer();
    if (c.id.indexOf('mio-') === 0 && !(g.mios || []).some(function (x) { return x.id === c.id; })) { g.mios = (g.mios || []).concat([c]); guardar(g); }
    cambiar(function (u) { if (rol === 'todo' || rol === 'bajos') u.fijo.bajos = c.id; if (rol === 'todo' || rol === 'altos') u.fijo.altos = c.id; });
    if (/^RAL/.test(c.codigo) && c.id.indexOf('mio-') === 0) toastGc(c.codigo + ' añadido con un gris orientativo: ajusta su tono en «Mis colores».');
  }
  function toastGc(t) { if (typeof window.toast === 'function') window.toast(t); }

  function pintar() {
    var m = document.getElementById('GC-MOD'), e = entrada(), cat = catalogo(), cb = recomendar(e, cat);
    m._combos = cb; m._e = e;
    pintarForm(e, cat);
    var cli = document.getElementById('GC-CLIENTE').value || clientePresupuesto(), elegida = window.ST && ST.colores;
    var nomSuelo = (OPC.sueloTipo.filter(function (o) { return o[0] === e.sueloTipo; })[0] || ['', ''])[1].toLowerCase();
    m.querySelector('.gc-res').innerHTML = '<div class="gc-cab-imp"><b>Propuesta de colores</b>' + (cli ? ' · ' + eh(cli) : '') + '<br><small>Suelo ' + eh(nomSuelo)
      + ', ' + ['', 'claro', 'medio', 'oscuro'][e.sueloTono] + ' · cocina ' + ({ pequena: 'pequeña', media: 'mediana', grande: 'grande' })[e.tam] + ' · estilo ' + eh(NOMBRE_ESTILO[e.estilo] || '')
      + (e.tope ? ' · hasta grupo ' + NOMBRE_GRUPO[e.tope] : '') + '</small></div>'
      + (elegida ? '<div class="gc-elegida">✓ Elegida para este presupuesto: <b>' + eh(elegida.titulo) + '</b> (' + eh(elegida.bajos && elegida.bajos.nombre) + ') <button type="button" class="btn bgh bsm" data-acc="gc-quitar-elegida">Quitar</button></div>' : '')
      + (cb.length ? '<div class="gc-combos">' + cb.map(function (c, i) { return tarjeta(c, e, i, elegida); }).join('') + '</div>'
        : '<p>No hay colores con estas condiciones. Sube el grupo, quita algún filtro o lo que no quiere ver, o añade colores en «Mis colores».</p>')
      + '<p class="gc-nota">Colores orientativos: el tono real se comprueba siempre con la muestra del fabricante.</p>';
    m.querySelectorAll('[data-elegir]').forEach(function (b) { b.onclick = function () { elegir(m._combos[+b.dataset.elegir], m._e); }; });
    var q = m.querySelector('[data-acc="gc-quitar-elegida"]'); if (q) q.onclick = function () { ST.colores = null; if (typeof markDirty === 'function') markDirty(); pintar(); };
  }
  function tarjeta(cb, e, i, elegida) {
    var es = !!(elegida && elegida.titulo === cb.titulo && elegida.bajos && elegida.bajos.id === cb.bajos.id && elegida.altos && elegida.altos.id === cb.altos.id);
    return '<div class="gc-combo' + (es ? ' elegida' : '') + '" data-combo="' + i + '"><h4>' + (i + 1) + '. ' + eh(cb.titulo) + '</h4>' + dibujo(cb, e)
      + (cb.altos.id === cb.bajos.id ? fila('Frentes', cb.bajos) : fila('Altos', cb.altos) + fila('Bajos', cb.bajos))
      + fila('Encimera', cb.encimera) + fila('Tirador', cb.tirador) + textoGrupo(cb, e.tope)
      + '<ul class="gc-por">' + cb.razones.map(function (r) { return '<li>' + eh(r) + '</li>'; }).join('') + '</ul>'
      + '<button type="button" class="btn ' + (es ? 'bgh' : 'bp') + ' bsm gc-elegir" data-elegir="' + i + '">' + (es ? '✓ Elegida' : 'Elegir para el presupuesto') + '</button></div>';
  }
  // La elegida se guarda en el presupuesto (copia: si luego cambia el catálogo, el presupuesto no cambia).
  function copia(c) { return c ? { id: c.id, nombre: c.nombre, fab: c.fab, serie: c.serie, mat: c.mat, uso: c.uso, hex: c.hex, g: c.g || null, codigo: c.codigo || null, tipoTir: c.tipoTir || null } : null; }
  function elegir(cb, e) {
    if (!window.ST) return;
    ST.colores = { titulo: cb.titulo, altos: copia(cb.altos), bajos: copia(cb.bajos), encimera: copia(cb.encimera), tirador: copia(cb.tirador), razones: cb.razones.slice(), g: cb.g,
      suelo: sueloHex(e), pared: paredHex(e), estilo: e.estilo, fecha: new Date().toISOString() };
    if (typeof markDirty === 'function') markDirty();
    toastGc('Combinación «' + cb.titulo + '» guardada en el presupuesto: sale en el PDF y en la ficha de taller.');
    pintar();
  }
  // Bloque para el PDF del cliente y para la ficha de taller.
  function htmlPresupuesto(col, taller) {
    if (!col) return '';
    var fila2 = function (et, c) {
      if (!c) return '';
      return '<tr><td style="width:44px;padding:4px"><span style="display:inline-block;width:34px;height:24px;border-radius:4px;border:1px solid #bbb;background:' + c.hex + ';-webkit-print-color-adjust:exact;print-color-adjust:exact"></span></td>'
        + '<td style="padding:4px 6px;color:#666;font-size:.8rem;width:80px">' + et + '</td><td style="padding:4px 6px"><b>' + eh(c.nombre) + '</b>' + (detalle(c) ? ' <span style="color:#777;font-size:.8rem">' + eh(detalle(c)) + '</span>' : '') + '</td></tr>';
    };
    var cb = { titulo: col.titulo, altos: col.altos, bajos: col.bajos, encimera: col.encimera, tirador: col.tirador };
    var svg = taller ? '' : dibujo(cb, { sueloHex: col.suelo, paredHex: col.pared }, 170).replace('class="gc-svg"', 'style="width:100%;max-width:300px;height:auto;border-radius:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact"');
    return '<div class="pfcolores" style="margin-top:14px;page-break-inside:avoid;break-inside:avoid">'
      + (taller ? '<h3 style="font-size:1rem;margin:14px 0 6px">Colores: ' + eh(col.titulo) + '</h3>' : '<div class="pfsec">Colores elegidos · ' + eh(col.titulo) + '</div>')
      + '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">' + (svg ? '<div style="flex:0 0 260px">' + svg + '</div>' : '')
      + '<table style="border-collapse:collapse;flex:1;min-width:240px">' + (col.altos && col.bajos && col.altos.id === col.bajos.id ? fila2('Frentes', col.bajos) : fila2('Altos', col.altos) + fila2('Bajos', col.bajos))
      + fila2('Encimera', col.encimera) + fila2('Tirador', col.tirador) + '</table></div>'
      + (taller ? '' : '<div style="font-size:.75rem;color:#888;margin-top:4px">Colores orientativos: el tono real se ve en la muestra del fabricante.</div>') + '</div>';
  }

  function texto() {
    var m = document.getElementById('GC-MOD'), cb = m._combos || [], l = ['*Propuesta de colores para tu cocina*'];
    cb.forEach(function (c, i) {
      l.push('', '*' + (i + 1) + '. ' + c.titulo + '*');
      if (c.altos.id === c.bajos.id) l.push('Frentes: ' + c.bajos.nombre + (c.bajos.fab ? ' (' + c.bajos.fab + ')' : ''));
      else l.push('Altos: ' + c.altos.nombre + (c.altos.fab ? ' (' + c.altos.fab + ')' : ''), 'Bajos: ' + c.bajos.nombre + (c.bajos.fab ? ' (' + c.bajos.fab + ')' : ''));
      if (c.encimera) l.push('Encimera: ' + c.encimera.nombre + (c.encimera.fab ? ' (' + c.encimera.fab + ')' : ''));
      if (c.tirador) l.push('Tirador: ' + c.tirador.nombre);
      c.razones.forEach(function (r) { l.push('- ' + r); });
    });
    l.push('', 'Colores orientativos: el tono real se ve en la muestra.');
    return l.join('\n');
  }

  // ── Mis colores: quitar, cambiar el tono o añadir ──
  function pintarMios() {
    var m = document.getElementById('GC-MOD'), g = leer(), quit = g.quitados || [], cat = BASE.concat(g.mios || []);
    var filas = cat.map(function (c) {
      var x = Object.assign({}, c, (g.cambios || {})[c.id] || {}), on = quit.indexOf(c.id) < 0, gr = c.uso === F ? grupoDe(x) : null;
      return '<tr data-id="' + c.id + '"><td><input type="checkbox" data-acc="gc-usar"' + (on ? ' checked' : '') + ' title="Usar en las propuestas"></td>'
        + '<td><input type="color" data-acc="gc-hex" value="' + x.hex + '" title="Tono orientativo"></td>'
        + '<td><b>' + eh(x.nombre) + '</b><br><small>' + eh(detalle(x)) + (gr ? ' · ' + NOMBRE_GRUPO[gr] : '') + '</small></td>'
        + '<td>' + ({ frente: 'Frente', encimera: 'Encimera', tirador: 'Tirador' })[x.uso] + '</td>'
        + '<td><select data-acc="gc-fam">' + Object.keys(FAM).map(function (f) { return '<option value="' + f + '"' + (f === x.fam ? ' selected' : '') + '>' + FAM[f] + '</option>'; }).join('') + '</select></td>'
        + '<td>' + (c.id.indexOf('mio-') === 0 ? '<button type="button" class="btn bdr bsm" data-acc="gc-borrar">✕</button>' : '') + '</td></tr>';
    }).join('');
    m.querySelector('.gc-res').innerHTML = '<h3>Mis colores</h3><p class="gc-nota">Quita la marca de lo que no vendas; cambia el tono o la familia si no se parece a la muestra; añade los que falten (para tu laca, mejor escribe el NCS o RAL en «Ya elegido»).</p>'
      + '<div class="gc-nuevo"><input id="GC-N-NOM" placeholder="Nombre (p. ej. Verde salvia)"><input id="GC-N-FAB" placeholder="Fabricante y serie">'
      + '<select id="GC-N-USO"><option value="frente">Frente</option><option value="encimera">Encimera</option><option value="tirador">Tirador</option></select>'
      + '<select id="GC-N-MAT">' + MATS.concat(MATS_ENC.filter(function (x) { return MATS.indexOf(x) < 0; })).concat(['Otro']).map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>'
      + '<input type="color" id="GC-N-HEX" value="#cccccc"><button type="button" class="btn bp bsm" data-acc="gc-anadir">+ Añadir</button></div>'
      + '<div class="gc-tabla"><table><tbody>' + filas + '</tbody></table></div>';
    var cambiarC = function (id, k, v) { var g2 = leer(); g2.cambios = g2.cambios || {}; var mio = (g2.mios || []).filter(function (c) { return c.id === id; })[0]; if (mio) mio[k] = v; else { g2.cambios[id] = Object.assign({}, g2.cambios[id]); g2.cambios[id][k] = v; } guardar(g2); };
    m.querySelectorAll('tr[data-id]').forEach(function (tr) {
      var id = tr.dataset.id;
      tr.querySelector('[data-acc="gc-usar"]').onchange = function (ev) { var g2 = leer(), q = g2.quitados || [], i = q.indexOf(id); if (ev.target.checked && i >= 0) q.splice(i, 1); if (!ev.target.checked && i < 0) q.push(id); g2.quitados = q; guardar(g2); };
      tr.querySelector('[data-acc="gc-hex"]').onchange = function (ev) { var d = datosHex(ev.target.value); cambiarC(id, 'hex', ev.target.value); cambiarC(id, 'tono', d.tono); cambiarC(id, 'temp', d.temp); };
      tr.querySelector('[data-acc="gc-fam"]').onchange = function (ev) { cambiarC(id, 'fam', ev.target.value); };
      var b = tr.querySelector('[data-acc="gc-borrar"]'); if (b) b.onclick = function () { var g2 = leer(); g2.mios = (g2.mios || []).filter(function (c) { return c.id !== id; }); guardar(g2); pintarMios(); };
    });
    m.querySelector('[data-acc="gc-anadir"]').onclick = function () {
      var nom = document.getElementById('GC-N-NOM').value.trim(); if (!nom) { document.getElementById('GC-N-NOM').focus(); return; }
      var hex = document.getElementById('GC-N-HEX').value, d = datosHex(hex), uso = document.getElementById('GC-N-USO').value, fab = document.getElementById('GC-N-FAB').value.trim();
      var g2 = leer(); g2.mios = g2.mios || [];
      g2.mios.push({ id: 'mio-' + Date.now().toString(36), nombre: nom, fab: fab, serie: '', mat: document.getElementById('GC-N-MAT').value, uso: uso, fam: d.fam, tono: d.tono, temp: d.temp, hex: hex, tipoTir: uso === T ? 'visto' : undefined });
      guardar(g2); pintarMios();
    };
  }

  function clientePresupuesto() { var f = document.getElementById('FC'); return f ? f.value.trim() : ''; }
  function abrir() {
    if (typeof window.closeMenus === 'function') window.closeMenus();
    var m = document.getElementById('GC-MOD');
    if (!m) {
      m = document.createElement('div'); m.id = 'GC-MOD';
      m.innerHTML = '<div class="gc-caja"><div class="gc-barra"><b>🎨 Guía de colores</b><input id="GC-CLIENTE" placeholder="Cliente (sale en lo que imprimes)">'
        + '<button type="button" class="btn bgh bsm" data-acc="gc-mios">Mis colores</button>'
        + '<button type="button" class="btn bgold bsm" data-acc="gc-wa">WhatsApp</button>'
        + '<button type="button" class="btn bp bsm" data-acc="gc-imprimir">Imprimir / PDF</button>'
        + '<button type="button" class="btn bgh bsm" data-acc="gc-cerrar">Cerrar</button></div>'
        + '<div class="gc-cuerpo"><div class="gc-form"></div><div class="gc-res"></div></div></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (ev) { if (ev.target === m) cerrar(); });
      m.querySelector('[data-acc="gc-cerrar"]').onclick = cerrar;
      m.querySelector('[data-acc="gc-imprimir"]').onclick = function () { if (m.classList.contains('mios')) { m.classList.remove('mios'); pintar(); } document.body.classList.add('gc-imprimiendo'); window.print(); setTimeout(function () { document.body.classList.remove('gc-imprimiendo'); }, 1500); };
      m.querySelector('[data-acc="gc-wa"]').onclick = function () { window.open('https://wa.me/?text=' + encodeURIComponent(texto()), '_blank'); };
      m.querySelector('[data-acc="gc-mios"]').onclick = function (ev) { var on = m.classList.toggle('mios'); ev.target.textContent = on ? '← Propuestas' : 'Mis colores'; if (on) pintarMios(); else pintar(); };
      document.getElementById('GC-CLIENTE').oninput = function () { if (!m.classList.contains('mios')) pintar(); };
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    }
    var cli = document.getElementById('GC-CLIENTE'); if (!cli.value) cli.value = clientePresupuesto();
    m.classList.remove('mios'); m.querySelector('[data-acc="gc-mios"]').textContent = 'Mis colores';
    pintar(); m.style.display = 'flex';
  }
  function cerrar() { var m = document.getElementById('GC-MOD'); if (m) m.style.display = 'none'; }

  var CSS = '#GC-MOD{position:fixed;inset:0;z-index:3000;background:rgba(15,20,25,.55);display:none;align-items:stretch;justify-content:center;padding:12px}'
    + '#GC-MOD .gc-caja{background:#fff;color:#1f2937;border-radius:12px;width:100%;max-width:1240px;display:flex;flex-direction:column;overflow:hidden}'
    + '#GC-MOD .gc-barra{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8f6f1}'
    + '#GC-MOD .gc-barra b{font-size:1.05rem;margin-right:auto}#GC-MOD #GC-CLIENTE{padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;min-width:0;flex:1 1 160px;max-width:260px}'
    + '#GC-MOD .gc-cuerpo{display:grid;grid-template-columns:320px 1fr;overflow:auto;flex:1}'
    + '#GC-MOD .gc-form{padding:8px 12px;border-right:1px solid #eee;overflow:auto}#GC-MOD .gc-res{padding:12px;overflow:auto}'
    + '#GC-MOD.mios .gc-cuerpo{grid-template-columns:1fr}#GC-MOD.mios .gc-form{display:none}'
    + '.gc-sec{border-bottom:1px solid #eee;padding:4px 0 8px}.gc-sec>summary{cursor:pointer;font-weight:800;font-size:.9rem;padding:6px 0;color:#1f3a2e}'
    + '.gc-campo{margin-bottom:9px}.gc-campo>label,.gc-fijo>label{display:block;font-weight:700;font-size:.78rem;margin-bottom:4px;color:#374151}'
    + '.gc-chips{display:flex;flex-wrap:wrap;gap:4px}.gc-chip{border:1px solid #d1d5db;background:#fff;border-radius:16px;padding:4px 10px;font-size:.78rem;cursor:pointer}'
    + '.gc-chip.on{background:#1f3a2e;border-color:#1f3a2e;color:#fff}'
    + '.gc-fijo{margin-bottom:8px}.gc-fijo select,#GC-TOPE{width:100%;padding:5px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem}'
    + '.gc-codigo{display:flex;gap:4px;flex-wrap:wrap}.gc-codigo input{flex:1 1 140px;min-width:0;padding:5px 7px;border:1px solid #d1d5db;border-radius:6px}'
    + '.gc-foto canvas{max-width:100%;border-radius:6px;cursor:crosshair;display:block;margin:6px 0}.gc-mini{display:inline-block;width:16px;height:16px;border-radius:3px;border:1px solid #999;vertical-align:middle}'
    + '.gc-combos{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}'
    + '.gc-combo{border:1px solid #e5e7eb;border-radius:10px;padding:10px;break-inside:avoid;display:flex;flex-direction:column}.gc-combo.elegida{border:2px solid #2d6a4f;background:#f3faf6}'
    + '.gc-combo h4{margin:0 0 6px;font-size:1rem}.gc-elegir{margin-top:auto;align-self:flex-start}'
    + '.gc-svg{width:100%;height:auto;border-radius:6px;display:block;margin-bottom:8px}'
    + '.gc-fila{display:flex;gap:8px;align-items:center;margin:5px 0}.gc-fila small{display:block;font-size:.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}'
    + '.gc-fila b{display:block;font-size:.88rem}.gc-fila em{display:block;font-style:normal;font-size:.74rem;color:#6b7280}'
    + '.gc-mu{flex:0 0 34px;height:34px;border-radius:6px;border:1px solid rgba(0,0,0,.2)}'
    + '.gc-grupo{font-size:.76rem;font-weight:700;color:#2d6a4f;margin:6px 0 0}.gc-grupo.sube{color:#b45309}'
    + '.gc-por{margin:8px 0;padding-left:18px;font-size:.8rem;color:#374151}.gc-por li{margin:3px 0}'
    + '.gc-nota{font-size:.76rem;color:#6b7280}.gc-cab-imp{margin-bottom:10px}.gc-elegida{background:#f3faf6;border:1px solid #b7e0c8;border-radius:8px;padding:6px 10px;margin-bottom:10px;font-size:.85rem}'
    + '.gc-nuevo{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.gc-nuevo input,.gc-nuevo select{padding:5px 7px;border:1px solid #d1d5db;border-radius:6px}'
    + '.gc-tabla table{width:100%;border-collapse:collapse;font-size:.82rem}.gc-tabla td{border-bottom:1px solid #eee;padding:4px}.gc-tabla input[type=color]{width:38px;height:28px;border:0;padding:0;background:none}'
    + '@media (max-width:760px){#GC-MOD{padding:0}#GC-MOD .gc-caja{border-radius:0}#GC-MOD .gc-cuerpo{display:block}#GC-MOD .gc-form{border-right:0;border-bottom:1px solid #eee}#GC-MOD .gc-form,#GC-MOD .gc-res{overflow:visible}}'
    + '@media print{body.gc-imprimiendo>*:not(#GC-MOD){display:none!important}body.gc-imprimiendo #GC-MOD{position:static;display:block!important;background:#fff;padding:0}'
    + 'body.gc-imprimiendo #GC-MOD .gc-barra,body.gc-imprimiendo #GC-MOD .gc-form,body.gc-imprimiendo .gc-elegir,body.gc-imprimiendo .gc-elegida{display:none!important}body.gc-imprimiendo #GC-MOD .gc-cuerpo{display:block;overflow:visible}'
    + 'body.gc-imprimiendo #GC-MOD .gc-caja{max-width:none;border-radius:0}body.gc-imprimiendo .gc-combos{grid-template-columns:repeat(3,1fr);gap:6mm}'
    + 'body.gc-imprimiendo .gc-mu,body.gc-imprimiendo .gc-svg *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';

  window.GUIA_COLORES = { BASE: BASE, FAM: FAM, recomendar: recomendar, catalogo: catalogo, filtrar: filtrar, abrir: abrir, cerrar: cerrar, texto: texto, CLAVE: CLAVE,
    grupoDe: grupoDe, grupoPresupuesto: grupoPresupuesto, colorDeCodigo: colorDeCodigo, ncsHex: ncsHex, datosHex: datosHex, htmlPresupuesto: htmlPresupuesto, elegir: elegir, tomarColor: tomarColor };
  window.abrirGuiaColores = abrir;
})();
