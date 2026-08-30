# Ejemplo Planificador Oposición — manual de uso

Este archivo es un sistema de estudio completo en una sola hoja de cálculo. No
hace falta saber de Excel para usarlo: solo hay que entender qué se escribe y
qué se deja en paz.

Ábrelo con Excel (o con LibreOffice Calc, o súbelo a Google Sheets). No necesita
instalación, ni complementos, ni conexión a internet.

---

## La regla de oro, en una frase

**Solo escribes en las celdas blancas de entrada. Todo lo demás se calcula solo.**

Si escribes encima de una celda que llevaba una fórmula, la rompes: esa celda
deja de actualizarse para siempre y nadie te avisa. Si te pasa, pulsa
`Ctrl+Z` (deshacer) inmediatamente.

Las celdas que **nunca** debes tocar son las que muestran totales, sumas y horas.
En este libro son concretamente:

- la fila **Horas** de todos los bloques de la pestaña Estrategia,
- las **cajas Resumen** de la derecha en Estrategia,
- **toda** la pestaña Calendario,
- las tarjetas y la gráfica de la pestaña Progreso.

---

## Las cuatro pestañas, y para qué sirve cada una

Cada pestaña responde a una pregunta distinta del mismo ciclo de estudio.

### 1. Estrategia — «¿cuánto puedo abarcar?»

Reparte tu tiempo disponible entre tres tipos de trabajo: temas nuevos, repasos
y simulacros. Arriba a la izquierda hay una tabla pequeña que dice cuántas horas
cuesta cada uno. Debajo, los bloques de semanas.

**Qué escribes tú:** las cantidades de *Temas nuevos*, *Repasos* y *Simulacros*
de cada semana. Son números normales.

**Qué se calcula solo:** la fila *Horas*. Es la suma de lo que cuesta todo lo que
has puesto esa semana.

> **Ejemplo.** En la Semana 1 hay 3 temas nuevos, 2 repasos y 0 simulacros.
> Como un tema nuevo cuesta 5 horas y un repaso 2,5, la fila Horas calcula
> 3×5 + 2×2,5 = **20 horas**. Si cambias los 3 temas nuevos por 4, las horas
> pasan solas a 25. No tienes que tocar nada más.

Así es como se usa de verdad: mueves las cantidades hasta que las horas cuadren
con el tiempo que realmente tienes esa semana.

### 2. Progreso — «¿qué he hecho de verdad?»

Una fila por tema y diez columnas de sesiones. Aquí registras cuándo estudiaste
cada tema y cuándo lo repasaste.

**Qué escribes tú:** solo la **Sesión 1** de cada tema — el día que lo estudiaste
por primera vez.

**Qué se calcula solo:** las sesiones 2 a 10. El libro te propone las fechas de
repaso siguiendo la curva del olvido: primero a los pocos días, luego cada vez
más espaciado. Y si una fecha propuesta cae en un día en el que no estudias, la
mueve sola al siguiente día bueno.

> **Ejemplo.** Escribes `01/06/2026` en la Sesión 1 del Tema 1. El libro rellena
> solo la Sesión 2, la 3, la 4… con las fechas de repaso que te tocan.
> Si borras esa fecha, todas las demás se vacían solas. No queda ningún error
> raro en pantalla.

**Puedes escribir encima de una fecha propuesta.** Si un día repasas antes o
después de lo previsto, pon la fecha real. Eso está permitido y es lo esperado:
la propuesta es una sugerencia, no una orden.

**Los colores.** Pinta tú el fondo de la celda de una fecha cuando esa sesión ya
haya pasado: **verde** si te salió bien, **rojo** si te salió mal. Déjala sin
color si aún está pendiente. Es un gesto de un segundo y es lo que alimenta las
estadísticas.

Para pintar: selecciona la celda, y en la barra de arriba pulsa el botón del
cubo de pintura (🪣) y elige el color.

### 3. Calendario — «¿qué me toca hoy?»

No se escribe nada aquí. Absolutamente nada. Esta pestaña lee sola lo que hay en
Progreso y te lo ordena por fecha: qué toca hoy, qué se te ha pasado sin hacer y
qué viene en los próximos siete días.

Si cambias algo en Progreso, esta pestaña cambia sola.

### 4. Preguntas — «¿me lo sé?»

Para estudiar recordando en vez de releyendo. A la izquierda la pregunta, a la
derecha la respuesta, y en medio una etiqueta de color que dice qué tipo de
información es.

**Qué escribes tú:** todo. La pregunta, la respuesta, y eliges la etiqueta.

La columna del medio tiene un desplegable con tres opciones y nada más:
*Referencia* (un dato concreto), *Analogía* (una comparación que lo explica) y
*Evidencia* (la prueba de por qué es así). Haz clic en la celda y aparece la
flecha para elegir.

> **Ejemplo.** Pregunta: `Nacimiento?` · Tipo: `Referencia` · Respuesta:
> `1596 La Haye`. Tapas la columna de la derecha con la mano, intentas
> responder, y luego destapas para comprobar.

---

## Cómo cambiar las horas que cuesta cada sesión

Están en la tabla pequeña de arriba a la izquierda de la pestaña **Estrategia**:

| Columna 1 | Horas |
|---|---|
| Tema nuevo | 5 |
| Repaso activo | 2,5 |
| Simulacro escrito | 2,5 |

**Cambia el número directamente ahí y ya está.** Las 34 semanas se recalculan
solas al instante. No hay que tocar ninguna otra celda.

> **Ejemplo.** Si descubres que un tema nuevo te lleva 6 horas y no 5, escribe
> `6` donde pone `5`. Todas las filas Horas de todos los bloques se actualizan
> en el momento, y verás enseguida qué semanas se te han desbordado.

Esta es la razón de que la fila Horas sea una fórmula y no un número escrito:
para que puedas hacer justamente esto.

---

## Cómo cambiar los intervalos de repaso

Están en la pestaña **Progreso**, en una columna a la derecha de la tabla, bajo
el rótulo *Intervalos (días)*. Son nueve números:

```
2, 7, 14, 30, 60, 90, 120, 150, 180
```

Significan: el primer repaso a los 2 días de estudiar el tema, el segundo a los
7, el tercero a los 14, y así. **Cambia el número que quieras y las fechas de
todos los temas se recolocan solas.**

> **Ejemplo.** Si los repasos a 2 días te resultan demasiado seguidos, cambia el
> `2` por un `3`. Todas las Sesiones 2 de todos los temas se mueven un día.

---

## Cómo cambiar los días en que estudias

Justo encima de los intervalos, en la misma pestaña Progreso, hay una lista bajo
el rótulo *Días de estudio*:

```
Lunes, Martes, Miércoles, Jueves
```

Son los días en los que sí estudias. Cuando una fecha de repaso cae en un día que
no está en esta lista, el libro la empuja sola al siguiente día que sí está.

> **Ejemplo.** Si empiezas a estudiar también los viernes, escribe `Viernes` en
> la primera celda libre de esa lista. A partir de ahí, los repasos que caigan en
> viernes ya no se moverán al lunes siguiente.

---

## Preguntas frecuentes

**He escrito encima de una fórmula sin querer.**
Pulsa `Ctrl+Z` inmediatamente. Si ya has guardado y cerrado, la forma más rápida
de recuperar esa celda es copiarla de la celda de al lado (arrastrando desde la
esquina inferior derecha), porque todas las de la misma fila o columna llevan la
misma fórmula.

**Una celda muestra `#####`.**
No es un error: la columna es demasiado estrecha para el número. Haz doble clic
en la línea que separa las letras de las columnas y se ensancha sola.

**He borrado la fecha de la Sesión 1 de un tema.**
Es correcto y no rompe nada: las sesiones 2 a 10 de ese tema se quedan vacías,
sin ningún mensaje de error. Cuando vuelvas a poner una fecha, se rellenan otra
vez.

**¿Puedo añadir más temas?**
Sí. La tabla llega hasta el Tema 40. Si necesitas más, sitúate en la última fila
y pulsa el tabulador: la tabla crece sola y arrastra las fórmulas.

**¿Puedo subirlo a Google Sheets?**
Sí, se abre sin problema. Ten en cuenta que la gráfica y algunos detalles de
formato pueden verse ligeramente distintos, porque cada programa dibuja a su
manera.
