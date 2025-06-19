
import { getUtmsFromDirectClick } from './utmHandler.ts';
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { getContactName } from './helpers.ts';
import { logSecurityEvent } from './security.ts';

export const handleDirectLead = async ({ 
  supabase, 
  message, 
  realPhoneNumber, 
  instanceName 
}: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  instanceName: string;
}) => {
  console.log(`🆕 handleDirectLead - Novo contato direto de: ${realPhoneNumber} (instância: ${instanceName})`);
  
  try {
    // 🔍 Buscar usuário responsável pela instância
    console.log(`🔍 Buscando usuário para instância: ${instanceName}`);
    
    const { data: userData, error: userError } = await supabase.rpc('get_user_by_instance', {
      instance_name_param: instanceName
    });

    let responsibleUserId = userData;

    if (userError || !responsibleUserId) {
      console.log(`❌ Nenhum usuário encontrado para instância: ${instanceName}`);
      
      // Fallback: buscar pela primeira campanha ativa (método de fallback)
      console.log(`🔄 Tentando buscar usuário pela primeira campanha ativa encontrada...`);
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
        console.log(`❌ Não foi possível determinar usuário responsável para instância: ${instanceName}`);
        logSecurityEvent('No user found for organic lead', {
          instance: instanceName,
          phone: realPhoneNumber
        }, 'high');
        return;
      }
    }

    // 🔍 Buscar dados do dispositivo associados ao telefone
    console.log(`🔍 Buscando dados do dispositivo no banco para: ${realPhoneNumber}`);
    const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
    
    if (!deviceData) {
      console.log(`❌ Nenhum dado do dispositivo encontrado no banco para: ${realPhoneNumber}`);
    }

    // 🎯 Buscar UTMs de clicks diretos
    const utms = await getUtmsFromDirectClick(supabase, realPhoneNumber);
    
    if (!utms) {
      console.log(`❌ Nenhum UTM encontrado para click direto`);
    }
    
    // 📋 Usar UTMs padrão se não encontrar nenhum
    const finalUtms = utms || {
      utm_source: 'whatsapp',
      utm_medium: 'organic', 
      utm_campaign: 'organic'
    };
    
    console.log(`📋 Usando UTMs padrão (orgânico)`);

    // 📞 Verificar se já existe um lead para este telefone antes de criar
    const phoneVariations = [
      realPhoneNumber,
      realPhoneNumber.slice(-10),
      `55${realPhoneNumber.slice(-10)}`,
      `5585${realPhoneNumber.slice(-8)}`
    ];
    
    console.log(`📞 Buscando lead existente com variações do telefone: ${JSON.stringify(phoneVariations)}`);
    
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name, phone')
      .in('phone', phoneVariations)
      .limit(1);

    if (existingLead && existingLead.length > 0) {
      console.log(`⚠️ Lead já existe para este telefone: ${existingLead[0].name} (${existingLead[0].phone})`);
      return;
    }

    console.log(`🆕 Criando novo lead direto (nenhum lead existente encontrado)...`);

    // 🆕 Criar novo lead direto
    const leadData = {
      name: getContactName(message),
      phone: realPhoneNumber,
      campaign: "WhatsApp Orgânico",
      campaign_id: null,
      user_id: responsibleUserId, // ✅ GARANTIR QUE SEMPRE TENHA user_id
      status: 'lead',
      first_contact_date: new Date().toISOString(),
      last_message: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Mensagem recebida',
      utm_source: finalUtms.utm_source,
      utm_medium: finalUtms.utm_medium,
      utm_campaign: finalUtms.utm_campaign,
      utm_content: finalUtms.utm_content || null,
      utm_term: finalUtms.utm_term || null,
      // Dados do dispositivo se disponíveis
      ...(deviceData && {
        location: deviceData.location,
        ip_address: deviceData.ip_address,
        browser: deviceData.browser,
        os: deviceData.os,
        device_type: deviceData.device_type,
        device_model: deviceData.device_model,
        country: deviceData.country,
        city: deviceData.city,
        screen_resolution: deviceData.screen_resolution,
        timezone: deviceData.timezone,
        language: deviceData.language
      })
    };

    console.log(`🆕 Criando novo lead direto: ${JSON.stringify({
      metodo_atribuicao: 'organico',
      campaign_id: leadData.campaign_id,
      nome_campanha_do_banco: leadData.campaign,
      status: leadData.status,
      user_id: leadData.user_id,
      instance_name: instanceName,
      utms: finalUtms,
      tem_dados_dispositivo: !!deviceData
    })}`);

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error(`❌ Erro ao criar lead direto:`, leadError);
      logSecurityEvent('Failed to create organic lead', {
        error: leadError,
        phone: realPhoneNumber,
        instance: instanceName,
        user_id: responsibleUserId
      }, 'high');
      return;
    }

    console.log(`✅ Novo lead direto criado: "${leadData.campaign}" ${JSON.stringify({
      lead_id: newLead.id,
      name: newLead.name,
      user_id: responsibleUserId,
      instance_name: instanceName
    })}`);

    logSecurityEvent('Organic lead created successfully', {
      lead_id: newLead.id,
      phone: realPhoneNumber,
      instance: instanceName,
      user_id: responsibleUserId
    }, 'low');

  } catch (error) {
    console.error(`💥 Erro em handleDirectLead:`, error);
    logSecurityEvent('Error in handleDirectLead', {
      error: error.message,
      phone: realPhoneNumber,
      instance: instanceName
    }, 'high');
  }
};
