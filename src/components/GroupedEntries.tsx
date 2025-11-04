/**
 * Componente para mostrar entradas agrupadas por descripción
 */

import { useState } from 'react';
import type { TimeEntryResult } from '../types';
import './GroupedEntries.css';

interface GroupedEntry {
  description: string;
  entries: TimeEntryResult[];
  total_hours: number;
  total_entries: number;
  percentage_of_total: number;
  responsible: Array<{ name: string; hours: number }>;
}

interface GroupedEntriesProps {
  groupedEntries: GroupedEntry[];
  totalHours: number;
}

export const GroupedEntries = ({
  groupedEntries,
  totalHours,
}: GroupedEntriesProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (description: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(description)) {
      newExpanded.delete(description);
    } else {
      newExpanded.add(description);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    const allDescriptions = new Set(groupedEntries.map((g) => g.description));
    setExpandedGroups(allDescriptions);
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'numeric',
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

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="grouped-entries">
      <div className="grouped-entries-header">
        <h2>Tareas Agrupadas</h2>
        <div className="grouped-entries-controls">
          <button className="btn btn-sm btn-secondary" onClick={expandAll}>
            Expandir Todo
          </button>
          <button className="btn btn-sm btn-secondary" onClick={collapseAll}>
            Colapsar Todo
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-tags">
          <button className="filter-tag">
            <span>📁</span> Proyectos
          </button>
          <button className="filter-tag">
            <span>🏷️</span> Tags
          </button>
          <button className="filter-tag">
            <span>📅</span> Fechas
          </button>
        </div>
      </div>

      <div className="groups-list">
        {groupedEntries.map((group) => {
          const isExpanded = expandedGroups.has(group.description);
          const responsibleText = group.responsible
            .map((r) => `${r.name} (${formatHours(r.hours)})`)
            .join(', ');

          return (
            <div key={group.description} className="group-item">
              <div
                className="group-header"
                onClick={() => toggleGroup(group.description)}
              >
                <div className="group-header-left">
                  <span className="expand-icon">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <div>
                    <h3 className="group-title">{group.description}</h3>
                    <div className="group-meta">
                      <span>
                        {group.total_entries} {group.total_entries === 1 ? 'entrada' : 'entradas'}
                      </span>
                      <span>•</span>
                      <span>{responsibleText}</span>
                    </div>
                  </div>
                </div>
                <div className="group-header-right">
                  <div className="group-hours">{formatHours(group.total_hours)}</div>
                  <div className="group-percentage">
                    {group.percentage_of_total}% del total filtrado
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="group-entries">
                  {group.entries.map((entry, index) => (
                    <div key={`${entry.id}-${index}`} className="entry-item">
                      <div className="entry-main">
                        <span className="entry-description">
                          {entry.description || 'Sin descripción'}
                        </span>
                        {entry.project && (
                          <span className="entry-tag project-tag">
                            {entry.project}
                          </span>
                        )}
                      </div>
                      <div className="entry-meta">
                        <span className="entry-user">{entry.responsible}</span>
                        <span className="entry-date">{formatDate(entry.start)}</span>
                        <span className="entry-duration">
                          {formatDuration(entry.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grouped-entries-summary">
        <div className="summary-info">
          <span>
            {groupedEntries.length} {groupedEntries.length === 1 ? 'grupo' : 'grupos'} únicos
          </span>
          <span>•</span>
          <span>{formatHours(totalHours)} totales</span>
        </div>
      </div>
    </div>
  );
};

