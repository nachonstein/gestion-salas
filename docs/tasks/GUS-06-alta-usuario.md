# GUS-06 — Implementar alta de usuario en sala 1

**Prioridad:** P1  
**Objetivo:** Implementar el caso de uso y endpoint POST que valida, persiste y notifica el alta de un usuario en la sala 1, devolviendo el ID generado.  
**Alcance:** Orquestación de validaciones, persistencia y notificación; controlador del contrato confirmado. Depende de GUS-03, GUS-04 y GUS-05.

## Entradas y salidas

- **Entrada:** JSON completo con `name`, `email`, `phone`, `rol` y `dni`.
- **Salida:** HTTP 201 con `{ "id": "<id>" }` para alta correcta; errores según contrato aprobado en GUS-01.
- **Persistencia:** usuario asociado únicamente a sala 1.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| Entrada no válida localmente | Rechazar antes de crear usuario | Error HTTP/cuerpo acordado; cero usuarios nuevos |
| Email ya existe | Rechazar duplicado | Conflicto conforme al contrato; cero duplicados |
| DNI rechazado | Rechazar alta | No se persiste un usuario |
| Validaciones aprobadas y rol `admin` | Guardar y notificar por email | HTTP 201 con ID; mensaje `usuario guardado` enviado al email |
| Validaciones aprobadas y rol `superadmin` | Guardar y notificar por SMS | HTTP 201 con ID; mensaje `usuario guardado` enviado al teléfono |
| Falla persistencia o notificación | Aplicar política acordada | Resultado explícito conforme a GUS-01; nunca respuesta de éxito falsa |

## Criterios de aceptación

- [x] El endpoint y el formato de errores coinciden exactamente con GUS-01.
- [x] El controlador solo adapta HTTP y delega el caso de uso.
- [x] Se conserva el conjunto completo de campos del request a través de las capas necesarias.
- [x] DNI se valida antes de persistir.
- [x] El usuario se asocia a sala 1 y el ID generado se devuelve en HTTP 201.
- [x] La notificación usa el canal correspondiente y el mensaje exacto.
- [x] Los errores de validación, duplicidad y DNI no producen alta.
- [x] El orden y comportamiento ante fallos de notificación siguen la decisión de GUS-01.

## Especificación de pruebas

- **Unitarias:** probar orquestación de ramas con persistencia y adaptadores externos simulados; verificar orden solo según el contrato aprobado.
- **Integración:** probar endpoint, persistencia y adaptadores externos contra dependencias controladas.
- **Aceptación:** alta válida para ambos roles, errores de validación, duplicidad y DNI rechazado; verificar status, cuerpo, persistencia y notificación.
- **Cobertura:** una prueba por rama; sin umbral porcentual predefinido.

## Preguntas abiertas

- Las decisiones de contrato de GUS-01 están cerradas. La implementación de esta tarea depende de que GUS-03, GUS-04 y GUS-05 estén disponibles.

## Referencias

- `.foundation/project-intent.md`
- `.foundation/domain-landscape.md`
- `.foundation/guardrails.md`
- `.foundation/testing-strategy.md`
- `docs/requirements.md`
