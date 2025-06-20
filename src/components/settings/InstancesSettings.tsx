
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const InstancesSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Evolution API - WhatsApp Integration</span>
        </CardTitle>
        <CardDescription>
          Gerenciamento de instâncias Evolution API removido - usando integração externa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            O gerenciamento de instâncias Evolution API foi removido deste sistema. 
            Você pode continuar usando sua integração externa existente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstancesSettings;
