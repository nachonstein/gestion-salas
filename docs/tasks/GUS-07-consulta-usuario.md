# GUS-07 — Implementar consulta de usuario por ID

**Prioridad:** P2  
**Objetivo:** Exponer la operación GET para recuperar un usuario por ID dentro de la sala 1.  
**Alcance:** Consulta y mapeo de respuesta. Depende del contrato aprobado en GUS-01 y del modelo/repositorio de GUS-03.

## Entradas y salidas

- **Entrada:** identificador de usuario por la ruta/parametrización que se acuerde en GUS-01.
- **Salida:** respuesta del usuario según el esquema acordado; respuesta de ID inexistente según el mismo contrato.
- **Persistencia:** solo lectura, limitada a la sala 1.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| ID corresponde a usuario de sala 1 | Recuperar y mapear el usuario | Estado y cuerpo coinciden con GUS-01 |
| ID no existe o usuario no pertenece a sala 1 | Devolver ausencia/error acordado | No exponer un usuario de otra sala ni fallar por desreferencia nula |

## Criterios de aceptación

- [ ] Ruta, parámetro, cuerpo exitoso y respuesta de inexistencia están aprobados en GUS-01.
- [ ] La consulta está restringida a sala 1.
- [ ] Se devuelve un DTO de API, no directamente una entidad de persistencia.
- [ ] No se realizan escrituras ni notificaciones durante la consulta.
- [ ] ID inválido/inexistente se maneja explícitamente.

## Especificación de pruebas

- **Unitarias:** probar resultado encontrado y ausente.
- **Integración:** verificar consulta de usuario en sala 1 y aislamiento respecto de registros fuera de ella, si existen.
- **Aceptación:** comprobar respuesta HTTP y cuerpo exactos para éxito e inexistencia según GUS-01.
- **Cobertura:** cubrir ambas ramas; sin porcentaje mínimo predefinido.

## Preguntas abiertas

- GUS-01 debe definir ruta, formato de respuesta y status para ID inexistente.

## Referencias

- `.foundation/domain-landscape.md`
- `.foundation/guardrails.md`
- `.foundation/testing-strategy.md`
- `docs/requirements.md`
