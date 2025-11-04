/**
 * Componente para mostrar gráficos de distribución
 */

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ReportResult } from '../types';
import './Charts.css';

interface ChartsProps {
  result: ReportResult;
}

export const Charts = ({ result }: ChartsProps) => {
  const COLORS = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#EC4899', '#84CC16', '#6366F1', '#F97316',
  ];

  return (
    <div className="charts-section">
      <div className="charts-grid">
        {/* Distribución por descripción */}
        {result.distribution_by_description && result.distribution_by_description.length > 0 && (
          <div className="chart-card">
            <h3>Distribución de horas por descripción</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={result.distribution_by_description}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {result.distribution_by_description.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              {result.distribution_by_description.map((item, index) => (
                <div key={index} className="legend-item">
                  <div
                    className="legend-color"
                    style={{
                      background: item.color || COLORS[index % COLORS.length],
                    }}
                  />
                  <span className="legend-label">{item.description}</span>
                  <span className="legend-value">
                    {item.percentage.toFixed(1)}% ({item.hours.toFixed(1)}h)
                  </span>
                </div>
              ))}
            </div>
            <div className="chart-total">
              Total de horas: {result.total_duration / 3600}h
            </div>
          </div>
        )}

        {/* Horas por miembro del equipo */}
        {result.distribution_by_team_member && result.distribution_by_team_member.length > 0 && (
          <div className="chart-card">
            <h3>Horas por miembro del equipo</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.distribution_by_team_member}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip
                    contentStyle={{
                      background: '#2a2a2a',
                      border: '1px solid #444',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]}>
                    {result.distribution_by_team_member.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="team-members-list">
              {result.distribution_by_team_member.map((member, index) => (
                <div key={index} className="team-member-item">
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    {member.role && (
                      <span className="member-role">{member.role}</span>
                    )}
                  </div>
                  <div className="member-hours-bar">
                    <div
                      className="member-hours-fill"
                      style={{
                        width: `${member.percentage}%`,
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  <span className="member-hours-value">{member.hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumo acumulado por meses */}
        {result.consumption_by_month && result.consumption_by_month.length > 0 && (
          <div className="chart-card full-width">
            <h3>Consumo acumulado por meses</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.consumption_by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip
                    contentStyle={{
                      background: '#2a2a2a',
                      border: '1px solid #444',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="cumulative" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {result.projections && (
              <div className="chart-summary">
                <div className="summary-item">
                  <span className="summary-label">Promedio mensual</span>
                  <span className="summary-value">
                    {result.projections.monthly_average.toFixed(1)}h
                  </span>
                </div>
                {result.projections.peak_month && (
                  <div className="summary-item">
                    <span className="summary-label">Mes con más horas</span>
                    <span className="summary-value">
                      {result.projections.peak_month.month} ({result.projections.peak_month.hours.toFixed(1)}h)
                    </span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">Tendencia</span>
                  <span className={`summary-value trend-${result.projections.trend}`}>
                    {result.projections.trend === 'increasing' && '📈 Aumentando'}
                    {result.projections.trend === 'decreasing' && '📉 Disminuyendo'}
                    {result.projections.trend === 'stable' && '➡️ Estable'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

