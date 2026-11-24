# Spec Delta

## ADDED Requirements

### Requirement: Nombres de clases en inglés
Las clases de producción y prueba SHALL usar nombres en inglés para todas las responsabilidades cuyo nombre actual esté escrito en español.

#### Scenario: Clase de dominio o servicio
- **WHEN** se crea o modifica una clase de controlador, servicio, excepción, modelo de dominio o persistencia
- **THEN** el nombre de la clase usa inglés y describe su responsabilidad

#### Scenario: Clase de prueba
- **WHEN** se crea o modifica una clase de prueba
- **THEN** el nombre de la clase usa inglés y refleja el componente o caso de uso probado

### Requirement: Identificadores internos en inglés
El código Java SHALL usar nombres en inglés para métodos, variables locales y campos privados definidos por la implementación.

#### Scenario: Método interno en producción
- **WHEN** se añade o modifica un método interno de un controlador, servicio, integración o componente de persistencia
- **THEN** el identificador del método usa inglés y describe la operación

#### Scenario: Variable local en producción o pruebas
- **WHEN** se declara una variable local o un campo privado
- **THEN** el identificador usa inglés y describe el dato que representa

### Requirement: Preservar contratos externos
El cambio de nomenclatura SHALL preservar rutas HTTP, campos JSON, mensajes de error, nombres de entidades, esquemas de persistencia y dependencias externas.

#### Scenario: Refactor de nombres
- **WHEN** se renombra un método o variable interno
- **THEN** no cambia ningún contrato público ni observable
