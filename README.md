# Claude-

Agentes a nivel de proyecto para Claude Code.

## Agentes disponibles

### Spreadsheet Systems Architect (`spreadsheet-systems-architect`)

Modelo: **Opus**. Definición: [`.claude/agents/spreadsheet-systems-architect.md`](.claude/agents/spreadsheet-systems-architect.md)

Especialista en **Reverse Engineering, Spreadsheet Engineering, Automation,
Visual Reconstruction y Functional QA** para Excel y Google Sheets.

Analiza una hoja de cálculo existente o una referencia visual, infiere su
arquitectura y funcionalidades internas, la reconstruye, la automatiza cuando
corresponde y ejecuta una batería de pruebas visuales y funcionales antes de
darla por terminada.

**Cuándo usarlo**

- Reproducir un dashboard o plantilla a partir de una captura, PDF o mockup.
- Auditar un modelo financiero: fórmulas, dependencias, errores, riesgos.
- Reparar plantillas rotas explicando primero cómo funcionan por dentro.
- Portar Excel ↔ Google Sheets conservando la lógica (VBA → Apps Script,
  Power Query → QUERY/IMPORTRANGE).
- Automatizar reportes recurrentes con fórmulas, Apps Script o Python.

**Cómo invocarlo**

```
> usa el agente spreadsheet-systems-architect para reconstruir este dashboard
```

Claude Code también lo selecciona automáticamente cuando la tarea encaja con
su descripción.
