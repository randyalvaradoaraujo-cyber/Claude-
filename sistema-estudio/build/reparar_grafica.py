#!/usr/bin/env python3
"""Reparación dirigida del libro ATENEO.

Dos defectos encontrados al auditar el libro construido:

1. La gráfica llevaba dos series (tasa de éxito y media móvil) y omitía
   «Sesiones completadas (acumulado)», que la especificación exige como
   segunda serie en eje secundario. Se reconstruye con las tres series y su
   acabado: verde gruesa la protagonista, azul en eje secundario el acumulado,
   gris discontinua la tendencia.

2. Las dos cabeceras vacías del bloque «Semanas 25 a 30» llevaban un guion y un
   guion largo (`-` y `–`). Excel exige cabeceras únicas y no vacías en una
   tabla nativa, así que no pueden quedar en blanco de verdad, pero dos
   caracteres distintos se ven distintos. Se sustituyen por espacios duros, que
   satisfacen la unicidad y se renderizan en blanco como en la captura.
"""
import openpyxl
from openpyxl.chart import LineChart, Reference
from openpyxl.chart.axis import ChartLines
from openpyxl.drawing.line import LineProperties

import sys
LIBRO = sys.argv[1] if len(sys.argv) > 1 else "Ejemplo Planificador Oposición.xlsx"

VERDE_EXITO = "38761D"   # serie protagonista
AZUL        = "1C4587"   # acumulado, eje secundario
GRIS        = "9AA0A6"   # tendencia
FILA_INI, FILA_FIN = 2, 35   # 34 semanas


def serie(chart, ws, col, titulo_fila=1):
    ref = Reference(ws, min_col=col, min_row=titulo_fila, max_row=FILA_FIN)
    chart.add_data(ref, titles_from_data=True)
    return chart.series[-1]


def construir_grafica(ws):
    # Eje primario: tasa de éxito semanal y su tendencia. Ambas son porcentajes,
    # así que comparten escala; el acumulado es un recuento y necesita la suya.
    principal = LineChart()
    principal.title = "📈 Curva de dominio — retención por semana"
    principal.style = 2
    principal.y_axis.title = "Tasa de éxito"
    principal.x_axis.title = "Semana"
    principal.y_axis.numFmt = "0%"
    principal.y_axis.majorGridlines = ChartLines()

    tasa = serie(principal, ws, 47)        # AU — Tasa de éxito
    tendencia = serie(principal, ws, 50)   # AX — Media móvil 3

    tasa.smooth = True
    tasa.graphicalProperties.line = LineProperties(solidFill=VERDE_EXITO, w=28000)

    tendencia.smooth = True
    tendencia.graphicalProperties.line = LineProperties(
        solidFill=GRIS, w=12700, prstDash="dash")

    # Eje secundario: sesiones completadas acumuladas.
    secundario = LineChart()
    acumulado = serie(secundario, ws, 49)  # AW — Acumulado
    acumulado.smooth = True
    acumulado.graphicalProperties.line = LineProperties(solidFill=AZUL, w=19050)
    secundario.y_axis.axId = 200
    secundario.y_axis.title = "Sesiones acumuladas"
    principal.y_axis.crosses = "max"
    principal += secundario

    principal.legend.position = "b"
    principal.legend.overlay = False
    principal.height, principal.width = 9.5, 24
    return principal


def main():
    wb = openpyxl.load_workbook(LIBRO)
    ws = wb["Progreso"]

    antes = [(len(c.series)) for c in ws._charts]
    ws._charts.clear()
    grafica = construir_grafica(ws)
    ws.add_chart(grafica, "A46")

    est = wb["Estrategia"]
    tabla = est.tables.get("Semanas_25_a_30")
    est["H25"], est["I25"] = " ", "  "
    if tabla is not None:
        for col in tabla.tableColumns:
            if col.name in ("-", "–"):
                col.name = " " if col.name == "-" else "  "

    wb.save(LIBRO)
    print("gráfica: %s series antes -> %d series después"
          % (antes, sum(len(c.series) for c in openpyxl.load_workbook(LIBRO)["Progreso"]._charts)))
    print("cabeceras H25/I25 -> espacios duros (se ven en blanco, siguen siendo únicas)")


if __name__ == "__main__":
    main()
