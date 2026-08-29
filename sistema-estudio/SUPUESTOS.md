# SUPUESTOS

Todo lo que decidí yo porque no estaba en las capturas o porque Excel no admite
lo que hace Google Sheets. Cada punto lleva su justificación y cómo cambiarlo.

Salvo indicación contraria, «cambiarlo» significa editar
`build/construir.py` y volver a ejecutarlo:

```bash
python3 build/construir.py
```

---

## 1. Correcciones autorizadas por la especificación

| Qué decía el original | Qué se escribió | Origen |
|---|---|---|
| Cabeceras del bloque rojo: `Semana 25 … Semana 28` | `Semana 31 … Semana 34` | corrección obligatoria, §8.1.B |
| Las cinco cajas: `Resumen semanas 1 a 8` | `Resumen semanas 1 a 8 / 9 a 16 / 17 a 24 / 25 a 30 / 31 a 34` | corrección obligatoria, §8.1.B |

Son arrastres de copiar/pegar del autor, no decisiones de diseño. Todo lo demás
—incluido el encabezado `Columna 1` de `Tabla_1`— se replica literalmente.
Para revertir: `BLOQUES` y la lista `resumenes` en `construir_estrategia()`.

---

## 2. La hoja `_Motor` no existe: el motor vive en columnas ocultas

`ESPECIFICACION.md` situaba la matriz espejo y la tabla auxiliar de días hábiles
en una hoja oculta `_Motor`. La restricción «exactamente 4 pestañas» es de
rechazo inmediato y una hoja oculta sigue siendo una hoja para `openpyxl`
(`len(wb.sheetnames)` daría 5). Gana la restricción.

Todo el motor está en columnas ocultas de las hojas donde se usa:

| Hoja | Columnas ocultas | Contenido |
|---|---|---|
| Progreso | `O:P` | día de la semana → días hasta el siguiente día hábil (`DESPLAZAMIENTO`) |
| Progreso | `R:Z` | semillas de Sesión 2-10 (ver §3) |
| Progreso | `AB:AK` | matriz espejo de estados `Éxito` / `Fallo` |
| Progreso | `AN` | etiquetas y parámetros con nombre del motor |
| Progreso | `AP:AX` | agregación semanal que alimenta la gráfica |
| Progreso | `AZ:BI` | espejo numérico de fechas (0 = sin fecha) |
| Calendario | `P:T` | lista de las 400 sesiones posibles y su orden cronológico |
| Calendario | `V` | posición de cada fila de la agenda dentro de esa lista |

La columna `M` de Progreso (días de estudio e intervalos) queda **visible y
editable**, como pide la especificación.

**Cómo cambiarlo:** quitar el bucle `column_dimensions[...].hidden = True` al
final de `construir_progreso()` y `construir_calendario()`. Si algún día se
levanta la restricción de 4 pestañas, mover esos bloques a una hoja `_Motor`.

---

## 3. Las fechas semilla: valores en un bloque de entrada, no dentro de la rejilla

`Sesión 1` (columna B) es entrada manual directa y lleva las 9 fechas literales.
Las semillas de `Sesión 2` a `Sesión 4` viven en el bloque oculto `R:Z` y la
rejilla `C2:K41` es fórmula en todas sus celdas:

```
=IF($B2="","",IF(R2<>"",R2,(B2+INDEX(INTERVALOS,COLUMN()-COLUMN($B$1)))
                +INDEX(DESPLAZAMIENTO,WEEKDAY(B2+INDEX(INTERVALOS,COLUMN()-COLUMN($B$1)),2))))
```

Es decir: si hay semilla, manda la semilla; si no, manda el motor. Los **valores
visibles son exactamente los de §8.2** (comprobado celda a celda).

Motivo de haberlo hecho así y no pegando las fechas dentro de la rejilla:

1. **Borrar `Sesión 1` deja vacías las sesiones 2-10.** Con las fechas pegadas
   en la rejilla, borrar `B2` dejaría `C2:E2` con fechas huérfanas y la
   comprobación 6 fallaría en las nueve filas semilla.
2. **Auditoría.** Pegar 30 valores dentro de bloques de fórmulas producía 31
   hallazgos `CONSTANT_IN_FORMULA_RUN` / `PATTERN_BREAK` de nivel alto. Con
   semillas separadas quedan 9 (ver §12).
3. Separa capas: entrada en un sitio, cálculo en otro.

**Consecuencia que hay que conocer:** `openpyxl` con `data_only=True` devuelve
`None` en `C2:K41` porque el libro no lleva valores cacheados (§11). Para leer
las fechas hay que recalcular (`recalc.py`) o abrir el libro en Excel.

**Cómo cambiarlo:** el diccionario `SEMILLAS` de `construir_progreso()`; la
primera fecha de cada lista va a la columna B y el resto al bloque oculto.

---

## 4. Paleta: se usa la de `ESPECIFICACION.md`, no la medida sobre el JPEG

Medí a cuentagotas las seis capturas. Varios valores no coinciden con la
especificación:

| Elemento | ESPECIFICACION | Medido en ref/03-06 | Medido en ref/01-02 |
|---|---|---|---|
| Cabecera verde | `0B5C39` | `2E5D49` | `377158` |
| Banda alterna | `F0F4F1` | `F6F7F9` | `FBFBFB` |
| Escala mín → máx | `E6F2EA` → `7CC49A` | `D3E7CE` → `88BC71` | — |
| Fila Horas | `F1F3F4` | `F1F1F1` | — |
| Resumen cab. / cuerpo | `C8E6C9` / `E2F0E4` | `ACD19E` / `D3E7CE` | — |
| Chip Referencia | `F4C7C3` | — | `FEE0DE` |
| Chip Analogía | `C9DAF8` | — | `D1EBFA` |
| Chip Evidencia | `FCE5CD` | — | `FFD2BD` |

**Decidí seguir la especificación.** Razón: las capturas no sirven como
cuentagotas calibrado. El *mismo* verde de cabecera mide `2E5D49` en unas
capturas y `377158` en otras — 20 puntos de diferencia entre dos fotos del mismo
color. Son fotogramas de una grabación con su propia curva de contraste (un
color de la interfaz de Sheets que sé que es `D3E3FD` mide `CEDFFD`, y los
verdes claros encajan con la paleta estándar de Google `D9EAD3` / `B6D7A8` /
`93C47D` aplicando esa curva). Además, los valores de la especificación forman
un conjunto coherente de colores estándar de Google (`38761D`, `A61C00`,
`F4C7C3`, `C9DAF8`, `FCE5CD`, `1C4587`, `B45F06`), lo que apunta a una lectura
correcta hecha con el selector de color, no con una foto.

Cada entrada del diccionario `PAL` en `build/construir.py` lleva el valor medido
anotado entre corchetes al lado. **Cómo cambiarlo:** sustituir el valor por el
medido en ese mismo diccionario.

---

## 5. La única excepción: el bloque rojo lleva cabecera oscura (manda la captura)

`ESPECIFICACION.md` da `E6A9A0` / `F6D9D5` como «bloque rojo cabecera / cuerpo».
`ref/06` muestra inequívocamente que la cabecera de la tabla `Semanas 31 a 34` y
la de su caja Resumen son **rojo oscuro con texto blanco** (medido `B23D33`),
igual que la cabecera verde es verde oscuro con texto blanco. Un `E6A9A0` claro
es incompatible con el texto blanco que se ve en la captura.

Se usa `A61C00` — que ya está en la paleta de la especificación (`Sesión
fallida`), así que no introduzco ningún color inventado — y `F6D9D5` para el
cuerpo de la caja Resumen, tal cual. `E6A9A0` queda sin usar.

**Cómo cambiarlo:** `PAL["rojo_cab"]` en `build/construir.py`.

---

## 6. Colores y detalles que la especificación no cubre

| Elemento | Valor usado | De dónde sale |
|---|---|---|
| Columnas H/I sin semana (bloque 25-30) | fondo `EFEFEF` | medido `ECECEC` en ref/06, corregido por la curva de la captura |
| Píldora gris del desplegable vacío | `F1F3F4` | medido `F4F5F7` en ref/01 |
| Recuadros de agrupación | `A61C00` (roja), `1C4587` (azules), `38761D` (verde) | los tres colores que nombra la especificación, todos ya en la paleta |

Sobre los recuadros: la especificación decía que los rangos exactos podían
quedar como ambigüedad. **No hizo falta.** Detecté los bordes segmento a
segmento sobre `ref/04` y resultan ser **semanas naturales** (lunes a domingo):
cada recuadro engloba todas las celdas cuya fecha cae en esa semana. Las 30
fechas semilla se reparten en cinco bandas sin sobras:

| Banda | Semana | Celdas | Color medido |
|---|---|---|---|
| 1 | 01–07 jun | `B2:C3`, `B4` | rojo |
| 2 | 08–14 jun | `D2:D3`, `C4:C5`, `B5:B6` | azul |
| 3 | 15–21 jun | `E2:E3`, `D4:D5`, `C6:C7`, `B7` | azul |
| 4 | 22–28 jun | `E4:E5`, `D6:D8`, `C8`, `B8` | azul |
| 5 | 29 jun–5 jul | `E6`, `B9:C10` | verde |

Solo se dibuja el contorno (izquierda, derecha y abajo), sin línea de color bajo
la cabecera verde: es exactamente lo que hay en la captura. Los tres azules de
las bandas 2, 3 y 4 miden tonos ligeramente distintos entre sí en el JPEG
(`5B526F`, `576D82`, `5B729C`); como la especificación solo nombra «azul
marino», los tres usan `1C4587`. **Cómo cambiarlo:** la lista `BANDAS` de
`construir_progreso()`.

---

## 7. Restricciones de Excel que obligan a traducir

| Google Sheets | Excel | Por qué |
|---|---|---|
| Tabla `Semanas 1 a 8` | `ListObject` `Semanas_1_a_8` | los nombres de tabla de Excel no admiten espacios. El nombre no se ve en la interfaz. |
| Dos columnas de cabecera vacía con `-` | `H25` = `-`, `I25` = `–` (guión corto), ambos en fuente del color del fondo | Excel exige nombres de columna únicos y no vacíos en un `ListObject`. Los dos se ven igual: un guión blanco casi invisible sobre gris, como en `ref/06`. |
| Chips de colores del desplegable | validación de datos + 4 reglas de formato condicional | Excel no tiene chips. Tres reglas para los tres valores y una cuarta que pinta de gris la celda vacía, que es lo que se ve en `ref/01`. |
| `getBackgrounds()` leyendo colores | matriz espejo manual (§9) | ninguna fórmula de Excel lee el color de relleno, y un `.xlsx` no lleva macros. |
| Bandas alternas de la tabla | rellenos explícitos celda a celda | el `ListObject` lleva `showRowStripes`, pero el estilo integrado de Excel no da `0B5C39`. Consecuencia: si se añaden filas, la banda no continúa sola. |

La fila `Horas` del bloque 25-30 usa una variante con guarda para que las dos
columnas sin semana sigan mostrando `-` sin romper el patrón de la fila:

```
=IF(H26="-","-",H26*H_TEMA_NUEVO+H27*H_REPASO+H28*H_SIMULACRO)
```

Esas dos celdas **no** forman parte de las 34 celdas de Horas.

---

## 8. Geometría: anchos de columna y altos de fila

No hay ninguna cifra de geometría en la especificación. La deduje midiendo
píxeles sobre las capturas y despejando la escala con el ancho conocido del
texto (Arial/Roboto 10):

* `ref/03-06`: escala ≈ 1,10. Columnas de 111 px → **100 px reales** (el ancho
  por defecto de Sheets); columnas B y K de 132 px → **120 px**. Filas de tabla
  33 px → **30 px** (22,5 pt); filas sueltas 23 px → **21 px**.
* `ref/01-02`: escala ≈ 1,20. Columna A 273 px, B 192 px, C 660 px.

De ahí: Estrategia y Progreso a 13,57 caracteres (100 px) con B y K a 16,43
(120 px); Preguntas a 38,3 / 26,7 / 93,6. Filas de tabla a 22,5 pt en las cuatro
hojas; la fila 4 de Preguntas a 51,75 pt para que quepan las cuatro líneas.

**Cómo cambiarlo:** constantes `ANCHO_NORMAL`, `ANCHO_ANCHO`,
`ALTO_FILA_TABLA`, `ALTO_FILA_BASE` y la llamada `anchos()` de cada hoja.

---

## 9. Diferencias entre captura y especificación que resolví a favor de la especificación

Dos casos, ambos porque la captura **no puede** resolverlos:

1. **Filas en blanco entre bloques de Estrategia.** Las capturas muestran 2 o 3
   filas de separación (una de ~15 px y otra de altura normal); la
   especificación fija una sola (`A7:I11`, `A13:I17`, …). Como en `ref/03` y
   `ref/06` está cortada la columna de números de fila, la captura no permite
   saber en qué fila absoluta empieza nada: solo la especificación da
   direcciones. Seguí las direcciones de la especificación.
2. **Posición de la lista de días.** En `ref/04` y `ref/05` los cuatro días
   aparecen en `M3:M6` y no hay ningún rótulo. La especificación pide rótulo en
   `M1` y lista en `M2:M5`, y añade además una zona de intervalos en `M8:M17`
   que en el original **no existe** (esa parte de la columna M está vacía en la
   captura). Como la zona de parámetros es una adición que la especificación
   define entera, la construí donde ella dice, con su rótulo.

**Cómo cambiarlo:** `BLOQUES` en `construir_estrategia()`; el bloque de
parámetros y los rangos `DIAS_ESTUDIO` / `INTERVALOS` en `construir_progreso()`
y en `construir()`.

---

## 10. La pestaña Calendario (no hay captura)

Construida derivada, sin ninguna entrada manual. Decisiones tomadas:

* **Semáforo (`A1:B5`).** Hoy · sesiones para hoy · vencidas sin hacer ·
  próximos 7 días. La ventana de 7 días es el rango con nombre
  `VENTANA_PROXIMA` (`Progreso!$AN$5`), editable.
* **Agenda (`A12:E412`).** 400 filas, una por sesión posible (40 temas × 10
  sesiones), ordenadas por fecha con un motor `COUNTIFS` + `MATCH` + `INDEX`.
  Sin `SORT` ni `FILTER`. Los empates de fecha se resuelven por orden de tema y
  sesión.
* **Columna `Estado`.** La especificación la nombra pero no la define. Si la
  sesión tiene estado marcado en la matriz espejo, se muestra ese
  (`Éxito` / `Fallo`); si no, se deriva de la fecha: `Vencida`, `Hoy` o
  `Programada`.
* **Rejilla mensual (`G1:M10`).** Mes de hoy. Semáforo de carga por formato
  condicional: sin color 0 sesiones, verde claro 1-2, verde fuerte 3 o más.
  La fila 4 va en blanco y a 4 pt: separa la cabecera de días de la rejilla.
* **Panel inmovilizado en `A13`** para que la cabecera de la agenda no se pierda
  al desplazarse por 400 filas. Es una decisión mía de usabilidad.
* **`TODAY()` aparece una sola vez**, en `Calendario!B2`, con el nombre `HOY`;
  todo lo demás lo referencia. Es lo que recomienda el propio auditor para
  aislar la volatilidad.

---

## 11. Cosas que hay que saber para usar el libro

* **El libro no lleva valores cacheados.** `openpyxl` escribe fórmulas sin
  resultado; hasta que Excel (o `recalc.py`) las evalúe, `data_only=True`
  devuelve `None`. Es el comportamiento normal de la biblioteca y lo advierte la
  propia especificación.
* **La matriz espejo de estados se rellena a mano.** El usuario pinta el fondo
  de la celda de fecha (verde `38761D` superada, rojo `A61C00` fallida) igual
  que en el original, pero ninguna fórmula de Excel lee un color de relleno y un
  `.xlsx` no admite macros. Para que la gráfica y las tarjetas KPI tengan datos
  hay que escribir `Éxito` o `Fallo` en la matriz espejo (`Progreso!AB2:AK41`,
  columnas ocultas). La alternativa —sustituir el pintado por desplegables— está
  en `MEJORAS-PROPUESTAS.md`, sin implementar, como pedía la especificación.
* **La gráfica con la hoja vacía** no da `#DIV/0!` ni se rompe: las celdas de
  tasa devuelven cadena vacía. Aviso honesto: Excel trata una fórmula que
  devuelve `""` como cero en un gráfico, así que con el libro recién creado las
  tres líneas se ven planas en 0, no ausentes.
* **`Sesión 1` es la única celda que se teclea** en cada fila de Progreso. Lleva
  un comentario en `Progreso!B1` explicándolo.
* **Interpretación de «cero constantes».** La regla se aplica a las constantes
  de negocio: tarifas, intervalos, días hábiles, días por semana y la ventana de
  «próximos días» viven todas en rangos con nombre. Quedan constantes
  estructurales inevitables (desplazamientos de índice `-1`, el `2` del modo de
  `WEEKDAY`, los umbrales `1` y `3` del semáforo de carga y el `0,6` / `0,8` de
  la tarjeta de tasa). La propia especificación las usa cuando escribe
  `INDEX(INTERVALOS, N-1)`.

---

## 12. Estado de la auditoría: los 10 hallazgos que quedan

`audit.py` sin ledger da `critical=0 high=9 medium=1 low=0 info=1`
(código de salida 1). Ninguno es un defecto:

* **9 × `CONSTANT_IN_FORMULA_RUN` en `Progreso!B2:B10` (alto).** Son las nueve
  fechas de `Sesión 1`. El auditor ve un valor escrito dentro de una fila de
  fórmulas y tiene razón en lo que ve; lo que no puede saber es que esa columna
  **es** la celda de entrada del sistema (§8.2 de la especificación) y que las
  otras nueve celdas de la fila son el motor. Está documentado en un comentario
  de celda en `Progreso!B1` y silenciado por firma en
  `.precision-forge/ledger.json` con su motivo. Con el ledger:

  ```
  python3 .claude/skills/precision-forge/scripts/audit.py "Ejemplo Planificador Oposición.xlsx" \
      --ledger .precision-forge/ledger.json --fail-on high
    critical=0  high=0  medium=1  low=0  info=1
    9 finding(s) suppressed by the ledger      → exit 0
  ```

  Para volver a verlos: borrar la entrada de `muted` en el ledger.
* **1 × `VOLATILE` en `Calendario!B2` (medio).** Es el `TODAY()` del semáforo,
  aislado a propósito en una sola celda con nombre `HOY`, que es justo lo que
  pide el mensaje del auditor. Sin él no hay «qué toca hoy».
* **1 × `NO_CACHED_VALUES` (informativo).** Consecuencia de escribir el libro
  con `openpyxl` (§11).

---

## 13. Reproducibilidad

`build/construir.py` es idempotente **byte a byte**: dos ejecuciones producen el
mismo MD5. Para conseguirlo hay que fijar las marcas de tiempo, que openpyxl
pone con la hora de guardado: `wb.properties.created` / `modified` se fijan a
`2026-01-01T00:00:00Z` y `_normalizar_zip()` reescribe el ZIP con esa misma
fecha en cada entrada. Si se prefiere la fecha real de generación, basta con
borrar la llamada a `_normalizar_zip()`.

---

## 14. Lo que no se pudo comprobar

* **Render visual automático.** `soffice` está instalado pero no consigue cargar
  ningún archivo en este entorno (falla incluso con un CSV trivial), así que no
  hay PDF/PNG del resultado ni comparación por diferencia de píxeles contra
  `ref/`. La verificación de formato se hizo releyendo el libro con `openpyxl` y
  contrastando rellenos, fuentes, anchos, altos, formatos numéricos y bordes
  contra la especificación y las medidas tomadas sobre las capturas. **No está
  comprobado cómo se ve realmente al abrirlo.**
* **Excel de verdad.** No hay Excel en este entorno. Los puntos con riesgo
  residual son los que dependen de su motor y no del de `formulas`: el
  renderizado del gráfico combinado con eje secundario, el aspecto exacto de los
  chips por formato condicional y la aceptación de `–` como nombre de columna de
  tabla.
