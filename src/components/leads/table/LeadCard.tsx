import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ExternalLink, 
  Edit2, 
  Trash2, 
  Phone, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { Lead } from '@/types';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from './StatusBadge';
import MessageTooltip from './MessageTooltip';

interface LeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (phone: string) => void;
}

const LeadCard = ({ lead, onView, onEdit, onDelete, onOpenWhatsApp }: LeadCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  console.log('[LeadsTable] Rendering lead card for:', lead.name);

  const hasDeviceData = (lead: Lead) => {
    return lead.device_type || lead.browser || lead.os || lead.location || lead.ip_address;
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header - Always visible */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-base mb-1">{lead.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Phone className="h-4 w-4" />
              <span className="font-mono">{formatBrazilianPhone(lead.phone)}</span>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-1 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenWhatsApp(lead.phone)}
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
              title="Abrir WhatsApp"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lead)}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
              title="Editar Lead"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Last Message */}
        {lead.last_message && (
          <div className="mb-3">
            <MessageTooltip message={lead.last_message} maxLength={80} />
          </div>
        )}

        {/* Main Action Button */}
        <Button 
          onClick={() => onOpenWhatsApp(lead.phone)}
          className="w-full mb-3"
          size="sm"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir WhatsApp
        </Button>

        {/* Collapsible Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="text-sm">Detalhes</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-3 border-t">
            {/* Campaign */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">Campanha</span>
              <p className="text-sm">{lead.campaign}</p>
            </div>

            {/* Date */}
            {lead.created_at && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Data</span>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', {
                    locale: ptBR
                  })}
                </div>
              </div>
            )}

            {/* Data Badges */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">Dados Disponíveis</span>
              <div className="flex flex-wrap gap-1 mt-1">
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => onView(lead)} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(lead.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default LeadCard;