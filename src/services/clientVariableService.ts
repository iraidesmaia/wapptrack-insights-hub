
import { supabase } from "../integrations/supabase/client";

export interface ClientVariable {
  id: string;
  client_id: string;
  user_id: string;
  variable_name: string;
  variable_value: string;
  variable_type: 'text' | 'number' | 'boolean' | 'url';
  description?: string;
  created_at: string;
  updated_at: string;
}

export const getClientVariables = async (clientId: string): Promise<ClientVariable[]> => {
  try {
    const { data, error } = await supabase
      .from('client_variables')
      .select('*')
      .eq('client_id', clientId)
      .order('variable_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching client variables:", error);
    return [];
  }
};

export const addClientVariable = async (variable: Omit<ClientVariable, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ClientVariable> => {
  try {
    const { data, error } = await supabase
      .from('client_variables')
      .insert({
        ...variable,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding client variable:", error);
    throw error;
  }
};

export const updateClientVariable = async (id: string, variable: Partial<ClientVariable>): Promise<ClientVariable> => {
  try {
    const updateData: any = {};
    if (variable.variable_name !== undefined) updateData.variable_name = variable.variable_name;
    if (variable.variable_value !== undefined) updateData.variable_value = variable.variable_value;
    if (variable.variable_type !== undefined) updateData.variable_type = variable.variable_type;
    if (variable.description !== undefined) updateData.description = variable.description;

    const { data, error } = await supabase
      .from('client_variables')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating client variable:", error);
    throw error;
  }
};

export const deleteClientVariable = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('client_variables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting client variable:", error);
    throw error;
  }
};
