# GUS-03 — Modelar salas y usuarios y persistirlos

**Prioridad:** P1  
**Objetivo:** Persistir las entidades Sala y Usuario en PostgreSQL respetando las cardinalidades e invariantes del dominio.  
**Alcance:** Modelo, repositorios y esquema/migración necesarios. No implementar endpoints ni notificaciones.

## Entradas y salidas

- **Entrada:** contrato de datos aprobado y decisiones de ID/sala 1 de GUS-01.
- **Salida:** componentes de persistencia que permiten guardar, consultar y detectar email duplicado.
- **Persistencia:** salas con ID único incremental de tipo `long`; usuarios relacionados con una única sala y email único.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| Usuario asociado a una sala válida | Guardar usuario y recuperar ID generado | Usuario queda asociado a exactamente una sala |
| Email ya persistido | Impedir duplicidad | La capa de persistencia representa el conflicto sin crear un segundo usuario |
| Consulta por ID encuentra usuario en sala 1 | Devolver el registro | Se recuperan los datos definidos por el modelo |
| Usuario no existe o no pertenece a sala 1 | Devolver ausencia explícita a la capa de aplicación | No hay desreferencia nula ni asociación inferida |

## Criterios de aceptación

- [x] El esquema refleja Sala 1:N Usuario y Usuario:N:1 Sala mediante clave foránea no nula.
- [x] El ID de Sala es único e incremental de tipo `long`; el ID de Usuario también es incremental de tipo `long`, según GUS-01.
- [x] El email se normaliza a minúsculas antes de persistir y tiene una restricción de unicidad en la base de datos.
- [x] `UsuarioRepository.findByIdAndSala_Id` limita la consulta a la sala indicada.
- [x] `Sala1Provisioner` aprovisiona sala 1 idempotentemente al arrancar; el test de contexto verifica su presencia y un test de repositorio verifica la repetición.
- [x] Flyway aplica una migración versionada y aditiva sobre tablas con prefijo `gestion_salas_`; Hibernate valida el esquema sin modificarlo. Para una base existente no vacía, Flyway la marca en versión 0 antes de aplicar la migración.
- [ ] Verificar la migración contra PostgreSQL real y el esquema existente; por ahora, la integración solo se ejecutó en H2 en modo PostgreSQL.

## Especificación de pruebas

- **Unitarias:** probar mapeos y comportamiento de repositorio que no requiera base real.
- **Integración:** con PostgreSQL de prueba, verificar guardado, ID, relación, unicidad y consultas existentes/no existentes.
- **Aceptación:** no aplica directamente; GUS-08 prueba la ruta HTTP completa.
- **Cobertura:** cubrir cada rama; sin porcentaje mínimo predefinido.

## Preguntas abiertas

- Cerradas por GUS-01: IDs incrementales `long` para sala y usuario, y aprovisionamiento obligatorio de sala 1.
- El esquema legado de la base `users` no está descrito ni fue inspeccionado en este entorno. La migración no altera tablas existentes: utiliza tablas con prefijo propio y baseline de Flyway. Si esos nombres ya estuvieran ocupados, el arranque falla explícitamente en vez de modificar datos.

## Implementación

- `V1__create_salas_and_usuarios.sql` crea ambas tablas, secuencias, clave foránea y restricción única de email; inserta la sala 1 como parte del esquema inicial.
- `Sala1Provisioner` usa una inserción condicional en cada arranque, por lo que repara la ausencia de esa fila sin duplicarla.
- Las pruebas de persistencia usan H2 en modo PostgreSQL; no se ejecutaron contra una instancia real de PostgreSQL en este entorno.

## Referencias

- `.foundation/domain-landscape.md`
- `.foundation/architecture-decisions.md`
- `.foundation/testing-strategy.md`
- `docs/requirements.md`
