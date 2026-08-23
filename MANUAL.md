# 💵 Gerente de Finanzas — Manual de construcción

> Manual técnico completo. Nombres de propiedades **exactos**, fórmulas de **Notion 2.0**
> listas para copiar, y configuración literal de cada rollup, botón y vista.
>
> Convención tipográfica del manual:
> `Propiedad` = nombre exacto de propiedad · **Botón** = elemento de interfaz · `Valor` = opción de selección.

---

## Índice

- [FASE 0 · Preparación del espacio](#fase-0--preparación-del-espacio)
- [FASE 1 · Arquitectura de bases de datos (el motor interno)](#fase-1--arquitectura-de-bases-de-datos-el-motor-interno)
  - [BD 1 · Cuentas](#bd-1--cuentas)
  - [BD 2 · Transacciones](#bd-2--transacciones)
  - [BD 3 · Presupuestos](#bd-3--presupuestos)
  - [BD 4 · Deudas](#bd-4--deudas)
  - [BD 5 · Inversiones](#bd-5--inversiones)
  - [BD 6 · Suscripciones](#bd-6--suscripciones)
  - [BD 7 · Historial Mensual](#bd-7--historial-mensual)
  - [BD 8 · Master Financiero](#bd-8--master-financiero)
- [FASE 2 · Automatizaciones y botones rápidos](#fase-2--automatizaciones-y-botones-rápidos)
- [FASE 3 · Diseño del dashboard (UI/UX)](#fase-3--diseño-del-dashboard-uiux)
- [FASE 4 · Páginas de navegación y vistas](#fase-4--páginas-de-navegación-y-vistas)
- [FASE 5 · Verificación y solución de problemas](#fase-5--verificación-y-solución-de-problemas)

---

# FASE 0 · Preparación del espacio

### 0.1 · Crear la página raíz

1. En la barra lateral de Notion pulsa **+ Nueva página**.
2. Título: `Gerente de Finanzas`.
3. **Icono:** pasa el ratón sobre el título → **Añadir icono** → pestaña **Iconos** → busca
   `money` o `wallet`. Para replicar el icono del diseño original (billete + persona) usa
   la pestaña **Personalizado** y sube un PNG monocromo de 280×280 px con fondo transparente.
   Color del icono: **Gris claro (#D9D9D9)** para que funcione en modo oscuro.
4. **Portada:** opcional. Si la pones, usa una imagen oscura con degradado (`Unsplash → dark gradient`).

### 0.2 · Activar el modo oscuro

`Cmd/Ctrl + Shift + L` alterna claro/oscuro. También en **Configuración → Apariencia → Oscuro**.

> ⚠️ El modo oscuro es una preferencia **por usuario y por dispositivo**, no una propiedad de la
> plantilla. Si compartes la plantilla, quien la duplique la verá en su propio modo. En la
> descripción de la plantilla indica: *"Recomendado en modo oscuro (Cmd/Ctrl + Shift + L)"*.

### 0.3 · Crear la página contenedora de bases de datos

Las 8 bases de datos **no** deben vivir sueltas en la barra lateral. Crea dentro de
`Gerente de Finanzas` una subpágina llamada:

```
⚙️ Motor de datos (no tocar)
```

Ahí crearás las 8 BD como **bases de datos de página completa**. En el dashboard nunca mostrarás
la base de datos original, sino **vistas enlazadas** (`/vista enlazada de base de datos`). Esto es
lo que permite que el mismo dato aparezca en cinco sitios distintos con cinco filtros distintos.

### 0.4 · Fijar la moneda

Todas las propiedades de tipo **Número** que representen dinero se configuran así:

> Editar propiedad → **Formato del número** → **Euro (€)**

Cambia a la divisa que uses; el manual asume **€** porque es la del diseño original.

---

# FASE 1 · Arquitectura de bases de datos (el motor interno)

Crea las 8 bases de datos **vacías** primero (solo el nombre), y después vuelve a cada una para
añadir propiedades. Notion no permite crear una relación hacia una BD que aún no existe.

| # | Base de datos | Función |
|---|---|---|
| 1 | `Cuentas` | Dónde está el dinero. Calcula el saldo real. |
| 2 | `Transacciones` | Libro mayor único: ingresos, gastos, traslados, inversiones, pagos de deuda y suscripciones. |
| 3 | `Presupuestos` | Límite por categoría y mes, con barra de progreso. |
| 4 | `Deudas` | Saldo pendiente, cuota mensual y mora. |
| 5 | `Inversiones` | Cartera a corto y largo plazo, con rendimiento. |
| 6 | `Suscripciones` | Costes recurrentes normalizados a mensual. |
| 7 | `Historial Mensual` | Fotografía mensual del patrimonio. Alimenta la gráfica de líneas. |
| 8 | `Master Financiero` | **Una sola fila.** Centro de mando con todos los rollups globales. |

---

## BD 1 · Cuentas

Representa cada bolsillo donde vive el dinero. En el diseño original hay 4 filas:
`Efectivo`, `Tarjeta electrónica`, `Otros`, `Banco`.

### 1.1 · Propiedades base

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Cuenta` | Título | — |
| `Tipo de cuenta` | Selección | `Efectivo` · `Tarjeta` · `Banco` · `Otros` |
| `Saldo Inicial` | Número | Formato **Euro (€)** |
| `Divisa` | Selección | `EUR` · `USD` · `MXN` (opcional, para multidivisa) |
| `Activa` | Casilla de verificación | Marcada por defecto |
| `Notas` | Texto | Nº de cuenta enmascarado, banco, etc. |

> 💡 `Saldo Inicial` es el saldo que tenía la cuenta **el día que empezaste a usar la plantilla**.
> Es el único número que introduces a mano una vez y nunca más tocas. Todo lo demás se calcula.

### 1.2 · Relaciones (se crean desde `Transacciones`, ver BD 2)

Cuando en la BD `Transacciones` crees las relaciones `Cuenta de Origen` y `Cuenta de Destino`
con la **sincronización bilateral activada**, aparecerán automáticamente aquí dos propiedades
nuevas. Renómbralas exactamente así:

| Propiedad creada por Notion | Renómbrala a |
|---|---|
| `Transacciones (Cuenta de Origen)` | `Movimientos (Origen)` |
| `Transacciones (Cuenta de Destino)` | `Movimientos (Destino)` |

Añade además, creada desde esta BD:

| Propiedad | Tipo | Apunta a |
|---|---|---|
| `Master` | Relación | `Master Financiero` (sincronización bilateral **activada**, nombre inverso: `Todas las Cuentas`) |

> ⚠️ **Error clásico:** crear dos relaciones independientes (una en Cuentas y otra en
> Transacciones) en lugar de una sola bilateral. Si lo haces, los rollups devolverán 0 y los
> vínculos no se propagarán. Crea la relación **una vez**, desde la BD hija, y activa
> *"Mostrar en «Cuentas»"*.

### 1.3 · Rollups (el corazón del saldo)

Crea 4 propiedades de tipo **Rollup**. Configuración literal:

| Propiedad | Relación | Propiedad | Cálculo |
|---|---|---|---|
| `Σ Ingresos` | `Movimientos (Origen)` | `Monto Ingreso` | **Suma** |
| `Σ Salidas` | `Movimientos (Origen)` | `Salida de Caja` | **Suma** |
| `Σ Traslados Enviados` | `Movimientos (Origen)` | `Monto Traslado` | **Suma** |
| `Σ Traslados Recibidos` | `Movimientos (Destino)` | `Monto Traslado` | **Suma** |

**Por qué funciona:** los rollups de Notion **no admiten filtros**. La solución profesional es
pre-filtrar en la BD hija: `Monto Ingreso` ya vale `0` en todas las filas que no son ingresos, así
que una simple **Suma** equivale a un "suma solo los ingresos". Este patrón se repite en toda la
plantilla.

**Por qué `Salida de Caja` y no `Monto Gasto`:** del bolsillo también salen inversiones, pagos de
deuda y suscripciones. Si el saldo solo restara los gastos, la cuenta mentiría. `Su gasto total`
del informe, en cambio, sí usa solo `Monto Gasto`, para no inflar la cifra de gasto con
transferencias a tu propia cartera de inversión.

### 1.4 · Fórmula `Saldo Actual` (Número)

Crea una propiedad de tipo **Fórmula** llamada `Saldo Actual`:

```notion
prop("Saldo Inicial")
+ prop("Σ Ingresos")
- prop("Σ Salidas")
- prop("Σ Traslados Enviados")
+ prop("Σ Traslados Recibidos")
```

Después: **Editar propiedad → Formato del número → Euro (€)**.

> 🔑 **Esta propiedad debe ser una fórmula, no un rollup.** Notion **no permite hacer un rollup de
> otro rollup**, pero **sí permite hacer un rollup de una fórmula** (aunque la fórmula contenga
> rollups dentro). Gracias a esto, el Master Financiero podrá sumar los saldos de las 4 cuentas.

### 1.5 · Fórmula `Current Balance` (Texto — la que se ve en la tarjeta)

En el diseño original la tarjeta de cada cuenta muestra `Current Balance: €-411`, con la etiqueta
en fondo gris de código. En las tarjetas de galería de Notion **las propiedades se muestran sin su
nombre**, así que la etiqueta tiene que ir *dentro* de la fórmula:

```notion
style("Current Balance:", "c") + " €" + format(round(prop("Saldo Actual")))
```

- `style(texto, "c")` aplica formato **código** → es lo que produce el fondo gris de la etiqueta.
- `format(round(x))` convierte a texto sin decimales. Un saldo negativo se renderiza como
  `€-411`, exactamente igual que en el diseño de referencia.

Si prefieres separador de miles (`€1.449`), usa la versión ampliada:

```notion
lets(
  n, round(prop("Saldo Actual")),
  neg, n < 0,
  a, abs(n),
  miles, floor(a / 1000),
  resto, a % 1000,
  cuerpo, if(miles > 0, format(miles) + "." + padStart(format(resto), 3, "0"), format(resto)),
  style("Current Balance:", "c") + " " + if(neg, "-", "") + "€" + cuerpo
)
```

> Válida hasta 999.999 €. Para cifras mayores anida otro nivel de millares.

### 1.6 · Propiedades opcionales de calidad de vida

| Propiedad | Tipo | Fórmula / Config |
|---|---|---|
| `Salud` | Fórmula | `if(prop("Saldo Actual") < 0, "🔴 En negativo", if(prop("Saldo Actual") < 100, "🟡 Bajo", "🟢 OK"))` |
| `Nº Movimientos` | Rollup | `Movimientos (Origen)` → `Descripción` → **Contar todos** |
| `Último Movimiento` | Rollup | `Movimientos (Origen)` → `Fecha` → **Más reciente** |

### 1.7 · Las 4 filas iniciales

| `Cuenta` | Icono | `Tipo de cuenta` | `Saldo Inicial` |
|---|---|---|---|
| Efectivo | 💵 | `Efectivo` | 0 € |
| Tarjeta electrónica | 💳 | `Tarjeta` | 0 € |
| Otros | 🗂️ | `Otros` | 0 € |
| Banco | 🏦 | `Banco` | 0 € |

> Pon el icono en la **página** de cada fila (no en una propiedad): las tarjetas de galería lo
> muestran junto al título, que es como se consigue el aspecto del diseño original.

---

## BD 2 · Transacciones

**La base de datos más importante del sistema.** Un único libro mayor para los 6 tipos de
movimiento. No crees bases separadas para gastos e ingresos: perderías la capacidad de calcular
saldos, y los traslados serían imposibles de cuadrar.

### 2.1 · Propiedades base

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Descripción` | Título | — |
| `Cantidad` | Número | Formato **Euro (€)**. **Siempre en positivo.** |
| `Tipo` | Selección | `Ingreso` · `Gasto` · `Traslado` · `Inversión` · `Pago de Deuda` · `Suscripción` |
| `Categoría` | Selección | Ver lista abajo |
| `Fecha` | Fecha | Formato `DD/MM/YYYY`, sin hora |
| `Método` | Selección | `Efectivo` · `Tarjeta` · `Transferencia` · `Domiciliación` (opcional) |
| `Recurrente` | Casilla | Marca los movimientos que se repiten cada mes |
| `Archivado` | Casilla | Alimenta la vista **Archivo** del dashboard |
| `Adjunto` | Archivos y elementos multimedia | Foto del recibo |

**Categorías sugeridas** (ajústalas a tu vida, pero mantén la misma lista en `Presupuestos`):

`Vivienda` · `Supermercado` · `Restaurantes` · `Transporte` · `Salud` · `Ocio` · `Educación` ·
`Ropa` · `Suscripciones` · `Impuestos` · `Salario` · `Freelance` · `Reembolsos` · `Regalos` · `Otros`

> 🎨 Asigna colores por familia: gastos en rojo/naranja, ingresos en verde, traslados en azul.
> Las gráficas de anillo heredan estos colores automáticamente.

### 2.2 · Relaciones

Créalas **todas desde aquí**, activando siempre *"Mostrar en …"* (sincronización bilateral):

| Propiedad | Apunta a | Nombre inverso en la otra BD |
|---|---|---|
| `Cuenta de Origen` | `Cuentas` | `Movimientos (Origen)` |
| `Cuenta de Destino` | `Cuentas` | `Movimientos (Destino)` |
| `Presupuesto` | `Presupuestos` | `Movimientos` |
| `Deuda Vinculada` | `Deudas` | `Pagos` |
| `Inversión Vinculada` | `Inversiones` | `Aportes` |
| `Suscripción Vinculada` | `Suscripciones` | `Cargos` |
| `Master` | `Master Financiero` | `Todas las Transacciones` |

**Regla semántica de cada tipo:**

| `Tipo` | `Cuenta de Origen` | `Cuenta de Destino` | Vínculo adicional |
|---|---|---|---|
| `Ingreso` | Cuenta que **recibe** | vacío | — |
| `Gasto` | Cuenta que **paga** | vacío | `Presupuesto` |
| `Traslado` | Cuenta que **envía** | Cuenta que **recibe** | — |
| `Inversión` | Cuenta que **paga** | vacío | `Inversión Vinculada` |
| `Pago de Deuda` | Cuenta que **paga** | vacío | `Deuda Vinculada` |
| `Suscripción` | Cuenta que **paga** | vacío | `Suscripción Vinculada` |

> En un `Ingreso`, `Cuenta de Origen` significa "cuenta de destino del dinero". Es contraintuitivo
> pero es lo que permite usar **una sola relación** para el 90 % de los movimientos y mantener los
> rollups simples. Si prefieres claridad sobre simplicidad, renombra la propiedad a `Cuenta`.

### 2.3 · Fórmulas de pre-filtro (el truco que hace posible todo)

Crea estas **6 fórmulas**. Todas devuelven un número. Son las que los rollups suman.

`Monto Ingreso`
```notion
if(prop("Tipo") == "Ingreso", prop("Cantidad"), 0)
```

`Monto Gasto` — solo gasto corriente, para el informe y la gráfica de anillo
```notion
if(prop("Tipo") == "Gasto", prop("Cantidad"), 0)
```

`Monto Traslado`
```notion
if(prop("Tipo") == "Traslado", prop("Cantidad"), 0)
```

`Monto Inversión`
```notion
if(prop("Tipo") == "Inversión", prop("Cantidad"), 0)
```

`Monto Deuda`
```notion
if(prop("Tipo") == "Pago de Deuda", prop("Cantidad"), 0)
```

`Monto Suscripción`
```notion
if(prop("Tipo") == "Suscripción", prop("Cantidad"), 0)
```

`Salida de Caja` — **todo lo que abandona la cuenta** (sin contar traslados, que se tratan aparte)
```notion
if(
  prop("Tipo") == "Gasto"
    or prop("Tipo") == "Inversión"
    or prop("Tipo") == "Pago de Deuda"
    or prop("Tipo") == "Suscripción",
  prop("Cantidad"),
  0
)
```

`Flujo Neto` — útil para gráficas de barras de ingresos vs gastos
```notion
prop("Monto Ingreso") - prop("Salida de Caja")
```

> Pon las 8 en formato **Euro (€)** y ocúltalas en las vistas de usuario
> (**⋯ → Propiedades → ocultar**). Son maquinaria interna: el usuario nunca debe verlas.

### 2.4 · Fórmula `Medio` (segmenta las gráficas de anillo)

Las dos gráficas de anillo del dashboard están segmentadas por **medio de pago**
(`Efectivo`, `Tarjeta`, `Banco`, `Otros`). Esa información vive en `Cuentas`, así que hay que
traerla con una fórmula que atraviesa la relación:

```notion
lets(
  cuenta, prop("Cuenta de Origen").first(),
  if(
    empty(prop("Cuenta de Origen")),
    "Sin asignar",
    format(cuenta.prop("Tipo de cuenta"))
  )
)
```

- `.first()` toma la primera página relacionada.
- `cuenta.prop("Tipo de cuenta")` lee una propiedad **de la página relacionada** — esto solo es
  posible en Notion Fórmulas 2.0.
- `format(...)` convierte la selección en texto, requisito para que la gráfica pueda agrupar.

### 2.5 · Fórmulas de periodo

`Mes` — clave de agrupación estable y ordenable
```notion
formatDate(prop("Fecha"), "YYYY-MM")
```

`Mes (etiqueta)` — para mostrar al usuario
```notion
formatDate(prop("Fecha"), "MMMM YYYY")
```

`Periodo` — clasifica el movimiento respecto al mes en curso
```notion
lets(
  f, prop("Fecha"),
  if(empty(f), "Sin fecha",
  if(formatDate(f, "YYYY-MM") == formatDate(now(), "YYYY-MM"), "Mes actual",
  if(f > now(), "Futuro", "Meses anteriores")))
)
```

### 2.6 · Fórmula `Validación` (control de calidad del dato)

Detecta los 4 errores que corrompen los cálculos. Muéstrala en la vista de tabla de
`Transacciones` y ordénala descendente para ver los errores arriba:

```notion
lets(
  errores,
  [
    if(prop("Cantidad") <= 0, "cantidad debe ser > 0", ""),
    if(empty(prop("Fecha")), "falta la fecha", ""),
    if(empty(prop("Cuenta de Origen")), "falta la cuenta", ""),
    if(prop("Tipo") == "Traslado" and empty(prop("Cuenta de Destino")), "traslado sin destino", ""),
    if(prop("Tipo") == "Traslado" and prop("Cuenta de Origen") == prop("Cuenta de Destino"), "origen = destino", "")
  ].filter(current != ""),
  if(errores.length() == 0, "✅", "⚠️ " + errores.join(" · "))
)
```

### 2.7 · Vistas obligatorias de esta BD

| Nombre de la vista | Tipo | Filtro | Orden |
|---|---|---|---|
| `Todo` | Tabla | `Archivado` no marcado | `Fecha` ↓ |
| `Gastos` | Tabla | `Tipo` = `Gasto` | `Fecha` ↓ |
| `Ingresos` | Tabla | `Tipo` = `Ingreso` | `Fecha` ↓ |
| `Traslados` | Tabla | `Tipo` = `Traslado` | `Fecha` ↓ |
| `Este mes` | Tabla | `Periodo` = `Mes actual` | `Fecha` ↓ |
| `Por revisar` | Tabla | `Validación` **no contiene** `✅` | — |
| `Archivo` | Tabla | `Archivado` marcado | `Fecha` ↓ |

---

## BD 3 · Presupuestos

### 3.1 · Propiedades

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Presupuesto` | Título | Ej. `Supermercado · Junio 2025` |
| `Categoría` | Selección | **La misma lista exacta que en `Transacciones`** |
| `Límite` | Número | Euro (€) |
| `Mes` | Fecha | Día 1 del mes presupuestado |
| `Movimientos` | Relación | ← creada desde `Transacciones` (`Presupuesto`) |
| `Gastado` | **Rollup** | `Movimientos` → `Monto Gasto` → **Suma** |

### 3.2 · Fórmulas

`Restante`
```notion
prop("Límite") - prop("Gastado")
```

`% Uso` — pon el formato de número en **Porcentaje**
```notion
if(prop("Límite") == 0, 0, prop("Gastado") / prop("Límite"))
```

`Progreso` — barra visual de 10 segmentos
```notion
lets(
  pct, if(prop("Límite") == 0, 0, prop("Gastado") / prop("Límite")),
  llenos, floor(min(pct, 1) * 10),
  repeat("█", llenos)
    + repeat("░", 10 - llenos)
    + "  "
    + format(round(pct * 100)) + "%"
)
```

`Estado Presupuesto` — semáforo
```notion
lets(
  pct, if(prop("Límite") == 0, 0, prop("Gastado") / prop("Límite")),
  if(pct >= 1, "🔴 Excedido",
  if(pct >= 0.8, "🟡 Atención",
  if(pct > 0, "🟢 En control", "⚪ Sin gasto")))
)
```

> 🔁 **Presupuestos mensuales sin trabajo manual:** duplica las filas del mes anterior el día 1 y
> cambia solo `Mes`. O crea un botón **Duplicar presupuestos** (ver FASE 2, botón extra).

---

## BD 4 · Deudas

### 4.1 · Propiedades

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Deuda` | Título | Ej. `Préstamo coche` |
| `Acreedor` | Texto | Banco, persona, entidad |
| `Tipo de Deuda` | Selección | `Préstamo` · `Tarjeta de crédito` · `Hipoteca` · `Personal` · `Otro` |
| `Monto Original` | Número | Euro (€) |
| `Tasa Anual` | Número | Formato **Porcentaje** |
| `Cuota Mensual` | Número | Euro (€) |
| `Próximo Vencimiento` | Fecha | — |
| `Estado` | Selección | `Activa` · `Pagada` · `En mora` |
| `Pagos` | Relación | ← creada desde `Transacciones` (`Deuda Vinculada`) |
| `Master` | Relación | → `Master Financiero` (inverso: `Todas las Deudas`) |
| `Total Pagado` | **Rollup** | `Pagos` → `Monto Deuda` → **Suma** |

### 4.2 · Fórmulas

`Saldo Pendiente`
```notion
max(prop("Monto Original") - prop("Total Pagado"), 0)
```

`% Amortizado` — formato **Porcentaje**
```notion
if(prop("Monto Original") == 0, 0, prop("Total Pagado") / prop("Monto Original"))
```

`Cuota Vencida` — **esta es la que alimenta "Deuda mensual vencida" del informe**
```notion
if(
  prop("Estado") != "Pagada"
    and not empty(prop("Próximo Vencimiento"))
    and dateBetween(now(), prop("Próximo Vencimiento"), "days") >= 0,
  min(prop("Cuota Mensual"), prop("Saldo Pendiente")),
  0
)
```

`Días de Atraso`
```notion
lets(
  v, prop("Próximo Vencimiento"),
  d, if(empty(v), 0, dateBetween(now(), v, "days")),
  if(prop("Estado") == "Pagada" or d <= 0, 0, d)
)
```

`Alerta Deuda`
```notion
lets(
  d, prop("Días de Atraso"),
  if(prop("Estado") == "Pagada", "✅ Liquidada",
  if(d > 30, "🔴 " + format(d) + " días de mora",
  if(d > 0, "🟠 Vencida hace " + format(d) + " días",
  "🟢 Al corriente")))
)
```

> **Dos lecturas de "Deuda mensual vencida":**
> - **Variante A (flujo — recomendada):** el Master suma `Cuota Vencida`. Responde a
>   *"¿cuánto debo pagar ya mismo?"*.
> - **Variante B (stock):** el Master suma `Saldo Pendiente`. Responde a *"¿cuánto debo en total?"*
>   — es la lectura que produce cifras grandes como los 2.201 € del diseño de referencia.
>
> Puedes tener **las dos**: crea dos rollups en el Master (`R. Deuda Vencida` y `R. Deuda Total`).
> El manual las incluye ambas.

---

## BD 5 · Inversiones

### 5.1 · Propiedades

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Activo` | Título | Ej. `MSCI World ETF` |
| `Horizonte` | Selección | `Corto Plazo` · `Largo Plazo` ← **alimenta las pestañas de la gráfica** |
| `Clase` | Selección | `Acciones` · `ETF` · `Fondo indexado` · `Cripto` · `Inmueble` · `Depósito` · `Otro` |
| `Fecha de Entrada` | Fecha | — |
| `Capital Inicial` | Número | Euro (€). Aportación de partida. |
| `Valor Actual` | Número | Euro (€). **Actualización manual periódica.** |
| `Estado` | Selección | `Abierta` · `Cerrada` |
| `Aportes` | Relación | ← creada desde `Transacciones` (`Inversión Vinculada`) |
| `Master` | Relación | → `Master Financiero` (inverso: `Todas las Inversiones`) |
| `Aportes Registrados` | **Rollup** | `Aportes` → `Monto Inversión` → **Suma** |

### 5.2 · Fórmulas

`Capital Total`
```notion
prop("Capital Inicial") + prop("Aportes Registrados")
```

`Rendimiento €`
```notion
prop("Valor Actual") - prop("Capital Total")
```

`Rendimiento %` — formato **Porcentaje**
```notion
if(prop("Capital Total") == 0, 0, (prop("Valor Actual") - prop("Capital Total")) / prop("Capital Total"))
```

`Valor Activo` — pre-filtro para el rollup del Master (solo cuenta lo que sigue invertido)
```notion
if(prop("Estado") == "Abierta", prop("Valor Actual"), 0)
```

`Rendimiento Visual`
```notion
lets(
  r, prop("Rendimiento €"),
  p, prop("Rendimiento %"),
  if(r > 0, "🟢 +€" + format(round(r)) + " (" + format(round(p * 100)) + "%)",
  if(r < 0, "🔴 -€" + format(round(abs(r))) + " (" + format(round(p * 100)) + "%)",
  "⚪ Sin cambio"))
)
```

`Antigüedad (meses)`
```notion
if(empty(prop("Fecha de Entrada")), 0, dateBetween(now(), prop("Fecha de Entrada"), "months"))
```

---

## BD 6 · Suscripciones

### 6.1 · Propiedades

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Servicio` | Título | Ej. `Spotify Familiar` |
| `Costo` | Número | Euro (€). El importe **tal como te lo cobran**. |
| `Ciclo` | Selección | `Mensual` · `Trimestral` · `Semestral` · `Anual` |
| `Próximo Cobro` | Fecha | — |
| `Estado` | Selección | `Activa` · `Pausada` · `Cancelada` |
| `Cuenta de Cargo` | Relación | → `Cuentas` |
| `Categoría` | Selección | Misma lista que `Transacciones` |
| `Cargos` | Relación | ← creada desde `Transacciones` (`Suscripción Vinculada`) |
| `Master` | Relación | → `Master Financiero` (inverso: `Todas las Suscripciones`) |

### 6.2 · Fórmulas

`Costo Mensual` — normaliza cualquier ciclo a base mensual
```notion
lets(
  c, prop("Costo"),
  if(prop("Ciclo") == "Mensual", c,
  if(prop("Ciclo") == "Trimestral", c / 3,
  if(prop("Ciclo") == "Semestral", c / 6,
  if(prop("Ciclo") == "Anual", c / 12, c))))
)
```

`Costo Mensual Activo` — pre-filtro para el rollup del Master
```notion
if(prop("Estado") == "Activa", prop("Costo Mensual"), 0)
```

`Costo Anual`
```notion
prop("Costo Mensual") * 12
```

`Días para el Cobro`
```notion
if(empty(prop("Próximo Cobro")), 0, dateBetween(prop("Próximo Cobro"), now(), "days"))
```

`Aviso de Cobro`
```notion
lets(
  d, prop("Días para el Cobro"),
  if(prop("Estado") != "Activa", "⏸️ " + format(prop("Estado")),
  if(d < 0, "🔴 Vencida",
  if(d <= 3, "🟠 Cobro en " + format(d) + " días",
  if(d <= 7, "🟡 Esta semana",
  "🟢 " + format(d) + " días"))))
)
```

> 💰 **Insight que justifica la BD:** `Costo Anual` sobre el total de suscripciones activas suele
> ser la cifra que más sorprende al usuario. Ponla destacada en la página `Suscripción`.

---

## BD 7 · Historial Mensual

Esta base de datos existe por una razón técnica concreta: **Notion Charts no calcula totales
acumulados (running totals)**. Una gráfica de líneas sobre `Inversiones` mostraría el aporte *de
cada mes*, no la curva creciente del diseño de referencia. La solución estándar es una BD de
instantáneas mensuales.

### 7.1 · Propiedades

| Propiedad | Tipo | Configuración |
|---|---|---|
| `Mes` | Título | Formato `2025-06 · Junio` (ordenable alfabéticamente) |
| `Fecha de Corte` | Fecha | Último día del mes |
| `Valor de Cartera` | Número | Euro (€) — valor total invertido al cierre |
| `Liquidez` | Número | Euro (€) — suma de saldos de cuentas al cierre |
| `Deuda Total` | Número | Euro (€) |
| `Ingresos del Mes` | Número | Euro (€) |
| `Gastos del Mes` | Número | Euro (€) |

`Patrimonio Neto` (fórmula)
```notion
prop("Liquidez") + prop("Valor de Cartera") - prop("Deuda Total")
```

`Tasa de Ahorro` (fórmula, formato **Porcentaje**)
```notion
if(prop("Ingresos del Mes") == 0, 0, (prop("Ingresos del Mes") - prop("Gastos del Mes")) / prop("Ingresos del Mes"))
```

### 7.2 · Cómo se rellena (elige una de las dos vías)

**Vía A — Cierre mensual manual (recomendada, 60 segundos al mes).**
El día 1 de cada mes pulsas el botón **📸 Cerrar mes** del dashboard (ver FASE 2), que crea la fila
con la fecha correcta, y copias 3 números desde el informe del Master. Es la vía que replica
exactamente la gráfica del diseño original.

**Vía B — Acumulado automático con fórmula (avanzada).**
Añade a `Historial Mensual` una relación `Cartera` → `Inversiones` y vincula **todas** las
inversiones a **cada** fila de mes. Después:

```notion
prop("Cartera")
  .filter(current.prop("Fecha de Entrada") <= prop("Fecha de Corte"))
  .map(current.prop("Valor Actual"))
  .sum()
```

Esto produce la curva acumulada de forma totalmente automática. **Coste:** cada inversión nueva hay
que vincularla a las filas de mes (se hace en bloque desde la vista de tabla, seleccionando la
columna de relación). **Limitación honesta:** usa el `Valor Actual` de hoy, no el valor histórico
de cada mes; la forma de la curva es correcta, la altura de los meses pasados es aproximada. Si
necesitas exactitud histórica, usa la Vía A.

**Vía C — Sin BD adicional (fallback de cero configuración).**
Gráfica de líneas directamente sobre `Inversiones`: eje X = `Fecha de Entrada` agrupado por mes,
eje Y = **Suma** de `Capital Total`. Muestra aportes por mes, no acumulado. Sirve si no quieres
mantener el historial.

---

## BD 8 · Master Financiero

**Una sola fila. Nunca más de una.** Es el panel de control que agrega todo el sistema.

### 8.1 · La fila única

Crea una sola página y titúlala **exactamente**:

```
Informe sobre el patrimonio neto
```

Ese texto es el que aparece como encabezado de la tarjeta en el dashboard — en las tarjetas de
galería el título de la página siempre se muestra, así que se aprovecha como cabecera del informe.

### 8.2 · Relaciones globales

Créalas desde las BD hijas (ya las hemos ido creando en cada BD) o desde aquí. Nombres exactos:

| Propiedad | Apunta a | Nombre inverso |
|---|---|---|
| `Todas las Transacciones` | `Transacciones` | `Master` |
| `Todas las Cuentas` | `Cuentas` | `Master` |
| `Todas las Deudas` | `Deudas` | `Master` |
| `Todas las Inversiones` | `Inversiones` | `Master` |
| `Todas las Suscripciones` | `Suscripciones` | `Master` |

> ⚙️ **Esas relaciones se rellenan solas.** No enlaces nada a mano: en FASE 2.1 configuramos una
> automatización por base de datos que vincula cada página nueva a la fila del Master.

### 8.3 · Rollups globales

Prefijo `R.` para distinguir la maquinaria de las fórmulas de presentación:

| Propiedad | Relación | Propiedad | Cálculo |
|---|---|---|---|
| `R. Ingresos` | `Todas las Transacciones` | `Monto Ingreso` | **Suma** |
| `R. Gastos` | `Todas las Transacciones` | `Monto Gasto` | **Suma** |
| `R. Traslados` | `Todas las Transacciones` | `Monto Traslado` | **Suma** |
| `R. Liquidez` | `Todas las Cuentas` | `Saldo Actual` | **Suma** |
| `R. Inversión` | `Todas las Inversiones` | `Valor Activo` | **Suma** |
| `R. Capital Invertido` | `Todas las Inversiones` | `Capital Total` | **Suma** |
| `R. Deuda Vencida` | `Todas las Deudas` | `Cuota Vencida` | **Suma** |
| `R. Deuda Total` | `Todas las Deudas` | `Saldo Pendiente` | **Suma** |
| `R. Suscripciones` | `Todas las Suscripciones` | `Costo Mensual Activo` | **Suma** |
| `R. Nº Cuentas` | `Todas las Cuentas` | `Cuenta` | **Contar todos** |

> ✅ Fíjate en que `R. Liquidez` hace un rollup de `Saldo Actual`, que es una **fórmula** que a su
> vez contiene rollups. Notion lo permite. Si `Saldo Actual` fuese un rollup, esta propiedad sería
> imposible: ese es el motivo exacto del diseño del punto 1.4.

### 8.4 · Las 5 fórmulas de presentación del informe

Estas son las que se ven en la tarjeta del dashboard. Cada línea del informe es **una propiedad de
fórmula independiente** que devuelve texto con la etiqueta en negrita incorporada, porque las
tarjetas de galería muestran los valores **sin el nombre de la propiedad**.

`Sus ingresos totales`
```notion
style("Sus ingresos totales:", "b") + " €" + format(round(prop("R. Ingresos")))
```

`Su gasto total`
```notion
style("Su gasto total:", "b") + " €" + format(round(prop("R. Gastos")))
```

`Inversión actual`
```notion
style("Inversión actual:", "b") + " €" + format(round(prop("R. Inversión")))
```

`Deuda mensual vencida`
```notion
style("Deuda mensual vencida:", "b") + " €" + format(round(prop("R. Deuda Vencida")))
```

`Costos de suscripción`
```notion
style("Costos de suscripción:", "b") + " €" + format(round(prop("R. Suscripciones")))
```

> Para la **Variante B** de deuda (stock en lugar de flujo), cambia `R. Deuda Vencida` por
> `R. Deuda Total` en la cuarta fórmula.

### 8.5 · Métricas derivadas (el valor añadido sobre el diseño original)

`Patrimonio Neto` — número, formato Euro
```notion
prop("R. Liquidez") + prop("R. Inversión") - prop("R. Deuda Total")
```

`Patrimonio Neto (tarjeta)` — texto con color condicional
```notion
lets(
  pn, prop("Patrimonio Neto"),
  etiqueta, style("Patrimonio neto:", "b"),
  valor, "€" + format(round(pn)),
  etiqueta + " " + if(pn >= 0, style(valor, "green"), style(valor, "red"))
)
```

`Tasa de Ahorro` — número, formato Porcentaje
```notion
if(prop("R. Ingresos") == 0, 0, (prop("R. Ingresos") - prop("R. Gastos")) / prop("R. Ingresos"))
```

`Flujo Libre Mensual` — lo que realmente te queda cada mes
```notion
prop("R. Ingresos") - prop("R. Gastos") - prop("R. Deuda Vencida") - prop("R. Suscripciones")
```

`Meses de Colchón` — cuántos meses sobrevives con la liquidez actual
```notion
lets(
  quema, prop("R. Gastos") + prop("R. Suscripciones") + prop("R. Deuda Vencida"),
  if(quema <= 0, 0, round(prop("R. Liquidez") / quema * 10) / 10)
)
```

`Diagnóstico` — el resumen que ninguna plantilla comercial incluye
```notion
lets(
  ahorro, prop("Tasa de Ahorro"),
  colchon, prop("Meses de Colchón"),
  if(prop("Patrimonio Neto") < 0, "🔴 Patrimonio neto negativo: prioriza amortizar deuda.",
  if(colchon < 3, "🟠 Colchón por debajo de 3 meses: refuerza el fondo de emergencia.",
  if(ahorro < 0.1, "🟡 Tasa de ahorro por debajo del 10 %: revisa gastos y suscripciones.",
  "🟢 Finanzas equilibradas: considera aumentar la aportación a inversión.")))
)
```

---

# FASE 2 · Automatizaciones y botones rápidos

## 2.1 · Automatización de auto-vinculación al Master (hazla primero)

Sin esto, el Master Financiero estaría vacío salvo que enlazaras a mano cada fila. Repite este
proceso en **5 bases de datos**: `Transacciones`, `Cuentas`, `Deudas`, `Inversiones`, `Suscripciones`.

1. Abre la base de datos a página completa.
2. Arriba a la derecha pulsa el icono **⚡ (Automatizaciones)** → **Nueva automatización**.
3. **Nombre:** `Vincular al Master`.
4. **Cuando…** → `Se añade una página`.
5. **Entonces…** → `Editar propiedad` → propiedad **`Master`** → valor: selecciona la página
   **`Informe sobre el patrimonio neto`**.
6. **Crear**.

> 💳 **Las automatizaciones de base de datos requieren plan Plus o superior.**
> **Alternativa gratuita:** cada botón de la FASE 2.2 rellena también la relación `Master`
> (paso incluido en la configuración de abajo). Cubre el 100 % de las filas creadas desde el
> dashboard; solo las creadas manualmente dentro de la tabla habría que vincularlas a mano.

### Automatizaciones adicionales recomendadas

| BD | Cuando… | Entonces… | Para qué |
|---|---|---|---|
| `Transacciones` | Se añade una página | Editar `Fecha` = `Hoy` | Red de seguridad si alguien crea la fila sin botón |
| `Deudas` | `Estado` pasa a `Pagada` | Editar `Próximo Vencimiento` = vacío | Deja de contar como vencida |
| `Suscripciones` | Se edita `Estado` a `Cancelada` | Editar `Próximo Cobro` = vacío | Limpia las alertas |
| `Transacciones` | Cada día a las 09:00 | Enviar notificación si `Validación` contiene `⚠️` | Control de calidad diario |

---

## 2.2 · Los 7 botones rápidos

### Cómo se crea un botón en Notion

1. En la página del dashboard escribe `/botón` → **Botón**.
2. Pon el **nombre** y el **icono** (pulsa el emoji a la izquierda del nombre).
3. **Añadir paso** → **Añadir página a** → elige la base de datos.
4. Pulsa **+ Añadir propiedad** dentro del paso y rellena cada campo de la tabla de abajo.
5. Abajo del paso, despliega **Abrir página nueva en** → elige **`Vista lateral`**
   (es lo que produce el efecto modal del diseño; `Ventana emergente central` también vale).

> Para el campo de fecha, al pulsar en el valor aparece un selector con la opción **`Hoy`**
> (relativa, se recalcula en cada pulsación). **No** elijas una fecha fija del calendario.

---

### 🔺 Botón 1 · `Nuevo gasto`

| Campo | Valor |
|---|---|
| **Icono** | ⬆️ (flecha arriba en círculo) |
| **Acción** | Añadir página a → **`Transacciones`** |
| `Tipo` | `Gasto` |
| `Fecha` | **Hoy** |
| `Master` | `Informe sobre el patrimonio neto` |
| `Cantidad` | *(vacío — lo escribe el usuario)* |
| **Abrir en** | Vista lateral |

### 🔻 Botón 2 · `Nuevos ingresos`

| Campo | Valor |
|---|---|
| **Icono** | ⬇️ |
| **Acción** | Añadir página a → **`Transacciones`** |
| `Tipo` | `Ingreso` |
| `Categoría` | `Salario` |
| `Fecha` | **Hoy** |
| `Master` | `Informe sobre el patrimonio neto` |
| **Abrir en** | Vista lateral |

### 🔁 Botón 3 · `Nueva transferencia`

| Campo | Valor |
|---|---|
| **Icono** | ⇄ |
| **Acción** | Añadir página a → **`Transacciones`** |
| `Descripción` | `Traslado entre cuentas` |
| `Tipo` | `Traslado` |
| `Fecha` | **Hoy** |
| `Master` | `Informe sobre el patrimonio neto` |
| **Abrir en** | Vista lateral |

> El usuario debe rellenar `Cuenta de Origen` **y** `Cuenta de Destino`. La fórmula `Validación`
> marcará ⚠️ si olvida el destino, así que ningún traslado a medias corromperá los saldos.

### 💰 Botón 4 · `Nuevo presupuesto`

| Campo | Valor |
|---|---|
| **Icono** | ℹ️ |
| **Acción** | Añadir página a → **`Presupuestos`** |
| `Mes` | **Hoy** |
| `Límite` | `0` |
| **Abrir en** | Vista lateral |

### 📈 Botón 5 · `Nueva inversión`

| Campo | Valor |
|---|---|
| **Icono** | 🔼 |
| **Acción** | Añadir página a → **`Inversiones`** |
| `Horizonte` | `Largo Plazo` |
| `Estado` | `Abierta` |
| `Fecha de Entrada` | **Hoy** |
| `Master` | `Informe sobre el patrimonio neto` |
| **Abrir en** | Vista lateral |

### ➖ Botón 6 · `Nueva deuda`

| Campo | Valor |
|---|---|
| **Icono** | ⛔ |
| **Acción** | Añadir página a → **`Deudas`** |
| `Estado` | `Activa` |
| `Próximo Vencimiento` | **Hoy + 30 días** *(usa el desplazamiento relativo del selector)* |
| `Master` | `Informe sobre el patrimonio neto` |
| **Abrir en** | Vista lateral |

### ✅ Botón 7 · `Nueva suscripción`

| Campo | Valor |
|---|---|
| **Icono** | ☑️ |
| **Acción** | Añadir página a → **`Suscripciones`** |
| `Ciclo` | `Mensual` |
| `Estado` | `Activa` |
| `Próximo Cobro` | **Hoy** |
| `Master` | `Informe sobre el patrimonio neto` |
| **Abrir en** | Vista lateral |

---

## 2.3 · Botones avanzados (opcionales pero muy rentables)

### 📸 `Cerrar mes`
Alimenta la gráfica de líneas del dashboard.

| Paso | Configuración |
|---|---|
| 1 | Añadir página a → `Historial Mensual` |
| | `Fecha de Corte` = **Hoy** |
| | Abrir en: **Vista lateral** |

Copia las tres cifras del informe del Master (`R. Liquidez`, `R. Inversión`, `R. Deuda Total`) en
`Liquidez`, `Valor de Cartera` y `Deuda Total`. **60 segundos, una vez al mes.**

> 🔔 Complementa con una automatización de fecha en `Historial Mensual`: recordatorio el día 1 de
> cada mes.

### 💸 `Pagar cuota` (botón dentro de la plantilla de página de `Deudas`)

| Paso | Configuración |
|---|---|
| 1 | Añadir página a → `Transacciones` con `Tipo` = `Pago de Deuda`, `Fecha` = **Hoy**, `Deuda Vinculada` = **esta página** |
| 2 | Editar propiedad de **esta página** → `Próximo Vencimiento` = **Hoy + 1 mes** |

Un solo clic registra el pago, actualiza `Total Pagado`, recalcula `Saldo Pendiente` y desplaza el
vencimiento. Colócalo en la **plantilla de página** de la BD `Deudas` para que aparezca en cada deuda.

### 🗄️ `Archivar seleccionados`

| Paso | Configuración |
|---|---|
| 1 | Editar páginas en → `Transacciones` → filtro `Fecha` *es anterior a* `hace 1 año` → marcar `Archivado` |

---

# FASE 3 · Diseño del dashboard (UI/UX)

## 3.1 · Estructura de columnas

Notion crea columnas **arrastrando** un bloque hacia el lateral de otro hasta que aparece la guía
azul vertical. Para el layout del diseño de referencia:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [icono]  Gerente de Finanzas                              (Título H1)  │
├──────────────┬──────────────────────────────────┬───────────────────────┤
│ COLUMNA 1    │ COLUMNA 2                        │ COLUMNA 3             │
│ ~22 %        │ ~48 %                            │ ~30 %                 │
│              │                                  │                       │
│ Botones      │ Informe financiero y             │ Patrimonio actual     │
│ rápidos      │ visión general                   │ (galería Master)      │
│              │ (gráfica de líneas)              │                       │
│ Navegación   │                                  │ Cuentas               │
│              │ ┌──────────┬──────────┐          │ (galería Cuentas)     │
│ Rastreador   │ │ Gastos   │ Ingresos │          │                       │
│              │ │ Corrient.│ corrient.│          │                       │
│              │ │ (anillo) │ (anillo) │          │                       │
│              │ └──────────┴──────────┘          │                       │
└──────────────┴──────────────────────────────────┴───────────────────────┘
```

**Procedimiento exacto:**
1. Escribe `/3 columnas` para generar la rejilla base.
2. Ajusta los anchos arrastrando los separadores grises entre columnas.
3. Dentro de la columna 2, en la zona inferior, crea **2 subcolumnas** arrastrando la segunda
   gráfica de anillo junto a la primera.
4. Ancla la anchura de la página: **⋯ (arriba a la derecha) → activar `Ancho completo`**.

> 📱 En móvil Notion apila las columnas verticalmente en orden 1 → 2 → 3. Por eso los botones y la
> navegación van en la columna 1: son lo primero que quieres tener a mano en el teléfono.

## 3.2 · Bloque superior

1. `/título` → **Encabezado 1** → escribe `Gerente de Finanzas`.
2. Encima, inserta el icono como bloque de imagen de ~64 px (`/imagen`), o simplemente usa el icono
   de la página (aparece sobre el título automáticamente).
3. Deja una línea en blanco antes de la rejilla de columnas para que respire.

## 3.3 · Columna 1 — Botones rápidos, Navegación y Rastreador

### Tarjeta «Botones rápidos»

El recuadro redondeado del diseño es un **bloque de llamada (callout)** sin icono:

1. `/llamada` → **Llamada**.
2. Pulsa el emoji de la llamada → **Quitar** (para dejarla sin icono).
3. Color de fondo: **⋮⋮ → Color → Fondo predeterminado** (en modo oscuro produce el gris carbón
   ligeramente más claro del diseño).
4. **Dentro** de la llamada (pulsa al final del texto y `Enter`), añade:
   - `Encabezado 3` → `Botones rápidos`
   - `/divisor` → línea separadora
   - Los 7 botones de la FASE 2.2, uno debajo de otro.

> Los bloques hijos de una llamada se crean escribiendo dentro y pulsando `Enter`; si el bloque
> se sale del recuadro, arrástralo de vuelta dentro con el manejador **⣿**.

### Menú «Navegación»

1. `Encabezado 3` → `Navegación`
2. `/divisor`
3. Una línea por destino, usando **menciones de página** (escribe `@` + nombre de la página).
   Las menciones muestran el icono de la página y el texto subrayado — es exactamente el aspecto
   del diseño de referencia.

| Entrada | Icono | Apunta a |
|---|---|---|
| `Cuentas` | 👤 | Página `Cuentas` (vista enlazada de la BD Cuentas) |
| `Presupuesto` | ℹ️ | Página `Presupuesto` |
| `Traslados` | ⇄ | Página `Traslados` |
| `Informes` | ❗ | Página `Informes` |
| `Archivo` | 🗑️ | Página `Archivo` |

### Menú «Rastreador»

Misma técnica:

| Entrada | Icono | Apunta a |
|---|---|---|
| `Gastos` | ⬆️ | Página `Gastos` |
| `Ingresos` | ⬇️ | Página `Ingresos` |
| `Deudas` | ➖ | Página `Deudas` |
| `Inversiones` | 🔼 | Página `Inversiones` |
| `Suscripción` | ✅ | Página `Suscripción` |

> 🎨 Para que los iconos se vean como en el diseño (grises, planos, circulares), en el selector de
> iconos de cada página usa la pestaña **Iconos** → busca el símbolo → elige el color **Gris claro**.

## 3.4 · Columna 2 — Gráficas nativas de Notion

### Gráfica de líneas · «Informe financiero y visión general»

1. `Encabezado 2` → `Informe financiero y visión general`.
2. `/vista enlazada de base de datos` → fuente: **`Historial Mensual`**.
3. En el selector de vistas, **+ → Gráfico**. Nombra la vista **`Inversión actual`**.
4. Configura el gráfico (⋯ → **Configuración del gráfico**):

| Ajuste | Valor |
|---|---|
| **Tipo de gráfico** | `Línea` |
| **Eje X** | `Fecha de Corte` → agrupar por **Mes** |
| **Eje Y** | **Suma** de `Valor de Cartera` |
| **Mostrar valores de datos** | Activado *(produce las etiquetas 230 €, 534 €, 954 €… del diseño)* |
| **Mostrar líneas de cuadrícula** | Activado |
| **Leyenda** | Desactivada |
| **Color** | Gris / Blanco (en modo oscuro) |
| **Área bajo la línea** | Activada, si tu versión lo ofrece |

5. **Las pestañas del diseño** (`Inversión actual` · `Corto Plazo` · `Largo Plazo`) son
   simplemente **tres vistas** del mismo bloque. Duplica la vista de gráfico dos veces:

| Vista | Fuente | Filtro |
|---|---|---|
| `Inversión actual` | `Historial Mensual` | — |
| `Corto Plazo` | `Inversiones` | `Horizonte` = `Corto Plazo` · eje X = `Fecha de Entrada` (mes) · eje Y = Suma de `Valor Actual` |
| `Largo Plazo` | `Inversiones` | `Horizonte` = `Largo Plazo` · ídem |

> ⚠️ **Limitación real de Notion Charts:** no existe la opción "total acumulado". Una gráfica sobre
> `Inversiones` muestra el aporte *de cada mes*, no la curva creciente. Por eso la vista principal
> lee de `Historial Mensual`, donde el acumulado ya está guardado como dato. Ver BD 7 para las
> tres vías posibles.

### Gráficas de anillo · «Gastos Corrientes» e «Ingresos corrientes»

Dos vistas enlazadas de **`Transacciones`**, colocadas en dos subcolumnas.

**Anillo izquierdo — `Gastos Corrientes`:**

| Ajuste | Valor |
|---|---|
| **Fuente** | `Transacciones` |
| **Tipo de vista** | Gráfico → **Rosquilla (Donut)** |
| **Filtros** | `Tipo` **es** `Gasto` **Y** `Periodo` **es** `Mes actual` |
| **Segmentar por (Eje X / Grupos)** | `Medio` |
| **Valor (Eje Y)** | **Suma** de `Cantidad` |
| **Mostrar total en el centro** | Activado → produce el `1.6K` central |
| **Leyenda** | Activada, posición exterior |
| **Colores** | Paleta roja / naranja |

**Anillo derecho — `Ingresos corrientes`:** idéntico, cambiando:

| Ajuste | Valor |
|---|---|
| **Filtros** | `Tipo` **es** `Ingreso` **Y** `Periodo` **es** `Mes actual` |
| **Colores** | Paleta verde |

> Los segmentos que verás son `Efectivo`, `Tarjeta`, `Banco`, `Otros`: eso lo produce la fórmula
> `Medio` de la BD Transacciones (punto 2.4), que lee `Tipo de cuenta` a través de la relación.
> Si prefieres segmentar por categoría de gasto, cambia el agrupador a `Categoría`.
>
> Si el anillo aparece con el texto **«No hay información»**, no es un error de configuración:
> significa que ninguna fila pasa los filtros. Con `Periodo` = `Mes actual` es lo normal el día 1.

## 3.5 · Columna 3 — Patrimonio actual y Cuentas

### Sección «Patrimonio actual»

1. `Encabezado 2` → `Patrimonio actual`.
2. `/vista enlazada de base de datos` → fuente: **`Master Financiero`**.
3. Tipo de vista: **Galería**. Nombre de la vista: `Visión general`.
4. **⋯ → Diseño:**

| Ajuste | Valor |
|---|---|
| **Vista previa de la tarjeta** | **Ninguna** ← imprescindible, si no aparece un hueco de imagen |
| **Tamaño de la tarjeta** | Pequeño |
| **Ajustar imagen** | (irrelevante sin vista previa) |
| **Abrir páginas en** | Vista lateral |
| **Mostrar en columna** | 1 |

5. **⋯ → Propiedades:** deja visibles **solo** estas 5, en este orden:
   `Sus ingresos totales` · `Su gasto total` · `Inversión actual` · `Deuda mensual vencida` ·
   `Costos de suscripción`. **Oculta todo lo demás**, incluidos los rollups `R.` y las relaciones.
6. **⋯ → Ajustes de vista:** desactiva `Mostrar la barra de vistas`, `Buscar`, `Filtro` y
   `Ordenar` si quieres el aspecto más limpio (el diseño original los deja visibles).

> El texto `Informe sobre el patrimonio neto` que encabeza la tarjeta **es el título de la página**,
> no una propiedad. Por eso se llama así la fila única del Master. Las etiquetas en negrita
> (`Sus ingresos totales:`) están dentro de cada fórmula, porque las tarjetas de galería muestran
> los valores sin el nombre de la propiedad.

### Sección «Cuentas»

1. `Encabezado 2` → `Cuentas`.
2. `/vista enlazada de base de datos` → fuente: **`Cuentas`**.
3. Tipo de vista: **Galería**, nombre `Visión general`.
4. **⋯ → Diseño:** Vista previa de tarjeta = **Ninguna** · Tamaño = **Pequeño** ·
   Abrir en **Vista lateral** · **Mostrar en columna: 1**.
5. **⋯ → Propiedades:** visible **solo** `Current Balance` (la fórmula de texto del punto 1.5).
6. **⋯ → Filtro:** `Activa` está marcada.
7. **⋯ → Ordenar:** `Tipo de cuenta` ascendente, o manual arrastrando para respetar el orden
   `Efectivo → Tarjeta electrónica → Otros → Banco`.

Resultado: una tarjeta por cuenta con su icono, su nombre y `Current Balance: €1449`.

## 3.6 · Ajustes finales de estética

| Elemento | Ajuste |
|---|---|
| Anchura | **⋯ → Ancho completo** activado |
| Fuente | **⋯ → Predeterminada** (la que usa el diseño de referencia) |
| Texto pequeño | Desactivado en escritorio |
| Divisores | Un `/divisor` bajo cada Encabezado 3 de la columna 1 |
| Espaciado | Una línea vacía entre secciones; no uses varias seguidas, Notion las colapsa visualmente |
| Barras de vista | Ocultas en las galerías de la columna 3 para un aspecto de widget |
| Contraste | En modo oscuro evita los colores de fondo saturados: usa solo **Fondo predeterminado** y **Fondo gris** |

---

# FASE 4 · Páginas de navegación y vistas

Cada entrada de los menús **Navegación** y **Rastreador** es una subpágina de
`Gerente de Finanzas` que contiene **vistas enlazadas** (nunca la base de datos original).

## 4.1 · Navegación

### 📄 `Cuentas`
| Bloque | Configuración |
|---|---|
| Vista enlazada de `Cuentas` | Tabla · propiedades visibles: `Cuenta`, `Tipo de cuenta`, `Saldo Inicial`, `Σ Ingresos`, `Σ Salidas`, `Saldo Actual`, `Salud` |
| Pie de tabla | Bajo `Saldo Actual` activa **Suma** → liquidez total del sistema |
| Segunda vista | `Tarjetas` (galería) idéntica a la del dashboard |

### 📄 `Presupuesto`
| Bloque | Configuración |
|---|---|
| Vista enlazada de `Presupuestos` | Tabla · filtro `Mes` **este mes** · propiedades: `Presupuesto`, `Categoría`, `Límite`, `Gastado`, `Progreso`, `Restante`, `Estado Presupuesto` |
| Vista `Por categoría` | Tablero agrupado por `Categoría` |
| Gráfica | Barras: eje X = `Categoría`, eje Y = Suma de `Gastado`, con línea de `Límite` si tu versión lo permite |

### 📄 `Traslados`
| Bloque | Configuración |
|---|---|
| Vista enlazada de `Transacciones` | Filtro `Tipo` = `Traslado` · propiedades: `Descripción`, `Cantidad`, `Cuenta de Origen`, `Cuenta de Destino`, `Fecha`, `Validación` |
| Botón | `Nueva transferencia` (duplicado del dashboard) |

> ✅ **Comprobación de integridad de traslados:** en el pie de la tabla, la suma de `Monto Traslado`
> debe coincidir con la suma de `Σ Traslados Recibidos` de todas las cuentas. Si no cuadra, hay
> traslados sin cuenta de destino — la fórmula `Validación` te dirá cuáles.

### 📄 `Informes`
La página analítica. Móntala con estas vistas enlazadas de `Transacciones`:

| Vista | Tipo | Configuración |
|---|---|---|
| `Ingresos vs Gastos` | Gráfico de barras | Eje X = `Mes` · Eje Y = Suma de `Monto Ingreso` y Suma de `Monto Gasto` |
| `Gasto por categoría` | Gráfico de rosquilla | Agrupar por `Categoría` · Suma de `Monto Gasto` · filtro `Periodo` = `Mes actual` |
| `Evolución del gasto` | Gráfico de líneas | Eje X = `Fecha` (por mes) · Eje Y = Suma de `Monto Gasto` |
| `Top 10 gastos` | Tabla | Filtro `Tipo` = `Gasto` · Orden `Cantidad` ↓ · Límite visual: 10 filas |
| `Patrimonio neto` | Gráfico de líneas | Fuente `Historial Mensual` · Eje Y = Suma de `Patrimonio Neto` |
| Tarjeta de diagnóstico | Galería de `Master Financiero` | Propiedades: `Patrimonio Neto (tarjeta)`, `Tasa de Ahorro`, `Meses de Colchón`, `Flujo Libre Mensual`, `Diagnóstico` |

### 📄 `Archivo`
| Bloque | Configuración |
|---|---|
| Vista enlazada de `Transacciones` | Filtro `Archivado` **marcado** · agrupada por `Mes (etiqueta)` |
| Nota | El archivado **no** excluye las filas de los cálculos: siguen sumando en el histórico. Si quieres que dejen de contar, añade `and prop("Archivado") == false` a las fórmulas `Monto …`. |

## 4.2 · Rastreador

| Página | Fuente | Filtro | Vistas extra |
|---|---|---|---|
| `Gastos` | `Transacciones` | `Tipo` = `Gasto` | Tablero por `Categoría`; calendario por `Fecha` |
| `Ingresos` | `Transacciones` | `Tipo` = `Ingreso` | Tablero por `Categoría` |
| `Deudas` | `Deudas` | — | Tablero por `Estado`; ordenar por `Días de Atraso` ↓ |
| `Inversiones` | `Inversiones` | — | Tablero por `Horizonte`; gráfica de rosquilla por `Clase` |
| `Suscripción` | `Suscripciones` | `Estado` = `Activa` | Calendario por `Próximo Cobro`; pie de tabla con **Suma** de `Costo Anual` |

## 4.3 · Plantillas de página dentro de las bases de datos

En cada BD, pulsa la flecha junto a **Nuevo** → **+ Nueva plantilla**. Merecen la pena estas tres:

| BD | Plantilla | Contenido |
|---|---|---|
| `Transacciones` | `Gasto con recibo` | `Tipo` = `Gasto` prefijado + bloque de imagen para el ticket + casilla `Revisado` |
| `Deudas` | `Deuda estándar` | Botón **💸 Pagar cuota** + tabla de amortización + vista enlazada de `Pagos` filtrada a esta deuda |
| `Inversiones` | `Posición` | Campos de tesis de inversión, objetivo de precio, y vista de `Aportes` |

---

# FASE 5 · Verificación y solución de problemas

## 5.1 · Checklist de puesta en marcha

Marca cada punto **en orden**. Si uno falla, no sigas: los siguientes dependerán de él.

- [ ] Las 8 bases de datos existen dentro de `⚙️ Motor de datos (no tocar)`.
- [ ] `Master Financiero` tiene **exactamente una fila**, titulada `Informe sobre el patrimonio neto`.
- [ ] Las 7 relaciones de `Transacciones` son **bilaterales** (aparecen en ambas BD).
- [ ] Las 8 fórmulas de pre-filtro de `Transacciones` devuelven `0` o la cantidad, nunca un error.
- [ ] Los 4 rollups de `Cuentas` apuntan a la relación correcta (**ojo:** `Σ Traslados Recibidos`
      usa `Movimientos (Destino)`, no `(Origen)`).
- [ ] `Saldo Actual` es una **fórmula**, no un rollup.
- [ ] Los 10 rollups del Master devuelven números, no listas vacías.
- [ ] La automatización `Vincular al Master` está activa en las 5 BD (o los botones rellenan `Master`).
- [ ] Los 7 botones abren en **Vista lateral** y prerrellenan `Tipo` y `Fecha`.
- [ ] Las galerías tienen **Vista previa de tarjeta = Ninguna**.

## 5.2 · Prueba de fuego en 6 movimientos

Ejecuta esta secuencia y comprueba los resultados. Si los 6 cuadran, el motor es correcto.

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | `Saldo Inicial` de `Banco` = 1.000 € | `Saldo Actual` de Banco = **1.000 €** · Master `R. Liquidez` = **1.000 €** |
| 2 | Ingreso de 2.000 € en `Banco` | Banco = **3.000 €** · `Sus ingresos totales` = **€2000** |
| 3 | Gasto de 300 € en `Banco` | Banco = **2.700 €** · `Su gasto total` = **€300** |
| 4 | Traslado de 500 € de `Banco` a `Efectivo` | Banco = **2.200 €** · Efectivo = **500 €** · **`Su gasto total` sigue en €300** ✅ |
| 5 | Inversión de 400 € desde `Banco` | Banco = **1.800 €** · **`Su gasto total` sigue en €300** ✅ · `R. Liquidez` = 2.300 € |
| 6 | Suscripción de 10 € (`Ciclo` = `Anual`, `Costo` = 120 €) | `Costos de suscripción` = **€10** (120 ÷ 12) ✅ |

**Los pasos 4 y 5 son la prueba crítica.** Si `Su gasto total` sube con un traslado o con una
inversión, has usado `Salida de Caja` donde debía ir `Monto Gasto` en el rollup del Master.

## 5.3 · Errores frecuentes y su causa exacta

| Síntoma | Causa | Solución |
|---|---|---|
| Un rollup muestra vacío o `0` con datos cargados | La relación no es bilateral, o el rollup apunta a la relación equivocada | Recrea la relación desde la BD hija activando *"Mostrar en …"* |
| `Saldo Actual` da error de tipo | Un rollup devuelve lista en vez de número | En el rollup, el **Cálculo** debe ser `Suma`, no `Mostrar original` |
| No puedes crear un rollup sobre `Σ Ingresos` | Notion no permite rollup de rollup | Envuélvelo primero en una fórmula (ese es el papel de `Saldo Actual`) |
| `Referencia circular` al guardar una fórmula | Dos fórmulas se referencian mutuamente, directa o indirectamente | Rompe el ciclo con un valor numérico intermedio |
| El Master está a cero | La fila única no está vinculada a las páginas hijas | Revisa la automatización `Vincular al Master`, o vincula en bloque desde la vista de tabla arrastrando la celda de relación |
| La gráfica de líneas es plana o dentada | Estás graficando aportes mensuales, no acumulado | Usa `Historial Mensual` como fuente (BD 7) |
| El anillo dice **«No hay información»** | Ninguna fila pasa el filtro (típico con `Periodo` = `Mes actual`) | Es correcto; añade una transacción de este mes |
| Las tarjetas de galería muestran un hueco gris | Vista previa de tarjeta activada | ⋯ → Diseño → **Vista previa de la tarjeta: Ninguna** |
| Las etiquetas del informe no se ven en negrita | Usaste concatenación simple | Envuelve la etiqueta en `style("…", "b")` |
| El saldo de una cuenta está desviado exactamente en el importe de un traslado | Falta la `Cuenta de Destino` | Filtra por `Validación` contiene `⚠️` |
| El importe sale negativo dos veces | Metiste la `Cantidad` en negativo | **Regla:** las cantidades siempre en positivo; el signo lo pone el `Tipo` |
| Al duplicar la plantilla los rollups se rompen | Duplicaste páginas sueltas en vez del contenedor | Duplica siempre la página raíz completa: Notion remapea las relaciones internas |

## 5.4 · Rendimiento a largo plazo

Con más de ~3.000 transacciones, Notion empieza a recalcular con retardo perceptible. Mitigaciones,
por orden de eficacia:

1. **Cierra el ejercicio cada año.** Marca `Archivado` en todo lo anterior a 12 meses y añade
   `and prop("Archivado") == false` a las fórmulas `Monto …`. El histórico permanece en
   `Historial Mensual`.
2. **Oculta las propiedades de maquinaria** en todas las vistas de usuario: Notion no renderiza lo
   que no muestra.
3. **Limita las vistas del dashboard** con filtro de fecha (`Periodo` = `Mes actual`) en lugar de
   cargar la tabla completa.
4. **Evita rollups anidados innecesarios.** Cada nivel multiplica el coste de recálculo.

## 5.5 · Ampliaciones naturales del sistema

| Ampliación | Cómo |
|---|---|
| **Multidivisa** | Añade `Tasa de Cambio` (Número) a `Cuentas` y multiplica en `Saldo Actual`; el Master suma ya en divisa base |
| **Objetivos de ahorro** | Nueva BD `Metas` con `Objetivo`, `Fecha Límite`, relación a `Transacciones`, rollup `Acumulado` y barra de progreso (reutiliza la fórmula `Progreso`) |
| **Reparto entre personas** | `Titular` (Persona) en `Transacciones` + rollups por persona en el Master |
| **Previsión de tesorería** | En `Historial Mensual`, `Proyección` = `Patrimonio Neto` + `Flujo Libre Mensual` × meses |
| **Importación bancaria** | Exporta CSV del banco → mapea columnas a `Descripción`, `Cantidad`, `Fecha` → importa en `Transacciones` → asigna `Tipo` y `Cuenta de Origen` en bloque desde la vista de tabla |
| **Widget de notificación** | Automatización diaria en `Deudas`: si `Días de Atraso` > 0, enviar notificación a Slack |

---

## Apéndice · Referencia rápida de sintaxis de Notion Fórmulas 2.0

| Necesitas | Sintaxis | Nota |
|---|---|---|
| Leer una propiedad | `prop("Nombre")` | Distingue mayúsculas y acentos |
| Variables locales | `lets(a, 1, b, 2, a + b)` | Evita repetir cálculos; mejora el rendimiento |
| Condicional | `if(cond, entonces, si_no)` | Anidable |
| Lógica | `and` · `or` · `not` | También `&&`, `\|\|`, `!` |
| Número → texto | `format(x)` | Obligatorio antes de concatenar |
| Redondear | `round(x)` · `floor(x)` · `ceil(x)` | |
| Absoluto / extremos | `abs(x)` · `min(a,b)` · `max(a,b)` | |
| Formato de texto | `style(t, "b")` · `"i"` · `"u"` · `"c"` · `"s"` | También colores: `"red"`, `"green"`, `"blue_background"` |
| Repetir texto | `repeat("█", 5)` | Base de las barras de progreso |
| Rellenar texto | `padStart(t, 3, "0")` | Para separadores de miles |
| Fecha actual | `now()` · `today()` | |
| Diferencia de fechas | `dateBetween(a, b, "days")` | `a − b`. Unidades: `days`, `months`, `years` |
| Formatear fecha | `formatDate(f, "YYYY-MM")` | Tokens tipo Moment.js |
| Vacío | `empty(x)` | Funciona en texto, número, fecha y relación |
| Recorrer una relación | `prop("Rel").map(current.prop("X"))` | `current` = la página relacionada |
| Filtrar una lista | `.filter(current > 0)` | |
| Agregar | `.sum()` · `.mean()` · `.max()` · `.length()` | |
| Primer elemento | `.first()` · `.at(0)` | |
| Unir textos | `.join(" · ")` | |
| Salto de línea | `"\n"` | Se renderiza dentro de una fórmula de texto |

---

*Manual creado para la plantilla «Gerente de Finanzas». Todas las fórmulas usan la sintaxis de
Notion Fórmulas 2.0.*
