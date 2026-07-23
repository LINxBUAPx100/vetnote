# 05 — Roadmap y criterios de aceptación

| Fase | Alcance | Aceptación | Estado |
|---|---|---|---|
| 0 | Diseño técnico: docs, esquema, API, tipos, UX, sistema visual | Existen los `docs/` y los tipos | ✅ |
| 1 | Infra: Vite+TS+Tailwind, PWA, apiClient, backend healthCheck + inicializador, CI | `npm run build` pasa; `healthCheck` responde `success:true` | ✅ |
| 2 | Tutores y pacientes: crear/editar/buscar/listar/expediente | CRUD end-to-end contra Sheets | ✅ backend · ▶ frontend |
| 3 | Consultas: wizard 6 pasos, borradores, historial | Guardar consulta end-to-end; borrador persistente | ✅ backend · ▶ frontend |
| 4 | Nota WhatsApp + copiar + imagen + configuración de clínica | Nota correcta, copia, PNG descargable | ▶ |
| 5 | Plantillas + medicamentos + frases frecuentes | Aplicar/crear/duplicar plantilla | ✅ backend · ▶ frontend |
| 6 | Sincronización: IndexedDB, cola, reintentos, conflictos, PWA update | Falla de red sin pérdida de datos; conflicto resuelto | ▶ |
| 7 | Seguridad y auditoría: token, rate limit, auditoría, sanitización, baja lógica | Acciones auditadas; token válido | ✅ (incluye sanitización de teléfono) |
| 8 | Calidad: pruebas, accesibilidad, rendimiento, responsive | Tests verdes; a11y básica | ✅ 19 tests · code-split · a11y básica |
| 9 | Producción: deploy Apps Script + Pages, respaldo, manual | App instalable en producción | ✅ guía + manual · ⧗ despliegue lo ejecuta el usuario |

Leyenda: ✅ hecho · ▶ pendiente/en curso.

## Criterios de aceptación de la v1 (globales)
Abre desde GitHub Pages · instalable como PWA · crea tutores y pacientes ·
guarda en Sheets · crea consulta · mantiene borradores · genera texto WhatsApp ·
copia el texto · genera imagen · muestra historial · busca pacientes · maneja
fallos de conexión sin perder datos · edita registros · auditoría básica ·
funciona en móvil.
