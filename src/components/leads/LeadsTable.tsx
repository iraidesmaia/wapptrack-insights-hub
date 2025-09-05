import React, { useState, useMemo } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle } from 'lucide-react';
import { Lead } from '@/types';
import LeadRecorrelationDialog from './LeadRecorrelationDialog';
import LeadsTableFilters from './filters/LeadsTableFilters';
import LeadsTableHeader, { SortField, SortDirection } from './table/LeadsTableHeader';
import LeadRow from './table/LeadRow';
import LeadCard from './table/LeadCard';

interface LeadsTableProps {
  leads: Lead[];
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (phone: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const LeadsTable = ({
  leads,
  onView,
  onEdit,
  onDelete,
  onOpenWhatsApp,
  onRefresh,
  isLoading = false
}: LeadsTableProps) => {
  console.log('[LeadsTable] Rendering with', leads.length, 'leads, loading:', isLoading);

  // Recorrelation state
  const [recorrelationLead, setRecorrelationLead] = useState<Lead | null>(null);
  const [isRecorrelationOpen, setIsRecorrelationOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    console.log('[LeadsTable] Filtering and sorting leads');
    
    let filtered = leads.filter(lead => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }

      // Campaign filter
      if (campaignFilter !== 'all' && lead.campaign !== campaignFilter) {
        return false;
      }

      // Date filter
      if (dateFrom || dateTo) {
        const leadDate = new Date(lead.created_at);
        if (dateFrom && leadDate < dateFrom) return false;
        if (dateTo && leadDate > dateTo) return false;
      }

      return true;
    });

    // Sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
            break;
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'campaign':
            aValue = a.campaign?.toLowerCase() || '';
            bValue = b.campaign?.toLowerCase() || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [leads, searchTerm, statusFilter, campaignFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    console.log('[LeadsTable] Sorting by field:', field);
    
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    console.log('[LeadsTable] Clearing all filters');
    setSearchTerm('');
    setStatusFilter('all');
    setCampaignFilter('all');
    setDateFrom(null);
    setDateTo(null);
    setSortField(null);
    setSortDirection(null);
  };

  // Recorrelation handlers
  const handleRecorrelation = (lead: Lead) => {
    console.log('[LeadsTable] Opening recorrelation for lead:', lead.name);
    setRecorrelationLead(lead);
    setIsRecorrelationOpen(true);
  };

  const handleRecorrelationSuccess = () => {
    console.log('[LeadsTable] Recorrelation successful, refreshing data');
    onRefresh();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum lead encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Parece que você ainda não tem leads cadastrados.
        </p>
        <Button onClick={onRefresh} variant="outline">
          Atualizar
        </Button>
      </div>
    );
  }

  // No results after filtering
  if (filteredAndSortedLeads.length === 0) {
    return (
      <div className="space-y-6">
        <LeadsTableFilters
          leads={leads}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          campaignFilter={campaignFilter}
          onCampaignFilterChange={setCampaignFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClearFilters={handleClearFilters}
        />
        
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros para encontrar os leads que procura.
          </p>
          <Button onClick={handleClearFilters} variant="outline">
            Limpar Filtros
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <LeadsTableFilters
        leads={leads}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        campaignFilter={campaignFilter}
        onCampaignFilterChange={setCampaignFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClearFilters={handleClearFilters}
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedLeads.length} de {leads.length} leads
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <LeadsTableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <TableBody>
              {filteredAndSortedLeads.map(lead => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenWhatsApp={onOpenWhatsApp}
                  onRecorrelation={handleRecorrelation}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenWhatsApp={onOpenWhatsApp}
          />
        ))}
      </div>

      {/* Recorrelation Dialog */}
      <LeadRecorrelationDialog 
        lead={recorrelationLead} 
        isOpen={isRecorrelationOpen} 
        onClose={() => {
          setIsRecorrelationOpen(false);
          setRecorrelationLead(null);
        }} 
        onSuccess={handleRecorrelationSuccess} 
      />
    </div>
  );
};

export default LeadsTable;