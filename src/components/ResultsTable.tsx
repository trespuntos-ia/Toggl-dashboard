import React from 'react';
import type { TimeEntryResult } from '../types';
import './ResultsTable.css';

interface ResultsTableProps {
  results: TimeEntryResult[];
  loading: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, loading }) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalDuration = results.reduce((sum, entry) => sum + entry.duration, 0);

  if (loading) {
    return (
      <div className="results-table-container">
        <div className="loading">Cargando resultados...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="results-table-container">
        <div className="empty-message">No hay resultados para mostrar. Añade filtros y carga los datos.</div>
      </div>
    );
  }

  return (
    <div className="results-table-container">
      <div className="results-summary">
        <h3>Resumen</h3>
        <p>
          <strong>Total de entradas:</strong> {results.length}
        </p>
        <p>
          <strong>Tiempo total:</strong> {formatDuration(totalDuration)}
        </p>
      </div>

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Responsable</th>
              <th>Descripción</th>
              <th>Cliente</th>
              <th>Proyecto</th>
              <th>Tag</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Duración</th>
              <th>Facturable</th>
            </tr>
          </thead>
          <tbody>
            {results.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.accountName}</td>
                <td>{entry.responsible}</td>
                <td>{entry.description || '-'}</td>
                <td>{entry.client || '-'}</td>
                <td>{entry.project || '-'}</td>
                <td>
                  {entry.tags && entry.tags.length > 0
                    ? entry.tags.join(', ')
                    : entry.tag || '-'}
                </td>
                <td>{formatDate(entry.start)}</td>
                <td>{entry.stop ? formatDate(entry.stop) : 'En curso'}</td>
                <td>{formatDuration(entry.duration)}</td>
                <td>{entry.billable ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

