
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
        
        // Criar variações do número para busca, incluindo correções automáticas
        const originalPhone = phoneNumber;
        const correctedPhone = correctPhoneNumber(phoneNumber);
        
        const phoneVariations = [
          originalPhone,
          correctedPhone,
          phoneNumber.startsWith('55') ? phoneNumber.slice(2) : phoneNumber,
          phoneNumber.startsWith('55') ? phoneNumber.slice(2) : `55${phoneNumber}`,
          phoneNumber.length === 10 ? `55${phoneNumber.slice(0,2)}9${phoneNumber.slice(2)}` : phoneNumber
        ];
        
        // Remover duplicatas
        const uniquePhoneVariations = [...new Set(phoneVariations)];
        
        console.log(`Updating lead status for phone variations: ${JSON.stringify(uniquePhoneVariations)} to: lead`)
        
        const { data: updatedLeads, error } = await supabase
          .from('leads')
          .update({ 
            status: 'lead',
            last_message: messageContent,
            last_contact_date: new Date().toISOString()
          })
          .in('phone', uniquePhoneVariations)
          .select()

        if (error) {
          console.error('Error updating lead:', error)
        } else if (updatedLeads && updatedLeads.length > 0) {
          console.log(`Updated ${updatedLeads.length} lead(s):`, updatedLeads.map(lead => `${lead.name} (${lead.phone})`))
          
          // Se o número foi corrigido, atualizar o lead com o número correto
          if (originalPhone !== correctedPhone) {
            const leadToCorrect = updatedLeads.find(lead => lead.phone === originalPhone);
            if (leadToCorrect) {
              console.log(`Applying phone correction: ${originalPhone} -> ${correctedPhone}`);
              await supabase
                .from('leads')
                .update({ phone: correctedPhone })
                .eq('id', leadToCorrect.id);
            }
          }
        } else {
          console.error(`No lead found for phone variations: ${JSON.stringify(uniquePhoneVariations)}`)
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
