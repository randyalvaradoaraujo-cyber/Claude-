# 🧮 Anexo de fórmulas · Notion Fórmulas 2.0

Las **41 fórmulas** del sistema, listas para copiar y pegar. Están agrupadas por base de datos y en
el orden en que deben crearse.

> ⚠️ Los nombres dentro de `prop("…")` deben coincidir **carácter por carácter** con los de tus
> propiedades, incluidos acentos, mayúsculas y el símbolo `Σ`. Si renombras una propiedad desde
> la interfaz de Notion, las fórmulas se actualizan solas; si la renombras editando el texto de la
> fórmula, se rompen.

---

## BD 2 · `Transacciones`  *(créalas primero: todo lo demás depende de ellas)*

### F01 · `Monto Ingreso`
```notion
if(prop("Tipo") == "Ingreso", prop("Cantidad"), 0)
```

### F02 · `Monto Gasto`
```notion
if(prop("Tipo") == "Gasto", prop("Cantidad"), 0)
```

### F03 · `Monto Traslado`
```notion
if(prop("Tipo") == "Traslado", prop("Cantidad"), 0)
```

### F04 · `Monto Inversión`
```notion
if(prop("Tipo") == "Inversión", prop("Cantidad"), 0)
```

### F05 · `Monto Deuda`
```notion
if(prop("Tipo") == "Pago de Deuda", prop("Cantidad"), 0)
```

### F06 · `Monto Suscripción`
```notion
if(prop("Tipo") == "Suscripción", prop("Cantidad"), 0)
```

### F07 · `Salida de Caja`
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

### F08 · `Flujo Neto`
```notion
prop("Monto Ingreso") - prop("Salida de Caja")
```

### F09 · `Medio`
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

### F10 · `Mes`
```notion
formatDate(prop("Fecha"), "YYYY-MM")
```

### F11 · `Mes (etiqueta)`
```notion
formatDate(prop("Fecha"), "MMMM YYYY")
```

### F12 · `Periodo`
```notion
lets(
  f, prop("Fecha"),
  if(empty(f), "Sin fecha",
  if(formatDate(f, "YYYY-MM") == formatDate(now(), "YYYY-MM"), "Mes actual",
  if(f > now(), "Futuro", "Meses anteriores")))
)
```

### F13 · `Validación`
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

---

## BD 1 · `Cuentas`  *(después de crear los 4 rollups Σ)*

### F14 · `Saldo Actual`  → formato **Euro (€)**
```notion
prop("Saldo Inicial")
+ prop("Σ Ingresos")
- prop("Σ Salidas")
- prop("Σ Traslados Enviados")
+ prop("Σ Traslados Recibidos")
```

### F15 · `Current Balance` *(versión simple, idéntica al diseño original)*
```notion
style("Current Balance:", "c") + " €" + format(round(prop("Saldo Actual")))
```

### F15-bis · `Current Balance` *(versión con separador de miles)*
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

### F16 · `Salud`
```notion
if(prop("Saldo Actual") < 0, "🔴 En negativo",
if(prop("Saldo Actual") < 100, "🟡 Bajo", "🟢 OK"))
```

---

## BD 3 · `Presupuestos`

### F17 · `Restante`
```notion
prop("Límite") - prop("Gastado")
```

### F18 · `% Uso`  → formato **Porcentaje**
```notion
if(prop("Límite") == 0, 0, prop("Gastado") / prop("Límite"))
```

### F19 · `Progreso`
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

### F20 · `Estado Presupuesto`
```notion
lets(
  pct, if(prop("Límite") == 0, 0, prop("Gastado") / prop("Límite")),
  if(pct >= 1, "🔴 Excedido",
  if(pct >= 0.8, "🟡 Atención",
  if(pct > 0, "🟢 En control", "⚪ Sin gasto")))
)
```

---

## BD 4 · `Deudas`

### F21 · `Saldo Pendiente`
```notion
max(prop("Monto Original") - prop("Total Pagado"), 0)
```

### F22 · `% Amortizado`  → formato **Porcentaje**
```notion
if(prop("Monto Original") == 0, 0, prop("Total Pagado") / prop("Monto Original"))
```

### F23 · `Cuota Vencida`
```notion
if(
  prop("Estado") != "Pagada"
    and not empty(prop("Próximo Vencimiento"))
    and dateBetween(now(), prop("Próximo Vencimiento"), "days") >= 0,
  min(prop("Cuota Mensual"), prop("Saldo Pendiente")),
  0
)
```

### F24 · `Días de Atraso`
```notion
lets(
  v, prop("Próximo Vencimiento"),
  d, if(empty(v), 0, dateBetween(now(), v, "days")),
  if(prop("Estado") == "Pagada" or d <= 0, 0, d)
)
```

### F25 · `Alerta Deuda`
```notion
lets(
  d, prop("Días de Atraso"),
  if(prop("Estado") == "Pagada", "✅ Liquidada",
  if(d > 30, "🔴 " + format(d) + " días de mora",
  if(d > 0, "🟠 Vencida hace " + format(d) + " días",
  "🟢 Al corriente")))
)
```

---

## BD 5 · `Inversiones`

### F26 · `Capital Total`
```notion
prop("Capital Inicial") + prop("Aportes Registrados")
```

### F27 · `Rendimiento €`
```notion
prop("Valor Actual") - prop("Capital Total")
```

### F28 · `Rendimiento %`  → formato **Porcentaje**
```notion
if(prop("Capital Total") == 0, 0, (prop("Valor Actual") - prop("Capital Total")) / prop("Capital Total"))
```

### F29 · `Valor Activo`
```notion
if(prop("Estado") == "Abierta", prop("Valor Actual"), 0)
```

### F30 · `Rendimiento Visual`
```notion
lets(
  r, prop("Rendimiento €"),
  p, prop("Rendimiento %"),
  if(r > 0, "🟢 +€" + format(round(r)) + " (" + format(round(p * 100)) + "%)",
  if(r < 0, "🔴 -€" + format(round(abs(r))) + " (" + format(round(p * 100)) + "%)",
  "⚪ Sin cambio"))
)
```

### F31 · `Antigüedad (meses)`
```notion
if(empty(prop("Fecha de Entrada")), 0, dateBetween(now(), prop("Fecha de Entrada"), "months"))
```

---

## BD 6 · `Suscripciones`

### F32 · `Costo Mensual`
```notion
lets(
  c, prop("Costo"),
  if(prop("Ciclo") == "Mensual", c,
  if(prop("Ciclo") == "Trimestral", c / 3,
  if(prop("Ciclo") == "Semestral", c / 6,
  if(prop("Ciclo") == "Anual", c / 12, c))))
)
```

### F33 · `Costo Mensual Activo`
```notion
if(prop("Estado") == "Activa", prop("Costo Mensual"), 0)
```

### F34 · `Costo Anual`
```notion
prop("Costo Mensual") * 12
```

### F35 · `Días para el Cobro`
```notion
if(empty(prop("Próximo Cobro")), 0, dateBetween(prop("Próximo Cobro"), now(), "days"))
```

### F36 · `Aviso de Cobro`
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

---

## BD 7 · `Historial Mensual`

### F37 · `Patrimonio Neto`
```notion
prop("Liquidez") + prop("Valor de Cartera") - prop("Deuda Total")
```

### F38 · `Tasa de Ahorro`  → formato **Porcentaje**
```notion
if(prop("Ingresos del Mes") == 0, 0, (prop("Ingresos del Mes") - prop("Gastos del Mes")) / prop("Ingresos del Mes"))
```

### F39 · `Inversión Acumulada` *(solo Vía B — requiere la relación `Cartera`)*
```notion
prop("Cartera")
  .filter(current.prop("Fecha de Entrada") <= prop("Fecha de Corte"))
  .map(current.prop("Valor Actual"))
  .sum()
```

---

## BD 8 · `Master Financiero`

### Las 5 fórmulas del informe *(las visibles en el dashboard)*

### F40a · `Sus ingresos totales`
```notion
style("Sus ingresos totales:", "b") + " €" + format(round(prop("R. Ingresos")))
```

### F40b · `Su gasto total`
```notion
style("Su gasto total:", "b") + " €" + format(round(prop("R. Gastos")))
```

### F40c · `Inversión actual`
```notion
style("Inversión actual:", "b") + " €" + format(round(prop("R. Inversión")))
```

### F40d · `Deuda mensual vencida`
```notion
style("Deuda mensual vencida:", "b") + " €" + format(round(prop("R. Deuda Vencida")))
```

> Variante de **stock** (deuda total en lugar de cuota vencida):
> sustituye `prop("R. Deuda Vencida")` por `prop("R. Deuda Total")`.

### F40e · `Costos de suscripción`
```notion
style("Costos de suscripción:", "b") + " €" + format(round(prop("R. Suscripciones")))
```

### Métricas derivadas

### F41a · `Patrimonio Neto`  → formato **Euro (€)**
```notion
prop("R. Liquidez") + prop("R. Inversión") - prop("R. Deuda Total")
```

### F41b · `Patrimonio Neto (tarjeta)`
```notion
lets(
  pn, prop("Patrimonio Neto"),
  etiqueta, style("Patrimonio neto:", "b"),
  valor, "€" + format(round(pn)),
  etiqueta + " " + if(pn >= 0, style(valor, "green"), style(valor, "red"))
)
```

### F41c · `Tasa de Ahorro`  → formato **Porcentaje**
```notion
if(prop("R. Ingresos") == 0, 0, (prop("R. Ingresos") - prop("R. Gastos")) / prop("R. Ingresos"))
```

### F41d · `Flujo Libre Mensual`
```notion
prop("R. Ingresos") - prop("R. Gastos") - prop("R. Deuda Vencida") - prop("R. Suscripciones")
```

### F41e · `Meses de Colchón`
```notion
lets(
  quema, prop("R. Gastos") + prop("R. Suscripciones") + prop("R. Deuda Vencida"),
  if(quema <= 0, 0, round(prop("R. Liquidez") / quema * 10) / 10)
)
```

### F41f · `Diagnóstico`
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

## Fórmula extra · Informe completo en una sola propiedad

Si prefieres **una única propiedad** en lugar de cinco (menos propiedades, menos control sobre el
espaciado de la tarjeta):

```notion
lets(
  euro, (n) => "€" + format(round(n)),
  style("Informe sobre el patrimonio neto", "b", "u") + "\n\n"
  + style("Sus ingresos totales: ", "b") + euro(prop("R. Ingresos")) + "\n\n"
  + style("Su gasto total: ", "b") + euro(prop("R. Gastos")) + "\n\n"
  + style("Inversión actual: ", "b") + euro(prop("R. Inversión")) + "\n\n"
  + style("Deuda mensual vencida: ", "b") + euro(prop("R. Deuda Vencida")) + "\n\n"
  + style("Costos de suscripción: ", "b") + euro(prop("R. Suscripciones"))
)
```

> `lets` admite definir **funciones anónimas** con la sintaxis `(n) => …`. Si tu versión de Notion
> la rechaza, expande cada llamada a `"€" + format(round(prop("…")))`.
>
> **Recomendación:** usa las 5 propiedades separadas (F40a–F40e). Se ven mejor espaciadas en la
> tarjeta de galería y puedes reordenarlas o esconder alguna sin tocar la fórmula.
