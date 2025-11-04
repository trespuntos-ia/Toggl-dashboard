import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Puedes cambiar esta URL según tu entorno
// Para producción, configura una variable de entorno o ajusta este valor
const API_URL = (typeof window !== 'undefined' && (window as any).__API_URL__) 
  ? (window as any).__API_URL__ 
  : 'http://localhost:8000/api/toggl';

export interface TogglAccount {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Workspace {
  id: number;
  name: string;
}

export interface Client {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  client_id?: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
  billable: boolean;
  tags: string[];
  account_name: string;
  workspace_id: number;
  project_id: number | null;
  project_name: string | null;
  client_id: number | null;
  client_name: string | null;
  user_id: number | null;
  user_name: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TogglService {
  constructor(private http: HttpClient) {}

  getAccounts(): Observable<TogglAccount[]> {
    return this.http.get<TogglAccount[]>(`${API_URL}/accounts`);
  }

  createAccount(name: string, apiToken: string): Observable<TogglAccount> {
    return this.http.post<TogglAccount>(`${API_URL}/accounts`, {
      name,
      api_token: apiToken
    });
  }

  deleteAccount(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/accounts/${id}`);
  }

  getWorkspaces(accountId: number): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${API_URL}/accounts/${accountId}/workspaces`);
  }

  getClients(accountId: number, workspaceId: number): Observable<Client[]> {
    return this.http.get<Client[]>(`${API_URL}/accounts/${accountId}/workspaces/${workspaceId}/clients`);
  }

  getProjects(accountId: number, workspaceId: number, clientId?: number): Observable<Project[]> {
    let url = `${API_URL}/accounts/${accountId}/workspaces/${workspaceId}/projects`;
    if (clientId) {
      url += `?client_id=${clientId}`;
    }
    return this.http.get<Project[]>(url);
  }

  getTags(accountId: number, workspaceId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${API_URL}/accounts/${accountId}/workspaces/${workspaceId}/tags`);
  }

  getTimeEntries(request: {
    accounts: Array<{ 
      account_id: number; 
      workspace_id: number;
      client_id?: number;
      project_id?: number;
      tag_id?: number;
    }>;
    start_date: string;
    end_date: string;
  }): Observable<TimeEntry[]> {
    return this.http.post<TimeEntry[]>(`${API_URL}/time-entries`, request);
  }
}
