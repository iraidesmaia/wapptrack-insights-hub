import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Users,
  BarChart3
} from "lucide-react";
import { EnhancedCorrelationService, CorrelationSuggestion } from "@/services/enhancedCorrelationService";
import { LeadCorrelationDialog } from "./LeadCorrelationDialog";
import { toast } from "@/hooks/use-toast";

export function CorrelationDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    orphanLeads: 0,
    correlatedLeads: 0,
    correlationRate: 0,
    highConfidenceSuggestions: 0
  });
  const [suggestions, setSuggestions] = useState<CorrelationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [correlationStats, allSuggestions] = await Promise.all([
        EnhancedCorrelationService.getCorrelationStats(),
        EnhancedCorrelationService.findMissingCorrelations()
      ]);

      setStats(correlationStats);
      setSuggestions(allSuggestions.slice(0, 10)); // Top 10 sugestões
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const formatPercentage = (value: number) => (value * 100).toFixed(1) + '%';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Correlação</h2>
          <p className="text-muted-foreground">
            Análise inteligente de correlação entre leads e campanhas
          </p>
        </div>
        <Button onClick={loadData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Órfãos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.orphanLeads}</div>
            <p className="text-xs text-muted-foreground">
              Sem correlação com campanhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Correlacionados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.correlatedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Com campanhas atribuídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Correlação</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.correlationRate)}</div>
            <Progress value={stats.correlationRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Confiança</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.highConfidenceSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              Sugestões precisas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sugestões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Principais Sugestões de Correlação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando sugestões...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma sugestão de correlação encontrada</p>
              <p className="text-sm">Todos os leads parecem estar bem correlacionados!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getConfidenceColor(suggestion.score.confidence)}>
                        {suggestion.score.confidence === 'high' ? 'Alta' :
                         suggestion.score.confidence === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <span className="font-medium">
                        Lead → {suggestion.campaignName}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatPercentage(suggestion.score.score)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {suggestion.score.factors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedLead({
                      id: suggestion.leadId, 
                      name: `Lead ${suggestion.leadId.slice(0, 8)}`
                    })}
                    size="sm"
                  >
                    Analisar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Correlação */}
      {selectedLead && (
        <LeadCorrelationDialog
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          leadId={selectedLead.id}
          leadName={selectedLead.name}
          onCorrelationApplied={loadData}
        />
      )}
    </div>
  );
}