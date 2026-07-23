# 03 — Contrato de API

Endpoint único: `POST {WEB_APP_URL}/exec` con cuerpo **text/plain** que contiene
JSON. `doGet?action=healthCheck` también disponible para pruebas rápidas.

## Petición

```json
{
  "action": "createPatient",
  "token": "APP_TOKEN",
  "payload": { },
  "meta": {
    "clientRequestId": "uuid-cliente",
    "expectedUpdatedAt": "2026-07-22T10:00:00.000Z"
  }
}
```

- `token`: debe coincidir con `APP_TOKEN` (Script Properties).
- `meta.clientRequestId`: idempotencia / rate-limit.
- `meta.expectedUpdatedAt`: control de concurrencia optimista (solo en updates).

## Respuesta de éxito

```json
{ "success": true, "data": {}, "message": "Registro creado correctamente", "requestId": "uuid" }
```

## Respuesta de error

```json
{
  "success": false,
  "data": null,
  "message": "No fue posible guardar la consulta",
  "errorCode": "CONSULTATION_CREATE_ERROR",
  "requestId": "uuid"
}
```

En `CONFLICT` se incluye `serverRecord` con la versión actual del servidor.

## Códigos de error
`VALIDATION_ERROR`, `INVALID_TOKEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`,
`QUOTA_LIMIT`, `DUPLICATE`, `INTERNAL_ERROR`, `UNKNOWN_ACTION`,
`CONSULTATION_CREATE_ERROR`, `PATIENT_CREATE_ERROR`.

## Acciones

| Acción | Escribe | Payload principal | Devuelve |
|---|---|---|---|
| `healthCheck` | no | — | `{status, schemaVersion, sheets, serverTime}` |
| `createOwner` | sí | `{full_name, phone, ...}` | Owner |
| `updateOwner` | sí | `{owner_id, ...}` | Owner |
| `getOwner` | no | `{owner_id}` | Owner |
| `searchOwners` | no | `{query, limit}` | `{results[], total}` |
| `listOwners` | no | `{page, pageSize}` | `{results[], total, page, pageSize}` |
| `listPatientsByOwner` | no | `{owner_id}` | `{results[], total}` |
| `createMedication` | sí | `{generic_name, ...}` | Medication |
| `updateMedication` | sí | `{medication_id, ...}` | Medication |
| `createPatient` | sí | `{owner_id, name, species, ...}` | Patient |
| `updatePatient` | sí | `{patient_id, ...}` | Patient |
| `getPatient` | no | `{patient_id}` | Patient + `owner` |
| `searchPatients` | no | `{query, limit}` | `{results[], total}` |
| `listPatients` | no | `{page, pageSize}` | `{results[], total, page, pageSize}` |
| `softDeletePatient` | sí | `{patient_id}` | `{patient_id, status}` |
| `createConsultation` | sí | `{patient_id, ...}` | Consultation |
| `updateConsultation` | sí | `{consultation_id, ...}` | Consultation |
| `getConsultation` | no | `{consultation_id}` | Consultation |
| `getPatientHistory` | no | `{patient_id}` | `{results[], total}` |
| `listRecentConsultations` | no | `{limit}` | `{results[], total}` |
| `softDeleteConsultation` | sí | `{consultation_id}` | `{consultation_id, status}` |
| `createTemplate` | sí | `{name, ...}` | Template |
| `updateTemplate` | sí | `{template_id, ...}` | Template |
| `listTemplates` | no | — | `{results[], total}` |
| `listMedications` | no | — | `{results[], total}` |
| `getSettings` | no | — | `{clave: valor}` |
| `updateSettings` | sí | `{clave: valor, ...}` | settings actualizados |
| `exportData` | no | `{sheets?[]}` | `{exportedAt, schemaVersion, data}` |

El contrato en TypeScript vive en `src/types/api.ts` (`ApiAction`, `ApiRequest`,
`ApiResponse`) y debe mantenerse en sincronía con `apps-script/Router.gs`.
