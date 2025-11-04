import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { TogglAccount, FilterConfig, TimeEntryResult, Workspace, Client, Project, Tag } from '../types';

// Estas variables deben configurarse en Vercel como environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
};

// Helper function (commented out but kept for future use)
// const checkSupabase = (): void => {
//   if (!getSupabaseClient()) {
//     throw new Error('Supabase not configured');
//   }
// };

// Tipos para las tablas de Supabase
interface TogglAccountDB {
  id: string;
  user_id?: string; // Para futura autenticación
  name: string;
  api_token: string; // Encriptado en producción
  created_at?: string;
  updated_at?: string;
}

// Interface no utilizada actualmente, pero mantenida para referencia futura
// interface ApiCacheEntry {
//   id?: number;
//   cache_key: string; // formato: "account_id:endpoint:params"
//   account_id: string;
//   endpoint: string;
//   data: any;
//   expires_at: string;
//   created_at?: string;
// }

interface TimeEntryResultDB {
  id?: number;
  account_id: string;
  filter_config: FilterConfig;
  results: TimeEntryResult[];
  total_duration: number;
  total_entries: number;
  created_at?: string;
}

interface SavedFilterConfig {
  id?: number;
  account_id: string;
  name: string;
  config: FilterConfig;
  created_at?: string;
  updated_at?: string;
}

export const supabaseService = {
  // ============ CUENTAS DE TOGGL ============
  async saveAccount(account: TogglAccount): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      // Si Supabase no está configurado, solo usar localStorage
      return;
    }
    
    const { error } = await client
      .from('toggl_accounts')
      .upsert({
        id: account.id,
        name: account.name,
        api_token: account.apiToken, // En producción, debería estar encriptado
      }, {
        onConflict: 'id'
      });
    
    if (error) throw error;
  },

  async getAccounts(): Promise<TogglAccount[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('toggl_accounts')
      .select('*');
    
    if (error) throw error;
    
    return (data || []).map((acc: TogglAccountDB) => ({
      id: acc.id,
      name: acc.name,
      apiToken: acc.api_token,
    }));
  },

  async deleteAccount(accountId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const { error } = await client
      .from('toggl_accounts')
      .delete()
      .eq('id', accountId);
    
    if (error) throw error;
  },

  // ============ CACHE DE API ============
  async getCachedData(cacheKey: string): Promise<any | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return null;
    return data.data;
  },

  async saveCachedData(
    accountId: string,
    endpoint: string,
    data: any,
    ttlMinutes: number = 60
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const cacheKey = `${accountId}:${endpoint}`;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    
    const { error } = await client
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        account_id: accountId,
        endpoint: endpoint,
        data: data,
        expires_at: expiresAt,
      }, {
        onConflict: 'cache_key'
      });
    
    if (error) throw error;
  },

  // Helpers específicos para cache
  async getCachedWorkspaces(accountId: string): Promise<Workspace[] | null> {
    return await this.getCachedData(`${accountId}:/workspaces`);
  },

  async getCachedClients(accountId: string, workspaceId: number): Promise<Client[] | null> {
    return await this.getCachedData(`${accountId}:/workspaces/${workspaceId}/clients`);
  },

  async getCachedProjects(accountId: string, workspaceId: number): Promise<Project[] | null> {
    return await this.getCachedData(`${accountId}:/workspaces/${workspaceId}/projects`);
  },

  async getCachedTags(accountId: string, workspaceId: number): Promise<Tag[] | null> {
    return await this.getCachedData(`${accountId}:/workspaces/${workspaceId}/tags`);
  },

  // ============ RESULTADOS DE TIME ENTRIES ============
  async saveTimeEntriesResults(
    accountId: string,
    filterConfig: FilterConfig,
    results: TimeEntryResult[]
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const totalDuration = results.reduce((sum, entry) => sum + entry.duration, 0);
    
    const { error } = await client
      .from('time_entries_results')
      .insert({
        account_id: accountId,
        filter_config: filterConfig,
        results: results,
        total_duration: totalDuration,
        total_entries: results.length,
      });
    
    if (error) throw error;
  },

  async getTimeEntriesResults(
    accountId?: string,
    limit: number = 50
  ): Promise<TimeEntryResultDB[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    
    let query = client
      .from('time_entries_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // ============ CONFIGURACIONES DE FILTROS GUARDADAS ============
  async saveFilterConfig(
    accountId: string,
    name: string,
    config: FilterConfig
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const { error } = await client
      .from('saved_filter_configs')
      .insert({
        account_id: accountId,
        name: name,
        config: config,
      });
    
    if (error) throw error;
  },

  async getSavedFilterConfigs(accountId?: string): Promise<SavedFilterConfig[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    
    let query = client
      .from('saved_filter_configs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async deleteSavedFilterConfig(id: number): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const { error } = await client
      .from('saved_filter_configs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ============ LIMPIAR CACHE ============
  /**
   * Limpia todo el cache de una cuenta específica
   */
  async clearAccountCache(accountId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const { error } = await client
      .from('api_cache')
      .delete()
      .like('cache_key', `${accountId}:%`);
    
    if (error) throw error;
  },

  /**
   * Limpia el cache de un endpoint específico de una cuenta
   */
  async clearEndpointCache(accountId: string, endpoint: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    
    const { error } = await client
      .from('api_cache')
      .delete()
      .eq('cache_key', `${accountId}:${endpoint}`);
    
    if (error) throw error;
  },
};

