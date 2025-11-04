import { useState, useEffect } from 'react';
import { TogglService } from '../services/togglService';
import type { TogglAccount, FilterConfig, Workspace, Client, Project, Tag } from '../types';
import './FilterSelector.css';

interface FilterSelectorProps {
  account: TogglAccount;
  onFilterChange: (config: FilterConfig) => void;
  onRemove: () => void;
}

export const FilterSelector = ({
  account,
  onFilterChange,
  onRemove,
}: FilterSelectorProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | undefined>();
  const [selectedClient, setSelectedClient] = useState<number | undefined>();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [selectedTag, setSelectedTag] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const togglService = new TogglService(account.apiToken);

  useEffect(() => {
    loadWorkspaces();
  }, [account]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceData(selectedWorkspace);
    } else {
      setClients([]);
      setProjects([]);
      setTags([]);
    }
    setSelectedClient(undefined);
    setSelectedProject(undefined);
    setSelectedTag(undefined);
  }, [selectedWorkspace]);

  useEffect(() => {
    if (selectedWorkspace) {
      updateFilter();
    }
  }, [selectedWorkspace, selectedClient, selectedProject, selectedTag, startDate, endDate]);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const workspacesData = await togglService.getWorkspaces();
      setWorkspaces(workspacesData);
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido';
      if (errorMessage.includes('limit') || errorMessage.includes('quota')) {
        setError('⚠️ Has alcanzado el límite de llamadas a la API de Toggl. Espera unos minutos antes de intentar de nuevo.');
      } else {
        setError('Error al cargar los workspaces. Verifica que el API token sea correcto.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceData = async (workspaceId: number) => {
    setLoading(true);
    setClientsError(null);
    try {
      const [clientsData, projectsData, tagsData] = await Promise.all([
        togglService.getClients(workspaceId).catch(err => {
          console.error('Error loading clients:', err);
          const errorMsg = err?.response?.data?.message || err?.message || '';
          if (errorMsg.includes('limit') || errorMsg.includes('quota')) {
            setClientsError('Límite de API alcanzado. Espera unos minutos.');
          } else {
            setClientsError('Error al cargar clientes. Puede que este workspace no tenga clientes.');
          }
          return [];
        }),
        togglService.getProjects(workspaceId).catch(err => {
          console.error('Error loading projects:', err);
          return [];
        }),
        togglService.getTags(workspaceId).catch(err => {
          console.error('Error loading tags:', err);
          return [];
        }),
      ]);
      setClients(clientsData || []);
      setProjects(projectsData || []);
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = () => {
    const config: FilterConfig = {
      accountId: account.id,
      workspaceId: selectedWorkspace,
      clientId: selectedClient,
      projectId: selectedProject,
      tagId: selectedTag,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    onFilterChange(config);
  };

  const filteredProjects = selectedClient
    ? projects.filter(p => p.cid === selectedClient)
    : projects;

  return (
    <div className="filter-selector">
      <div className="filter-header">
        <h3>{account.name}</h3>
        <button className="btn btn-sm btn-danger" onClick={onRemove}>
          Eliminar
        </button>
      </div>

      {loading && <div className="loading">Cargando...</div>}

      {error && (
        <div className="filter-message">
          <p>{error}</p>
        </div>
      )}

      {workspaces.length === 0 && !loading && !error && (
        <div className="filter-message">
          <p>⚠️ No se pudieron cargar los workspaces. Verifica que el API token sea correcto.</p>
        </div>
      )}

      <div className="filter-fields">
        <div className="filter-field">
          <label>Workspace *</label>
          <select
            value={selectedWorkspace || ''}
            onChange={(e) => setSelectedWorkspace(e.target.value ? Number(e.target.value) : undefined)}
            className="select"
            disabled={loading}
          >
            <option value="">Selecciona un workspace</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <small className="filter-hint">* Requerido para cargar resultados</small>
        </div>

        {selectedWorkspace && (
          <>
            <div className="filter-field">
              <label>Cliente</label>
              <select
                value={selectedClient || ''}
                onChange={(e) => setSelectedClient(e.target.value ? Number(e.target.value) : undefined)}
                className="select"
                disabled={loading}
              >
                <option value="">Todos</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {clientsError && (
                <small className="filter-hint" style={{ color: '#dc3545' }}>
                  {clientsError}
                </small>
              )}
              {!clientsError && clients.length === 0 && !loading && (
                <small className="filter-hint">
                  Este workspace no tiene clientes configurados
                </small>
              )}
            </div>

            <div className="filter-field">
              <label>Proyecto</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : undefined)}
                className="select"
                disabled={loading}
              >
                <option value="">Todos</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {!loading && filteredProjects.length === 0 && (
                <small className="filter-hint">
                  {selectedClient ? 'No hay proyectos para este cliente' : 'Este workspace no tiene proyectos configurados'}
                </small>
              )}
            </div>

            <div className="filter-field">
              <label>Tag</label>
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value ? Number(e.target.value) : undefined)}
                className="select"
                disabled={loading}
              >
                <option value="">Todos</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              {!loading && tags.length === 0 && (
                <small className="filter-hint">
                  Este workspace no tiene tags configurados
                </small>
              )}
            </div>
          </>
        )}

        <div className="filter-field">
          <label>Fecha Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </div>

        <div className="filter-field">
          <label>Fecha Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
        </div>
      </div>
    </div>
  );
};

