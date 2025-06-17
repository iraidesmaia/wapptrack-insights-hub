
import { supabase } from '@/integrations/supabase/client';
import { sendMessage } from './evolutionDirectService';

interface SendMessagePayload {
  campaignId: string;
  campaignName: string;
  phone: string;
  name: string;
  message?: string;
}

export const sendToEvolutionAPI = async (payload: SendMessagePayload): Promise<{success: boolean, error?: string}> => {
  try {
    console.log('📤 Enviando mensagem via Evolution API (wapptrack):', payload);

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
            instance: 'wapptrack',
            base_url: 'https://evolutionapi.workidigital.tech'
          },
          message: payload.message
        }
      });

    if (pendingError) {
      console.error('Error creating pending lead:', pendingError);
      throw new Error('Erro ao criar lead pendente');
    }

    // Preparar mensagem
    const messageText = payload.message || `Olá ${payload.name}! Obrigado pelo seu interesse. Em breve entraremos em contato!`;
    
    // Enviar mensagem via Evolution API direta
    const evolutionResult = await sendMessage(payload.phone, messageText);

    if (!evolutionResult.success) {
      console.error('Evolution API error:', evolutionResult.error);
      
      // Marcar lead pendente como falha
      await supabase
        .from('pending_leads')
        .update({ 
          status: 'failed',
          webhook_data: {
            error: evolutionResult.error,
            failed_at: new Date().toISOString()
          }
        })
        .eq('phone', payload.phone)
        .eq('status', 'pending');

      throw new Error(`Erro na Evolution API: ${evolutionResult.error}`);
    }

    console.log('✅ Mensagem enviada com sucesso via wapptrack:', evolutionResult.data);
    
    return { success: true };

  } catch (error: any) {
    console.error('❌ Erro ao enviar via Evolution API:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao enviar via Evolution API' 
    };
  }
};

export const checkEvolutionApiHealth = async (): Promise<{healthy: boolean, error?: string}> => {
  try {
    // Usar o serviço direto para verificar status
    const { getInstanceStatus } = await import('./evolutionDirectService');
    const result = await getInstanceStatus();
    
    if (!result.success) {
      return { healthy: false, error: result.error };
    }

    if (result.status !== 'connected') {
      return { healthy: false, error: 'WhatsApp não está conectado na instância wapptrack' };
    }

    return { healthy: true };

  } catch (error: any) {
    return { 
      healthy: false, 
      error: error.message || 'Erro ao verificar status da wapptrack' 
    };
  }
};
