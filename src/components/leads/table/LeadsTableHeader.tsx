import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortField = 'name' | 'created_at' | 'status' | 'campaign';
export type SortDirection = 'asc' | 'desc' | null;

interface LeadsTableHeaderProps {
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const LeadsTableHeader = ({ sortField, sortDirection, onSort }: LeadsTableHeaderProps) => {
  console.log('[LeadsTable] Rendering table header with sort:', { sortField, sortDirection });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    
    return sortDirection === 'desc' 
      ? <ArrowDown className="h-4 w-4" />
      : <ArrowUp className="h-4 w-4" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className={cn(
          "h-auto p-0 font-medium hover:bg-transparent",
          sortField === field && "text-primary"
        )}
      >
        <span className="flex items-center gap-2">
          {children}
          {getSortIcon(field)}
        </span>
      </Button>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow>
        <SortableHeader field="name">Nome</SortableHeader>
        <TableHead>Telefone</TableHead>
        <SortableHeader field="campaign">Campanha</SortableHeader>
        <SortableHeader field="status">Status</SortableHeader>
        <SortableHeader field="created_at">Data</SortableHeader>
        <TableHead>Última Mensagem</TableHead>
        <TableHead className="hidden md:table-cell">Dados</TableHead>
        <TableHead className="w-[100px]">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default LeadsTableHeader;