-- Schema SQL para Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla para cuentas de Toggl
CREATE TABLE IF NOT EXISTS toggl_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- Para futura autenticación
  name TEXT NOT NULL,
  api_token TEXT NOT NULL, -- En producción, considerar encriptación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para cache de respuestas de API
CREATE TABLE IF NOT EXISTS api_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  account_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_account ON api_cache(account_id);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- Tabla para resultados de time entries
CREATE TABLE IF NOT EXISTS time_entries_results (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL,
  filter_config JSONB NOT NULL,
  results JSONB NOT NULL,
  total_duration INTEGER NOT NULL, -- en segundos
  total_entries INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_time_entries_account ON time_entries_results(account_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_created ON time_entries_results(created_at);

-- Tabla para configuraciones de filtros guardadas
CREATE TABLE IF NOT EXISTS saved_filter_configs (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_filter_configs_account ON saved_filter_configs(account_id);

-- Función para limpiar cache expirado (opcional, puede ejecutarse periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Política RLS (Row Level Security) - Por ahora deshabilitado, pero puedes activarlo más tarde
-- ALTER TABLE toggl_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_entries_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_filter_configs ENABLE ROW LEVEL SECURITY;

