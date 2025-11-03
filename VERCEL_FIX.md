# Solución al Error 404 en Vercel

## Problema
Estás obteniendo errores 404 porque Vercel no encuentra los archivos generados.

## Solución Paso a Paso

### Paso 1: Verificar la configuración en Vercel Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **General**
3. **IMPORTANTE**: Verifica el **Root Directory**:
   - Si está vacío o es `/` → Vercel está usando la raíz del proyecto
   - Si es `frontend` → Vercel está usando el directorio frontend

### Paso 2: Configurar según el Root Directory

#### Opción A: Root Directory = `/` (Raíz del proyecto)

Si el Root Directory está vacío o es `/`, entonces:

1. **NO** necesitas cambiar nada en Vercel Dashboard
2. El archivo `vercel.json` en la **raíz** del proyecto se usará automáticamente
3. Este archivo ya está configurado correctamente con:
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

#### Opción B: Root Directory = `frontend`

Si el Root Directory está configurado como `frontend`, entonces:

1. Ve a **Settings** → **General**
2. Cambia el **Root Directory** a vacío (`/`) o elimínalo
3. Guarda los cambios
4. O alternativamente, deja `frontend` como Root Directory pero asegúrate de que el archivo `frontend/vercel.json` exista

### Paso 3: Verificar Build Settings

1. Ve a **Settings** → **Build & Development Settings**
2. Asegúrate de que:
   - **Framework Preset**: `Other` o `None`
   - Si está configurado como `Angular`, cámbialo a `Other`
3. **IMPORTANTE**: Si el `vercel.json` está configurado correctamente, estos campos pueden quedar vacíos (Vercel los leerá del `vercel.json`)

### Paso 4: Hacer un nuevo deployment

1. Haz commit y push de los cambios:
   ```bash
   git add .
   git commit -m "Fix Vercel configuration"
   git push
   ```

2. O desde Vercel Dashboard:
   - Ve a **Deployments**
   - Haz clic en los tres puntos del último deployment
   - Selecciona **Redeploy**

### Paso 5: Verificar los Build Logs

1. Ve a **Deployments** → último deployment
2. Haz clic en el deployment
3. Ve a **Build Logs**
4. Busca la línea que dice algo como:
   ```
   Output location: .../dist/toggl-dashboard
   ```
5. Verifica que al final del build, Vercel encuentre:
   - `frontend/dist/toggl-dashboard/browser/index.html` (si Root = `/`)
   - O `dist/toggl-dashboard/browser/index.html` (si Root = `frontend`)

### Paso 6: Verificar el Output Directory

En los Build Logs, busca una línea como:
```
Ready! Output directory: frontend/dist/toggl-dashboard/browser
```

Si no coincide con el `outputDirectory` en `vercel.json`, hay un problema.

## Solución Rápida (Si nada funciona)

1. **Elimina** el Root Directory en Vercel (déjalo vacío)
2. **Asegúrate** de que el archivo `vercel.json` esté en la **raíz** del proyecto (no en `frontend/`)
3. **Elimina** el `frontend/vercel.json` si existe
4. **Configura manualmente** en Vercel:
   - Framework: `Other`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist/toggl-dashboard/browser`
   - Install Command: `cd frontend && npm install`
5. **Añade** un rewrite rule:
   - Source: `/(.*)`
   - Destination: `/index.html`
6. **Haz un nuevo deployment**

## Verificación Final

Después del deployment exitoso, deberías ver:
- ✅ Build completado sin errores
- ✅ Output directory: `frontend/dist/toggl-dashboard/browser` (o similar)
- ✅ La aplicación cargando en `https://toggl-dashboard.vercel.app/`

## Archivos Importantes

- `vercel.json` (raíz): Para cuando Root Directory = `/`
- `frontend/vercel.json`: Para cuando Root Directory = `frontend`
- `frontend/package.json`: Debe tener el script `vercel-build` (ya está añadido)

## Nota Técnica

Angular 17 con el builder `application` genera archivos en:
```
dist/toggl-dashboard/browser/
  ├── index.html
  ├── main-[hash].js
  ├── polyfills-[hash].js
  ├── styles-[hash].css
  └── assets/
```

El `outputDirectory` debe apuntar a `/browser` porque ahí es donde están los archivos servibles.
