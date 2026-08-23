# 🔑 Mapa de IDs · Instancia construida en Notion

Sistema construido el 2026-08-23 en el workspace de Randy Alvarado.

## Páginas

| Página | ID | URL |
|---|---|---|
| `Gerente de Finanzas` (raíz) | `3c5bcf9f-3ec3-8103-a23a-cc8999ffeb36` | https://app.notion.com/p/3c5bcf9f3ec38103a23acc8999ffeb36 |
| `⚙️ Motor de datos (no tocar)` | `3c5bcf9f-3ec3-814b-8119-f3d1c1107fab` | https://app.notion.com/p/3c5bcf9f3ec3814b8119f3d1c1107fab |

## Bases de datos

| BD | Database ID | Data source ID |
|---|---|---|
| `Cuentas` | `1d71fbc9-9a56-4217-997a-a69a61a2b8c1` | `ea2fa045-29bc-4957-91e5-2c51b9e058be` |
| `Transacciones` | `bcafbe55-b8d5-4719-9b95-53fe9ca99299` | `dbb7982b-a09b-4385-93dd-ab1016054914` |
| `Presupuestos` | `13cb4d8b-6c1d-4b5d-a597-6ad58c01cb1f` | `cb54dc92-8fcf-46d4-96c1-37058e332d8b` |
| `Deudas` | `4d13ad94-21c9-4c85-9c7d-f655096caeb2` | `d1b691d8-1424-430f-a365-2973d844c271` |
| `Inversiones` | `a20b0b11-3ec8-40a2-a0ef-df1a8d81870d` | `ad174e77-b4c4-45e7-ba9e-e22b326878e3` |
| `Suscripciones` | `bc2ea840-aa37-4acc-98eb-fa1f67e05435` | `2f0f3a31-5d9b-4d92-8579-c91680ce53f8` |
| `Historial Mensual` | `5b92e0c1-3e95-40a5-8a10-bf56df02d29f` | `9745e02a-49e5-4fc2-909d-e25aff373a42` |
| `Master Financiero` | `d337f5ec-3484-423a-a13a-b482631d80a9` | `b465d220-8cac-4531-b9a9-17ebfe0548e6` |

## Relaciones bilaterales creadas

| Origen (BD hija) | Propiedad | Destino | Propiedad inversa |
|---|---|---|---|
| Transacciones | `Cuenta de Origen` | Cuentas | `Movimientos (Origen)` |
| Transacciones | `Cuenta de Destino` | Cuentas | `Movimientos (Destino)` |
| Transacciones | `Presupuesto` | Presupuestos | `Movimientos` |
| Transacciones | `Deuda Vinculada` | Deudas | `Pagos` |
| Transacciones | `Inversión Vinculada` | Inversiones | `Aportes` |
| Transacciones | `Suscripción Vinculada` | Suscripciones | `Cargos` |
| Transacciones | `Master` | Master Financiero | `Todas las Transacciones` |
| Cuentas | `Master` | Master Financiero | `Todas las Cuentas` |
| Deudas | `Master` | Master Financiero | `Todas las Deudas` |
| Inversiones | `Master` | Master Financiero | `Todas las Inversiones` |
| Suscripciones | `Master` | Master Financiero | `Todas las Suscripciones` |
| Suscripciones | `Cuenta de Cargo` | Cuentas | `Suscripciones domiciliadas` |

---

## ⚠️ Limitaciones reales de la API de Notion (verificadas construyendo)

Descubiertas al montar este sistema. Son restricciones del validador de la API, **no** de Notion:
todo lo de la columna «Alternativa» funciona igual de bien, y lo que hay que hacer a mano se hace
en la interfaz sin problema.

| Lo que la API rechaza | Error devuelto | Alternativa usada |
|---|---|---|
| `empty()` sobre una propiedad de **relación** | `Type error with formula` | `prop("Relación").length() == 0` |
| Acceso a propiedades a través de una relación: `current.prop("X")` o `.first().prop("X")` | `Type error with formula` | **Rollup** con función `show_original`, y si hace falta agrupar, una fórmula que lo envuelva: `format(prop("MiRollup"))` |
| Literal de lista con `.filter()` dentro de `lets` | `Type error with formula` | Concatenar cadenas condicionales y comprobar si el resultado está vacío |
| Varias `ADD COLUMN` donde una fórmula referencia a otra creada **en el mismo lote** | `Type error with formula` | Separar en llamadas sucesivas: el validador resuelve todo el lote contra el esquema **previo** |
| **Agrupar** un gráfico por una propiedad de tipo rollup | `Group-by property of type "rollup" does not support grouping` | Fórmula intermedia que convierte el rollup a texto |
| Consultas SQL sobre **varias** bases de datos a la vez | Requiere plan Business | Consultas de una sola tabla |
| Leer el **valor calculado** de una fórmula o rollup | Devuelve `formulaResult://…` opaco | No hay: se verifica el dato de origen por SQL y el cableado por el esquema |

### Lo que la API no puede crear en absoluto

| Elemento | Por qué | Cómo se hace |
|---|---|---|
| **Bloques de tipo Botón** | No expuestos por la API | A mano: `/botón` (~10 min los 7) |
| **Automatizaciones de base de datos** | No expuestas por la API | A mano con el icono ⚡ (requiere plan Plus) |
| **Layout de columnas** | Las vistas enlazadas se añaden al final de la página | Arrastrando los bloques (~5 min) |

### Lo que sí funcionó sin problema

- `CREATE TABLE` con `SELECT('opt':color)`, `NUMBER FORMAT 'euro'`, `FORMULA('…')`, `RELATION(ds, DUAL 'nombre')`, `ROLLUP('rel','prop','sum')`.
- Nombres de propiedad con acentos, espacios, `€`, `%` y `Σ`.
- `style(texto, "b" | "c" | "green" | "red")`, `repeat()`, `padStart()`, `lets()`, `dateBetween()`, `formatDate()`, emojis dentro de las fórmulas.
- **Rollup de una fórmula que a su vez contiene rollups** — el movimiento clave de toda la arquitectura (`R. Liquidez` → `Saldo Actual` → `Σ Ingresos`).
- Sincronización bilateral automática de relaciones: al enlazar desde la BD hija, la inversa se rellena sola.
- Vistas enlazadas de tipo `gallery` y `chart` (línea y rosquilla) con filtros, agrupación y propiedades visibles.

---

## Estado de la instancia construida

| Elemento | Estado |
|---|---|
| 8 bases de datos | ✅ Creadas |
| 12 relaciones bilaterales | ✅ Creadas |
| 15 rollups | ✅ Creados |
| 38 fórmulas | ✅ Creadas |
| Datos semilla (23 transacciones, 4 cuentas, 2 deudas, 3 inversiones, 5 suscripciones, 8 meses, 5 presupuestos) | ✅ Cargados y cuadrados |
| 5 vistas del panel (2 galerías, 1 línea, 2 anillos) | ✅ Creadas y configuradas |
| 7 botones rápidos | ⛔ Manual (la API no los soporta) |
| Layout de 3 columnas | ⛔ Manual (arrastrar) |
| Automatización de auto-vinculación | ⛔ Manual y opcional (requiere plan Plus) |

### Verificación por SQL del dato semilla

```
Tipo             n    total
Ingreso          3     3100   ✅
Gasto           10     1626   ✅
Inversión        3     1800   ✅
Traslado         1      800   ✅
Pago de Deuda    1      180   ✅
Suscripción      5      121   ✅
```

Desglose por cuenta (ingresos / salidas / traslados enviados), con `Saldo Inicial` de Banco = 2101:

| Cuenta | Inicial | + Ingresos | − Salidas | − Enviado | + Recibido | = Saldo |
|---|---|---|---|---|---|---|
| Efectivo | 0 | 150 | 561 | 0 | 0 | **−411** |
| Tarjeta electrónica | 0 | 0 | 251 | 0 | 800 | **549** |
| Otros | 0 | 0 | 113 | 0 | 0 | **−113** |
| Banco | 2101 | 2950 | 2802 | 800 | 0 | **1449** |
| | | | | | **Liquidez** | **1474** |

> Los valores calculados de fórmulas y rollups **no son legibles por la API** (devuelve identificadores
> opacos). Lo verificado aquí es el dato de origen por SQL y el cableado de cada rollup por su esquema
> (`targetPropertyUrl` de cada uno apunta a la fórmula correcta). El resultado visible hay que
> comprobarlo abriendo la página en Notion.
