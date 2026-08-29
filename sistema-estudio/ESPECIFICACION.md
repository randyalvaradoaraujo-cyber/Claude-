# ESPECIFICACIÓN LITERAL — Proyecto ATENEO (.xlsx)

Fuente de verdad para la construcción. Derivada del MEGA-PROMPT (`MEGAPROMPT.pdf`)
y de la lectura forense de las 6 capturas en `ref/`. Donde el PDF y la captura
difieren, manda la captura (Regla de oro 1).

**Destino elegido:** `.xlsx` para Excel (Ruta B del PDF). El usuario lo pidió
explícitamente en su mensaje.

## Decisiones de Fase 0 (tomadas por defecto del propio PDF)

| # | Pregunta | Valor aplicado | Origen |
|---|---|---|---|
| 1 | Destino | `.xlsx` únicamente | pedido explícito del usuario |
| 2 | Calendario | agenda cronológica + mini rejilla mensual + semáforo de hoy | default del PDF §5.2 |
| 3 | Nº de temas en Progreso | 40 | default del PDF §5.3 |
| 4 | Nombre de archivo | `Ejemplo Planificador Oposición.xlsx` | default del PDF §5.4 |

## Restricciones innegociables

1. Exactamente **4 pestañas**, en este orden: `Estrategia`, `Progreso`,
   `Calendario`, `Preguntas`. **Prohibido** crear `Contenidos`.
2. Toda cifra derivada es **fórmula viva**. Un total escrito a mano es un fallo.
3. **Cero constantes** dentro de fórmulas. Las tarifas, los intervalos y los días
   hábiles viven en rangos con nombre y las fórmulas los referencian.
4. Funciones **prohibidas**: `XLOOKUP`, `FILTER`, `UNIQUE`, `SORT`, `SEQUENCE`,
   `XMATCH`. Permitidas: `INDEX`, `MATCH`, `SUMIFS`, `COUNTIFS`, `IFERROR`,
   `SUMPRODUCT`, `IF`, `WEEKDAY`, `MOD`, `TEXT`, `SUM`, `MIN`, `MAX`.
5. **Cero errores de fórmula** en el libro entregado.
6. Tablas nativas de Excel (`ListObject`) para respetar bandas y filtro.
7. Fuente **Arial 10** en todo el libro.
8. Español íntegro en textos visibles.

> Nota técnica: openpyxl escribe los nombres de función en inglés (`SUM`,
> `INDEX`). Excel en español los muestra traducidos (`SUMA`, `INDICE`)
> automáticamente. Es el almacenamiento correcto, no una desviación.

## Rangos con nombre

| Nombre | Apunta a | Contenido |
|---|---|---|
| `H_TEMA_NUEVO` | `Estrategia!$C$3` | 5 |
| `H_REPASO` | `Estrategia!$C$4` | 2,5 |
| `H_SIMULACRO` | `Estrategia!$C$5` | 2,5 |
| `DIAS_ESTUDIO` | `Progreso!$M$2:$M$5` | Lunes, Martes, Miércoles, Jueves |
| `INTERVALOS` | `Progreso!$M$9:$M$17` | 2, 7, 14, 30, 60, 90, 120, 150, 180 |

## Paleta (Anexo B, verificada contra las capturas)

| Elemento | Hex |
|---|---|
| Cabecera de tabla verde | `0B5C39` |
| Texto de cabecera | `FFFFFF` |
| Banda alterna clara | `F0F4F1` |
| Escala Temas nuevos mín → máx | `E6F2EA` → `7CC49A` |
| Fila Horas | `F1F3F4` |
| Resumen cabecera / cuerpo | `C8E6C9` / `E2F0E4` |
| Bloque rojo cabecera / cuerpo | `E6A9A0` / `F6D9D5` |
| Sesión superada | `38761D` |
| Sesión fallida | `A61C00` |
| Chip Referencia fondo / texto | `F4C7C3` / `A61C00` |
| Chip Analogía fondo / texto | `C9DAF8` / `1C4587` |
| Chip Evidencia fondo / texto | `FCE5CD` / `B45F06` |

---

## Pestaña 1 — Estrategia

### Tabla_1 (tarifas) — `B2:C5`

Cabecera fila 2: `Columna 1` | `Horas` — el nombre por defecto se replica tal cual.

| Columna 1 | Horas |
|---|---|
| Tema nuevo | 5 |
| Repaso activo | 2,5 |
| Simulacro escrito | 2,5 |

Estas tres celdas de horas son `H_TEMA_NUEVO`, `H_REPASO`, `H_SIMULACRO`.

### Bloques semanales

Cinco tablas nativas apiladas. Filas: `Temas nuevos`, `Repasos`, `Simulacros`,
`Horas`. Cabecera verde, texto blanco, filtro.

| Tabla | Rango | Cabecera | Temas nuevos | Repasos | Simulacros |
|---|---|---|---|---|---|
| `Semanas 1 a 8`   | `A7:I11`  | Tarea + Semana 1…8   | 3,2,1,2,1,1,1,2 | 2,4,6,3,6,6,6,3 | 0,0,0,1,0,0,0,1 |
| `Semanas 9 a 16`  | `A13:I17` | Tarea + Semana 9…16  | 1,1,1,2,1,1,1,2 | 6,6,6,3,6,6,6,3 | 0,0,0,1,0,0,0,1 |
| `Semanas 17 a 24` | `A19:I23` | Tarea + Semana 17…24 | 1,1,1,2,1,1,1,2 | 6,6,6,3,6,6,6,3 | 0,0,0,1,0,0,0,1 |
| `Semanas 25 a 30` | `A25:I29` | Tarea + Semana 25…30 + 2 col. vacías | 1,1,1,2,1,1 | 6,6,6,3,6,6 | 0,0,0,1,0,0 |
| `Semanas 31 a 34` | `A31:E34` | Tarea + Semana 31…34 | (fila ausente) | 10,10,10,10 | 1,1,1,1 |

Detalles que se replican **sin limpiar**:

- `Semanas 25 a 30`: las dos últimas columnas (H, I) van vacías y sus celdas
  muestran `-`. Cabecera de esas dos columnas también vacía.
- `Semanas 31 a 34`: **no** tiene fila `Temas nuevos` y usa **tema rojo**.

Corrección **autorizada y obligatoria** (error objetivo del autor, no diseño):
las cabeceras del bloque 31-34 dicen "Semana 25…28" en la captura y las cajas de
resumen dicen todas "Resumen semanas 1 a 8". Se corrige a la numeración real de
cada bloque y se anota en `SUPUESTOS.md`.

### Fila Horas — el motor

Cada celda de `Horas` es fórmula, nunca número:

```
= TemasNuevos*H_TEMA_NUEVO + Repasos*H_REPASO + Simulacros*H_SIMULACRO
```

En `Semanas 31 a 34` no hay fila de temas nuevos, así que el primer sumando cae.

Comprobación aritmética (debe cuadrar en las 34 semanas):
- Semana 1: 3×5 + 2×2,5 + 0×2,5 = 20 ✔
- Semana 4: 2×5 + 3×2,5 + 1×2,5 = 20 ✔
- Semana 31: 10×2,5 + 1×2,5 = 27,5 ✔

Cambiar `H_TEMA_NUEVO` de 5 a 6 debe recalcular las 34 semanas al instante.

### Cajas Resumen

A la derecha de cada bloque. Tres filas (`Temas estudiados`, `Repasos`,
`Simulacros`); el bloque rojo solo dos (`Repasos`, `Simulacros`). Los valores
salen de `SUM()` sobre la fila correspondiente del bloque, **nunca escritos**.

| Bloque | Ubicación | Temas estudiados | Repasos | Simulacros |
|---|---|---|---|---|
| 1–8   | `K7:L10`  | 13 | 36 | 2 |
| 9–16  | `K13:L16` | 10 | 42 | 2 |
| 17–24 | `K19:L22` | 10 | 42 | 2 |
| 25–30 | `K25:L28` | 7  | 33 | 1 |
| 31–34 | `G31:H33` | —  | 40 | 4 |

---

## Pestaña 2 — Progreso

### Tabla_2 — `A1:K41`

Cabecera fila 1: `Temas` | `Sesión 1` … `Sesión 10`. Verde oscuro, texto blanco.
Filas 2–41: `Tema 1` … `Tema 40`.

### Datos semilla (literales, fidelidad por encima del motor)

| Tema | Sesión 1 | Sesión 2 | Sesión 3 | Sesión 4 |
|---|---|---|---|---|
| Tema 1 | 01/06/2026 | 03/06/2026 | 09/06/2026 | 20/06/2026 |
| Tema 2 | 04/06/2026 | 06/06/2026 | 12/06/2026 | 20/06/2026 |
| Tema 3 | 06/06/2026 | 08/06/2026 | 15/06/2026 | 26/06/2026 |
| Tema 4 | 10/06/2026 | 13/06/2026 | 20/06/2026 | 27/06/2026 |
| Tema 5 | 13/06/2026 | 16/06/2026 | 24/06/2026 | 04/07/2026 |
| Tema 6 | 17/06/2026 | 19/06/2026 | 27/06/2026 | — |
| Tema 7 | 22/06/2026 | 25/06/2026 | 27/06/2026 | — |
| Tema 8 | 29/06/2026 | 01/07/2026 | — | — |
| Tema 9 | 02/07/2026 | 04/07/2026 | — | — |

Formato `dd/mm/aaaa`. Del Tema 10 en adelante, filas vacías con el motor activo.

### Zona de parámetros (columna M, visible y editable)

- `M1`: rótulo `Días de estudio`
- `M2:M5`: Lunes, Martes, Miércoles, Jueves → `DIAS_ESTUDIO`
- `M8`: rótulo `Intervalos (días)`
- `M9:M17`: 2, 7, 14, 30, 60, 90, 120, 150, 180 → `INTERVALOS`

### Motor de repetición espaciada

- `Sesión 1` = entrada manual del usuario.
- `Sesión N` (N≥2) = fecha anterior + `INDEX(INTERVALOS, N-1)`, **desplazada al
  siguiente día hábil** de `DIAS_ESTUDIO` si cae fuera.
- Si la sesión anterior está vacía, la celda queda **vacía** — nada de `#VALUE!`
  ni de `00/01/1900`.
- El usuario puede escribir encima de la propuesta: es comportamiento esperado.
- **Excepción de fidelidad:** las 9 filas semilla llevan las fechas literales de
  la tabla aunque el motor proponga otras.

El desplazamiento a día hábil se calcula **sin constantes mágicas**, desde
`DIAS_ESTUDIO`, mediante una tabla auxiliar en `_Motor` que traduce cada día de
la semana al número de días que faltan hasta el siguiente día hábil.

### Bordes de agrupación

Recuadros de colores (verde oscuro, azul marino, rojo oscuro) englobando grupos
de celdas: son las rondas de repaso. Se replican según lo visible en `ref/04` y
`ref/05`; los rangos exactos que no se resuelven mirando se documentan como
ambigüedad en `SUPUESTOS.md`.

### Mecánica rojo/verde

Fondo verde `38761D` = sesión superada, rojo `A61C00` = fallida, sin color =
pendiente. En Excel el usuario pinta a mano igual que en el original. La hoja
oculta `_Motor` mantiene la matriz espejo Temas × Sesiones que alimenta la
gráfica, ya que un color de fondo no es un dato legible por un gráfico.

### Gráfica 📈 y tarjetas KPI

Debajo/derecha de Tabla_2, sin tapar nada replicado. Líneas leyendo de `_Motor`:

1. `Tasa de éxito semanal (%)` — verde, gruesa, protagonista.
2. `Sesiones completadas (acumulado)` — azul, eje secundario.
3. `Tendencia (media móvil 3 semanas)` — gris discontinua.

Título: `📈 Curva de dominio — retención por semana`. Leyenda abajo.

Tres tarjetas KPI encima:

| Tarjeta | Contenido | Color |
|---|---|---|
| Tasa de éxito global | % de sesiones superadas | verde ≥80, ámbar 60-79, rojo <60 |
| Racha actual | sesiones seguidas sin fallo | siempre verde |
| Sesiones vencidas | programadas y no hechas | rojo si >0 |

Debe sobrevivir a datos vacíos: sin sesiones marcadas, ni `#DIV/0!` ni línea rota.

---

## Pestaña 3 — Calendario (sin captura, construcción derivada)

Cero entrada manual. Se alimenta solo de `Progreso`.

- **Semáforo de hoy** (bloque superior): qué toca hoy, qué venció sin hacer, qué
  viene en 7 días.
- **Agenda**: lista ordenada por fecha de todas las sesiones programadas —
  Fecha · Día de la semana · Tema · Nº de sesión · Estado. Fórmulas dinámicas.
- **Mini rejilla mensual**: recuento de sesiones por día, coloreada por carga
  (0 / 1-2 / 3+).
- Coherencia visual absoluta con las demás pestañas.

---

## Pestaña 4 — Preguntas

Tabla nativa `PREGUNTAS`, cabecera verde oscuro, texto blanco. Anchos: A ancha,
B media, C muy ancha.

Cabecera fila 1: `Preguntas` | `Tipo de información` | `Respuesta`.

| Fila | A | B | C |
|---|---|---|---|
| 2 | `Tema 1 - Descartes y 1ª Meditación` (negrita) | (vacío) | (vacío) |
| 3 | `Nacimiento?` | `Referencia` | `1596 La Haye` |
| 4 | `Pregunta 2` | `Analogía` | (multilínea, abajo) |
| 5 | `Pregunta 3` | `Evidencia` | (vacío) |
| 6 | (vacío) | `Referencia` | (vacío) |

Celda `C4`, cuatro líneas con salto de línea real dentro de una sola celda:

```
1619: Alemania, contacto con nuevo sistema científico y matemático;
1628: "Reglas para la dirección de la mente"
1637: "Discurso del método"
1641: "Meditaciones de la primera filosofía" + "Objeciones y respuestas"
```

Validación de datos en la columna B — **exactamente tres opciones**:
`Referencia`, `Analogía`, `Evidencia`. Los colores de chip se consiguen con
formato condicional sobre el mismo rango (en Excel no existe el chip nativo de
Sheets; es la equivalencia visual honesta y se documenta).

Filas 7 en adelante: vacías con la validación activa.

---

## Definición de hecho

- [ ] 4 pestañas en orden y `Contenidos` no existe
- [ ] Render lado a lado contra las 6 capturas sin diferencias reseñables
- [ ] `verificar.py` pasa entero y su salida se enseña
- [ ] Cambiar una tarifa en Tabla_1 recalcula las 34 semanas
- [ ] La gráfica funciona con datos y con la hoja vacía
- [ ] Auditoría de Precision Forge sin hallazgos críticos ni altos
- [ ] `README.md`, `SUPUESTOS.md` y `MEJORAS-PROPUESTAS.md` escritos
