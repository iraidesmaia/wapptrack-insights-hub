import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Target, MapPin, Smartphone, Wifi } from "lucide-react";
import { EnhancedCorrelationService, CorrelationSuggestion } from "@/services/enhancedCorrelationService";
import { toast } from "@/hooks/use-toast";

interface LeadCorrelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onCorrelationApplied?: () => void;
}

export function LeadCorrelationDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onCorrelationApplied
}: LeadCorrelationDialogProps) {
  const [suggestions, setSuggestions] = useState<CorrelationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (open && leadId) {
      loadSuggestions();
    }
  }, [open, leadId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const correlations = await EnhancedCorrelationService.findMissingCorrelations(leadId);
      setSuggestions(correlations);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar sugestões de correlação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyCorrelation = async (suggestion: CorrelationSuggestion) => {
    setApplying(suggestion.campaignId);
    try {
      const reason = `Score: ${(suggestion.score.score * 100).toFixed(1)}% | Fatores: ${suggestion.score.factors.join(', ')}`;
      const success = await EnhancedCorrelationService.applyCorrelation(
        suggestion.leadId,
        suggestion.campaignId,
        reason
      );

      if (success) {
        toast({
          title: "Correlação Aplicada",
          description: `Lead ${leadName} foi correlacionado com a campanha ${suggestion.campaignName}`,
          variant: "default"
        });
        onCorrelationApplied?.();
        onOpenChange(false);
      } else {
        throw new Error('Falha ao aplicar correlação');
      }
    } catch (error) {
      console.error('Erro ao aplicar correlação:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar correlação",
        variant: "destructive"
      });
    } finally {
      setApplying(null);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Correlação de Lead: {leadName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Analisando correlações...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma correlação encontrada para este lead</p>
              <p className="text-sm">Tente ajustar os parâmetros de busca ou verificar manualmente</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Sugestões de Correlação ({suggestions.length})
                </h3>
                <Button 
                  onClick={loadSuggestions} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  Atualizar
                </Button>
              </div>

              {suggestions.map((suggestion, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{suggestion.campaignName}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(suggestion.score.confidence)}>
                          {suggestion.score.confidence === 'high' ? 'Alta Confiança' :
                           suggestion.score.confidence === 'medium' ? 'Média Confiança' : 'Baixa Confiança'}
                        </Badge>
                        <span className={`text-2xl font-bold ${getScoreColor(suggestion.score.score)}`}>
                          {(suggestion.score.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Fatores de Correlação */}
                    <div>
                      <h4 className="font-medium mb-2">Fatores de Correlação:</h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.score.factors.map((factor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Detalhes Técnicos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Janela Temporal</div>
                          <div className="text-muted-foreground">
                            {suggestion.timeWindow.toFixed(1)}h
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Dispositivo</div>
                          <div className={suggestion.deviceMatch ? "text-green-600" : "text-red-600"}>
                            {suggestion.deviceMatch ? "✓ Match" : "✗ No Match"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Localização</div>
                          <div className={suggestion.locationMatch ? "text-green-600" : "text-red-600"}>
                            {suggestion.locationMatch ? "✓ Match" : "✗ No Match"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Método</div>
                          <div className="text-muted-foreground capitalize">
                            {suggestion.score.method.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Ações */}
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => applyCorrelation(suggestion)}
                        disabled={applying === suggestion.campaignId}
                        className="min-w-[120px]"
                      >
                        {applying === suggestion.campaignId ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Aplicando...
                          </div>
                        ) : (
                          'Aplicar Correlação'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}