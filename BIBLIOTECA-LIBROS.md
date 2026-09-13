# 📚 Biblioteca Digital · Plantillas de libro automáticas

Diagnóstico y arreglo del problema: **al añadir un libro nuevo no aparecían los desplegables
`Citas`, `Notas` y `Resumen`, ni el botón `+ Añadir anotación`, ni el recuadro de portada.**

Fecha del diagnóstico: 2026-09-13. Workspace: Randy - Segundo Cerebro.

---

## 🔑 Las tres bases de datos implicadas

Las dos que fallaban se llaman **ambas** `Libros` (el nombre `Libros por comprar` que ves en la
cabecera de la app pertenece a otra base de datos distinta, la de Stephen King).

| Dónde vive | Nombre real de la BD | Database ID | Data source ID |
|---|---|---|---|
| Página **Apuntes libro** | `Libros` | `e29bcf9f-3ec3-83ce-ad9c-01621b48fe43` | `c53bcf9f-3ec3-8311-8899-07ae920d23ca` |
| Página **Biografías** | `Libros` | `7f1bcf9f-3ec3-83d2-b896-01a6b7a554e3` | `fc5bcf9f-3ec3-8297-b179-8738210e778d` |
| **Modelo que sí funciona** (Stephen King) | `Libros por comprar` | `c93bcf9f-3ec3-8264-9148-017fc2034777` | `046bcf9f-3ec3-8283-99e9-070a3ca7a3a6` |

### Plantillas de cada base de datos

| BD | Plantilla | Page ID |
|---|---|---|
| Apuntes libro · Libros | `Nuevo libro` | `d81bcf9f-3ec3-83cc-af16-81484678580c` |
| Apuntes libro · Libros | `Recomendación AI` | `108bcf9f-3ec3-83fd-a284-010eb6ae430c` |
| Biografías · Libros | `Nuevo libro` | `621bcf9f-3ec3-8277-a035-815b7cf77d23` |
| Biografías · Libros | `Recomendación AI` | `875bcf9f-3ec3-8313-8b47-01b1a8027d7b` |
| **Modelo** · Libros por comprar | `Nuevo libro` ← *la buena* | `f8bbcf9f-3ec3-8357-89c7-01772d2eeb6d` |

---

## 🔍 Diagnóstico: por qué salía la página en blanco

**Las plantillas nunca estuvieron rotas.** Las cuatro ya contenían los tres desplegables:

```
## Citas {toggle="true"}
	<database … />           ← vista de la BD de citas
## Notas {toggle="true"}
	<callout icon="drafts">  ← el bloque de la hamburguesa y el lápiz
	*Pág. X*
## Resumen del libro {toggle="true"}
```

El problema es que **ninguna de las dos bases de datos tenía marcada una plantilla como
predeterminada**, así que al pulsar `+` Notion creaba una página vacía en lugar de aplicar
`Nuevo libro`.

Se ve comparando lo que devuelve la API. La BD modelo, que sí funciona:

```json
"default_page_template": "https://app.notion.com/p/f8bbcf9f3ec3835789c701772d2eeb6d"
<template id="f8bbcf9f-…" name="Nuevo libro" default="true"/>
```

Las dos BD que fallaban:

```json
<template id="d81bcf9f-…" name="Nuevo libro"/>            ← sin default="true"
<template id="108bcf9f-…" name="Recomendación AI"/>       ← sin default="true"
```

No hay campo `default_page_template`. Esa es la causa raíz, y explica las tres quejas a la vez:
sin plantilla aplicada no hay desplegables, no hay botón y no hay portada.

---

## ✅ Lo que ya quedó arreglado por API

### Recuadro de portada en todos los libros nuevos

La propiedad `Portada` es de tipo **archivo** en las tres bases de datos, igual en todas. La
diferencia visual que no gustaba **no es de configuración, es de contenido**:

- `Portada` **vacía** → Notion la dibuja como una fila más de propiedades: `📎 Portada · Vacío`.
- `Portada` **con una imagen** → Notion la saca de la lista y la dibuja abajo, como galería con
  miniatura y la casilla `+` al lado. Es exactamente lo que se ve en *El resplandor*.

Por eso se ha cargado una **imagen marcador de posición** (`portada-placeholder.svg`, proporción
2:3 de portada, fondo oscuro) en la propiedad `Portada` de **las cuatro plantillas**. Así cada
libro nuevo nace ya con el recuadro de galería y su `+`, y al pulsarlo sale el diálogo
`Archivo / Enlace` de siempre.

Para poner la portada real de un libro: pulsa el `+` de la galería → `Archivo` o `Enlace` → y
borra el marcador con `···` → `Eliminar`. Si prefieres no tener marcador, basta con borrarlo de la
plantilla y volverás al comportamiento anterior (`📎 Portada · Vacío`).

---

## ✋ Los dos pasos que hay que dar a mano (una sola vez)

La API de Notion **no expone** ninguna de estas dos cosas. Verificado, no es una suposición:

| Lo que hace falta | Intento por API | Resultado |
|---|---|---|
| Marcar una plantilla como predeterminada | `update-view` con `DEFAULT TEMPLATE "…"` | `400 validation_error: Expected directive keyword, got "DEFAULT"` |
| Crear un bloque de tipo **Botón** | No existe en la especificación de Markdown de Notion | Al leerlo devuelve `<unknown alt="button"/>`, solo lectura |

Las dos se hacen en menos de dos minutos y, una vez hechas, **quedan para siempre**: se aplican
solas a cada libro nuevo, que es justo el objetivo.

### Paso 1 — Marcar `Nuevo libro` como plantilla predeterminada

Repetir en **las dos** bases de datos (`Apuntes libro` y `Biografías`).

1. Abre la base de datos `Libros`.
2. Pulsa la **flecha `⌄` azul** que hay al lado del botón `+` / `Nueva página`. Se despliega la
   lista de plantillas (`Nuevo libro`, `Recomendación AI`).
3. Pulsa el `···` de **`Nuevo libro`**.
4. Elige **`Establecer como predeterminada`** (*Set as default*).
5. Cuando pregunte el alcance, elige **`Todas las vistas`** (*All views*).

A partir de ahí, `+` crea el libro con los tres desplegables ya puestos.

### Paso 2 — Meter el botón `+ Añadir anotación` dentro de la plantilla

El botón hay que ponerlo **dentro de la plantilla `Nuevo libro`**, no en un libro suelto. Puesto
ahí, aparece solo en todos los libros que crees después.

**Opción A — copiarlo del que ya funciona (recomendado, conserva la configuración exacta).**
Mejor desde el ordenador o desde `notion.so` en el navegador:

1. Abre la plantilla buena: <https://app.notion.com/p/f8bbcf9f3ec3835789c701772d2eeb6d>
   (es `Nuevo libro` de la BD `Libros por comprar` de Stephen King).
2. Despliega `Notas`, pon el cursor sobre el botón `+ Añadir anotación` y pulsa su asa `⠿`
   (los seis puntos) para seleccionarlo. `Ctrl/Cmd + C`.
3. Abre la plantilla destino (`···` de la BD → `Nuevo libro` → `Editar plantilla`), despliega
   `Notas`, coloca el cursor **justo debajo de `Pág. X`** y pega con `Ctrl/Cmd + V`.
4. Repite en la otra base de datos.

**Opción B — rehacerlo a mano.** Dentro del desplegable `Notas` de la plantilla, debajo de
`Pág. X`:

1. Escribe `/botón` y elige **Botón**.
2. Nombre: `Añadir anotación`.
3. Acción: **`Insertar bloques debajo`**.
4. Dentro de esa acción añade dos bloques, en este orden:
   - un **Llamada** (*callout*) con icono 📝 y fondo gris/azul → es el recuadro de escribir;
   - una línea de **texto** con `Pág. X` en cursiva y color gris/azul.
5. Guarda.

> ⚠️ Los libros que **ya existen** no heredan el botón: las plantillas solo afectan a las páginas
> que se crean después. En los libros antiguos, pega el botón igual que en el paso 2.A.

---

## 🧪 Cómo comprobar que quedó bien

1. En `Apuntes libro`, pulsa `+` en la BD `Libros`.
2. El libro nuevo debe salir con:
   - los tres desplegables `Citas`, `Notas`, `Resumen del libro`;
   - dentro de `Notas`, el recuadro de la hamburguesa + lápiz, el `Pág. X` y el botón
     `+ Añadir anotación ⚙️`;
   - abajo del todo, el recuadro de portada con la miniatura y la casilla `+`.
3. Repite en `Biografías`.

---

## ⚠️ Límites de la API de Notion verificados aquí

Se suman a los ya documentados en [IDS-NOTION.md](IDS-NOTION.md).

| Elemento | Por qué | Cómo se hace |
|---|---|---|
| **Plantilla predeterminada** de una BD | Ni `update-data-source` (solo acepta DDL de esquema) ni el DSL de `update-view` tienen directiva para ello | A mano: `⌄` → `···` → `Establecer como predeterminada` |
| **Bloques de tipo Botón** | No están en la especificación de Markdown de Notion; se leen como `<unknown alt="button"/>` | A mano, o copiar y pegar uno existente |
| Subida directa de ficheros a `api.notion.com` | El proxy de salida del entorno la bloquea por política (`403 CONNECT`) | Usar `create-attachment` del MCP, que sube desde el servidor de Notion |

### Lo que sí funcionó

- Leer el esquema completo, las plantillas y su marca `default` de cada data source.
- Escribir una propiedad de tipo **archivo** con un `file_upload` creado por `create-attachment`.
- Subir un SVG generado como texto plano (862 bytes) sin salir a la red desde el contenedor.
