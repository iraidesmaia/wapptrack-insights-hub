
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Palavras-chave padrão (fallback)
const DEFAULT_CONVERSION_KEYWORDS = [
  'obrigado pela compra',
  'obrigada pela compra',
  'venda confirmada',
  'pedido aprovado',
  'parabéns pela aquisição',
  'compra realizada',
  'vendido',
  'venda fechada',
  'negócio fechado',
  'parabéns pela compra',
  'obrigado por comprar',
  'obrigada por comprar',
  'sua compra foi',
  'compra efetuada',
  'pedido confirmado'
];

const DEFAULT_CANCELLATION_KEYWORDS = [
  'compra cancelada',
  'pedido cancelado',
  'cancelamento',
  'desistiu da compra',
  'não quer mais',
  'mudou de ideia',
  'cancelar pedido',
  'estorno',
  'devolver',
  'não conseguiu pagar'
];

function detectKeywords(messageContent: string, keywords: string[]): boolean {
  const lowerMessage = messageContent.toLowerCase();
  return keywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

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
      const isFromMe = message.key?.fromMe
      
      if (remoteJid) {
        const realPhoneNumber = remoteJid.replace('@s.whatsapp.net', '')
        console.log(`🔍 Processing message from: ${realPhoneNumber}, fromMe: ${isFromMe}`)
        
        const messageContent = message.message?.conversation || 
                             message.message?.extendedTextMessage?.text || 
                             'Mensagem recebida'
        
        console.log(`📝 Message content: ${messageContent}`)
        
        // Criar as duas variações específicas para DDD 85
        const phoneVariations = [
          '85998372658',
          '8598372658',
          '5585998372658', 
          '558598372658'
        ];
        
        console.log(`📱 Phone variations for search: ${JSON.stringify(phoneVariations)}`);
        console.log(`📲 Real phone number from Evolution: ${realPhoneNumber}`);
        
        let matchedLeads = null;

        // Busca exata com as variações específicas
        console.log('🔍 Tentando busca exata com variações específicas para DDD 85...');
        const { data: exactMatches, error: exactError } = await supabase
          .from('leads')
          .select('*, campaigns!leads_campaign_id_fkey(conversion_keywords, cancellation_keywords)')
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
              status: l.status,
              has_message: !!l.last_message,
              campaign_id: l.campaign_id
            })));
          }
        }

        if (matchedLeads && matchedLeads.length > 0) {
          console.log(`✅ Found ${matchedLeads.length} matching leads`);

          // 🔥 NOVA LÓGICA: Verificar se é mensagem DO COMERCIAL (fromMe: true)
          if (isFromMe) {
            console.log(`🎯 Message FROM commercial detected! Checking for conversion/cancellation keywords...`);
            console.log(`💬 Commercial message: "${messageContent}"`);
            
            // Processar cada lead encontrado
            const updatePromises = matchedLeads.map(async (lead) => {
              // 📲 NOVO: Verificar se o número real é diferente do salvo
              if (lead.phone !== realPhoneNumber) {
                console.log(`📞 PHONE UPDATE NEEDED: Lead ${lead.name}`);
                console.log(`   - Stored phone: ${lead.phone}`);
                console.log(`   - Real phone from Evolution: ${realPhoneNumber}`);
                
                // Atualizar o número do lead com o número real da Evolution
                const { error: phoneUpdateError } = await supabase
                  .from('leads')
                  .update({ phone: realPhoneNumber })
                  .eq('id', lead.id);

                if (phoneUpdateError) {
                  console.error(`❌ Error updating phone for lead ${lead.id}:`, phoneUpdateError);
                } else {
                  console.log(`✅ Successfully updated phone for lead ${lead.name}: ${lead.phone} → ${realPhoneNumber}`);
                  // Atualizar o lead local para usar o número atualizado
                  lead.phone = realPhoneNumber;
                }
              } else {
                console.log(`📞 Phone number matches, no update needed for lead ${lead.name}: ${lead.phone}`);
              }

              // Buscar palavras-chave personalizadas da campanha
              let conversionKeywords = DEFAULT_CONVERSION_KEYWORDS;
              let cancellationKeywords = DEFAULT_CANCELLATION_KEYWORDS;
              
              if (lead.campaigns && lead.campaigns.conversion_keywords) {
                conversionKeywords = lead.campaigns.conversion_keywords;
                console.log(`📋 Using custom conversion keywords for campaign: ${JSON.stringify(conversionKeywords)}`);
              }
              
              if (lead.campaigns && lead.campaigns.cancellation_keywords) {
                cancellationKeywords = lead.campaigns.cancellation_keywords;
                console.log(`📋 Using custom cancellation keywords for campaign: ${JSON.stringify(cancellationKeywords)}`);
              }
              
              // Verificar se contém palavras-chave de conversão
              const hasConversionKeywords = detectKeywords(messageContent, conversionKeywords);
              
              // Verificar se contém palavras-chave de cancelamento
              const hasCancellationKeywords = detectKeywords(messageContent, cancellationKeywords);
              
              if (hasConversionKeywords) {
                console.log(`🎉 CONVERSION DETECTED! Converting lead ${lead.name} to 'converted' status`);
                
                const { data: convertedLead, error: conversionError } = await supabase
                  .from('leads')
                  .update({ 
                    status: 'converted',
                    last_contact_date: new Date().toISOString()
                  })
                  .eq('id', lead.id)
                  .select()
                  .single();

                if (conversionError) {
                  console.error(`❌ Error converting lead ${lead.id}:`, conversionError);
                  return null;
                } else {
                  console.log(`✅ Successfully converted lead ${lead.name} to 'converted'`);
                  return convertedLead;
                }
              } else if (hasCancellationKeywords) {
                console.log(`❌ CANCELLATION DETECTED! Marking lead ${lead.name} as 'lost'`);
                
                const { data: cancelledLead, error: cancellationError } = await supabase
                  .from('leads')
                  .update({ 
                    status: 'lost',
                    last_contact_date: new Date().toISOString()
                  })
                  .eq('id', lead.id)
                  .select()
                  .single();

                if (cancellationError) {
                  console.error(`❌ Error marking lead ${lead.id} as lost:`, cancellationError);
                  return null;
                } else {
                  console.log(`✅ Successfully marked lead ${lead.name} as 'lost'`);
                  return cancelledLead;
                }
              } else {
                console.log(`💬 Commercial message doesn't contain conversion or cancellation keywords, ignoring...`);
                return { skipped: true, lead };
              }
            });

            const updateResults = await Promise.all(updatePromises);
            const successfulUpdates = updateResults.filter(result => result !== null && !result.skipped);
            const skippedUpdates = updateResults.filter(result => result && result.skipped);
            
            console.log(`🎉 Successfully processed ${successfulUpdates.length} leads`);
            console.log(`⏭️ Skipped ${skippedUpdates.length} leads (no keywords matched)`);
          } 
          // 📨 LÓGICA EXISTENTE: Mensagem DO CLIENTE (fromMe: false)
          else if (!isFromMe) {
            console.log(`📨 Message FROM client detected, processing for first message logic...`);
            
            // Atualizar todos os leads encontrados, mas APENAS SE NÃO TIVEREM MENSAGEM AINDA
            const updatePromises = matchedLeads.map(async (lead) => {
              // 📲 NOVO: Verificar se o número real é diferente do salvo
              if (lead.phone !== realPhoneNumber) {
                console.log(`📞 PHONE UPDATE NEEDED: Lead ${lead.name}`);
                console.log(`   - Stored phone: ${lead.phone}`);
                console.log(`   - Real phone from Evolution: ${realPhoneNumber}`);
                
                // Atualizar o número do lead com o número real da Evolution
                const { error: phoneUpdateError } = await supabase
                  .from('leads')
                  .update({ phone: realPhoneNumber })
                  .eq('id', lead.id);

                if (phoneUpdateError) {
                  console.error(`❌ Error updating phone for lead ${lead.id}:`, phoneUpdateError);
                } else {
                  console.log(`✅ Successfully updated phone for lead ${lead.name}: ${lead.phone} → ${realPhoneNumber}`);
                  // Atualizar o lead local para usar o número atualizado
                  lead.phone = realPhoneNumber;
                }
              } else {
                console.log(`📞 Phone number matches, no update needed for lead ${lead.name}: ${lead.phone}`);
              }

              // ✅ VERIFICAR SE O LEAD JÁ TEM UMA MENSAGEM SALVA
              if (lead.last_message && lead.last_message.trim() !== '') {
                console.log(`⏭️ Skipping lead ${lead.name} (${lead.phone}) - already has message: "${lead.last_message}"`);
                return { skipped: true, lead };
              }

              console.log(`📝 Updating lead ${lead.name} (${lead.phone}) - Status: ${lead.status} -> lead`);
              console.log(`💬 Saving FIRST message: "${messageContent}"`);
              
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
                console.log(`✅ Successfully updated lead ${lead.name} with FIRST message: "${messageContent}"`);
                return updatedLead;
              }
            });

            const updateResults = await Promise.all(updatePromises);
            const successfulUpdates = updateResults.filter(result => result !== null && !result.skipped);
            const skippedUpdates = updateResults.filter(result => result && result.skipped);
            
            console.log(`🎉 Successfully updated ${successfulUpdates.length} leads with FIRST message`);
            console.log(`⏭️ Skipped ${skippedUpdates.length} leads that already had messages`);
          }
        } else {
          console.error(`❌ No lead found for phone: ${realPhoneNumber}`);
          console.log('🔍 Debug info:');
          console.log('- Original phone from webhook:', realPhoneNumber);
          console.log('- Variations tried:', phoneVariations);
          
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
