
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CampaignLogoUploadProps {
  campaignId: string;
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string | null) => void;
}

const CampaignLogoUpload: React.FC<CampaignLogoUploadProps> = ({
  campaignId,
  currentLogoUrl,
  onLogoChange
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB');
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('campaign-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-logos')
        .getPublicUrl(fileName);

      onLogoChange(publicUrl);
      toast.success('Logo enviado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    try {
      // Extract filename from URL to delete from storage
      const urlParts = currentLogoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      await supabase.storage
        .from('campaign-logos')
        .remove([fileName]);

      onLogoChange(null);
      toast.success('Logo removido com sucesso!');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da Campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLogoUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <img
                src={currentLogoUrl}
                alt="Logo da campanha"
                className="h-24 w-24 object-cover rounded-lg border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRemoveLogo}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Remover
              </Button>
              <Label htmlFor="logo-upload" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Alterar
                  </span>
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Clique para enviar uma logo para esta campanha
              </p>
              <Label htmlFor="logo-upload">
                <Button disabled={uploading} asChild>
                  <span>
                    {uploading ? 'Enviando...' : 'Selecionar Logo'}
                  </span>
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Formatos suportados: JPG, PNG, GIF. Tamanho máximo: 5MB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignLogoUpload;
