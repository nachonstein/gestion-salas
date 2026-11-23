# GUS-05 — Integrar validación de DNI y notificaciones

**Prioridad:** P1  
**Objetivo:** Encapsular la API externa de validación de DNI y los canales de email/SMS definidos por rol.  
**Alcance:** Clientes/adaptadores externos configurables y pruebas con dobles controlados. No inventar rutas, payloads, respuestas ni política de reintentos.

## Entradas y salidas

- **Entrada:** DNI, destinatario y rol/mensaje del usuario; contratos técnicos aprobados en GUS-01.
- **Salida:** resultado de validación del DNI y resultado/error de la solicitud de notificación.
- **Persistencia:** ninguna.

## Ramas de decisión

| Condición | Acción | Resultado verificable |
|---|---|---|
| DNI validado por el proveedor | Devolver resultado válido a la aplicación | El alta puede continuar |
| DNI rechazado | Devolver rechazo identificable | El alta no persiste el usuario |
| Rol `admin` | Enviar email al email del usuario con `usuario guardado` | Se invoca únicamente el canal email |
| Rol `superadmin` | Enviar SMS al teléfono del usuario con `usuario guardado` | Se invoca únicamente el canal SMS |
| API externa falla o no responde | Aplicar política acordada en GUS-01 | El fallo se hace visible; no se simula éxito |

## Criterios de aceptación

- [ ] La configuración de URL y credenciales, si aplica, se obtiene del entorno.
- [ ] El cliente respeta el contrato confirmado en GUS-01.
- [ ] El resultado de validación distingue aprobación, rechazo y fallo técnico.
- [ ] Cada rol usa el destinatario, canal y mensaje definidos por los requisitos.
- [ ] Ningún error de red se convierte silenciosamente en validación correcta o notificación exitosa.
- [ ] La lógica de dominio no depende de detalles HTTP del proveedor.

## Especificación de pruebas

- **Unitarias:** probar mapeo de resultados y errores del adaptador con HTTP simulado.
- **Integración:** ejecutar contra servidor de prueba controlado según contrato; nunca enviar email/SMS reales.
- **Aceptación:** verificar con GUS-08 el efecto del resultado del DNI sobre el alta y el canal de notificación.
- **Cobertura:** aprobado, rechazado, fallo técnico y ambos roles; sin porcentaje mínimo predefinido.

## Preguntas abiertas

- GUS-01 debe proporcionar endpoints, métodos, payloads, respuestas, timeouts y política ante fallo.

## Referencias

- `.foundation/domain-landscape.md`
- `.foundation/guardrails.md`
- `.foundation/testing-strategy.md`
- `docs/requirements.md`
