---
version: "1.0.1"
generated_at: "2026-11-23T08:47:16.803Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "23089877e9ba8730771344a1920302279dddec489ca5eb96a890a20767e0b5e9"
produced_from:
  - "docs/requirements.md"
---
# Testing Strategy

Level: 3 (Application)
Scope: Governance
Category: Testing & Quality
Purpose: Define una estrategia inicial para validar las reglas, contratos e integraciones de gestión de usuarios y salas. Distingue los niveles de prueba solicitados de las herramientas y umbrales aún no acordados.

## Enfoque

La documentación valora pruebas unitarias, de integración y de aceptación. No prescribe TDD, cobertura mínima ni pipeline de CI; no se consideran decisiones tomadas.

## Niveles de prueba

| Nivel | Alcance | Herramientas conocidas | Objetivo |
|---|---|---|---|
| Unitaria | Validaciones, unicidad y selección de notificación | Java; framework de pruebas no fijado | Cubrir cada regla y sus casos límite |
| Integración | API, persistencia PostgreSQL y adaptadores externos | Maven; Docker | Verificar contratos acordados y colaboración con dependencias controladas |
| Aceptación | Flujos completos de alta y consulta | Herramienta no especificada | Verificar resultados HTTP, efectos y notificación observable |

El POM actual incluye `spring-boot-starter-test`; los requisitos no fijan versiones ni el uso concreto de librerías incluidas.

## Matriz funcional mínima

| Área | Casos que deben cubrirse |
|---|---|
| Alta válida | HTTP 201, ID devuelto, datos persistidos |
| Nombre | Hasta 6 caracteres aceptado; más de 6 rechazado |
| Email | Presencia de `@` y punto; duplicado rechazado |
| Rol y notificación | `admin` → email; `superadmin` → SMS; rol distinto → rechazado |
| DNI | Se solicita su validación a la API externa; criterios de respuesta concretos pendientes de contrato |
| Sala | Alta asociada a sala 1; usuario no asignado a más de una sala |
| Consulta | Recuperación de un usuario existente por ID en sala 1; inexistencia pendiente de contrato |
| Fallos de dependencias | Comportamiento ante indisponibilidad o error de persistencia/notificación, pendiente de decisión |

## Aislamiento y datos

- Las pruebas unitarias no deben realizar conexiones HTTP ni de base de datos.
- Las pruebas de integración deben utilizar dependencias controladas; no enviar notificaciones reales.
- Preferir valores de prueba reproducibles y evitar dependencia del orden de ejecución.
- No hay ubicación ni convención de nombres de fixtures establecida; seguir la estructura Maven existente al implementarlas.

## Convenciones y calidad

- Nombrar pruebas con el comportamiento esperado, por ejemplo `shouldRejectDuplicateEmail`.
- Verificar estados y cuerpos HTTP, no solo el estado interno de los objetos.
- Comprobar que un DNI inválido no finaliza en alta exitosa.
- Para cada error, comprobar el rechazo y la respuesta exacta que se haya acordado. La prueba no debe conformarse con comprobar una llamada lateral.
- No se ha definido un umbral de cobertura ni un mecanismo de activación de perfil de pruebas; acordarlos antes de imponerlos como puertas de integración.

## Herramientas conocidas y pendientes

| Función | Situación |
|---|---|
| Build/test runner | Maven |
| Framework | Spring; versión y estrategia de pruebas no especificadas en requisitos |
| Servicios externos | API de validación de DNI y notificaciones; contrato técnico pendiente |
| Base de datos | PostgreSQL en puerto 5432 |
| Pruebas de aceptación | Solicitadas como nivel de calidad; herramienta pendiente |
| Cobertura/CI | Umbrales y ejecución automática no documentados |

## 📎 Sources

- `docs/requirements.md` — pruebas unitarias, de integración y de aceptación; reglas de negocio a probar.
