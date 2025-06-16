
import { supabase } from "../integrations/supabase/client";

/**
 * Inclui campos UTM opcionalmente no lead.
 */
export const trackRedirect = async (
  campaignId: string, 
  phone: string, 
  name?: string,
  eventType?: string,
  utms?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
  }
): Promise<{targetPhone?: string}> => {
  try {
    // Log recebendo todos os dados para debug detalhado
    console.log('➡️ trackRedirect chamado com:', {
      campaignId,
      phone,
      name,
      eventType,
      utms
    });

    // Busca a campanha por ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Campanha não encontrada -> fallback default
    if (campaignError || !campaign) {
      console.log(`Campaign with ID ${campaignId} not found. Using default campaign.`);
      // Fallback: criar lead genérico se não for redirecionamento direto
      if (phone && eventType !== 'whatsapp') {
        const defaultCampaign = "Default Campaign";
        const leadData: any = {
          name: name || 'Lead via Tracking',
          phone,
          campaign: defaultCampaign,
          status: 'new',
          ...utms
        };
        console.log('📝 Salvando lead no fallback:', leadData);

        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          console.log('Created lead with default campaign and UTMs:', utms);
        }
      }
      return { targetPhone: '5585998372658' };
    }

    const type = eventType || campaign.event_type || 'lead';

    // ⭐️ MODIFICAÇÃO PRINCIPAL: Diferentes comportamentos por redirect_type
    if (campaign.redirect_type === 'whatsapp') {
      console.log(`🚦 Campanha de redirecionamento WhatsApp – Salvar em pending_leads com UTMs corretos!`, {
        id: campaign.id,
        name: campaign.name,
        utms
      });
      
      // Para redirect_type: 'whatsapp', salvar em pending_leads COM os UTMs corretos
      if (phone && phone !== 'Redirecionamento Direto') {
        try {
          const pendingData = {
            name: name || 'Visitante',
            phone,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            utm_source: utms?.utm_source || null,
            utm_medium: utms?.utm_medium || null,
            utm_campaign: utms?.utm_campaign || null,
            utm_content: utms?.utm_content || null,
            utm_term: utms?.utm_term || null,
            status: 'pending'
          };
          
          console.log('💾 Dados que serão salvos em pending_leads:', pendingData);
          
          // Impede duplicidade por telefone pendente
          const { error: delError } = await supabase
            .from('pending_leads')
            .delete()
            .eq('phone', phone)
            .eq('status', 'pending');
          if (delError) console.warn("Falha ao limpar pending previous:", delError);

          const { error: pendingLeadError } = await supabase
            .from('pending_leads')
            .insert(pendingData);
          if (pendingLeadError) {
            console.error('Erro ao criar pending_lead:', pendingLeadError);
          } else {
            console.log('✅ pending_lead salva com UTMs corretos:', pendingData);
          }
        } catch (pendingSaveErr) {
          console.error("Erro ao gravar pending_lead:", pendingSaveErr);
        }
      }

      return { targetPhone: campaign.whatsapp_number };
    }

    // ⭐️ NOVO: Para campanhas de formulário (ou outras), criar lead imediatamente com status 'new'
    if ((type === 'lead' || type === 'contact') && phone) {
      console.log('📝 Campanha de formulário - Criar lead imediatamente com status NEW');
      
      // Checa lead duplicado pelo telefone
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .limit(1);

      if (checkError) {
        console.error('Error checking for existing lead:', checkError);
      }

      if (!existingLead || existingLead.length === 0) {
        const leadData: any = {
          name: name || 'Lead via Tracking',
          phone,
          campaign: campaign.name,
          campaign_id: campaign.id,
          status: 'new', // ⭐️ Status inicial como 'new' para formulários
          ...utms
        };
        console.log('📝 Salvando novo lead com status NEW:', leadData);

        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          console.log('✅ Lead criado com status NEW e UTMs:', utms);
        }
      } else {
        console.log('📞 Lead já existe, não duplicando:', existingLead[0].id);
      }
    } else {
      console.log("🔎 Não é fluxo de lead/contact ou telefone não informado:", {
        type,
        phone
      });
    }

    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('Error tracking redirect:', error);
    return { targetPhone: '5585998372658' };
  }
};
