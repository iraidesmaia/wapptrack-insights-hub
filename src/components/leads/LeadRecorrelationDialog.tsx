
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { recorrelateLead, applyCorrelationToLead, type CorrelationResult } from '@/services/leadCorrelationService';
import { Lead } from '@/types';
import { toast } from 'sonner';

interface LeadRecorrelationDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LeadRecorrelationDialog = ({ lead, isOpen, onClose, onSuccess }: LeadRecorrelationDialogProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [correlation, setCorrelation] = useState<CorrelationResult | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);

  if (!lead) return null;

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchCompleted(false);
    setCorrelation(null);

    try {
      const result = await recorrelateLead(lead.id, lead.phone);
      setCorrelation(result);
      setSearchCompleted(true);
      
      if (result) {
        toast.success(`Correlação encontrada com ${result.confidence_score}% de confiança`);
      } else {
        toast.warning('Nenhuma correlação encontrada');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar correlações');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = async () => {
    if (!correlation) return;

    setIsApplying(true);
    try {
      const success = await applyCorrelationToLead(lead.id, correlation);
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao aplicar:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Recorrelacionar Lead</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nome:</p>
                  <p className="text-sm text-gray-600">{lead.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Telefone:</p>
                  <p className="text-sm text-gray-600">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Campanha Atual:</p>
                  <p className="text-sm text-gray-600">{lead.campaign}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Método de Tracking:</p>
                  <p className="text-sm text-gray-600">{lead.tracking_method || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Busca */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="w-full max-w-md"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando correlações...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Buscar Correlações
                </>
              )}
            </Button>
          </div>

          {/* Resultados */}
          {searchCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultado da Busca</CardTitle>
                <CardDescription>
                  Correlações encontradas nas últimas 24 horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {correlation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confiança da Correlação:</span>
                      <div className="flex items-center space-x-2">
                        {getConfidenceIcon(correlation.confidence_score || 0)}
                        <Badge className={getConfidenceColor(correlation.confidence_score || 0)}>
                          {correlation.confidence_score}%
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Método de Correlação:</p>
                        <p className="text-sm text-gray-600">{correlation.match_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Nova Campanha:</p>
                        <p className="text-sm text-gray-600">{correlation.campaign_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">UTM Source:</p>
                        <p className="text-sm text-gray-600">{correlation.utm_source || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">UTM Medium:</p>
                        <p className="text-sm text-gray-600">{correlation.utm_medium || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">UTM Campaign:</p>
                        <p className="text-sm text-gray-600">{correlation.utm_campaign || 'N/A'}</p>
                      </div>
                    </div>

                    {correlation.confidence_score >= 60 && (
                      <div className="flex justify-center pt-4">
                        <Button 
                          onClick={handleApply}
                          disabled={isApplying}
                          className="w-full max-w-md"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Aplicando correlação...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aplicar Correlação
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {correlation.confidence_score < 60 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            Confiança muito baixa. Recomenda-se não aplicar esta correlação.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Nenhuma correlação encontrada para este lead.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Isto pode significar que o lead realmente veio de forma orgânica.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadRecorrelationDialog;
