
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função de correção automática de números
const correctPhoneNumber = (phone: string): string => {
  let correctedPhone = phone;

  console.log(`Corrigindo número: ${phone}`);

  // Caso específico do número problemático
  if (phone === '5585998732658') {
    correctedPhone = '558598372658';
    console.log(`Correção específica aplicada: ${phone} -> ${correctedPhone}`);
    return correctedPhone;
  }

  // Remover 9 duplicado em números brasileiros
  if (phone.startsWith('55') && phone.length === 13) {
    const withoutCountryCode = phone.slice(2);
    if (withoutCountryCode.length === 11 && withoutCountryCode[2] === '9' && withoutCountryCode[3] === '9') {
      correctedPhone = '55' + withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3);
      console.log(`Removendo 9 duplicado: ${phone} -> ${correctedPhone}`);
      return correctedPhone;
    }
  }

  return correctedPhone;
};

// Função simplificada para criar variações essenciais de um número
const createEssentialPhoneVariations = (phone: string): string[] => {
  const variations = new Set<string>();
  const digits = phone.replace(/\D/g, '');
  
  console.log(`Criando variações para: ${digits}`);
  
  // Adicionar o número original
  variations.add(digits);
  
  // Se começar com 55, criar versões sem código do país
  if (digits.startsWith('55')) {
    const withoutCountryCode = digits.slice(2);
    variations.add(withoutCountryCode);
    
    // Para números de 11 dígitos (DDD + 9 dígitos), criar versão sem o 9 extra
    if (withoutCountryCode.length === 11 && withoutCountryCode[2] === '9') {
      const ddd = withoutCountryCode.slice(0, 2);
      const numberPart = withoutCountryCode.slice(3); // Remove o 9
      const withoutNine = ddd + numberPart;
      variations.add(withoutNine);
      variations.add('55' + withoutNine); // Com código do país
    }
    
    // Para números de 10 dígitos (DDD + 8 dígitos), criar versão com 9 extra
    if (withoutCountryCode.length === 10) {
      const ddd = withoutCountryCode.slice(0, 2);
      const numberPart = withoutCountryCode.slice(2);
      const withNine = ddd + '9' + numberPart;
      variations.add(withNine);
      variations.add('55' + withNine); // Com código do país
    }
  } else {
    // Se não começar com 55, adicionar versão com código do país
    variations.add('55' + digits);
    
    // Para números de 10 dígitos, criar versão com 9 extra
    if (digits.length === 10) {
      const ddd = digits.slice(0, 2);
      const numberPart = digits.slice(2);
      const withNine = ddd + '9' + numberPart;
      variations.add(withNine);
      variations.add('55' + withNine);
    }
    
    // Para números de 11 dígitos com 9, criar versão sem o 9
    if (digits.length === 11 && digits[2] === '9') {
      const ddd = digits.slice(0, 2);
      const numberPart = digits.slice(3);
      const withoutNine = ddd + numberPart;
      variations.add(withoutNine);
      variations.add('55' + withoutNine);
    }
  }
  
  const result = Array.from(variations);
  console.log(`Variações criadas: ${JSON.stringify(result)}`);
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
        
        // Criar variações essenciais do número
        const phoneVariations = createEssentialPhoneVariations(phoneNumber);
        console.log(`📱 Phone variations for search: ${JSON.stringify(phoneVariations)}`);
        
        let matchedLeads = null;

        // Busca exata com as variações criadas
        console.log('🔍 Tentando busca exata com variações...');
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

        // Se ainda não encontrou, buscar pelos últimos 7 dígitos
        if (!matchedLeads || matchedLeads.length === 0) {
          const last7Digits = phoneNumber.slice(-7);
          console.log(`🔍 Trying broader search with last 7 digits: ${last7Digits}`);
          
          const { data: broadMatches, error: broadError } = await supabase
            .from('leads')
            .select('*')
            .ilike('phone', `%${last7Digits}%`);

          if (broadError) {
            console.error('❌ Error in broad search:', broadError);
          } else {
            matchedLeads = broadMatches;
            console.log(`🎯 Broad matches found: ${matchedLeads?.length || 0}`);
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
          
          // Se o número foi corrigido, atualizar com o número correto
          const correctedPhone = correctPhoneNumber(phoneNumber);
          if (phoneNumber !== correctedPhone) {
            for (const lead of matchedLeads) {
              if (lead.phone !== correctedPhone) {
                console.log(`🔧 Applying phone correction to lead ${lead.name}: ${lead.phone} -> ${correctedPhone}`);
                await supabase
                  .from('leads')
                  .update({ phone: correctedPhone })
                  .eq('id', lead.id);
              }
            }
          }
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
