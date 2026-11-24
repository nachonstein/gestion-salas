# Gestion Salas

API REST desarrollada con Java 17 y Spring Boot para gestionar usuarios asociados a la sala 1.

## Funcionalidades

- Da de alta usuarios en la sala 1.
- Valida el nombre, el correo electrónico, el rol y el DNI.
- Impide registrar dos veces el mismo correo electrónico.
- Consulta usuarios por su identificador.
- Valida el DNI mediante una API externa.
- Envía por la API externa una notificación por email para usuarios `admin` o por SMS para usuarios `superadmin`.
- Usa PostgreSQL en ejecución normal y H2 aislado en las pruebas.

## Requisitos

- Java 17.
- Maven (o el wrapper incluido).
- PostgreSQL disponible para arrancar la aplicación.
- API externa disponible para validar DNI y procesar notificaciones.

## Arranque

### 1. Configurar PostgreSQL

La aplicación necesita una base de datos PostgreSQL. En el arranque ejecuta las migraciones Flyway y crea automáticamente la sala con ID `1` si no existe.

Ejemplo con una base de datos llamada `users`:

```text
host: localhost
puerto: 5432
base de datos: users
```

### 2. Configurar las variables de entorno

En Windows PowerShell:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/users"
$env:DB_USERNAME = "user"
$env:DB_PASSWORD = "tu-password"
$env:EXTERNAL_API_BASE_URL = "http://localhost:1080"
$env:EXTERNAL_API_TIMEOUT = "5s"
```

En Linux o macOS:

```bash
export DB_URL='jdbc:postgresql://localhost:5432/users'
export DB_USERNAME='user'
export DB_PASSWORD='tu-password'
export EXTERNAL_API_BASE_URL='http://localhost:1080'
export EXTERNAL_API_TIMEOUT='5s'
```

Las variables disponibles son:

| Variable | Uso |
|---|---|
| `DB_URL` | URL JDBC de PostgreSQL. |
| `DB_USERNAME` | Usuario de PostgreSQL. |
| `DB_PASSWORD` | Contraseña de PostgreSQL. |
| `EXTERNAL_API_BASE_URL` | URL base del servicio externo. |
| `EXTERNAL_API_TIMEOUT` | Tiempo máximo de espera; por defecto `5s`. |

El archivo `.env.example` contiene una referencia de valores, pero Spring Boot no carga `.env` automáticamente.

### 3. Iniciar la aplicación

Desde la raíz del proyecto:

```powershell
.\mvnw.cmd spring-boot:run
```

En Linux o macOS:

```bash
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

También puede ejecutarse el JAR generado:

```powershell
.\mvnw.cmd clean package
java -jar target\gestion_salas-0.0.1-SNAPSHOT.jar
```

## API

### Crear usuario

```http
POST http://localhost:8080/usuarios
Content-Type: application/json

{
  "name": "pablo",
  "email": "pablo@email.com",
  "phone": "677998899",
  "rol": "admin",
  "dni": "23454234W"
}
```

Respuesta correcta: `201 Created`

```json
{
  "id": 1
}
```

Valores admitidos para `rol`: `admin` y `superadmin`.

### Consultar usuario

```http
GET http://localhost:8080/usuarios/1
```

Respuesta correcta: `200 OK` con los datos del usuario.

Más ejemplos disponibles en `docs/examples.http`.

## Ejecutar las pruebas

Las pruebas usan H2 en memoria y sustitutos de las dependencias externas, por lo que no necesitan PostgreSQL ni servicios externos reales:

```powershell
.\mvnw.cmd test
```

En Linux o macOS:

```bash
./mvnw test
```
