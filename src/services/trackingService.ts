
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
 * ✅ MODIFICADA PARA FUNCIONAR SEM AUTENTICAÇÃO OBRIGATÓRIA
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
    console.log('➡️ trackRedirect chamado com (MODO PÚBLICO):', {
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
      
      // ✅ CRIAR PENDING LEAD PÚBLICO (sem user_id)
      if (phone && eventType !== 'whatsapp') {
        console.log('📝 Criando pending lead público (sem autenticação)');
        
        // 🎯 BUSCAR DADOS DO DISPOSITIVO
        let deviceData = null;
        if (phone) {
          console.log('📱 Buscando dados do dispositivo para telefone no fallback:', phone);
          deviceData = await getDeviceDataByPhone(phone);
        }
        
        const pendingData = {
          name: name || 'Lead via Tracking',
          phone,
          campaign_id: campaignId,
          campaign_name: "Default Campaign",
          status: 'pending',
          utm_source: utms?.utm_source || '',
          utm_medium: utms?.utm_medium || '',
          utm_campaign: utms?.utm_campaign || '',
          utm_content: utms?.utm_content || (utms?.gclid ? `gclid=${utms.gclid}` : '') || '',
          utm_term: utms?.utm_term || (utms?.fbclid ? `fbclid=${utms.fbclid}` : '') || '',
        };
        
        console.log('💾 Salvando pending lead público:', pendingData);

        const { error: pendingError } = await supabase
          .from('pending_leads')
          .insert(pendingData);

        if (pendingError) {
          console.error('❌ Error creating public pending lead:', pendingError);
        } else {
          console.log('✅ Pending lead público criado com sucesso:', pendingData);
        }
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
            console.log('✅ pending_lead público salva com sucesso:', pendingData);
          }
        } catch (pendingSaveErr) {
          console.error("❌ Erro ao gravar pending_lead público:", pendingSaveErr);
        }
      }

      return { targetPhone: campaign.whatsapp_number };
    }

    // ⭐️ PARA CAMPANHAS DE FORMULÁRIO, CRIAR PENDING LEAD (PÚBLICO)
    if ((type === 'lead' || type === 'contact') && phone) {
      console.log('📝 Campanha de formulário - Criar pending lead (PÚBLICO)');
      
      // 🎯 BUSCAR DADOS DO DISPOSITIVO ANTES DE CRIAR O PENDING LEAD
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

      const { error: pendingError } = await supabase
        .from('pending_leads')
        .insert(pendingData);

      if (pendingError) {
        console.error('❌ Error creating form pending lead:', pendingError);
      } else {
        console.log('✅ Pending lead de formulário criado com sucesso:', pendingData);
      }
    } else {
      console.log("🔎 Não é fluxo de lead/contact ou telefone não informado:", {
        type,
        phone
      });
    }

    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('❌ Error tracking redirect (PUBLIC MODE):', error);
    return { targetPhone: '5585998372658' };
  }
};
