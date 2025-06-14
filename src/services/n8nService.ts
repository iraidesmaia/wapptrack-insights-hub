
import { toast } from 'sonner';

interface LeadData {
  name: string;
  phone: string;
  campaign?: string;
  campaignId?: string;
}

interface CampaignData {
  id: string;
  name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  pixel_id?: string;
  whatsapp_number?: string;
  event_type?: string;
  custom_message?: string;
  company_title?: string;
  company_subtitle?: string;
  logo_url?: string;
}

export const sendLeadToN8n = async (leadData: LeadData, campaignData?: CampaignData) => {
  try {
    // Recuperar configuração do n8n do localStorage
    const evolutionConfig = localStorage.getItem('evolution_config');
    if (!evolutionConfig) {
      console.log('Configuração do n8n não encontrada');
      return;
    }

    const config = JSON.parse(evolutionConfig);
    if (!config.n8n_webhook_url) {
      console.log('URL do webhook n8n não configurada');
      return;
    }

    console.log('Enviando dados do lead para n8n:', leadData);

    const payload = {
      lead: {
        name: leadData.name,
        phone: leadData.phone,
        campaign: leadData.campaign,
        campaign_id: leadData.campaignId,
        timestamp: new Date().toISOString(),
        source: 'Landing Page'
      },
      campaign_data: campaignData ? {
        id: campaignData.id,
        name: campaignData.name,
        utm_source: campaignData.utm_source,
        utm_medium: campaignData.utm_medium,
        utm_campaign: campaignData.utm_campaign,
        utm_content: campaignData.utm_content,
        utm_term: campaignData.utm_term,
        pixel_id: campaignData.pixel_id,
        whatsapp_number: campaignData.whatsapp_number,
        event_type: campaignData.event_type,
        custom_message: campaignData.custom_message,
        company_title: campaignData.company_title,
        company_subtitle: campaignData.company_subtitle,
        logo_url: campaignData.logo_url
      } : null
    };

    const response = await fetch(config.n8n_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Dados enviados para n8n com sucesso');
    } else {
      console.error('Erro ao enviar dados para n8n:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Erro ao enviar dados para n8n:', error);
  }
};
