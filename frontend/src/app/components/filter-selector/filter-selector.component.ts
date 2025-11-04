import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TogglService, Workspace, Client, Project, Tag, TogglAccount } from '../../services/toggl.service';

interface AccountConfig {
  account: TogglAccount;
  workspaceId: number | null;
  clientId: number | null;
  projectId: number | null;
  tagId: number | null;
  workspaces: Workspace[];
  clients: Client[];
  projects: Project[];
  tags: Tag[];
}

@Component({
  selector: 'app-filter-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-selector.component.html',
  styleUrl: './filter-selector.component.css'
})
export class FilterSelectorComponent implements OnChanges {
  @Input() selectedAccounts: TogglAccount[] = [];
  @Output() filtersChanged = new EventEmitter<any>();
  @Output() timeEntriesLoaded = new EventEmitter<any[]>();

  accountConfigs: AccountConfig[] = [];
  startDate: string = '';
  endDate: string = '';
  loading = false;
  error = '';

  constructor(private togglService: TogglService) {
    // Establecer fechas por defecto (últimos 30 días)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedAccounts'] && this.selectedAccounts) {
      this.initializeAccountConfigs();
    }
  }

  initializeAccountConfigs() {
    this.accountConfigs = this.selectedAccounts.map(account => ({
      account,
      workspaceId: null,
      clientId: null,
      projectId: null,
      tagId: null,
      workspaces: [],
      clients: [],
      projects: [],
      tags: []
    }));

    // Cargar workspaces para cada cuenta
    this.accountConfigs.forEach(config => {
      this.loadWorkspaces(config);
    });
  }

  loadWorkspaces(config: AccountConfig) {
    this.loading = true;
    this.togglService.getWorkspaces(config.account.id).subscribe({
      next: (workspaces) => {
        config.workspaces = workspaces;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading workspaces:', err);
        this.error = 'Error al cargar los workspaces';
        this.loading = false;
      }
    });
  }

  onWorkspaceChange(config: AccountConfig) {
    config.clientId = null;
    config.projectId = null;
    config.tagId = null;
    config.clients = [];
    config.projects = [];
    config.tags = [];

    if (config.workspaceId) {
      this.loadClients(config);
      this.loadTags(config);
    }
  }

  loadClients(config: AccountConfig) {
    if (!config.workspaceId) return;

    this.loading = true;
    this.togglService.getClients(config.account.id, config.workspaceId).subscribe({
      next: (clients) => {
        config.clients = clients;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.error = 'Error al cargar los clientes';
        this.loading = false;
      }
    });
  }

  onClientChange(config: AccountConfig) {
    config.projectId = null;
    config.projects = [];

    if (config.clientId && config.workspaceId) {
      this.loadProjects(config);
    } else if (config.workspaceId) {
      this.loadProjects(config);
    }
  }

  loadProjects(config: AccountConfig) {
    if (!config.workspaceId) return;

    this.loading = true;
    this.togglService.getProjects(
      config.account.id,
      config.workspaceId,
      config.clientId || undefined
    ).subscribe({
      next: (projects) => {
        config.projects = projects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.error = 'Error al cargar los proyectos';
        this.loading = false;
      }
    });
  }

  loadTags(config: AccountConfig) {
    if (!config.workspaceId) return;

    this.loading = true;
    this.togglService.getTags(config.account.id, config.workspaceId).subscribe({
      next: (tags) => {
        config.tags = tags;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tags:', err);
        this.error = 'Error al cargar los tags';
        this.loading = false;
      }
    });
  }

  addAnotherAccount() {
    // Esta funcionalidad se maneja en el componente padre
    // Emitimos un evento para que el padre pueda añadir otra cuenta
  }

  canLoadEntries(): boolean {
    return this.accountConfigs.every(config => 
      config.workspaceId !== null &&
      this.startDate !== '' &&
      this.endDate !== ''
    );
  }

  loadTimeEntries() {
    if (!this.canLoadEntries()) {
      this.error = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.loading = true;
    this.error = '';

    const accounts = this.accountConfigs
      .filter(config => config.workspaceId !== null)
      .map(config => ({
        account_id: config.account.id,
        workspace_id: config.workspaceId!,
        client_id: config.clientId || undefined,
        project_id: config.projectId || undefined,
        tag_id: config.tagId || undefined
      }));

    const request = {
      accounts,
      start_date: this.startDate,
      end_date: this.endDate
    };

    this.togglService.getTimeEntries(request).subscribe({
      next: (entries) => {
        this.timeEntriesLoaded.emit(entries);
        this.filtersChanged.emit({
          accounts: this.accountConfigs,
          startDate: this.startDate,
          endDate: this.endDate
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading time entries:', err);
        this.error = err.error?.error || 'Error al cargar las entradas de tiempo';
        this.loading = false;
      }
    });
  }
}
