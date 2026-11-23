# GUS-01 — Cerrar contratos y decisiones pendientes

**Prioridad:** P0 — bloquea la implementación de contratos e integraciones  
**Objetivo:** Obtener decisiones explícitas para los aspectos que los documentos fundacionales identifican como no especificados.  
**Alcance:** Contratos HTTP, errores, comportamiento ante dependencias fallidas y datos mínimos de persistencia. No implementar funcionalidad.

**Estado actual:** Cerrada en su alcance documental. Las decisiones aprobadas, contratos y límites explícitos están registrados en [GUS-01-contract-decisions.md](../decisions/GUS-01-contract-decisions.md). No implementa endpoints ni integraciones.

## Entradas y salidas

- **Entrada:** requisitos funcionales y documentos fundacionales.
- **Salida:** decisiones aprobadas y actualizaciones de los contratos/documentos de diseño pertinentes.
- **Persistencia:** ninguna.

## Decisiones que hay que registrar

1. Ruta, esquema de entrada y códigos/cuerpos de respuesta del POST; ruta, respuesta y caso de ID inexistente para GET.
2. Correspondencia entre cada error y el mensaje de error: nombre demasiado largo/vacío (`userName`), email inválido/duplicado (`email`), rol no permitido (`rol`) y DNI rechazado (`dni`).
3. Alcance exacto de las comprobaciones: nombre vacío/espacios, límite inclusivo, normalización de nombre/email, mayúsculas/minúsculas del rol y tratamiento del DNI según el contrato aprobado. No añadir reglas no aprobadas.
4. Contrato técnico de la API externa de DNI y de los canales de notificación: rutas, métodos y payloads según `docs/mock-server-api.md`; autenticación, timeout y comportamiento de error quedan fijados en el registro de decisiones.
5. Resultado observable si falla el envío de notificación y orden entre persistencia y notificación.
6. Tipo/estrategia de ID del usuario; aprovisionamiento de sala 1 y comportamiento si no existe.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| Todas las decisiones quedan aprobadas | Documentar contratos y actualizar referencias | No quedan marcadas como bloqueantes |
| Alguna decisión sigue sin resolver | Mantenerla abierta con responsable y motivo | Las tareas afectadas permanecen bloqueadas y no inventan comportamiento |

## Criterios de aceptación

- [x] Cada uno de los seis puntos anteriores tiene una decisión registrada o una pregunta abierta con responsable.
- [x] POST y GET tienen contratos suficientes para pruebas de aceptación.
- [x] Los errores de validación tienen una correspondencia inequívoca entre condición, estado HTTP y cuerpo.
- [x] Las integraciones tienen contratos verificables, incluyendo el comportamiento ante errores.
- [x] Se mantiene trazabilidad con `docs/requirements.md`, los documentos fundacionales y `docs/mock-server-api.md`.

## Especificación de pruebas

- **Unitarias:** no aplican; esta tarea produce decisiones/documentación.
- **Integración:** no aplica.
- **Aceptación:** revisar que las decisiones cubren todos los puntos y que ninguna respuesta o ruta se haya dado por aprobada sin confirmación.
- **Cobertura:** no aplica.

## Preguntas abiertas

- No quedan decisiones abiertas dentro del alcance documental de GUS-01. Los límites y plazos de reintento del proveedor se dejan explícitamente fuera de alcance; la aplicación no reintenta notificaciones.

## Referencias

- `.foundation/guardrails.md` — decisiones pendientes y contratos no especificados.
- `.foundation/architecture-decisions.md` — decisiones de arquitectura pendientes.
- `.foundation/testing-strategy.md` — comportamiento externo y GET pendientes.
- `docs/requirements.md`
- `docs/mock-server-api.md` — endpoints y formatos del mock-server, fuente añadida expresamente para esta actualización.
- `docs/decisions/GUS-01-contract-decisions.md` — decisiones aprobadas y preguntas abiertas.
