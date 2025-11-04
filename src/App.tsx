import { useState, useEffect } from 'react';
import { AccountManager } from './components/AccountManager';
import { FilterSelector } from './components/FilterSelector';
import { ResultsTable } from './components/ResultsTable';
import { TogglService } from './services/togglService';
import type { TogglAccount, FilterConfig, TimeEntryResult } from './types';
import './App.css';

function App() {
  const [selectedAccounts, setSelectedAccounts] = useState<TogglAccount[]>([]);
  const [filterConfigs, setFilterConfigs] = useState<FilterConfig[]>([]);
  const [results, setResults] = useState<TimeEntryResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAccountSelect = (account: TogglAccount) => {
    if (!selectedAccounts.some(acc => acc.id === account.id)) {
      setSelectedAccounts([...selectedAccounts, account]);
      setFilterConfigs([
        ...filterConfigs,
        { accountId: account.id },
      ]);
    }
  };

  const handleFilterChange = (config: FilterConfig) => {
    const updated = filterConfigs.map((fc) =>
      fc.accountId === config.accountId ? config : fc
    );
    setFilterConfigs(updated);
  };

  const handleRemoveFilter = (accountId: string) => {
    setSelectedAccounts(selectedAccounts.filter(acc => acc.id !== accountId));
    setFilterConfigs(filterConfigs.filter(fc => fc.accountId !== accountId));
  };

  const loadResults = async () => {
    if (filterConfigs.length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const allResults: TimeEntryResult[] = [];

      for (const config of filterConfigs) {
        const account = selectedAccounts.find(acc => acc.id === config.accountId);
        if (!account || !config.workspaceId) {
          continue;
        }

        const togglService = new TogglService(account.apiToken);
        
        try {
          // Obtener información del usuario
          const userInfo = await togglService.getMe();
          const responsible = userInfo.fullname || userInfo.email || account.name;

          // Obtener time entries
          const entries = await togglService.getTimeEntries(config);

          // Enriquecer con información de la cuenta y responsable
          const enrichedEntries: TimeEntryResult[] = entries.map((entry) => ({
            ...entry,
            accountName: account.name,
            responsible: responsible,
          }));

          allResults.push(...enrichedEntries);
        } catch (error) {
          console.error(`Error loading data for account ${account.name}:`, error);
        }
      }

      // Ordenar por fecha de inicio (más reciente primero)
      allResults.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

      setResults(allResults);
    } catch (error) {
      console.error('Error loading results:', error);
      alert('Error al cargar los resultados. Verifica la configuración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-cargar resultados cuando cambian los filtros
    const hasValidFilters = filterConfigs.some(fc => fc.workspaceId);
    if (hasValidFilters && selectedAccounts.length > 0) {
      loadResults();
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterConfigs, selectedAccounts]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 Toggl Dashboard</h1>
        <p>Gestiona y visualiza tus tiempos de múltiples cuentas de Toggl</p>
      </header>

      <main className="app-main">
        <section className="section">
          <AccountManager
            onAccountSelect={handleAccountSelect}
            selectedAccounts={selectedAccounts}
            autoSelectNew={true}
          />
        </section>

        {selectedAccounts.length > 0 && (
          <section className="section">
            <div className="filters-header">
              <h2>Filtros de Consulta</h2>
              <button
                className="btn btn-primary"
                onClick={loadResults}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Actualizar Resultados'}
              </button>
            </div>
            <div className="filters-container">
              {selectedAccounts.map((account) => {
                const filterConfig = filterConfigs.find(
                  (fc) => fc.accountId === account.id
                );
                if (!filterConfig) return null;

                return (
                  <FilterSelector
                    key={account.id}
                    account={account}
                    onFilterChange={handleFilterChange}
                    onRemove={() => handleRemoveFilter(account.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section className="section">
          <h2>Resultados</h2>
          <ResultsTable results={results} loading={loading} />
        </section>
      </main>
    </div>
  );
}

export default App;

