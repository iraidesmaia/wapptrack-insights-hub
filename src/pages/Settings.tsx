
import React from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/MainLayout';
import CompanySettings from '@/components/settings/CompanySettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import EvolutionApiSettings from '@/components/settings/EvolutionApiSettings';
import ClientVariables from '@/components/settings/ClientVariables';
import { useClientSettings } from '@/hooks/useClientSettings';
import { useClient } from '@/context/ClientContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Settings = () => {
  const { selectedClient } = useClient();
  const {
    loading,
    uploading,
    testingEvolution,
    formData,
    evolutionConfig,
    handleInputChange,
    handleEvolutionConfigChange,
    saveEvolutionConfig,
    testEvolutionConnection,
    handleThemeChange,
    handleFileUpload,
    handleSave
  } = useClientSettings(selectedClient?.id);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações da sua empresa e integrações
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecione um cliente para configurar suas variáveis e configurações específicas.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Configurações específicas para <strong>{selectedClient.name}</strong>
          </p>
        </div>

        <div className="grid gap-6">
          <CompanySettings
            formData={formData}
            uploading={uploading}
            onInputChange={handleInputChange}
            onFileUpload={handleFileUpload}
          />

          <ThemeSettings
            theme={formData.theme}
            onThemeChange={handleThemeChange}
          />

          <EvolutionApiSettings
            evolutionConfig={evolutionConfig}
            testingWebhook={testingEvolution}
            onEvolutionConfigChange={handleEvolutionConfigChange}
            onSaveEvolutionConfig={saveEvolutionConfig}
            onTestWebhookConnection={testEvolutionConnection}
          />

          <ClientVariables
            clientId={selectedClient.id}
            clientName={selectedClient.name}
          />

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
