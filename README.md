# Toggl Dashboard

Aplicación web para gestionar múltiples cuentas de Toggl y visualizar tiempos de trabajo de forma consolidada.

## Estructura del Proyecto

- `backend/`: API REST desarrollada con Laravel
- `frontend/`: Aplicación web desarrollada con Angular

## Características

1. **Gestión de múltiples cuentas de Toggl**: Añade y guarda varias cuentas de Toggl con sus tokens de API
2. **Filtros avanzados**: Selecciona workspace, cliente, proyecto y tags para cada cuenta
3. **Visualización consolidada**: Ver todos los resultados en una tabla con toda la información incluido el responsable

## Instalación

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve
```

El backend estará disponible en `http://localhost:8000`

### Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

El frontend estará disponible en `http://localhost:4200`

## Configuración

### Backend

1. Edita el archivo `.env` en el directorio `backend/`
2. Configura la base de datos (por defecto SQLite)

### Frontend

1. Si necesitas cambiar la URL de la API, edita `src/app/services/toggl.service.ts`
2. La URL por defecto es `http://localhost:8000/api/toggl`

## Uso

1. Añade una o más cuentas de Toggl usando el token de API (puedes obtenerlo en [Toggl Profile](https://track.toggl.com/profile))
2. Selecciona las cuentas que quieres usar
3. Para cada cuenta, selecciona el workspace, cliente, proyecto y tags (todos opcionales excepto workspace)
4. Selecciona el rango de fechas
5. Haz clic en "Cargar Entradas de Tiempo" para ver los resultados consolidados

## Despliegue en Vercel

Para desplegar en Vercel, sigue estos pasos:

1. El frontend Angular se puede desplegar directamente en Vercel
2. El backend Laravel necesitará un servidor PHP. Considera usar:
   - Vercel Serverless Functions (con algunas adaptaciones)
   - O un servicio separado como Railway, Render, o Heroku

## Tecnologías

- **Backend**: Laravel 10, PHP 8.1+
- **Frontend**: Angular 17
- **Base de datos**: SQLite (desarrollo) / MySQL/PostgreSQL (producción)
- **API Externa**: Toggl Track API v9
