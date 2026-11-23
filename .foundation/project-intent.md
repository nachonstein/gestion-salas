---
version: "1.0.1"
generated_at: "2026-11-23T08:47:16.794Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "c3dd2d64c810f3193d38d978d333b8cb7f3603e4140fbd4abdb47f6aa1a54533"
produced_from:
  - "docs/requirements.md"
---
# Project Intent

Level: 2 (Domain)
Scope: Strategic
Category: Business Context
Purpose: Resume la finalidad, alcance y restricciones del sistema de gestión de usuarios y salas para orientar el trabajo de implementación y aceptación.

## Visión

Construir una aplicación que permita registrar usuarios en salas, validar su identidad mediante un servicio externo y enviar una notificación según el rol del usuario.

## Objetivos

- Crear usuarios asociados a una sala y devolver el identificador generado.
- Consultar un usuario por su identificador en la sala 1.
- Evitar registros duplicados por email y rechazar datos que no cumplan las validaciones establecidas.
- Validar el DNI contra la API externa antes de almacenar al usuario.
- Notificar por email a los usuarios `admin` y por SMS a los `superadmin`.

## Usuarios y actores

- **Consumidor de la API:** solicita el alta y la consulta de usuarios. El documento fuente no identifica personas ni canales de interfaz concretos.
- **API externa:** valida el DNI y participa en las notificaciones por canal.
- **PostgreSQL:** persiste los usuarios y las salas.

## Alcance

### Incluido

- Modelo de salas con identificador incremental `long`; una sala puede contener varios usuarios.
- Asociación de cada usuario con una única sala.
- Alta de usuario en la sala 1.
- Consulta de usuario por ID dentro de la sala 1.
- Validaciones de nombre, email, rol, unicidad de email y DNI externo.
- Notificaciones por rol y respuesta de alta con el ID generado.

### Fuera de alcance o no especificado

- Crear, editar o eliminar salas.
- Alta o consulta de usuarios en salas distintas de la sala 1.
- Autenticación, autorización, interfaz de usuario, paginación y búsquedas distintas de la consulta por ID.
- Contrato completo de errores del endpoint GET.
- Garantías de reintento, consistencia transaccional o entrega de notificaciones.
- Los contextos de pagos y pedidos se citan como posibles extensiones futuras, no como alcance actual.

## Criterios de éxito

| Criterio | Resultado verificable |
|---|---|
| Alta correcta | Responde HTTP 201 e incluye el ID generado |
| Validación de datos | Se aplican las reglas de nombre, email y rol documentadas |
| Email duplicado | Se rechaza el alta con un conflicto |
| DNI | Se valida mediante la API externa antes de completar el alta |
| Notificación | Admin recibe el mensaje `usuario guardado` por email; superadmin, por SMS |
| Consulta | Se puede obtener por ID un usuario perteneciente a la sala 1 |

No se han definido objetivos cuantitativos de latencia, disponibilidad, cobertura ni volumen de peticiones.

## Restricciones de negocio y técnicas

- Java 17, Maven y Docker se indican como prerrequisitos.
- La base de datos existente es PostgreSQL, base `users`, en el puerto 5432.
- Los únicos roles admitidos son `admin` y `superadmin`.
- Cada usuario pertenece como máximo a una sala.
- No guardar credenciales de base de datos en estos documentos ni en el código; obtenerlas de configuración local segura.

## Supuestos y decisiones pendientes

- El endpoint de alta opera sobre la sala 1; el documento no fija las rutas HTTP.
- El documento describe una validación de email como presencia de `@` y de un punto; no establece una validación sintáctica completa.
- No se especifica si la notificación debe completarse antes o después de confirmar la persistencia.
- No se especifican los campos de respuesta del GET, ni qué respuesta corresponde cuando no se encuentra el usuario.
- La escalabilidad a millones de peticiones es una aspiración opcional sin objetivos medibles.

## 📎 Sources

- `docs/requirements.md` — visión, entidades, validaciones, operaciones y restricciones.
