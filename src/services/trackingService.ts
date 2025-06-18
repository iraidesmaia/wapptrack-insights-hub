
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
 * Função principal para rastrear redirecionamentos e salvar leads
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
    console.log('➡️ trackRedirect chamado com:', {
      campaignId,
      phone,
      name,
      eventType,
      utms
    });

    // Verificar se usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('⚠️ Usuário não autenticado, continuando sem salvar lead');
      return { targetPhone: '5585998372658' };
    }

    // Busca a campanha por ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Campanha não encontrada -> fallback default
    if (campaignError || !campaign) {
      console.log(`❌ Campaign with ID ${campaignId} not found. Creating default lead.`);
      
      // 🎯 SALVAR UTMs PARA POSSÍVEL CLICK DIRETO (incluindo GCLID)
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
      
      // ✅ CRIAR LEAD MESMO SEM CAMPANHA ENCONTRADA
      if (phone && eventType !== 'whatsapp') {
        const defaultCampaign = "Default Campaign";
        
        // 🎯 BUSCAR DADOS DO DISPOSITIVO
        let deviceData = null;
        if (phone) {
          console.log('📱 Buscando dados do dispositivo para telefone no fallback:', phone);
          deviceData = await getDeviceDataByPhone(phone);
        }
        
        const leadData: any = {
          name: name || 'Lead via Tracking',
          phone,
          campaign: defaultCampaign,
          status: 'new',
          user_id: user.id,
          utm_source: utms?.utm_source || '',
          utm_medium: utms?.utm_medium || '',
          utm_campaign: utms?.utm_campaign || '',
          utm_content: utms?.utm_content || (utms?.gclid ? `gclid=${utms.gclid}` : '') || '',
          utm_term: utms?.utm_term || (utms?.fbclid ? `fbclid=${utms.fbclid}` : '') || '',
          // 🎯 INCLUIR DADOS DO DISPOSITIVO SE DISPONÍVEIS
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
          language: deviceData?.language || ''
        };
        
        console.log('📝 Salvando lead no fallback com dados do dispositivo:', {
          nome: leadData.name,
          device_type: leadData.device_type,
          location: leadData.location,
          user_id: leadData.user_id,
          tem_dados_dispositivo: !!deviceData
        });

        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);

        if (leadError) {
          console.error('❌ Error creating fallback lead:', leadError);
        } else {
          console.log('✅ Lead criado com campanha padrão e dados do dispositivo:', leadData);
        }
      }
      return { targetPhone: '5585998372658' };
    }

    const type = eventType || campaign.event_type || 'lead';

    // ⭐️ COMPORTAMENTOS POR TIPO DE REDIRECIONAMENTO
    if (campaign.redirect_type === 'whatsapp') {
      console.log(`🚦 Campanha de redirecionamento WhatsApp – Salvar em pending_leads`, {
        id: campaign.id,
        name: campaign.name,
        utms
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
      
      // Para redirect_type: 'whatsapp', salvar em pending_leads
      if (phone && phone !== 'Redirecionamento Direto') {
        try {
          // ✅ CRIAR PENDING LEAD SEMPRE
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
          
          console.log('💾 Dados que serão salvos em pending_leads:', pendingData);
          
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
            console.error('❌ Erro ao criar pending_lead:', pendingLeadError);
          } else {
            console.log('✅ pending_lead salva com sucesso:', pendingData);
          }
        } catch (pendingSaveErr) {
          console.error("❌ Erro ao gravar pending_lead:", pendingSaveErr);
        }
      }

      return { targetPhone: campaign.whatsapp_number };
    }

    // ⭐️ PARA CAMPANHAS DE FORMULÁRIO, CRIAR LEAD IMEDIATAMENTE
    if ((type === 'lead' || type === 'contact') && phone) {
      console.log('📝 Campanha de formulário - Criar lead imediatamente');
      
      // Verificar se já existe lead para este telefone do mesmo usuário
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id, name')
        .eq('phone', phone)
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) {
        console.error('❌ Error checking for existing lead:', checkError);
      }

      if (!existingLead || existingLead.length === 0) {
        // 🎯 BUSCAR DADOS DO DISPOSITIVO ANTES DE CRIAR O LEAD
        let deviceData = null;
        if (phone) {
          console.log('📱 Buscando dados do dispositivo para telefone no trackRedirect:', phone);
          deviceData = await getDeviceDataByPhone(phone);
          
          if (deviceData) {
            console.log('✅ Dados do dispositivo encontrados no trackRedirect:', {
              device_type: deviceData.device_type,
              browser: deviceData.browser,
              location: deviceData.location
            });
          }
        }
        
        const leadData: any = {
          name: name || 'Lead via Tracking',
          phone,
          campaign: campaign.name,
          campaign_id: campaign.id,
          status: 'new',
          user_id: user.id,
          utm_source: utms?.utm_source || '',
          utm_medium: utms?.utm_medium || '',
          utm_campaign: utms?.utm_campaign || '',
          utm_content: utms?.utm_content || (utms?.gclid ? `gclid=${utms.gclid}` : '') || '',
          utm_term: utms?.utm_term || (utms?.fbclid ? `fbclid=${utms.fbclid}` : '') || '',
          // 🎯 INCLUIR DADOS DO DISPOSITIVO SE DISPONÍVEIS
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
          language: deviceData?.language || ''
        };
        
        console.log('📝 Salvando novo lead de formulário:', {
          nome: leadData.name,
          device_type: leadData.device_type,
          location: leadData.location,
          user_id: leadData.user_id,
          tem_dados_dispositivo: !!deviceData
        });

        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);

        if (leadError) {
          console.error('❌ Error creating form lead:', leadError);
        } else {
          console.log('✅ Lead de formulário criado com sucesso:', leadData);
        }
      } else {
        console.log('📞 Lead já existe, preservando dados originais:', {
          leadId: existingLead[0].id,
          nomeExistente: existingLead[0].name,
          nomeNovo: name
        });
      }
    } else {
      console.log("🔎 Não é fluxo de lead/contact ou telefone não informado:", {
        type,
        phone
      });
    }

    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('❌ Error tracking redirect:', error);
    return { targetPhone: '5585998372658' };
  }
};
