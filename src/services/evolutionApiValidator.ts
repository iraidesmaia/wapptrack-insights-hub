
import { toast } from 'sonner';

export interface EvolutionCredentials {
  apiKey: string;
  baseUrl: string;
  instanceName?: string;
}

export interface EvolutionValidationResult {
  isValid: boolean;
  error?: string;
  details?: any;
  canCreateInstance?: boolean;
}

export class EvolutionApiValidator {
  
  static async validateCredentials(credentials: EvolutionCredentials): Promise<EvolutionValidationResult> {
    try {
      console.log('🔍 Validando credenciais Evolution API:', { 
        baseUrl: credentials.baseUrl, 
        hasApiKey: !!credentials.apiKey 
      });

      // Teste 1: Verificar se a API está respondendo
      const healthResponse = await fetch(`${credentials.baseUrl}/`, {
        method: 'GET',
        headers: {
          'apikey': credentials.apiKey,
        },
      });

      console.log('🌐 Health check status:', healthResponse.status);

      if (!healthResponse.ok && healthResponse.status !== 404) {
        return {
          isValid: false,
          error: `API não está respondendo (${healthResponse.status})`,
          details: await healthResponse.text().catch(() => 'Sem resposta')
        };
      }

      // Teste 2: Tentar listar instâncias para validar autenticação
      const instancesResponse = await fetch(`${credentials.baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': credentials.apiKey,
        },
      });

      console.log('📋 Fetch instances status:', instancesResponse.status);

      if (instancesResponse.status === 401 || instancesResponse.status === 403) {
        return {
          isValid: false,
          error: 'API Key inválida ou sem permissão',
          details: 'Verifique se a API Key está correta e tem as permissões necessárias'
        };
      }

      const instancesData = await instancesResponse.json().catch(() => null);
      console.log('📋 Instâncias existentes:', instancesData);

      // Teste 3: Tentar criar uma instância de teste
      const testInstanceName = `test_${Date.now()}`;
      const createResponse = await fetch(`${credentials.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': credentials.apiKey,
        },
        body: JSON.stringify({
          instanceName: testInstanceName,
          qrcode: false,
          webhook: {
            url: 'https://webhook.site/test',
            enabled: false
          }
        }),
      });

      console.log('🧪 Test instance creation status:', createResponse.status);
      const createData = await createResponse.json().catch(() => null);
      console.log('🧪 Test instance data:', createData);

      if (createResponse.ok) {
        // Limpar instância de teste
        try {
          await fetch(`${credentials.baseUrl}/instance/delete/${testInstanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': credentials.apiKey },
          });
          console.log('🗑️ Instância de teste removida');
        } catch (e) {
          console.log('⚠️ Erro ao remover instância de teste:', e);
        }

        return {
          isValid: true,
          canCreateInstance: true,
          details: 'Credenciais válidas e podem criar instâncias'
        };
      }

      // Se chegou aqui, há algum problema específico
      return {
        isValid: false,
        error: this.parseEvolutionError(createData),
        details: createData
      };

    } catch (error: any) {
      console.error('❌ Erro na validação:', error);
      return {
        isValid: false,
        error: `Erro de conexão: ${error.message}`,
        details: error
      };
    }
  }

  static parseEvolutionError(errorData: any): string {
    if (!errorData) return 'Erro desconhecido';
    
    if (errorData.response?.message) {
      const messages = Array.isArray(errorData.response.message) 
        ? errorData.response.message 
        : [errorData.response.message];
      
      if (messages.includes('Invalid integration')) {
        return 'Configuração de integração inválida - verifique URL e API Key';
      }
      
      return messages.join(', ');
    }
    
    if (errorData.error) {
      return errorData.error;
    }
    
    return 'Erro não identificado na Evolution API';
  }

  static async testConnection(baseUrl: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }
}
