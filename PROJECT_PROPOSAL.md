# Propuesta de Arquitectura - Sistema de Reportes Toggl

## 🎯 Objetivos del Nuevo Sistema

1. **Reportes Gestionables**: Crear, editar, eliminar reportes con múltiples cuentas y filtros
2. **URLs Compartibles**: Cada reporte tiene una URL única que los clientes pueden visitar
3. **Auto-actualización**: Los reportes se actualizan automáticamente cada 2 horas
4. **Datos Históricos**: Subir PDFs de Toggl para datos anteriores al límite de la API (60-90 días)
5. **Procesamiento de PDFs**: Extraer datos de reportes PDF de Toggl y convertirlos al formato de la aplicación

---

## 📋 Estructura de Datos

### 1. **Reporte** (Tabla principal)
```typescript
interface Report {
  id: string;                    // UUID único
  name: string;                  // Nombre del reporte (ej: "Cliente ABC - Q1 2025")
  slug: string;                  // URL-friendly (ej: "cliente-abc-q1-2025")
  description?: string;           // Descripción opcional
  client_name?: string;           // Nombre del cliente (para personalización)
  
  // Configuración de horas contratadas
  contracted_hours?: number;      // Horas contratadas con el cliente
  start_date?: string;            // Fecha de inicio del contrato
  
  // Configuración de actualización
  auto_refresh_enabled: boolean;
  refresh_interval_hours: number; // Por defecto 2
  last_refreshed_at?: string;
  next_refresh_at?: string;
  
  // Configuración de fechas
  date_range_start?: string;      // Fecha inicio del reporte
  date_range_end?: string;        // Fecha fin del reporte
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;            // Para futura autenticación
}
```

### 2. **Configuración de Cuenta en Reporte**
```typescript
interface ReportAccountConfig {
  id: string;
  report_id: string;
  account_id: string;            // Referencia a toggl_accounts
  account_name: string;           // Snapshot del nombre
  
  // Filtros específicos para esta cuenta en este reporte
  workspace_id?: number;
  client_id?: number;
  project_id?: number;
  tag_id?: number;
  
  // Orden de prioridad si hay múltiples cuentas
  priority: number;
  
  created_at: string;
}
```

### 3. **Datos Históricos de PDF**
```typescript
interface HistoricalPDFData {
  id: string;
  report_id: string;
  account_id: string;
  
  // Metadata del PDF
  file_name: string;
  file_url: string;              // URL en Supabase Storage
  file_size: number;
  uploaded_at: string;
  
  // Datos extraídos del PDF
  date_range_start: string;
  date_range_end: string;
  entries: TimeEntryResult[];     // Datos parseados del PDF
  
  // Metadata de procesamiento
  processed_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
}
```

### 4. **Resultados Consolidados**
```typescript
interface ReportResult {
  report_id: string;
  
  // Datos combinados
  entries: TimeEntryResult[];     // De API + PDFs
  
  // Estadísticas básicas
  total_duration: number;         // En segundos
  total_entries: number;
  date_range: {
    start: string;
    end: string;
  };
  
  // Estadísticas de horas (si hay horas contratadas)
  hours_summary?: {
    contracted: number;           // Horas contratadas
    consumed: number;             // Horas consumidas (en horas)
    consumed_percentage: number;   // Porcentaje consumido
    available: number;             // Horas disponibles
    start_date?: string;          // Fecha de inicio del contrato
  };
  
  // Proyecciones y análisis
  projections?: {
    consumption_rate_per_week: number;  // Horas/semana (promedio últimas 4 semanas)
    weeks_until_exhaustion?: number;    // Semanas hasta agotar horas
    monthly_average: number;            // Promedio mensual
    peak_month?: {                      // Mes con más horas
      month: string;
      hours: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  
  // Distribuciones
  distribution_by_description?: Array<{
    description: string;
    hours: number;
    percentage: number;
    color?: string;
  }>;
  
  distribution_by_team_member?: Array<{
    name: string;
    role?: string;
    hours: number;
    percentage: number;
  }>;
  
  consumption_by_month?: Array<{
    month: string;
    hours: number;
    cumulative: number;  // Acumulado
  }>;
  
  // Entradas agrupadas
  grouped_entries?: Array<{
    description: string;           // Descripción base del grupo
    entries: TimeEntryResult[];    // Entradas que pertenecen a este grupo
    total_hours: number;           // Horas totales del grupo
    total_entries: number;         // Número de entradas
    percentage_of_total: number;    // Porcentaje del total filtrado
    responsible: Array<{           // Responsables únicos del grupo
      name: string;
      hours: number;
    }>;
  }>;
  
  // Últimas entradas
  latest_entries?: TimeEntryResult[]; // Las 10 más recientes
  
  // Metadata
  generated_at: string;
  data_sources: {
    api: number;                  // Número de entradas de API
    pdfs: number;                 // Número de entradas de PDFs
  };
}
```

---

## 🏗️ Arquitectura Propuesta

### **Frontend (React)**

#### Páginas/Componentes:
1. **Dashboard Principal** (`/`)
   - Lista de todos los reportes
   - Crear nuevo reporte
   - Editar/Eliminar reportes existentes

2. **Editor de Reporte** (`/reports/:id/edit`)
   - Seleccionar cuentas de Toggl
   - Configurar filtros por cuenta (workspace, cliente, proyecto, tag)
   - Configurar fechas (máximo 90 días para API)
   - Subir PDFs para datos históricos
   - Configurar auto-refresh

3. **Vista de Reporte** (`/reports/:slug`)
   - Vista pública (sin autenticación)
   - **Panel de métricas de horas** (si hay horas contratadas):
     * Horas contratadas
     * Horas consumidas (con porcentaje)
     * Horas disponibles
     * Barra de progreso visual
     * Proyección de agotamiento
   - **Gráficos y visualizaciones**:
     * Distribución de horas por descripción (donut chart)
     * Horas por miembro del equipo (bar chart)
     * Consumo acumulado por meses (bar chart con tendencia)
   - **Últimas 10 entradas**:
     * Lista de las 10 entradas más recientes
     * Muestra: descripción, proyecto, responsable, fecha, horas
     * Diseño compacto y visual
   - **Todas las entradas agrupadas**:
     * Botón "Ver todas las tareas →"
     * Entradas agrupadas por descripción similar
     * Cada grupo muestra:
       - Título de la descripción
       - Número de entradas
       - Responsable(s) y horas totales del grupo
       - Horas totales del grupo y porcentaje del total
       - Expandir/Colapsar para ver entradas individuales
     * Funcionalidad de expandir/colapsar todo
     * Filtros por: Proyectos, Tags, Fechas
   - Auto-refresh cada 2 horas (o según configuración)
   - Indicador de última actualización

4. **Gestor de PDFs** (dentro del editor)
   - Lista de PDFs subidos
   - Ver estado de procesamiento
   - Eliminar PDFs
   - Re-procesar si hay errores

### **Backend (Supabase + Vercel Functions)**

#### Funciones Serverless:

1. **`/api/reports/:id/refresh`** (POST)
   - Actualiza un reporte específico
   - Obtiene datos de API (si están en rango)
   - Combina con datos de PDFs
   - Guarda resultados en Supabase
   - Actualiza `last_refreshed_at` y `next_refresh_at`

2. **`/api/pdf/upload`** (POST)
   - Recibe archivo PDF
   - Sube a Supabase Storage
   - Inicia proceso de extracción
   - Retorna ID del proceso

3. **`/api/pdf/process`** (POST)
   - Procesa PDF de Toggl
   - Extrae datos usando librería PDF parser
   - Convierte a formato `TimeEntryResult[]`
   - Guarda en `historical_pdf_data`

4. **`/api/reports/:slug/data`** (GET)
   - Obtiene datos consolidados de un reporte
   - Combina API + PDFs
   - Calcula estadísticas de horas (si hay horas contratadas):
     * Horas consumidas vs contratadas
     * Proyecciones y tendencias
     * Distribuciones por descripción, equipo, meses
   - Retorna resultados formateados

### **Base de Datos (Supabase)**

#### Tablas:
1. **`reports`** - Reportes principales
2. **`report_account_configs`** - Configuración de cuentas por reporte
3. **`historical_pdf_data`** - PDFs subidos y sus datos
4. **`report_results`** - Resultados consolidados (cache)
5. **`toggl_accounts`** - (ya existe)
6. **`api_cache`** - (ya existe)

---

## 🔄 Flujo de Datos

### **Creación de Reporte:**
```
1. Usuario crea reporte con nombre
2. Selecciona cuentas de Toggl
3. Configura filtros por cuenta
4. Configura rango de fechas
5. Guarda reporte → Se genera slug único
6. Se crea URL: /reports/{slug}
```

### **Actualización Automática:**
```
1. Cron job (Vercel Cron o Supabase Edge Function) cada hora
2. Busca reportes con auto_refresh_enabled = true
3. Para cada reporte donde next_refresh_at <= ahora:
   - Llama a /api/reports/:id/refresh
   - Obtiene datos de API (si aplica)
   - Combina con datos de PDFs
   - Guarda resultados
   - Actualiza next_refresh_at = ahora + refresh_interval_hours
```

### **Procesamiento de PDF:**
```
1. Usuario sube PDF en editor
2. PDF se sube a Supabase Storage
3. Se crea registro en historical_pdf_data con status='pending'
4. Se dispara función /api/pdf/process
5. Función extrae datos del PDF usando pdf-parse o pdfjs-dist
6. Convierte datos a formato TimeEntryResult[]
7. Guarda en historical_pdf_data con status='completed'
8. Si hay error, guarda error_message y status='error'
```

### **Vista Pública:**
```
1. Cliente visita /reports/{slug}
2. Frontend llama a /api/reports/:slug/data
3. Backend:
   - Obtiene configuración del reporte
   - Obtiene resultados de report_results (cache)
   - Si cache está desactualizado, regenera:
     * Obtiene datos de API (si aplica)
     * Obtiene datos de PDFs históricos
     * Combina y ordena por fecha
   - Retorna datos consolidados
4. Frontend muestra tabla con resultados
5. Auto-refresh cada 2 horas (o según configuración)
```

---

## 📄 Procesamiento de PDFs de Toggl

### **Estrategia de Extracción:**

Los PDFs de Toggl tienen un formato estándar. Necesitamos:

1. **Librería**: `pdf-parse` o `pdfjs-dist` (más robusta)
2. **Extracción de texto**: Parsear el PDF a texto estructurado
3. **Detección de formato**: Identificar columnas y filas
4. **Mapeo de datos**:
   - Fecha
   - Descripción
   - Cliente
   - Proyecto
   - Tag
   - Duración
   - Responsable/Usuario

### **Estructura Esperada del PDF:**
Basándome en reportes típicos de Toggl:
```
- Header: Título, rango de fechas, workspace
- Tabla con columnas:
  * Date / Fecha
  * Description / Descripción
  * Client / Cliente
  * Project / Proyecto
  * User / Usuario
  * Duration / Duración
  * Tags / Etiquetas
- Filas con datos de time entries
- Footer: Totales, estadísticas
```

### **Implementación:**
```typescript
// api/pdf-processor.ts
async function processTogglPDF(pdfBuffer: Buffer): Promise<TimeEntryResult[]> {
  // 1. Parsear PDF
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text;
  
  // 2. Detectar estructura (tabla)
  const lines = text.split('\n');
  
  // 3. Encontrar inicio de tabla (después de headers)
  // 4. Parsear filas
  // 5. Extraer datos por columna
  // 6. Convertir a TimeEntryResult[]
  
  return entries;
}
```

---

## 🛠️ Tecnologías Necesarias

### **Nuevas Dependencias:**
```json
{
  "pdf-parse": "^1.1.1",           // Para procesar PDFs
  "uuid": "^9.0.0",                // Para generar IDs únicos
  "slugify": "^1.6.5",             // Para generar slugs
  "recharts": "^2.10.0",           // Para gráficos (donut, bar, etc)
  "date-fns": "^2.30.0"            // Para cálculos de fechas y proyecciones
}
```

### **Supabase Features:**
- **Storage**: Para guardar PDFs
- **Edge Functions**: Para procesamiento de PDFs (opcional, más potente)
- **Database**: Para todas las tablas
- **Cron Jobs**: Para auto-refresh (o usar Vercel Cron)

---

## 📝 Plan de Implementación

### **Fase 1: Estructura Base**
1. Crear tablas en Supabase
2. Crear tipos TypeScript
3. Crear servicio de reportes
4. UI básica de lista de reportes

### **Fase 2: Editor de Reportes**
1. Formulario de creación/edición
2. Selector de cuentas múltiples
3. Configuración de filtros por cuenta
4. Configuración de fechas (con límite de 90 días)
5. Guardar reportes

### **Fase 3: Vista Pública**
1. Página pública con slug
2. Obtener y mostrar datos consolidados
3. Tabla con resultados
4. Indicadores de actualización

### **Fase 4: Auto-refresh**
1. Implementar cron job
2. Función de refresh
3. Actualización automática

### **Fase 5: Procesamiento de PDFs**
1. Upload de PDFs
2. Procesamiento básico
3. Extracción de datos
4. Integración con resultados

### **Fase 6: Mejoras**
1. Edición de reportes
2. Eliminación
3. Gestión de PDFs
4. Mejoras de UI/UX

---

## ❓ Preguntas para Decidir

1. **Autenticación**: ¿Quieres que los usuarios se autentiquen para crear reportes, o será abierto?
2. **Permisos**: ¿Quién puede editar/eliminar reportes? ¿Solo el creador?
3. **Límite de PDFs**: ¿Cuántos PDFs por reporte? ¿Hay límite de tamaño?
4. **Storage**: ¿Los PDFs se guardan permanentemente o se pueden eliminar después de procesar?
5. **Procesamiento**: ¿Síncrono o asíncrono? (asíncrono es mejor para PDFs grandes)

---

## 🎨 UI/UX Propuesta

### **Dashboard:**
```
┌─────────────────────────────────────────┐
│  Toggl Reports Dashboard                │
├─────────────────────────────────────────┤
│  [+ Crear Nuevo Reporte]                │
│                                         │
│  Reportes Existentes:                   │
│  ┌───────────────────────────────────┐ │
│  │ Cliente ABC - Q1 2025             │ │
│  │ /reports/cliente-abc-q1-2025       │ │
│  │ Última actualización: hace 1h      │ │
│  │ [Editar] [Eliminar] [Ver]          │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Editor:**
```
┌─────────────────────────────────────────┐
│  Editar Reporte                         │
├─────────────────────────────────────────┤
│  Nombre: [Cliente ABC - Q1 2025]       │
│  URL: /reports/cliente-abc-q1-2025      │
│  Cliente: [Cliente ABC]                │
│                                         │
│  Horas Contratadas:                     │
│  ☑ Habilitar cálculo de horas          │
│  Horas totales: [80]                    │
│  Fecha inicio: [2025-08-05]            │
│                                         │
│  Cuentas:                               │
│  ☑ Cuenta 1 (Workspace A, Proyecto X)  │
│  ☑ Cuenta 2 (Workspace B, Cliente Y)   │
│  [+ Añadir Cuenta]                     │
│                                         │
│  Rango de Fechas:                       │
│  Desde: [2025-01-01]                   │
│  Hasta: [2025-03-31] (máx 90 días)    │
│                                         │
│  PDFs Históricos:                       │
│  [+ Subir PDF]                          │
│  • reporte-2024-q4.pdf (procesado)     │
│  • reporte-2024-q3.pdf (procesado)     │
│                                         │
│  Auto-actualización: ☑ Cada 2 horas   │
│                                         │
│  [Guardar] [Cancelar]                  │
└─────────────────────────────────────────┘
```

### **Vista Pública de Reporte:**
```
┌─────────────────────────────────────────┐
│  Resumen del paquete contratado          │
├─────────────────────────────────────────┤
│  📊 MÉTRICAS DE HORAS                    │
│  ┌─────────┬─────────┬─────────┐        │
│  │ 80h     │ 37h     │ 43h     │        │
│  │ Contrat │ Consum  │ Dispon  │        │
│  │ 46%     │         │         │        │
│  └─────────┴─────────┴─────────┘        │
│  [████████████░░░░░░░░] 46%             │
│                                         │
│  📈 DISTRIBUCIÓN DE HORAS                │
│  ┌─────────────────┬─────────────────┐ │
│  │ Por Descripción │ Por Equipo       │ │
│  │ [Donut Chart]   │ [Bar Chart]      │ │
│  └─────────────────┴─────────────────┘ │
│                                         │
│  📅 CONSUMO POR MESES                    │
│  [Bar Chart con acumulado]              │
│                                         │
│  📋 ÚLTIMAS 10 ENTRADAS                  │
│  ┌───────────────────────────────────┐ │
│  │ Descripción | Proyecto | Usuario   │ │
│  │ 1. Task A   | Proj X  | Dani (2h) │ │
│  │ 2. Task B   | Proj Y  | Juan (1h) │ │
│  │ ... (10 entradas)                  │ │
│  └───────────────────────────────────┘ │
│  [Ver todas las tareas →]               │
│                                         │
│  📑 TAREAS AGRUPADAS                    │
│  ┌───────────────────────────────────┐ │
│  │ Filtros: [Proyectos] [Tags] [Fechas]│
│  │ [Expandir Todo] [Colapsar Todo]    │
│  │                                     │
│  │ ▼ Políticas de cancelación (2.9h)  │ │
│  │   2 entradas • Dani (2.9h)         │ │
│  │   40% del total filtrado           │ │
│  │   ┌──────────────────────────────┐ │ │
│  │   │ Task A | Proj X | Dani | 1h │ │ │
│  │   │ Task B | Proj X | Dani | 2h │ │ │
│  │   └──────────────────────────────┘ │ │
│  │                                     │ │
│  │ ▶ Desarrollo front (1.8h)          │ │
│  │   1 entrada • Dani (1.8h)          │ │
│  │   25% del total filtrado           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Última actualización: hace 1h          │
└─────────────────────────────────────────┘
```

---

¿Te parece bien esta propuesta? ¿Quieres que modifique algo antes de empezar a implementar?

