import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import type { TogglAccount } from '../types';
import './AccountManager.css';

interface AccountManagerProps {
  onAccountSelect: (account: TogglAccount) => void;
  selectedAccounts: TogglAccount[];
}

export const AccountManager = ({
  onAccountSelect,
  selectedAccounts,
}) => {
  const [accounts, setAccounts] = useState<TogglAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [apiToken, setApiToken] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const savedAccounts = storageService.getAccounts();
    setAccounts(savedAccounts);
  };

  const handleAddAccount = () => {
    if (!accountName.trim() || !apiToken.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    const newAccount: TogglAccount = {
      id: Date.now().toString(),
      name: accountName.trim(),
      apiToken: apiToken.trim(),
    };

    storageService.addAccount(newAccount);
    setAccounts([...accounts, newAccount]);
    setAccountName('');
    setApiToken('');
    setShowAddForm(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
      storageService.removeAccount(accountId);
      setAccounts(accounts.filter(acc => acc.id !== accountId));
    }
  };

  const isAccountSelected = (accountId: string) => {
    return selectedAccounts.some(acc => acc.id === accountId);
  };

  return (
    <div className="account-manager">
      <div className="account-manager-header">
        <h2>Cuentas de Toggl</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancelar' : '+ Añadir Cuenta'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-account-form">
          <input
            type="text"
            placeholder="Nombre de la cuenta"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="input"
          />
          <input
            type="password"
            placeholder="API Token de Toggl"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className="input"
          />
          <button className="btn btn-success" onClick={handleAddAccount}>
            Guardar Cuenta
          </button>
        </div>
      )}

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <p className="empty-message">No hay cuentas guardadas. Añade una cuenta para empezar.</p>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className={`account-item ${isAccountSelected(account.id) ? 'selected' : ''}`}
            >
              <div className="account-info">
                <span className="account-name">{account.name}</span>
                {isAccountSelected(account.id) && (
                  <span className="selected-badge">Seleccionada</span>
                )}
              </div>
              <div className="account-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onAccountSelect(account)}
                  disabled={isAccountSelected(account.id)}
                >
                  {isAccountSelected(account.id) ? 'Seleccionada' : 'Seleccionar'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

