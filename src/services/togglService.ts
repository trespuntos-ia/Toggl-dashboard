import axios from 'axios';
import type { Workspace, Client, Project, Tag, TimeEntry, FilterConfig } from '../types';

// Usar la función serverless de Vercel como proxy para evitar CORS
const PROXY_URL = '/api/toggl-proxy';

export class TogglService {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async proxyRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
    const queryParams = new URLSearchParams({
      token: this.apiToken,
      endpoint: endpoint,
      ...params,
    });
    
    const url = `${PROXY_URL}?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      return await this.proxyRequest('/workspaces');
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  async getClients(workspaceId: number): Promise<Client[]> {
    try {
      return await this.proxyRequest(`/workspaces/${workspaceId}/clients`);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async getProjects(workspaceId: number): Promise<Project[]> {
    try {
      return await this.proxyRequest(`/workspaces/${workspaceId}/projects`);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getTags(workspaceId: number): Promise<Tag[]> {
    try {
      return await this.proxyRequest(`/workspaces/${workspaceId}/tags`);
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async getTimeEntries(config: FilterConfig): Promise<TimeEntry[]> {
    try {
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

      // Filtrar por tag si está especificado
      if (config.tagId) {
        // Obtener el nombre del tag para comparar
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

      // Obtener información adicional de proyectos y clientes
      if (config.workspaceId) {
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

      return timeEntries;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  }

  async getMe(): Promise<any> {
    try {
      return await this.proxyRequest('/me');
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}

