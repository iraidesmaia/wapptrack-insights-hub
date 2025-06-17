
import { supabase } from "../integrations/supabase/client";
import type { CompanySettings } from '@/types';

export const getClientSettings = async (clientId: string): Promise<CompanySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching client settings:", error);
    return null;
  }
};

export const saveClientSettings = async (clientId: string, settings: Omit<CompanySettings, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'client_id'>): Promise<CompanySettings> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // Verificar se já existe configuração para este cliente
    const existing = await getClientSettings(clientId);
    
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          company_name: settings.company_name,
          company_subtitle: settings.company_subtitle,
          logo_url: settings.logo_url,
          theme: settings.theme
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('company_settings')
        .insert({
          ...settings,
          client_id: clientId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error saving client settings:", error);
    throw error;
  }
};
