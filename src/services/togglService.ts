import axios from 'axios';
import type { Workspace, Client, Project, Tag, TimeEntry, FilterConfig } from '../types';

const API_BASE_URL = 'https://api.track.toggl.com/api/v9';

export class TogglService {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private getAuthHeaders() {
    // Crear base64 en el navegador
    const auth = btoa(`${this.apiToken}:api_token`);
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  async getClients(workspaceId: number): Promise<Client[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/clients`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async getProjects(workspaceId: number): Promise<Project[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/projects`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getTags(workspaceId: number): Promise<Tag[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/tags`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async getTimeEntries(config: FilterConfig): Promise<TimeEntry[]> {
    try {
      const params: any = {};
      
      if (config.startDate) {
        params.start_date = config.startDate;
      }
      if (config.endDate) {
        params.end_date = config.endDate;
      }

      let url = `${API_BASE_URL}/me/time_entries`;
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
      });

      let entries: TimeEntry[] = response.data || [];

      // Filtrar por workspace si está especificado
      if (config.workspaceId) {
        entries = entries.filter(entry => entry.wid === config.workspaceId);
      }

      // Filtrar por proyecto si está especificado
      if (config.projectId) {
        entries = entries.filter(entry => entry.pid === config.projectId);
      }

      // Filtrar por tag si está especificado
      if (config.tagId) {
        // Obtener el nombre del tag para comparar
        const tags = config.workspaceId ? await this.getTags(config.workspaceId) : [];
        const selectedTag = tags.find(t => t.id === config.tagId);
        
        if (selectedTag) {
          entries = entries.filter(entry => {
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

        entries = entries.map(entry => {
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
          entries = entries.filter(entry => {
            const project = projects.find(p => p.id === entry.pid);
            return project?.cid === config.clientId;
          });
        }
      }

      return entries;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  }

  async getMe(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/me`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}

