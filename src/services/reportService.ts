import { supabaseService, getSupabaseClient } from './supabaseService';
import type { Report, ReportAccountConfig, ReportResult, HistoricalPDFData, TimeEntryResult } from '../types';
import { ReportCalculations } from './reportCalculations';
import { TogglService } from './togglService';

export const reportService = {
  // ============ REPORTES ============
  async createReport(report: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<Report> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase no está configurado. Por favor, configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.');
    }

    const { data, error } = await client
      .from('reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReport(id: string): Promise<Report | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  },

  async getReportBySlug(slug: string): Promise<Report | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data;
  },

  async getAllReports(): Promise<Report[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateReport(id: string, updates: Partial<Report>): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('reports')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteReport(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============ CONFIGURACIONES DE CUENTAS ============
  async saveReportAccountConfig(config: Omit<ReportAccountConfig, 'id' | 'created_at'>): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('report_account_configs')
      .upsert(config, {
        onConflict: 'report_id,account_id'
      });

    if (error) throw error;
  },

  async getReportAccountConfigs(reportId: string): Promise<ReportAccountConfig[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('report_account_configs')
      .select('*')
      .eq('report_id', reportId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async deleteReportAccountConfig(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('report_account_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============ RESULTADOS DE REPORTES ============
  async generateReportResult(reportId: string): Promise<ReportResult> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const accountConfigs = await this.getReportAccountConfigs(reportId);
    const allEntries: TimeEntryResult[] = [];

    // Obtener entradas de API
    for (const config of accountConfigs) {
      const account = await supabaseService.getAccounts().then(accounts => 
        accounts.find(a => a.id === config.account_id)
      );
      
      if (!account) continue;

      const togglService = new TogglService(account.apiToken, account.id);
      
      try {
        const filterConfig = {
          accountId: account.id,
          workspaceId: config.workspace_id,
          clientId: config.client_id,
          projectId: config.project_id,
          tagId: config.tag_id,
          startDate: report.date_range_start,
          endDate: report.date_range_end,
        };

        // Usar cache para getMe (rara vez cambia)
        const userInfo = await togglService.getMe();
        const responsible = userInfo.fullname || userInfo.email || account.name;

        // getTimeEntries ya tiene cache interno, pero asegurémonos de usarlo
        const entries = await togglService.getTimeEntries(filterConfig);
        const enrichedEntries: TimeEntryResult[] = entries.map((entry) => ({
          ...entry,
          accountName: account.name,
          responsible: responsible,
        }));

        allEntries.push(...enrichedEntries);
      } catch (error) {
        console.error(`Error loading data for account ${account.name}:`, error);
      }
    }

    // Obtener entradas de PDFs históricos
    const pdfs = await this.getHistoricalPDFs(reportId);
    for (const pdf of pdfs) {
      if (pdf.processing_status === 'completed' && pdf.entries) {
        allEntries.push(...pdf.entries);
      }
    }

    // Ordenar por fecha
    allEntries.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    // Calcular estadísticas
    const totalDuration = allEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Calcular resumen de horas
    const hoursSummary = report.contracted_hours
      ? ReportCalculations.calculateHoursSummary(
          allEntries,
          report.contracted_hours,
          report.contract_start_date
        )
      : undefined;

    // Calcular proyecciones
    const projections = ReportCalculations.calculateProjections(allEntries, hoursSummary);

    // Calcular distribuciones
    const distributionByDescription = ReportCalculations.calculateDistributionByDescription(allEntries);
    const distributionByTeamMember = ReportCalculations.calculateDistributionByTeamMember(allEntries);
    const consumptionByMonth = ReportCalculations.calculateMonthlyConsumption(allEntries);

    // Agrupar entradas
    const groupedEntries = ReportCalculations.groupEntriesByDescription(allEntries);

    // Últimas 10 entradas
    const latestEntries = ReportCalculations.getLatestEntries(allEntries, 10);

    const result: ReportResult = {
      report_id: reportId,
      entries: allEntries,
      total_duration: totalDuration,
      total_entries: allEntries.length,
      date_range: report.date_range_start && report.date_range_end
        ? {
            start: report.date_range_start,
            end: report.date_range_end,
          }
        : undefined,
      hours_summary: hoursSummary,
      projections,
      distribution_by_description: distributionByDescription,
      distribution_by_team_member: distributionByTeamMember,
      consumption_by_month: consumptionByMonth,
      grouped_entries: groupedEntries,
      latest_entries: latestEntries,
      generated_at: new Date().toISOString(),
      data_sources: {
        api: allEntries.filter(e => !pdfs.some(p => p.entries?.some(pe => pe.id === e.id))).length,
        pdfs: pdfs.reduce((sum, pdf) => sum + (pdf.entries?.length || 0), 0),
      },
    };

    // Guardar resultado en cache
    await this.saveReportResult(reportId, result);

    // Actualizar last_refreshed_at y next_refresh_at
    const nextRefresh = new Date();
    nextRefresh.setHours(nextRefresh.getHours() + (report.refresh_interval_hours || 2));
    
    await this.updateReport(reportId, {
      last_refreshed_at: new Date().toISOString(),
      next_refresh_at: nextRefresh.toISOString(),
    });

    return result;
  },

  async getReportResult(reportId: string): Promise<ReportResult | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('report_results')
      .select('*')
      .eq('report_id', reportId)
      .single();

    if (error || !data) return null;

    return {
      report_id: data.report_id,
      entries: data.entries || [],
      total_duration: data.total_duration,
      total_entries: data.total_entries,
      date_range: data.date_range_start && data.date_range_end
        ? {
            start: data.date_range_start,
            end: data.date_range_end,
          }
        : undefined,
      hours_summary: data.hours_summary,
      projections: data.projections,
      distribution_by_description: data.distribution_by_description,
      distribution_by_team_member: data.distribution_by_team_member,
      consumption_by_month: data.consumption_by_month,
      grouped_entries: data.grouped_entries,
      latest_entries: data.latest_entries,
      generated_at: data.generated_at,
      data_sources: data.data_sources,
    };
  },

  async saveReportResult(reportId: string, result: ReportResult): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('report_results')
      .upsert({
        report_id: reportId,
        entries: result.entries,
        total_duration: result.total_duration,
        total_entries: result.total_entries,
        date_range_start: result.date_range?.start,
        date_range_end: result.date_range?.end,
        hours_summary: result.hours_summary,
        projections: result.projections,
        distribution_by_description: result.distribution_by_description,
        distribution_by_team_member: result.distribution_by_team_member,
        consumption_by_month: result.consumption_by_month,
        grouped_entries: result.grouped_entries,
        latest_entries: result.latest_entries,
        generated_at: result.generated_at || new Date().toISOString(),
        data_sources: result.data_sources,
      }, {
        onConflict: 'report_id'
      });

    if (error) throw error;
  },

  // ============ PDFs HISTÓRICOS ============
  async getHistoricalPDFs(reportId: string): Promise<HistoricalPDFData[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('historical_pdf_data')
      .select('*')
      .eq('report_id', reportId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((pdf: any) => ({
      ...pdf,
      entries: pdf.entries || [],
    }));
  },

  async saveHistoricalPDF(pdf: Omit<HistoricalPDFData, 'id' | 'uploaded_at'>): Promise<string> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await client
      .from('historical_pdf_data')
      .insert(pdf)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async deleteHistoricalPDF(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('historical_pdf_data')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

