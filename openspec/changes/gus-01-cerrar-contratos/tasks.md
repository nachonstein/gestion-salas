# Tasks

## 1. Registrar las decisiones confirmadas

- [x] 1.1 Documentar las decisiones aprobadas y los aspectos fuera de alcance en `docs/decisions/GUS-01-contract-decisions.md`; verificar que cada uno tenga estado inequívoco.
- [x] 1.2 Actualizar `docs/tasks/GUS-01-cerrar-contratos.md` y los artefactos OpenSpec con las decisiones aprobadas; verificar que el alcance de los reintentos externos quede explícito.

## 2. Registrar los contratos acordados

- [x] 2.1 Registrar el contrato exacto de éxito y error de `GET /usuarios/{id}`; verificar los campos JSON de HTTP 200 y el cuerpo exacto de HTTP 404 en el registro y la especificación.
- [x] 2.2 Registrar desde `docs/mock-server-api.md` el endpoint, método, payload y respuestas documentadas de la API DNI; verificar `PATCH /check-dni`, HTTP 200 y rechazo HTTP 409 para `99999999w`.
- [x] 2.3 Registrar que DNI no requiere autenticación, el timeout de 5 s y la respuesta HTTP 503 exacta ante fallo/indisponibilidad; verificar que no hay persistencia ni notificación en ese escenario.
- [x] 2.4 Registrar desde `docs/mock-server-api.md` los endpoints, métodos, payloads y respuestas satisfactorias de email/SMS; verificar ambos `POST` y los HTTP 200 documentados.
- [x] 2.5 Registrar que email/SMS no requieren autenticación, timeout de 5 s, fallo observable, HTTP 201 y ausencia de reintento en la aplicación; verificar que límites/plazos del proveedor quedan fuera de alcance.

## 3. Cerrar GUS-01

- [x] 3.1 Actualizar la especificación, el diseño y los documentos de tareas con todas las decisiones aprobadas; ejecutar `openspec validate gus-01-cerrar-contratos --strict` y comprobar que no quedan preguntas bloqueantes sin responsable.

## Workflow follow-up

- Archivar el cambio OpenSpec una vez que GUS-01 esté cerrado y las decisiones pendientes hayan sido aprobadas.
