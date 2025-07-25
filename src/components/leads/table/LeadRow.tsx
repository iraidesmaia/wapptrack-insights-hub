import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Phone 
} from 'lucide-react';
import { Lead } from '@/types';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from './StatusBadge';
import MessageTooltip from './MessageTooltip';

interface LeadRowProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (phone: string) => void;
  onRecorrelation?: (lead: Lead) => void;
}

const LeadRow = ({ lead, onView, onEdit, onDelete, onOpenWhatsApp, onRecorrelation }: LeadRowProps) => {
  console.log('[LeadsTable] Rendering lead row for:', lead.name);

  const isOrganicLead = (lead: Lead) => {
    return lead.campaign === 'WhatsApp Orgânico' || lead.utm_source === 'whatsapp' || lead.tracking_method === 'organic';
  };

  const hasDeviceData = (lead: Lead) => {
    return lead.device_type || lead.browser || lead.os || lead.location || lead.ip_address;
  };

  const canRecorrelate = isOrganicLead(lead) && hasDeviceData(lead);

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">
        <span className="text-sm">{lead.name}</span>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-sm">
            {formatBrazilianPhone(lead.phone)}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col space-y-1">
          <span className="text-sm">{lead.campaign}</span>
          {canRecorrelate && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 w-fit">
              Recorrelação Disponível
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <StatusBadge status={lead.status} />
      </TableCell>
      
      <TableCell>
        {lead.created_at && (
          <span className="text-sm text-muted-foreground">
            {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', {
              locale: ptBR
            })}
          </span>
        )}
      </TableCell>
      
      <TableCell>
        <MessageTooltip message={lead.last_message || ''} />
      </TableCell>
      
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-col space-y-1">
          {hasDeviceData(lead) && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 w-fit">
              Dispositivo
            </Badge>
          )}
          {lead.utm_source && lead.utm_source !== 'whatsapp' && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 w-fit">
              UTMs
            </Badge>
          )}
          {lead.facebook_ad_id && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 w-fit">
              Facebook
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Quick WhatsApp Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenWhatsApp(lead.phone)}
            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
            title="Abrir WhatsApp"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {/* Quick Edit Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(lead)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
            title="Editar Lead"
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          {/* More Actions Dropdown */}
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
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => onOpenWhatsApp(lead.phone)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                WhatsApp
              </DropdownMenuItem>
              
              {canRecorrelate && onRecorrelation && (
                <DropdownMenuItem onClick={() => onRecorrelation(lead)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recorrelacionar
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem 
                onClick={() => onDelete(lead.id)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default LeadRow;