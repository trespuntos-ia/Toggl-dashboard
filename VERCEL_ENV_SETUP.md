# Configuración de Variables de Entorno en Vercel

## ⚠️ Error: "Supabase not configured"

Este error ocurre cuando las variables de entorno de Supabase no están configuradas en Vercel.

## 📋 Pasos para Configurar

### 1. Obtener las credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Copia los siguientes valores:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon/public key** → será `VITE_SUPABASE_ANON_KEY`

### 2. Configurar en Vercel

#### Opción A: Desde el Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona el proyecto `toggl-dashboard`
3. Ve a **Settings** → **Environment Variables**
4. Añade las siguientes variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `tu-anon-key-aqui` | Production, Preview, Development |

5. Haz clic en **Save**
6. **IMPORTANTE**: Debes hacer un nuevo deploy para que las variables se apliquen:
   - Ve a **Deployments**
   - Haz clic en los tres puntos (...) del último deployment
   - Selecciona **Redeploy**

#### Opción B: Desde la CLI de Vercel

```bash
# Configurar variables de entorno
vercel env add VITE_SUPABASE_URL production
# Cuando te pida el valor, pega tu Project URL de Supabase

vercel env add VITE_SUPABASE_ANON_KEY production
# Cuando te pida el valor, pega tu anon key de Supabase

# También añádelas para preview y development si quieres
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_ANON_KEY preview

# Hacer redeploy
vercel --prod
```

### 3. Verificar la Configuración

Después de configurar las variables y hacer redeploy, deberías poder:
- Crear reportes
- Guardar cuentas de Toggl
- Usar el sistema de cache

## 🔍 Verificar que está funcionando

1. Abre la consola del navegador (F12)
2. No deberías ver errores de "Supabase not configured"
3. Intenta crear un reporte nuevo

## 📝 Notas Importantes

- Las variables de entorno que empiezan con `VITE_` son expuestas al cliente
- Usa la **anon key** (no la service role key) para el frontend
- Después de añadir variables, **siempre necesitas hacer un redeploy**
- Las variables están disponibles en `import.meta.env.VITE_SUPABASE_URL` y `import.meta.env.VITE_SUPABASE_ANON_KEY`

## 🆘 Si sigue sin funcionar

1. Verifica que las variables estén en el entorno correcto (Production)
2. Asegúrate de haber hecho redeploy después de añadir las variables
3. Revisa los logs de Vercel para ver si hay errores de build
4. Verifica que las URLs y keys sean correctas (sin espacios extra, sin comillas)

