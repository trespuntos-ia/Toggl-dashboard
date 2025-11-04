/**
 * Editor de reportes
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { TogglService } from '../services/togglService';
import slugifyLib from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import type { Report, TogglAccount, ReportAccountConfig, Workspace, Client, Project, Tag } from '../types';
import './ReportEditor.css';

export const ReportEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new';

  const [report, setReport] = useState<Partial<Report>>({
    name: '',
    slug: '',
    client_name: '',
    description: '',
    contracted_hours: undefined,
    contract_start_date: undefined,
    auto_refresh_enabled: true,
    refresh_interval_hours: 2,
    date_range_start: undefined,
    date_range_end: undefined,
  });

  const [accounts, setAccounts] = useState<TogglAccount[]>([]);
  const [accountConfigs, setAccountConfigs] = useState<
    Array<ReportAccountConfig & { workspace?: Workspace; client?: Client; project?: Project; tag?: Tag }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAccounts();
    if (isEditing && id) {
      loadReport(id);
    }
  }, [id, isEditing]);

  const loadAccounts = async () => {
    try {
      const data = await storageService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadReport = async (reportId: string) => {
    setLoading(true);
    try {
      const reportData = await reportService.getReport(reportId);
      if (reportData) {
        setReport(reportData);

        const configs = await reportService.getReportAccountConfigs(reportId);
        
        // Enriquecer configs con datos de workspaces, etc.
        const enrichedConfigs = await Promise.all(
          configs.map(async (config) => {
            const account = accounts.find(a => a.id === config.account_id);
            if (!account) return config;

            const togglService = new TogglService(account.apiToken, account.id);
            let workspace, client, project, tag;

            if (config.workspace_id) {
              try {
                const workspaces = await togglService.getWorkspaces();
                workspace = workspaces.find(w => w.id === config.workspace_id);
                
                if (workspace) {
                  const [clients, projects, tags] = await Promise.all([
                    togglService.getClients(workspace.id),
                    togglService.getProjects(workspace.id),
                    togglService.getTags(workspace.id),
                  ]);

                  client = clients.find(c => c.id === config.client_id);
                  project = projects.find(p => p.id === config.project_id);
                  tag = tags.find(t => t.id === config.tag_id);
                }
              } catch (error) {
                console.error('Error loading workspace data:', error);
              }
            }

            return {
              ...config,
              workspace,
              client,
              project,
              tag,
            };
          })
        );

        setAccountConfigs(enrichedConfigs);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report.name?.trim()) {
      alert('El nombre del reporte es obligatorio');
      return;
    }

    // Validar rango de fechas (máximo 90 días)
    if (report.date_range_start && report.date_range_end) {
      const start = new Date(report.date_range_start);
      const end = new Date(report.date_range_end);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 90) {
        alert('El rango de fechas no puede exceder 90 días (límite de la API de Toggl)');
        return;
      }
    }

    setSaving(true);
    try {
      let reportId: string;

      if (isEditing && id) {
        await reportService.updateReport(id, report as Partial<Report>);
        reportId = id;
      } else {
        // Generar slug si no existe
        if (!report.slug) {
          report.slug = slugifyLib(report.name || '', { lower: true, strict: true });
        }

        const newReport = await reportService.createReport({
          ...report,
          slug: report.slug || slugifyLib(report.name || '', { lower: true, strict: true }),
        } as Omit<Report, 'id' | 'created_at' | 'updated_at'>);
        reportId = newReport.id;
      }

      // Guardar configuraciones de cuentas
      for (const config of accountConfigs) {
        await reportService.saveReportAccountConfig({
          report_id: reportId,
          account_id: config.account_id,
          account_name: config.account_name,
          workspace_id: config.workspace_id,
          client_id: config.client_id,
          project_id: config.project_id,
          tag_id: config.tag_id,
          priority: config.priority || 0,
        });
      }

      // Generar resultado inicial
      await reportService.generateReportResult(reportId);

      navigate('/');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error al guardar el reporte');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAccount = () => {
    if (accounts.length === 0) {
      alert('Primero debes añadir una cuenta de Toggl');
      navigate('/');
      return;
    }

    // Añadir primera cuenta disponible que no esté ya añadida
    const availableAccount = accounts.find(
      acc => !accountConfigs.some(c => c.account_id === acc.id)
    );

    if (availableAccount) {
      setAccountConfigs([
        ...accountConfigs,
        {
          id: uuidv4(),
          report_id: '',
          account_id: availableAccount.id,
          account_name: availableAccount.name,
          priority: accountConfigs.length,
        },
      ]);
    } else {
      alert('Todas las cuentas ya están añadidas');
    }
  };

  const handleRemoveAccount = (index: number) => {
    const config = accountConfigs[index];
    if (config.id && isEditing && id) {
      reportService.deleteReportAccountConfig(config.id);
    }
    setAccountConfigs(accountConfigs.filter((_, i) => i !== index));
  };

  const updateAccountConfig = (
    index: number,
    updates: Partial<ReportAccountConfig>
  ) => {
    const updated = [...accountConfigs];
    updated[index] = { ...updated[index], ...updates };
    setAccountConfigs(updated);
  };

  if (loading) {
    return (
      <div className="report-editor">
        <div className="loading">Cargando reporte...</div>
      </div>
    );
  }

  return (
    <div className="report-editor">
      <header className="editor-header">
        <h1>{isEditing ? 'Editar Reporte' : 'Crear Nuevo Reporte'}</h1>
      </header>

      <div className="editor-form">
        <div className="form-section">
          <h2>Información General</h2>
          <div className="form-group">
            <label>Nombre del Reporte *</label>
            <input
              type="text"
              value={report.name || ''}
              onChange={(e) => {
                setReport({
                  ...report,
                  name: e.target.value,
                  slug: report.slug || slugifyLib(e.target.value, { lower: true, strict: true }),
                });
              }}
              className="input"
              placeholder="Ej: Cliente ABC - Q1 2025"
            />
          </div>

          <div className="form-group">
            <label>URL (Slug)</label>
            <input
              type="text"
              value={report.slug || ''}
              onChange={(e) => setReport({ ...report, slug: e.target.value })}
              className="input"
              placeholder="cliente-abc-q1-2025"
            />
            <small className="form-hint">
              Se generará automáticamente desde el nombre si se deja vacío
            </small>
          </div>

          <div className="form-group">
            <label>Nombre del Cliente</label>
            <input
              type="text"
              value={report.client_name || ''}
              onChange={(e) => setReport({ ...report, client_name: e.target.value })}
              className="input"
              placeholder="Nombre del cliente"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={report.description || ''}
              onChange={(e) => setReport({ ...report, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Descripción opcional del reporte"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Horas Contratadas</h2>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={!!report.contracted_hours}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setReport({
                      ...report,
                      contracted_hours: undefined,
                      contract_start_date: undefined,
                    });
                  }
                }}
              />
              Habilitar cálculo de horas
            </label>
          </div>

          {report.contracted_hours !== undefined && (
            <>
              <div className="form-group">
                <label>Horas Totales Contratadas</label>
                <input
                  type="number"
                  value={report.contracted_hours || ''}
                  onChange={(e) =>
                    setReport({
                      ...report,
                      contracted_hours: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="input"
                  placeholder="80"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Fecha de Inicio del Contrato</label>
                <input
                  type="date"
                  value={report.contract_start_date || ''}
                  onChange={(e) =>
                    setReport({ ...report, contract_start_date: e.target.value || undefined })
                  }
                  className="input"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-section">
          <h2>Cuentas de Toggl</h2>
          <p className="section-description">
            Selecciona las cuentas y configura los filtros para cada una
          </p>

          {accountConfigs.length === 0 ? (
            <div className="empty-accounts">
              <p>No hay cuentas configuradas</p>
              <button className="btn btn-primary" onClick={handleAddAccount}>
                + Añadir Cuenta
              </button>
            </div>
          ) : (
            accountConfigs.map((config, index) => (
              <AccountConfigEditor
                key={config.id || index}
                config={config}
                account={accounts.find(a => a.id === config.account_id)}
                onUpdate={(updates) => updateAccountConfig(index, updates)}
                onRemove={() => handleRemoveAccount(index)}
              />
            ))
          )}

          <button className="btn btn-secondary" onClick={handleAddAccount}>
            + Añadir Otra Cuenta
          </button>
        </div>

        <div className="form-section">
          <h2>Rango de Fechas</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={report.date_range_start || ''}
                onChange={(e) =>
                  setReport({ ...report, date_range_start: e.target.value || undefined })
                }
                className="input"
              />
            </div>
            <div className="form-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={report.date_range_end || ''}
                onChange={(e) =>
                  setReport({ ...report, date_range_end: e.target.value || undefined })
                }
                className="input"
              />
            </div>
          </div>
          <small className="form-hint">
            ⚠️ Máximo 90 días entre las fechas (límite de la API de Toggl). Para datos más antiguos, sube PDFs históricos.
          </small>
        </div>

        <div className="form-section">
          <h2>Auto-actualización</h2>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={report.auto_refresh_enabled}
                onChange={(e) =>
                  setReport({ ...report, auto_refresh_enabled: e.target.checked })
                }
              />
              Habilitar actualización automática
            </label>
          </div>

          {report.auto_refresh_enabled && (
            <div className="form-group">
              <label>Intervalo de Actualización (horas)</label>
              <input
                type="number"
                value={report.refresh_interval_hours || 2}
                onChange={(e) =>
                  setReport({
                    ...report,
                    refresh_interval_hours: Number(e.target.value) || 2,
                  })
                }
                className="input"
                min="1"
                max="24"
              />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Reporte'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AccountConfigEditorProps {
  config: ReportAccountConfig & { workspace?: Workspace; client?: Client; project?: Project; tag?: Tag };
  account?: TogglAccount;
  onUpdate: (updates: Partial<ReportAccountConfig>) => void;
  onRemove: () => void;
}

const AccountConfigEditor = ({
  config,
  account,
  onUpdate,
  onRemove,
}: AccountConfigEditorProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (account) {
      loadWorkspaces();
    }
  }, [account]);

  useEffect(() => {
    if (config.workspace_id) {
      loadWorkspaceData(config.workspace_id);
    } else {
      setClients([]);
      setProjects([]);
      setTags([]);
    }
  }, [config.workspace_id]);

  const loadWorkspaces = async (forceRefresh = false) => {
    if (!account) return;
    
    setLoading(true);
    try {
      // Si se fuerza refresh, limpiar cache primero
      if (forceRefresh) {
        await supabaseService.clearEndpointCache(account.id, '/workspaces');
      }
      
      const togglService = new TogglService(account.apiToken, account.id);
      const data = await togglService.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceData = async (workspaceId: number, forceRefresh = false) => {
    if (!account) return;
    
    setLoading(true);
    try {
      // Si se fuerza refresh, limpiar cache primero
      if (forceRefresh) {
        await Promise.all([
          supabaseService.clearEndpointCache(account.id, `/workspaces/${workspaceId}/clients`),
          supabaseService.clearEndpointCache(account.id, `/workspaces/${workspaceId}/projects`),
          supabaseService.clearEndpointCache(account.id, `/workspaces/${workspaceId}/tags`),
        ]);
      }
      
      const togglService = new TogglService(account.apiToken, account.id);
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

  const handleForceRefresh = async () => {
    if (!account) return;
    
    setRefreshing(true);
    try {
      // Limpiar todo el cache de esta cuenta
      await supabaseService.clearAccountCache(account.id);
      
      // Recargar workspaces
      await loadWorkspaces(true);
      
      // Si hay un workspace seleccionado, recargar sus datos también
      if (config.workspace_id) {
        await loadWorkspaceData(config.workspace_id, true);
      }
      
      alert('✅ Cache limpiado y datos actualizados. El nuevo cache durará 2 horas.');
    } catch (error) {
      console.error('Error forcing refresh:', error);
      alert('Error al forzar la actualización');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredProjects = config.client_id
    ? projects.filter(p => p.cid === config.client_id)
    : projects;

  return (
    <div className="account-config-editor">
      <div className="account-config-header">
        <h3>{account?.name || 'Cuenta'}</h3>
        <div className="account-config-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleForceRefresh}
            disabled={refreshing || loading}
            title="Forzar actualización y limpiar cache. Los nuevos datos se cachearán por 2 horas."
          >
            {refreshing ? '🔄 Actualizando...' : '🔄 Forzar Actualización'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={onRemove}>
            Eliminar
          </button>
        </div>
      </div>

      {loading && <div className="loading-small">Cargando...</div>}

      <div className="account-config-fields">
        <div className="form-group">
          <label>Workspace *</label>
          <select
            value={config.workspace_id || ''}
            onChange={(e) => {
              const workspaceId = e.target.value ? Number(e.target.value) : undefined;
              onUpdate({
                workspace_id: workspaceId,
                client_id: undefined,
                project_id: undefined,
                tag_id: undefined,
              });
            }}
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
        </div>

        {config.workspace_id && (
          <>
            <div className="form-group">
              <label>Cliente</label>
              <select
                value={config.client_id || ''}
                onChange={(e) => {
                  const clientId = e.target.value ? Number(e.target.value) : undefined;
                  onUpdate({
                    client_id: clientId,
                    project_id: undefined, // Reset project when client changes
                  });
                }}
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
            </div>

            <div className="form-group">
              <label>Proyecto</label>
              <select
                value={config.project_id || ''}
                onChange={(e) =>
                  onUpdate({
                    project_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
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
            </div>

            <div className="form-group">
              <label>Tag</label>
              <select
                value={config.tag_id || ''}
                onChange={(e) =>
                  onUpdate({ tag_id: e.target.value ? Number(e.target.value) : undefined })
                }
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

