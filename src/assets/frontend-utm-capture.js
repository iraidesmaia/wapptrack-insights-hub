/**
 * WappTrack UTM Capture System
 * Captura automaticamente parâmetros UTM e dados de sessão para correlação com leads do WhatsApp
 * 
 * @version 1.0.0
 * @author Sistema de Unificação de Leads
 */

class WappTrackUTMCapture {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '',
      debug: config.debug || false,
      autoCapture: config.autoCapture !== false,
      sessionStorageKey: config.sessionStorageKey || 'wapptrack_session_id',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.sessionId = this.getOrCreateSessionId();
    this.utmData = {};
    this.isDataCaptured = false;
    
    this.log('WappTrack inicializado', { sessionId: this.sessionId, config: this.config });
    
    if (this.config.autoCapture) {
      this.captureUTMData();
    }
  }
  
  /**
   * Log debug messages
   */
  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[WappTrack] ${message}`, data || '');
    }
  }
  
  /**
   * Gera ou recupera session ID
   */
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem(this.config.sessionStorageKey);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.config.sessionStorageKey, sessionId);
      this.log('Nova sessão criada', sessionId);
    } else {
      this.log('Sessão existente recuperada', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Gera ID único para a sessão
   */
  generateSessionId() {
    return 'wt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Extrai parâmetros UTM da URL atual
   */
  extractUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};
    
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmKeys.forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        utmParams[key.replace('utm_', '')] = value;
      }
    });
    
    // Também capturar outros parâmetros relevantes
    if (urlParams.get('gclid')) utmParams.gclid = urlParams.get('gclid');
    if (urlParams.get('fbclid')) utmParams.fbclid = urlParams.get('fbclid');
    if (urlParams.get('ttclid')) utmParams.ttclid = urlParams.get('ttclid');
    
    return utmParams;
  }
  
  /**
   * Coleta dados do navegador e sessão
   */
  collectBrowserData() {
    return {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      landingPage: window.location.href,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Captura todos os dados UTM e de sessão
   */
  captureUTMData() {
    try {
      const utmParams = this.extractUTMParams();
      const browserData = this.collectBrowserData();
      
      this.utmData = {
        sessionId: this.sessionId,
        ...utmParams,
        ...browserData
      };
      
      this.log('Dados UTM capturados', this.utmData);
      
      // Enviar dados sempre (com ou sem UTMs) para capturar tráfego orgânico
      this.sendUTMData();
      
      return this.utmData;
      
    } catch (error) {
      console.error('[WappTrack] Erro ao capturar dados UTM:', error);
      return null;
    }
  }
  
  /**
   * Envia dados para o endpoint de captura
   */
  async sendUTMData(phone = null, retryCount = 0) {
    if (!this.config.apiEndpoint) {
      console.warn('[WappTrack] API endpoint não configurado');
      return false;
    }
    
    try {
      const payload = { ...this.utmData };
      if (phone) {
        payload.phone = this.sanitizePhone(phone);
      }
      
      this.log('Enviando dados para API', payload);
      
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.log('Dados enviados com sucesso', result);
      this.isDataCaptured = true;
      
      return true;
      
    } catch (error) {
      console.error(`[WappTrack] Erro ao enviar dados (tentativa ${retryCount + 1}):`, error);
      
      // Retry logic
      if (retryCount < this.config.maxRetries) {
        this.log(`Tentando novamente em ${this.config.retryDelay}ms...`);
        setTimeout(() => {
          this.sendUTMData(phone, retryCount + 1);
        }, this.config.retryDelay);
      }
      
      return false;
    }
  }
  
  /**
   * Sanitiza número de telefone
   */
  sanitizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^\d]/g, '');
  }
  
  /**
   * Anexa captura a um formulário
   */
  attachToForm(formSelector, phoneFieldSelector) {
    const form = document.querySelector(formSelector);
    const phoneField = document.querySelector(phoneFieldSelector);
    
    if (!form) {
      console.warn(`[WappTrack] Formulário não encontrado: ${formSelector}`);
      return false;
    }
    
    if (!phoneField) {
      console.warn(`[WappTrack] Campo de telefone não encontrado: ${phoneFieldSelector}`);
      return false;
    }
    
    this.log('Anexando ao formulário', { form: formSelector, phone: phoneFieldSelector });
    
    // Capturar dados quando o telefone for preenchido
    phoneField.addEventListener('blur', () => {
      const phone = phoneField.value;
      if (phone && phone.length >= 8) {
        this.sendUTMData(phone);
      }
    });
    
    // Capturar dados no envio do formulário
    form.addEventListener('submit', (e) => {
      const phone = phoneField.value;
      if (phone) {
        this.sendUTMData(phone);
      }
    });
    
    return true;
  }
  
  /**
   * Anexa captura a botões do WhatsApp
   */
  attachToWhatsAppButton(buttonSelector) {
    const buttons = document.querySelectorAll(buttonSelector);
    
    if (buttons.length === 0) {
      console.warn(`[WappTrack] Botões do WhatsApp não encontrados: ${buttonSelector}`);
      return false;
    }
    
    this.log(`Anexando a ${buttons.length} botões do WhatsApp`);
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        // Tentar extrair telefone do link wa.me
        const href = button.href || button.getAttribute('data-phone') || '';
        const phoneMatch = href.match(/(?:whatsapp\.com\/|wa\.me\/)(?:\+)?(\d+)/);
        
        if (phoneMatch) {
          const phone = phoneMatch[1];
          this.log('Telefone extraído do botão WhatsApp:', phone);
          this.sendUTMData(phone);
        } else {
          // Enviar sem telefone específico
          this.sendUTMData();
        }
      });
    });
    
    return true;
  }
  
  /**
   * Força captura manual com telefone
   */
  captureWithPhone(phone) {
    if (!this.utmData.sessionId) {
      this.captureUTMData();
    }
    return this.sendUTMData(phone);
  }
  
  /**
   * Retorna dados capturados
   */
  getCapturedData() {
    return {
      sessionId: this.sessionId,
      utmData: this.utmData,
      isDataCaptured: this.isDataCaptured
    };
  }
  
  /**
   * Health check do endpoint
   */
  async healthCheck() {
    if (!this.config.apiEndpoint) {
      return { status: 'error', message: 'Endpoint não configurado' };
    }
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'GET'
      });
      
      if (response.ok) {
        const result = await response.json();
        return { status: 'ok', data: result };
      } else {
        return { status: 'error', message: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.WappTrackUTMCapture = WappTrackUTMCapture;
}

// Também exportar como módulo (se suportado)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WappTrackUTMCapture;
}

// Auto-inicialização se configurado via atributos data-*
document.addEventListener('DOMContentLoaded', function() {
  const autoInitScript = document.querySelector('script[data-wapptrack-auto]');
  
  if (autoInitScript) {
    const config = {
      apiEndpoint: autoInitScript.getAttribute('data-api-endpoint') || '',
      debug: autoInitScript.getAttribute('data-debug') === 'true',
      autoCapture: autoInitScript.getAttribute('data-auto-capture') !== 'false'
    };
    
    window.wappTrackInstance = new WappTrackUTMCapture(config);
    
    // Auto-attach se configurado
    const formSelector = autoInitScript.getAttribute('data-form-selector');
    const phoneSelector = autoInitScript.getAttribute('data-phone-selector');
    const whatsappSelector = autoInitScript.getAttribute('data-whatsapp-selector');
    
    if (formSelector && phoneSelector) {
      window.wappTrackInstance.attachToForm(formSelector, phoneSelector);
    }
    
    if (whatsappSelector) {
      window.wappTrackInstance.attachToWhatsAppButton(whatsappSelector);
    }
  }
});