import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeEntry } from '../../services/toggl.service';

@Component({
  selector: 'app-results-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.css'
})
export class ResultsTableComponent {
  @Input() timeEntries: TimeEntry[] = [];

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalDuration(): number {
    return this.timeEntries.reduce((total, entry) => total + entry.duration, 0);
  }

  getTotalBillableDuration(): number {
    return this.timeEntries
      .filter(entry => entry.billable)
      .reduce((total, entry) => total + entry.duration, 0);
  }
}
