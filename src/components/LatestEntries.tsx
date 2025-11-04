/**
 * Componente para mostrar las últimas 10 entradas
 */

import type { TimeEntryResult } from '../types';
import './LatestEntries.css';

interface LatestEntriesProps {
  entries: TimeEntryResult[];
  onViewAll?: () => void;
}

export const LatestEntries = ({ entries, onViewAll }: LatestEntriesProps) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (entries.length === 0) {
    return (
      <div className="latest-entries">
        <div className="latest-entries-header">
          <h2>Últimas entradas registradas</h2>
        </div>
        <p className="empty-message">No hay entradas disponibles</p>
      </div>
    );
  }

  return (
    <div className="latest-entries">
      <div className="latest-entries-header">
        <h2>Últimas entradas registradas</h2>
        {onViewAll && (
          <button className="view-all-link" onClick={onViewAll}>
            Ver todas las tareas →
          </button>
        )}
      </div>

      <div className="entries-summary">
        <span>
          {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'} únicas
        </span>
        <span>•</span>
        <span>
          {(
            entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600
          ).toFixed(1)}h totales
        </span>
      </div>

      <div className="entries-list">
        {entries.map((entry, index) => (
          <div key={`${entry.id}-${index}`} className="entry-card">
            <div className="entry-content">
              <div className="entry-description">
                {entry.description || 'Sin descripción'}
              </div>
              <div className="entry-details">
                {entry.project && (
                  <span className="entry-tag project-tag">{entry.project}</span>
                )}
                <span className="entry-user">{entry.responsible}</span>
                <span className="entry-date">{formatDate(entry.start)}</span>
              </div>
            </div>
            <div className="entry-hours">{formatDuration(entry.duration)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

