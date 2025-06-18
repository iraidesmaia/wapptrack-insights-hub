
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { usePendingLeadConverter } from '@/hooks/usePendingLeadConverter';

const PendingLeadConverter = () => {
  const { convertPendingLeads, isConverting } = usePendingLeadConverter();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Conversão de Leads Pendentes
        </CardTitle>
        <CardDescription>
          Converta leads de formulários que estão pendentes em leads definitivos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button 
            onClick={convertPendingLeads}
            disabled={isConverting}
            variant="outline"
          >
            {isConverting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Converter Pending Leads
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Clique para converter todos os leads de formulários pendentes em leads definitivos
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingLeadConverter;
