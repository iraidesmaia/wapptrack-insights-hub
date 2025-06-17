
import { supabase } from "../integrations/supabase/client";
import type { CompanySettings, Theme } from '@/types';

export const getClientSettings = async (clientId: string): Promise<CompanySettings | null> => {
  try {
    console.log('🔍 Fetching settings for client:', clientId);
    
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error in getClientSettings:', error);
      throw error;
    }
    
    console.log('📊 Retrieved settings data:', data);
    return data as CompanySettings | null;
  } catch (error) {
    console.error("❌ Error fetching client settings:", error);
    return null;
  }
};

export const saveClientSettings = async (clientId: string, settings: Omit<CompanySettings, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'client_id'>): Promise<CompanySettings> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    
    console.log('💾 Saving settings for client:', clientId, 'User:', userId, 'Settings:', settings);
    
    // Verificar se já existe configuração para este cliente
    const existing = await getClientSettings(clientId);
    
    if (existing) {
      console.log('🔄 Updating existing settings for client:', clientId);
      
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
        .eq('client_id', clientId) // Garantir que só atualize para o cliente correto
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating settings:', error);
        throw error;
      }
      
      console.log('✅ Settings updated successfully:', data);
      return data as CompanySettings;
    } else {
      console.log('➕ Creating new settings for client:', clientId);
      
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

      if (error) {
        console.error('❌ Error creating settings:', error);
        throw error;
      }
      
      console.log('✅ Settings created successfully:', data);
      return data as CompanySettings;
    }
  } catch (error) {
    console.error("❌ Error saving client settings:", error);
    throw error;
  }
};
