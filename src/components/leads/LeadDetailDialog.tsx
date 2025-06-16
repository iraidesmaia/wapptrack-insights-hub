
import React, { useState } from 'react';
import { Lead } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { formatPhoneWithCountryCode } from '@/lib/phoneUtils';
import { MessageSquare, Edit, Save, X } from 'lucide-react';

interface LeadDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (updatedLead: Partial<Lead>) => void;
  onOpenWhatsApp: (phone: string) => void;
}

const LeadDetailDialog: React.FC<LeadDetailDialogProps> = ({
  isOpen,
  onClose,
  lead,
  onSave,
  onOpenWhatsApp
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});

  if (!lead) return null;

  const handleEdit = () => {
    setEditedLead({
      name: lead.name,
      status: lead.status,
      notes: lead.notes || '',
      first_contact_date: lead.first_contact_date || '',
      last_contact_date: lead.last_contact_date || '',
      location: lead.location || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave({ ...editedLead, id: lead.id });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedLead({});
    setIsEditing(false);
  };

  const getOrigin = () => {
    if (lead.utm_source?.toLowerCase().includes('facebook')) return 'Facebook Ads';
    if (lead.utm_source?.toLowerCase().includes('google')) return 'Google Ads';
    if (lead.utm_source) return lead.utm_source;
    return 'Direto';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-500">Novo</Badge>;
      case 'contacted':
        return <Badge variant="default" className="bg-yellow-500">Contactado</Badge>;
      case 'qualified':
        return <Badge variant="default" className="bg-accent">Qualificado</Badge>;
      case 'converted':
        return <Badge variant="default" className="bg-primary">Convertido</Badge>;
      case 'lost':
        return <Badge variant="destructive">Perdido</Badge>;
      case 'lead':
        return <Badge variant="default" className="bg-green-500">Lead</Badge>;
      case 'to_recover':
        return <Badge variant="default" className="bg-orange-500">A recuperar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Detalhes do Lead</DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenWhatsApp(lead.phone)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Resumo de Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Lead</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Campanha</Label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lead.campaign}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenWhatsApp(lead.phone)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                <span className="font-medium">{formatPhoneWithCountryCode(lead.phone)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                {isEditing ? (
                  <Input
                    value={editedLead.name || ''}
                    onChange={(e) => setEditedLead({...editedLead, name: e.target.value})}
                  />
                ) : (
                  <span className="font-medium">{lead.name}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Localização</Label>
                {isEditing ? (
                  <Input
                    value={editedLead.location || ''}
                    onChange={(e) => setEditedLead({...editedLead, location: e.target.value})}
                    placeholder="Ex: São Paulo, SP"
                  />
                ) : (
                  <span>{lead.location || 'Não informado'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Origem</Label>
                <span>{getOrigin()}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Etapa da Jornada</Label>
                {isEditing ? (
                  <Select 
                    value={editedLead.status || ''} 
                    onValueChange={(value) => setEditedLead({...editedLead, status: value as Lead['status']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="to_recover">A recuperar</SelectItem>
                      <SelectItem value="contacted">Contactado</SelectItem>
                      <SelectItem value="qualified">Qualificado</SelectItem>
                      <SelectItem value="converted">Convertido</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  getStatusBadge(lead.status)
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                <span>{formatDate(lead.created_at)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Primeiro Contato</Label>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={editedLead.first_contact_date ? new Date(editedLead.first_contact_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditedLead({...editedLead, first_contact_date: e.target.value})}
                  />
                ) : (
                  <span>{lead.first_contact_date ? formatDate(lead.first_contact_date) : 'Não realizado'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Último Contato</Label>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={editedLead.last_contact_date ? new Date(editedLead.last_contact_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditedLead({...editedLead, last_contact_date: e.target.value})}
                  />
                ) : (
                  <span>{lead.last_contact_date ? formatDate(lead.last_contact_date) : 'Não realizado'}</span>
                )}
              </div>

              {lead.last_message && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Última Mensagem</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-sm">{lead.last_message}</span>
                  </div>
                </div>
              )}

              {(isEditing || lead.notes) && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedLead.notes || ''}
                      onChange={(e) => setEditedLead({...editedLead, notes: e.target.value})}
                      placeholder="Adicione observações sobre o lead..."
                      rows={3}
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-sm">{lead.notes || 'Nenhuma observação'}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Rastreamento */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Rastreamento</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Método de rastreamento</Label>
                <span>{lead.tracking_method || 'Direto'}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Conta de anúncio</Label>
                <span>{lead.utm_source || lead.ad_account || 'Não informado'}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Nome da campanha</Label>
                <span>{lead.utm_campaign || 'Não informado'}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Nome do conjunto</Label>
                <span>{lead.utm_content || lead.ad_set_name || 'Não informado'}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Nome do anúncio</Label>
                <span>{lead.utm_term || lead.ad_name || 'Não informado'}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Utm Medium</Label>
                <span>{lead.utm_medium || 'Não informado'}</span>
              </div>

              {lead.initial_message && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Mensagem inicial</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-sm">{lead.initial_message}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Dispositivo */}
          {(lead.ip_address || lead.browser || lead.os || lead.device_type) && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Dispositivo</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">IP</Label>
                  <span className="font-mono text-sm">{lead.ip_address || 'Não capturado'}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Navegador</Label>
                  <span>{lead.browser || 'Não identificado'}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Sistema operacional</Label>
                  <span>{lead.os || 'Não identificado'}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de aparelho</Label>
                  <span>{lead.device_type || 'Não identificado'}</span>
                </div>

                {lead.device_model && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Modelo do aparelho</Label>
                    <span>{lead.device_model}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
