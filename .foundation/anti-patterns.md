---
version: "1.0.0"
generated_at: "2026-11-23T08:38:20.856Z"
last_modified_by: "discovery-knowledge"
last_modified_by_version: "2.0.10"
foundation_hash: "1f0c346f10e2844df99fc2ef87149523c18c7485d0595406733a4b9ad2374f37"
produced_from:
  - "docs/requirements.md"
---
# Anti-Patterns

Level: 1 (Global)
Scope: Governance
Category: Engineering Standards
Purpose: Previene implementaciones que debiliten las reglas de negocio o hagan difícil probar las integraciones de usuarios y salas. Las detecciones se adaptan a la estructura Java/Spring esperada; confirmar su ajuste cuando exista código de aplicación.

## Lista de verificación

- [ ] Las reglas de negocio no están implementadas en el controlador HTTP (G-01).
- [ ] Cada modelo de solicitud/respuesta contiene todos los campos acordados para su operación (G-02).
- [ ] No se añade una interfaz sin necesidad de sustitución o polimorfismo (G-03).

## AP-001 — Lógica de negocio en el controlador

**Viola:** G-01.

El controlador no debe decidir si el email está duplicado, si el DNI es válido, ni qué canal de notificación corresponde al rol.

❌ **Incorrecto:**

```java
if ("superadmin".equals(request.rol())) {
    smsClient.send(request.phone(), "usuario guardado");
}
```

✅ **Correcto:**

```java
return userService.create(request);
```

**Detección (revisión dirigida):**

```powershell
Get-ChildItem src\main\java -Recurse -Filter *Controller.java |
  Select-String -Pattern 'repository|checkDni|emailClient|smsClient'
```

Una coincidencia es una señal para revisar la responsabilidad; no constituye por sí sola un defecto.

## AP-002 — Modelos parciales entre capas

**Viola:** G-02.

No descartar silenciosamente campos de la solicitud necesaria para el flujo de alta ni transportar entidades parcialmente inicializadas entre capas. Los campos requeridos por el contrato deben estar definidos explícitamente.

❌ **Incorrecto:** construir un objeto de usuario con solo nombre y email y perder teléfono, rol o DNI al delegar el alta.

✅ **Correcto:** modelar explícitamente el cuerpo de alta acordado y mapearlo de forma completa a los modelos internos pertinentes.

**Detección (revisión dirigida):**

```powershell
Get-ChildItem src\main\java -Recurse -Include *Request.java,*Dto.java |
  Select-String -Pattern 'name|email|phone|rol|dni'
```

Comparar los modelos de alta con el contrato acordado; el patrón no identifica automáticamente modelos incompletos.

## AP-003 — Abstracción sin necesidad

**Viola:** G-03.

No crear interfaces y clases `Impl` duplicadas por defecto. La abstracción del framework es valorada, pero una interfaz sin una necesidad de sustitución añade complejidad sin beneficio demostrado.

❌ **Incorrecto:**

```java
interface UserService { long create(CreateUserRequest request); }
class UserServiceImpl implements UserService { /* única implementación */ }
```

✅ **Correcto:** usar un servicio concreto y extraer una interfaz cuando exista una segunda implementación, un límite de módulo necesario o una razón verificable de prueba.

**Detección (revisión dirigida):**

```powershell
Get-ChildItem src\main\java -Recurse -Filter *.java |
  Select-String -Pattern 'interface \w+Service|class \w+ServiceImpl'
```

Revisar cada coincidencia y confirmar si hay más de una implementación o un motivo de desacoplamiento.

## 📎 Sources

- `docs/requirements.md` — exige abstracción de Spring, valora patrones y define los límites funcionales que deben permanecer comprobables.
