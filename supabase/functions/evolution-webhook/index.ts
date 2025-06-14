
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      
      if (remoteJid && !message.key?.fromMe) {
        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '')
        console.log(`🔍 Processing message from: ${phoneNumber}`)
        
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
        
        let matchedLeads = null;

        // Busca exata com as variações específicas
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
              status: l.status,
              has_message: !!l.last_message
            })));
          }
        }

        if (matchedLeads && matchedLeads.length > 0) {
          console.log(`✅ Found ${matchedLeads.length} matching leads:`, matchedLeads.map(l => ({ 
            name: l.name, 
            phone: l.phone, 
            status: l.status,
            has_message: !!l.last_message
          })));

          // Atualizar todos os leads encontrados, mas APENAS SE NÃO TIVEREM MENSAGEM AINDA
          const updatePromises = matchedLeads.map(async (lead) => {
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
        } else {
          console.error(`❌ No lead found for phone: ${phoneNumber}`);
          console.log('🔍 Debug info:');
          console.log('- Original phone from webhook:', phoneNumber);
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
