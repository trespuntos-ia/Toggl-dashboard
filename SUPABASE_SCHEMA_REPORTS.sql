-- Schema SQL para el sistema de reportes
-- Ejecuta este script en el SQL Editor de Supabase

-- ============================================
-- TABLA: REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  client_name TEXT,
  
  -- Configuración de actualización
  auto_refresh_enabled BOOLEAN DEFAULT true,
  refresh_interval_hours INTEGER DEFAULT 2,
  last_refreshed_at TIMESTAMP WITH TIME ZONE,
  next_refresh_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuración de fechas
  date_range_start DATE,
  date_range_end DATE,
  
  -- Configuración de horas contratadas
  contracted_hours DECIMAL(10, 2),  -- Horas totales contratadas
  contract_start_date DATE,          -- Fecha de inicio del contrato
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Para futura autenticación
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reports_slug ON reports(slug);
CREATE INDEX IF NOT EXISTS idx_reports_next_refresh ON reports(next_refresh_at) WHERE auto_refresh_enabled = true;

-- ============================================
-- TABLA: REPORT_ACCOUNT_CONFIGS
-- ============================================
CREATE TABLE IF NOT EXISTS report_account_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL, -- Referencia a toggl_accounts.id
  account_name TEXT NOT NULL, -- Snapshot del nombre
  
  -- Filtros específicos
  workspace_id INTEGER,
  client_id INTEGER,
  project_id INTEGER,
  tag_id INTEGER,
  
  -- Orden de prioridad
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(report_id, account_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_report_accounts_report ON report_account_configs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_accounts_account ON report_account_configs(account_id);

-- ============================================
-- TABLA: HISTORICAL_PDF_DATA
-- ============================================
CREATE TABLE IF NOT EXISTS historical_pdf_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL, -- Referencia a toggl_accounts.id
  
  -- Metadata del PDF
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- URL en Supabase Storage
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Datos extraídos
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  entries JSONB NOT NULL, -- Array de TimeEntryResult
  
  -- Metadata de procesamiento
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historical_pdf_report ON historical_pdf_data(report_id);
CREATE INDEX IF NOT EXISTS idx_historical_pdf_account ON historical_pdf_data(account_id);
CREATE INDEX IF NOT EXISTS idx_historical_pdf_status ON historical_pdf_data(processing_status);
CREATE INDEX IF NOT EXISTS idx_historical_pdf_dates ON historical_pdf_data(date_range_start, date_range_end);

-- ============================================
-- TABLA: REPORT_RESULTS (Cache de resultados)
-- ============================================
CREATE TABLE IF NOT EXISTS report_results (
  report_id UUID PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  
  -- Datos consolidados
  entries JSONB NOT NULL, -- Array de TimeEntryResult
  
  -- Estadísticas básicas
  total_duration INTEGER NOT NULL, -- En segundos
  total_entries INTEGER NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Estadísticas de horas (si hay horas contratadas)
  hours_summary JSONB, -- { contracted, consumed, consumed_percentage, available, start_date }
  
  -- Proyecciones y análisis
  projections JSONB, -- { consumption_rate_per_week, weeks_until_exhaustion, monthly_average, peak_month, trend }
  
  -- Distribuciones
  distribution_by_description JSONB, -- Array de { description, hours, percentage, color }
  distribution_by_team_member JSONB, -- Array de { name, role, hours, percentage }
  consumption_by_month JSONB,       -- Array de { month, hours, cumulative }
  
  -- Entradas agrupadas
  grouped_entries JSONB,            -- Array de grupos con entradas similares
  latest_entries JSONB,             -- Últimas 10 entradas (array de TimeEntryResult)
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_sources JSONB NOT NULL, -- { api: number, pdfs: number }
  
  -- Para invalidación de cache
  cache_version INTEGER DEFAULT 1
);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular next_refresh_at
CREATE OR REPLACE FUNCTION calculate_next_refresh(
  last_refresh TIMESTAMP WITH TIME ZONE,
  interval_hours INTEGER
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN COALESCE(last_refresh, NOW()) + (interval_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener reportes que necesitan refresh
CREATE OR REPLACE FUNCTION get_reports_to_refresh()
RETURNS TABLE (
  id UUID,
  name TEXT,
  refresh_interval_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.refresh_interval_hours
  FROM reports r
  WHERE 
    r.auto_refresh_enabled = true
    AND (
      r.next_refresh_at IS NULL 
      OR r.next_refresh_at <= NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Por ahora deshabilitadas, pero preparadas para futura autenticación

-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE report_account_configs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE historical_pdf_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE report_results ENABLE ROW LEVEL SECURITY;

-- Política de ejemplo (cuando tengas autenticación):
-- CREATE POLICY "Users can view their own reports"
--   ON reports FOR SELECT
--   USING (auth.uid()::text = created_by);

