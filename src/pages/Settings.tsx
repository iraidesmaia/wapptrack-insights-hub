
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import type { CompanySettings } from '@/types';

const Settings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_subtitle: '',
    logo_url: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          company_name: data.company_name,
          company_subtitle: data.company_subtitle,
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        logo_url: data.publicUrl
      }));

      toast.success('Logo enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.company_name.trim()) {
        toast.error('O nome da empresa é obrigatório');
        return;
      }

      const updateData = {
        company_name: formData.company_name,
        company_subtitle: formData.company_subtitle,
        logo_url: formData.logo_url,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (settings) {
        // Update existing settings
        result = await supabase
          .from('company_settings')
          .update(updateData)
          .eq('id', settings.id);
      } else {
        // Create new settings
        result = await supabase
          .from('company_settings')
          .insert([updateData]);
      }

      if (result.error) throw result.error;

      toast.success('Configurações salvas com sucesso!');
      loadSettings(); // Reload to get updated data
      
      // Reload the page to update the sidebar with new settings
      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua empresa
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
            <CardDescription>
              Configure o nome, descrição e logo da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Digite o nome da sua empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_subtitle">Descrição/Slogan</Label>
              <Input
                id="company_subtitle"
                name="company_subtitle"
                value={formData.company_subtitle}
                onChange={handleInputChange}
                placeholder="Ex: Sistema de Marketing Digital"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: PNG, JPG, JPEG (máx. 5MB)
                  </p>
                </div>

                {formData.logo_url && (
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg border overflow-hidden">
                      <img
                        src={formData.logo_url}
                        alt="Logo da empresa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
