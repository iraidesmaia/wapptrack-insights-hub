
// ✅ NOVA FUNÇÃO PARA BUSCAR UTMs DE CLICKS DIRETOS
export const getUtmsFromDirectClick = async (supabase: any, phone: string): Promise<{
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
} | null> => {
  try {
    // Buscar UTMs salvos nos últimos 30 minutos para este telefone
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: clickData, error } = await supabase
      .from('utm_clicks')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar UTMs de click direto:', error);
      return null;
    }

    if (clickData && clickData.length > 0) {
      console.log('🎯 UTMs encontrados para click direto:', clickData[0]);
      return {
        utm_source: clickData[0].utm_source,
        utm_medium: clickData[0].utm_medium,
        utm_campaign: clickData[0].utm_campaign,
        utm_content: clickData[0].utm_content,
        utm_term: clickData[0].utm_term
      };
    }

    console.log('❌ Nenhum UTM encontrado para click direto');
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar UTMs:', error);
    return null;
  }
};
