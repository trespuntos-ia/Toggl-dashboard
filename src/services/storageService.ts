import type { TogglAccount } from '../types';
import { supabaseService } from './supabaseService';

const STORAGE_KEY = 'toggl_accounts';

// Helper para verificar si Supabase está configurado
const isSupabaseConfigured = (): boolean => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(url && key);
  } catch {
    return false;
  }
};

export const storageService = {
  async getAccounts(): Promise<TogglAccount[]> {
    // Intentar obtener de Supabase primero
    if (isSupabaseConfigured()) {
      try {
        const accounts = await supabaseService.getAccounts();
        // También guardar en localStorage como fallback
        if (accounts.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
        }
        return accounts;
      } catch (error) {
        console.error('Error reading accounts from Supabase, falling back to localStorage:', error);
      }
    }

    // Fallback a localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading accounts from storage:', error);
      return [];
    }
  },

  async saveAccounts(accounts: TogglAccount[]): Promise<void> {
    // Guardar en localStorage como fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving accounts to localStorage:', error);
    }

    // Guardar en Supabase si está configurado
    if (isSupabaseConfigured()) {
      try {
        for (const account of accounts) {
          await supabaseService.saveAccount(account);
        }
      } catch (error) {
        console.error('Error saving accounts to Supabase:', error);
      }
    }
  },

  async addAccount(account: TogglAccount): Promise<void> {
    const accounts = await this.getAccounts();
    accounts.push(account);
    await this.saveAccounts(accounts);
  },

  async removeAccount(accountId: string): Promise<void> {
    const accounts = await this.getAccounts();
    const filtered = accounts.filter(acc => acc.id !== accountId);
    await this.saveAccounts(filtered);

    // Eliminar de Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.deleteAccount(accountId);
      } catch (error) {
        console.error('Error deleting account from Supabase:', error);
      }
    }
  },

  async updateAccount(accountId: string, updates: Partial<TogglAccount>): Promise<void> {
    const accounts = await this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === accountId);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      await this.saveAccounts(accounts);
    }
  },
};

