# Design

## Context

El proyecto usa Java 17 y contiene identificadores internos en español junto a identificadores técnicos en inglés. Esta propuesta establece nombres de implementación consistentes sin modificar contratos externos.

## Goals / Non-Goals

**Goals:**
- Usar inglés para los nombres de las clases de producción y prueba con nombres españoles.
- Usar inglés para variables locales, campos privados y métodos en Java.
- Mantener nombres claros, concisos y equivalentes a su responsabilidad.
- Mantener completas las llamadas entre controladores, servicios, integraciones y pruebas.
- Preservar el comportamiento, los contratos HTTP y los datos persistidos.

**Non-Goals:**
- Traducir endpoints, campos JSON, nombres de tablas o mensajes acordados.
- Renombrar paquetes.
- Cambiar formatos de respuesta, reglas de validación o políticas externas.

## Naming Map

### Classes

| Identificador actual | Identificador objetivo |
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

Las clases de prueba se renombrarán aplicando el mismo prefijo o responsabilidad en inglés:
`AltaUsuarioControllerTests` → `CreateUserControllerTests`,
`ConsultaUsuarioControllerTests` → `GetUserControllerTests`,
`AltaUsuarioServiceTests` → `CreateUserServiceTests`,
`ConsultaUsuarioServiceTests` → `GetUserServiceTests`,
`ValidadorUsuarioTests` → `UserValidatorTests`,
`AceptacionUsuariosTests` → `UserAcceptanceTests` y
`UsuarioRepositoryTests` → `UserRepositoryTests`.

### Methods and Variables

| Identificador actual | Identificador objetivo |
|---|---|
| `alta` en servicios/controladores | `create` |
| `entrada` | `input` |
| `validar` | `validate` |
| `validador` | `validator` |
| `recortar` | `trim` |
| `valor` | `value` |
| `validado` | `validated` |
| `consultar` | `find` o `get`, según la operación |
| `notificar` | `notify` |
| `enviar` | `send` |
| `ensureSala1` | `ensureRoomOne` |
| `getUsuarios` | `getUsers` |
| `getCampo` | `getField` |
| `emailExistente` | `existingEmail` |
| `emailNormalizado` | `normalizedEmail` |
| `sala1` | `roomOne` |

Los nombres exactos de los métodos de pruebas deben describir el escenario en inglés; el lenguaje de la prueba no afecta el contrato ejecutable.

## Decisions

- Se ejecutará un renombrado mecánico y referencialmente completo con el compilador como protección.
- Los nombres de contrato no se modificarán aunque contengan términos en español o siglas como `dni`, `rol` o `name`.
- Las variables que representen datos técnicos persistidos podrán conservar términos necesarios para la API si ya son parte del contrato.
- La implementación se verificará con las pruebas existentes y no con umbrales nuevos de cobertura.

## Risks / Trade-offs

- [Cambios amplios de nombres] → Limitar el cambio a variables, campos privados y métodos; no modificar firmas públicas de respuesta.
- [Rutas o llamadas que queden desactualizadas] → Ejecutar `mvn test` y corregir todas las referencias del compilador.

## Migration Plan

No requiere migración de base de datos ni de despliegue. Las llamadas internas se actualizarán junto con las implementaciones y sus pruebas.

## Open Questions

No hay preguntas abiertas. Los nombres de contratos HTTP y mensajes permanecen fuera del alcance.
