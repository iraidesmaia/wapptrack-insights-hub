
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, RefreshCw, Settings } from 'lucide-react';
import { useGlobalKeywords } from '@/hooks/useGlobalKeywords';

interface GlobalKeywordsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalKeywordsSettings: React.FC<GlobalKeywordsSettingsProps> = ({ open, onOpenChange }) => {
  const {
    keywords,
    loading,
    hasSettings,
    setKeywords,
    saveGlobalKeywords,
    applyToAllCampaigns,
    resetToDefaults
  } = useGlobalKeywords();

  const [newConversionKeyword, setNewConversionKeyword] = useState('');
  const [newCancellationKeyword, setNewCancellationKeyword] = useState('');

  const addConversionKeyword = () => {
    if (newConversionKeyword.trim() && !keywords.conversionKeywords.includes(newConversionKeyword.trim())) {
      setKeywords(prev => ({
        ...prev,
        conversionKeywords: [...prev.conversionKeywords, newConversionKeyword.trim()]
      }));
      setNewConversionKeyword('');
    }
  };

  const addCancellationKeyword = () => {
    if (newCancellationKeyword.trim() && !keywords.cancellationKeywords.includes(newCancellationKeyword.trim())) {
      setKeywords(prev => ({
        ...prev,
        cancellationKeywords: [...prev.cancellationKeywords, newCancellationKeyword.trim()]
      }));
      setNewCancellationKeyword('');
    }
  };

  const removeConversionKeyword = (keyword: string) => {
    setKeywords(prev => ({
      ...prev,
      conversionKeywords: prev.conversionKeywords.filter(k => k !== keyword)
    }));
  };

  const removeCancellationKeyword = (keyword: string) => {
    setKeywords(prev => ({
      ...prev,
      cancellationKeywords: prev.cancellationKeywords.filter(k => k !== keyword)
    }));
  };

  const handleSave = async () => {
    const success = await saveGlobalKeywords(keywords);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleSaveAndApply = async () => {
    const saveSuccess = await saveGlobalKeywords(keywords);
    if (saveSuccess) {
      const applySuccess = await applyToAllCampaigns();
      if (applySuccess) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Globais de Tags
          </DialogTitle>
          <DialogDescription>
            Configure as palavras-chave que serão aplicadas automaticamente a todas as campanhas novas.
            {hasSettings ? (
              <span className="text-green-600 font-medium"> ✓ Configurações salvas</span>
            ) : (
              <span className="text-orange-600 font-medium"> ⚠ Usando configurações padrão</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Palavras-chave de Conversão */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-green-700">
                Palavras-chave de Conversão
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando essas palavras aparecerem nas mensagens, o lead será marcado como convertido automaticamente.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newConversionKeyword}
                onChange={(e) => setNewConversionKeyword(e.target.value)}
                placeholder="Nova palavra-chave de conversão..."
                onKeyPress={(e) => e.key === 'Enter' && addConversionKeyword()}
              />
              <Button onClick={addConversionKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {keywords.conversionKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {keyword}
                  <button
                    onClick={() => removeConversionKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Palavras-chave de Cancelamento */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-red-700">
                Palavras-chave de Cancelamento
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando essas palavras aparecerem nas mensagens, o lead será marcado como perdido automaticamente.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newCancellationKeyword}
                onChange={(e) => setNewCancellationKeyword(e.target.value)}
                placeholder="Nova palavra-chave de cancelamento..."
                onKeyPress={(e) => e.key === 'Enter' && addCancellationKeyword()}
              />
              <Button onClick={addCancellationKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {keywords.cancellationKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                  {keyword}
                  <button
                    onClick={() => removeCancellationKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t">
            <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Restaurar Padrões
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} variant="secondary">
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
          <Button onClick={handleSaveAndApply} disabled={loading}>
            {loading ? 'Aplicando...' : 'Salvar e Aplicar a Todas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalKeywordsSettings;
