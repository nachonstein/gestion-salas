# Proposal

## Why

GUS-01 identifica decisiones de producto y arquitectura que bloquean la implementación comprobable de la gestión de usuarios. Estas decisiones quedan registradas y trazables antes de fijar contratos o comportamientos que los requisitos aprobados no especifican.

## What Changes

- Registrar los contratos y decisiones aprobados por el usuario, junto con los límites explícitos de alcance, en una bitácora trazable.
- Definir como comportamiento objetivo las rutas acordadas, validaciones, errores, persistencia, notificaciones y consulta de usuarios.
- Incorporar `docs/mock-server-api.md`, aportado expresamente para esta tarea, como fuente de los endpoints y formatos documentados de DNI, email y SMS.
- No implementar funcionalidad en esta tarea documental.
- No usar `docs/README.md`; la única fuente aprobada aquí para contratos del mock-server es `docs/mock-server-api.md`.

## Capabilities

### New Capabilities

- `user-management`: contratos acordados para alta y consulta de usuarios, validaciones, notificaciones y sala 1.

### Modified Capabilities

Ninguna. No existen especificaciones previas en `openspec/specs/`.

## Impact

- Documentación y contrato objetivo: `docs/mock-server-api.md`, `docs/decisions/GUS-01-contract-decisions.md`, `docs/tasks/GUS-01-cerrar-contratos.md` y la especificación `user-management`.
- Referencias: `docs/requirements.md` y el contrato de mock-server expresamente aportado para esta tarea.
- Sin cambios en código, API desplegada, dependencias ni persistencia.
