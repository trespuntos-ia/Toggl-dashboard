import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TogglService, TogglAccount } from '../../services/toggl.service';

@Component({
  selector: 'app-toggl-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toggl-accounts.component.html',
  styleUrl: './toggl-accounts.component.css'
})
export class TogglAccountsComponent implements OnInit {
  @Output() accountsSelected = new EventEmitter<any[]>();

  accounts: TogglAccount[] = [];
  selectedAccountIds: number[] = [];
  showAddForm = false;
  newAccountName = '';
  newAccountToken = '';
  loading = false;
  error = '';

  constructor(private togglService: TogglService) {}

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading = true;
    this.togglService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
        this.error = 'Error al cargar las cuentas';
        this.loading = false;
      }
    });
  }

  toggleAccountSelection(accountId: number) {
    const index = this.selectedAccountIds.indexOf(accountId);
    if (index > -1) {
      this.selectedAccountIds.splice(index, 1);
    } else {
      this.selectedAccountIds.push(accountId);
    }
    this.emitSelectedAccounts();
  }

  emitSelectedAccounts() {
    const selected = this.accounts.filter(acc => 
      this.selectedAccountIds.includes(acc.id)
    );
    this.accountsSelected.emit(selected);
  }

  showAddAccountForm() {
    this.showAddForm = true;
    this.newAccountName = '';
    this.newAccountToken = '';
    this.error = '';
  }

  cancelAddAccount() {
    this.showAddForm = false;
    this.newAccountName = '';
    this.newAccountToken = '';
    this.error = '';
  }

  addAccount() {
    if (!this.newAccountName || !this.newAccountToken) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.togglService.createAccount(this.newAccountName, this.newAccountToken).subscribe({
      next: (account) => {
        this.accounts.push(account);
        this.showAddForm = false;
        this.newAccountName = '';
        this.newAccountToken = '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error creating account:', err);
        this.error = err.error?.error || 'Error al crear la cuenta. Verifica el token de API.';
        this.loading = false;
      }
    });
  }

  deleteAccount(accountId: number, event: Event) {
    event.stopPropagation();
    
    if (confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
      this.loading = true;
      this.togglService.deleteAccount(accountId).subscribe({
        next: () => {
          this.accounts = this.accounts.filter(acc => acc.id !== accountId);
          this.selectedAccountIds = this.selectedAccountIds.filter(id => id !== accountId);
          this.emitSelectedAccounts();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error deleting account:', err);
          this.error = 'Error al eliminar la cuenta';
          this.loading = false;
        }
      });
    }
  }

  isSelected(accountId: number): boolean {
    return this.selectedAccountIds.includes(accountId);
  }
}
