# Configuración de Supabase

## Pasos para configurar Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y la API Key (anon/public key)

### 2. Ejecutar el schema SQL

1. En el dashboard de Supabase, ve a "SQL Editor"
2. Copia y pega el contenido de `supabase-schema.sql`
3. Ejecuta el script para crear las tablas

### 3. Configurar variables de entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a Settings > Environment Variables
3. Añade las siguientes variables:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Configurar variables de entorno localmente

Crea un archivo `.env.local` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**⚠️ IMPORTANTE**: No subas el archivo `.env.local` a Git. Ya está en `.gitignore`.

### 5. Instalar dependencias

```bash
npm install
```

## Estructura de Datos

### Tablas creadas:

1. **toggl_accounts**: Almacena las cuentas de Toggl
2. **api_cache**: Cache de respuestas de API para evitar límites
3. **time_entries_results**: Historial de resultados de consultas
4. **saved_filter_configs**: Configuraciones de filtros guardadas

## Funcionalidades

- ✅ Guardar cuentas de Toggl en Supabase
- ✅ Cache de respuestas de API (reduce llamadas)
- ✅ Historial de resultados de time entries
- ✅ Guardar configuraciones de filtros favoritas

## Seguridad

- Los API tokens se almacenan en texto plano por ahora. Para producción, considera encriptarlos.
- Puedes activar Row Level Security (RLS) en las tablas cuando añadas autenticación.

