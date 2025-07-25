import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Clock, Trophy, XCircle, AlertCircle, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  console.log('[LeadsTable] Rendering status badge for:', status);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return {
          label: 'Novo',
          variant: 'default' as const,
          className: 'bg-primary text-primary-foreground hover:bg-primary/80',
          icon: Star
        };
      case 'contacted':
        return {
          label: 'Contatado',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          icon: Clock
        };
      case 'qualified':
        return {
          label: 'Qualificado',
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
          icon: AlertCircle
        };
      case 'converted':
        return {
          label: 'Convertido',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          icon: Trophy
        };
      case 'lost':
        return {
          label: 'Perdido',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
          icon: XCircle
        };
      case 'lead':
        return {
          label: 'Lead',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          icon: CheckCircle
        };
      case 'to_recover':
        return {
          label: 'Recuperar',
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
          icon: RotateCcw
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground',
          icon: AlertCircle
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`inline-flex items-center gap-1.5 transition-colors ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;