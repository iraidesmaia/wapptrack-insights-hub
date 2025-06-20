
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const PendingLeadConverter = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Funcionalidade Descontinuada
        </CardTitle>
        <CardDescription>
          A funcionalidade de conversão de pending leads foi removida pois a tabela pending_leads não existe mais no banco de dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>🔄 Os leads agora são criados diretamente na tabela principal</p>
          <p>✅ Não é mais necessário converter leads pendentes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingLeadConverter;
