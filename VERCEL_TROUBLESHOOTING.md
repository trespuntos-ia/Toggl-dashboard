# Solución al Error 404 en Vercel - Guía Completa

## Diagnóstico del Problema

Si ves errores 404 y NO hay logs de build en Vercel, significa que:
1. El build no se está ejecutando
2. O los archivos generados no están en el lugar esperado

## Solución Paso a Paso

### Paso 1: Verificar Configuración en Vercel Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **General**
3. **VERIFICA EL ROOT DIRECTORY**:
   - Si está vacío o es `/` → Vercel usa la **raíz del proyecto**
   - Si es `frontend` → Vercel usa el directorio `frontend`

### Paso 2: Configurar Root Directory

#### Si Root Directory = `/` (Raíz del proyecto) - RECOMENDADO

1. En **Settings** → **General**, asegúrate de que **Root Directory** esté **vacío** o sea `/`
2. El archivo `vercel.json` en la raíz se usará automáticamente
3. La configuración ya está lista

#### Si Root Directory = `frontend`

1. En **Settings** → **General**, cambia **Root Directory** a `frontend`
2. El archivo `frontend/vercel.json` se usará automáticamente
3. Asegúrate de que el contenido sea correcto

### Paso 3: Verificar Build Settings

1. Ve a **Settings** → **Build & Development Settings**
2. Asegúrate de que:
   - **Framework Preset**: `Other` o `None`
   - **Build Command**: Debe estar vacío (se usa el del vercel.json)
   - **Output Directory**: Debe estar vacío (se usa el del vercel.json)
   - **Install Command**: Debe estar vacío (se usa el del vercel.json)

### Paso 4: Hacer un Nuevo Deployment

1. Ve a la pestaña **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **Redeploy**
4. O haz push de los cambios al repositorio

### Paso 5: Verificar los Logs del Build

1. Ve al deployment que acabas de crear
2. Haz clic en el deployment para ver los detalles
3. Revisa la pestaña **Build Logs**
4. Deberías ver:
   ```
   Installing dependencies...
   Running "npm run vercel-build"...
   Building...
   ```

### Si Aún Tienes Problemas

#### Opción A: Usar Configuración Manual en Vercel Dashboard

1. Ve a **Settings** → **Build & Development Settings**
2. Configura manualmente:
   - **Framework Preset**: `Other`
   - **Root Directory**: (vacío o `frontend` según tu caso)
   - **Build Command**: `cd frontend && npm install && npm run build` (si root = `/`)
   - **Build Command**: `npm install && npm run build` (si root = `frontend`)
   - **Output Directory**: `frontend/dist/toggl-dashboard/browser` (si root = `/`)
   - **Output Directory**: `dist/toggl-dashboard/browser` (si root = `frontend`)
   - **Install Command**: (dejar vacío)

#### Opción B: Verificar que el Build Funciona Localmente

Ejecuta estos comandos para verificar que el build funciona:

```bash
cd frontend
npm install
npm run build
ls -la dist/toggl-dashboard/browser/
```

Deberías ver archivos como `index.html`, `main-*.js`, `styles-*.css`, etc.

#### Opción C: Simplificar la Configuración

Si nada funciona, prueba esta configuración mínima en `vercel.json` (raíz):

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist/toggl-dashboard/browser",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Estructura Esperada de Archivos

Después del build, Vercel debería encontrar estos archivos:

```
frontend/dist/toggl-dashboard/browser/
├── index.html
├── main-*.js
├── polyfills-*.js
├── styles-*.css
└── favicon.ico
```

## Verificación Final

1. ✅ Build se ejecuta correctamente (ver logs)
2. ✅ Archivos se generan en `dist/toggl-dashboard/browser/`
3. ✅ `vercel.json` está en el lugar correcto
4. ✅ Root Directory está configurado correctamente
5. ✅ Output Directory en `vercel.json` apunta al lugar correcto

