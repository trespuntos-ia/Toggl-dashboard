/**
 * Vista pública del reporte
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { HoursMetrics } from '../components/HoursMetrics';
import { Charts } from '../components/Charts';
import { LatestEntries } from '../components/LatestEntries';
import { GroupedEntries } from '../components/GroupedEntries';
import type { Report, ReportResult } from '../types';
import './ReportView.css';

export const ReportView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrouped, setShowGrouped] = useState(false);

  useEffect(() => {
    if (slug) {
      loadReport();
    }
  }, [slug]);

  useEffect(() => {
    // Auto-refresh cada 2 horas si está habilitado
    // Solo verificar cada 5 minutos para evitar llamadas excesivas
    if (report?.auto_refresh_enabled && report.next_refresh_at) {
      const nextRefresh = new Date(report.next_refresh_at);
      const now = new Date();
      const msUntilRefresh = nextRefresh.getTime() - now.getTime();
      
      // Si ya pasó el tiempo, refrescar inmediatamente
      if (msUntilRefresh <= 0) {
        refreshReport();
        return;
      }

      // Programar refresh para cuando sea necesario
      const timeout = setTimeout(() => {
        refreshReport();
      }, msUntilRefresh);

      // Verificar periódicamente cada 5 minutos (no cada minuto)
      const interval = setInterval(() => {
        const checkNextRefresh = new Date(report.next_refresh_at || '');
        const checkNow = new Date();
        if (checkNow >= checkNextRefresh) {
          refreshReport();
        }
      }, 5 * 60 * 1000); // Cada 5 minutos

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, report?.auto_refresh_enabled, report?.next_refresh_at]);

  const loadReport = async () => {
    if (!slug) return;

    setLoading(true);
    try {
      const reportData = await reportService.getReportBySlug(slug);
      if (!reportData) {
        alert('Reporte no encontrado');
        return;
      }

      setReport(reportData);

      // Intentar obtener resultado cacheado
      let resultData = await reportService.getReportResult(reportData.id);

      // Si no hay resultado o está desactualizado, generar uno nuevo
      // Pero solo si realmente es necesario (evitar refreshes innecesarios)
      if (!resultData) {
        // No hay datos, generar por primera vez
        resultData = await reportService.generateReportResult(reportData.id);
      } else if (shouldRefresh(reportData)) {
        // Verificar que realmente necesitamos refrescar (no refrescar si fue hace menos de 1 minuto)
        const lastRefresh = reportData.last_refreshed_at 
          ? new Date(reportData.last_refreshed_at).getTime() 
          : 0;
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefresh;
        
        if (timeSinceLastRefresh >= 60 * 1000) {
          // Solo refrescar si pasó al menos 1 minuto desde el último refresh
          resultData = await reportService.generateReportResult(reportData.id);
        }
      }

      setResult(resultData);
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const refreshReport = async () => {
    if (!report) return;

    // Evitar refreshes demasiado frecuentes (mínimo 1 minuto entre refreshes)
    const lastRefresh = report.last_refreshed_at 
      ? new Date(report.last_refreshed_at).getTime() 
      : 0;
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefresh;
    
    if (timeSinceLastRefresh < 60 * 1000) {
      console.log('Refresh demasiado reciente, esperando...');
      return;
    }

    try {
      const resultData = await reportService.generateReportResult(report.id);
      setResult(resultData);
      // Recargar report para actualizar timestamps
      const updatedReport = await reportService.getReport(report.id);
      if (updatedReport) {
        setReport(updatedReport);
      }
    } catch (error) {
      console.error('Error refreshing report:', error);
    }
  };

  const shouldRefresh = (report: Report): boolean => {
    if (!report.next_refresh_at) return true;
    const nextRefresh = new Date(report.next_refresh_at);
    const now = new Date();
    return now >= nextRefresh;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="report-view">
        <div className="loading">Cargando reporte...</div>
      </div>
    );
  }

  if (!report || !result) {
    return (
      <div className="report-view">
        <div className="error-message">Reporte no encontrado</div>
      </div>
    );
  }

  const totalHours = result.total_duration / 3600;

  return (
    <div className="report-view">
      <header className="report-header">
        <h1>Resumen del paquete contratado</h1>
        {report.client_name && (
          <p className="report-client-name">{report.client_name}</p>
        )}
        <div className="report-status">
          <span className="status-badge">
            ✓ DEPLOYMENT VERIFICADO v2.0 - Cambios de filtrado activos
          </span>
        </div>
        <p className="report-intro">
          Aquí puedes ver en qué punto está tu proyecto y cómo avanzamos juntos 🚀
        </p>
      </header>

      {result.hours_summary && (
        <HoursMetrics
          hoursSummary={result.hours_summary}
          projections={result.projections}
        />
      )}

      <Charts result={result} />

      {result.latest_entries && result.latest_entries.length > 0 && (
        <LatestEntries
          entries={result.latest_entries}
          onViewAll={() => setShowGrouped(true)}
        />
      )}

      {showGrouped && result.grouped_entries && (
        <GroupedEntries
          groupedEntries={result.grouped_entries}
          totalHours={totalHours}
        />
      )}

      <div className="report-footer">
        <div className="footer-info">
          <span>Última actualización: {formatDate(report.last_refreshed_at)}</span>
          {report.auto_refresh_enabled && (
            <span>• Próxima actualización: {formatDate(report.next_refresh_at)}</span>
          )}
        </div>
        <button className="btn btn-sm btn-secondary" onClick={refreshReport}>
          Actualizar ahora
        </button>
      </div>
    </div>
  );
};

