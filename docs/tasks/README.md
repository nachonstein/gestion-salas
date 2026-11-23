# Plan de tareas — Gestión de usuarios y salas

Este plan descompone los documentos fundacionales en trabajo implementable. El estado de cada tarea se refleja en la tabla y en sus criterios de aceptación; la existencia del plan no implica su finalización.

## Orden y dependencias

| ID | Prioridad | Tarea | Depende de | Estado |
|---|---|---|---|---|
| GUS-01 | P0 — Bloqueante | Cerrar contratos y decisiones pendientes | — | Cerrada (documentación y contratos acordados) |
| GUS-02 | P1 | Preparar configuración de aplicación y entornos | — | Cerrada |
| GUS-03 | P1 | Modelar salas y usuarios y persistirlos | GUS-01, GUS-02 | Pendiente |
| GUS-04 | P1 | Implementar validaciones y errores de dominio | GUS-01 | Pendiente |
| GUS-05 | P1 | Integrar validación de DNI y notificaciones | GUS-01, GUS-02 | Pendiente |
| GUS-06 | P1 | Implementar alta de usuario en sala 1 | GUS-03, GUS-04, GUS-05 | Pendiente |
| GUS-07 | P2 | Implementar consulta de usuario por ID | GUS-01, GUS-03 | Pendiente |
| GUS-08 | P1 | Completar pruebas de aceptación y arranque | GUS-06, GUS-07 | Pendiente |

GUS-01 está cerrada documentalmente; los contratos acordados están en [su registro de decisiones](../decisions/GUS-01-contract-decisions.md) y en OpenSpec. GUS-02 puede avanzar de forma independiente. Las tareas GUS-03 a GUS-07 deben incluir sus pruebas unitarias y de integración; GUS-08 cubre los flujos completos y el arranque integrado, no sustituye esas pruebas.

## Criterios transversales

- Mantener Java 17 y Maven; usar PostgreSQL existente. No introducir Kubernetes ni dividir la aplicación en microservicios.
- Mantener la lógica de negocio fuera del controlador y las llamadas a dependencias externas detrás de componentes sustituibles en pruebas.
- No guardar credenciales en el repositorio ni incluirlas en logs.
- Comprobar cada rama funcional y de error; no se definió un umbral porcentual de cobertura.
- Seguir los contratos aprobados en GUS-01; no inferir respuestas externas o plazos de reintento fuera del alcance documentado.

## Referencias

- [Project Intent](../../.foundation/project-intent.md)
- [Domain Landscape](../../.foundation/domain-landscape.md)
- [Guardrails](../../.foundation/guardrails.md)
- [Architecture Decisions](../../.foundation/architecture-decisions.md)
- [Testing Strategy](../../.foundation/testing-strategy.md)
- [Task Specification Template](../../.foundation/task-spec.md)
- [Requisitos fuente](../requirements.md)
