# Design

## Context

See `proposal.md` for the motivation and scope. The approved requirements in `docs/requirements.md` remain the baseline; the decisions below are additional user-approved clarifications and do not alter that source document. The application has not implemented these contracts yet.

## Goals / Non-Goals

**Goals:**
- Keep approved decisions distinct from details explicitly outside the application's contract.
- Preserve `docs/requirements.md` and the foundation metadata as the traceable baseline; do not restore contracts from the excluded `docs/README.md`.
- Ensure every in-scope behavior has a testable contract before implementation.

**Non-Goals:**
- Implement endpoints, database changes, integrations, or retry processing in this change.
- Choose undocumented external service endpoints, response bodies, or retry policies.

## Decisions

| Decision | Approved behavior | Alternatives considered |
|---|---|---|
| HTTP routes | `POST /usuarios`; `GET /usuarios/{id}`, scoped to room 1 | Room-nested routes were offered and not selected |
| Successful responses | POST returns HTTP 201 and `{ "id": "<id>" }`; GET returns all six user fields | None |
| Validation errors | HTTP 409 with `{ "code": 409, "message": "error validation <field>" }`; fields are `userName`, `email`, `rol`, and `dni` | None |
| Input handling | Trim leading/trailing whitespace; require non-empty `name`, `email`, `rol`, and `dni`; `phone` may be empty | Requiring `phone` was not selected |
| Name and email | Store both in lowercase; name maximum remains 6 characters; email requires `@` and `.` and duplicates are case-insensitive | Increasing the name limit to 30 was explicitly declined |
| Role | Accept only exact lowercase `admin` and `superadmin` | Case-insensitive role matching was not selected |
| User ID and room 1 | Use incremental `long` user IDs; create room 1 at startup and fail startup if provisioning fails | Requiring room 1 to be pre-provisioned was not selected |
| Mock-server APIs | DNI: `PATCH http://localhost:1080/check-dni`; email: `POST http://localhost:1080/email`; SMS: `POST http://localhost:1080/sms`, with payloads in the spec. No authentication; 5-second timeout for all calls | No other endpoint or payload is approved by `docs/mock-server-api.md` |
| DNI dependency failure | HTTP 503 with `{ "code": 503, "message": "error de dependencia" }`; do not persist or notify on timeout, unavailability or unexpected status | Treating dependency failure as DNI rejection was not selected |
| Notification ordering and failure | Persist first; on non-200, unavailability or timeout, retain HTTP 201, log without personal data, and do not retry in the application. Provider retry is outside the application's contract; its schedule is not fixed | Failing the create response or retrying in the application was not selected |
| GET response | HTTP 200 returns `id`, `name`, `email`, `phone`, `rol`, `dni`; HTTP 404 returns `{ "code": 404, "message": "user not found" }` | Omitting DNI or returning an empty 404 response was not selected |

The approved error mapping is name → `userName`, invalid/duplicate email → `email`, unsupported role → `rol`, and externally rejected DNI → `dni`. The notification message remains `usuario guardado`; `admin` uses email and `superadmin` uses SMS.

## Risks / Trade-offs

- [Provider retries are not defined by the mock and may not be durable or bounded] → The application does not promise provider delivery; it logs failure, returns the approved response, and performs no local retry.
- [Lowercasing names changes their stored presentation] → Apply this only as explicitly approved; retain no additional normalization assumptions.

## Migration Plan

No runtime migration applies: this change records contracts and decisions only. Implementation can follow the approved contract in the spec.

## Open Questions

No open questions remain within the scope of this change. Provider retry limits and schedules are explicitly out of scope.
