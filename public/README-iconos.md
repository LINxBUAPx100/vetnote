# Íconos de la PWA

El `favicon.svg` ya está incluido. Para una instalación PWA completa faltan los
PNG (no se generan automáticamente). Genera estos archivos y colócalos aquí:

- `pwa-192x192.png` (192×192)
- `pwa-512x512.png` (512×512, sirve también como maskable)
- `apple-touch-icon.png` (180×180)

## Forma rápida de generarlos

Con [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator public/favicon.svg public --icon-only --favicon --padding "10%" --background "#2F6F64"
```

O sube el `favicon.svg` a https://realfavicongenerator.net y descarga el paquete.

Mientras falten, la app compila y funciona; solo la instalación como app móvil
mostrará un ícono genérico.
