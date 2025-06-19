
import { Client } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getClients = async (): Promise<Client[]> => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (clients || []).map(client => ({
      id: client.id,
      name: client.name,
      description: client.description || '',
      active: client.active,
      created_at: client.created_at,
      updated_at: client.updated_at,
      user_id: client.user_id
    }));
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
};

export const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Client> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        description: client.description,
        active: client.active,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id
    };
  } catch (error) {
    console.error("Erro ao adicionar cliente:", error);
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

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id
    };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    throw error;
  }
};

export const createDefaultClient = async (): Promise<Client> => {
  return await addClient({
    name: 'Projeto Principal',
    description: 'Projeto padrão criado automaticamente',
    active: true
  });
};
