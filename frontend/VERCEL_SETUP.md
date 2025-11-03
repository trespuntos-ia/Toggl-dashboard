# Configuración de Vercel para Angular

## Problema: 404 NOT_FOUND

Si estás obteniendo un error 404, sigue estos pasos:

### Opción 1: Configuración desde el Dashboard de Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **General**
3. En **Root Directory**, selecciona `frontend`
4. Guarda los cambios

### Opción 2: Verificar la configuración del Build

1. Ve a **Settings** → **Build & Development Settings**
2. Asegúrate de que:
   - **Framework Preset**: None o Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/toggl-dashboard/browser`
   - **Install Command**: `npm install`

### Opción 3: Si el proyecto está en la raíz

Si el proyecto completo está en Vercel (no solo el frontend):

1. Crea un archivo `vercel.json` en la **raíz del proyecto** con:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist/toggl-dashboard/browser",
  "installCommand": "cd frontend && npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. O configura el **Root Directory** en Vercel como `frontend`

### Verificar la estructura de archivos

Después del build, Vercel debe encontrar:
- `dist/toggl-dashboard/browser/index.html`
- `dist/toggl-dashboard/browser/main-[hash].js`
- `dist/toggl-dashboard/browser/assets/`

### Solución rápida

Si nada funciona, prueba:

1. Elimina el `vercel.json` actual
2. En Vercel Dashboard, configura manualmente:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/toggl-dashboard/browser`
3. Añade un rewrite rule en Vercel:
   - Source: `/(.*)`
   - Destination: `/index.html`

### Debug

Para ver qué está generando el build:

1. Ve a la pestaña **Deployments**
2. Haz clic en el último deployment
3. Ve a **Build Logs** para ver qué archivos se están generando
4. Verifica que el `outputDirectory` coincida con la estructura real

### Nota sobre Angular 17

Angular 17 con el builder `application` genera archivos en:
- `dist/toggl-dashboard/browser/` (no solo `dist/toggl-dashboard/`)

Asegúrate de que el `outputDirectory` apunte a `/browser`.
