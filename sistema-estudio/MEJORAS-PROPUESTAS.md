# MEJORAS PROPUESTAS

Cosas que **no** están implementadas, a propósito. La regla del encargo era
fidelidad antes que criterio propio: si algo del diseño original parecía
mejorable, se replicaba igual y se anotaba aquí para que decidas tú.

Ninguna de estas está en el archivo entregado. Pídeme la que quieras y la hago.

---

## 1. Desplegables de estado en vez de pintar la celda

**Qué es.** Hoy marcas una sesión superada o fallida pintando el fondo de la
celda de verde o de rojo. La alternativa es una columna de estado con un
desplegable de tres opciones (Superada / Fallida / Pendiente) y el color puesto
por formato condicional.

**Por qué no está.** El propio encargo la marcaba como alternativa documentada,
no como implementación. Y hay una razón de fondo: pintar es un gesto de un
segundo que ya tienes interiorizado, y un sistema de estudio sobrevive o muere
por lo fácil que sea rellenarlo cada día durante meses.

**Qué ganarías.** El estado pasaría a ser un dato de verdad. Se podría filtrar,
contar y graficar sin ningún paso intermedio, y funcionaría igual en Excel, en
Google Sheets y en el móvil.

**Qué perderías.** Un clic más por sesión, y una columna más de ancho.

---

## 2. Macros en Excel para leer los colores

**Qué es.** Un archivo `.xlsm` con una macro que recorre las celdas de fechas,
lee el color de fondo de cada una y escribe el estado en las columnas del motor.
Sería el equivalente exacto del menú *📊 Sistema de Estudio → Sincronizar
estados* que el encargo describe para Google Sheets.

**Por qué no está.** Un archivo `.xlsx` no puede contener macros: es una
limitación del formato, no una decisión. Y pediste `.xlsx`.

**La consecuencia real.** En Excel, **ninguna fórmula puede leer el color de
fondo de una celda**. Por eso las columnas del motor que alimentan la gráfica
llevan hoy un desplegable manual: es la única forma de registrar el estado sin
macros. Si quieres la lectura automática del color, hay dos caminos: el `.xlsm`
con la macro, o la mejora nº 1 (desplegables), que resuelve lo mismo sin macros
y funciona en cualquier programa.

---

## 3. La Ruta A: Google Sheets nativo con Apps Script

**Qué es.** Un archivo `Sistema-Estudio.gs` que pegas en Extensiones → Apps
Script de una hoja nueva y ejecutas una vez. Construye el sistema entero.

**Por qué no está.** Elegiste `.xlsx`. El encargo ofrecía las dos rutas y esta
quedó fuera.

**Qué ganarías.** El original de las capturas *es* Google Sheets. Solo ahí se
replica el 100 % del aspecto: los chips de colores de la columna
*Tipo de información* son un control nativo de Sheets que en Excel no existe —
aquí están imitados con formato condicional, que se ve casi igual pero no es lo
mismo. Además tendrías el menú personalizado, la sincronización automática de
estados y el disparador diario.

Si vas a usar el sistema en el navegador o en el móvil, esta ruta es
objetivamente mejor. Dímelo y la construyo.

---

## 4. Convertir las tablas en rangos con crecimiento automático

**Qué es.** Hoy la tabla de Progreso llega hasta el Tema 40. Se puede extender
sola sin tocar nada.

**Por qué no está.** El original tiene un número fijo de filas y la fidelidad
mandaba.

**Qué ganarías.** No tener que pensar nunca en el límite.

---

## 5. Bloquear las celdas de fórmula

**Qué es.** Proteger la hoja dejando editables solo las celdas de entrada, de
modo que sea imposible escribir encima de una fórmula por accidente.

**Por qué no está.** El original no está protegido, y la protección estorba
mientras el sistema aún se está ajustando.

**Qué ganarías.** El error más caro de una hoja de cálculo —machacar una fórmula
sin darte cuenta— dejaría de ser posible. Es la mejora que más recomiendo de esta
lista una vez que el sistema esté estable y ya no lo toques.

**Qué perderías.** Cada ajuste estructural exigiría desproteger primero.

---

## 6. Un histórico de cambios

**Qué es.** Una hoja oculta que anota cada vez que se marca una sesión, con
fecha y hora.

**Por qué no está.** Nadie lo pidió, y añade complejidad a algo que funciona.

**Qué ganarías.** Poder responder a "¿cuántas horas estudié de verdad en marzo?"
en vez de solo "¿qué sesiones tenía programadas?". Requiere macros o Apps Script.

---

## 7. Corrección que sí se aplicó (no es una propuesta, es un aviso)

En el original, las cabeceras del bloque *Semanas 31 a 34* dicen "Semana 25…28" y
las cinco cajas de resumen dicen todas "Resumen semanas 1 a 8". Es un arrastre de
copiar y pegar. Se corrigió a la numeración real de cada bloque porque es un
error objetivo y no altera nada visual, tal como autorizaba el encargo. Queda
anotado en `SUPUESTOS.md`.
