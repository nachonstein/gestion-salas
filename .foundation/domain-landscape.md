---
version: "1.0.1"
generated_at: "2026-11-23T08:47:16.785Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "dd05d7c2abf0b0d95b88bebe86a74bae0187dacc9a967499be3dd831bd46b447"
produced_from:
  - "docs/requirements.md"
---
# Domain Landscape

Level: 2 (Domain)
Scope: Strategic
Category: Domain Model
Purpose: Establece el vocabulario y las relaciones del dominio de salas y usuarios a partir de los requisitos disponibles; sirve como referencia común para análisis, implementación y pruebas.

## Áreas funcionales

| Área | Responsabilidad | Elementos principales |
|---|---|---|
| Gestión de salas | Agrupar usuarios y mantener su identidad | Sala |
| Gestión de usuarios | Validar, persistir y consultar usuarios | Usuario |
| Verificación de identidad | Validar el DNI antes de guardar | DNI, API externa |
| Notificaciones | Notificar según el rol tras el alta | Email, SMS, rol |

Estas áreas son una descripción lógica del dominio, no una decisión de despliegue en servicios separados.

## Glosario

| Término | Definición |
|---|---|
| Sala | Contenedor identificado por un ID único incremental de tipo `long`; puede contener N usuarios. |
| Usuario | Persona registrada con nombre, email, teléfono, rol y DNI, asociada a una sola sala. |
| Admin | Rol permitido que recibe la notificación de alta por email. |
| Superadmin | Rol permitido que recibe la notificación de alta por SMS. |
| Alta | Operación que valida el usuario, lo almacena y devuelve su ID. La secuencia exacta de persistencia y notificación aún no está definida. |
| DNI | Identificador que se envía a una API externa para validación. |

## Relaciones conceptuales

```text
Sala 1 -------- 0..N Usuario
Usuario 1 ----- 1 Sala
```

La regla `Usuario 1 — 1 Sala` expresa que un usuario registrado pertenece a una única sala; el documento no establece si puede cambiar de sala posteriormente.

## Invariantes de dominio

- La sala tiene un identificador único incremental de tipo `long`.
- Un usuario está asociado a una sola sala.
- El email identifica de forma única al usuario para evitar duplicados.
- El nombre no puede superar 6 caracteres.
- El email debe contener `@` y un punto, según la validación mínima descrita.
- El rol debe ser `admin` o `superadmin`.
- El DNI debe superar la validación externa antes de completar el alta.
- La notificación lleva exactamente el mensaje `usuario guardado`; el canal depende del rol.

## Interacciones

| Desde | Hacia | Interacción | Restricción conocida |
|---|---|---|---|
| Gestión de usuarios | Verificación de identidad | Valida el DNI antes del alta | API externa; protocolo y respuestas no especificados |
| Gestión de usuarios | Persistencia | Guarda y consulta usuarios | PostgreSQL, base `users`, puerto 5432 |
| Gestión de usuarios | Notificaciones | Notifica según el rol | Email para admin; SMS para superadmin |

## 📎 Sources

- `docs/requirements.md` — entidades, cardinalidades, invariantes y reglas funcionales.
