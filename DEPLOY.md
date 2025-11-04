# Guía de Despliegue

## Despliegue del Frontend en Vercel

1. **Preparar el proyecto para producción:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Configurar variables de entorno:**
   - En Vercel, ve a la configuración del proyecto
   - Añade una variable de entorno `API_URL` con la URL de tu backend API

3. **Actualizar la URL de la API en el código:**
   - Edita `frontend/src/app/services/toggl.service.ts`
   - Cambia `API_URL` para usar la variable de entorno o la URL de producción

4. **Desplegar en Vercel:**
   - Conecta tu repositorio de GitHub a Vercel
   - Selecciona el directorio `frontend` como raíz del proyecto
   - Vercel detectará automáticamente Angular y usará la configuración de `vercel.json`

## Despliegue del Backend

El backend Laravel requiere un servidor PHP. Opciones:

### Opción 1: Railway (Recomendado)
1. Crea una cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio
3. Selecciona el directorio `backend`
4. Railway detectará Laravel y configurará automáticamente

### Opción 2: Render
1. Crea una cuenta en [Render](https://render.com)
2. Crea un nuevo Web Service
3. Conecta tu repositorio y selecciona el directorio `backend`
4. Configura:
   - Build Command: `composer install --optimize-autoloader --no-dev`
   - Start Command: `php artisan serve --host=0.0.0.0 --port=$PORT`

### Opción 3: Heroku
1. Crea una cuenta en [Heroku](https://heroku.com)
2. Instala el Heroku CLI
3. Desde el directorio `backend`:
   ```bash
   heroku create
   git push heroku main
   ```

### Configuración del Backend en Producción

1. **Configurar variables de entorno:**
   - `APP_KEY`: Generar con `php artisan key:generate`
   - `APP_ENV`: `production`
   - `APP_DEBUG`: `false`
   - `DB_CONNECTION`: Configurar según tu base de datos
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: Credenciales de la base de datos

2. **Ejecutar migraciones:**
   ```bash
   php artisan migrate --force
   ```

3. **Configurar CORS:**
   - Edita `backend/config/cors.php`
   - Añade la URL de tu frontend en `allowed_origins`

## Notas Importantes

- El frontend necesita conocer la URL del backend. Asegúrate de configurar `API_URL` correctamente.
- El backend debe tener CORS configurado para permitir peticiones desde el frontend.
- Para producción, considera usar una base de datos más robusta que SQLite (MySQL o PostgreSQL).
