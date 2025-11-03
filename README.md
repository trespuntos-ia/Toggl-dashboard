# 📊 Toggl Dashboard

Una aplicación React moderna para gestionar y visualizar tiempos de múltiples cuentas de Toggl en un solo lugar.

## ✨ Características

- ✅ **Gestión de múltiples cuentas**: Añade y guarda varias cuentas de Toggl
- ✅ **Filtros avanzados**: Selecciona workspace, cliente, proyecto y tag para cada cuenta
- ✅ **Vista consolidada**: Combina resultados de múltiples cuentas en una sola tabla
- ✅ **Información completa**: Muestra responsable, descripción, duración, fechas y más
- ✅ **Almacenamiento local**: Las cuentas se guardan en tu navegador de forma segura

## 🚀 Instalación

1. Clona o descarga este repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Inicia el servidor de desarrollo:

```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:5173`

## 📝 Uso

### Añadir una cuenta de Toggl

1. Haz clic en "+ Añadir Cuenta"
2. Ingresa un nombre para la cuenta (ej: "Mi Cuenta Personal")
3. Ingresa tu API Token de Toggl
4. Haz clic en "Guardar Cuenta"

### Obtener tu API Token de Toggl

1. Inicia sesión en [Toggl](https://track.toggl.com)
2. Ve a tu perfil (arriba a la derecha)
3. Selecciona "Profile settings"
4. En la sección "API token", copia tu token
5. Pega el token en la aplicación

### Configurar filtros

1. Selecciona una cuenta de las guardadas
2. Elige un workspace (obligatorio)
3. Opcionalmente selecciona cliente, proyecto y/o tag
4. Opcionalmente establece fechas de inicio y fin
5. Los resultados se cargan automáticamente

### Añadir más cuentas

1. Selecciona otra cuenta de las guardadas
2. Configura sus filtros
3. Los resultados se combinarán automáticamente

## 🚢 Despliegue en Vercel

Esta aplicación está lista para desplegarse en Vercel:

1. Haz push de tu código a GitHub
2. Ve a [Vercel](https://vercel.com)
3. Importa tu repositorio
4. Vercel detectará automáticamente que es un proyecto Vite
5. Haz clic en "Deploy"

La aplicación se desplegará automáticamente. No se necesitan variables de entorno para esta aplicación.

## 🛠️ Tecnologías

- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Axios** - Cliente HTTP
- **Toggl Track API v9** - API oficial de Toggl

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un issue o pull request.

