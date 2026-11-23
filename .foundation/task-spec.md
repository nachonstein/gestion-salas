---
version: "1.0.1"
generated_at: "2026-11-23T08:47:16.798Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "c810fc70a36330e2966fa764b558fcc5aa4ac1e7da654fe7439b001426c94af5"
produced_from:
  - "docs/requirements.md"
---
# Task Specification Template

Level: 1 (Global)
Scope: Governance
Category: Process & Templates
Purpose: Proporciona un formato de trabajo que hace verificables las tareas de gestión de usuarios y salas y evita contradicciones con los requisitos fundacionales. Debe completarse antes de implementar cada tarea.

## Reglas de autoría

### Bloque A — Calidad de especificación

- **R-1:** Cada tarea MUST incluir las ramas de decisión válidas y de error.
  - ❌ «Crear usuario correctamente».
  - ✅ Enumerar entrada válida, datos inválidos, email duplicado y DNI rechazado.
- **R-2:** Cada rama MUST tener un escenario de aceptación correspondiente.
  - ❌ Cuatro ramas y un único escenario genérico.
  - ✅ Un escenario por rama, con resultado observable.
- **R-3:** Los escenarios MUST ser deterministas.
  - ❌ «El sistema devuelve un error apropiado».
  - ✅ «Responde HTTP 409 con `code: 409` y el mensaje acordado para el campo inválido».
- **R-4:** Las estructuras de datos MUST referenciar el modelo completo acordado; no definir formas parciales contradictorias.
  - ❌ Omitir DNI y teléfono de la solicitud de alta sin justificación.
  - ✅ Referenciar el contrato de alta y todos sus campos: `name`, `email`, `phone`, `rol`, `dni`.
- **R-5:** Las llamadas de framework y librería MUST comprobarse frente a la versión realmente configurada.
  - ❌ Asumir una API de Spring sin verificar compatibilidad.
  - ✅ Confirmar versión y firma antes de incluir la llamada en el plan.
- **R-6:** MUST listar cada funcionalidad requerida explícitamente.
  - ❌ «Guardar usuario» sin validación ni notificación.
  - ✅ Detallar validación, persistencia, respuesta y notificación según alcance de la tarea.
- **R-7:** MUST declarar los datos de entrada y salida y sus campos.
  - ❌ «Devuelve éxito».
  - ✅ «HTTP 201 con `{ "id": "<id>" }`».
- **R-8:** MUST asociar cada error con una condición y un resultado acordado antes de implementarlo.
  - ❌ Inventar códigos o textos de error.
  - ✅ Registrar la regla fuente y marcar como pendiente cualquier código o mensaje no definido.

### Bloque B — Calidad de implementación

- **R-9:** NEVER descartar campos requeridos ni usar modelos parciales entre capas.
  - ❌ La lógica de alta recibe solo nombre y email y omite teléfono, rol y DNI.
  - ✅ Conservar explícitamente los datos de alta necesarios para ejecutar y verificar la operación.
- **R-10:** Los DTO de API MUST mantener una estructura coherente con el contrato acordado y no exponer directamente entidades de persistencia.
  - ❌ Responder con la entidad JPA completa por conveniencia.
  - ✅ Mapear a una respuesta de API con el campo de ID acordado.
- **R-11:** NEVER crear interfaces con una única implementación sin una razón concreta de sustitución o polimorfismo.
  - ❌ `UserService` más `UserServiceImpl` sin otra implementación ni necesidad de módulo.
  - ✅ Un servicio concreto; extraer la interfaz si aparece una necesidad real.
- **R-12:** Las pruebas unitarias MUST probar la unidad de forma aislada y no arrancar el contexto completo sin necesidad.
  - ❌ Arrancar todo Spring para probar una regla de rol.
  - ✅ Instanciar la unidad con colaboradores simulados; reservar contexto Spring para integración/bootstrap.
- **R-13:** ALWAYS comprobar nulos y colecciones vacías antes de acceder a sus elementos.
  - ❌ Acceder al primer resultado sin comprobar que existe.
  - ✅ Manejar explícitamente la colección vacía con el resultado acordado.
- **R-14:** ALWAYS comprobar que una búsqueda por clave produjo un valor antes de usarlo.
  - ❌ Desreferenciar el resultado de una consulta por ID sin caso de inexistencia.
  - ✅ Definir y probar el comportamiento de ID inexistente; el contrato HTTP aún debe acordarse.
- **R-15:** NEVER leer el reloj del sistema directamente desde la lógica de negocio si una tarea introduce reglas basadas en tiempo.
  - ❌ Invocar el reloj global dentro de una regla para hacerla difícil de probar.
  - ✅ Inyectar una abstracción de reloj. Actualmente no hay reglas temporales en alcance.
- **R-16:** NEVER implementar lógica de negocio en el controlador.
  - ❌ El controlador decide duplicidad, valida DNI o selecciona canal de notificación.
  - ✅ El controlador delega el caso de uso y adapta el resultado HTTP.

## Plantilla de tarea

### <ID> — <Título>

**Objetivo:** <resultado de negocio>
**Alcance:** <incluido y excluido>
**Capa/área responsable:** <API, dominio, persistencia o integración>

### Entradas y salidas

- Entrada: <campos y origen>
- Salida: <estado HTTP y cuerpo>
- Persistencia: <cambios, si los hay>

### Reglas y ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| <condición válida> | <acción> | <respuesta y efecto> |
| <condición de error> | <rechazo> | <estado y mensaje acordados> |

### Dependencias externas

- <servicio, método, ruta, contrato y respuesta esperada>

### Criterios de aceptación

- [ ] <un criterio por rama y regla>
- [ ] No se persisten datos cuando una validación previa falla (si se acuerda como invariante para esta tarea).

### Preguntas abiertas

- <decisiones que bloquean el desarrollo o la aceptación>

## §9 Especificación de pruebas

### 9.1 Datos de prueba

- Reutilizar constructores/fábricas para usuario y sala cuando se necesiten en varias pruebas.
- Incluir variantes válidas y casos negativos específicos; no compartir estado mutable entre pruebas.

### 9.2 Pruebas unitarias

- Probar reglas de negocio y ramas de error aislando persistencia y clientes externos.
- Para cada rechazo, comprobar la excepción o resultado interno y el mapeo observable esperado; no verificar únicamente que un colaborador fue invocado.
- No simular métodos estáticos de utilidades que puedan ejecutarse directamente.

### 9.3 Pruebas de integración

- Verificar persistencia PostgreSQL y restricciones relevantes con infraestructura de prueba controlada.
- Verificar validación de DNI y notificaciones mediante dependencias externas controladas, no servicios reales.
- Probar rutas felices y errores en cada operación pública.

### 9.4 Helpers

- Reutilizar helpers existentes antes de crear otros.
- Mantener los datos de prueba explícitos y comprensibles; no ocultar valores críticos en defaults mágicos.

### 9.5 Cobertura

- Probar cada rama funcional y cada rechazo definido.
- No hay porcentaje mínimo de cobertura especificado; acordarlo si se convierte en una puerta de calidad.

### 9.6 Prueba de arranque

- Incluir una prueba de integración que confirme que la aplicación arranca con la configuración de prueba.
- La configuración de prueba debe impedir llamadas a PostgreSQL o servicios externos reales no destinados a la prueba.

## 📎 Sources

- `docs/requirements.md` — operaciones, criterios de validación, respuestas y niveles de pruebas valorados.
