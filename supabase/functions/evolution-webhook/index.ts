
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

// Função para criar todas as variações possíveis de um número
const createAllPhoneVariations = (phone: string): string[] => {
  const originalPhone = phone;
  const correctedPhone = correctPhoneNumber(phone);
  const variations = new Set<string>();
  
  // Adicionar número original e corrigido
  variations.add(originalPhone);
  variations.add(correctedPhone);
  
  // Para cada número (original e corrigido), criar variações
  [originalPhone, correctedPhone].forEach(num => {
    // Variação sem código do país (se começar com 55)
    if (num.startsWith('55') && num.length >= 12) {
      const withoutCountry = num.slice(2);
      variations.add(withoutCountry);
      
      // Se tem 11 dígitos (DDD + 9 dígitos), tentar sem o 9 extra
      if (withoutCountry.length === 11 && withoutCountry[2] === '9') {
        const without9 = withoutCountry.slice(0, 2) + withoutCountry.slice(3);
        variations.add(without9);
        variations.add('55' + without9);
      }
      
      // Se tem 10 dígitos (DDD + 8 dígitos), tentar com 9 extra
      if (withoutCountry.length === 10) {
        const with9 = withoutCountry.slice(0, 2) + '9' + withoutCountry.slice(2);
        variations.add(with9);
        variations.add('55' + with9);
      }
    }
    
    // Variação com código do país (se não começar com 55)
    if (!num.startsWith('55')) {
      variations.add('55' + num);
      
      // Se tem 10 dígitos, tentar com 9 extra
      if (num.length === 10) {
        const with9 = num.slice(0, 2) + '9' + num.slice(2);
        variations.add(with9);
        variations.add('55' + with9);
      }
      
      // Se tem 11 dígitos e terceiro dígito é 9, tentar sem o 9
      if (num.length === 11 && num[2] === '9') {
        const without9 = num.slice(0, 2) + num.slice(3);
        variations.add(without9);
        variations.add('55' + without9);
      }
    }
  });
  
  return Array.from(variations);
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
        console.log(`Processing message from: ${phoneNumber}`)
        
        const messageContent = message.message?.conversation || 
                             message.message?.extendedTextMessage?.text || 
                             'Mensagem recebida'
        
        console.log(`Extracted message content: ${messageContent}`)
        
        // Criar todas as variações possíveis do número
        const phoneVariations = createAllPhoneVariations(phoneNumber);
        console.log(`Phone variations created: ${JSON.stringify(phoneVariations)}`);
        
        // Primeiro, vamos buscar TODOS os leads para debug
        const { data: allLeads, error: allLeadsError } = await supabase
          .from('leads')
          .select('id, name, phone, status');
          
        if (allLeadsError) {
          console.error('Error fetching all leads for debug:', allLeadsError);
        } else {
          console.log(`Total leads in database: ${allLeads?.length}`);
          console.log('Sample of leads in database:', allLeads?.slice(0, 5).map(l => ({ name: l.name, phone: l.phone })));
        }
        
        // Agora buscar leads que correspondem às variações
        const { data: matchedLeads, error: searchError } = await supabase
          .from('leads')
          .select('*')
          .in('phone', phoneVariations);

        if (searchError) {
          console.error('Error searching leads:', searchError);
        } else {
          console.log(`Found ${matchedLeads?.length || 0} matching leads:`, matchedLeads?.map(l => ({ name: l.name, phone: l.phone, status: l.status })));
        }

        if (matchedLeads && matchedLeads.length > 0) {
          // Atualizar todos os leads encontrados
          const updatePromises = matchedLeads.map(async (lead) => {
            console.log(`Updating lead ${lead.name} (${lead.phone}) - Status: ${lead.status} -> lead`);
            
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
              console.error(`Error updating lead ${lead.id}:`, updateError);
              return null;
            } else {
              console.log(`Successfully updated lead ${lead.name} (${lead.phone})`);
              return updatedLead;
            }
          });

          const updatedLeads = await Promise.all(updatePromises);
          const successfulUpdates = updatedLeads.filter(lead => lead !== null);
          
          console.log(`Successfully updated ${successfulUpdates.length} leads`);
          
          // Se o número foi corrigido, atualizar com o número correto
          const correctedPhone = correctPhoneNumber(phoneNumber);
          if (phoneNumber !== correctedPhone) {
            for (const lead of matchedLeads) {
              if (lead.phone === phoneNumber) {
                console.log(`Applying phone correction to lead ${lead.name}: ${phoneNumber} -> ${correctedPhone}`);
                await supabase
                  .from('leads')
                  .update({ phone: correctedPhone })
                  .eq('id', lead.id);
              }
            }
          }
        } else {
          console.error(`❌ No lead found for phone variations: ${JSON.stringify(phoneVariations)}`);
          console.log('🔍 Debug info:');
          console.log('- Original phone from webhook:', phoneNumber);
          console.log('- Corrected phone:', correctPhoneNumber(phoneNumber));
          console.log('- All variations tried:', phoneVariations);
          
          // Fazer uma busca mais ampla para debug
          const { data: similarLeads, error: similarError } = await supabase
            .from('leads')
            .select('phone, name')
            .ilike('phone', `%${phoneNumber.slice(-8)}%`);
            
          if (!similarError && similarLeads && similarLeads.length > 0) {
            console.log('🔍 Similar leads found by last 8 digits:', similarLeads);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
