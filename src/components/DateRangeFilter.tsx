
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from '@/types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7);
  
  const lastMonthStart = new Date(today);
  lastMonthStart.setMonth(today.getMonth() - 1);
  
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const presetRanges = [
    {
      label: 'Hoje',
      range: { 
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()), 
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()) 
      }
    },
    {
      label: 'Ontem',
      range: { 
        startDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()), 
        endDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()) 
      }
    },
    {
      label: 'Últimos 7 dias',
      range: { 
        startDate: new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate()), 
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()) 
      }
    },
    {
      label: 'Este mês',
      range: { 
        startDate: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), currentMonthStart.getDate()), 
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()) 
      }
    },
    {
      label: 'Últimos 30 dias',
      range: { 
        startDate: new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), lastMonthStart.getDate()), 
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()) 
      }
    }
  ];

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    console.log('🎯 DateRangeFilter - Selected preset:', preset.label, preset.range);
    onDateRangeChange(preset.range);
  };

  const handleDateSelect = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (!date) return;
    
    const newRange = { ...dateRange, [field]: date };
    console.log('📅 DateRangeFilter - Manual date selection:', { field, date, newRange });
    onDateRangeChange(newRange);
  };

  // Normalize dates for comparison (remove time component)
  const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const isPresetActive = (preset: typeof presetRanges[0]) => {
    const normalizedCurrentStart = normalizeDate(dateRange.startDate);
    const normalizedCurrentEnd = normalizeDate(dateRange.endDate);
    const normalizedPresetStart = normalizeDate(preset.range.startDate);
    const normalizedPresetEnd = normalizeDate(preset.range.endDate);
    
    return normalizedCurrentStart.getTime() === normalizedPresetStart.getTime() &&
           normalizedCurrentEnd.getTime() === normalizedPresetEnd.getTime();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Período:</span>
          
          {presetRanges.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "h-8",
                isPresetActive(preset)
                  ? "bg-primary text-primary-foreground"
                  : ""
              )}
            >
              {preset.label}
            </Button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.startDate, 'dd/MM', { locale: ptBR })} - {format(dateRange.endDate, 'dd/MM', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Data início:</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.startDate}
                      onSelect={(date) => handleDateSelect('startDate', date)}
                      className={cn("pointer-events-auto")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data fim:</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.endDate}
                      onSelect={(date) => handleDateSelect('endDate', date)}
                      className={cn("pointer-events-auto")}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
