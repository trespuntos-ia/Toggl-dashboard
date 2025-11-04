export interface TogglAccount {
  id: string;
  name: string;
  apiToken: string;
}

export interface Workspace {
  id: number;
  name: string;
}

export interface Client {
  id: number;
  name: string;
  wid: number;
}

export interface Project {
  id: number;
  name: string;
  wid: number;
  cid?: number;
  color?: string;
}

export interface Tag {
  id: number;
  name: string;
  wid: number;
}

export interface TimeEntry {
  id: number;
  description: string;
  wid: number;
  pid?: number;
  tid?: number;
  billable: boolean;
  start: string;
  stop?: string;
  duration: number;
  tags?: string[];
  user?: string;
  project?: string;
  client?: string;
  tag?: string;
}

export interface FilterConfig {
  accountId: string;
  workspaceId?: number;
  clientId?: number;
  projectId?: number;
  tagId?: number;
  startDate?: string;
  endDate?: string;
}

export interface TimeEntryResult extends TimeEntry {
  accountName: string;
  responsible: string;
}

// ============ REPORTES ============
export interface Report {
  id: string;
  name: string;
  slug: string;
  description?: string;
  client_name?: string;
  
  // Configuración de horas contratadas
  contracted_hours?: number;
  contract_start_date?: string;
  
  // Configuración de actualización
  auto_refresh_enabled: boolean;
  refresh_interval_hours: number;
  last_refreshed_at?: string;
  next_refresh_at?: string;
  
  // Configuración de fechas
  date_range_start?: string;
  date_range_end?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ReportAccountConfig {
  id: string;
  report_id: string;
  account_id: string;
  account_name: string;
  
  workspace_id?: number;
  client_id?: number;
  project_id?: number;
  tag_id?: number;
  
  priority: number;
  created_at?: string;
}

export interface HistoricalPDFData {
  id: string;
  report_id: string;
  account_id: string;
  
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_at?: string;
  
  date_range_start: string;
  date_range_end: string;
  entries: TimeEntryResult[];
  
  processed_at?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
}

export interface HoursSummary {
  contracted: number;
  consumed: number;
  consumed_percentage: number;
  available: number;
  start_date?: string;
}

export interface Projections {
  consumption_rate_per_week: number;
  weeks_until_exhaustion?: number;
  monthly_average: number;
  peak_month?: {
    month: string;
    hours: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface GroupedEntry {
  description: string;
  entries: TimeEntryResult[];
  total_hours: number;
  total_entries: number;
  percentage_of_total: number;
  responsible: Array<{ name: string; hours: number }>;
}

export interface ReportResult {
  report_id: string;
  
  entries: TimeEntryResult[];
  
  total_duration: number;
  total_entries: number;
  date_range?: {
    start: string;
    end: string;
  };
  
  hours_summary?: HoursSummary;
  projections?: Projections;
  
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
    cumulative: number;
  }>;
  
  grouped_entries?: GroupedEntry[];
  latest_entries?: TimeEntryResult[];
  
  generated_at?: string;
  data_sources: {
    api: number;
    pdfs: number;
  };
}

