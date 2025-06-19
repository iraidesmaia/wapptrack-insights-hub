
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { usePendingLeadConverter } from '@/hooks/usePendingLeadConverter';

const PendingLeadConverter = () => {
  const { convertPendingLeads, isConverting } = usePendingLeadConverter();

  const handleConvert = async () => {
    try {
      await convertPendingLeads();
    } catch (error) {
      console.error('Erro na conversão:', error);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5" />
          <span>Conversão de Leads Pendentes</span>
        </CardTitle>
        <CardDescription>
          Converta leads pendentes em leads definitivos no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleConvert}
            disabled={isConverting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConverting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Converter Leads Pendentes
              </>
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Esta ação converterá todos os leads pendentes em leads definitivos
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingLeadConverter;
