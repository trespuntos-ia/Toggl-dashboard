/**
 * Servicio para calcular estadísticas y proyecciones de reportes
 */

import type { TimeEntryResult } from '../types';
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export interface HoursSummary {
  contracted: number;
  consumed: number; // en horas
  consumed_percentage: number;
  available: number;
  start_date?: string;
}

export interface Projections {
  consumption_rate_per_week: number; // Promedio de las últimas 4 semanas
  weeks_until_exhaustion?: number;
  monthly_average: number;
  peak_month?: {
    month: string;
    hours: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DistributionItem {
  description: string;
  hours: number;
  percentage: number;
  color?: string;
}

export interface TeamMemberHours {
  name: string;
  role?: string;
  hours: number;
  percentage: number;
}

export interface MonthlyConsumption {
  month: string;
  hours: number;
  cumulative: number;
}

export class ReportCalculations {
  /**
   * Calcula el resumen de horas (contratadas, consumidas, disponibles)
   */
  static calculateHoursSummary(
    entries: TimeEntryResult[],
    contractedHours?: number,
    contractStartDate?: string
  ): HoursSummary | undefined {
    if (!contractedHours || contractedHours <= 0) {
      return undefined;
    }

    // Convertir duración total de segundos a horas
    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const consumedHours = totalSeconds / 3600;
    const availableHours = Math.max(0, contractedHours - consumedHours);
    const consumedPercentage = (consumedHours / contractedHours) * 100;

    return {
      contracted: contractedHours,
      consumed: Number(consumedHours.toFixed(2)),
      consumed_percentage: Number(consumedPercentage.toFixed(1)),
      available: Number(availableHours.toFixed(2)),
      start_date: contractStartDate,
    };
  }

  /**
   * Calcula proyecciones basadas en el ritmo de consumo
   */
  static calculateProjections(
    entries: TimeEntryResult[],
    hoursSummary?: HoursSummary
  ): Projections {
    if (entries.length === 0) {
      return {
        consumption_rate_per_week: 0,
        monthly_average: 0,
        trend: 'stable',
      };
    }

    // Ordenar entradas por fecha
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Calcular consumo por semana de las últimas 4 semanas
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);

    const recentEntries = sortedEntries.filter(
      (entry) => new Date(entry.start) >= fourWeeksAgo
    );

    const recentHours = recentEntries.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );

    const consumptionRatePerWeek = recentHours / 4; // Promedio de 4 semanas

    // Calcular semanas hasta agotamiento
    let weeksUntilExhaustion: number | undefined;
    if (hoursSummary && consumptionRatePerWeek > 0) {
      weeksUntilExhaustion = Number(
        (hoursSummary.available / consumptionRatePerWeek).toFixed(1)
      );
    }

    // Calcular promedio mensual
    const allHours = sortedEntries.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );
    
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const monthsDiff =
      (new Date(lastEntry.start).getTime() - new Date(firstEntry.start).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    
    const monthlyAverage = monthsDiff > 0 ? Number((allHours / monthsDiff).toFixed(1)) : allHours;

    // Encontrar mes pico
    const monthlyHours = this.calculateMonthlyConsumption(entries);
    const peakMonth = monthlyHours.reduce(
      (max, current) => (current.hours > max.hours ? current : max),
      monthlyHours[0]
    );

    // Calcular tendencia (comparar últimas 2 semanas vs 2 semanas anteriores)
    const twoWeeksAgo = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
    const lastTwoWeeks = sortedEntries.filter(
      (entry) => new Date(entry.start) >= twoWeeksAgo
    );
    const previousTwoWeeks = sortedEntries.filter(
      (entry) =>
        new Date(entry.start) >= fourWeeksAgo && new Date(entry.start) < twoWeeksAgo
    );

    const lastTwoWeeksHours = lastTwoWeeks.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );
    const previousTwoWeeksHours = previousTwoWeeks.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const diff = lastTwoWeeksHours - previousTwoWeeksHours;
    if (Math.abs(diff) > 0.5) {
      // Umbral de 0.5 horas para considerar cambio significativo
      trend = diff > 0 ? 'increasing' : 'decreasing';
    }

    return {
      consumption_rate_per_week: Number(consumptionRatePerWeek.toFixed(1)),
      weeks_until_exhaustion: weeksUntilExhaustion,
      monthly_average: monthlyAverage,
      peak_month: {
        month: peakMonth.month,
        hours: peakMonth.hours,
      },
      trend,
    };
  }

  /**
   * Calcula distribución de horas por descripción
   */
  static calculateDistributionByDescription(
    entries: TimeEntryResult[]
  ): DistributionItem[] {
    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );

    const descriptionMap = new Map<string, number>();

    entries.forEach((entry) => {
      const description = entry.description || 'Sin descripción';
      const hours = entry.duration / 3600;
      descriptionMap.set(
        description,
        (descriptionMap.get(description) || 0) + hours
      );
    });

    const distribution: DistributionItem[] = Array.from(descriptionMap.entries())
      .map(([description, hours]) => ({
        description,
        hours: Number(hours.toFixed(1)),
        percentage: Number(((hours / totalHours) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Top 10

    // Asignar colores (puedes usar una paleta predefinida)
    const colors = [
      '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
      '#06B6D4', '#EC4899', '#84CC16', '#6366F1', '#F97316',
    ];

    distribution.forEach((item, index) => {
      item.color = colors[index % colors.length];
    });

    return distribution;
  }

  /**
   * Calcula distribución de horas por miembro del equipo
   */
  static calculateDistributionByTeamMember(
    entries: TimeEntryResult[]
  ): TeamMemberHours[] {
    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );

    const memberMap = new Map<string, { hours: number; role?: string }>();

    entries.forEach((entry) => {
      const member = entry.responsible || 'Sin asignar';
      const hours = entry.duration / 3600;
      const existing = memberMap.get(member);
      memberMap.set(member, {
        hours: (existing?.hours || 0) + hours,
        role: existing?.role || undefined, // Puedes extraer el rol de otra fuente
      });
    });

    return Array.from(memberMap.entries())
      .map(([name, data]) => ({
        name,
        role: data.role,
        hours: Number(data.hours.toFixed(1)),
        percentage: Number(((data.hours / totalHours) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.hours - a.hours);
  }

  /**
   * Calcula consumo acumulado por meses
   */
  static calculateMonthlyConsumption(
    entries: TimeEntryResult[]
  ): MonthlyConsumption[] {
    if (entries.length === 0) return [];

    // Ordenar por fecha
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const firstDate = new Date(sortedEntries[0].start);
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].start);

    // Obtener todos los meses entre la primera y última fecha
    const months = eachMonthOfInterval({
      start: startOfMonth(firstDate),
      end: endOfMonth(lastDate),
    });

    const monthlyData: MonthlyConsumption[] = months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthEntries = sortedEntries.filter((entry) => {
        const entryDate = new Date(entry.start);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });

      const hours = monthEntries.reduce(
        (sum, entry) => sum + entry.duration / 3600,
        0
      );

      return {
        month: format(month, 'MMM yyyy'),
        hours: Number(hours.toFixed(1)),
        cumulative: 0, // Se calculará después
      };
    });

    // Calcular acumulado
    let cumulative = 0;
    monthlyData.forEach((data) => {
      cumulative += data.hours;
      data.cumulative = Number(cumulative.toFixed(1));
    });

    return monthlyData;
  }

  /**
   * Agrupa entradas por descripción similar
   * Usa similitud de texto para agrupar entradas relacionadas
   */
  static groupEntriesByDescription(
    entries: TimeEntryResult[]
  ): Array<{
    description: string;
    entries: TimeEntryResult[];
    total_hours: number;
    total_entries: number;
    percentage_of_total: number;
    responsible: Array<{ name: string; hours: number }>;
  }> {
    if (entries.length === 0) return [];

    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.duration / 3600,
      0
    );

    // Normalizar descripciones para agrupar similares
    const normalizeDescription = (desc: string): string => {
      return desc
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');
    };

    // Agrupar por descripción normalizada
    const groupsMap = new Map<
      string,
      {
        description: string; // Descripción original más común
        entries: TimeEntryResult[];
      }
    >();

    entries.forEach((entry) => {
      const normalized = normalizeDescription(entry.description || 'Sin descripción');
      const existing = groupsMap.get(normalized);

      if (existing) {
        existing.entries.push(entry);
        // Actualizar descripción si esta es más común o más larga
        if (
          entry.description &&
          entry.description.length > existing.description.length
        ) {
          existing.description = entry.description;
        }
      } else {
        groupsMap.set(normalized, {
          description: entry.description || 'Sin descripción',
          entries: [entry],
        });
      }
    });

    // Convertir a array y calcular estadísticas
    const groups = Array.from(groupsMap.values()).map((group) => {
      const groupHours = group.entries.reduce(
        (sum, entry) => sum + entry.duration / 3600,
        0
      );

      // Calcular responsables únicos y sus horas
      const responsibleMap = new Map<string, number>();
      group.entries.forEach((entry) => {
        const name = entry.responsible || 'Sin asignar';
        const hours = entry.duration / 3600;
        responsibleMap.set(name, (responsibleMap.get(name) || 0) + hours);
      });

      const responsible = Array.from(responsibleMap.entries())
        .map(([name, hours]) => ({
          name,
          hours: Number(hours.toFixed(1)),
        }))
        .sort((a, b) => b.hours - a.hours);

      return {
        description: group.description,
        entries: group.entries.sort(
          (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
        ), // Ordenar por fecha descendente
        total_hours: Number(groupHours.toFixed(1)),
        total_entries: group.entries.length,
        percentage_of_total: Number(((groupHours / totalHours) * 100).toFixed(1)),
        responsible,
      };
    });

    // Ordenar por horas totales (descendente)
    return groups.sort((a, b) => b.total_hours - a.total_hours);
  }

  /**
   * Obtiene las últimas N entradas ordenadas por fecha
   */
  static getLatestEntries(
    entries: TimeEntryResult[],
    limit: number = 10
  ): TimeEntryResult[] {
    return [...entries]
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
      .slice(0, limit);
  }
}

