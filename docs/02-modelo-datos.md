# 02 — Modelo de datos (Google Sheets)

Archivo: **VetNote_Database**. Una hoja por entidad. Encabezados fijos en la
fila 1 (congelada). El backend trabaja **por nombre de columna**, no por índice.
Los encabezados canónicos viven en `apps-script/Config.gs` (objeto `HEADERS`).

## Relaciones

```
Owners (1) ───< Patients (1) ───< Consultations
                                      │
                                      └─ parent_consultation_id (auto-referencia, seguimientos)
Templates, Medications, Settings, Users, AuditLog: independientes
```

## Patients
`patient_id (UUID)`, `owner_id`, `name`, `species`, `breed`, `sex`,
`birth_date`, `approximate_age`, `color`, `weight`, `sterilized`, `microchip`,
`clinical_notes`, `created_at`, `updated_at`, `created_by`, `status`.
- `status`: `active | inactive | deleted`.
- El `weight` aquí es el más reciente; cada consulta guarda el peso de ese momento.

## Owners
`owner_id`, `full_name`, `phone`, `secondary_phone`, `email`, `address`,
`notes`, `created_at`, `updated_at`, `status`.
- No se deduplica automáticamente; la clínica confirma si es la misma persona.

## Consultations
`consultation_id`, `patient_id`, `parent_consultation_id`, `consultation_type`,
`consultation_date`, `reason`, `remote_anamnesis`, `current_anamnesis`,
`general_condition`, `temperature`, `heart_rate`, `respiratory_rate`, `weight`,
`mucous_membranes`, `hydration`, `head_neck`, `thorax_forelimbs`,
`abdomen_hindlimbs_anus_tail`, `additional_exam`, `treatment`,
`presumptive_diagnosis`, `differential_diagnosis`, `recommendations`,
`follow_up_date`, `whatsapp_note`, `created_at`, `updated_at`, `created_by`,
`status`.
- `consultation_type`: `consulta | follow_up`.
- `whatsapp_note`: copia exacta del texto generado y enviado en su momento.

## Templates
`template_id`, `name`, `description`, `species`, `category`, `reason`,
`remote_anamnesis`, `current_anamnesis`, `head_neck`, `thorax_forelimbs`,
`abdomen_hindlimbs_anus_tail`, `treatment`, `presumptive_diagnosis`,
`recommendations`, `created_at`, `updated_at`, `status`.

## Medications
`medication_id`, `generic_name`, `commercial_name`, `presentation`,
`concentration`, `route`, `default_instructions`, `notes`, `created_at`,
`updated_at`, `status`. Catálogo auxiliar. **Sin recomendaciones automáticas de dosis.**

## Users
`user_id`, `name`, `email`, `role`, `access_token_hash`, `created_at`,
`last_access`, `status`. Roles futuros: `admin | veterinarian | assistant | receptionist`.

## Settings
`setting_key`, `setting_value`, `description`, `updated_at`. Claves sembradas:
`clinic_name`, `vet_name`, `professional_id`, `phone`, `address`, `logo`,
`primary_color`, `note_footer`, `date_format`, `id_prefix`, `schema_version`.

## AuditLog
`log_id`, `timestamp`, `user_id`, `action`, `entity_type`, `entity_id`,
`summary`, `request_id`, `success`, `error_message`. **No guarda información
clínica completa.**

## Versionado del esquema
`schema_version` en Settings y `CONFIG.SCHEMA_VERSION`. Migraciones en
`Setup.gs` (`ensureHeaders_`): crean columnas faltantes, **no borran datos**,
son idempotentes.

- v1 → estructura inicial (incluye `parent_consultation_id` y `consultation_type`).
