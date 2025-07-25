
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Play, RotateCcw, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  runCtwaClidFullTest,
  getCtwaClidMonitorData,
  cleanupTestData,
  type CtwaClidTestResult,
  type CtwaClidMonitorData
} from '@/services/ctwaClidDebugService';

const CtwaClidDebugPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [monitorData, setMonitorData] = useState<CtwaClidMonitorData | null>(null);
  const { toast } = useToast();

  const runFullTest = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Iniciando teste completo do sistema ctwa_clid');
      const results = await runCtwaClidFullTest();
      setTestResults(results);
      
      toast({
        title: "Teste completo executado",
        description: "Verifique os resultados abaixo",
      });
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        variant: "destructive",
        title: "Erro no teste",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonitorData = async () => {
    try {
      const data = await getCtwaClidMonitorData();
      setMonitorData(data);
      
      toast({
        title: "Dados de monitoramento carregados",
        description: `${data.tracking_sessions.length} sessões encontradas`,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message,
      });
    }
  };

  const cleanup = async () => {
    try {
      await cleanupTestData();
      setTestResults(null);
      
      toast({
        title: "Dados de teste removidos",
        description: "Limpeza concluída com sucesso",
      });
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        variant: "destructive",
        title: "Erro na limpeza",
        description: error.message,
      });
    }
  };

  const TestResultCard = ({ title, result }: { title: string; result: CtwaClidTestResult }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
        
        {result.data && (
          <div className="bg-muted p-3 rounded-md">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
        
        {result.errors && result.errors.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-red-600 mb-1">Erros:</p>
            {result.errors.map((error, index) => (
              <Badge key={index} variant="destructive" className="mr-1 mb-1">
                {error}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Sistema de Debug ctwa_clid
        </CardTitle>
        <CardDescription>
          Painel para testar e monitorar o sistema de correlação ctwa_clid do Meta Ads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runFullTest} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isLoading ? 'Executando...' : 'Executar Teste Completo'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={loadMonitorData}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Carregar Dados de Monitoramento
          </Button>
          
          <Button 
            variant="outline" 
            onClick={cleanup}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Dados de Teste
          </Button>
        </div>

        {/* Resultados dos Testes */}
        {testResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resultados dos Testes</h3>
            
            <TestResultCard 
              title="1. Teste de Captura ctwa_clid" 
              result={testResults.captureTest} 
            />
            
            <TestResultCard 
              title="2. Teste de Priorização" 
              result={testResults.prioritizationTest} 
            />
            
            <TestResultCard 
              title="3. Simulação Webhook Evolution" 
              result={testResults.webhookTest} 
            />
          </div>
        )}

        {/* Dados de Monitoramento */}
        {monitorData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados de Monitoramento (24h)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{monitorData.attribution_stats.total_leads}</div>
                  <p className="text-xs text-muted-foreground">Total de Leads</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {monitorData.attribution_stats.evolution_api_leads}
                  </div>
                  <p className="text-xs text-muted-foreground">Meta Ads (Evolution)</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {monitorData.attribution_stats.correlation_leads}
                  </div>
                  <p className="text-xs text-muted-foreground">Correlação</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {monitorData.attribution_stats.organic_leads}
                  </div>
                  <p className="text-xs text-muted-foreground">Orgânico</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sessões com ctwa_clid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {monitorData.tracking_sessions.filter(s => s.ctwa_clid).length} de {monitorData.tracking_sessions.length} sessões
                  </div>
                  {monitorData.tracking_sessions.filter(s => s.ctwa_clid).slice(0, 3).map((session, index) => (
                    <div key={index} className="text-xs bg-muted p-2 rounded mt-2">
                      <div>ctwa_clid: {session.ctwa_clid}</div>
                      <div>Campanha: {session.utm_campaign}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Leads Meta Ads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {monitorData.leads_with_ctwa.length} leads com ctwa_clid
                  </div>
                  {monitorData.leads_with_ctwa.slice(0, 3).map((lead, index) => (
                    <div key={index} className="text-xs bg-muted p-2 rounded mt-2">
                      <div>Nome: {lead.name}</div>
                      <div>Método: {lead.tracking_method}</div>
                      <div>ctwa_clid: {lead.ctwa_clid?.substring(0, 20)}...</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Como usar este debug</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><strong>1. Teste de Captura:</strong> Verifica se o ctwa_clid está sendo salvo corretamente na tracking_sessions</div>
            <div><strong>2. Teste de Priorização:</strong> Confirma que leads com ctwa_clid são priorizados sobre correlação IP</div>
            <div><strong>3. Simulação Webhook:</strong> Testa criação de lead simulando dados da Evolution API</div>
            <div><strong>4. Monitoramento:</strong> Mostra estatísticas reais dos últimos leads e sessões</div>
            <div className="text-orange-600"><strong>Dica:</strong> Para teste real, acesse: https://seudominio.com/ir?id=CAMPAIGN_ID&ctwa_clid=teste123</div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CtwaClidDebugPanel;
