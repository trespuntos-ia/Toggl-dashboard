# Toggl Dashboard Backend

API backend para el dashboard de Toggl desarrollado con Laravel.

## Instalación

1. Instalar dependencias:
```bash
composer install
```

2. Copiar el archivo de configuración:
```bash
cp .env.example .env
```

3. Generar la clave de la aplicación:
```bash
php artisan key:generate
```

4. Crear la base de datos SQLite:
```bash
touch database/database.sqlite
```

5. Ejecutar las migraciones:
```bash
php artisan migrate
```

6. Iniciar el servidor:
```bash
php artisan serve
```

El servidor estará disponible en `http://localhost:8000`
