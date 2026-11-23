# GUS-02 — Preparar configuración de aplicación y entornos

**Prioridad:** P1  
**Objetivo:** Dejar lista la aplicación Java 17/Maven para implementar las capacidades requeridas y conectarse a dependencias configurables.  
**Alcance:** Configuración segura y dependencias necesarias, alineadas con el POM actual. No definir contratos externos ni añadir infraestructura no requerida.

## Entradas y salidas

- **Entrada:** configuración actual del proyecto, Java 17, Maven, PostgreSQL existente y contratos aprobados en GUS-01 cuando correspondan.
- **Salida:** aplicación ejecutable con configuración externalizada y configuración de pruebas aislada.
- **Persistencia:** ninguna.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| Configuración requerida disponible | Arrancar usando valores configurados por entorno | El contexto de Spring inicia sin credenciales embebidas |
| Falta configuración obligatoria | Informar claramente qué variable/configuración falta | No usar credenciales predeterminadas ni conexión accidental a servicios reales |
| Prueba de contexto | Activar configuración específica de prueba | La prueba no requiere servicios externos reales |

## Criterios de aceptación

- [x] Maven compila y ejecuta pruebas con Java 17.
- [x] Dependencias web, persistencia, validación y PostgreSQL se agregan solo si son necesarias y con versiones compatibles con Spring Boot configurado.
- [x] URLs, usuario/contraseña de base de datos y configuración de la API externa se externalizan; no se guardan secretos en el repositorio.
- [x] La configuración de prueba sustituye o desactiva conexiones a servicios externos reales.
- [x] Existe una prueba de arranque con configuración de prueba o queda implementada en GUS-08.

## Especificación de pruebas

- **Unitarias:** verificar componentes de configuración con valores válidos y ausentes cuando aplique.
- **Integración:** arrancar el contexto con la configuración de prueba y comprobar que no intenta acceder a endpoints reales.
- **Aceptación:** ejecutar el build y las pruebas mediante Maven.
- **Cobertura:** probar las ramas de configuración; no se fija umbral porcentual.

## Preguntas abiertas

- GUS-01 debe definir las propiedades necesarias para la API externa.
- El mecanismo concreto de provisión de secretos por entorno no está fijado; elegir uno compatible con el despliegue acordado sin añadir credenciales al repositorio.

## Referencias

- `.foundation/guardrails.md`
- `.foundation/architecture-decisions.md`
- `.foundation/testing-strategy.md`
- `pom.xml`
