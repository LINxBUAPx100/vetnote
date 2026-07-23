# VetNote 🐾🩺

PWA de notas clínicas veterinarias. Registra pacientes y consultas, genera notas
listas para WhatsApp e imágenes clínicas, y conserva el historial — todo
almacenado en **Google Sheets** mediante **Google Apps Script** como backend.
El frontend (React + TypeScript + Vite) se aloja en **GitHub Pages**.

> ⚠️ App pública con token compartido. No es un sistema hospitalario certificado.
> Ver [`docs/01-arquitectura.md`](docs/01-arquitectura.md).

## Stack
React · TypeScript · Vite · Tailwind · React Router (Hash) · React Hook Form ·
Zod · Zustand · TanStack Query · Dexie (IndexedDB) · html-to-image · vite-plugin-pwa
· date-fns. Backend: Google Apps Script + Google Sheets.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa VITE_API_URL y VITE_APP_TOKEN
npm run dev
```

Scripts: `npm run build` · `npm run test` · `npm run typecheck` · `npm run lint`.

## Estructura

```
src/            Frontend React (features, services, components, types…)
apps-script/    Backend Google Apps Script (.gs) — pegar en el editor de Apps Script
docs/           Diseño técnico: arquitectura, datos, API, diseño, roadmap, despliegue
.github/        CI/CD a GitHub Pages
```

## Puesta en marcha (producción)
Guía paso a paso para administrador: [`docs/06-despliegue.md`](docs/06-despliegue.md).

1. Crear *VetNote_Database* y desplegar el backend Apps Script (`setupDatabase`).
2. Configurar variables `VITE_*` en GitHub Actions.
3. `push` a `main` → GitHub Pages publica.

## Documentación
- [Arquitectura](docs/01-arquitectura.md)
- [Modelo de datos](docs/02-modelo-datos.md)
- [Contrato de API](docs/03-api-contrato.md)
- [Sistema de diseño](docs/04-sistema-diseno.md)
- [Roadmap y aceptación](docs/05-roadmap.md)
- [Despliegue y respaldo](docs/06-despliegue.md)
- [Manual de uso](docs/07-manual-uso.md)
