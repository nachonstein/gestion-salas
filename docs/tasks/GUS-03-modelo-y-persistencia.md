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

- [ ] El esquema refleja Sala 1:N Usuario y Usuario:N:1 Sala.
- [ ] El ID de Sala es único e incremental de tipo `long`; la estrategia de ID de Usuario respeta GUS-01.
- [ ] El email tiene una restricción de unicidad efectiva en persistencia.
- [ ] La consulta está acotada a la sala 1 según la regla funcional.
- [ ] Se documenta y prueba cómo se crea o encuentra la sala 1.
- [ ] Los cambios de esquema son reproducibles y compatibles con la base PostgreSQL existente.

## Especificación de pruebas

- **Unitarias:** probar mapeos y comportamiento de repositorio que no requiera base real.
- **Integración:** con PostgreSQL de prueba, verificar guardado, ID, relación, unicidad y consultas existentes/no existentes.
- **Aceptación:** no aplica directamente; GUS-08 prueba la ruta HTTP completa.
- **Cobertura:** cubrir cada rama; sin porcentaje mínimo predefinido.

## Preguntas abiertas

- GUS-01 debe cerrar tipo/estrategia de ID de Usuario y aprovisionamiento de sala 1.
- El esquema existente de la base `users` no está descrito; inspeccionarlo antes de crear migraciones destructivas o incompatibles.

## Referencias

- `.foundation/domain-landscape.md`
- `.foundation/architecture-decisions.md`
- `.foundation/testing-strategy.md`
- `docs/requirements.md`
