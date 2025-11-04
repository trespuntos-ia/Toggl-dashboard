import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TogglAccountsComponent } from './components/toggl-accounts/toggl-accounts.component';
import { FilterSelectorComponent } from './components/filter-selector/filter-selector.component';
import { ResultsTableComponent } from './components/results-table/results-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TogglAccountsComponent,
    FilterSelectorComponent,
    ResultsTableComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Toggl Dashboard';
  selectedAccounts: any[] = [];
  filters: any = {};
  timeEntries: any[] = [];

  onAccountsSelected(accounts: any[]) {
    this.selectedAccounts = accounts;
  }

  onFiltersChanged(filters: any) {
    this.filters = filters;
  }

  onTimeEntriesLoaded(entries: any[]) {
    this.timeEntries = entries;
  }
}
