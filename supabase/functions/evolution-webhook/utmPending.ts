// Módulo para gerenciar sessões UTM pendentes e correlação de leads

export const cleanupExpiredUtmSessions = async (supabase: any) => {
  try {
    console.log('🧹 Limpando sessões UTM expiradas...');
    
    const { data, error } = await supabase
      .from('utm_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending');
    
    if (error) {
      console.error('❌ Erro ao limpar sessões expiradas:', error);
    } else {
      console.log('✅ Limpeza de sessões UTM concluída');
    }
  } catch (error) {
    console.error('❌ Erro geral na limpeza de sessões:', error);
  }
};

export const findUtmSessionsByCorrelation = async (supabase: any, correlationData: {
  phone?: string;
  user_agent?: string;
  ip_address?: string;
}): Promise<any[]> => {
  try {
    console.log('🔍 Buscando sessões UTM por correlação...', correlationData);
    
    // Buscar sessões UTM nas últimas 4 horas
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    let query = supabase
      .from('utm_sessions')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', fourHoursAgo)
      .order('created_at', { ascending: false });
    
    // Aplicar filtros de correlação
    if (correlationData.phone) {
      const { data: phoneMatches } = await query.eq('phone', correlationData.phone);
      if (phoneMatches && phoneMatches.length > 0) {
        console.log(`✅ Encontradas ${phoneMatches.length} sessões por telefone`);
        return phoneMatches;
      }
    }
    
    if (correlationData.ip_address) {
      const { data: ipMatches } = await query.eq('ip_address', correlationData.ip_address);
      if (ipMatches && ipMatches.length > 0) {
        const sourceType = ipMatches[0].utm_source ? 'utm' : 'orgânico';
        console.log(`✅ Encontradas ${ipMatches.length} sessões por IP (${sourceType})`);
        return ipMatches;
      }
    }
    
    if (correlationData.user_agent) {
      const { data: uaMatches } = await query.eq('user_agent', correlationData.user_agent);
      if (uaMatches && uaMatches.length > 0) {
        const sourceType = uaMatches[0].utm_source ? 'utm' : 'orgânico';
        console.log(`✅ Encontradas ${uaMatches.length} sessões por User-Agent (${sourceType})`);
        return uaMatches;
      }
    }
    
    console.log('❌ Nenhuma sessão UTM encontrada para correlação');
    return [];
    
  } catch (error) {
    console.error('❌ Erro ao buscar sessões UTM:', error);
    return [];
  }
};

export const getUtmsFromPendingSessions = async (supabase: any, phone: string) => {
  try {
    console.log(`🔍 Buscando UTMs pendentes para ${phone}...`);
    
    const { data: sessions, error } = await supabase
      .from('utm_sessions')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar sessões UTM:', error);
      return null;
    }
    
    if (sessions && sessions.length > 0) {
      const isOrganic = !sessions[0].utm_source;
      console.log(`✅ Sessão ${isOrganic ? 'ORGÂNICA' : 'UTM'} encontrada:`, {
        session_id: sessions[0].session_id,
        utm_source: sessions[0].utm_source || 'orgânico',
        landing_page: sessions[0].landing_page
      });
      return sessions[0];
    }
    
    console.log(`❌ Nenhuma sessão UTM pendente encontrada para ${phone}`);
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar UTMs:', error);
    return null;
  }
};

export const markUtmSessionAsMatched = async (supabase: any, sessionId: string, leadId: string) => {
  try {
    console.log(`🔗 Marcando sessão UTM ${sessionId} como correlacionada com lead ${leadId}`);
    
    const { error } = await supabase
      .from('utm_sessions')
      .update({
        status: 'matched',
        matched_lead_id: leadId,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('❌ Erro ao marcar sessão como correlacionada:', error);
    } else {
      console.log('✅ Sessão UTM marcada como correlacionada');
    }
  } catch (error) {
    console.error('❌ Erro geral ao marcar sessão:', error);
  }
};