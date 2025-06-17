
import { supabase } from '@/integrations/supabase/client';

interface EvolutionConfig {
  evolution_api_key: string;
  evolution_instance_name: string;
  evolution_base_url: string;
  webhook_callback_url?: string;
}

interface SendMessagePayload {
  campaignId: string;
  campaignName: string;
  phone: string;
  name: string;
  message?: string;
}

export const sendToEvolutionAPI = async (payload: SendMessagePayload): Promise<{success: boolean, error?: string}> => {
  try {
    // Buscar configurações da Evolution API
    const evolutionConfigStr = localStorage.getItem('evolution_config');
    if (!evolutionConfigStr) {
      throw new Error('Configurações da Evolution API não encontradas');
    }

    const config: EvolutionConfig = JSON.parse(evolutionConfigStr);
    
    if (!config.evolution_api_key || !config.evolution_instance_name || !config.evolution_base_url) {
      throw new Error('Configurações da Evolution API incompletas');
    }

    // Criar lead pendente
    const { error: pendingError } = await supabase
      .from('pending_leads')
      .insert({
        campaign_id: payload.campaignId,
        campaign_name: payload.campaignName,
        name: payload.name,
        phone: payload.phone,
        webhook_sent_at: new Date().toISOString(),
        status: 'pending',
        webhook_data: {
          evolution_config: {
            instance: config.evolution_instance_name,
            base_url: config.evolution_base_url
          },
          message: payload.message
        }
      });

    if (pendingError) {
      console.error('Error creating pending lead:', pendingError);
      throw new Error('Erro ao criar lead pendente');
    }

    // Preparar mensagem para Evolution API
    const messageText = payload.message || `Olá ${payload.name}! Obrigado pelo seu interesse. Em breve entraremos em contato!`;
    
    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(`${config.evolution_base_url}/message/sendText/${config.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolution_api_key
      },
      body: JSON.stringify({
        number: payload.phone,
        text: messageText,
        delay: 1000
      })
    });

    const evolutionData = await evolutionResponse.json();

    if (!evolutionResponse.ok) {
      console.error('Evolution API error:', evolutionData);
      
      // Marcar lead pendente como falha
      await supabase
        .from('pending_leads')
        .update({ 
          status: 'failed',
          webhook_data: {
            error: evolutionData,
            failed_at: new Date().toISOString()
          }
        })
        .eq('phone', payload.phone)
        .eq('status', 'pending');

      throw new Error(`Erro na Evolution API: ${evolutionData.error || 'Erro desconhecido'}`);
    }

    console.log('Message sent successfully via Evolution API:', evolutionData);
    
    return { success: true };

  } catch (error: any) {
    console.error('Error sending to Evolution API:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao enviar via Evolution API' 
    };
  }
};

export const checkEvolutionApiHealth = async (): Promise<{healthy: boolean, error?: string}> => {
  try {
    const evolutionConfigStr = localStorage.getItem('evolution_config');
    if (!evolutionConfigStr) {
      return { healthy: false, error: 'Configurações não encontradas' };
    }

    const config: EvolutionConfig = JSON.parse(evolutionConfigStr);
    
    // Verificar status da instância
    const response = await fetch(`${config.evolution_base_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': config.evolution_api_key
      }
    });

    if (!response.ok) {
      return { healthy: false, error: 'API não está respondendo' };
    }

    const data = await response.json();
    const instance = data.find((inst: any) => inst.instance.instanceName === config.evolution_instance_name);
    
    if (!instance) {
      return { healthy: false, error: 'Instância não encontrada' };
    }

    if (instance.instance.connectionStatus !== 'open') {
      return { healthy: false, error: 'WhatsApp não está conectado' };
    }

    return { healthy: true };

  } catch (error: any) {
    return { 
      healthy: false, 
      error: error.message || 'Erro ao verificar status' 
    };
  }
};
