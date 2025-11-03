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

