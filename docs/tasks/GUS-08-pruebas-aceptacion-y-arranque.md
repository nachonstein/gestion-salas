# GUS-08 — Completar pruebas de aceptación y arranque

**Prioridad:** P1  
**Objetivo:** Validar los flujos públicos completos de alta y consulta y comprobar que la aplicación arranca con configuración de prueba.  
**Alcance:** Pruebas a través de las entradas públicas y smoke test del contexto. No reemplaza pruebas unitarias ni de integración de GUS-03 a GUS-07.

## Entradas y salidas

- **Entrada:** endpoints, persistencia y adaptadores implementados en GUS-02 a GUS-07; contratos aprobados en GUS-01.
- **Salida:** suite reproducible que verifica flujos aceptados y arranque.
- **Persistencia:** usar entorno de prueba aislado y datos reproducibles.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| Contexto de prueba tiene configuración válida | Arrancar la aplicación | El contexto inicia sin servicios reales |
| Alta válida para cada rol | Ejecutar POST y revisar efectos | 201 con ID, persistencia en sala 1 y notificación por canal correcto |
| Alta incumple una regla o DNI es rechazado | Ejecutar POST negativo | Respuesta acordada y ningún usuario creado |
| Email duplicado | Repetir el alta con mismo email | Conflicto acordado y una sola fila |
| Consulta de ID válido/no encontrado | Ejecutar GET | Cuerpos/status conforme al contrato aprobado |

## Criterios de aceptación

- [ ] Hay una prueba de arranque con configuración de prueba explícita.
- [ ] La suite no contacta servicios externos reales ni utiliza credenciales embebidas.
- [ ] Se cubren alta Admin, alta Superadmin, consulta existente, consulta inexistente, duplicidad y rechazos de validación/DNI.
- [ ] Se verifican status y cuerpos HTTP, persistencia y llamadas externas relevantes.
- [ ] Las pruebas se ejecutan de forma reproducible mediante Maven.
- [ ] Se documentan requisitos locales para ejecutar la suite, sin imponer infraestructura adicional no acordada.

## Especificación de pruebas

- **Unitarias:** no corresponde añadir lógica de dominio aquí; asegurar que las pruebas unitarias previas continúan ejecutándose.
- **Integración:** usar PostgreSQL de prueba y adaptadores externos controlados.
- **Aceptación:** ejecutar los escenarios end-to-end enumerados arriba.
- **Cobertura:** cada flujo/ramificación listada; el proyecto no fija porcentaje mínimo.

## Preguntas abiertas

- GUS-01 debe definir contratos HTTP y la política ante fallos externos para hacer deterministas los resultados.
- Acordar herramienta de aceptación si las pruebas del stack elegido requieren una adicional.

## Referencias

- `.foundation/testing-strategy.md`
- `.foundation/guardrails.md`
- `.foundation/task-spec.md`
- `docs/requirements.md`
