
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/MainLayout';
import CompanySettings from '@/components/settings/CompanySettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import EvolutionApiSettings from '@/components/settings/EvolutionApiSettings';
import InstancesSettings from '@/components/settings/InstancesSettings';
import ProjectSettings from '@/components/settings/ProjectSettings';
import { useSettings } from '@/hooks/useSettings';

const Settings = () => {
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
  } = useSettings();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua empresa, projetos e integrações
          </p>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="theme">Tema</TabsTrigger>
            <TabsTrigger value="evolution">Evolution API</TabsTrigger>
            <TabsTrigger value="instances">Instâncias</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectSettings />
          </TabsContent>

          <TabsContent value="company">
            <CompanySettings
              formData={formData}
              uploading={uploading}
              onInputChange={handleInputChange}
              onFileUpload={handleFileUpload}
            />
          </TabsContent>

          <TabsContent value="theme">
            <ThemeSettings
              theme={formData.theme}
              onThemeChange={handleThemeChange}
            />
          </TabsContent>

          <TabsContent value="evolution">
            <EvolutionApiSettings
              evolutionConfig={evolutionConfig}
              testingWebhook={testingEvolution}
              onEvolutionConfigChange={handleEvolutionConfigChange}
              onSaveEvolutionConfig={saveEvolutionConfig}
              onTestWebhookConnection={testEvolutionConnection}
            />
          </TabsContent>

          <TabsContent value="instances">
            <InstancesSettings />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
