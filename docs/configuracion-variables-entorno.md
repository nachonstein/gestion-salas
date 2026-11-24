# Variables de entorno

La aplicación necesita conectarse a PostgreSQL y a la API externa. Configura estas variables antes de arrancarla:

| Variable | Obligatoria | Ejemplo | Uso |
|---|---|---|---|
| `DB_URL` | Sí | `jdbc:postgresql://localhost:5432/users` | URL JDBC de PostgreSQL. |
| `DB_USERNAME` | Sí | `user` | Usuario de la base de datos. |
| `DB_PASSWORD` | Sí | `cambia-esta-clave` | Contraseña de la base de datos. |
| `EXTERNAL_API_BASE_URL` | Sí | `http://localhost:1080` | URL base del servicio externo. |
| `EXTERNAL_API_TIMEOUT` | No | `5s` | Tiempo máximo de espera; si no se define, se usan `5s`. |

La base de datos `users` y el servicio externo deben estar disponibles en las direcciones configuradas. Sustituye los ejemplos por los valores de tu entorno. No guardes contraseñas reales en el repositorio.

## Windows (PowerShell)

Para la terminal actual:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/users"
$env:DB_USERNAME = "user"
$env:DB_PASSWORD = "cambia-esta-clave"
$env:EXTERNAL_API_BASE_URL = "http://localhost:1080"
$env:EXTERNAL_API_TIMEOUT = "5s"
.\mvnw.cmd spring-boot:run
```

Estas variables solo están disponibles en esa sesión de PowerShell. Para configurarlas de forma persistente, créalas desde **Configuración de Windows > Sistema > Información > Configuración avanzada del sistema > Variables de entorno** y abre una terminal nueva.

## Linux (Bash)

Para la terminal actual:

```bash
export DB_URL='jdbc:postgresql://localhost:5432/users'
export DB_USERNAME='user'
export DB_PASSWORD='cambia-esta-clave'
export EXTERNAL_API_BASE_URL='http://localhost:1080'
export EXTERNAL_API_TIMEOUT='5s'
./mvnw spring-boot:run
```

Estas variables solo están disponibles en esa sesión. Para hacerlas persistentes, añádelas al archivo de configuración de tu shell (por ejemplo, `~/.bashrc`) y abre una terminal nueva.

También puedes copiar `.env.example` a `.env` como referencia, pero Spring Boot no carga automáticamente ese archivo: debes exportar sus valores al entorno antes de arrancar la aplicación.
