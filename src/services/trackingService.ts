
import { supabase } from "../integrations/supabase/client";
import { getDeviceDataByPhone } from "./deviceDataService";

/**
 * ✅ NOVA FUNÇÃO PARA SALVAR UTMs DE CLICKS DIRETOS
 */
const saveDirectClickUtms = async (
  phone: string,
  utms: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }
) => {
  try {
    // Só salvar se pelo menos um UTM estiver presente
    if (!utms.utm_source && !utms.utm_medium && !utms.utm_campaign && !utms.utm_content && !utms.utm_term) {
      console.log('📋 Nenhum UTM para salvar no click direto');
      return;
    }

    const clickData = {
      phone,
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
      utm_content: utms.utm_content || null,
      utm_term: utms.utm_term || null,
      created_at: new Date().toISOString()
    };

    console.log('💾 Salvando UTMs para click direto:', clickData);

    const { error } = await supabase
      .from('utm_clicks')
      .insert(clickData);

    if (error) {
      console.error('❌ Erro ao salvar UTMs de click direto:', error);
    } else {
      console.log('✅ UTMs de click direto salvos com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro geral ao salvar UTMs de click direto:', error);
  }
};

/**
 * ✅ NOVA FUNÇÃO PARA CONVERSÃO AUTOMÁTICA
 */
const convertPendingLeadToLead = async (pendingLeadData: any) => {
  try {
    console.log('🔄 Convertendo pending_lead para lead automaticamente:', pendingLeadData);

    // Buscar user_id da campanha
    let campaignUserId = null;
    if (pendingLeadData.campaign_id) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('id', pendingLeadData.campaign_id)
        .single();

      if (campaign && !campaignError) {
        campaignUserId = campaign.user_id;
        console.log('✅ User ID da campanha encontrado:', campaignUserId);
      }
    }

    // Buscar dados do dispositivo
    const deviceData = await getDeviceDataByPhone(pendingLeadData.phone);

    // Verificar se já existe lead para este telefone
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', pendingLeadData.phone)
      .limit(1);

    if (existingLead && existingLead.length > 0) {
      console.log('⚠️ Lead já existe para este telefone, pulando conversão automática');
      return false;
    }

    // Criar novo lead com user_id da campanha
    const newLeadData = {
      name: pendingLeadData.name,
      phone: pendingLeadData.phone,
      campaign: pendingLeadData.campaign_name || 'Formulário Direto',
      campaign_id: pendingLeadData.campaign_id,
      user_id: campaignUserId, // ✅ INCLUIR USER_ID DA CAMPANHA
      status: 'new',
      first_contact_date: new Date().toISOString(),
      notes: 'Lead criado automaticamente a partir de formulário',
      utm_source: pendingLeadData.utm_source,
      utm_medium: pendingLeadData.utm_medium,
      utm_campaign: pendingLeadData.utm_campaign,
      utm_content: pendingLeadData.utm_content,
      utm_term: pendingLeadData.utm_term,
      // Incluir dados do dispositivo se disponíveis
      location: deviceData?.location || '',
      ip_address: deviceData?.ip_address || '',
      browser: deviceData?.browser || '',
      os: deviceData?.os || '',
      device_type: deviceData?.device_type || '',
      device_model: deviceData?.device_model || '',
      country: deviceData?.country || '',
      city: deviceData?.city || '',
      screen_resolution: deviceData?.screen_resolution || '',
      timezone: deviceData?.timezone || '',
      language: deviceData?.language || '',
      custom_fields: deviceData ? { device_info: deviceData } : null
    };

    console.log('💾 Criando lead com user_id da campanha:', newLeadData);

    const { error: insertError } = await supabase
      .from('leads')
      .insert(newLeadData);

    if (insertError) {
      console.error('❌ Erro ao converter pending_lead para lead:', insertError);
      return false;
    }

    console.log('✅ Pending lead convertido para lead automaticamente com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro em conversão automática:', error);
    return false;
  }
};

/**
 * Função principal para rastrear redirecionamentos e salvar leads
 * ✅ MODIFICADA PARA INCLUIR CONVERSÃO AUTOMÁTICA
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
    gclid?: string
    fbclid?: string
  }
): Promise<{targetPhone?: string}> => {
  try {
    console.log('➡️ trackRedirect chamado com (MODO PÚBLICO + CONVERSÃO AUTOMÁTICA):', {
      campaignId,
      phone,
      name,
      eventType,
      utms
    });

    // ✅ VERIFICAR AUTENTICAÇÃO SEM EXIGIR
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;
    console.log('🔐 Status de autenticação:', isAuthenticated ? 'Logado' : 'Público');

    // Busca a campanha por ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Campanha não encontrada -> fallback default
    if (campaignError || !campaign) {
      console.log(`❌ Campaign with ID ${campaignId} not found. Creating default lead.`);
      
      // 🎯 SALVAR UTMs PARA POSSÍVEL CLICK DIRETO
      if (phone && phone !== 'Redirecionamento Direto' && utms) {
        const utmsToSave = {
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_content: utms.utm_content || (utms.gclid ? `gclid=${utms.gclid}` : undefined),
          utm_term: utms.utm_term || (utms.fbclid ? `fbclid=${utms.fbclid}` : undefined),
        };
        await saveDirectClickUtms(phone, utmsToSave);
      }
      
      return { targetPhone: '5585998372658' };
    }

    const type = eventType || campaign.event_type || 'lead';

    // ⭐️ COMPORTAMENTOS POR TIPO DE REDIRECIONAMENTO
    if (campaign.redirect_type === 'whatsapp') {
      console.log(`🚦 Campanha de redirecionamento WhatsApp – Salvar em pending_leads (PÚBLICO)`, {
        id: campaign.id,
        name: campaign.name,
        utms,
        authenticated: isAuthenticated
      });
      
      // 🎯 SALVAR UTMs PARA POSSÍVEL CLICK DIRETO
      if (phone && phone !== 'Redirecionamento Direto' && utms) {
        const utmsToSave = {
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_content: utms.utm_content || (utms.gclid ? `gclid=${utms.gclid}` : undefined),
          utm_term: utms.utm_term || (utms.fbclid ? `fbclid=${utms.fbclid}` : undefined),
        };
        await saveDirectClickUtms(phone, utmsToSave);
      }
      
      // Para redirect_type: 'whatsapp', salvar em pending_leads (PÚBLICO)
      if (phone && phone !== 'Redirecionamento Direto') {
        try {
          // ✅ CRIAR PENDING LEAD SEMPRE (PÚBLICO)
          const pendingData = {
            name: name || 'Visitante',
            phone,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            utm_source: utms?.utm_source || null,
            utm_medium: utms?.utm_medium || null,
            utm_campaign: utms?.utm_campaign || null,
            utm_content: utms?.utm_content || (utms?.gclid ? `gclid=${utms.gclid}` : null) || null,
            utm_term: utms?.utm_term || (utms?.fbclid ? `fbclid=${utms.fbclid}` : null) || null,
            status: 'pending'
          };
          
          console.log('💾 Dados que serão salvos em pending_leads (PÚBLICO):', pendingData);
          
          // Limpar pending leads anteriores para este telefone
          await supabase
            .from('pending_leads')
            .delete()
            .eq('phone', phone)
            .eq('status', 'pending');

          const { error: pendingLeadError } = await supabase
            .from('pending_leads')
            .insert(pendingData);

          if (pendingLeadError) {
            console.error('❌ Erro ao criar pending_lead público:', pendingLeadError);
          } else {
            console.log('✅ pending_lead público salvo com sucesso:', pendingData);
          }
        } catch (pendingSaveErr) {
          console.error("❌ Erro ao gravar pending_lead público:", pendingSaveErr);
        }
      }

      return { targetPhone: campaign.whatsapp_number };
    }

    // ⭐️ PARA CAMPANHAS DE FORMULÁRIO, CRIAR PENDING LEAD E TENTAR CONVERSÃO AUTOMÁTICA
    if ((type === 'lead' || type === 'contact') && phone) {
      console.log('📝 Campanha de formulário - Criar pending lead e tentar conversão automática');
      
      const pendingData = {
        name: name || 'Lead via Tracking',
        phone,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        status: 'pending',
        utm_source: utms?.utm_source || '',
        utm_medium: utms?.utm_medium || '',
        utm_campaign: utms?.utm_campaign || '',
        utm_content: utms?.utm_content || (utms?.gclid ? `gclid=${utms.gclid}` : '') || '',
        utm_term: utms?.utm_term || (utms?.fbclid ? `fbclid=${utms.fbclid}` : '') || '',
      };
      
      console.log('📝 Salvando novo pending lead de formulário (PÚBLICO):', pendingData);

      const { data: insertedPendingLead, error: pendingError } = await supabase
        .from('pending_leads')
        .insert(pendingData)
        .select()
        .single();

      if (pendingError) {
        console.error('❌ Error creating form pending lead:', pendingError);
      } else {
        console.log('✅ Pending lead de formulário criado com sucesso:', pendingData);
        
        // ✅ TENTAR CONVERSÃO AUTOMÁTICA IMEDIATA
        console.log('🔄 Tentando conversão automática imediata...');
        const conversionSuccess = await convertPendingLeadToLead(insertedPendingLead);
        
        if (conversionSuccess) {
          console.log('✅ Conversão automática realizada com sucesso!');
          
          // Marcar pending_lead como convertido
          await supabase
            .from('pending_leads')
            .update({ status: 'converted' })
            .eq('id', insertedPendingLead.id);
        } else {
          console.log('⚠️ Conversão automática falhou, pending_lead permanece para conversão via webhook');
        }
      }
    } else {
      console.log("🔎 Não é fluxo de lead/contact ou telefone não informado:", {
        type,
        phone
      });
    }

    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('❌ Error tracking redirect (PUBLIC MODE WITH AUTO CONVERSION):', error);
    return { targetPhone: '5585998372658' };
  }
};
