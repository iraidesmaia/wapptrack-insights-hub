type UTMVars = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  ctwa_clid?: string;
  source_id?: string;
  media_url?: string;
};

export const collectUrlParameters = (): UTMVars => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmVars: UTMVars = {};
    
    // Standard UTM parameters
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(param => {
      const value = params.get(param);
      if (value) {
        utmVars[param as keyof UTMVars] = value;
      }
    });
    
    // Google Ads click ID
    const gclid = params.get('gclid');
    if (gclid) {
      utmVars.gclid = gclid;
      // Save to localStorage for persistence
      localStorage.setItem('_gclid', gclid);
    }
    
    // Facebook click ID  
    const fbclid = params.get('fbclid');
    if (fbclid) {
      utmVars.fbclid = fbclid;
      // Save to localStorage for persistence
      localStorage.setItem('_fbclid', fbclid);
    }

    // 🆕 META CLICK-TO-WHATSAPP ID (PRIORIDADE MÁXIMA)
    const ctwaCLid = params.get('ctwa_clid');
    if (ctwaCLid) {
      utmVars.ctwa_clid = ctwaCLid;
      // Save to localStorage for persistence
      localStorage.setItem('_ctwa_clid', ctwaCLid);
      console.log('🎯 [CTWA] Click-to-WhatsApp ID detectado e salvo:', ctwaCLid);
    }

    // 🆕 NOVOS PARÂMETROS DE TRACKING AVANÇADO
    const sourceId = params.get('source_id');
    if (sourceId) {
      utmVars.source_id = sourceId;
      localStorage.setItem('_source_id', sourceId);
    }

    const mediaUrl = params.get('media_url');
    if (mediaUrl) {
      utmVars.media_url = mediaUrl;
      localStorage.setItem('_media_url', mediaUrl);
    }

    // 🔄 RECUPERAR PARÂMETROS DO LOCALSTORAGE SE NÃO ESTIVEREM NA URL
    if (!utmVars.gclid) {
      const storedGclid = localStorage.getItem('_gclid');
      if (storedGclid) utmVars.gclid = storedGclid;
    }

    if (!utmVars.fbclid) {
      const storedFbclid = localStorage.getItem('_fbclid');
      if (storedFbclid) utmVars.fbclid = storedFbclid;
    }

    if (!utmVars.ctwa_clid) {
      const storedCtwaCLid = localStorage.getItem('_ctwa_clid');
      if (storedCtwaCLid) {
        utmVars.ctwa_clid = storedCtwaCLid;
        console.log('🎯 [CTWA] Click-to-WhatsApp ID recuperado do localStorage:', storedCtwaCLid);
      }
    }

    if (!utmVars.source_id) {
      const storedSourceId = localStorage.getItem('_source_id');
      if (storedSourceId) utmVars.source_id = storedSourceId;
    }

    if (!utmVars.media_url) {
      const storedMediaUrl = localStorage.getItem('_media_url');
      if (storedMediaUrl) utmVars.media_url = storedMediaUrl;
    }

    console.log('📊 [DATA COLLECTION] Parâmetros coletados com novos campos:', {
      ...utmVars,
      has_ctwa_clid: !!utmVars.ctwa_clid,
      has_source_id: !!utmVars.source_id,
      has_media_url: !!utmVars.media_url
    });
    
    return utmVars;
  } catch (error) {
    console.error('❌ [DATA COLLECTION] Erro ao coletar parâmetros da URL:', error);
    return {};
  }
};
