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
    try {
      const workspacesData = await togglService.getWorkspaces();
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      alert('Error al cargar los workspaces. Verifica que el API token sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceData = async (workspaceId: number) => {
    setLoading(true);
    try {
      const [clientsData, projectsData, tagsData] = await Promise.all([
        togglService.getClients(workspaceId),
        togglService.getProjects(workspaceId),
        togglService.getTags(workspaceId),
      ]);
      setClients(clientsData);
      setProjects(projectsData);
      setTags(tagsData);
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

      <div className="filter-fields">
        <div className="filter-field">
          <label>Workspace</label>
          <select
            value={selectedWorkspace || ''}
            onChange={(e) => setSelectedWorkspace(e.target.value ? Number(e.target.value) : undefined)}
            className="select"
          >
            <option value="">Todos</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        {selectedWorkspace && (
          <>
            <div className="filter-field">
              <label>Cliente</label>
              <select
                value={selectedClient || ''}
                onChange={(e) => setSelectedClient(e.target.value ? Number(e.target.value) : undefined)}
                className="select"
              >
                <option value="">Todos</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>Proyecto</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : undefined)}
                className="select"
              >
                <option value="">Todos</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>Tag</label>
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value ? Number(e.target.value) : undefined)}
                className="select"
              >
                <option value="">Todos</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
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

