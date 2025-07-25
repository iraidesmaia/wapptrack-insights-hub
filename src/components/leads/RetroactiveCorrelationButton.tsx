
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, History, CheckCircle, AlertTriangle } from 'lucide-react';
import { retroactiveCorrelation } from '@/services/leadCorrelationService';
import { toast } from 'sonner';

const RetroactiveCorrelationButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleRetroactiveCorrelation = async () => {
    setIsRunning(true);
    try {
      toast.info('Iniciando correlação retroativa...');
      const result = await retroactiveCorrelation();
      setLastResult(result);
      
      if (result > 0) {
        toast.success(`${result} leads foram recorrelacionados com sucesso!`);
      } else {
        toast.info('Nenhum lead foi recorrelacionado. Todos os leads elegíveis já possuem correlação adequada.');
      }
    } catch (error) {
      console.error('Erro na correlação retroativa:', error);
      toast.error('Erro ao executar correlação retroativa');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <History className="w-4 h-4" />
          <span>Correlação Retroativa</span>
          {lastResult !== null && (
            <Badge variant="secondary">{lastResult}</Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Correlação Retroativa</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que é?</CardTitle>
              <CardDescription>
                Analisa leads dos últimos 7 dias que não possuem UTMs ou foram marcados como orgânicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Algoritmo Melhorado V3</p>
                  <p className="text-xs text-gray-600">
                    Janelas temporais inteligentes e correlação por redes sociais
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Análise Temporal Precisa</p>
                  <p className="text-xs text-gray-600">
                    ±30 minutos para correlação primária, ±2 horas para secundária
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Priorização Inteligente</p>
                  <p className="text-xs text-gray-600">
                    Facebook, Instagram e tráfego pago recebem prioridade
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Segurança</p>
                  <p className="text-xs text-gray-600">
                    Apenas correlações com 70%+ de confiança são aplicadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={handleRetroactiveCorrelation}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando leads...
                </>
              ) : (
                <>
                  <History className="w-4 h-4 mr-2" />
                  Executar Correlação Retroativa
                </>
              )}
            </Button>
          </div>

          {lastResult !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Última execução: {lastResult} leads recorrelacionados
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {lastResult > 0 
                  ? `${lastResult} leads de tráfego pago foram identificados e atualizados`
                  : 'Todos os leads elegíveis já possuem correlação adequada'
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RetroactiveCorrelationButton;
