# GUS-04 — Implementar validaciones y errores de dominio

**Prioridad:** P1  
**Objetivo:** Aplicar las reglas de validación indicadas y producir errores deterministas conforme al contrato aprobado.  
**Alcance:** Validación de nombre, email y rol, además de la regla de email duplicado en colaboración con GUS-03. La verificación externa de DNI pertenece a GUS-05.

## Entradas y salidas

- **Entrada:** datos completos de alta: `name`, `email`, `phone`, `rol`, `dni`.
- **Salida:** datos aceptados o error de dominio/API mapeable según GUS-01.
- **Persistencia:** ninguna escritura en esta tarea.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| Nombre tiene como máximo 6 caracteres y cumple el contrato acordado | Continuar validación | No se rechaza por exceder el límite |
| Nombre supera 6 caracteres | Rechazar | Error correspondiente al contrato de GUS-01 |
| Email contiene `@` y punto según la regla acordada y no está duplicado | Continuar validación | Email aceptado |
| Email no cumple la regla o ya existe | Rechazar | Error distinto/identificable según contrato, sin almacenar |
| Rol es `admin` o `superadmin` | Continuar y determinar canal en el caso de uso | Rol aceptado |
| Rol no está permitido | Rechazar | Error correspondiente al contrato de GUS-01 |

## Criterios de aceptación

- [ ] Se aplica el máximo de 6 caracteres al nombre; los límites no especificados quedan resueltos en GUS-01.
- [ ] La regla de email no añade restricciones no acordadas.
- [ ] Solo se aceptan los roles `admin` y `superadmin`.
- [ ] El email duplicado se rechaza incluso ante solicitudes concurrentes, apoyándose en la restricción de persistencia de GUS-03.
- [ ] Cada error se mapea al estado/cuerpo aprobado; no se inventan claves.
- [ ] La lógica es invocable sin arrancar el contexto completo de Spring.

## Especificación de pruebas

- **Unitarias:** probar entrada válida y cada regla negativa, incluidos límites de longitud; comprobar resultado/error exacto.
- **Integración:** probar la interacción de email duplicado con persistencia real/controlada en GUS-03.
- **Aceptación:** comprobar los estados y cuerpos HTTP correspondientes en GUS-08.
- **Cobertura:** todas las ramas de validación; no hay umbral porcentual acordado.

## Preguntas abiertas

- GUS-01 debe definir email normalizado/sensible a mayúsculas, entradas vacías/espacios y correspondencia de los mensajes para nombre y rol.
- La validación de teléfono no está especificada; no añadirla como condición de rechazo sin aprobación.

## Referencias

- `.foundation/domain-landscape.md`
- `.foundation/guardrails.md`
- `.foundation/testing-strategy.md`
- `docs/requirements.md`
