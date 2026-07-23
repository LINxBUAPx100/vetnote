# 04 — Sistema de diseño

## Personalidad
Profesional, cálido, clínico, confiable, sencillo, moderno. Cercano a los
animales **sin** ser infantil. Sin saturación de huellas ni caricaturas.

## Paleta (tokens en `src/styles/index.css` y `tailwind.config.ts`)

| Token | Hex | Uso |
|---|---|---|
| primary | `#2F6F64` | Acción principal, marca |
| primary-dark | `#24584F` | Hover/active |
| secondary | `#5B7FA3` | Acentos secundarios |
| accent | `#D99A4E` | Realces puntuales |
| background | `#F5F7F6` | Fondo de app |
| surface | `#FFFFFF` | Tarjetas, inputs |
| content | `#1F2933` | Texto principal |
| content-muted | `#667085` | Texto secundario |
| border | `#DDE3E1` | Bordes sutiles |
| success | `#348A5B` | Éxito |
| warning | `#C98624` | Advertencia |
| error | `#C94A4A` | Error |

## Tipografía
**Inter** (alternativa Manrope). Títulos fuertes, etiquetas compactas, texto
clínico legible, botones peso medio. Nada decorativo en información clínica.

## Espaciado
Escala: `4 · 8 · 12 · 16 · 24 · 32 px`. Radio de tarjeta 16 px. Sombras muy
ligeras (`shadow-card`, `shadow-floating`).

## Componentes base (clases en `index.css`)
- `.card` — tarjeta con borde sutil y sombra ligera.
- `.btn-primary` / `.btn-ghost` — altura mínima táctil 44 px (`min-h-touch`).
- Skeleton loaders, toasts, estados vacíos útiles, indicadores de guardado.

## Mobile first
Navegación inferior de 5 ítems con botón central de "Nueva consulta" saliente.
Formularios de una columna, botón guardar fijo, campos grandes, teclado por tipo
de dato, autoguardado de borradores. En escritorio: sidebar; misma lógica.

## Navegación
- **Móvil (bottom nav):** Inicio · Pacientes · [＋ Nueva consulta] · Consultas · Más.
- **Escritorio (sidebar):** Inicio · Pacientes · Consultas · Plantillas ·
  Medicamentos · Sincronización · Configuración.

Implementado en `src/components/layout/AppShell.tsx`.
