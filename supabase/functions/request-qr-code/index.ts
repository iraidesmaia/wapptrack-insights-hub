
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionCredentials {
  apiKey: string;
  baseUrl: string;
}

const validateEvolutionCredentials = async (credentials: EvolutionCredentials): Promise<{ valid: boolean; error?: string }> => {
  try {
    // Teste básico de conectividade
    const testResponse = await fetch(`${credentials.baseUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': credentials.apiKey },
    });

    if (testResponse.status === 401 || testResponse.status === 403) {
      return { valid: false, error: 'API Key inválida ou sem permissão' };
    }

    if (!testResponse.ok && testResponse.status !== 404) {
      return { valid: false, error: `Evolution API não está respondendo (${testResponse.status})` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Erro de conexão: ${error.message}` };
  }
};

serve(async (req) => {
  console.log('=== NOVA REQUISIÇÃO EDGE FUNCTION ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const requestBody = await req.json();
    const { user_id, evolution_credentials } = requestBody;

    console.log('User ID recebido:', user_id);
    console.log('Credenciais customizadas:', !!evolution_credentials);

    if (!user_id) {
      console.error('user_id não fornecido');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'user_id é obrigatório' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Determinar credenciais a usar (customizadas ou padrão)
    let credentials: EvolutionCredentials;
    
    if (evolution_credentials?.apiKey && evolution_credentials?.baseUrl) {
      credentials = evolution_credentials;
      console.log('Usando credenciais customizadas');
    } else {
      // Usar credenciais padrão
      credentials = {
        baseUrl: 'https://evolutionapi.workidigital.tech',
        apiKey: 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia'
      };
      console.log('Usando credenciais padrão');
    }

    console.log('=== VALIDANDO CREDENCIAIS ===');
    const validation = await validateEvolutionCredentials(credentials);
    
    if (!validation.valid) {
      console.error('Credenciais inválidas:', validation.error);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Credenciais Evolution API inválidas: ${validation.error}`,
        suggestion: 'Verifique suas credenciais nas configurações'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const instanceName = `wpp_${user_id.slice(-8)}_${Date.now()}`;
    console.log('Nome da instância:', instanceName);

    const WEBHOOK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-evolution-receiver`;

    const evolutionPayload = {
      instanceName: instanceName,
      qrcode: true,
      webhook: {
        url: WEBHOOK_URL,
        enabled: true,
        events: [
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT"
        ]
      }
    };

    console.log('=== CRIANDO INSTÂNCIA ===');
    console.log('URL:', `${credentials.baseUrl}/instance/create`);
    console.log('Payload:', JSON.stringify(evolutionPayload, null, 2));

    const evolutionResponse = await fetch(`${credentials.baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': credentials.apiKey,
      },
      body: JSON.stringify(evolutionPayload),
    });

    console.log('Status da resposta:', evolutionResponse.status);
    
    const responseText = await evolutionResponse.text();
    console.log('Resposta raw:', responseText);

    let evolutionData;
    try {
      evolutionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Resposta inválida da Evolution API',
        details: responseText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Dados parsed:', evolutionData);

    if (!evolutionResponse.ok) {
      console.error('=== ERRO DA EVOLUTION API ===');
      console.error('Status:', evolutionResponse.status);
      console.error('Data:', evolutionData);

      let errorMessage = 'Erro na Evolution API';
      let suggestion = 'Tente novamente ou verifique as configurações';

      if (evolutionData?.response?.message?.includes('Invalid integration')) {
        errorMessage = 'Configuração de integração inválida';
        suggestion = 'Verifique se a API Key e URL estão corretas nas configurações';
      } else if (evolutionData?.response?.message) {
        const messages = Array.isArray(evolutionData.response.message) 
          ? evolutionData.response.message.join(', ')
          : evolutionData.response.message;
        errorMessage = messages;
      }

      return new Response(JSON.stringify({ 
        success: false,
        error: errorMessage,
        suggestion: suggestion,
        details: evolutionData
      }), {
        status: evolutionResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Sucesso - salvar no Supabase
    console.log('=== SALVANDO NO SUPABASE ===');
    const { error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        user_id: user_id,
        instance_name: instanceName,
        instance_token: evolutionData.instance?.token || null,
        status: 'QRCODE_WAITING',
        qrcode_base64: evolutionData.qrcode?.base64 || null,
      });

    if (dbError) {
      console.error('Erro ao salvar no Supabase:', dbError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Erro ao salvar instância no banco',
        details: dbError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('=== SUCESSO COMPLETO ===');
    return new Response(JSON.stringify({
      success: true,
      qrcode: evolutionData.qrcode?.base64 || null,
      instanceName: instanceName,
      message: 'Instância criada com sucesso'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error("=== ERRO GERAL ===");
    console.error('Erro:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
