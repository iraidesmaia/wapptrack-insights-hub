
interface N8nWhatsAppRequest {
  action: 'connect' | 'status' | 'send_message';
  instanceName?: string;
  phone?: string;
  message?: string;
}

interface N8nWhatsAppResponse {
  success: boolean;
  qrCode?: string;
  status?: 'disconnected' | 'connecting' | 'connected';
  instanceName?: string;
  error?: string;
}

const N8N_WEBHOOK_URL = 'https://n8n.workidigital.tech/webhook-test/wapp';

export const connectWhatsApp = async (): Promise<N8nWhatsAppResponse> => {
  try {
    console.log('🔄 Iniciando conexão WhatsApp via N8N...');
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'connect',
        instanceName: 'whatsapp-instance-' + Date.now()
      } as N8nWhatsAppRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: N8nWhatsAppResponse = await response.json();
    console.log('✅ Resposta N8N recebida:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao conectar WhatsApp via N8N:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

export const checkWhatsAppStatus = async (instanceName: string): Promise<N8nWhatsAppResponse> => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'status',
        instanceName
      } as N8nWhatsAppRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: N8nWhatsAppResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro ao verificar status WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

export const sendWhatsAppMessage = async (
  instanceName: string, 
  phone: string, 
  message: string
): Promise<N8nWhatsAppResponse> => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_message',
        instanceName,
        phone,
        message
      } as N8nWhatsAppRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: N8nWhatsAppResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
