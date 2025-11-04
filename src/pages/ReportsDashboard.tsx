/**
 * Dashboard principal con lista de reportes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import type { Report } from '../types';
import './ReportsDashboard.css';

export const ReportsDashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await reportService.getAllReports();
      setReports(data);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      const errorMessage = error?.message || 'Error desconocido';
      if (errorMessage.includes('Supabase no está configurado') || errorMessage.includes('Supabase not configured')) {
        // No mostrar alerta aquí, solo mostrar mensaje en la UI
        console.warn('Supabase no configurado. Ver VERCEL_ENV_SETUP.md para configurar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      await reportService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error al eliminar el reporte');
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="reports-dashboard">
        <div className="loading">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="reports-dashboard">
      <header className="dashboard-header">
        <h1>📊 Toggl Reports Dashboard</h1>
        <p>Gestiona y visualiza tus reportes de tiempo</p>
      </header>

      <div className="dashboard-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={() => navigate('/reports/new')}
        >
          + Crear Nuevo Reporte
        </button>
      </div>

      <div className="reports-list">
        {reports.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No hay reportes creados aún.</p>
            <p>Crea tu primer reporte para empezar.</p>
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>
                ⚠️ Configuración Requerida
              </p>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#856404' }}>
                Para crear reportes, necesitas configurar Supabase en Vercel.
                <br />
                Ver <code>VERCEL_ENV_SETUP.md</code> para instrucciones.
              </p>
            </div>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <div className="report-info">
                  <h3>{report.name}</h3>
                  {report.client_name && (
                    <p className="report-client">{report.client_name}</p>
                  )}
                  {report.description && (
                    <p className="report-description">{report.description}</p>
                  )}
                </div>
                <div className="report-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/reports/${report.slug}`)}
                  >
                    Ver
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/reports/${report.id}/edit`)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="report-card-body">
                <div className="report-meta">
                  <div className="meta-item">
                    <span className="meta-label">URL:</span>
                    <span className="meta-value">
                      /reports/{report.slug}
                    </span>
                    <button
                      className="btn-link"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/reports/${report.slug}`
                        );
                        alert('URL copiada al portapapeles');
                      }}
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Última actualización:</span>
                    <span className="meta-value">
                      {getTimeAgo(report.last_refreshed_at)}
                    </span>
                  </div>
                  {report.auto_refresh_enabled && (
                    <div className="meta-item">
                      <span className="meta-label">Auto-refresh:</span>
                      <span className="meta-value">
                        Cada {report.refresh_interval_hours} horas
                      </span>
                    </div>
                  )}
                  {report.contracted_hours && (
                    <div className="meta-item">
                      <span className="meta-label">Horas contratadas:</span>
                      <span className="meta-value">
                        {report.contracted_hours}h
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

