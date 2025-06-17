
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { api_url, api_key } = await req.json();

    if (!api_url || !api_key) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'URL da API e chave são obrigatórios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Validando credenciais Evolution API:', api_url);

    // Testar conectividade com a Evolution API
    const testResponse = await fetch(`${api_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': api_key,
      },
    });

    console.log('Response status:', testResponse.status);

    if (testResponse.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Credenciais válidas'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      const errorText = await testResponse.text();
      console.error('Evolution API error:', errorText);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Credenciais inválidas ou API inacessível',
        details: `Status: ${testResponse.status}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (error) {
    console.error('Erro ao validar credenciais:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno ao validar credenciais',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
