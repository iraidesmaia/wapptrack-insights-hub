import { findCTWAClickData, updateCTWADeviceDataWithPhone } from './ctwaCampaignTracker.ts';
import { getContactName } from './helpers.ts';
import { logSecurityEvent } from './security.ts';

/**
 * Handler especializado para leads vindos de campanhas CTWA
 * Associa dados do clique com a mensagem recebida
 */
export const handleCTWACampaignLead = async ({ 
  supabase, 
  message, 
  realPhoneNumber, 
  instanceName,
  ctwaCLid 
}: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  instanceName: string;
  ctwaCLid: string;
}) => {
  console.log(`🎯 [CTWA LEAD] Processando lead de campanha CTWA: ${ctwaCLid} - ${realPhoneNumber}`);
  
  try {
    // 1. Buscar dados do clique original usando ctwa_clid
    const clickData = await findCTWAClickData(supabase, ctwaCLid);
    
    if (!clickData) {
      console.log(`❌ [CTWA LEAD] Dados do clique não encontrados para ctwa_clid: ${ctwaCLid}`);
      logSecurityEvent('CTWA click data not found', {
        ctwa_clid: ctwaCLid,
        phone: realPhoneNumber,
        instance: instanceName
      }, 'medium');
      return null;
    }
    
    console.log(`✅ [CTWA LEAD] Dados do clique encontrados:`, {
      ctwa_clid: ctwaCLid,
      campaign_id: clickData.campaign_id,
      utm_source: clickData.utm_source,
      ip_address: clickData.ip_address,
      device_type: clickData.device_type
    });
    
    // 2. Buscar dados da campanha
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', clickData.campaign_id)
      .single();
    
    if (campaignError || !campaignData) {
      console.log(`❌ [CTWA LEAD] Campanha não encontrada: ${clickData.campaign_id}`);
      logSecurityEvent('CTWA campaign not found', {
        ctwa_clid: ctwaCLid,
        campaign_id: clickData.campaign_id,
        phone: realPhoneNumber
      }, 'high');
      return null;
    }
    
    console.log(`✅ [CTWA LEAD] Campanha encontrada: ${campaignData.name}`);
    
    // 3. Verificar se lead já existe
    const phoneVariations = [
      realPhoneNumber,
      realPhoneNumber.slice(-10),
      `55${realPhoneNumber.slice(-10)}`,
      `5585${realPhoneNumber.slice(-8)}`
    ];
    
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name, phone, ctwa_clid')
      .in('phone', phoneVariations)
      .limit(1);
    
    if (existingLead && existingLead.length > 0) {
      // Se lead existe mas não tem ctwa_clid, atualizar
      if (!existingLead[0].ctwa_clid) {
        console.log(`🔄 [CTWA LEAD] Atualizando lead existente com dados CTWA...`);
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            ctwa_clid: ctwaCLid,
            campaign_id: clickData.campaign_id,
            utm_source: clickData.utm_source,
            utm_medium: clickData.utm_medium,
            utm_campaign: clickData.utm_campaign,
            utm_content: clickData.utm_content,
            utm_term: clickData.utm_term,
            source_id: clickData.source_id,
            media_url: clickData.media_url,
            ip_address: clickData.ip_address,
            device_type: clickData.device_type,
            browser: clickData.browser,
            os: clickData.os,
            screen_resolution: clickData.screen_resolution,
            language: clickData.language,
            timezone: clickData.timezone,
            tracking_method: 'ctwa_campaign'
          })
          .eq('id', existingLead[0].id);
        
        if (updateError) {
          console.error(`❌ [CTWA LEAD] Erro ao atualizar lead:`, updateError);
        } else {
          console.log(`✅ [CTWA LEAD] Lead existente atualizado com dados CTWA`);
        }
      } else {
        console.log(`⚠️ [CTWA LEAD] Lead já possui dados CTWA: ${existingLead[0].ctwa_clid}`);
      }
      
      return existingLead[0];
    }
    
    // 4. Criar novo lead com dados consolidados
    const leadData = {
      name: getContactName(message),
      phone: realPhoneNumber,
      campaign: campaignData.name,
      campaign_id: clickData.campaign_id,
      user_id: campaignData.user_id,
      status: 'lead',
      first_contact_date: new Date().toISOString(),
      last_message: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Mensagem via CTWA',
      
      // UTMs da campanha
      utm_source: clickData.utm_source || 'facebook',
      utm_medium: clickData.utm_medium || 'social',
      utm_campaign: clickData.utm_campaign || `ctwa_${ctwaCLid.substring(0, 8)}`,
      utm_content: clickData.utm_content,
      utm_term: clickData.utm_term,
      
      // Dados de tracking CTWA
      ctwa_clid: ctwaCLid,
      source_id: clickData.source_id,
      media_url: clickData.media_url,
      
      // Dados do dispositivo capturados no clique
      ip_address: clickData.ip_address,
      device_type: clickData.device_type,
      browser: clickData.browser,
      os: clickData.os,
      screen_resolution: clickData.screen_resolution,
      language: clickData.language,
      timezone: clickData.timezone,
      
      tracking_method: 'ctwa_campaign'
    };
    
    console.log(`🆕 [CTWA LEAD] Criando novo lead CTWA consolidado:`, {
      name: leadData.name,
      phone: leadData.phone,
      campaign: leadData.campaign,
      ctwa_clid: leadData.ctwa_clid,
      utm_source: leadData.utm_source,
      ip_address: leadData.ip_address,
      device_type: leadData.device_type
    });
    
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
    
    if (leadError) {
      console.error(`❌ [CTWA LEAD] Erro ao criar lead:`, leadError);
      logSecurityEvent('Failed to create CTWA lead', {
        error: leadError,
        ctwa_clid: ctwaCLid,
        phone: realPhoneNumber,
        campaign_id: clickData.campaign_id
      }, 'high');
      return null;
    }
    
    // 5. Atualizar device_data com telefone real
    await updateCTWADeviceDataWithPhone(supabase, ctwaCLid, realPhoneNumber);
    
    console.log(`✅ [CTWA LEAD] Lead CTWA criado com sucesso:`, {
      lead_id: newLead.id,
      name: newLead.name,
      campaign: newLead.campaign,
      ctwa_clid: newLead.ctwa_clid,
      tracking_method: newLead.tracking_method
    });
    
    logSecurityEvent('CTWA lead created successfully', {
      lead_id: newLead.id,
      phone: realPhoneNumber,
      ctwa_clid: ctwaCLid,
      campaign_id: clickData.campaign_id,
      campaign_name: campaignData.name,
      ip_address: clickData.ip_address
    }, 'low');
    
    return newLead;
    
  } catch (error) {
    console.error(`💥 [CTWA LEAD] Erro em handleCTWACampaignLead:`, error);
    logSecurityEvent('Error in handleCTWACampaignLead', {
      error: error.message,
      ctwa_clid: ctwaCLid,
      phone: realPhoneNumber,
      instance: instanceName
    }, 'high');
    return null;
  }
};

/**
 * Função helper para buscar dados de clique CTWA no webhook
 */
export const findCTWAClickData = async (supabase: any, ctwaCLid: string) => {
  try {
    console.log('🔍 [CTWA TRACKER] Buscando dados do clique para ctwa_clid:', ctwaCLid);
    
    // Buscar nas últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Buscar na tabela tracking_sessions
    const { data: trackingData, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('ctwa_clid', ctwaCLid)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ [CTWA TRACKER] Erro ao buscar dados de clique:', error);
      return null;
    }
    
    if (trackingData && trackingData.length > 0) {
      const session = trackingData[0];
      
      console.log('✅ [CTWA TRACKER] Dados do clique encontrados:', {
        ctwa_clid: session.ctwa_clid,
        campaign_id: session.campaign_id,
        ip_address: session.ip_address,
        created_at: session.created_at
      });
      
      return {
        campaign_id: session.campaign_id,
        ctwa_clid: session.ctwa_clid,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        browser_fingerprint: session.browser_fingerprint,
        session_id: session.session_id,
        device_type: session.screen_resolution ? 'desktop' : 'mobile',
        browser: session.user_agent?.includes('Chrome') ? 'Chrome' : 'Other',
        os: session.user_agent?.includes('Windows') ? 'Windows' : 'Other',
        screen_resolution: session.screen_resolution,
        language: session.language,
        timezone: session.timezone,
        utm_source: session.utm_source,
        utm_medium: session.utm_medium,
        utm_campaign: session.utm_campaign,
        utm_content: session.utm_content,
        utm_term: session.utm_term,
        source_id: session.source_id,
        media_url: session.media_url,
        source_url: session.current_url,
        referrer: session.referrer,
        timestamp: session.created_at
      };
    }
    
    console.log('❌ [CTWA TRACKER] Nenhum dado de clique encontrado para ctwa_clid:', ctwaCLid);
    return null;
    
  } catch (error) {
    console.error('❌ [CTWA TRACKER] Erro geral ao buscar dados de clique:', error);
    return null;
  }
};

/**
 * Atualiza device_data com telefone real quando mensagem é recebida
 */
export const updateCTWADeviceDataWithPhone = async (supabase: any, ctwaCLid: string, realPhone: string): Promise<boolean> => {
  try {
    console.log('🔄 [CTWA TRACKER] Atualizando device_data com telefone real:', { ctwaCLid, realPhone });
    
    const { error } = await supabase
      .from('device_data')
      .update({ phone: realPhone })
      .eq('ctwa_clid', ctwaCLid)
      .eq('phone', `PENDING_CTWA_${ctwaCLid}`);
    
    if (error) {
      console.error('❌ [CTWA TRACKER] Erro ao atualizar device_data:', error);
      return false;
    }
    
    console.log('✅ [CTWA TRACKER] Device_data atualizado com telefone real');
    return true;
    
  } catch (error) {
    console.error('❌ [CTWA TRACKER] Erro geral ao atualizar device_data:', error);
    return false;
  }
};