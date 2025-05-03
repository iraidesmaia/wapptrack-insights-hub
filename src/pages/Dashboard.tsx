
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, MessageSquare, DollarSign } from 'lucide-react';
import { getDashboardStats, getCampaignPerformance } from '@/services/dataService';
import { DashboardStats, CampaignPerformance } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dashboardStats, campaignData] = await Promise.all([
          getDashboardStats(),
          getCampaignPerformance()
        ]);
        setStats(dashboardStats);
        setCampaignPerformance(campaignData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate random sample data for the timeline chart
  const generateTimelineData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: Math.floor(Math.random() * 10) + 1,
        sales: Math.floor(Math.random() * 5),
      });
    }
    
    return data;
  };

  const timelineData = generateTimelineData();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe os resultados de suas campanhas de WhatsApp.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Leads Hoje"
              value={stats?.todaysLeads || 0}
              icon={Users}
              iconColor="#10B981"
            />
            <StatCard
              title="Vendas Confirmadas"
              value={stats?.confirmedSales || 0}
              icon={DollarSign}
              iconColor="#10B981"
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
              <CardDescription>Leads e vendas nos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={timelineData}
                xAxisDataKey="date"
                lines={[
                  { dataKey: 'leads', color: '#10B981', name: 'Leads' },
                  { dataKey: 'sales', color: '#F59E0B', name: 'Vendas' }
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
