# Tasks

## 1. Identificar nombres internos

- [x] 1.0 Inventariar las clases españolas de producción y prueba que deban renombrarse.
- [x] 1.1 Inventariar métodos, variables locales y campos privados con nombres españoles en `src/main/java`.
- [x] 1.2 Inventariar nombres de métodos y variables españolas en `src/test/java`.
- [x] 1.3 Confirmar que rutas, campos JSON y mensajes acordados no forman parte del renombrado.

## 2. Renombrar código de producción

- [x] 2.1 Renombrar las clases españolas de controladores, servicios y excepciones.
- [x] 2.2 Renombrar los modelos de dominio, validaciones y clases de persistencia.
- [x] 2.3 Renombrar métodos y variables locales de controladores y servicios.
- [x] 2.4 Renombrar métodos y variables de validaciones e integraciones externas.
- [x] 2.5 Renombrar métodos y variables de persistencia sin cambiar el esquema.

## 3. Actualizar pruebas

- [x] 3.1 Actualizar referencias a métodos renombrados en pruebas unitarias.
- [x] 3.2 Renombrar métodos de prueba a nombres descriptivos en inglés.
- [x] 3.3 Actualizar variables locales de pruebas que sigan usando español.

## 4. Verificar

- [x] 4.1 Ejecutar `.\mvnw.cmd test`.
- [x] 4.2 Revisar que no queden métodos o variables internos relevantes en español.
- [x] 4.3 Confirmar que el comportamiento de API y persistencia no cambió.
