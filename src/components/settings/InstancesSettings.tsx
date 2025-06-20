
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const InstancesSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Gerenciamento de Instâncias</span>
        </CardTitle>
        <CardDescription>
          Esta funcionalidade foi removida. Use sua própria solução de Evolution API externa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            O gerenciamento de instâncias Evolution API foi removido desta aplicação.
            <br />
            Utilize sua solução externa existente para gerenciar as instâncias WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstancesSettings;
