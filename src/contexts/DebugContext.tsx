import { createContext, useContext, useState, ReactNode } from 'react';
import { AppRole, UserRole } from '@/lib/roles';

interface Customer {
  id: string;
  customer_name: string;
  short_name: string;
}

interface DebugContextType {
  debugRole: UserRole | null;
  setDebugRole: (role: UserRole | null) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  isDebugMode: boolean;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugRole, setDebugRole] = useState<UserRole | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const value = {
    debugRole,
    setDebugRole,
    selectedCustomer,
    setSelectedCustomer,
    isDebugMode: debugRole !== null,
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}

export type { Customer };