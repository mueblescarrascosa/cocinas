// Guía de colores (v158): a partir del suelo y de cómo es la cocina propone tres combinaciones de frentes,
// encimera y tirador con los colores de las tarifas (Briforma, Monpuertas, Dossia y encimeras Egger de Briforma),
// las dibuja y se puede imprimir o enviar al cliente. Los colores son orientativos (el tono se ha puesto a mano a
// partir del nombre): en «Mis colores» se corrigen, se quitan o se añaden. Se guarda en localStorage 'guia_colores_v1'.
(function () {
  'use strict';
  var CLAVE = 'guia_colores_v1';
  // fam: blanco, crema, gris_claro, gris, oscuro, negro, madera_clara, madera_media, madera_oscura, verde, azul, terracota, marmol, piedra, metal
  // tono: 1 claro, 2 medio, 3 oscuro · temp: c cálido, f frío, n neutro
  function C(id, nombre, fab, serie, mat, uso, fam, tono, temp, hex) { return { id: id, nombre: nombre, fab: fab, serie: serie, mat: mat, uso: uso, fam: fam, tono: tono, temp: temp, hex: hex }; }
  var F = 'frente', E = 'encimera', T = 'tirador';
  var BASE = [
    // ── Briforma · laminados ──
    C('bf-suiza-blanco', 'Blanco', 'Briforma', 'Suiza', 'Laminado', F, 'blanco', 1, 'n', '#f4f3ef'),
    C('bf-suiza-trufa', 'Roble trufa', 'Briforma', 'Suiza', 'Laminado', F, 'madera_media', 2, 'n', '#8f7a66'),
    C('bf-suiza-natural', 'Roble natural', 'Briforma', 'Suiza', 'Laminado', F, 'madera_clara', 1, 'c', '#c9a77c'),
    C('bf-suiza-luna', 'Gris luna', 'Briforma', 'Suiza', 'Laminado', F, 'gris_claro', 1, 'f', '#c9cbcb'),
    C('bf-austria-amundsen', 'Roble Amundsen', 'Briforma', 'Austria', 'Laminado', F, 'madera_clara', 1, 'c', '#c7a985'),
    C('bf-austria-antracita', 'Antracita', 'Briforma', 'Austria', 'Laminado', F, 'oscuro', 3, 'f', '#3c3f42'),
    C('bf-austria-mallado', 'Roble mallado', 'Briforma', 'Austria', 'Laminado', F, 'madera_media', 2, 'c', '#a07f5c'),
    C('bf-roma-glacial', 'Azul glacial', 'Briforma', 'Roma', 'Laminado', F, 'azul', 1, 'f', '#a9bccb'),
    C('bf-roma-beige', 'Beige', 'Briforma', 'Roma', 'Laminado', F, 'crema', 1, 'c', '#d9cbb3'),
    C('bf-roma-caramelo', 'Caramelo', 'Briforma', 'Roma', 'Laminado', F, 'terracota', 2, 'c', '#b98a5e'),
    C('bf-roma-oleo', 'Verde óleo', 'Briforma', 'Roma', 'Laminado', F, 'verde', 2, 'n', '#6f7a5c'),
    C('bf-roma-miel', 'Roble miel', 'Briforma', 'Roma', 'Laminado', F, 'madera_media', 2, 'c', '#b88a55'),
    C('bf-roma-bolnat', 'Bolívar natural', 'Briforma', 'Roma', 'Laminado', F, 'madera_media', 2, 'c', '#9c7553'),
    C('bf-roma-bolcas', 'Bolívar castaño', 'Briforma', 'Roma', 'Laminado', F, 'madera_oscura', 3, 'c', '#5e4331'),
    C('bf-boston-nebraska', 'Roble Nebraska', 'Briforma', 'Boston', 'Laminado', F, 'madera_media', 2, 'c', '#b08d68'),
    C('bf-boston-artico', 'Gris ártico', 'Briforma', 'Boston', 'Laminado', F, 'gris_claro', 1, 'f', '#d3d6d6'),
    C('bf-alabama-blanco', 'Blanco premium', 'Briforma', 'Alabama', 'Laminado', F, 'blanco', 1, 'n', '#f6f5f1'),
    C('bf-alabama-coco', 'Coco', 'Briforma', 'Alabama', 'Laminado', F, 'crema', 1, 'c', '#cfc3b0'),
    C('bf-alabama-piedra', 'Gris piedra', 'Briforma', 'Alabama', 'Laminado', F, 'gris', 2, 'n', '#8e8b84'),
    C('bf-alabama-arcilla', 'Arcilla', 'Briforma', 'Alabama', 'Laminado', F, 'terracota', 2, 'c', '#b98f78'),
    C('bf-alabama-mineral', 'Verde mineral', 'Briforma', 'Alabama', 'Laminado', F, 'verde', 2, 'f', '#7f8f84'),
    C('bf-alabama-hamilton', 'Roble Hamilton', 'Briforma', 'Alabama', 'Laminado', F, 'madera_media', 2, 'c', '#a98462'),
    C('bf-toronto-cemento', 'Cemento claro', 'Briforma', 'Toronto', 'Laminado', F, 'gris', 2, 'n', '#a8a6a0'),
    C('bf-toronto-tiza', 'Tiza', 'Briforma', 'Toronto', 'Laminado', F, 'crema', 1, 'c', '#e7e2d8'),
    C('bf-petra-marmol', 'Mármol blanco', 'Briforma', 'Petra', 'Laminado', F, 'marmol', 1, 'f', '#ecebe8'),
    C('bf-petra-pizarra', 'Pizarra', 'Briforma', 'Petra', 'Laminado', F, 'oscuro', 3, 'f', '#45474a'),
    C('bf-canada-nudos', 'Roble nudos', 'Briforma', 'Canadá', 'Laminado', F, 'madera_media', 2, 'c', '#b18e69'),
    C('bf-canada-eucalipto', 'Eucalipto', 'Briforma', 'Canadá', 'Laminado', F, 'madera_clara', 1, 'n', '#bfae98'),
    C('bf-canada-gris', 'Roble gris', 'Briforma', 'Canadá', 'Laminado', F, 'madera_media', 2, 'f', '#8f8a82'),
    C('bf-jaen-roble', 'Roble', 'Briforma', 'Jaén', 'Laminado', F, 'madera_media', 2, 'c', '#ad8a64'),
    C('bf-jaen-nogal', 'Nogal', 'Briforma', 'Jaén', 'Laminado', F, 'madera_oscura', 3, 'c', '#6b4c36'),
    C('bf-sil-halifax', 'Halifax natural', 'Briforma', 'Sil (poro sincronizado)', 'Laminado', F, 'madera_media', 2, 'c', '#a7845f'),
    C('bf-sil-tabaco', 'Halifax tabaco', 'Briforma', 'Sil (poro sincronizado)', 'Laminado', F, 'madera_oscura', 3, 'c', '#6a4b33'),
    C('bf-sil-blanco', 'Blanco premium', 'Briforma', 'Sil (poro sincronizado)', 'Laminado', F, 'blanco', 1, 'n', '#f6f5f1'),
    C('bf-sil-casella', 'Casella natural', 'Briforma', 'Sil (poro sincronizado)', 'Laminado', F, 'madera_clara', 1, 'c', '#c3a27c'),
    C('bf-sil-casnogal', 'Casella nogal', 'Briforma', 'Sil (poro sincronizado)', 'Laminado', F, 'madera_oscura', 3, 'c', '#6f5038'),
    C('bf-berlin-natural', 'Natural', 'Briforma', 'Berlín (uñero integrado)', 'Laminado', F, 'madera_clara', 1, 'c', '#c4a37f'),
    C('bf-berlin-tabaco', 'Tabaco', 'Briforma', 'Berlín (uñero integrado)', 'Laminado', F, 'madera_oscura', 3, 'c', '#6b4c35'),
    C('bf-berlin-conac', 'Coñac', 'Briforma', 'Berlín (uñero integrado)', 'Laminado', F, 'madera_media', 2, 'c', '#93633f'),
    C('bf-berlin-blanco', 'Blanco', 'Briforma', 'Berlín (uñero integrado)', 'Laminado', F, 'blanco', 1, 'n', '#f4f3ef'),
    C('bf-lux-blanco', 'Blanco', 'Briforma', 'Luxemburgo (supermate)', 'Laminado', F, 'blanco', 1, 'n', '#f3f3f1'),
    C('bf-lux-grisclaro', 'Gris claro', 'Briforma', 'Luxemburgo (supermate)', 'Laminado', F, 'gris_claro', 1, 'n', '#cfcfcc'),
    C('bf-lux-aguamarina', 'Aguamarina', 'Briforma', 'Luxemburgo (supermate)', 'Laminado', F, 'azul', 2, 'f', '#8fb3ad'),
    C('bf-lux-negro', 'Negro', 'Briforma', 'Luxemburgo (supermate)', 'Laminado', F, 'negro', 3, 'n', '#222324'),
    C('bf-lux-forest', 'Forest', 'Briforma', 'Luxemburgo (supermate)', 'Laminado', F, 'verde', 3, 'f', '#2f4a3e'),
    C('bf-mino-blanco', 'Blanco brillo', 'Briforma', 'Miño (estratificado brillo)', 'Laminado', F, 'blanco', 1, 'f', '#f7f7f7'),
    C('bf-mino-perla', 'Gris perla brillo', 'Briforma', 'Miño (estratificado brillo)', 'Laminado', F, 'gris_claro', 1, 'f', '#cdcccb'),
    C('bf-lugo-blanco', 'Blanco mate', 'Briforma', 'Lugo (estratificado mate)', 'Laminado', F, 'blanco', 1, 'n', '#f2f2ef'),
    C('bf-lugo-perla', 'Gris perla mate', 'Briforma', 'Lugo (estratificado mate)', 'Laminado', F, 'gris_claro', 1, 'n', '#cbc9c5'),
    C('bf-materia-aura', 'Blanco Aura', 'Briforma', 'Materia (ultramate)', 'Laminado', F, 'blanco', 1, 'n', '#f1f0ec'),
    C('bf-materia-alba', 'Alba', 'Briforma', 'Materia (ultramate)', 'Laminado', F, 'crema', 1, 'c', '#e8e2d6'),
    C('bf-materia-serena', 'Serena', 'Briforma', 'Materia (ultramate)', 'Laminado', F, 'gris_claro', 1, 'c', '#cbc4b8'),
    C('bf-materia-taupe', 'Taupe', 'Briforma', 'Materia (ultramate)', 'Laminado', F, 'gris', 2, 'c', '#8f8476'),
    C('bf-materia-plomo', 'Plomo', 'Briforma', 'Materia (ultramate)', 'Laminado', F, 'gris', 2, 'f', '#6f7275'),
    C('bf-materia-carbon', 'Carbón', 'Briforma', 'Materia (ultramate)', 'Laminado', F, 'negro', 3, 'n', '#2b2b2c'),
    C('bf-sidney-blanco', 'Blanco mate', 'Briforma', 'Sidney (PET)', 'PET', F, 'blanco', 1, 'n', '#f3f3f1'),
    C('bf-sidney-coco', 'Coco mate', 'Briforma', 'Sidney (PET)', 'PET', F, 'crema', 1, 'c', '#cdc1ad'),
    C('bf-sidney-grisosc', 'Gris oscuro mate', 'Briforma', 'Sidney (PET)', 'PET', F, 'oscuro', 3, 'n', '#4a4b4c'),
    C('bf-sidney-cacao', 'Cacao', 'Briforma', 'Sidney (PET)', 'PET', F, 'madera_oscura', 3, 'c', '#5b4436'),
    C('bf-sidney-latte', 'Café latte', 'Briforma', 'Sidney (PET)', 'PET', F, 'crema', 2, 'c', '#b9a58c'),
    C('bf-sidney-liquen', 'Verde liquen', 'Briforma', 'Sidney (PET)', 'PET', F, 'verde', 2, 'n', '#8e9478'),
    C('bf-sidney-terra', 'Terra', 'Briforma', 'Sidney (PET)', 'PET', F, 'terracota', 2, 'c', '#a8735a'),
    C('bf-sidney-ceniza', 'Ceniza', 'Briforma', 'Sidney (PET)', 'PET', F, 'gris', 2, 'n', '#9a9690'),
    C('bf-sidney-negro', 'Negro mate', 'Briforma', 'Sidney (PET)', 'PET', F, 'negro', 3, 'n', '#232323'),
    // ── Monpuertas · laminados ──
    C('mp-lam-blanco', 'Blanco 3091', 'Monpuertas', 'Laminado', 'Laminado', F, 'blanco', 1, 'n', '#f3f2ee'),
    C('mp-lam-pergamon', 'Pergamon R0810', 'Monpuertas', 'Laminado', 'Laminado', F, 'crema', 1, 'c', '#e4dccb'),
    C('mp-lam-antracita', 'Antracita R0806', 'Monpuertas', 'Laminado', 'Laminado', F, 'oscuro', 3, 'f', '#3d4043'),
    C('mp-lam-negro', 'Negro R0805', 'Monpuertas', 'Laminado', 'Laminado', F, 'negro', 3, 'n', '#232323'),
    C('mp-ant-blanco', 'Blanco antihuella R1001', 'Monpuertas', 'Antihuella', 'Laminado', F, 'blanco', 1, 'n', '#f1f0ed'),
    C('mp-ant-negro', 'Negro antihuella R1004', 'Monpuertas', 'Antihuella', 'Laminado', F, 'negro', 3, 'n', '#242424'),
    C('mp-ant-antracita', 'Antracita antihuella R1006', 'Monpuertas', 'Antihuella', 'Laminado', F, 'oscuro', 3, 'f', '#3b3e41'),
    C('mp-ant-piedra', 'Gris piedra antihuella R1008', 'Monpuertas', 'Antihuella', 'Laminado', F, 'gris', 2, 'n', '#8b8881'),
    C('mp-ant-plomo', 'Plomo antihuella R1015', 'Monpuertas', 'Antihuella', 'Laminado', F, 'gris', 2, 'f', '#6c6f72'),
    C('mp-ant-tierra', 'Tierra antihuella R1018', 'Monpuertas', 'Antihuella', 'Laminado', F, 'terracota', 2, 'c', '#9b7a63'),
    C('mp-ant-verdehumo', 'Verde humo antihuella R1019', 'Monpuertas', 'Antihuella', 'Laminado', F, 'verde', 2, 'f', '#7d877e'),
    // ── Monpuertas · laca ──
    C('mp-laca-blanco', 'Blanco', 'Monpuertas', 'Laca G1', 'Laca', F, 'blanco', 1, 'n', '#f5f5f2'),
    C('mp-laca-hueso', 'Hueso nº 8', 'Monpuertas', 'Laca G2', 'Laca', F, 'crema', 1, 'c', '#ece4d2'),
    C('mp-laca-azul', 'Azul nº 9', 'Monpuertas', 'Laca G2', 'Laca', F, 'azul', 2, 'f', '#7d93a6'),
    C('mp-laca-beig', 'Beige nº 55', 'Monpuertas', 'Laca G2', 'Laca', F, 'crema', 1, 'c', '#d8c9ae'),
    C('mp-laca-marron', 'Marrón nº 58', 'Monpuertas', 'Laca G2', 'Laca', F, 'madera_oscura', 3, 'c', '#6a5241'),
    C('mp-laca-pergamon', 'Pergamon nº 1006', 'Monpuertas', 'Laca G2', 'Laca', F, 'crema', 1, 'c', '#e5dcc8'),
    C('mp-laca-arena', 'Arena nº 1007', 'Monpuertas', 'Laca G2', 'Laca', F, 'crema', 1, 'c', '#d6c6a8'),
    C('mp-laca-verde', 'Verde nº 88', 'Monpuertas', 'Laca G2', 'Laca', F, 'verde', 2, 'n', '#7f8e72'),
    C('mp-laca-antracita', 'Antracita nº 1008', 'Monpuertas', 'Laca G2', 'Laca', F, 'oscuro', 3, 'f', '#3c3f42'),
    C('mp-laca-capuchino', 'Capuchino nº 1009', 'Monpuertas', 'Laca G2', 'Laca', F, 'gris', 2, 'c', '#a3907c'),
    C('mp-laca-perla', 'Gris perla nº 1010', 'Monpuertas', 'Laca G2', 'Laca', F, 'gris_claro', 1, 'n', '#cfcdc8'),
    C('mp-laca-roto', 'Blanco roto nº 1011', 'Monpuertas', 'Laca G2', 'Laca', F, 'crema', 1, 'c', '#efebe1'),
    C('mp-laca-vcemento', 'Verde cemento nº 1016', 'Monpuertas', 'Laca G2', 'Laca', F, 'verde', 2, 'f', '#959c92'),
    C('mp-laca-aguamarina', 'Aguamarina nº 1017', 'Monpuertas', 'Laca G2', 'Laca', F, 'azul', 2, 'f', '#9db8b3'),
    C('mp-laca-rojo', 'Rojo nº 1005', 'Monpuertas', 'Laca G3', 'Laca', F, 'terracota', 3, 'c', '#9b2f2a'),
    C('mp-laca-pacifico', 'Azul Pacífico nº 1013', 'Monpuertas', 'Laca G3', 'Laca', F, 'azul', 3, 'f', '#2f4f6b'),
    C('mp-laca-polar', 'Blanco polar', 'Monpuertas', 'Laca G3', 'Laca', F, 'blanco', 1, 'f', '#fafafa'),
    C('mp-laca-negro', 'Negro', 'Monpuertas', 'Laca G3', 'Laca', F, 'negro', 3, 'n', '#1f1f1f'),
    C('mp-laca-grafito', 'Grafito', 'Monpuertas', 'Laca G3', 'Laca', F, 'oscuro', 3, 'n', '#4a4a48'),
    // ── Monpuertas · madera ──
    C('mp-mad-roble', 'Roble claro', 'Monpuertas', 'Madera G1', 'Madera', F, 'madera_clara', 1, 'c', '#cdae86'),
    C('mp-mad-nogal', 'Nature nogal', 'Monpuertas', 'Madera G1', 'Madera', F, 'madera_oscura', 3, 'c', '#6c4e38'),
    C('mp-mad-latte', 'Nature latte', 'Monpuertas', 'Madera G2', 'Madera', F, 'madera_clara', 1, 'c', '#d4c0a3'),
    C('mp-mad-ceniza', 'Nature ceniza', 'Monpuertas', 'Madera G2', 'Madera', F, 'madera_media', 2, 'f', '#9d958a'),
    C('mp-mad-blanco', 'Nature blanco (poro)', 'Monpuertas', 'Madera G3', 'Madera', F, 'blanco', 1, 'c', '#efebe3'),
    C('mp-mad-vcemento', 'Nature verde cemento', 'Monpuertas', 'Madera G3', 'Madera', F, 'verde', 2, 'f', '#939a90'),
    // ── Dossia · laca (colores estándar) ──
    C('do-blanco', 'Blanco estándar nº 00', 'Dossia', 'Laca estándar', 'Laca', F, 'blanco', 1, 'n', '#f5f5f2'),
    C('do-roto', 'Blanco roto nº 02', 'Dossia', 'Laca estándar', 'Laca', F, 'crema', 1, 'c', '#efeadf'),
    C('do-viejo', 'Blanco viejo nº 03', 'Dossia', 'Laca estándar', 'Laca', F, 'crema', 1, 'c', '#e8e0cf'),
    C('do-perla', 'Gris perla nº 04', 'Dossia', 'Laca estándar', 'Laca', F, 'gris_claro', 1, 'n', '#cfcdc8'),
    C('do-negro', 'Negro nº 05', 'Dossia', 'Laca estándar', 'Laca', F, 'negro', 3, 'n', '#1f1f1f'),
    C('do-grey', 'Grey nº 06', 'Dossia', 'Laca estándar', 'Laca', F, 'gris', 2, 'f', '#8d9093'),
    C('do-marengo', 'Gris marengo nº 07', 'Dossia', 'Laca estándar', 'Laca', F, 'oscuro', 3, 'f', '#4b4f54'),
    C('do-hueso', 'Hueso nº 08', 'Dossia', 'Laca estándar', 'Laca', F, 'crema', 1, 'c', '#ebe3d0'),
    C('do-oceanic', 'Oceanic nº 09', 'Dossia', 'Laca estándar', 'Laca', F, 'azul', 3, 'f', '#33505f'),
    C('do-chocolate', 'Chocolate nº 10', 'Dossia', 'Laca estándar', 'Laca', F, 'madera_oscura', 3, 'c', '#4f3a2f'),
    C('do-azulclaro', 'Azul claro nº 15', 'Dossia', 'Laca estándar', 'Laca', F, 'azul', 1, 'f', '#b9c9d4'),
    C('do-terra', 'Marrón terra nº 17', 'Dossia', 'Laca estándar', 'Laca', F, 'terracota', 2, 'c', '#8e6a52'),
    C('do-vison', 'Visón nº 20', 'Dossia', 'Laca estándar', 'Laca', F, 'gris', 2, 'c', '#9d9183'),
    C('do-capuchino', 'Capuchino nº 21', 'Dossia', 'Laca estándar', 'Laca', F, 'gris', 2, 'c', '#a5927d'),
    C('do-plomo', 'Plomo claro nº 22', 'Dossia', 'Laca estándar', 'Laca', F, 'gris', 2, 'f', '#a3a6a8'),
    C('do-aguamarina', 'Aguamarina nº 23', 'Dossia', 'Laca estándar', 'Laca', F, 'azul', 2, 'f', '#9fbab4'),
    C('do-cachemir', 'Cachemir nº 30', 'Dossia', 'Laca estándar', 'Laca', F, 'crema', 1, 'c', '#d8ccba'),
    C('do-crema', 'Crema oscuro nº 31', 'Dossia', 'Laca estándar', 'Laca', F, 'crema', 2, 'c', '#d2c09d'),
    C('do-piedra', 'Piedra nº 33', 'Dossia', 'Laca estándar', 'Laca', F, 'gris', 2, 'c', '#b3aa9b'),
    C('do-vnature', 'Verde nature nº 34', 'Dossia', 'Laca estándar', 'Laca', F, 'verde', 2, 'n', '#8a957a'),
    C('do-arcilla', 'Rojo arcilla nº 36', 'Dossia', 'Laca estándar', 'Laca', F, 'terracota', 2, 'c', '#a8604b'),
    C('do-salvia', 'Verde salvia nº 40', 'Dossia', 'Laca estándar', 'Laca', F, 'verde', 2, 'n', '#9daa94'),
    C('do-vmedio', 'Verde medio nº 42', 'Dossia', 'Laca estándar', 'Laca', F, 'verde', 2, 'n', '#6f8266'),
    C('do-azulpiedra', 'Azul piedra nº 45', 'Dossia', 'Laca estándar', 'Laca', F, 'azul', 2, 'f', '#6e8391'),
    C('do-musgo', 'Verde musgo nº 46', 'Dossia', 'Laca estándar', 'Laca', F, 'verde', 3, 'c', '#4f5a3c'),
    C('do-cafe', 'Café nº 51', 'Dossia', 'Laca estándar', 'Laca', F, 'madera_oscura', 3, 'c', '#6a5544'),
    C('do-terracota', 'Terracota nova nº 60', 'Dossia', 'Laca estándar', 'Laca', F, 'terracota', 2, 'c', '#b5684b'),
    C('do-griosc', 'Gris oscuro nº 67', 'Dossia', 'Laca estándar', 'Laca', F, 'oscuro', 3, 'n', '#4c4c4b'),
    C('do-varcilla', 'Verde arcilla nº 73', 'Dossia', 'Laca estándar', 'Laca', F, 'verde', 2, 'c', '#8f8d6f'),
    C('do-pergamon', 'Pergamon nº 216', 'Dossia', 'Laca estándar', 'Laca', F, 'crema', 1, 'c', '#e4dbc6'),
    // ── Encimeras (Briforma: hidrófugas Egger y Quarz) ──
    C('en-marmol', 'Mármol blanco F-812', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'marmol', 1, 'f', '#ecebe8'),
    C('en-pizarra', 'Pizarra F-235', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'oscuro', 3, 'f', '#45474a'),
    C('en-hamilton', 'Roble Hamilton H-3303', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'madera_media', 2, 'c', '#a98462'),
    C('en-roblenat', 'Roble natural H-1145', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'madera_clara', 1, 'c', '#c6a47c'),
    C('en-halifax', 'Halifax natural H-1180', 'Briforma', 'Encimera Egger (poro sinc.)', 'Laminado hidrófugo', E, 'madera_media', 2, 'c', '#a7845f'),
    C('en-halifaxt', 'Halifax tabaco H-1181', 'Briforma', 'Encimera Egger (poro sinc.)', 'Laminado hidrófugo', E, 'madera_oscura', 3, 'c', '#6a4b33'),
    C('en-casella', 'Casella natural H-1367', 'Briforma', 'Encimera Egger (poro sinc.)', 'Laminado hidrófugo', E, 'madera_clara', 1, 'c', '#c3a27c'),
    C('en-casellan', 'Casella nogal H-1386', 'Briforma', 'Encimera Egger (poro sinc.)', 'Laminado hidrófugo', E, 'madera_oscura', 3, 'c', '#6f5038'),
    C('en-blanco', 'Blanco premium W-1000', 'Briforma', 'Encimera Egger PerfectSense', 'Laminado hidrófugo', E, 'blanco', 1, 'n', '#f6f5f1'),
    C('en-platino', 'Blanco platino W-980', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'blanco', 1, 'n', '#efeeea'),
    C('en-grisclaro', 'Gris claro U-708', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'gris_claro', 1, 'n', '#c4c3c0'),
    C('en-grafito', 'Gris grafito U-961', 'Briforma', 'Encimera Egger PerfectSense', 'Laminado hidrófugo', E, 'oscuro', 3, 'n', '#4a4b4c'),
    C('en-negro', 'Negro U-999', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'negro', 3, 'n', '#222222'),
    C('en-hormigon', 'Hormigón claro F-186', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'piedra', 1, 'n', '#b8b5ae'),
    C('en-hormigonosc', 'Hormigón oscuro F-275', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'piedra', 3, 'n', '#5c5b58'),
    C('en-pietra', 'Piedra antracita F-205', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'piedra', 3, 'f', '#4e4f50'),
    C('en-metalrock', 'Metal antracita F-121', 'Briforma', 'Encimera Egger', 'Laminado hidrófugo', E, 'piedra', 3, 'f', '#4a4a4a'),
    C('en-quarzb', 'Quarz blanco', 'Briforma', 'Encimera 30 mm', 'Laminado', E, 'piedra', 1, 'n', '#e9e7e2'),
    C('en-quarzn', 'Quarz negro', 'Briforma', 'Encimera 30 mm', 'Laminado', E, 'negro', 3, 'n', '#2a2a2a'),
    // ── Tiradores ──
    C('ti-gola', 'Gola o uñero (sin tirador)', '', 'Tirador', '', T, 'gola', 0, 'n', '#9aa0a6'),
    C('ti-inox', 'Inox', '', 'Tirador', 'Metal', T, 'metal', 1, 'f', '#b9bcbe'),
    C('ti-aluminio', 'Aluminio', '', 'Tirador', 'Metal', T, 'metal', 1, 'f', '#c4c6c7'),
    C('ti-negro', 'Negro', '', 'Tirador', 'Metal', T, 'negro', 3, 'n', '#1f1f1f'),
    C('ti-antracita', 'Antracita', '', 'Tirador', 'Metal', T, 'oscuro', 3, 'n', '#3d3f41'),
    C('ti-blanco', 'Blanco', '', 'Tirador', '', T, 'blanco', 1, 'n', '#f2f2f0'),
    C('ti-oro', 'Oro / latón', '', 'Tirador', 'Metal', T, 'oro', 2, 'c', '#c3a35a'),
    C('ti-bronce', 'Bronce', '', 'Tirador', 'Metal', T, 'bronce', 3, 'c', '#7a5b3c'),
    C('ti-roble', 'Roble', '', 'Tirador', 'Madera', T, 'madera_media', 2, 'c', '#b08d68'),
  ];
  var FAM = { blanco: 'Blanco', crema: 'Crema y beige', gris_claro: 'Gris claro', gris: 'Gris medio', oscuro: 'Antracita', negro: 'Negro', madera_clara: 'Madera clara', madera_media: 'Madera media', madera_oscura: 'Madera oscura', verde: 'Verde', azul: 'Azul', terracota: 'Terracota y tierra', marmol: 'Mármol', piedra: 'Piedra y hormigón', metal: 'Metal', oro: 'Oro', bronce: 'Bronce', gola: 'Gola' };
  var esMadera = function (f) { return /^madera/.test(f); };
  var claros = ['blanco', 'crema', 'gris_claro', 'marmol'];

  // ── Lo guardado: colores añadidos, quitados y lo último elegido ──
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') || {}; } catch (e) { return {}; } }
  function guardar(o) {
    try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {}   // se sube sola a la nube (CLAVES_SYNC)
  }
  function catalogo() {
    var g = leer(), quitados = g.quitados || [], cambios = g.cambios || {};
    return BASE.map(function (c) { return cambios[c.id] ? Object.assign({}, c, cambios[c.id]) : c; })
      .concat(g.mios || []).filter(function (c) { return quitados.indexOf(c.id) < 0; });
  }

  // ── Suelo: un color de muestra según lo elegido ──
  var SUELO_HEX = {
    madera: { 1: '#d2b48c', 2: '#a57b52', 3: '#5f4330' }, piedra: { 1: '#ddd6c9', 2: '#a59d90', 3: '#57534d' },
    cemento: { 1: '#c9c7c2', 2: '#97958f', 3: '#5a5a58' }, ceramica: { 1: '#e9e6df', 2: '#b9b2a6', 3: '#4c4a47' }, barro: { 1: '#d8a27a', 2: '#b5714b', 3: '#7d4a32' },
  };
  function sueloHex(s) { var t = SUELO_HEX[s.tipo] || SUELO_HEX.ceramica; return t[s.tono] || t[2]; }
  var PARED_HEX = { blanco: '#f7f6f2', claro: '#ebe4d6', color: '#c9d3cb', azulejo: '#e3e1dc' };

  // ── Recomendación ──
  // e: { sueloTipo: madera|piedra|cemento|ceramica|barro, sueloTono: 1|2|3, sueloTemp: c|f|n, pared, luz: poca|normal|mucha,
  //      tam: pequena|media|grande, estilo: moderno|nordico|clasico|industrial|rustico, mats: [Laminado, Laca, ...] o vacío }
  var ESTILO = {
    moderno: { fr: ['blanco', 'gris_claro', 'gris', 'oscuro', 'negro', 'madera_media'], en: ['marmol', 'piedra', 'blanco', 'negro', 'oscuro'], ti: ['gola', 'negro', 'inox', 'antracita'] },
    nordico: { fr: ['blanco', 'crema', 'gris_claro', 'madera_clara', 'verde', 'azul'], en: ['madera_clara', 'blanco', 'piedra'], ti: ['roble', 'negro', 'gola', 'blanco'] },
    clasico: { fr: ['crema', 'blanco', 'verde', 'azul', 'gris_claro'], en: ['marmol', 'piedra', 'madera_media'], ti: ['oro', 'bronce', 'inox'] },
    industrial: { fr: ['oscuro', 'negro', 'gris', 'madera_media', 'madera_oscura'], en: ['piedra', 'madera_media', 'oscuro'], ti: ['negro', 'antracita', 'gola'] },
    rustico: { fr: ['madera_media', 'crema', 'verde', 'terracota', 'madera_oscura'], en: ['madera_media', 'piedra', 'marmol'], ti: ['bronce', 'negro', 'roble'] },
    minimalista: { fr: ['blanco', 'gris_claro', 'negro', 'oscuro', 'gris'], en: ['blanco', 'negro', 'oscuro', 'piedra'], ti: ['gola'] },
    boho: { fr: ['crema', 'terracota', 'verde', 'madera_clara', 'blanco'], en: ['blanco', 'madera_clara', 'piedra', 'marmol'], ti: ['bronce', 'roble', 'oro'] },
    japandi: { fr: ['madera_clara', 'negro', 'oscuro', 'crema', 'gris'], en: ['piedra', 'madera_clara', 'negro', 'blanco'], ti: ['negro', 'gola', 'roble'] },
    vintage: { fr: ['verde', 'azul', 'crema', 'terracota', 'blanco'], en: ['marmol', 'madera_media', 'blanco'], ti: ['oro', 'bronce', 'inox'] },
  };
  function puntuar(c, e, quiero) {
    var s = 0, est = ESTILO[e.estilo] || ESTILO.moderno, lista = c.uso === E ? est.en : c.uso === T ? est.ti : est.fr;
    var k = lista.indexOf(c.fam); if (k >= 0) s += 6 - k;
    var qi = quiero.fams ? quiero.fams.indexOf(c.fam) : -1; if (qi >= 0) s += Math.max(3, 9 - qi * 2);   // lo primero de la lista, antes
    if (c.uso === F && e.sueloTipo === 'barro' && c.fam === 'terracota') s -= 12;   // el mismo tono que el barro choca
    if (quiero.tono && c.tono === quiero.tono) s += 4;
    if (quiero.fab && c.fab === quiero.fab) s += 10;   // altos y bajos del mismo fabricante: un solo pedido
    if (quiero.noFams && quiero.noFams.indexOf(c.fam) >= 0) s -= 30;
    if (c.uso === F && e.mats && e.mats.length && e.mats.indexOf(c.mat) < 0) s -= 50;
    if (e.sueloTemp && c.temp === e.sueloTemp) s += 2;
    if (e.sueloTemp && e.sueloTemp !== 'n' && c.temp !== 'n' && c.temp !== e.sueloTemp) s -= 2;
    // Dos maderas distintas casi iguales chocan: suelo de madera → frentes de madera solo si el tono es muy distinto.
    if (c.uso !== T && e.sueloTipo === 'madera' && esMadera(c.fam) && Math.abs(c.tono - e.sueloTono) < 2) s -= 12;
    // Frentes muy oscuros en una cocina pequeña o con poca luz la cierran.
    if (c.uso === F && c.tono === 3 && (e.luz === 'poca' || e.tam === 'pequena') && !quiero.dejarOscuro) s -= 10;
    return s;
  }
  function mejor(lista, e, quiero, evitar) {
    var c = lista.filter(function (x) { return !evitar || evitar.indexOf(x.id) < 0; })
      .map(function (x) { return [puntuar(x, e, quiero), x]; }).sort(function (a, b) { return b[0] - a[0] || a[1].nombre.localeCompare(b[1].nombre); });
    return c.length ? c[0][1] : null;
  }
  function recomendar(e, cat) {
    cat = cat || catalogo();
    var fr = cat.filter(function (c) { return c.uso === F; }), en = cat.filter(function (c) { return c.uso === E; }), ti = cat.filter(function (c) { return c.uso === T; });
    var oscuroSuelo = e.sueloTono === 3, claroSuelo = e.sueloTono === 1, cerrada = e.luz === 'poca' || e.tam === 'pequena';
    var usados = [], combos = [];
    function encimeraPara(frentes, extra) {
      var tonos = frentes.map(function (f) { return f.tono; }), todoClaro = tonos.every(function (t) { return t === 1; }), todoOscuro = tonos.every(function (t) { return t === 3; });
      var q = todoClaro ? { fams: esMadera(frentes[0].fam) ? ['marmol', 'piedra', 'blanco'] : ['madera_media', 'madera_clara', 'marmol', 'piedra', 'oscuro'] }
        : todoOscuro || tonos.indexOf(3) >= 0 ? { fams: ['marmol', 'madera_media', 'madera_clara', 'piedra'], tono: 1 } : { fams: ['marmol', 'piedra', 'madera_media', 'blanco'] };
      // La encimera no repite el color de los frentes.
      q.noFams = frentes.map(function (f) { return f.fam; }).filter(function (f) { return !esMadera(f) || frentes.length === 1; });
      return mejor(en, e, Object.assign(q, extra || {}), []);
    }
    function tiradorPara(frentes, enc) {
      var madera = frentes.some(function (f) { return esMadera(f.fam); }), claro = frentes.every(function (f) { return f.tono === 1; });
      var q = { fams: e.estilo === 'minimalista' ? ['gola'] : ['clasico', 'rustico', 'vintage', 'boho'].indexOf(e.estilo) >= 0 ? (ESTILO[e.estilo].ti) : e.estilo === 'japandi' ? ['negro', 'gola'] : madera ? ['negro', 'gola'] : claro ? ['gola', 'negro', 'inox'] : ['gola', 'inox', 'oro'] };
      return mejor(ti, e, q, []);
    }
    // 1. Luminosa: frentes claros en toda la cocina.
    var r1 = [], a = mejor(fr, e, { fams: claros, tono: 1 }, usados);
    if (a) {
      usados.push(a.id);
      r1.push(cerrada ? 'Con poca luz o poco espacio, los frentes claros hacen la cocina más grande y luminosa.' : 'Frentes claros: la cocina se ve amplia y limpia, y no pasa de moda.');
      if (oscuroSuelo) r1.push('Contrastan con el suelo oscuro, que gana protagonismo.');
      if (claroSuelo) r1.push('Con un suelo tan claro, la encimera pone el contraste para que no quede todo plano.');
      var en1 = encimeraPara([a]);
      if (en1) r1.push(esMadera(en1.fam) ? 'La encimera de madera da calidez a tanto color claro.' : en1.tono === 3 ? 'La encimera oscura marca la línea de trabajo.' : 'La encimera de aspecto piedra o mármol es fácil de combinar y de limpiar.');
      combos.push({ titulo: 'Luminosa', altos: a, bajos: a, encimera: en1, tirador: tiradorPara([a], en1), razones: r1 });
    }
    // 2. Bitono: bajos con más peso (madera o un tono medio u oscuro) y altos claros, que no cargan.
    var famsB = { moderno: ['madera_media', 'oscuro', 'gris', 'madera_oscura'], industrial: ['oscuro', 'madera_oscura', 'madera_media', 'negro'], nordico: ['madera_clara', 'madera_media', 'verde', 'azul'],
      clasico: ['verde', 'azul', 'madera_media', 'gris'], rustico: ['madera_media', 'verde', 'madera_oscura', 'terracota'],
      minimalista: ['gris', 'oscuro', 'negro'], boho: ['terracota', 'verde', 'madera_clara'], japandi: ['madera_clara', 'madera_media', 'oscuro'], vintage: ['verde', 'azul', 'terracota'] }[e.estilo] || ['madera_media', 'oscuro', 'verde'];
    var suave = oscuroSuelo || ['nordico', 'clasico', 'boho', 'japandi', 'vintage'].indexOf(e.estilo) >= 0;
    var bajos = mejor(fr, e, { fams: famsB, tono: suave ? 2 : 3, dejarOscuro: true }, usados);
    var altos = mejor(fr, e, { fams: ['blanco', 'crema', 'gris_claro'], tono: 1, fab: bajos && bajos.fab }, usados.concat(bajos ? [bajos.id] : []));
    if (bajos && altos) {
      usados.push(bajos.id);
      var r2 = ['Altos claros que no pesan y bajos con más color: es la combinación que mejor aguanta el día a día (se notan menos las marcas abajo).'];
      if (e.sueloTipo === 'madera' && esMadera(bajos.fam)) r2.push('La madera de los bajos es de un tono distinto al del suelo para que no parezca que no casan.');
      else if (esMadera(bajos.fam)) r2.push('La madera en los bajos da calidez sin oscurecer la cocina.');
      if (cerrada) r2.push('Lo oscuro va abajo: así no se cierra el espacio.');
      var en2 = encimeraPara([bajos, altos]);
      combos.push({ titulo: 'Bitono', altos: altos, bajos: bajos, encimera: en2, tirador: tiradorPara([bajos, altos], en2), razones: r2 });
    }
    // 3. Con carácter: un color con personalidad según el estilo (en cocinas pequeñas o sin luz, suave).
    var fams3 = { moderno: ['oscuro', 'negro', 'madera_media'], nordico: ['verde', 'azul', 'madera_clara'], clasico: ['verde', 'azul', 'crema'], industrial: ['negro', 'oscuro', 'madera_oscura'], rustico: ['verde', 'terracota', 'madera_media'],
      minimalista: ['negro', 'oscuro', 'gris'], boho: ['terracota', 'verde', 'madera_clara'], japandi: ['negro', 'madera_clara', 'oscuro'], vintage: ['verde', 'azul', 'terracota'] }[e.estilo] || ['verde', 'azul'];
    var c3 = mejor(fr, e, { fams: fams3, tono: cerrada ? 2 : 3, dejarOscuro: !cerrada }, usados);
    if (c3) {
      var r3 = [cerrada ? 'Un color con personalidad, pero suave para que la cocina no se cierre.' : 'Un color con personalidad que encaja con el estilo ' + ({ moderno: 'moderno', nordico: 'nórdico', clasico: 'clásico', industrial: 'industrial', rustico: 'rústico', minimalista: 'minimalista', boho: 'boho o mediterráneo', japandi: 'japandi', vintage: 'vintage' }[e.estilo] || '') + '.'];
      var alto3 = c3.tono >= 2 && cerrada ? mejor(fr, e, { fams: ['blanco', 'crema'], tono: 1, fab: c3.fab }, []) : c3;
      if (alto3 !== c3) r3.push('Los altos van en blanco para que entre la luz.');
      if (e.pared === 'color') r3.push('Ojo con la pared de color: que no compita con los frentes (mejor blanco o un tono suave en la pared).');
      var en3 = encimeraPara([c3]);
      if (en3 && en3.tono === 1 && c3.tono >= 2) r3.push('La encimera clara equilibra el color de los frentes.');
      combos.push({ titulo: 'Con carácter', altos: alto3, bajos: c3, encimera: en3, tirador: tiradorPara([c3], en3), razones: r3 });
    }
    return combos;
  }

  // ── Pantalla ──
  var eh = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var OPC = {
    sueloTipo: [['madera', 'Madera o imitación'], ['piedra', 'Piedra o porcelánico piedra'], ['cemento', 'Cemento o gris'], ['ceramica', 'Cerámica lisa'], ['barro', 'Barro o terracota']],
    sueloTono: [[1, 'Claro'], [2, 'Medio'], [3, 'Oscuro']],
    sueloTemp: [['c', 'Cálido (amarillo o rojizo)'], ['n', 'Neutro'], ['f', 'Frío (gris o azulado)']],
    pared: [['blanco', 'Blanca'], ['claro', 'Clara o beige'], ['color', 'De color'], ['azulejo', 'Azulejo']],
    luz: [['mucha', 'Mucha luz'], ['normal', 'Normal'], ['poca', 'Poca luz']],
    tam: [['pequena', 'Pequeña'], ['media', 'Mediana'], ['grande', 'Grande o abierta']],
    estilo: [['moderno', 'Moderno'], ['minimalista', 'Minimalista'], ['nordico', 'Nórdico'], ['japandi', 'Japandi'], ['clasico', 'Clásico'], ['vintage', 'Vintage / retro'], ['boho', 'Boho / mediterráneo'], ['industrial', 'Industrial'], ['rustico', 'Rústico']],
  };
  var TIT = { sueloTipo: 'Suelo', sueloTono: 'Tono del suelo', sueloTemp: 'Color del suelo', pared: 'Paredes', luz: 'Luz', tam: 'Tamaño', estilo: 'Estilo' };
  var DEF = { sueloTipo: 'madera', sueloTono: 2, sueloTemp: 'c', pared: 'blanco', luz: 'normal', tam: 'media', estilo: 'moderno', mats: [] };
  function entrada() { var g = leer(); return Object.assign({}, DEF, g.ultimo || {}); }

  function dibujo(cb, e, alto) {
    // Cocina de frente: pared, altos, encimera, bajos con su tirador y el suelo.
    var w = 300, H = alto || 190, suelo = sueloHex({ tipo: e.sueloTipo, tono: e.sueloTono }), pared = PARED_HEX[e.pared] || PARED_HEX.blanco;
    var hx = function (c, d) { return c ? c.hex : d; }, ti = cb.tirador, gola = ti && ti.fam === 'gola';
    var s = '<svg viewBox="0 0 ' + w + ' ' + H + '" class="gc-svg" role="img" aria-label="Combinación ' + eh(cb.titulo) + '">'
      + '<rect width="' + w + '" height="' + H + '" fill="' + pared + '"/>'
      + '<rect y="' + (H - 34) + '" width="' + w + '" height="34" fill="' + suelo + '"/>';
    for (var i = 0; i < 4; i++) {
      var x = 22 + i * 64;
      s += '<rect x="' + x + '" y="18" width="62" height="52" fill="' + hx(cb.altos, '#eee') + '" stroke="rgba(0,0,0,.18)"/>';
      s += '<rect x="' + x + '" y="96" width="62" height="' + (H - 34 - 96 - 8) + '" fill="' + hx(cb.bajos, '#ddd') + '" stroke="rgba(0,0,0,.18)"/>';
      if (!gola && ti) { s += '<rect x="' + (x + 8) + '" y="62" width="20" height="3" rx="1.5" fill="' + ti.hex + '"/><rect x="' + (x + 8) + '" y="103" width="20" height="3" rx="1.5" fill="' + ti.hex + '"/>'; }
    }
    s += '<rect x="18" y="86" width="264" height="10" fill="' + hx(cb.encimera, '#999') + '" stroke="rgba(0,0,0,.25)"/>'
      + '<rect x="22" y="' + (H - 42) + '" width="256" height="8" fill="rgba(0,0,0,.35)"/>';
    return s + '</svg>';
  }
  function fila(et, c) {
    if (!c) return '';
    return '<div class="gc-fila"><span class="gc-mu" style="background:' + c.hex + '"></span><span><small>' + et + '</small><b>' + eh(c.nombre) + '</b>'
      + (c.fab || c.serie ? '<em>' + eh([c.fab, c.serie, c.mat && c.uso === F ? c.mat : ''].filter(Boolean).join(' · ')) + '</em>' : '') + '</span></div>';
  }
  function tarjeta(cb, e, i) {
    return '<div class="gc-combo" data-combo="' + i + '"><h4>' + (i + 1) + '. ' + eh(cb.titulo) + '</h4>' + dibujo(cb, e)
      + (cb.altos === cb.bajos ? fila('Frentes', cb.bajos) : fila('Altos', cb.altos) + fila('Bajos', cb.bajos))
      + fila('Encimera', cb.encimera) + fila('Tirador', cb.tirador)
      + '<ul class="gc-por">' + cb.razones.map(function (r) { return '<li>' + eh(r) + '</li>'; }).join('') + '</ul></div>';
  }
  function chips(k, e) {
    return '<div class="gc-campo"><label>' + TIT[k] + '</label><div class="gc-chips">' + OPC[k].map(function (o) {
      return '<button type="button" class="gc-chip' + (String(e[k]) === String(o[0]) ? ' on' : '') + '" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div></div>';
  }
  var MATS = ['Laminado', 'PET', 'Laca', 'Madera'];
  function pintar() {
    var m = document.getElementById('GC-MOD'), e = entrada(), cb = recomendar(e);
    m._combos = cb;
    m.querySelector('.gc-form').innerHTML = ['sueloTipo', 'sueloTono', 'sueloTemp', 'pared', 'luz', 'tam', 'estilo'].map(function (k) { return chips(k, e); }).join('')
      + '<div class="gc-campo"><label>Material de los frentes</label><div class="gc-chips">' + MATS.map(function (x) {
        return '<button type="button" class="gc-chip' + (e.mats.indexOf(x) >= 0 ? ' on' : '') + '" data-mat="' + x + '">' + x + '</button>';
      }).join('') + '</div><small class="gc-nota">Sin marcar: todos.</small></div>';
    var cli = document.getElementById('GC-CLIENTE').value || clientePresupuesto();
    m.querySelector('.gc-res').innerHTML = '<div class="gc-cab-imp"><b>Propuesta de colores</b>' + (cli ? ' · ' + eh(cli) : '') + '<br><small>Suelo ' + eh(OPC.sueloTipo.filter(function (o) { return o[0] === e.sueloTipo; })[0][1].toLowerCase())
      + ', ' + ['', 'claro', 'medio', 'oscuro'][e.sueloTono] + ' · cocina ' + ({ pequena: 'pequeña', media: 'mediana', grande: 'grande' })[e.tam] + ' · estilo ' + eh(OPC.estilo.filter(function (o) { return o[0] === e.estilo; })[0][1].toLowerCase()) + '</small></div>'
      + (cb.length ? '<div class="gc-combos">' + cb.map(function (c, i) { return tarjeta(c, e, i); }).join('') + '</div>' : '<p>No hay colores con esos materiales. Quita algún filtro o añade colores en «Mis colores».</p>')
      + '<p class="gc-nota">Colores orientativos: el tono real se comprueba siempre con la muestra del fabricante.</p>';
    m.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { var g = leer(), u = entrada(); u[b.dataset.k] = b.dataset.k === 'sueloTono' ? +b.dataset.v : b.dataset.v; g.ultimo = u; guardar(g); pintar(); }; });
    m.querySelectorAll('[data-mat]').forEach(function (b) { b.onclick = function () { var g = leer(), u = entrada(), i = u.mats.indexOf(b.dataset.mat); if (i >= 0) u.mats.splice(i, 1); else u.mats.push(b.dataset.mat); g.ultimo = u; guardar(g); pintar(); }; });
  }
  function texto() {
    var m = document.getElementById('GC-MOD'), cb = m._combos || [];
    var l = ['*Propuesta de colores para tu cocina*'];
    cb.forEach(function (c, i) {
      l.push('', '*' + (i + 1) + '. ' + c.titulo + '*');
      if (c.altos === c.bajos) l.push('Frentes: ' + c.bajos.nombre + ' (' + c.bajos.fab + ')'); else l.push('Altos: ' + c.altos.nombre + ' (' + c.altos.fab + ')', 'Bajos: ' + c.bajos.nombre + ' (' + c.bajos.fab + ')');
      if (c.encimera) l.push('Encimera: ' + c.encimera.nombre);
      if (c.tirador) l.push('Tirador: ' + c.tirador.nombre);
      c.razones.forEach(function (r) { l.push('- ' + r); });
    });
    l.push('', 'Colores orientativos: el tono real se ve en la muestra.');
    return l.join('\n');
  }

  // ── Mis colores: quitar, cambiar el tono o añadir ──
  function pintarMios() {
    var m = document.getElementById('GC-MOD'), cat = BASE.concat(leer().mios || []), g = leer(), quit = g.quitados || [];
    var filas = cat.map(function (c) {
      var x = Object.assign({}, c, (g.cambios || {})[c.id] || {}), on = quit.indexOf(c.id) < 0;
      return '<tr data-id="' + c.id + '"><td><input type="checkbox" data-acc="gc-usar"' + (on ? ' checked' : '') + ' title="Usar en las propuestas"></td>'
        + '<td><input type="color" data-acc="gc-hex" value="' + x.hex + '" title="Tono orientativo"></td>'
        + '<td><b>' + eh(x.nombre) + '</b><br><small>' + eh([x.fab, x.serie].filter(Boolean).join(' · ')) + '</small></td>'
        + '<td>' + ({ frente: 'Frente', encimera: 'Encimera', tirador: 'Tirador' })[x.uso] + '</td>'
        + '<td><select data-acc="gc-fam">' + Object.keys(FAM).map(function (f) { return '<option value="' + f + '"' + (f === x.fam ? ' selected' : '') + '>' + FAM[f] + '</option>'; }).join('') + '</select></td>'
        + '<td>' + (c.id.indexOf('mio-') === 0 ? '<button type="button" class="btn bdr bsm" data-acc="gc-borrar">✕</button>' : '') + '</td></tr>';
    }).join('');
    m.querySelector('.gc-res').innerHTML = '<h3>Mis colores</h3><p class="gc-nota">Quita la marca de lo que no vendas; cambia el tono o la familia si no se parece a la muestra; añade los que falten.</p>'
      + '<div class="gc-nuevo"><input id="GC-N-NOM" placeholder="Nombre (p. ej. Verde salvia)"><input id="GC-N-FAB" placeholder="Fabricante y serie">'
      + '<select id="GC-N-USO"><option value="frente">Frente</option><option value="encimera">Encimera</option><option value="tirador">Tirador</option></select>'
      + '<select id="GC-N-FAM">' + Object.keys(FAM).map(function (f) { return '<option value="' + f + '">' + FAM[f] + '</option>'; }).join('') + '</select>'
      + '<select id="GC-N-MAT">' + MATS.concat(['Laminado hidrófugo', 'Piedra', 'Compacto', 'Otro']).map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>'
      + '<input type="color" id="GC-N-HEX" value="#cccccc"><button type="button" class="btn bp bsm" data-acc="gc-anadir">+ Añadir</button></div>'
      + '<div class="gc-tabla"><table><tbody>' + filas + '</tbody></table></div>';
    var cambiar = function (id, k, v) { var g2 = leer(); g2.cambios = g2.cambios || {}; var mio = (g2.mios || []).filter(function (c) { return c.id === id; })[0]; if (mio) mio[k] = v; else { g2.cambios[id] = Object.assign({}, g2.cambios[id], {}); g2.cambios[id][k] = v; } guardar(g2); };
    m.querySelectorAll('tr[data-id]').forEach(function (tr) {
      var id = tr.dataset.id;
      tr.querySelector('[data-acc="gc-usar"]').onchange = function (ev) { var g2 = leer(), q = g2.quitados || []; var i = q.indexOf(id); if (ev.target.checked && i >= 0) q.splice(i, 1); if (!ev.target.checked && i < 0) q.push(id); g2.quitados = q; guardar(g2); };
      tr.querySelector('[data-acc="gc-hex"]').onchange = function (ev) { cambiar(id, 'hex', ev.target.value); };
      tr.querySelector('[data-acc="gc-fam"]').onchange = function (ev) { cambiar(id, 'fam', ev.target.value); };
      var b = tr.querySelector('[data-acc="gc-borrar"]'); if (b) b.onclick = function () { var g2 = leer(); g2.mios = (g2.mios || []).filter(function (c) { return c.id !== id; }); guardar(g2); pintarMios(); };
    });
    m.querySelector('[data-acc="gc-anadir"]').onclick = function () {
      var nom = document.getElementById('GC-N-NOM').value.trim(); if (!nom) { document.getElementById('GC-N-NOM').focus(); return; }
      var fam = document.getElementById('GC-N-FAM').value, hex = document.getElementById('GC-N-HEX').value, rgb = parseInt(hex.slice(1), 16), lum = ((rgb >> 16) * 0.3 + ((rgb >> 8) & 255) * 0.59 + (rgb & 255) * 0.11);
      var g2 = leer(); g2.mios = g2.mios || [];
      g2.mios.push(C('mio-' + Date.now().toString(36), nom, document.getElementById('GC-N-FAB').value.trim(), '', document.getElementById('GC-N-MAT').value, document.getElementById('GC-N-USO').value, fam, lum > 180 ? 1 : lum > 100 ? 2 : 3, /madera|crema|terracota|oro|bronce/.test(fam) ? 'c' : /azul|gris|metal/.test(fam) ? 'f' : 'n', hex));
      guardar(g2); pintarMios();
    };
  }

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
  function clientePresupuesto() { var f = document.getElementById('FC'); return f ? f.value.trim() : ''; }
  function cerrar() { var m = document.getElementById('GC-MOD'); if (m) m.style.display = 'none'; }

  var CSS = '#GC-MOD{position:fixed;inset:0;z-index:3000;background:rgba(15,20,25,.55);display:none;align-items:stretch;justify-content:center;padding:12px}'
    + '#GC-MOD .gc-caja{background:#fff;color:#1f2937;border-radius:12px;width:100%;max-width:1200px;display:flex;flex-direction:column;overflow:hidden}'
    + '#GC-MOD .gc-barra{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f8f6f1}'
    + '#GC-MOD .gc-barra b{font-size:1.05rem;margin-right:auto}#GC-MOD #GC-CLIENTE{padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;min-width:0;flex:1 1 160px;max-width:260px}'
    + '#GC-MOD .gc-cuerpo{display:grid;grid-template-columns:300px 1fr;overflow:auto;flex:1}'
    + '#GC-MOD .gc-form{padding:10px 12px;border-right:1px solid #eee;overflow:auto}#GC-MOD .gc-res{padding:12px;overflow:auto}'
    + '#GC-MOD.mios .gc-cuerpo{grid-template-columns:1fr}#GC-MOD.mios .gc-form{display:none}'
    + '.gc-campo{margin-bottom:10px}.gc-campo label{display:block;font-weight:700;font-size:.8rem;margin-bottom:4px;color:#374151}'
    + '.gc-chips{display:flex;flex-wrap:wrap;gap:4px}.gc-chip{border:1px solid #d1d5db;background:#fff;border-radius:16px;padding:4px 10px;font-size:.78rem;cursor:pointer}'
    + '.gc-chip.on{background:#1f3a2e;border-color:#1f3a2e;color:#fff}'
    + '.gc-combos{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}'
    + '.gc-combo{border:1px solid #e5e7eb;border-radius:10px;padding:10px;break-inside:avoid}.gc-combo h4{margin:0 0 6px;font-size:1rem}'
    + '.gc-svg{width:100%;height:auto;border-radius:6px;display:block;margin-bottom:8px}'
    + '.gc-fila{display:flex;gap:8px;align-items:center;margin:5px 0}.gc-fila small{display:block;font-size:.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}'
    + '.gc-fila b{display:block;font-size:.88rem}.gc-fila em{display:block;font-style:normal;font-size:.74rem;color:#6b7280}'
    + '.gc-mu{flex:0 0 34px;height:34px;border-radius:6px;border:1px solid rgba(0,0,0,.2)}'
    + '.gc-por{margin:8px 0 0;padding-left:18px;font-size:.8rem;color:#374151}.gc-por li{margin:3px 0}'
    + '.gc-nota{font-size:.76rem;color:#6b7280}.gc-cab-imp{margin-bottom:10px}'
    + '.gc-nuevo{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.gc-nuevo input,.gc-nuevo select{padding:5px 7px;border:1px solid #d1d5db;border-radius:6px}'
    + '.gc-tabla table{width:100%;border-collapse:collapse;font-size:.82rem}.gc-tabla td{border-bottom:1px solid #eee;padding:4px}.gc-tabla input[type=color]{width:38px;height:28px;border:0;padding:0;background:none}'
    + '@media (max-width:760px){#GC-MOD{padding:0}#GC-MOD .gc-caja{border-radius:0}#GC-MOD .gc-cuerpo{grid-template-columns:1fr}#GC-MOD .gc-form{border-right:0;border-bottom:1px solid #eee}#GC-MOD .gc-form,#GC-MOD .gc-res{overflow:visible}#GC-MOD .gc-cuerpo{display:block}}'
    + '@media print{body.gc-imprimiendo>*:not(#GC-MOD){display:none!important}body.gc-imprimiendo #GC-MOD{position:static;display:block!important;background:#fff;padding:0}'
    + 'body.gc-imprimiendo #GC-MOD .gc-barra,body.gc-imprimiendo #GC-MOD .gc-form{display:none!important}body.gc-imprimiendo #GC-MOD .gc-cuerpo{display:block;overflow:visible}'
    + 'body.gc-imprimiendo #GC-MOD .gc-caja{max-width:none;border-radius:0}body.gc-imprimiendo .gc-combos{grid-template-columns:repeat(3,1fr);gap:6mm}'
    + 'body.gc-imprimiendo .gc-mu,body.gc-imprimiendo .gc-svg *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';

  window.GUIA_COLORES = { BASE: BASE, FAM: FAM, recomendar: recomendar, catalogo: catalogo, abrir: abrir, cerrar: cerrar, texto: texto, CLAVE: CLAVE };
  window.abrirGuiaColores = abrir;
})();
