# 🗂️ Esquema de referencia · Gerente de Finanzas

Tabla maestra de las **8 bases de datos**. Úsala como lista de comprobación mientras construyes:
cada fila es una propiedad que debe existir, con su tipo exacto y su configuración.

**Leyenda de tipos**
`T` Título · `N` Número · `S` Selección · `MS` Multi-selección · `F` Fecha · `TX` Texto ·
`C` Casilla · `R` Relación · `RU` Rollup · `FX` Fórmula · `A` Archivos · `P` Persona

---

## BD 1 · `Cuentas`  — 4 filas: Efectivo · Tarjeta electrónica · Otros · Banco

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Cuenta` | T | — |
| 2 | `Tipo de cuenta` | S | `Efectivo` · `Tarjeta` · `Banco` · `Otros` |
| 3 | `Saldo Inicial` | N | Formato Euro (€) |
| 4 | `Divisa` | S | `EUR` · `USD` · `MXN` *(opcional)* |
| 5 | `Activa` | C | Marcada por defecto |
| 6 | `Notas` | TX | — |
| 7 | `Movimientos (Origen)` | R | ← inversa de `Transacciones.Cuenta de Origen` |
| 8 | `Movimientos (Destino)` | R | ← inversa de `Transacciones.Cuenta de Destino` |
| 9 | `Master` | R | → `Master Financiero` · inversa: `Todas las Cuentas` |
| 10 | `Σ Ingresos` | RU | `Movimientos (Origen)` → `Monto Ingreso` → **Suma** |
| 11 | `Σ Salidas` | RU | `Movimientos (Origen)` → `Salida de Caja` → **Suma** |
| 12 | `Σ Traslados Enviados` | RU | `Movimientos (Origen)` → `Monto Traslado` → **Suma** |
| 13 | `Σ Traslados Recibidos` | RU | `Movimientos (Destino)` → `Monto Traslado` → **Suma** |
| 14 | `Saldo Actual` | FX | Número, formato Euro · **debe ser fórmula, no rollup** |
| 15 | `Current Balance` | FX | Texto · la que se muestra en la tarjeta de galería |
| 16 | `Salud` | FX | Texto · semáforo 🔴🟡🟢 |
| 17 | `Nº Movimientos` | RU | `Movimientos (Origen)` → `Descripción` → **Contar todos** |
| 18 | `Último Movimiento` | RU | `Movimientos (Origen)` → `Fecha` → **Más reciente** |

---

## BD 2 · `Transacciones` — el libro mayor único

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Descripción` | T | — |
| 2 | `Cantidad` | N | Euro (€) · **siempre positiva** |
| 3 | `Tipo` | S | `Ingreso` · `Gasto` · `Traslado` · `Inversión` · `Pago de Deuda` · `Suscripción` |
| 4 | `Categoría` | S | Lista compartida con `Presupuestos` |
| 5 | `Fecha` | F | `DD/MM/YYYY`, sin hora |
| 6 | `Método` | S | `Efectivo` · `Tarjeta` · `Transferencia` · `Domiciliación` |
| 7 | `Recurrente` | C | — |
| 8 | `Archivado` | C | Alimenta la vista `Archivo` |
| 9 | `Adjunto` | A | Recibos |
| 10 | `Cuenta de Origen` | R | → `Cuentas` · inversa: `Movimientos (Origen)` |
| 11 | `Cuenta de Destino` | R | → `Cuentas` · inversa: `Movimientos (Destino)` |
| 12 | `Presupuesto` | R | → `Presupuestos` · inversa: `Movimientos` |
| 13 | `Deuda Vinculada` | R | → `Deudas` · inversa: `Pagos` |
| 14 | `Inversión Vinculada` | R | → `Inversiones` · inversa: `Aportes` |
| 15 | `Suscripción Vinculada` | R | → `Suscripciones` · inversa: `Cargos` |
| 16 | `Master` | R | → `Master Financiero` · inversa: `Todas las Transacciones` |
| 17 | `Monto Ingreso` | FX | Pre-filtro · Euro · **ocultar en vistas** |
| 18 | `Monto Gasto` | FX | Pre-filtro · Euro · **ocultar** |
| 19 | `Monto Traslado` | FX | Pre-filtro · Euro · **ocultar** |
| 20 | `Monto Inversión` | FX | Pre-filtro · Euro · **ocultar** |
| 21 | `Monto Deuda` | FX | Pre-filtro · Euro · **ocultar** |
| 22 | `Monto Suscripción` | FX | Pre-filtro · Euro · **ocultar** |
| 23 | `Salida de Caja` | FX | Pre-filtro · Euro · **ocultar** |
| 24 | `Flujo Neto` | FX | Euro |
| 25 | `Medio` | FX | Texto · segmenta las gráficas de anillo |
| 26 | `Mes` | FX | Texto `YYYY-MM` |
| 27 | `Mes (etiqueta)` | FX | Texto `MMMM YYYY` |
| 28 | `Periodo` | FX | Texto · `Mes actual` / `Meses anteriores` / `Futuro` |
| 29 | `Validación` | FX | Texto · ✅ o ⚠️ + causa |

---

## BD 3 · `Presupuestos`

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Presupuesto` | T | Ej. `Supermercado · Junio 2025` |
| 2 | `Categoría` | S | **Misma lista exacta** que `Transacciones.Categoría` |
| 3 | `Límite` | N | Euro (€) |
| 4 | `Mes` | F | Día 1 del mes |
| 5 | `Movimientos` | R | ← inversa de `Transacciones.Presupuesto` |
| 6 | `Gastado` | RU | `Movimientos` → `Monto Gasto` → **Suma** |
| 7 | `Restante` | FX | Euro |
| 8 | `% Uso` | FX | Formato **Porcentaje** |
| 9 | `Progreso` | FX | Texto · barra de 10 segmentos |
| 10 | `Estado Presupuesto` | FX | Texto · 🟢🟡🔴⚪ |

---

## BD 4 · `Deudas`

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Deuda` | T | — |
| 2 | `Acreedor` | TX | — |
| 3 | `Tipo de Deuda` | S | `Préstamo` · `Tarjeta de crédito` · `Hipoteca` · `Personal` · `Otro` |
| 4 | `Monto Original` | N | Euro (€) |
| 5 | `Tasa Anual` | N | Formato **Porcentaje** |
| 6 | `Cuota Mensual` | N | Euro (€) |
| 7 | `Próximo Vencimiento` | F | — |
| 8 | `Estado` | S | `Activa` · `Pagada` · `En mora` |
| 9 | `Pagos` | R | ← inversa de `Transacciones.Deuda Vinculada` |
| 10 | `Master` | R | → `Master Financiero` · inversa: `Todas las Deudas` |
| 11 | `Total Pagado` | RU | `Pagos` → `Monto Deuda` → **Suma** |
| 12 | `Saldo Pendiente` | FX | Euro |
| 13 | `% Amortizado` | FX | Porcentaje |
| 14 | `Cuota Vencida` | FX | Euro · **alimenta `Deuda mensual vencida`** |
| 15 | `Días de Atraso` | FX | Número |
| 16 | `Alerta Deuda` | FX | Texto |

---

## BD 5 · `Inversiones`

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Activo` | T | — |
| 2 | `Horizonte` | S | `Corto Plazo` · `Largo Plazo` · **alimenta las pestañas del gráfico** |
| 3 | `Clase` | S | `Acciones` · `ETF` · `Fondo indexado` · `Cripto` · `Inmueble` · `Depósito` · `Otro` |
| 4 | `Fecha de Entrada` | F | — |
| 5 | `Capital Inicial` | N | Euro (€) |
| 6 | `Valor Actual` | N | Euro (€) · **actualización manual periódica** |
| 7 | `Estado` | S | `Abierta` · `Cerrada` |
| 8 | `Aportes` | R | ← inversa de `Transacciones.Inversión Vinculada` |
| 9 | `Master` | R | → `Master Financiero` · inversa: `Todas las Inversiones` |
| 10 | `Aportes Registrados` | RU | `Aportes` → `Monto Inversión` → **Suma** |
| 11 | `Capital Total` | FX | Euro |
| 12 | `Rendimiento €` | FX | Euro |
| 13 | `Rendimiento %` | FX | Porcentaje |
| 14 | `Valor Activo` | FX | Euro · **pre-filtro para el rollup del Master** |
| 15 | `Rendimiento Visual` | FX | Texto |
| 16 | `Antigüedad (meses)` | FX | Número |

---

## BD 6 · `Suscripciones`

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Servicio` | T | — |
| 2 | `Costo` | N | Euro (€) · el importe tal como te lo cobran |
| 3 | `Ciclo` | S | `Mensual` · `Trimestral` · `Semestral` · `Anual` |
| 4 | `Próximo Cobro` | F | — |
| 5 | `Estado` | S | `Activa` · `Pausada` · `Cancelada` |
| 6 | `Cuenta de Cargo` | R | → `Cuentas` |
| 7 | `Categoría` | S | Lista compartida |
| 8 | `Cargos` | R | ← inversa de `Transacciones.Suscripción Vinculada` |
| 9 | `Master` | R | → `Master Financiero` · inversa: `Todas las Suscripciones` |
| 10 | `Costo Mensual` | FX | Euro · normaliza el ciclo |
| 11 | `Costo Mensual Activo` | FX | Euro · **pre-filtro para el rollup del Master** |
| 12 | `Costo Anual` | FX | Euro |
| 13 | `Días para el Cobro` | FX | Número |
| 14 | `Aviso de Cobro` | FX | Texto |

---

## BD 7 · `Historial Mensual` — una fila por mes

| # | Propiedad | Tipo | Configuración exacta |
|---|---|---|---|
| 1 | `Mes` | T | Formato `2025-06 · Junio` |
| 2 | `Fecha de Corte` | F | Último día del mes · **eje X de la gráfica de líneas** |
| 3 | `Valor de Cartera` | N | Euro (€) · **eje Y de la gráfica de líneas** |
| 4 | `Liquidez` | N | Euro (€) |
| 5 | `Deuda Total` | N | Euro (€) |
| 6 | `Ingresos del Mes` | N | Euro (€) |
| 7 | `Gastos del Mes` | N | Euro (€) |
| 8 | `Patrimonio Neto` | FX | Euro |
| 9 | `Tasa de Ahorro` | FX | Porcentaje |
| 10 | `Cartera` | R | → `Inversiones` *(solo para la Vía B automática)* |
| 11 | `Inversión Acumulada` | FX | Euro *(solo para la Vía B automática)* |

---

## BD 8 · `Master Financiero` — **una sola fila**

Título de la fila única: **`Informe sobre el patrimonio neto`**

### Relaciones globales

| # | Propiedad | Tipo | Apunta a | Inversa |
|---|---|---|---|---|
| 1 | `Todas las Transacciones` | R | `Transacciones` | `Master` |
| 2 | `Todas las Cuentas` | R | `Cuentas` | `Master` |
| 3 | `Todas las Deudas` | R | `Deudas` | `Master` |
| 4 | `Todas las Inversiones` | R | `Inversiones` | `Master` |
| 5 | `Todas las Suscripciones` | R | `Suscripciones` | `Master` |

### Rollups (maquinaria — **ocultar en la galería del dashboard**)

| # | Propiedad | Relación | Propiedad destino | Cálculo |
|---|---|---|---|---|
| 6 | `R. Ingresos` | `Todas las Transacciones` | `Monto Ingreso` | Suma |
| 7 | `R. Gastos` | `Todas las Transacciones` | `Monto Gasto` | Suma |
| 8 | `R. Traslados` | `Todas las Transacciones` | `Monto Traslado` | Suma |
| 9 | `R. Liquidez` | `Todas las Cuentas` | `Saldo Actual` | Suma |
| 10 | `R. Inversión` | `Todas las Inversiones` | `Valor Activo` | Suma |
| 11 | `R. Capital Invertido` | `Todas las Inversiones` | `Capital Total` | Suma |
| 12 | `R. Deuda Vencida` | `Todas las Deudas` | `Cuota Vencida` | Suma |
| 13 | `R. Deuda Total` | `Todas las Deudas` | `Saldo Pendiente` | Suma |
| 14 | `R. Suscripciones` | `Todas las Suscripciones` | `Costo Mensual Activo` | Suma |
| 15 | `R. Nº Cuentas` | `Todas las Cuentas` | `Cuenta` | Contar todos |

### Fórmulas de presentación (**las 5 visibles** en la tarjeta del dashboard)

| # | Propiedad | Tipo | Muestra |
|---|---|---|---|
| 16 | `Sus ingresos totales` | FX | `**Sus ingresos totales:** €3100` |
| 17 | `Su gasto total` | FX | `**Su gasto total:** €1626` |
| 18 | `Inversión actual` | FX | `**Inversión actual:** €2840` |
| 19 | `Deuda mensual vencida` | FX | `**Deuda mensual vencida:** €2201` |
| 20 | `Costos de suscripción` | FX | `**Costos de suscripción:** €121` |

### Métricas derivadas (para la página `Informes`)

| # | Propiedad | Tipo | Configuración |
|---|---|---|---|
| 21 | `Patrimonio Neto` | FX | Euro |
| 22 | `Patrimonio Neto (tarjeta)` | FX | Texto con color condicional |
| 23 | `Tasa de Ahorro` | FX | Porcentaje |
| 24 | `Flujo Libre Mensual` | FX | Euro |
| 25 | `Meses de Colchón` | FX | Número con 1 decimal |
| 26 | `Diagnóstico` | FX | Texto |

---

## Matriz de dependencias — el orden importa

Una propiedad **no se puede crear** hasta que existan todas las de su columna izquierda:

```
Propiedades base          Relaciones            Fórmulas pre-filtro     Rollups              Fórmulas finales
─────────────────────  →  ─────────────────  →  ───────────────────  →  ─────────────────  →  ──────────────────
Cantidad, Tipo, Fecha     Cuenta de Origen      Monto Ingreso           Σ Ingresos           Saldo Actual
Saldo Inicial             Cuenta de Destino     Monto Gasto             Σ Salidas            Current Balance
Monto Original            Deuda Vinculada       Salida de Caja          Total Pagado         Saldo Pendiente
Costo, Ciclo              Inversión Vinculada   Monto Traslado          Gastado              Cuota Vencida
Valor Actual              Suscripción Vinc.     Monto Deuda             Aportes Registrados  Costo Mensual
                          Master (×5)           Monto Inversión         R. Ingresos …        Las 5 del informe
                                                Monto Suscripción       R. Liquidez ⚠️        Patrimonio Neto
```

> ⚠️ `R. Liquidez` es el único rollup que depende de una **fórmula final** (`Saldo Actual`).
> Créalo al final de todo.
