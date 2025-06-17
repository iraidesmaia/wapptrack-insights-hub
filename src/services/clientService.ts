
import { Client } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getClients = async (): Promise<Client[]> => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return clients || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};

export const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        description: client.description || '',
        active: client.active !== false,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};

export const updateClient = async (id: string, client: Partial<Client>): Promise<Client> => {
  try {
    const updateData: any = {};
    if (client.name !== undefined) updateData.name = client.name;
    if (client.description !== undefined) updateData.description = client.description;
    if (client.active !== undefined) updateData.active = client.active;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

export const createDefaultClient = async (): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente Principal',
        description: 'Cliente padrão',
        active: true,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating default client:", error);
    return null;
  }
};
