import { create } from 'zustand';

interface Account {
  id: string;
  name: string;
  industry?: string;
  revenue?: number;
  employees?: number;
  location?: string;
  score?: number;
  segmentId?: string;
  territoryId?: string;
}

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  loading: false,
  error: null,
  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/accounts');
      const data = await response.json();
      set({ accounts: data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch accounts', loading: false });
    }
  },
  addAccount: async (account) => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const newAccount = await response.json();
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to add account', loading: false });
    }
  },
  updateAccount: async (id, account) => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const updatedAccount = await response.json();
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updatedAccount } : a)),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update account', loading: false });
    }
  },
}));