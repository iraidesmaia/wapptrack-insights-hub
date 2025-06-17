
import { supabase } from "../integrations/supabase/client";

export interface ClientEvolutionSettings {
  id: string;
  client_id: string;
  user_id: string;
  evolution_api_key?: string;
  evolution_instance_name?: string;
  evolution_base_url?: string;
  webhook_callback_url?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export const getClientEvolutionSettings = async (clientId: string): Promise<ClientEvolutionSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('client_evolution_settings')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching client evolution settings:", error);
    return null;
  }
};

export const saveClientEvolutionSettings = async (settings: Omit<ClientEvolutionSettings, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ClientEvolutionSettings> => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // Verificar se já existe configuração para este cliente
    const existing = await getClientEvolutionSettings(settings.client_id);
    
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabase
        .from('client_evolution_settings')
        .update({
          evolution_api_key: settings.evolution_api_key,
          evolution_instance_name: settings.evolution_instance_name,
          evolution_base_url: settings.evolution_base_url,
          webhook_callback_url: settings.webhook_callback_url,
          webhook_url: settings.webhook_url
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('client_evolution_settings')
        .insert({
          ...settings,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error saving client evolution settings:", error);
    throw error;
  }
};

export const testClientEvolutionConnection = async (clientId: string, settings: Partial<ClientEvolutionSettings>): Promise<boolean> => {
  try {
    if (!settings.webhook_url) {
      throw new Error('URL do webhook não configurada');
    }

    const testPayload = {
      test: true,
      client_id: clientId,
      campaign_id: 'test-campaign',
      campaign_name: 'Teste de Webhook',
      lead_name: 'Lead de Teste',
      lead_phone: '11999999999',
      timestamp: new Date().toISOString(),
      event_type: 'test',
      evolution_config: {
        api_key: settings.evolution_api_key ? '***' : '',
        instance: settings.evolution_instance_name,
        base_url: settings.evolution_base_url
      }
    };

    const response = await fetch(settings.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error testing evolution connection:', error);
    return false;
  }
};
