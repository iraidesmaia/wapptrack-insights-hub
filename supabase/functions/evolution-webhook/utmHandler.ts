
// Este arquivo foi simplificado para remover funcionalidades obsoletas
// As funcionalidades de UTM clicks foram removidas pois a tabela utm_clicks não existe mais

export const getUtmsFromDirectClick = async (supabase: any, phone: string): Promise<{
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
} | null> => {
  console.log('❌ Funcionalidade de UTM clicks removida - tabela utm_clicks não existe');
  return null;
};
