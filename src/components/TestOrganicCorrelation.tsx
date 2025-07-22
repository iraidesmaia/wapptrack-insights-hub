import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export const TestOrganicCorrelation = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const testCorrelation = async () => {
    setTesting(true);
    try {
      // Buscar sessões recentes da utm_sessions
      const { data: sessions } = await supabase
        .from('utm_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Buscar leads recentes
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setResults([
        { type: 'sessions', data: sessions || [] },
        { type: 'leads', data: leads || [] }
      ]);

    } catch (error) {
      console.error('Erro ao testar correlação:', error);
    }
    setTesting(false);
  };

  const getSourceType = (item: any) => {
    if (item.utm_source) return 'UTM';
    if (item.landing_page && !item.utm_source) return 'ORGÂNICO';
    return 'DIRETO';
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'UTM': return 'bg-blue-500';
      case 'ORGÂNICO': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔍 Teste de Correlação Orgânica vs UTM</CardTitle>
        <CardDescription>
          Visualize como o sistema correlaciona visitantes orgânicos com leads do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testCorrelation} disabled={testing} className="w-full">
          {testing ? 'Testando...' : 'Testar Correlação'}
        </Button>

        {results.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map(({ type, data }) => (
              <div key={type} className="space-y-2">
                <h3 className="font-semibold">
                  {type === 'sessions' ? '📊 Sessões Capturadas' : '👥 Leads Criados'}
                </h3>
                
                {data.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum dado encontrado</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.map((item: any, idx: number) => {
                      const sourceType = getSourceType(item);
                      return (
                        <div key={idx} className="p-3 border rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getSourceColor(sourceType)}>
                              {sourceType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {type === 'sessions' ? (
                            <div>
                              <p><strong>Session:</strong> {item.session_id?.substring(0, 8)}...</p>
                              {item.phone && <p><strong>Telefone:</strong> {item.phone}</p>}
                              {item.utm_source && <p><strong>Source:</strong> {item.utm_source}</p>}
                              {item.landing_page && <p><strong>Página:</strong> {item.landing_page?.substring(0, 40)}...</p>}
                              <p><strong>Status:</strong> {item.status}</p>
                            </div>
                          ) : (
                            <div>
                              <p><strong>Nome:</strong> {item.name}</p>
                              <p><strong>Telefone:</strong> {item.phone}</p>
                              {item.utm_source && <p><strong>Source:</strong> {item.utm_source}</p>}
                              {item.tracking_method && <p><strong>Método:</strong> {item.tracking_method}</p>}
                              {item.confidence_score && <p><strong>Confiança:</strong> {item.confidence_score}%</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">📋 Como testar:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Acesse sua landing page sem UTMs (tráfego orgânico)</li>
            <li>Envie uma mensagem pelo WhatsApp da mesma conexão</li>
            <li>Execute este teste para ver a correlação</li>
            <li>Verifique se o lead foi marcado como "ORGÂNICO"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};