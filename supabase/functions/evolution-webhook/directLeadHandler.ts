import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getContactName } from "./helpers.ts";
import { getDeviceDataByPhone } from "./deviceDataHandler.ts";
import { getUtmsFromPendingSessions, markUtmSessionAsMatched, findUtmSessionsByCorrelation } from "./utmPending.ts";
import { logSecurityEvent } from './security.ts';

interface DirectLeadParams {
  supabase: SupabaseClient;
  message: any;
  realPhoneNumber: string;
  instanceName: string;
}

/**
 * Calcula score de confiança baseado nas fontes de dados disponíveis
 */
function calculateConfidenceScore(dataSources: string[], utmData?: any): number {
  let score = 30; // Base score para leads diretos
  
  // Boost por fonte de dados
  if (dataSources.includes('utm_sessions')) score += 40;
  if (dataSources.includes('device_data')) score += 15;
  if (dataSources.includes('correlation')) score += 20;
  if (dataSources.includes('whatsapp_direct')) score += 10;
  
  // Boost por qualidade dos UTMs
  if (utmData) {
    if (utmData.utm_source) score += 5;
    if (utmData.utm_campaign) score += 5;
    if (utmData.utm_medium) score += 5;
  }
  
  return Math.min(score, 100); // Cap at 100
}

export async function handleDirectLead({ 
  supabase, 
  message, 
  realPhoneNumber, 
  instanceName 
}: DirectLeadParams) {
  try {
    console.log(`🆕 Processando lead direto para: ${realPhoneNumber} (instância: ${instanceName})`);
    
    // 🔍 Buscar usuário responsável pela instância
    const { data: userData, error: userError } = await supabase.rpc('get_user_by_instance', {
      instance_name_param: instanceName
    });

    let responsibleUserId = userData;

    if (userError || !responsibleUserId) {
      console.log(`❌ Nenhum usuário encontrado para instância: ${instanceName}`);
      
      // Fallback: buscar pela primeira campanha ativa
      const { data: fallbackCampaign } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('active', true)
        .limit(1)
        .single();

      if (fallbackCampaign?.user_id) {
        responsibleUserId = fallbackCampaign.user_id;
        console.log(`✅ Usando usuário da primeira campanha ativa: ${responsibleUserId}`);
        
        logSecurityEvent('Fallback user assignment for organic lead', {
          instance: instanceName,
          phone: realPhoneNumber,
          fallback_user_id: responsibleUserId
        }, 'medium');
      } else {
        console.log(`❌ Não foi possível determinar usuário responsável`);
        logSecurityEvent('No user found for organic lead', {
          instance: instanceName,
          phone: realPhoneNumber
        }, 'high');
        return;
      }
    }
    
    const contactName = getContactName(message);
    
    // Check if this lead already exists
    const phoneVariations = [
      realPhoneNumber,
      realPhoneNumber.slice(-10),
      `55${realPhoneNumber.slice(-10)}`,
      `5585${realPhoneNumber.slice(-8)}`
    ];
    
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('*')
      .in('phone', phoneVariations);
    
    if (existingLeads && existingLeads.length > 0) {
      console.log(`✅ Lead já existe para ${realPhoneNumber}, verificando se há UTMs pendentes para enriquecimento`);
      
      // Tentar buscar UTMs pendentes para enriquecer o lead existente
      const utmSession = await getUtmsFromPendingSessions(supabase, realPhoneNumber);
      
      if (utmSession) {
        const isOrganic = !utmSession.utm_source;
        const sourceType = isOrganic ? 'ORGÂNICO' : 'UTM';
        console.log(`🎯 Enriquecendo lead existente com dados ${sourceType}:`, {
          utm_source: utmSession.utm_source || 'orgânico',
          landing_page: utmSession.landing_page,
          referrer: utmSession.referrer
        });
        
        const dataSources = [...(existingLeads[0].data_sources || [])];
        if (!dataSources.includes('utm_sessions')) {
          dataSources.push('utm_sessions');
        }
        
        // Update existing lead with UTM data
        await supabase
          .from('leads')
          .update({
            utm_source: utmSession.utm_source,
            utm_medium: utmSession.utm_medium,
            utm_campaign: utmSession.utm_campaign,
            utm_content: utmSession.utm_content,
            utm_term: utmSession.utm_term,
            utm_session_id: utmSession.session_id,
            landing_page: utmSession.landing_page,
            referrer: utmSession.referrer,
            tracking_method: 'utm_correlation',
            data_sources: dataSources,
            confidence_score: calculateConfidenceScore(dataSources, utmSession),
            last_contact_date: new Date().toISOString(),
            last_message: message.message?.conversation || 'Mensagem recebida'
          })
          .eq('phone', realPhoneNumber);
        
        // Mark UTM session as matched
        await markUtmSessionAsMatched(supabase, utmSession.session_id, existingLeads[0].id);
        
        console.log(`✅ Lead existente enriquecido com UTMs`);
      } else {
        // Just update last contact without UTM data
        await supabase
          .from('leads')
          .update({
            last_contact_date: new Date().toISOString(),
            last_message: message.message?.conversation || 'Mensagem recebida'
          })
          .eq('phone', realPhoneNumber);
        
        console.log(`✅ Lead existente atualizado (sem UTMs pendentes)`);
      }
      
      return;
    }
    
    // Lead doesn't exist, create new one
    console.log(`🆕 Criando novo lead para ${realPhoneNumber}`);
    
    // First, try to find UTM session by phone
    let utmSession = await getUtmsFromPendingSessions(supabase, realPhoneNumber);
    let trackingMethod = 'organic';
    let dataSources = ['whatsapp_direct'];
    
    // If no direct UTM found, try correlation by other factors
    if (!utmSession) {
      console.log(`🔍 Tentando correlação por outros fatores...`);
      
      // Get device data for correlation
      const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
      
      if (deviceData?.ip_address || deviceData?.user_agent) {
        const correlatedSessions = await findUtmSessionsByCorrelation(supabase, {
          ip_address: deviceData.ip_address,
          user_agent: deviceData.user_agent,
          timeWindow: 120 // 2 hours window for correlation
        });
        
        if (correlatedSessions.length > 0) {
          utmSession = correlatedSessions[0]; // Take the most recent one
          trackingMethod = 'utm_correlation';
          dataSources.push('correlation');
          console.log(`🎯 Correlação encontrada por IP/User-Agent`);
        }
      }
    } else {
      trackingMethod = 'utm_direct';
      dataSources.push('utm_sessions');
      console.log(`🎯 UTM direto encontrado`);
    }
    
    // Get additional device data if available
    const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
    if (deviceData) {
      dataSources.push('device_data');
    }
    
    // Build new lead object
    const newLead = {
      name: contactName,
      phone: realPhoneNumber,
      campaign: utmSession?.utm_campaign || 'Contato Direto WhatsApp',
      status: 'new',
      user_id: responsibleUserId,
      initial_message: message.message?.conversation || 'Primeiro contato',
      first_contact_date: new Date().toISOString(),
      last_contact_date: new Date().toISOString(),
      last_message: message.message?.conversation || 'Mensagem recebida',
      tracking_method: trackingMethod,
      data_sources: dataSources,
      confidence_score: calculateConfidenceScore(dataSources, utmSession),
      // UTM data from session (if available)
      utm_source: utmSession?.utm_source || null,
      utm_medium: utmSession?.utm_medium || null,
      utm_campaign: utmSession?.utm_campaign || null,
      utm_content: utmSession?.utm_content || null,
      utm_term: utmSession?.utm_term || null,
      utm_session_id: utmSession?.session_id || null,
      landing_page: utmSession?.landing_page || null,
      referrer: utmSession?.referrer || null,
      // Device/tracking data
      ...deviceData
    };
    
    const { data: createdLead, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar lead direto:', error);
      logSecurityEvent('Failed to create lead', {
        error: error,
        phone: realPhoneNumber,
        instance: instanceName,
        user_id: responsibleUserId
      }, 'high');
      return;
    }
    
    console.log('✅ Lead direto criado com sucesso:', {
      id: createdLead[0]?.id,
      name: contactName,
      phone: realPhoneNumber,
      utm_source: utmSession?.utm_source || 'organic',
      confidence_score: newLead.confidence_score,
      tracking_method: trackingMethod
    });
    
    // Mark UTM session as matched if we used one
    if (utmSession && createdLead[0]) {
      await markUtmSessionAsMatched(supabase, utmSession.session_id, createdLead[0].id);
    }
    
    logSecurityEvent('Lead created successfully', {
      lead_id: createdLead[0]?.id,
      phone: realPhoneNumber,
      instance: instanceName,
      user_id: responsibleUserId,
      tracking_method: trackingMethod
    }, 'low');
    
  } catch (error) {
    console.error('💥 Erro no handleDirectLead:', error);
    logSecurityEvent('Error in handleDirectLead', {
      error: error.message,
      phone: realPhoneNumber,
      instance: instanceName
    }, 'high');
  }
}