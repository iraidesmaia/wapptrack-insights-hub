
import { supabase } from '@/integrations/supabase/client';

export interface CtwaClidTestResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface CtwaClidMonitorData {
  tracking_sessions: any[];
  leads_with_ctwa: any[];
  evolution_logs: any[];
  attribution_stats: {
    total_leads: number;
    evolution_api_leads: number;
    correlation_leads: number;
    organic_leads: number;
  };
}

/**
 * Teste 1: Verificar captura do ctwa_clid no frontend
 */
export const testCtwaClidCapture = async (testCtwaClidValue: string = 'test_ctwa_clid_123'): Promise<CtwaClidTestResult> => {
  try {
    console.log('🧪 [CTWA DEBUG] Testando captura do ctwa_clid:', testCtwaClidValue);
    
    // Simular parâmetros UTM com ctwa_clid
    const testUtms = {
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'test_campaign',
      utm_content: 'test_content',
      utm_term: 'test_term',
      ctwa_clid: testCtwaClidValue,
      source_id: 'test_source_123',
      media_url: 'https://test-media-url.com/video.mp4'
    };

    // Salvar dados de tracking
    const { data: sessionData, error: sessionError } = await supabase
      .from('tracking_sessions')
      .insert({
        session_id: `test_session_${Date.now()}`,
        browser_fingerprint: `test_fingerprint_${Date.now()}`,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Test Browser)',
        campaign_id: 'test-campaign-id',
        utm_source: testUtms.utm_source,
        utm_medium: testUtms.utm_medium,
        utm_campaign: testUtms.utm_campaign,
        utm_content: testUtms.utm_content,
        utm_term: testUtms.utm_term,
        ctwa_clid: testUtms.ctwa_clid,
        source_id: testUtms.source_id,
        media_url: testUtms.media_url,
        screen_resolution: '1920x1080',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo'
      })
      .select()
      .single();

    if (sessionError) {
      return {
        success: false,
        message: 'Erro ao salvar dados de tracking',
        errors: [sessionError.message]
      };
    }

    // Verificar se o ctwa_clid foi salvo corretamente
    const savedCtwaCLid = sessionData.ctwa_clid;
    if (savedCtwaCLid !== testCtwaClidValue) {
      return {
        success: false,
        message: 'ctwa_clid não foi salvo corretamente',
        errors: [`Esperado: ${testCtwaClidValue}, Recebido: ${savedCtwaCLid}`]
      };
    }

    // Verificar localStorage (simulado)
    try {
      localStorage.setItem('_ctwa_clid', testCtwaClidValue);
      const localStorageValue = localStorage.getItem('_ctwa_clid');
      
      if (localStorageValue !== testCtwaClidValue) {
        return {
          success: false,
          message: 'ctwa_clid não foi salvo no localStorage',
          errors: [`localStorage: ${localStorageValue}`]
        };
      }
    } catch (error) {
      console.warn('⚠️ [CTWA DEBUG] Erro ao testar localStorage:', error);
    }

    return {
      success: true,
      message: 'ctwa_clid capturado e salvo com sucesso',
      data: {
        session_id: sessionData.session_id,
        ctwa_clid: savedCtwaCLid,
        tracking_session_id: sessionData.id
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erro geral no teste de captura',
      errors: [error.message]
    };
  }
};

/**
 * Teste 2: Verificar priorização do ctwa_clid na correlação
 */
export const testCtwaClidPrioritization = async (): Promise<CtwaClidTestResult> => {
  try {
    console.log('🧪 [CTWA DEBUG] Testando priorização do ctwa_clid');

    // Buscar sessões com ctwa_clid
    const { data: ctwaSessions, error: ctwaError } = await supabase
      .from('tracking_sessions')
      .select('*')
      .not('ctwa_clid', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ctwaError) {
      return {
        success: false,
        message: 'Erro ao buscar sessões com ctwa_clid',
        errors: [ctwaError.message]
      };
    }

    // Buscar leads com tracking_method = 'evolution_api_meta'
    const { data: metaLeads, error: metaError } = await supabase
      .from('leads')
      .select('*')
      .eq('tracking_method', 'evolution_api_meta')
      .order('created_at', { ascending: false })
      .limit(5);

    if (metaError) {
      return {
        success: false,
        message: 'Erro ao buscar leads com Meta tracking',
        errors: [metaError.message]
      };
    }

    return {
      success: true,
      message: 'Dados de priorização coletados',
      data: {
        ctwa_sessions_count: ctwaSessions?.length || 0,
        meta_leads_count: metaLeads?.length || 0,
        ctwa_sessions: ctwaSessions || [],
        meta_leads: metaLeads || []
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erro no teste de priorização',
      errors: [error.message]
    };
  }
};

/**
 * Teste 3: Monitorar dados de correlação em tempo real
 */
export const getCtwaClidMonitorData = async (): Promise<CtwaClidMonitorData> => {
  try {
    console.log('📊 [CTWA DEBUG] Coletando dados de monitoramento');

    // Buscar sessões de tracking recentes (últimas 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: trackingSessions } = await supabase
      .from('tracking_sessions')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    // Buscar leads com ctwa_clid
    const { data: leadsWithCtwa } = await supabase
      .from('leads')
      .select('*')
      .not('ctwa_clid', 'is', null)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    // Estatísticas de atribuição
    const { data: allRecentLeads } = await supabase
      .from('leads')
      .select('tracking_method')
      .gte('created_at', oneDayAgo);

    const stats = {
      total_leads: allRecentLeads?.length || 0,
      evolution_api_leads: allRecentLeads?.filter(l => l.tracking_method === 'evolution_api_meta').length || 0,
      correlation_leads: allRecentLeads?.filter(l => l.tracking_method && l.tracking_method.includes('correlation')).length || 0,
      organic_leads: allRecentLeads?.filter(l => l.tracking_method === 'organic').length || 0
    };

    return {
      tracking_sessions: trackingSessions || [],
      leads_with_ctwa: leadsWithCtwa || [],
      evolution_logs: [], // Logs da Evolution API (seria preenchido via webhook)
      attribution_stats: stats
    };

  } catch (error) {
    console.error('❌ [CTWA DEBUG] Erro ao coletar dados de monitoramento:', error);
    return {
      tracking_sessions: [],
      leads_with_ctwa: [],
      evolution_logs: [],
      attribution_stats: {
        total_leads: 0,
        evolution_api_leads: 0,
        correlation_leads: 0,
        organic_leads: 0
      }
    };
  }
};

/**
 * Teste 4: Simular payload da Evolution API com ctwa_clid
 */
export const simulateEvolutionWebhook = async (testPhone: string, testCtwaClidValue: string): Promise<CtwaClidTestResult> => {
  try {
    console.log('🧪 [CTWA DEBUG] Simulando webhook da Evolution API');

    // Simular dados que viriam da Evolution API
    const simulatedPayload = {
      contextInfo: {
        externalAdReply: {
          ctwaClid: testCtwaClidValue,
          sourceId: 'test_source_123',
          sourceUrl: 'https://test-media-url.com/video.mp4',
          sourceType: 'video'
        }
      }
    };

    // Criar lead simulando o que seria feito no webhook
    const leadData = {
      name: 'Lead Teste Meta Ads',
      phone: testPhone,
      campaign: `Meta Ads - ${simulatedPayload.contextInfo.externalAdReply.sourceType}`,
      status: 'lead' as const,
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: `ctwa_${testCtwaClidValue.substring(0, 8)}`,
      utm_content: simulatedPayload.contextInfo.externalAdReply.sourceId,
      utm_term: simulatedPayload.contextInfo.externalAdReply.sourceUrl,
      tracking_method: 'evolution_api_meta',
      source_id: simulatedPayload.contextInfo.externalAdReply.sourceId,
      media_url: simulatedPayload.contextInfo.externalAdReply.sourceUrl,
      ctwa_clid: testCtwaClidValue
    };

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      return {
        success: false,
        message: 'Erro ao criar lead simulado',
        errors: [leadError.message]
      };
    }

    return {
      success: true,
      message: 'Simulação de webhook Evolution API bem-sucedida',
      data: {
        lead_id: newLead.id,
        tracking_method: newLead.tracking_method,
        ctwa_clid: newLead.ctwa_clid,
        campaign: newLead.campaign
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erro na simulação do webhook',
      errors: [error.message]
    };
  }
};

/**
 * Teste completo do sistema ctwa_clid
 */
export const runCtwaClidFullTest = async (): Promise<{
  captureTest: CtwaClidTestResult;
  prioritizationTest: CtwaClidTestResult;
  webhookTest: CtwaClidTestResult;
  monitorData: CtwaClidMonitorData;
}> => {
  console.log('🚀 [CTWA DEBUG] Iniciando teste completo do sistema ctwa_clid');

  const testCtwaClidValue = `test_${Date.now()}`;
  const testPhone = '5585999887766';

  const [captureTest, prioritizationTest, webhookTest, monitorData] = await Promise.all([
    testCtwaClidCapture(testCtwaClidValue),
    testCtwaClidPrioritization(),
    simulateEvolutionWebhook(testPhone, testCtwaClidValue),
    getCtwaClidMonitorData()
  ]);

  return {
    captureTest,
    prioritizationTest,
    webhookTest,
    monitorData
  };
};

/**
 * Limpar dados de teste
 */
export const cleanupTestData = async (): Promise<void> => {
  try {
    console.log('🧹 [CTWA DEBUG] Limpando dados de teste');

    // Remover sessões de teste
    await supabase
      .from('tracking_sessions')
      .delete()
      .like('session_id', 'test_session_%');

    // Remover leads de teste
    await supabase
      .from('leads')
      .delete()
      .eq('name', 'Lead Teste Meta Ads');

    console.log('✅ [CTWA DEBUG] Dados de teste removidos');
  } catch (error) {
    console.error('❌ [CTWA DEBUG] Erro ao limpar dados de teste:', error);
  }
};
