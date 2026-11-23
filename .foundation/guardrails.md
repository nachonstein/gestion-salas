---
version: "1.0.1"
generated_at: "2026-11-23T08:47:16.789Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "6d0caaa1dfba00f14a20cda8ff79dea976d0cc271d5aa5a7587e19764e5a7e72"
produced_from:
  - "docs/requirements.md"
---
# Guardrails

Level: 1 (Global)
Scope: Governance
Category: Engineering Standards
Purpose: Hace explícitas las restricciones funcionales y técnicas confirmadas para la aplicación y las cuestiones que deben resolverse antes de fijar contratos no descritos. Las reglas derivadas de requisitos bloquean una implementación que los contradiga.

## Principios de arquitectura

- La solución debe ejecutarse con Java 17 y Maven; Docker forma parte de los prerrequisitos documentados.
- Se espera el uso de Spring y la abstracción del framework, y se valoran los patrones de diseño. Son criterios de calidad, no una selección de versión ni una arquitectura detallada.
- Mantener separadas la entrada HTTP, la lógica de negocio, la persistencia y las integraciones externas, de modo que la lógica sea comprobable sin depender directamente del framework. Esta separación es una recomendación de diseño coherente con la abstracción solicitada.
- No introducir microservicios, Kubernetes ni infraestructura adicional para responder a la aspiración opcional de escalabilidad.

## Tecnologías y dependencias

| Uso | Tecnología/restricción | Estado |
|---|---|---|
| Lenguaje | Java 17 | Prerrequisito |
| Construcción | Maven | Prerrequisito |
| Infraestructura local | Docker | Prerrequisito |
| Persistencia | PostgreSQL, base `users`, puerto 5432 | Existente |
| Framework | Spring | Valorado; versión no especificada en requisitos |
| Servicios externos | API externa para validación de DNI y notificaciones | Contrato técnico no especificado |

## Reglas funcionales obligatorias

- Rechazar nombres de más de 6 caracteres.
- El email debe contener `@` y un punto. No asumir requisitos adicionales de formato que no estén acordados.
- Aceptar únicamente `admin` y `superadmin`.
- Rechazar un email ya registrado.
- Validar el DNI mediante la API externa.
- Asociar cada usuario con una sola sala; el alta descrita utiliza la sala 1.
- Enviar `usuario guardado` por email a `admin` y por SMS a `superadmin`.
- El alta correcta responde HTTP 201 con `{ "id": "<id>" }`.
- Los errores de validación descritos responden HTTP 409 con `{ "code": 409, "message": "error validation <email | userName | dni>" }`. La correspondencia exacta entre campo inválido y texto es un punto por aclarar.

## Convenciones de endpoints

- El alta es `POST`; debe crear el usuario en la sala 1 y devolver su ID.
- La consulta es `GET` y obtiene un usuario por ID dentro de la sala 1.
- No fijar rutas, nombres de parámetros ni formato de respuesta del GET por inferencia: no están definidos en los requisitos.
- La documentación especifica los canales y el mensaje de notificación, pero no las rutas, métodos HTTP ni cuerpos de las APIs externas; no inventarlos.

## Reglas de seguridad y datos

- No incluir contraseñas ni credenciales reutilizables en código o documentos fundacionales. La fuente adjunta contiene credenciales de ejemplo; configurarlas localmente mediante variables de entorno o un mecanismo equivalente.
- No registrar DNI, teléfono, email ni otros datos personales en logs salvo que exista una necesidad aprobada y protección adecuada.
- Validar y codificar los datos en los límites de entrada y salida. La regla de email especificada es mínima y no sustituye controles de seguridad.

## Reglas de componentes y seguridad de tipos

- El controlador HTTP debe delegar la lógica de negocio; no debe decidir reglas de duplicidad, rol, validación de DNI ni canal de notificación.
- La lógica de negocio no debe depender directamente de tipos de persistencia o de los detalles del cliente HTTP externo.
- Comprobar nulos y colecciones vacías antes de acceder a elementos o resultados de búsquedas.
- Evitar interfaces con una única implementación sin necesidad concreta de sustitución o polimorfismo.
- No acoplar la API a entidades de persistencia parciales o incompletas: definir modelos de entrada/salida completos para el contrato que finalmente se acuerde.

## Guardrails de pruebas y calidad

- Cubrir pruebas unitarias, de integración y de aceptación; son los niveles de prueba valorados explícitamente.
- Probar casos válidos y cada regla de rechazo: nombre demasiado largo, email inválido, rol no permitido, email duplicado y DNI rechazado.
- En integración, verificar persistencia e interacciones con la API externa mediante dependencias controladas, no servicios reales.
- Probar ambos canales de notificación y la respuesta HTTP 201 con el ID generado.
- El contexto completo de Spring puede verificarse en pruebas de integración/bootstrap; las pruebas unitarias no deberían arrancarlo innecesariamente.
- No se ha establecido umbral de cobertura, herramienta de aceptación, perfil de pruebas ni pipeline CI; no tratarlos como requisitos existentes.

## Decisiones pendientes

- Definir las rutas definitivas, el contrato de consulta GET y el error de usuario inexistente.
- Precisar validación de email, espacios y límites del nombre, y mayúsculas/minúsculas de DNI y rol.
- Definir códigos y mensajes para nombre o rol inválidos y si los errores se expresan mediante el mismo formato 409.
- Definir límites de transacción y comportamiento si falla la notificación tras persistir (o antes).
- Acordar cómo se provisionan/configuran las credenciales de base de datos y la API externa para cada entorno.

## 📎 Sources

- `docs/requirements.md` — requisitos de stack, validación, operaciones, respuestas y calidad.
