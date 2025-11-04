import axios from 'axios';
import type { Workspace, Client, Project, Tag, TimeEntry, FilterConfig } from '../types';
import { supabaseService } from './supabaseService';

// Usar la función serverless de Vercel como proxy para evitar CORS
const PROXY_URL = '/api/toggl-proxy';

export class TogglService {
  private apiToken: string;
  private accountId: string;

  constructor(apiToken: string, accountId?: string) {
    this.apiToken = apiToken;
    this.accountId = accountId || '';
  }

  private async proxyRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
    const queryParams = new URLSearchParams({
      token: this.apiToken,
      endpoint: endpoint,
    });
    
    // Añadir parámetros adicionales si existen
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, String(params[key]));
        }
      });
    }
    
    const url = `${PROXY_URL}?${queryParams.toString()}`;
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      // Pasar el error con más información
      if (error.response) {
        const errorData = error.response.data;
        const errorWithContext = new Error(errorData?.message || errorData?.error || error.message);
        (errorWithContext as any).response = { data: errorData };
        throw errorWithContext;
      }
      throw error;
    }
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      // Intentar obtener del cache primero
      if (this.accountId) {
        const cached = await supabaseService.getCachedWorkspaces(this.accountId);
        if (cached) return cached;
      }

      // Si no hay cache, hacer la petición
      const data = await this.proxyRequest('/workspaces');
      
      // Guardar en cache (2 horas = 120 minutos)
      if (this.accountId) {
        await supabaseService.saveCachedData(this.accountId, '/workspaces', data, 120);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  async getClients(workspaceId: number): Promise<Client[]> {
    try {
      // Intentar obtener del cache primero
      if (this.accountId) {
        const cached = await supabaseService.getCachedClients(this.accountId, workspaceId);
        if (cached) return cached;
      }

      // Si no hay cache, hacer la petición
      const data = await this.proxyRequest(`/workspaces/${workspaceId}/clients`);
      
      // Guardar en cache (2 horas = 120 minutos)
      if (this.accountId) {
        await supabaseService.saveCachedData(this.accountId, `/workspaces/${workspaceId}/clients`, data, 120);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async getProjects(workspaceId: number): Promise<Project[]> {
    try {
      // Intentar obtener del cache primero
      if (this.accountId) {
        const cached = await supabaseService.getCachedProjects(this.accountId, workspaceId);
        if (cached) return cached;
      }

      // Si no hay cache, hacer la petición
      const data = await this.proxyRequest(`/workspaces/${workspaceId}/projects`);
      
      // Guardar en cache (2 horas = 120 minutos)
      if (this.accountId) {
        await supabaseService.saveCachedData(this.accountId, `/workspaces/${workspaceId}/projects`, data, 120);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getTags(workspaceId: number): Promise<Tag[]> {
    try {
      // Intentar obtener del cache primero
      if (this.accountId) {
        const cached = await supabaseService.getCachedTags(this.accountId, workspaceId);
        if (cached) return cached;
      }

      // Si no hay cache, hacer la petición
      const data = await this.proxyRequest(`/workspaces/${workspaceId}/tags`);
      
      // Guardar en cache (2 horas = 120 minutos)
      if (this.accountId) {
        await supabaseService.saveCachedData(this.accountId, `/workspaces/${workspaceId}/tags`, data, 120);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async getTimeEntries(config: FilterConfig): Promise<TimeEntry[]> {
    try {
      // Intentar obtener del cache primero (cache de 5 minutos para time entries)
      const cacheKey = `time_entries_${config.workspaceId}_${config.clientId}_${config.projectId}_${config.tagId}_${config.startDate}_${config.endDate}`;
      if (this.accountId) {
        const cached = await supabaseService.getCachedData(`${this.accountId}:${cacheKey}`);
        if (cached) {
          return cached;
        }
      }

      const params: Record<string, string> = {};
      
      if (config.startDate) {
        params.start_date = config.startDate;
      }
      if (config.endDate) {
        params.end_date = config.endDate;
      }

      const entries = await this.proxyRequest('/me/time_entries', params);

      let timeEntries: TimeEntry[] = entries || [];

      // Filtrar por workspace si está especificado
      if (config.workspaceId) {
        timeEntries = timeEntries.filter(entry => entry.wid === config.workspaceId);
      }

      // Filtrar por proyecto si está especificado
      if (config.projectId) {
        timeEntries = timeEntries.filter(entry => entry.pid === config.projectId);
      }

      // Filtrar por tag si está especificado (solo si es necesario)
      if (config.tagId) {
        // Obtener el nombre del tag para comparar (usar cache)
        const tags = config.workspaceId ? await this.getTags(config.workspaceId) : [];
        const selectedTag = tags.find(t => t.id === config.tagId);
        
        if (selectedTag) {
          timeEntries = timeEntries.filter(entry => {
            if (!entry.tags || entry.tags.length === 0) return false;
            // Los tags en time entries pueden venir como IDs (números) o nombres (strings)
            return entry.tags.some(tag => {
              const tagStr = String(tag);
              const tagNum = Number(tag);
              return tagStr === selectedTag.name || 
                     tagNum === config.tagId ||
                     tagStr === String(config.tagId);
            });
          });
        }
      }

      // Obtener información adicional de proyectos y clientes SOLO si es necesario
      // (para mostrar nombres o filtrar por cliente)
      const needsProjectInfo = config.clientId || timeEntries.some(e => e.pid && !e.project);
      
      if (config.workspaceId && needsProjectInfo) {
        const [projects, clients] = await Promise.all([
          this.getProjects(config.workspaceId),
          this.getClients(config.workspaceId),
        ]);

        timeEntries = timeEntries.map(entry => {
          const project = projects.find(p => p.id === entry.pid);
          const client = project?.cid ? clients.find(c => c.id === project.cid) : undefined;
          
          return {
            ...entry,
            project: project?.name,
            client: client?.name,
          };
        });

        // Filtrar por cliente si está especificado
        if (config.clientId) {
          timeEntries = timeEntries.filter(entry => {
            const project = projects.find(p => p.id === entry.pid);
            return project?.cid === config.clientId;
          });
        }
      }

      // Guardar en cache (5 minutos)
      if (this.accountId) {
        await supabaseService.saveCachedData(this.accountId, cacheKey, timeEntries, 5);
      }

      return timeEntries;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  }

  async getMe(): Promise<any> {
    try {
      // Cache de getMe por 60 minutos (info del usuario raramente cambia)
      if (this.accountId) {
        const cached = await supabaseService.getCachedData(`${this.accountId}:/me`);
        if (cached) {
          return cached;
        }
      }

      const data = await this.proxyRequest('/me');
      
      // Guardar en cache (60 minutos)
      if (this.accountId) {
        await supabaseService.saveCachedData(this.accountId, '/me', data, 60);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}

