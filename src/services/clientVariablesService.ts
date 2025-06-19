
import { supabase } from '@/integrations/supabase/client';

export interface ClientVariable {
  id: string;
  client_id: string;
  user_id: string;
  variable_name: string;
  variable_value: string | null;
  variable_type: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const getClientVariables = async (clientId: string): Promise<ClientVariable[]> => {
  try {
    const { data, error } = await supabase
      .from('client_variables')
      .select('*')
      .eq('client_id', clientId)
      .order('variable_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client variables:', error);
    return [];
  }
};

export const upsertClientVariable = async (
  clientId: string,
  variableName: string,
  variableValue: string,
  variableType: string = 'text',
  description?: string
): Promise<ClientVariable | null> => {
  try {
    const { data, error } = await supabase
      .from('client_variables')
      .upsert({
        client_id: clientId,
        variable_name: variableName,
        variable_value: variableValue,
        variable_type: variableType,
        description: description || null,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting client variable:', error);
    return null;
  }
};

export const deleteClientVariable = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_variables')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client variable:', error);
    return false;
  }
};
