
interface EvolutionResponse {
  success: boolean;
  qrCode?: string;
  status?: 'disconnected' | 'connecting' | 'connected';
  instanceName?: string;
  error?: string;
  data?: any;
}

const EVOLUTION_BASE_URL = 'https://evolutionapi.workidigital.tech';
const EVOLUTION_API_KEY = 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia';
const INSTANCE_NAME = 'wapptrack';
const WEBHOOK_URL = 'https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook';

// Verificar se a instância existe
export const checkInstanceExists = async (): Promise<EvolutionResponse> => {
  try {
    console.log('🔍 Verificando se instância wapptrack existe...');
    
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const instances = await response.json();
    console.log('📋 Instâncias encontradas:', instances);
    
    const instance = instances.find((inst: any) => inst.instance?.instanceName === INSTANCE_NAME);
    
    if (instance) {
      return {
        success: true,
        status: instance.instance?.connectionStatus === 'open' ? 'connected' : 'disconnected',
        instanceName: INSTANCE_NAME
      };
    }

    return {
      success: false,
      error: 'Instância não encontrada'
    };
  } catch (error) {
    console.error('❌ Erro ao verificar instância:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

// Criar instância se não existir
export const createInstance = async (): Promise<EvolutionResponse> => {
  try {
    console.log('🔄 Criando instância wapptrack...');
    
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        token: EVOLUTION_API_KEY,
        webhook: {
          url: WEBHOOK_URL,
          events: ['MESSAGES_UPSERT'],
          webhook_by_events: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Instância criada:', data);
    
    return {
      success: true,
      instanceName: INSTANCE_NAME,
      data
    };
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar instância'
    };
  }
};

// Conectar instância e gerar QR Code
export const connectInstance = async (): Promise<EvolutionResponse> => {
  try {
    console.log('🔄 Conectando instância wapptrack...');
    
    // Primeiro verificar se instância existe, se não, criar
    const existsCheck = await checkInstanceExists();
    if (!existsCheck.success) {
      console.log('📱 Instância não existe, criando...');
      const createResult = await createInstance();
      if (!createResult.success) {
        return createResult;
      }
    }

    // Conectar a instância
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Resposta de conexão:', data);
    
    return {
      success: true,
      qrCode: data.base64,
      instanceName: INSTANCE_NAME,
      status: 'connecting'
    };
  } catch (error) {
    console.error('❌ Erro ao conectar instância:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar instância'
    };
  }
};

// Verificar status da instância
export const getInstanceStatus = async (): Promise<EvolutionResponse> => {
  try {
    console.log('🔍 Verificando status da instância wapptrack...');
    
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Status da instância:', data);
    
    let status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
    if (data.instance?.connectionStatus === 'open') {
      status = 'connected';
    } else if (data.instance?.connectionStatus === 'connecting') {
      status = 'connecting';
    }
    
    return {
      success: true,
      status,
      instanceName: INSTANCE_NAME,
      data
    };
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar status'
    };
  }
};

// Enviar mensagem
export const sendMessage = async (phone: string, message: string): Promise<EvolutionResponse> => {
  try {
    console.log('📤 Enviando mensagem via wapptrack...', { phone, message });
    
    const response = await fetch(`${EVOLUTION_BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phone,
        text: message,
        delay: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Mensagem enviada:', data);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enviar mensagem'
    };
  }
};

// Configurar webhook (caso não tenha sido configurado na criação)
export const configureWebhook = async (): Promise<EvolutionResponse> => {
  try {
    console.log('🔗 Configurando webhook para wapptrack...');
    
    const response = await fetch(`${EVOLUTION_BASE_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: ['MESSAGES_UPSERT'],
        webhook_by_events: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Webhook configurado:', data);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao configurar webhook'
    };
  }
};
