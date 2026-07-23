# 06 — Despliegue y respaldo (guía para administrador sin conocimientos avanzados)

Sigue los pasos **en orden**. Al final tendrás la app funcionando y respaldada.

## Parte A — Crear el Google Sheet y el backend (Apps Script)

1. Entra a https://sheets.google.com con la cuenta de la clínica y crea una
   hoja de cálculo nueva. Renómbrala a **VetNote_Database**.
2. Menú **Extensiones → Apps Script**. Se abre el editor.
3. Borra el `Code.gs` de ejemplo. Crea un archivo por cada `.gs` de la carpeta
   `apps-script/` de este repositorio y **pega su contenido** (mismo nombre).
   - Consejo: crea también el archivo `appsscript.json` (icono ⚙ *Configuración
     del proyecto → Mostrar manifiesto* si no aparece).
4. Guarda (💾). En el selector de función elige **`setupDatabase`** y pulsa
   **Ejecutar**. Autoriza los permisos que pida (es tu propia cuenta).
   - Esto crea las 8 hojas con sus encabezados y siembra plantillas/config.
5. Ejecuta la función **`showAppToken`** y abre **Ver → Registros**. Copia el
   token que aparece (lo necesitarás para el frontend). Puedes cambiarlo en
   *Configuración del proyecto → Propiedades del script → `APP_TOKEN`*.
6. Pulsa **Implementar → Nueva implementación → Aplicación web**:
   - *Ejecutar como:* **Yo**.
   - *Quién tiene acceso:* **Cualquier persona**.
   - Implementa y **copia la URL** que termina en `/exec`.
7. Prueba en el navegador: `TU_URL/exec?action=healthCheck` debe devolver JSON
   con `"success": true`.

> Cada vez que edites el código del backend, vuelve a **Implementar → Gestionar
> implementaciones → editar → Nueva versión** para publicar los cambios.

## Parte B — Publicar el frontend en GitHub Pages

1. Sube este repositorio a GitHub (rama `main`).
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. En **Settings → Secrets and variables → Actions → Variables**, crea:
   - `VITE_API_URL` = la URL `/exec` del paso A6.
   - `VITE_APP_TOKEN` = el token del paso A5.
   - `VITE_BASE_PATH` = `/<nombre-del-repo>/` (ej. `/vetnote/`).
4. Haz `push` a `main`. El workflow `.github/workflows/deploy.yml` compila y
   publica. La URL final aparece en **Actions → deploy → deploy**.
5. Abre la URL en el móvil y usa "Añadir a pantalla de inicio" para instalar la PWA.

## Parte C — Respaldo y recuperación

- **Respaldo principal:** el propio archivo *VetNote_Database* en Google Drive.
  Actívale historial de versiones (Drive lo hace automático) y, opcionalmente,
  *Archivo → Descargar → Excel* periódicamente.
- **Exportación desde la app:** acción `exportData` (JSON) — Fase 4/9.
- **Recuperación:** si borras algo por error, los registros usan **baja lógica**
  (`status='deleted'`), así que siguen en la hoja; basta con cambiar el estado.
  Para restaurar una versión completa, usa el historial de versiones de Google
  Sheets (*Archivo → Historial de versiones*).
- **Nunca** borres hojas ni columnas manualmente; las migraciones de `Setup.gs`
  son aditivas y no destructivas.

## Limitaciones conocidas
Ver `docs/01-arquitectura.md` (sección Seguridad). App pública con token
compartido; no es un sistema clínico certificado.
