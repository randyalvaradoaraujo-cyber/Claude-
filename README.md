# 💵 Gerente de Finanzas — Plantilla avanzada de Notion

Manual de construcción completo para replicar (y superar) la plantilla **Gerente de Finanzas**:
un sistema de finanzas personales en Notion con **8 bases de datos relacionadas**, un **motor de
rollups** que recalcula el patrimonio neto en tiempo real, **7 botones de alta rápida** y un
**dashboard en modo oscuro** con Notion Charts nativos.

---

## 📁 Contenido del repositorio

| Archivo | Qué contiene |
|---|---|
| **[MANUAL.md](MANUAL.md)** | El manual de construcción paso a paso (FASE 0 → FASE 5). Es el documento principal. |
| **[ESQUEMA.md](ESQUEMA.md)** | Tabla de referencia rápida: todas las propiedades de las 8 BD, con tipo exacto y configuración. |
| **[FORMULAS.md](FORMULAS.md)** | Anexo con las 41 fórmulas de Notion 2.0 listas para copiar y pegar. |
| **[DATOS-DE-PRUEBA.md](DATOS-DE-PRUEBA.md)** | Juego de datos semilla que reproduce exactamente los números del diseño original + checklist de verificación. |
| **[IDS-NOTION.md](IDS-NOTION.md)** | Mapa de IDs de la instancia ya construida en Notion + limitaciones reales de la API de Notion verificadas durante el montaje. |

---

## 🧠 Los 5 principios de arquitectura del sistema

Estos cinco principios explican **por qué** el sistema se construye así. Si los entiendes, puedes
extender la plantilla sin romperla.

1. **Los rollups de Notion NO se pueden filtrar.** Por eso cada importe se "pre-filtra" en la base
   de datos hija con una fórmula que devuelve la cantidad si el tipo coincide y `0` si no
   (`Monto Ingreso`, `Monto Gasto`, `Salida de Caja`…). El rollup solo tiene que hacer `Suma`.
   Este es el patrón central de toda la plantilla.
2. **No se puede hacer un rollup de un rollup, pero sí de una fórmula que contenga un rollup.**
   Por eso `Saldo Actual` (Cuentas) es una fórmula y no un rollup: así el Master Financiero puede
   sumarlo.
3. **Las cantidades siempre se guardan en positivo.** El signo lo decide el `Tipo`, nunca el
   usuario. Esto elimina la clase de error más común en las plantillas de finanzas.
4. **Gasto contable ≠ salida de caja.** `Su gasto total` solo cuenta el tipo `Gasto`, pero el saldo
   de la cuenta resta además inversiones, pagos de deuda y suscripciones. Se usan dos fórmulas
   distintas (`Monto Gasto` y `Salida de Caja`) para no contar dos veces.
5. **El Master Financiero se llena solo.** Una automatización de base de datos vincula cada página
   nueva a la única fila del Master. Sin ese paso tendrías que enlazar a mano cada transacción.

---

## 🗺️ Mapa relacional

```
                        ┌───────────────────────────┐
                        │  BD 8 · MASTER FINANCIERO │  (1 sola fila)
                        │  "Informe sobre el         │
                        │   patrimonio neto"         │
                        └────────────┬──────────────┘
             ┌──────────────┬────────┼─────────┬──────────────┐
             │              │        │         │              │
     ┌───────▼──────┐ ┌─────▼────┐ ┌─▼──────┐ ┌▼───────────┐ ┌▼──────────────┐
     │ BD 1 CUENTAS │ │ BD 4     │ │ BD 5   │ │ BD 6       │ │ BD 2          │
     │ Efectivo     │ │ DEUDAS   │ │ INVER- │ │ SUSCRIP-   │ │ TRANSACCIONES │
     │ Tarjeta      │ │          │ │ SIONES │ │ CIONES     │ │               │
     │ Banco        │ └─────┬────┘ └─┬──────┘ └┬───────────┘ └───┬───────────┘
     │ Otros        │       │        │         │                 │
     └───────┬──────┘       └────────┴─────────┴─────────────────┤
             │                                                    │
             └────────────────────────────────────────────────────┤
                                                                  │
                        ┌───────────────────────────┐             │
                        │ BD 3 · PRESUPUESTOS       │─────────────┤
                        └───────────────────────────┘             │
                        ┌───────────────────────────┐             │
                        │ BD 7 · HISTORIAL MENSUAL  │  (alimenta la gráfica de líneas)
                        └───────────────────────────┘
```

---

## ⏱️ Orden de construcción (no lo cambies)

Notion no deja crear una relación hacia una base de datos que todavía no existe, y no deja crear
una fórmula que referencie un rollup inexistente. Sigue este orden exacto:

1. Crear las 8 bases de datos **vacías**, solo con el título.
2. Añadir las propiedades **base** (número, selección, fecha, texto) de cada BD.
3. Crear todas las **relaciones** (siempre desde la BD hija, activando la sincronización bilateral).
4. Crear las **fórmulas de pre-filtro** en las BD hijas (`Monto …`, `Salida de Caja`).
5. Crear los **rollups** en Cuentas, Presupuestos, Deudas, Inversiones y Master.
6. Crear las **fórmulas de presentación** (`Saldo Actual`, `Current Balance`, tarjetas del Master).
7. Crear las **automatizaciones** (auto-vinculación al Master).
8. Crear los **botones** y montar el **dashboard**.

> ⏳ Tiempo estimado de construcción manual: **2 h 30 min** la primera vez.

---

## ✅ Qué obtienes al terminar

- Saldos de las 4 cuentas que se recalculan solos con cada transacción, incluidos los traslados.
- Un `Informe sobre el patrimonio neto` con 5 métricas en tiempo real.
- Presupuestos con barra de progreso y semáforo de estado.
- Deudas con saldo pendiente, cuota vencida y días de atraso automáticos.
- Suscripciones normalizadas a coste mensual (anual ÷ 12, trimestral ÷ 3).
- Gráfica de líneas de evolución de la inversión + 2 gráficas de anillo por medio de pago.
- 7 botones que crean la transacción con `Tipo`, `Fecha` y vínculos ya rellenados.
