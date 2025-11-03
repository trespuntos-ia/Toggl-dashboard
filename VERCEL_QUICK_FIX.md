# Solución Rápida al Error 404

## El Problema
Vercel está dando 404 porque no encuentra los archivos generados. Esto puede ser porque:
1. El build no se ejecuta
2. Los archivos están en un lugar diferente al esperado
3. La configuración de Vercel no es correcta

## Solución Inmediata (3 pasos)

### Paso 1: Verificar Root Directory en Vercel
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **General**
4. **IMPORTANTE**: Asegúrate de que **Root Directory** esté **VACÍO** (no `frontend`)
5. Guarda los cambios

### Paso 2: Verificar Build Settings
1. Ve a **Settings** → **Build & Development Settings**
2. Configura manualmente:
   - **Framework Preset**: `Other`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist/toggl-dashboard/browser`
   - **Install Command**: `cd frontend && npm install`
3. Guarda los cambios

### Paso 3: Hacer un Nuevo Deployment
1. Ve a la pestaña **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine el build
5. Verifica los logs del build para asegurarte de que se ejecutó correctamente

## Verificar que Funciona

Después del deployment, deberías ver en los logs:
```
✓ Installing dependencies
✓ Building...
✓ Output directory: frontend/dist/toggl-dashboard/browser
```

Si ves estos logs y aún tienes 404, entonces el problema es que Vercel no está encontrando los archivos. En ese caso, prueba:

1. Eliminar el archivo `vercel.json` de la raíz temporalmente
2. Configurar todo manualmente en Vercel Dashboard (como en el Paso 2)
3. Hacer un nuevo deployment

## Si Nada Funciona

Último recurso: Configurar Vercel para usar el directorio `frontend` como root:

1. En **Settings** → **General**, cambia **Root Directory** a `frontend`
2. Elimina el archivo `vercel.json` de la raíz
3. Asegúrate de que `frontend/vercel.json` existe y tiene:
   ```json
   {
     "buildCommand": "npm install && npm run build",
     "outputDirectory": "dist/toggl-dashboard/browser",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
4. Hacer un nuevo deployment

