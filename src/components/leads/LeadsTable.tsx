
import React from 'react';
import { Lead } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { formatPhoneWithCountryCode } from '@/lib/phoneUtils';
import { MessageSquare, Edit, Trash2 } from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (phone: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  isLoading,
  onEdit,
  onDelete,
  onOpenWhatsApp
}) => {
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

  const renderMessage = (message: string | undefined | null) => {
    console.log('🔍 Renderizando mensagem:', { message, type: typeof message });
    
    if (!message || message.trim() === '' || message === 'null' || message === 'undefined') {
      return <span className="text-muted-foreground italic">Sem mensagem</span>;
    }
    
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
    
    return (
      <div className="max-w-xs">
        <span 
          className="text-sm break-words" 
          title={message}
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {truncatedMessage}
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="table-wrapper overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-medium">Nome</th>
                <th className="p-4 text-left font-medium">Telefone</th>
                <th className="p-4 text-left font-medium">Campanha</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Última Mensagem</th>
                <th className="p-4 text-left font-medium">Data Criação</th>
                <th className="p-4 text-left font-medium">Primeiro Contato</th>
                <th className="p-4 text-left font-medium">Último Contato</th>
                <th className="p-4 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center">
                    Carregando leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center">
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{lead.name}</td>
                    <td className="p-4">{formatPhoneWithCountryCode(lead.phone)}</td>
                    <td className="p-4">{lead.campaign}</td>
                    <td className="p-4">{getStatusBadge(lead.status)}</td>
                    <td className="p-4">
                      {renderMessage(lead.last_message)}
                    </td>
                    <td className="p-4">{formatDate(lead.created_at)}</td>
                    <td className="p-4">{lead.first_contact_date ? formatDate(lead.first_contact_date) : '-'}</td>
                    <td className="p-4">{lead.last_contact_date ? formatDate(lead.last_contact_date) : '-'}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenWhatsApp(lead.phone)}
                        title="Abrir WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(lead)}
                        title="Editar lead"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(lead.id)}
                        title="Excluir lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsTable;
