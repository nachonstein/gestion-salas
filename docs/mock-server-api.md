## APIs Expuestas en el Mock-server

### 1. API check-dni
- *Método:* PATCH
- *URL:* http://localhost:1080/check-dni
- *Body de la petición:*
  json
  {
  "dni": "<dni>"
  }

- *Respuestas:*
    - *OK:* Código HTTP 200 para cualquier DNI.
    - *KO:* Código HTTP 409 si el DNI es 99999999w.

---

### 2. API notification
#### Email
- *Método:* POST
- *URL:* http://localhost:1080/email
- *Body de la petición:*
  json
  {
  "email": "<email>",
  "message": "<msg>"
  }

- *Respuesta:*
    - *OK:* Código HTTP 200.

#### SMS
- *Método:* POST
- *URL:* http://localhost:1080/sms
- *Body de la petición:*
  json
  {
  "phone": "<phone>",
  "message": "<msg>"
  }

- *Respuesta:*
    - *OK:* Código HTTP 200.

---