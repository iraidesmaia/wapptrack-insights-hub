
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
 * ✅ FUNÇÃO CORRIGIDA PARA CONVERSÃO AUTOMÁTICA - AGORA COM MELHOR TRATAMENTO
 */
const convertPendingLeadToLead = async (pendingLeadData: any) => {
  try {
    console.log('🔄 [CONVERSÃO AUTOMÁTICA] Iniciando conversão:', {
      id: pendingLeadData.id,
      name: pendingLeadData.name,
      phone: pendingLeadData.phone,
      campaign_id: pendingLeadData.campaign_id
    });

    // Buscar user_id da campanha
    let campaignUserId = null;
    if (pendingLeadData.campaign_id) {
      console.log('🔍 Buscando user_id da campanha:', pendingLeadData.campaign_id);
      
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('id', pendingLeadData.campaign_id)
        .single();

      if (campaign && !campaignError) {
        campaignUserId = campaign.user_id;
        console.log('✅ User ID da campanha encontrado:', campaignUserId);
      } else {
        console.error('❌ Erro ao buscar campanha:', campaignError);
        console.log('⚠️ Continuando conversão sem user_id da campanha');
      }
    } else {
      console.log('⚠️ Nenhum campaign_id fornecido, continuando sem user_id');
    }

    // Buscar dados do dispositivo
    console.log('📱 Buscando dados do dispositivo para:', pendingLeadData.phone);
    const deviceData = await getDeviceDataByPhone(pendingLeadData.phone);
    console.log('📱 Dados do dispositivo:', deviceData ? 'ENCONTRADOS' : 'NÃO ENCONTRADOS');

    // Verificar se já existe lead para este telefone
    console.log('🔍 Verificando se já existe lead para o telefone:', pendingLeadData.phone);
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', pendingLeadData.phone)
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar lead existente:', checkError);
      return false;
    }

    if (existingLead && existingLead.length > 0) {
      console.log('⚠️ Lead já existe para este telefone:', existingLead[0].id);
      console.log('⚠️ Pulando conversão automática para evitar duplicata');
      return false;
    }

    console.log('✅ Nenhum lead existente encontrado, prosseguindo com a criação');

    // Criar novo lead com dados mais robustos
    const newLeadData = {
      name: pendingLeadData.name || 'Lead Automático',
      phone: pendingLeadData.phone,
      campaign: pendingLeadData.campaign_name || 'Formulário Direto',
      campaign_id: pendingLeadData.campaign_id || null,
      user_id: campaignUserId, // ✅ PODE SER NULL SE CAMPANHA NÃO FOR ENCONTRADA
      status: 'new' as const,
      first_contact_date: new Date().toISOString(),
      notes: 'Lead criado automaticamente a partir de formulário',
      utm_source: pendingLeadData.utm_source || null,
      utm_medium: pendingLeadData.utm_medium || null,
      utm_campaign: pendingLeadData.utm_campaign || null,
      utm_content: pendingLeadData.utm_content || null,
      utm_term: pendingLeadData.utm_term || null,
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
      // ✅ INCLUIR CUSTOM_FIELDS APENAS SE DEVICEDATA EXISTIR
      custom_fields: deviceData ? { device_info: deviceData } : null
    };

    console.log('💾 [CONVERSÃO AUTOMÁTICA] Tentando inserir lead:', {
      nome: newLeadData.name,
      telefone: newLeadData.phone,
      user_id: newLeadData.user_id,
      campaign_id: newLeadData.campaign_id,
      tem_device_data: !!deviceData
    });

    // ✅ USAR RPC CALL PARA BYPASS POTENCIAIS PROBLEMAS DE RLS
    const { data: insertedLead, error: insertError } = await supabase.rpc('create_lead_from_pending', {
      lead_data: newLeadData
    });

    // Se RPC não existir, usar insert normal
    if (insertError && insertError.message?.includes('function')) {
      console.log('⚠️ RPC não encontrada, usando insert normal');
      
      const { data: directInsert, error: directError } = await supabase
        .from('leads')
        .insert(newLeadData)
        .select()
        .single();

      if (directError) {
        console.error('❌ [CONVERSÃO AUTOMÁTICA] ERRO DETALHADO ao inserir lead:', {
          error: directError,
          code: directError.code,
          message: directError.message,
          details: directError.details,
          hint: directError.hint
        });
        console.error('❌ [CONVERSÃO AUTOMÁTICA] DADOS que causaram erro:', newLeadData);
        return false;
      }

      console.log('✅ [CONVERSÃO AUTOMÁTICA] Lead criado com sucesso via insert direto:', directInsert?.id);
      return true;
    }

    if (insertError) {
      console.error('❌ [CONVERSÃO AUTOMÁTICA] ERRO via RPC:', insertError);
      return false;
    }

    console.log('✅ [CONVERSÃO AUTOMÁTICA] Lead criado com sucesso via RPC:', insertedLead);
    return true;
  } catch (error) {
    console.error('❌ [CONVERSÃO AUTOMÁTICA] Erro CATCH geral:', {
      error: error,
      message: error?.message,
      stack: error?.stack
    });
    return false;
  }
};

/**
 * Função principal para rastrear redirecionamentos e salvar leads
 * ✅ MODIFICADA PARA INCLUIR CONVERSÃO AUTOMÁTICA MAIS ROBUSTA
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
    console.log('➡️ [TRACK REDIRECT] Iniciado com parâmetros:', {
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
      console.log('📝 [FORMULÁRIO] Processando campanha de formulário...');
      
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
      
      console.log('📝 [FORMULÁRIO] Salvando pending lead:', pendingData);

      // ✅ LIMPAR PENDING LEADS ANTERIORES ANTES DE CRIAR NOVO
      await supabase
        .from('pending_leads')
        .delete()
        .eq('phone', phone)
        .eq('status', 'pending');

      const { data: insertedPendingLead, error: pendingError } = await supabase
        .from('pending_leads')
        .insert(pendingData)
        .select()
        .single();

      if (pendingError) {
        console.error('❌ [FORMULÁRIO] Erro ao criar pending lead:', pendingError);
      } else {
        console.log('✅ [FORMULÁRIO] Pending lead criado:', insertedPendingLead.id);
        
        // ✅ AGUARDAR ANTES DA CONVERSÃO PARA GARANTIR COMMIT
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 [FORMULÁRIO] Iniciando conversão automática...');
        
        const conversionSuccess = await convertPendingLeadToLead(insertedPendingLead);
        
        if (conversionSuccess) {
          console.log('✅ [FORMULÁRIO] Conversão automática SUCESSO!');
          
          // Marcar pending_lead como convertido
          const { error: updateError } = await supabase
            .from('pending_leads')
            .update({ status: 'converted' })
            .eq('id', insertedPendingLead.id);

          if (updateError) {
            console.error('❌ [FORMULÁRIO] Erro ao marcar como convertido:', updateError);
          } else {
            console.log('✅ [FORMULÁRIO] Pending lead marcado como convertido');
          }
        } else {
          console.log('❌ [FORMULÁRIO] Conversão automática FALHOU');
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
    console.error('❌ [TRACK REDIRECT] Erro geral:', error);
    return { targetPhone: '5585998372658' };
  }
};
