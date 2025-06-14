
import { supabase } from "../integrations/supabase/client";

export const trackRedirect = async (
  campaignId: string, 
  phone: string, 
  name?: string,
  eventType?: string
): Promise<{targetPhone?: string}> => {
  try {
    // Find the campaign by ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Create a default campaign if one with the specified ID doesn't exist
    if (campaignError || !campaign) {
      console.log(`Campaign with ID ${campaignId} not found. Using default campaign.`);
      
      // Create a new lead with a default campaign name if phone is provided
      if (phone) {
        const defaultCampaign = "Default Campaign";
        
        // Insert the new lead
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            name: name || 'Lead via Tracking',
            phone,
            campaign: defaultCampaign,
            status: 'new'
          });

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          console.log('Created lead with default campaign');
        }
        
        // Return your WhatsApp number
        return { targetPhone: '5585998372658' };
      }
      
      // Return your WhatsApp number as default
      return { targetPhone: '5585998372658' };
    }

    // Event type handling based on campaign settings
    const type = eventType || campaign.event_type || 'lead';
    
    // Create a lead if the event type is 'lead' and the phone number doesn't exist yet
    if ((type === 'lead' || type === 'contact') && phone) {
      // Check if the lead with this phone already exists
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking for existing lead:', checkError);
      }
      
      // If no lead exists with this phone, create a new one
      if (!existingLead || existingLead.length === 0) {
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            name: name || 'Lead via Tracking',
            phone,
            campaign: campaign.name,
            campaign_id: campaign.id,
            status: 'new'
          });
        
        if (leadError) {
          console.error('Error creating lead:', leadError);
        }
      }
    }
    
    // Return the campaign's WhatsApp number for redirection
    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('Error tracking redirect:', error);
    // Return a default phone number in case of error
    return { targetPhone: '5585998372658' };
  }
};
