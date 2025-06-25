
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, ExternalLink, RefreshCw, Phone, MessageSquare } from 'lucide-react';
import { Lead } from '@/types';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LeadRecorrelationDialog from './LeadRecorrelationDialog';

interface LeadsTableProps {
  leads: Lead[];
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (phone: string) => void;
  onRefresh: () => void;
}

const LeadsTable = ({ leads, onView, onEdit, onDelete, onOpenWhatsApp, onRefresh }: LeadsTableProps) => {
  const [recorrelationLead, setRecorrelationLead] = useState<Lead | null>(null);
  const [isRecorrelationOpen, setIsRecorrelationOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'lead': return 'bg-green-100 text-green-800';
      case 'to_recover': return 'bg-orange-100 text-orange-800';
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
      case 'lead': return 'Lead';
      case 'to_recover': return 'Recuperar';
      default: return status;
    }
  };

  const isOrganicLead = (lead: Lead) => {
    return lead.campaign === 'WhatsApp Orgânico' || 
           lead.utm_source === 'whatsapp' || 
           lead.tracking_method === 'organic';
  };

  const hasDeviceData = (lead: Lead) => {
    return lead.device_type || lead.browser || lead.os || lead.location || lead.ip_address;
  };

  const handleRecorrelation = (lead: Lead) => {
    setRecorrelationLead(lead);
    setIsRecorrelationOpen(true);
  };

  const handleRecorrelationSuccess = () => {
    onRefresh();
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum lead encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Última Mensagem</TableHead>
              <TableHead>Dados</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-sm">
                      {formatBrazilianPhone(lead.phone)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{lead.campaign}</span>
                    {isOrganicLead(lead) && hasDeviceData(lead) && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                        Recorrelação Disponível
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusLabel(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.created_at && (
                    <span className="text-sm text-gray-600">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.last_message && (
                    <div className="flex items-center space-x-2 max-w-xs">
                      <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">
                        {lead.last_message}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {hasDeviceData(lead) && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Dispositivo
                      </Badge>
                    )}
                    {lead.utm_source && lead.utm_source !== 'whatsapp' && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        UTMs
                      </Badge>
                    )}
                    {lead.facebook_ad_id && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        Facebook
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(lead)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenWhatsApp(lead.phone)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        WhatsApp
                      </DropdownMenuItem>
                      {isOrganicLead(lead) && hasDeviceData(lead) && (
                        <DropdownMenuItem onClick={() => handleRecorrelation(lead)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Recorrelacionar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete(lead.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadRecorrelationDialog
        lead={recorrelationLead}
        isOpen={isRecorrelationOpen}
        onClose={() => {
          setIsRecorrelationOpen(false);
          setRecorrelationLead(null);
        }}
        onSuccess={handleRecorrelationSuccess}
      />
    </>
  );
};

export default LeadsTable;
