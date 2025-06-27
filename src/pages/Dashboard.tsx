
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Users, MessageSquare, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { getDashboardStatsByPeriod, getCampaignPerformance, getTimelineData } from '@/services/dataService';
import { DashboardStats, CampaignPerformance, DateRange, TimelineDataPoint } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize date range to last 7 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    // Normalize dates (remove time component)
    const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    console.log('🎯 Dashboard - Initial date range:', {
      start: normalizedStart.toISOString(),
      end: normalizedEnd.toISOString()
    });
    
    return { startDate: normalizedStart, endDate: normalizedEnd };
  });

  useEffect(() => {
    console.log('🔄 Dashboard - useEffect triggered, dateRange changed:', dateRange);
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Dashboard - Fetching data for period:', {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString()
      });
      
      const [dashboardStats, campaignData, timeline] = await Promise.all([
        getDashboardStatsByPeriod(dateRange.startDate, dateRange.endDate),
        getCampaignPerformance(),
        getTimelineData(dateRange.startDate, dateRange.endDate)
      ]);
      
      console.log('✅ Dashboard - Data fetched successfully:', {
        stats: dashboardStats,
        campaigns: campaignData.length,
        timelinePoints: timeline.length
      });
      
      setStats(dashboardStats);
      setCampaignPerformance(campaignData);
      setTimelineData(timeline);
    } catch (error) {
      console.error('❌ Dashboard - Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (newRange: DateRange) => {
    console.log('📅 Dashboard - Date range changed:', {
      old: dateRange,
      new: newRange
    });
    setDateRange(newRange);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe os resultados de suas campanhas de WhatsApp.
          </p>
        </div>

        <DateRangeFilter 
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Leads do Período"
              value={stats?.totalLeads || 0}
              icon={Users}
              iconColor="#10B981"
            />
            <StatCard
              title="Leads do Mês"
              value={stats?.monthlyLeads || 0}
              icon={Calendar}
              iconColor="#10B981"
              trend={stats?.monthlyLeadsTrend}
            />
            <StatCard
              title="Vendas Confirmadas"
              value={stats?.confirmedSales || 0}
              icon={DollarSign}
              iconColor="#10B981"
            />
            <StatCard
              title="Faturamento do Mês"
              value={formatCurrency(stats?.monthlyRevenue || 0)}
              icon={TrendingUp}
              iconColor="#F59E0B"
              trend={stats?.monthlyRevenueTrend}
            />
            <StatCard
              title="Conversas Pendentes"
              value={stats?.pendingConversations || 0}
              icon={MessageSquare}
              iconColor="#F59E0B"
            />
            <StatCard
              title="Taxa de Conversão"
              value={formatPercent(stats?.conversionRate || 0)}
              icon={LayoutDashboard}
              iconColor="#10B981"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Desempenho no Tempo</CardTitle>
              <CardDescription>Leads, vendas e faturamento no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={timelineData}
                xAxisDataKey="date"
                lines={[
                  { dataKey: 'leads', color: '#10B981', name: 'Leads' },
                  { dataKey: 'sales', color: '#F59E0B', name: 'Vendas' },
                  { dataKey: 'revenue', color: '#8B5CF6', name: 'Faturamento' }
                ]}
                height={300}
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Conversão por Campanha</CardTitle>
              <CardDescription>
                Taxa de conversão para cada campanha ativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={campaignPerformance}
                dataKey="conversionRate"
                nameKey="campaignName"
                formatter={formatPercent}
                barColor="#10B981"
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Receita por Campanha</CardTitle>
              <CardDescription>
                Total de receita gerada para cada campanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={campaignPerformance}
                dataKey="revenue"
                nameKey="campaignName"
                formatter={formatCurrency}
                barColor="#F59E0B"
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho de Campanhas</CardTitle>
            <CardDescription>
              Visão detalhada de todas as campanhas ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-wrapper">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="p-3 font-medium">Campanha</th>
                    <th className="p-3 font-medium text-right">Leads</th>
                    <th className="p-3 font-medium text-right">Vendas</th>
                    <th className="p-3 font-medium text-right">Receita</th>
                    <th className="p-3 font-medium text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignPerformance.map((campaign) => (
                    <tr key={campaign.campaignId} className="border-t">
                      <td className="p-3">{campaign.campaignName}</td>
                      <td className="p-3 text-right">{campaign.leads}</td>
                      <td className="p-3 text-right">{campaign.sales}</td>
                      <td className="p-3 text-right">{formatCurrency(campaign.revenue)}</td>
                      <td className="p-3 text-right">{formatPercent(campaign.conversionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
