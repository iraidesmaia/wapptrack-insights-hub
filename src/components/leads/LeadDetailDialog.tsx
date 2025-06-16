import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Calendar, Phone, Tag, ExternalLink, Edit, Save, X } from 'lucide-react';
import { Lead } from '@/types';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DeviceInfoDisplay from './DeviceInfoDisplay';

interface LeadDetailDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<Lead>) => Promise<void>;
  onOpenWhatsApp: (phone: string) => void;
}

const LeadDetailDialog = ({ lead, isOpen, onClose, onSave, onOpenWhatsApp }: LeadDetailDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});

  if (!lead) return null;

  const handleEdit = () => {
    setEditData({
      name: lead.name,
      status: lead.status,
      notes: lead.notes || '',
      utm_source: lead.utm_source || '',
      utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
      utm_content: lead.utm_content || '',
      utm_term: lead.utm_term || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const openWhatsApp = () => {
    onOpenWhatsApp(lead.phone);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'contacted': return 'Contatado';
      case 'qualified': return 'Qualificado';
      case 'converted': return 'Convertido';
      case 'lost': return 'Perdido';
      default: return status;
    }
  };

  // Extrair dados do dispositivo tanto do custom_fields quanto dos novos campos diretos
  const deviceInfo = lead.custom_fields?.device_info || {
    ip_address: lead.ip_address,
    browser: lead.browser,
    os: lead.os,
    device_type: lead.device_type,
    device_model: lead.device_model,
    location: lead.location,
    country: lead.country,
    city: lead.city,
    screen_resolution: lead.screen_resolution,
    timezone: lead.timezone,
    language: lead.language
  };

  // Verificar se há dados de dispositivo válidos
  const hasDeviceData = deviceInfo && (
    deviceInfo.device_type || 
    deviceInfo.browser || 
    deviceInfo.os || 
    deviceInfo.location ||
    deviceInfo.ip_address
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Lead</span>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Informações Básicas</TabsTrigger>
            <TabsTrigger value="device">Dispositivo</TabsTrigger>
            <TabsTrigger value="utm">UTM & Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{lead.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-sm">{formatBrazilianPhone(lead.phone)}</span>
                      <Button onClick={openWhatsApp} variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    {isEditing ? (
                      <Select
                        value={editData.status || lead.status}
                        onValueChange={(value: Lead['status']) => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                          <SelectItem value="converted">Convertido</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Campanha</Label>
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{lead.campaign}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mensagens e Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.last_message && (
                    <div className="space-y-2">
                      <Label>Última Mensagem</Label>
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-1" />
                        <p className="text-sm bg-gray-50 p-2 rounded">{lead.last_message}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Primeiro Contato</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {lead.first_contact_date
                          ? format(new Date(lead.first_contact_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Não disponível'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Último Contato</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {lead.last_contact_date
                          ? format(new Date(lead.last_contact_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Não disponível'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Adicione suas observações sobre este lead..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{lead.notes || 'Nenhuma observação'}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="device" className="space-y-4">
            {hasDeviceData ? (
              <DeviceInfoDisplay deviceInfo={deviceInfo} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <p className="text-gray-500">Nenhuma informação de dispositivo disponível para este lead.</p>
                    <p className="text-xs text-gray-400">
                      Os dados são coletados automaticamente quando o lead interage com o formulário de contato.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="utm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parâmetros UTM e Tracking</CardTitle>
                <CardDescription>Informações de origem e campanha do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utm_source">UTM Source</Label>
                    {isEditing ? (
                      <Input
                        id="utm_source"
                        value={editData.utm_source || ''}
                        onChange={(e) => setEditData({ ...editData, utm_source: e.target.value })}
                        placeholder="facebook, google, etc."
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_source || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_medium">UTM Medium</Label>
                    {isEditing ? (
                      <Input
                        id="utm_medium"
                        value={editData.utm_medium || ''}
                        onChange={(e) => setEditData({ ...editData, utm_medium: e.target.value })}
                        placeholder="cpc, social, email, etc."
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_medium || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                    {isEditing ? (
                      <Input
                        id="utm_campaign"
                        value={editData.utm_campaign || ''}
                        onChange={(e) => setEditData({ ...editData, utm_campaign: e.target.value })}
                        placeholder="Nome da campanha"
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_campaign || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_content">UTM Content</Label>
                    {isEditing ? (
                      <Input
                        id="utm_content"
                        value={editData.utm_content || ''}
                        onChange={(e) => setEditData({ ...editData, utm_content: e.target.value })}
                        placeholder="Identificador do conteúdo"
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_content || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="utm_term">UTM Term</Label>
                    {isEditing ? (
                      <Input
                        id="utm_term"
                        value={editData.utm_term || ''}
                        onChange={(e) => setEditData({ ...editData, utm_term: e.target.value })}
                        placeholder="Palavras-chave ou termos"
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_term || 'Não disponível'}</p>
                    )}
                  </div>
                </div>

                {lead.evolution_message_id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Informações do WhatsApp</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Message ID:</strong> {lead.evolution_message_id}</p>
                      <p><strong>Status:</strong> {lead.evolution_status || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
