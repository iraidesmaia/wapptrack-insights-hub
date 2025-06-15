
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
    // Busca a campanha por ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Campanha não encontrada -> fallback default
    if (campaignError || !campaign) {
      console.log(`Campaign with ID ${campaignId} not found. Using default campaign.`);
      
      if (phone) {
        const defaultCampaign = "Default Campaign";
        const leadData: any = {
          name: name || 'Lead via Tracking',
          phone,
          campaign: defaultCampaign,
          status: 'new',
          ...utms
        };

        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          console.log('Created lead with default campaign and UTMs:', utms);
        }
        
        // WhatsApp fallback
        return { targetPhone: '5585998372658' };
      }
      return { targetPhone: '5585998372658' };
    }

    const type = eventType || campaign.event_type || 'lead';

    if ((type === 'lead' || type === 'contact') && phone) {
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
          status: 'new',
          ...utms
        };

        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          console.log('Lead created with UTMs:', utms);
        }
      } else {
        console.log('Lead already exists, skipping insert.');
      }
    }

    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('Error tracking redirect:', error);
    return { targetPhone: '5585998372658' };
  }
};
