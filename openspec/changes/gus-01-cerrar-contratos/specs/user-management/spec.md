# Spec Delta

## Purpose

Define los contratos aprobados para registrar y consultar usuarios de la sala 1, incluyendo sus validaciones y el resultado observable de las notificaciones.

## ADDED Requirements

### Requirement: Crear usuarios en la sala 1
El sistema SHALL aceptar la creación de usuarios mediante `POST /usuarios`, asociarlos a la sala 1 y responder con el identificador generado.

#### Scenario: Alta correcta
- **WHEN** se envía un usuario válido
- **THEN** el sistema persiste el usuario en la sala 1 y responde HTTP 201 con `{ "id": "<id>" }`

### Requirement: Validar campos obligatorios y nombre
El sistema SHALL recortar los espacios extremos de los campos recibidos, exigir `name`, `email`, `rol` y `dni` no vacíos, y almacenar el nombre en minúsculas con un máximo de 6 caracteres después del recorte. `phone` puede estar vacío.

#### Scenario: Nombre vacío o demasiado largo
- **WHEN** `name` está vacío tras recortar espacios o excede 6 caracteres
- **THEN** el sistema rechaza el alta con HTTP 409 y `message` igual a `error validation userName`

#### Scenario: Falta un campo obligatorio
- **WHEN** `email`, `rol` o `dni` está vacío tras recortar espacios
- **THEN** el sistema rechaza el alta con HTTP 409 y el `message` identifica el campo con `error validation email`, `error validation rol` o `error validation dni`, respectivamente

### Requirement: Validar y normalizar email
El sistema SHALL recortar y almacenar el email en minúsculas, exigir que contenga `@` y `.`, y rechazar duplicados sin distinguir mayúsculas.

#### Scenario: Email inválido o duplicado
- **WHEN** el email no contiene `@` o `.`, o ya existe otro usuario con ese email sin distinguir mayúsculas
- **THEN** el sistema rechaza el alta con HTTP 409 y `message` igual a `error validation email`

### Requirement: Validar rol
El sistema SHALL aceptar únicamente los valores exactos `admin` y `superadmin` para `rol`.

#### Scenario: Rol no permitido
- **WHEN** `rol` no es exactamente `admin` ni `superadmin`
- **THEN** el sistema rechaza el alta con HTTP 409 y `message` igual a `error validation rol`

### Requirement: Validar DNI externamente
El sistema SHALL validar el DNI mediante `PATCH http://localhost:1080/check-dni`, enviando `{ "dni": "<dni>" }`. La respuesta HTTP 200 acepta el DNI; HTTP 409 lo rechaza y el alta responde HTTP 409 con el error de validación `dni`.

#### Scenario: DNI aceptado por el mock-server
- **WHEN** la API responde HTTP 200 a la petición de validación
- **THEN** la validación externa no rechaza el DNI

#### Scenario: DNI rechazado por el mock-server
- **WHEN** la API responde HTTP 409 para el DNI `99999999w`
- **THEN** el sistema rechaza el alta con HTTP 409 y `message` igual a `error validation dni`

### Requirement: Manejar fallos de la dependencia DNI
La llamada al mock DNI no requiere autenticación y SHALL terminar en un máximo de 5 segundos. Ante timeout, indisponibilidad o respuesta distinta de HTTP 200/409, el alta SHALL responder HTTP 503 con `{ "code": 503, "message": "error de dependencia" }`, sin persistir ni notificar.

#### Scenario: Dependencia DNI indisponible o con error
- **WHEN** la llamada de validación agota 5 segundos, no puede conectarse o devuelve un estado distinto de HTTP 200/409
- **THEN** el alta responde HTTP 503 con `{ "code": 503, "message": "error de dependencia" }` y no persiste ni notifica al usuario

### Requirement: Representar errores de validación
El sistema SHALL representar los errores de validación acordados mediante HTTP 409 y un cuerpo JSON con `code` igual a `409` y un `message` del formato `error validation <campo>`.

#### Scenario: Error de validación
- **WHEN** una regla de validación rechaza la solicitud
- **THEN** la respuesta contiene `{ "code": 409, "message": "error validation <campo>" }` con el campo acordado para esa regla

### Requirement: Notificar después de persistir
El sistema SHALL persistir el usuario antes de enviar la notificación correspondiente a su rol, usando el mensaje `usuario guardado`. Las llamadas no requieren autenticación y tienen un timeout máximo de 5 segundos.

#### Scenario: Notificación del administrador
- **WHEN** se crea correctamente un usuario con rol `admin`
- **THEN** el sistema persiste al usuario y envía `POST http://localhost:1080/email` con `{ "email": "<email>", "message": "usuario guardado" }`

#### Scenario: Notificación del superadministrador
- **WHEN** se crea correctamente un usuario con rol `superadmin`
- **THEN** el sistema persiste al usuario y envía `POST http://localhost:1080/sms` con `{ "phone": "<phone>", "message": "usuario guardado" }`

### Requirement: Manejar fallos de notificación
Si el proveedor devuelve un estado distinto de HTTP 200 o la llamada agota 5 segundos, el sistema SHALL conservar HTTP 201, registrar el fallo sin datos personales y no reintentar desde la aplicación. La responsabilidad de reintento queda en el proveedor; sus límites y plazos no forman parte del contrato de la aplicación.

#### Scenario: Fallo de notificación
- **WHEN** la persistencia se completa pero la notificación devuelve un estado distinto de HTTP 200, no está disponible o agota 5 segundos
- **THEN** el alta conserva HTTP 201, registra el fallo sin datos personales y no realiza reintentos desde la aplicación

### Requirement: Interpretar respuesta satisfactoria del mock de notificación
El sistema SHALL considerar HTTP 200 como respuesta satisfactoria del mock de notificación, sin tratarlo como confirmación de entrega final.

#### Scenario: Mock de notificación acepta la petición
- **WHEN** el mock de email o SMS responde HTTP 200
- **THEN** la petición al mock se considera satisfactoria, sin inferir confirmación de entrega final

### Requirement: Consultar un usuario de la sala 1
El sistema SHALL permitir consultar un usuario por identificador mediante `GET /usuarios/{id}`, limitado a usuarios de la sala 1. Para un usuario existente responde HTTP 200 con sus campos `id`, `name`, `email`, `phone`, `rol` y `dni`; si no existe responde HTTP 404 con `{ "code": 404, "message": "user not found" }`.

#### Scenario: Usuario existente
- **WHEN** se consulta el ID de un usuario de la sala 1
- **THEN** el sistema responde HTTP 200 con `{ "id": <id>, "name": "<name>", "email": "<email>", "phone": "<phone>", "rol": "<rol>", "dni": "<dni>" }`

#### Scenario: Usuario inexistente en la sala
- **WHEN** el ID no corresponde a un usuario de la sala 1
- **THEN** el sistema responde HTTP 404 con `{ "code": 404, "message": "user not found" }`

### Requirement: Provisionar la sala 1
El sistema SHALL crear la sala 1 al arrancar y utilizar identificadores incrementales de tipo `long` para los usuarios. Si no puede crear la sala, el arranque SHALL fallar.

#### Scenario: Arranque sin sala 1
- **WHEN** la aplicación arranca y la sala 1 aún no existe
- **THEN** el sistema la crea antes de aceptar altas

#### Scenario: Fallo al aprovisionar sala 1
- **WHEN** la aplicación no puede crear la sala 1
- **THEN** el arranque falla y la aplicación no acepta altas
