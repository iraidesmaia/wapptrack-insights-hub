
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '@/types';
import { getClients, createDefaultClient } from '@/services/clientService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client) => void;
  loadClients: () => Promise<void>;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClientState] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadClients = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      let clientsList = await getClients();
      
      // Se não houver clientes, criar um padrão
      if (clientsList.length === 0) {
        console.log('Nenhum cliente encontrado, criando cliente padrão...');
        const defaultClient = await createDefaultClient();
        if (defaultClient) {
          clientsList = [defaultClient];
        }
      }
      
      setClients(clientsList);
      
      // Se não há cliente selecionado, selecionar o primeiro
      if (!selectedClient && clientsList.length > 0) {
        const savedClientId = localStorage.getItem('selectedClientId');
        const clientToSelect = savedClientId 
          ? clientsList.find(c => c.id === savedClientId) || clientsList[0]
          : clientsList[0];
        
        setSelectedClientState(clientToSelect);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedClient = (client: Client) => {
    setSelectedClientState(client);
    localStorage.setItem('selectedClientId', client.id);
  };

  useEffect(() => {
    if (user) {
      loadClients();
    } else {
      setClients([]);
      setSelectedClientState(null);
      setIsLoading(false);
    }
  }, [user]);

  const value = {
    clients,
    selectedClient,
    setSelectedClient,
    loadClients,
    isLoading
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};
