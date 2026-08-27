# 🧪 Datos de prueba y verificación

Juego de datos semilla **matemáticamente consistente** que reproduce exactamente las cifras del
diseño de referencia. Cárgalo tras terminar la FASE 1 y, si los 5 totales del informe coinciden,
tu motor de rollups es correcto.

**Cifras objetivo del informe (Master Financiero):**

| Métrica | Valor esperado |
|---|---|
| Sus ingresos totales | **€3100** |
| Su gasto total | **€1626** |
| Inversión actual | **€2840** |
| Deuda mensual vencida | **€2201** *(Variante B — stock)* |
| Costos de suscripción | **€121** |

**Saldos de cuenta esperados:**

| Cuenta | `Saldo Actual` |
|---|---|
| Efectivo | **€-411** |
| Tarjeta electrónica | **€549** |
| Otros | **€-113** |
| Banco | **€1449** |
| **Liquidez total** | **€1474** |

---

## 1 · BD `Cuentas` — 4 filas

| `Cuenta` | Icono | `Tipo de cuenta` | `Saldo Inicial` | `Activa` |
|---|---|---|---|---|
| Efectivo | 💵 | `Efectivo` | 0 | ✅ |
| Tarjeta electrónica | 💳 | `Tarjeta` | 0 | ✅ |
| Otros | 🗂️ | `Otros` | 0 | ✅ |
| Banco | 🏦 | `Banco` | **2101** | ✅ |

> 2.101 € es el saldo bancario real del día en que arrancó el sistema. Es el **único** número que
> se introduce a mano y nunca se vuelve a tocar.

---

## 2 · BD `Transacciones` — 23 filas (todas con `Fecha` de junio de 2025)

### Ingresos · 3 filas → total **3.100 €**

| `Descripción` | `Cantidad` | `Tipo` | `Categoría` | `Cuenta de Origen` |
|---|---|---|---|---|
| Nómina junio | 2500 | `Ingreso` | `Salario` | Banco |
| Proyecto freelance | 450 | `Ingreso` | `Freelance` | Banco |
| Reembolso viaje | 150 | `Ingreso` | `Reembolsos` | Efectivo |

### Gastos corrientes · 8 filas → **1.513 €**

| `Descripción` | `Cantidad` | `Categoría` | `Cuenta de Origen` |
|---|---|---|---|
| Compra semanal | 246 | `Supermercado` | Efectivo |
| Restaurantes del mes | 145 | `Restaurantes` | Efectivo |
| Abono transporte | 78 | `Transporte` | Efectivo |
| Cine y ocio | 92 | `Ocio` | Efectivo |
| Ropa de temporada | 128 | `Ropa` | Tarjeta electrónica |
| Curso online | 91 | `Educación` | Tarjeta electrónica |
| Alquiler | 700 | `Vivienda` | Banco |
| Tasa municipal | 33 | `Impuestos` | Banco |

> Reparto por medio de pago (así se verá la gráfica de anillo **Gastos Corrientes**):
> Efectivo **561** · Tarjeta **219** · Banco **733** · Otros **113** → **1.626**

### Otros gastos · 2 filas (cuenta `Otros`) → **113 €** · *total gastos = 1.513 + 113 = **1.626 €***

| `Descripción` | `Cantidad` | `Tipo` | `Categoría` | `Cuenta de Origen` |
|---|---|---|---|---|
| Farmacia | 61 | `Gasto` | `Salud` | Otros |
| Gastos varios | 52 | `Gasto` | `Otros` | Otros |

### Suscripciones · 5 filas → total **121 €**

| `Descripción` | `Cantidad` | `Tipo` | `Cuenta de Origen` | `Suscripción Vinculada` |
|---|---|---|---|---|
| Spotify junio | 11 | `Suscripción` | Tarjeta electrónica | Spotify |
| Netflix junio | 18 | `Suscripción` | Tarjeta electrónica | Netflix |
| iCloud junio | 3 | `Suscripción` | Tarjeta electrónica | iCloud+ |
| Gimnasio junio | 39 | `Suscripción` | Banco | Gimnasio |
| Adobe (prorrateo) | 50 | `Suscripción` | Banco | Adobe CC |

### Pago de deuda · 1 fila → **180 €**

| `Descripción` | `Cantidad` | `Tipo` | `Cuenta de Origen` | `Deuda Vinculada` |
|---|---|---|---|---|
| Cuota préstamo coche | 180 | `Pago de Deuda` | Banco | Préstamo coche |

### Inversiones · 3 filas → total **1.800 €**

| `Descripción` | `Cantidad` | `Tipo` | `Cuenta de Origen` | `Inversión Vinculada` |
|---|---|---|---|---|
| Aportación ETF | 1200 | `Inversión` | Banco | MSCI World ETF |
| Compra cripto | 300 | `Inversión` | Banco | Cartera cripto |
| Depósito a plazo | 300 | `Inversión` | Banco | Depósito 12 meses |

### Traslado · 1 fila → **800 €**

| `Descripción` | `Cantidad` | `Tipo` | `Cuenta de Origen` | `Cuenta de Destino` |
|---|---|---|---|---|
| Recarga tarjeta | 800 | `Traslado` | Banco | Tarjeta electrónica |

> **Esta es la fila que valida todo el sistema.** Debe mover 800 € de Banco a Tarjeta **sin** alterar
> ni `Sus ingresos totales` ni `Su gasto total`.

---

## 3 · BD `Suscripciones` — 5 filas → `Costos de suscripción` = **121 €**

| `Servicio` | `Costo` | `Ciclo` | `Costo Mensual` | `Estado` | `Cuenta de Cargo` |
|---|---|---|---|---|---|
| Spotify | 11 | `Mensual` | 11 | `Activa` | Tarjeta electrónica |
| Netflix | 18 | `Mensual` | 18 | `Activa` | Tarjeta electrónica |
| iCloud+ | 3 | `Mensual` | 3 | `Activa` | Tarjeta electrónica |
| Gimnasio | 39 | `Mensual` | 39 | `Activa` | Banco |
| Adobe CC | **600** | **`Anual`** | **50** | `Activa` | Banco |
| | | | **Σ 121** | | |

> Adobe es la prueba de la normalización de ciclos: se paga 600 € una vez al año, pero el sistema
> lo imputa como **50 €/mes**. Añade una sexta fila con `Estado` = `Cancelada` y comprueba que
> **no** altera el total: eso valida el pre-filtro `Costo Mensual Activo`.

---

## 4 · BD `Deudas` — 2 filas → `R. Deuda Total` = **2.201 €**

| `Deuda` | `Tipo de Deuda` | `Monto Original` | `Cuota Mensual` | `Total Pagado` | `Saldo Pendiente` | `Estado` |
|---|---|---|---|---|---|---|
| Préstamo coche | `Préstamo` | 2000 | 180 | 180 *(rollup)* | **1820** | `Activa` |
| Tarjeta de crédito | `Tarjeta de crédito` | 381 | 100 | 0 | **381** | `Activa` |
| | | | | | **Σ 2201** | |

`Total Pagado` **no se escribe**: lo calcula el rollup a partir de la transacción de 180 € de
`Pago de Deuda`. Si aparece 0, la relación `Deuda Vinculada` no está puesta.

Pon `Próximo Vencimiento` en una fecha **pasada** en el préstamo del coche para ver funcionar
`Cuota Vencida`, `Días de Atraso` y `Alerta Deuda`.

---

## 5 · BD `Inversiones` — 3 filas → `Inversión actual` = **2.840 €**

| `Activo` | `Horizonte` | `Clase` | `Capital Inicial` | `Aportes Registrados` | `Capital Total` | `Valor Actual` | `Rendimiento €` |
|---|---|---|---|---|---|---|---|
| MSCI World ETF | `Largo Plazo` | `ETF` | 700 | 1200 *(rollup)* | 1900 | **2000** | 🟢 +100 |
| Cartera cripto | `Corto Plazo` | `Cripto` | 140 | 300 *(rollup)* | 440 | **340** | 🔴 −100 |
| Depósito 12 meses | `Corto Plazo` | `Depósito` | 200 | 300 *(rollup)* | 500 | **500** | ⚪ 0 |
| | | | **1040** | **1800** | **2840** | **Σ 2840** | |

Añade una cuarta fila con `Estado` = `Cerrada` y `Valor Actual` = 5000: el total del informe
**debe seguir siendo 2840**. Eso valida el pre-filtro `Valor Activo`.

---

## 6 · BD `Historial Mensual` — 8 filas para la gráfica de líneas

Reproduce exactamente la curva del diseño de referencia:

| `Mes` | `Fecha de Corte` | `Valor de Cartera` |
|---|---|---|
| 2024-11 · Noviembre | 30/11/2024 | 230 |
| 2024-12 · Diciembre | 31/12/2024 | 534 |
| 2025-01 · Enero | 31/01/2025 | 654 |
| 2025-02 · Febrero | 28/02/2025 | 954 |
| 2025-03 · Marzo | 31/03/2025 | 1800 |
| 2025-04 · Abril | 30/04/2025 | 2300 |
| 2025-05 · Mayo | 31/05/2025 | 2300 |
| 2025-06 · Junio | 30/06/2025 | 2600 |

Rellena también `Liquidez` y `Deuda Total` de cada mes si quieres la gráfica de patrimonio neto de
la página `Informes`.

---

## 7 · BD `Master Financiero` — 1 fila

| Propiedad | Valor |
|---|---|
| Título | `Informe sobre el patrimonio neto` |
| `Todas las Transacciones` | 23 páginas *(automático)* |
| `Todas las Cuentas` | 4 páginas *(automático)* |
| `Todas las Deudas` | 2 páginas *(automático)* |
| `Todas las Inversiones` | 3 páginas *(automático)* |
| `Todas las Suscripciones` | 5 páginas *(automático)* |

---

## 8 · Cuadre completo — comprueba fila por fila

### Cuentas

| Cuenta | Inicial | + Ingresos | − Salidas | − Enviado | + Recibido | = `Saldo Actual` |
|---|---|---|---|---|---|---|
| Efectivo | 0 | +150 | −561 | 0 | 0 | **−411** ✅ |
| Tarjeta electrónica | 0 | 0 | −251 *(219 gasto + 32 susc)* | 0 | +800 | **549** ✅ |
| Otros | 0 | 0 | −113 | 0 | 0 | **−113** ✅ |
| Banco | 2101 | +2950 | −2802 *(733 gastos + 89 susc + 180 deuda + 1800 inv)* | −800 | 0 | **1449** ✅ |
| | | | | | **Σ Liquidez** | **1474** |

> Detalle de las salidas del Banco: gastos 733 + suscripciones 89 + deuda 180 + inversiones 1800 = **2802**.
> `2101 + 2950 − 2802 − 800 = 1449` ✅

### Informe del Master

| Métrica | Cálculo | Resultado |
|---|---|---|
| `Sus ingresos totales` | 2500 + 450 + 150 | **3100** ✅ |
| `Su gasto total` | 561 + 219 + 733 + 113 | **1626** ✅ |
| `Inversión actual` | 2000 + 340 + 500 | **2840** ✅ |
| `Deuda mensual vencida` (stock) | 1820 + 381 | **2201** ✅ |
| `Costos de suscripción` | 11 + 18 + 3 + 39 + 50 | **121** ✅ |
| `Patrimonio Neto` | 1474 + 2840 − 2201 | **2113** |
| `Tasa de Ahorro` | (3100 − 1626) / 3100 | **47,5 %** |
| `Meses de Colchón` | 1474 / (1626 + 121 + 0) | **0,8** |

### Gráficas

| Gráfica | Segmentos esperados | Total central |
|---|---|---|
| **Gastos Corrientes** (anillo) | Efectivo 561 · Banco 733 · Tarjeta 219 · Otros 113 | **1.6K** ✅ |
| **Ingresos corrientes** (anillo) | Banco 2950 · Efectivo 150 | **3.1K** ✅ |
| **Inversión actual** (líneas) | 230 → 534 → 654 → 954 → 1800 → 2300 → 2300 → 2600 | — |

---

## 9 · Las 3 pruebas que hay que superar

### Prueba A · El traslado no es un gasto
Borra temporalmente el traslado de 800 €.
- `Su gasto total` **no debe cambiar** (sigue en 1626).
- Tarjeta baja a −251 y Banco sube a 2249.
- Liquidez total **no cambia** (1474).

❌ Si `Su gasto total` cambia → el rollup `R. Gastos` apunta a `Salida de Caja` en vez de a `Monto Gasto`.

### Prueba B · La inversión no es un gasto, pero sí sale de la cuenta
Borra temporalmente la aportación al ETF de 1.200 €.
- `Su gasto total` **no debe cambiar** (sigue en 1626).
- Banco **sube** a 2649.
- `Inversión actual` baja a 1640.

❌ Si `Su gasto total` sube → `Monto Gasto` incluye el tipo `Inversión`.
❌ Si el saldo del Banco **no** cambia → `Σ Salidas` usa `Monto Gasto` en vez de `Salida de Caja`.

### Prueba C · Cadena completa de recálculo
Cambia la `Cantidad` de la nómina de 2500 a 3000. En menos de 2 segundos deben moverse **9** valores:

`Monto Ingreso` → `Σ Ingresos` (Banco) → `Saldo Actual` (Banco) → `Current Balance` (tarjeta del
dashboard) → `R. Liquidez` → `R. Ingresos` → `Sus ingresos totales` → `Patrimonio Neto` →
`Tasa de Ahorro`.

❌ Si algo se queda atrás, has roto la cadena en ese eslabón. Revísalo con el
[capítulo 5.3 del manual](MANUAL.md#53--errores-frecuentes-y-su-causa-exacta).

*Después de las pruebas, restaura los valores originales.*
