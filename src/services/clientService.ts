
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';

export const getActiveClients = async (userId: string): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active clients:', error);
    return [];
  }
};

export const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating client:', error);
    return null;
  }
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};
