
import React from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/MainLayout';
import CompanySettings from '@/components/settings/CompanySettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import EvolutionWhatsAppSettings from '@/components/settings/EvolutionWhatsAppSettings';
import { useSettings } from '@/hooks/useSettings';

const Settings = () => {
  const {
    loading,
    uploading,
    formData,
    handleInputChange,
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
            Gerencie as configurações da sua empresa e integrações
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

          <EvolutionWhatsAppSettings />

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
      </div>
    </MainLayout>
  );
};

export default Settings;
