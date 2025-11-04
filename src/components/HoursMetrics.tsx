/**
 * Componente para mostrar métricas de horas contratadas
 */

import type { HoursSummary, Projections } from '../types';
import './HoursMetrics.css';

interface HoursMetricsProps {
  hoursSummary?: HoursSummary;
  projections?: Projections;
}

export const HoursMetrics = ({ hoursSummary, projections }: HoursMetricsProps) => {
  if (!hoursSummary) {
    return null;
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="hours-metrics">
      <h2>Resumen del paquete contratado</h2>
      
      <div className="metrics-cards">
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{hoursSummary.contracted}h</div>
            <div className="metric-label">Horas contratadas</div>
            {hoursSummary.start_date && (
              <div className="metric-subtitle">
                Fecha de inicio: {formatDate(hoursSummary.start_date)}
              </div>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{hoursSummary.consumed.toFixed(1)}h</div>
            <div className="metric-label">Horas consumidas</div>
            <div className="metric-subtitle">
              {hoursSummary.consumed_percentage.toFixed(1)}% del total
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">{hoursSummary.available.toFixed(1)}h</div>
            <div className="metric-label">Horas disponibles</div>
            <div className="metric-subtitle">Listas para usar</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <h3>Progreso del paquete</h3>
          <span className="progress-text">
            {hoursSummary.consumed.toFixed(1)} de {hoursSummary.contracted} horas utilizadas
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${hoursSummary.consumed_percentage}%` }}
          />
          <span className="progress-percentage">
            {hoursSummary.consumed_percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {projections && (
        <div className="projections-section">
          <h3>Ritmo y proyección</h3>
          <div className="projections-grid">
            <div className="projection-item">
              <div className="projection-label">Velocidad de consumo</div>
              <div className="projection-value">
                {projections.consumption_rate_per_week.toFixed(1)}h/semana
              </div>
              <div className="projection-subtitle">
                Promedio de las últimas 4 semanas
              </div>
            </div>
            {projections.weeks_until_exhaustion !== undefined && (
              <div className="projection-item">
                <div className="projection-label">Estimación de agotamiento</div>
                <div className="projection-value">
                  {projections.weeks_until_exhaustion.toFixed(1)} semanas
                </div>
                <div className="projection-subtitle">
                  Al ritmo actual de trabajo
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

