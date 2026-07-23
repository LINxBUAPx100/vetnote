# 01 — Arquitectura

## Diagrama

```
Usuario (móvil / tablet / escritorio)
        │
        ▼
React + TypeScript + Vite  (PWA)   ── GitHub Pages (hosting estático)
        │  HTTPS · POST text/plain · JSON
        ▼
Google Apps Script Web App (/exec)  ── capa backend / API
        │
        ▼
Google Sheets (VetNote_Database)    ── fuente de verdad
```

## Responsabilidades

- **Frontend:** UI, formularios, validación inicial (Zod), navegación, estado
  temporal (Zustand), generación de nota e imagen, consumo de API, manejo de
  errores, experiencia offline limitada (IndexedDB/Dexie) y cola de sincronización.
- **Apps Script:** recibir HTTP, validar payload, CRUD, baja lógica, búsqueda,
  historiales, IDs únicos, fechas, evitar duplicados, respuestas JSON
  estandarizadas, seguridad básica (token + rate limit), auditoría.
- **Google Sheets:** base de datos relacional simplificada (una hoja por entidad).

## Decisiones clave

| Tema | Decisión | Motivo |
|---|---|---|
| Transporte | `POST` con `Content-Type: text/plain` | Evita el *preflight* `OPTIONS` que Apps Script no maneja. |
| Token | Dentro del cuerpo JSON | No se pueden usar headers personalizados sin preflight. |
| Router | `HashRouter` | GitHub Pages no reescribe rutas; el hash funciona sin `404.html` (que igual añadimos como respaldo). |
| IDs | UUID (`Utilities.getUuid`) | Prohibido usar número de fila. |
| Borrado | Baja lógica (`status='deleted'`) | Nunca borrado físico por defecto. |
| Concurrencia | `updated_at` optimista → `CONFLICT` | Detecta ediciones desde otro dispositivo. |
| Escrituras | `LockService` (lock corto) | Evita corrupción por concurrencia. |
| Catálogos | `CacheService` (300 s) | Menos lecturas a Sheets. |

## Seguridad — limitaciones reales (IMPORTANTE)

VetNote es una **aplicación pública alojada en GitHub Pages**. Cualquiera con la
URL puede cargar el frontend. La protección se basa en un **token compartido**
que viaja en el tráfico de red y, por tanto, **es visible para quien inspeccione
las peticiones**. Medidas implementadas:

- Token de aplicación configurable (`APP_TOKEN` en Script Properties).
- Validación estricta de payload en el servidor (no se confía en el cliente).
- Sanitización de texto y límites de longitud.
- Rate limiting básico por `CacheService`.
- Registro de acciones y errores en `AuditLog`.
- Identificadores no secuenciales (UUID).
- Baja lógica en lugar de borrado físico.

**No implementadas / no garantizadas:** cifrado extremo a extremo, autenticación
robusta de usuarios, control de acceso por roles real, cumplimiento normativo
clínico. **VetNote NO debe tratarse como un sistema hospitalario certificado.**
Es una herramienta de productividad para una clínica pequeña. El respaldo real de
los datos es el propio archivo de Google Sheets (privado en la cuenta de Google
de la clínica).

El frontend **nunca** contiene credenciales privadas, claves de cuenta de
servicio ni acceso directo de escritura a Sheets: toda operación pasa por Apps
Script.
