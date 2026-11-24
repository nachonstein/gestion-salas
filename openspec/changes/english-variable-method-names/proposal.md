# Proposal

## Why

El código Java mezcla nomenclatura española e inglesa. Estandarizar los identificadores internos mejora la legibilidad, mantiene un estilo coherente en Java y facilita el mantenimiento entre código de producción y pruebas.

## What Changes

- Renombrar las clases actuales con nombres españoles a nombres equivalentes en inglés.
- Renombrar métodos internos y locales escritos en español a nombres equivalentes en inglés.
- Renombrar variables locales y campos privados escritos en español a nombres equivalentes en inglés.
- Actualizar las pruebas, incluidas las referencias a métodos renombrados y los nombres de métodos de prueba escritos en español.
- Mantener sin cambios las rutas HTTP, los campos JSON, los mensajes de error y las entidades externas del contrato público.

### Class Names

| Nombre actual | Nombre en inglés |
|---|---|
| `GestionSalasApplication` | `RoomManagementApplication` |
| `AltaUsuarioController` | `CreateUserController` |
| `ConsultaUsuarioController` | `GetUserController` |
| `AltaUsuarioService` | `CreateUserService` |
| `ConsultaUsuarioService` | `GetUserService` |
| `AltaUsuarioException` | `CreateUserException` |
| `ConsultaUsuarioException` | `GetUserException` |
| `ValidacionUsuarioException` | `UserValidationException` |
| `UsuarioAlta` | `CreateUserInput` |
| `UsuarioConsulta` | `UserResponse` |
| `ValidadorUsuario` | `UserValidator` |
| `Sala` | `Room` |
| `Sala1Provisioner` | `RoomOneProvisioner` |
| `SalaRepository` | `RoomRepository` |
| `Usuario` | `User` |
| `UsuarioRepository` | `UserRepository` |
| `AltaUsuarioControllerTests` | `CreateUserControllerTests` |
| `ConsultaUsuarioControllerTests` | `GetUserControllerTests` |
| `AltaUsuarioServiceTests` | `CreateUserServiceTests` |
| `ConsultaUsuarioServiceTests` | `GetUserServiceTests` |
| `ValidadorUsuarioTests` | `UserValidatorTests` |
| `AceptacionUsuariosTests` | `UserAcceptanceTests` |
| `UsuarioRepositoryTests` | `UserRepositoryTests` |

Las clases con nombres ya técnicos o en inglés, como `DniValidator`, `ExternalDniValidator`, `ExternalUserNotifier`, `UserNotifier`, `NotificationResult` y `ApiExceptionHandler`, no requieren cambio de nombre.

## Capabilities

### New Capabilities

- `code-naming`: convención interna de nombres en inglés para variables y métodos Java.

### Modified Capabilities

Ninguna.

## Impact

- Código principal: controladores, servicios de dominio, validaciones, integraciones y persistencia.
- Pruebas: pruebas unitarias, de integración y de aceptación.
- Sin cambios en la API, el esquema de persistencia, las dependencias ni el comportamiento observable.
