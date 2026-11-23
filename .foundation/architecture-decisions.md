---
version: "1.0.1"
generated_at: "2026-11-23T08:47:16.780Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "ae80d346a99861a483023f7a379cc1c189797fe191ba8f026d20ff2b977af9da"
produced_from:
  - "docs/requirements.md"
---
# Architecture Decisions

Level: 3 (Application)
Scope: Governance
Category: Architecture Decisions
Purpose: Registra las restricciones de plataforma y persistencia que se desprenden de los requisitos de la aplicación, separándolas de decisiones de diseño que todavía requieren confirmación.

Los requisitos proporcionan restricciones, pero no documentan comparaciones entre alternativas ni racionales de diseño detallados. Este registro no presenta preferencias no confirmadas como decisiones aceptadas.

## Índice

| ADR | Título | Estado |
|---|---|---|
| ADR-001 | Uso de la base de datos PostgreSQL existente | Aceptada como restricción |
| ADR-002 | Plataforma Java 17 y Maven | Aceptada como prerrequisito |

## ADR-001 — Uso de la base de datos PostgreSQL existente

**Estado:** Aceptada como restricción del proyecto  
**Fecha:** 2026-11-23

### Contexto

La documentación indica que la base de datos ya existe y debe utilizarse; identifica PostgreSQL, el puerto 5432 y la base `users`.

### Decisión

La aplicación utilizará la instancia PostgreSQL existente y persistirá los datos requeridos en la base `users`.

### Consecuencias

**Positivas:**
- Se integra con la infraestructura prevista por los requisitos.

**Negativas / compromisos:**
- La configuración, credenciales seguras y disponibilidad de la instancia deben resolverse por entorno.
- El esquema, las migraciones y las restricciones físicas de unicidad no están especificados.

### Alternativas consideradas

No documentadas en las fuentes.

## ADR-002 — Plataforma Java 17 y Maven

**Estado:** Aceptada como prerrequisito  
**Fecha:** 2026-11-23

### Contexto

Java 17 y Maven aparecen como componentes necesarios para ejecutar el proyecto.

### Decisión

Desarrollar y construir la aplicación con Java 17 y Maven. Spring es una tecnología valorada por el documento, pero su versión y configuración no quedan fijadas por esta decisión.

### Consecuencias

**Positivas:**
- Alineación con el entorno de ejecución esperado.

**Negativas / compromisos:**
- Las versiones concretas de Spring y de las dependencias deben acordarse y gestionarse en el build.

### Alternativas consideradas

No documentadas en las fuentes.

## Decisiones pendientes

- Rutas y formato de la operación GET.
- Estrategia transaccional y orden entre persistencia y notificación.
- Esquema de tablas, estrategia de migración y representación de la asociación usuario-sala.
- Versión de Spring y librerías para persistencia, validación y cliente HTTP.

## ADR Template

```markdown
## ADR-XXX — <Título>

**Estado:** Propuesta | Aceptada | Sustituida por ADR-XXX
**Fecha:** YYYY-MM-DD

### Contexto
<Situación y restricciones>

### Decisión
<Decisión adoptada y motivo>

### Consecuencias
**Positivas:** <beneficios>
**Negativas / compromisos:** <costes o riesgos>

### Alternativas consideradas
| Alternativa | Motivo de descarte |
|---|---|
```

## 📎 Sources

- `docs/requirements.md` — PostgreSQL y prerrequisitos Java/Maven.
