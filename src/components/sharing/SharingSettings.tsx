
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useInvites } from '@/hooks/useInvites';
import InviteForm from './InviteForm';
import InvitedUsersList from './InvitedUsersList';

const SharingSettings = () => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const { invitedUsers, isLoading } = useInvites();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compartilhamento de Acesso</CardTitle>
            <CardDescription>
              Gerencie quem pode acessar seu sistema e quais seções podem visualizar
            </CardDescription>
          </div>
          <Button onClick={() => setShowInviteForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Convidar Usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showInviteForm && (
          <InviteForm
            onClose={() => setShowInviteForm(false)}
            onSuccess={() => setShowInviteForm(false)}
          />
        )}

        <InvitedUsersList 
          users={invitedUsers} 
          isLoading={isLoading} 
        />
      </CardContent>
    </Card>
  );
};

export default SharingSettings;
