# Registro de decisiones — GUS-01

**Estado:** Decisiones documentadas; GUS-01 cerrada en su alcance documental.  
**Base normativa:** `docs/requirements.md`.  
**Aprobaciones:** aclaraciones del usuario durante la ejecución de GUS-01, 2026-11-23.  
**Contrato de mock aprobado:** `docs/mock-server-api.md`, aportado explícitamente para actualizar GUS-01.  
**Fuente excluida:** `docs/README.md` y su contenido previo siguen sin usarse.

## Decisiones aprobadas

| Área | Decisión |
|---|---|
| Rutas | Alta: `POST /usuarios`. Consulta: `GET /usuarios/{id}`, limitada a la sala 1. |
| Alta correcta | HTTP 201 con `{ "id": "<id>" }`. |
| Errores de validación | HTTP 409 con `{ "code": 409, "message": "error validation <campo>" }`. Nombre: `userName`; email inválido/duplicado: `email`; rol no permitido: `rol`; DNI rechazado: `dni`. |
| Entrada | Recortar espacios extremos antes de validar y guardar. `name`, `email`, `rol` y `dni` son obligatorios tras el recorte; `phone` puede estar vacío. |
| Nombre | Guardar en minúsculas; máximo de 6 caracteres después del recorte. Se mantiene el límite de `docs/requirements.md`; no se aprueba ampliarlo a 30. |
| Email | Guardar en minúsculas; debe contener `@` y `.`; la detección de duplicados no distingue mayúsculas. |
| Rol | Aceptar solo `admin` o `superadmin` exactamente en minúsculas. |
| API de DNI | `PATCH http://localhost:1080/check-dni`, JSON `{ "dni": "<dni>" }`. Responde HTTP 200 para cualquier DNI salvo `99999999w`, que responde HTTP 409. Un DNI rechazado produce el error de alta `error validation dni`. |
| Notificación por email | `POST http://localhost:1080/email`, JSON `{ "email": "<email>", "message": "<msg>" }`; respuesta satisfactoria HTTP 200. Para `admin`, `<msg>` es `usuario guardado`. |
| Notificación por SMS | `POST http://localhost:1080/sms`, JSON `{ "phone": "<phone>", "message": "<msg>" }`; respuesta satisfactoria HTTP 200. Para `superadmin`, `<msg>` es `usuario guardado`. |
| Autenticación y timeout externos | DNI, email y SMS no requieren autenticación. Timeout máximo de 5 segundos por llamada externa. |
| Fallo de DNI | Si la llamada DNI devuelve un error distinto de HTTP 200/409, agota el timeout o no está disponible, responder HTTP 503 con `{ "code": 503, "message": "error de dependencia" }`; no persistir ni notificar. |
| Orden y fallo de notificación | Persistir primero. Si email/SMS responde distinto de HTTP 200 o agota el timeout, mantener HTTP 201 y registrar el fallo sin datos personales; no reintentar desde la aplicación. Los reintentos corresponden al proveedor, sin fijar límites ni plazos en el alcance de GUS-01. |
| Identidad y sala | ID de usuario incremental de tipo `long`. Crear la sala 1 al arrancar; si no se puede aprovisionar, fallar el arranque. |

## Alcance del contrato de consulta GET

`GET /usuarios/{id}` devuelve HTTP 200 y `{ "id": <id>, "name": "...", "email": "...", "phone": "...", "rol": "...", "dni": "..." }`. Si no existe un usuario con ese ID en la sala 1, devuelve HTTP 404 y `{ "code": 404, "message": "user not found" }`.

## Alcance y límites del contrato externo

`docs/mock-server-api.md` documenta los endpoints y las respuestas satisfactorias indicadas arriba, pero no define autenticación, timeouts, reintentos ni respuestas de error para email/SMS. Las políticas complementarias constan como decisiones aprobadas separadas; no asumir que una respuesta HTTP 200 garantiza la entrega final ni que el mock implemente los reintentos del proveedor.

Las decisiones complementarias del usuario cubren autenticación, timeouts y el comportamiento observable ante fallos. Los límites y plazos internos del reintento del proveedor quedan expresamente fuera de alcance; la aplicación no implementa reintentos.
