
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para criar variações específicas para DDD 85
const createPhoneVariationsForDDD85 = (phone: string): string[] => {
  const variations = new Set<string>();
  const digits = phone.replace(/\D/g, '');
  
  console.log(`Criando variações específicas para DDD 85 do número: ${digits}`);
  
  // Extrair apenas os últimos 8 ou 9 dígitos (sem DDD e código do país)
  let phoneDigits = '';
  
  if (digits.startsWith('5585')) {
    phoneDigits = digits.slice(4); // Remove 55 + 85
  } else if (digits.startsWith('85')) {
    phoneDigits = digits.slice(2); // Remove 85
  } else if (digits.length === 8 || digits.length === 9) {
    phoneDigits = digits; // Assume que já são apenas os dígitos do telefone
  } else {
    // Pegar os últimos 8 ou 9 dígitos
    phoneDigits = digits.slice(-9);
    if (phoneDigits.length > 9) {
      phoneDigits = phoneDigits.slice(-8);
    }
  }
  
  console.log(`Dígitos do telefone extraídos: ${phoneDigits}`);
  
  // Criar as duas variações específicas para DDD 85
  if (phoneDigits.length === 9 && phoneDigits.startsWith('9')) {
    // Se tem 9 dígitos e começa com 9: 85998372658
    variations.add('85' + phoneDigits);
    // Versão sem o 9 extra: 8598372658
    variations.add('85' + phoneDigits.slice(1));
  } else if (phoneDigits.length === 8) {
    // Se tem 8 dígitos: 8598372658
    variations.add('85' + phoneDigits);
    // Versão com 9 extra: 85998372658
    variations.add('859' + phoneDigits);
  } else if (phoneDigits.length === 9 && !phoneDigits.startsWith('9')) {
    // Se tem 9 dígitos mas não começa com 9, adicionar com e sem 9
    variations.add('85' + phoneDigits);
    variations.add('859' + phoneDigits);
  }
  
  // Adicionar versões com código do país também
  variations.forEach(variation => {
    if (!variation.startsWith('55')) {
      variations.add('55' + variation);
    }
  });
  
  const result = Array.from(variations);
  console.log(`Variações criadas para busca: ${JSON.stringify(result)}`);
  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('Evolution webhook received:', JSON.stringify(body, null, 2))

    if (body.event === 'messages.upsert' && body.data) {
      const message = body.data
      const remoteJid = message.key?.remoteJid
      
      if (remoteJid && !message.key?.fromMe) {
        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '')
        console.log(`🔍 Processing message from: ${phoneNumber}`)
        
        const messageContent = message.message?.conversation || 
                             message.message?.extendedTextMessage?.text || 
                             'Mensagem recebida'
        
        console.log(`📝 Message content: ${messageContent}`)
        
        // Criar variações específicas para DDD 85
        const phoneVariations = createPhoneVariationsForDDD85(phoneNumber);
        console.log(`📱 Phone variations for search: ${JSON.stringify(phoneVariations)}`);
        
        let matchedLeads = null;

        // Busca exata com as variações criadas
        console.log('🔍 Tentando busca exata com variações específicas para DDD 85...');
        const { data: exactMatches, error: exactError } = await supabase
          .from('leads')
          .select('*')
          .in('phone', phoneVariations);

        if (exactError) {
          console.error('❌ Error in exact search:', exactError);
        } else {
          matchedLeads = exactMatches;
          console.log(`🎯 Exact matches found: ${matchedLeads?.length || 0}`);
          if (matchedLeads && matchedLeads.length > 0) {
            console.log('✅ Found leads with exact match:', matchedLeads.map(l => ({ 
              name: l.name, 
              phone: l.phone, 
              status: l.status 
            })));
          }
        }

        // Se não encontrou com busca exata, tentar busca com LIKE pelos últimos 8 dígitos
        if (!matchedLeads || matchedLeads.length === 0) {
          const last8Digits = phoneNumber.slice(-8);
          console.log(`🔍 Trying LIKE search with last 8 digits: ${last8Digits}`);
          
          const { data: likeMatches, error: likeError } = await supabase
            .from('leads')
            .select('*')
            .ilike('phone', `%${last8Digits}`);

          if (likeError) {
            console.error('❌ Error in LIKE search:', likeError);
          } else {
            matchedLeads = likeMatches;
            console.log(`🎯 LIKE matches found: ${matchedLeads?.length || 0}`);
          }
        }

        if (matchedLeads && matchedLeads.length > 0) {
          console.log(`✅ Found ${matchedLeads.length} matching leads:`, matchedLeads.map(l => ({ 
            name: l.name, 
            phone: l.phone, 
            status: l.status 
          })));

          // Atualizar todos os leads encontrados
          const updatePromises = matchedLeads.map(async (lead) => {
            console.log(`📝 Updating lead ${lead.name} (${lead.phone}) - Status: ${lead.status} -> lead`);
            
            const { data: updatedLead, error: updateError } = await supabase
              .from('leads')
              .update({ 
                status: 'lead',
                last_message: messageContent,
                last_contact_date: new Date().toISOString()
              })
              .eq('id', lead.id)
              .select()
              .single();

            if (updateError) {
              console.error(`❌ Error updating lead ${lead.id}:`, updateError);
              return null;
            } else {
              console.log(`✅ Successfully updated lead ${lead.name}`);
              return updatedLead;
            }
          });

          const updatedLeads = await Promise.all(updatePromises);
          const successfulUpdates = updatedLeads.filter(lead => lead !== null);
          
          console.log(`🎉 Successfully updated ${successfulUpdates.length} leads`);
        } else {
          console.error(`❌ No lead found for phone: ${phoneNumber}`);
          console.log('🔍 Debug info:');
          console.log('- Original phone from webhook:', phoneNumber);
          console.log('- All variations tried:', phoneVariations);
          
          // Buscar alguns leads para comparação
          const { data: sampleLeads, error: sampleError } = await supabase
            .from('leads')
            .select('phone, name')
            .limit(5);
            
          if (!sampleError && sampleLeads && sampleLeads.length > 0) {
            console.log('📋 Sample leads in database:', sampleLeads);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('💥 Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
