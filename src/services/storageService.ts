import type { TogglAccount } from '../types';

const STORAGE_KEY = 'toggl_accounts';

export const storageService = {
  getAccounts(): TogglAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading accounts from storage:', error);
      return [];
    }
  },

  saveAccounts(accounts: TogglAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving accounts to storage:', error);
    }
  },

  addAccount(account: TogglAccount): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);
  },

  removeAccount(accountId: string): void {
    const accounts = this.getAccounts();
    const filtered = accounts.filter(acc => acc.id !== accountId);
    this.saveAccounts(filtered);
  },

  updateAccount(accountId: string, updates: Partial<TogglAccount>): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === accountId);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      this.saveAccounts(accounts);
    }
  },
};

