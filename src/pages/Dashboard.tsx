
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, getCampaignPerformance, getTimelineData } from '@/services/dataService';
import { DashboardStats, CampaignPerformance, TimelineDataPoint } from '@/types';
import StatCard from '@/components/StatCard';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { Users, UserCheck, TrendingUp, DollarSign, Target, MessageCircle, Calendar, Award } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

const Dashboard = () => {
  const { activeProject } = useProject();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalSales: 0,
    conversionRate: 0,
    totalRevenue: 0,
    todaysLeads: 0,
    confirmedSales: 0,
    pendingConversations: 0,
    monthlyLeads: 0,
    monthlyRevenue: 0
  });
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Dashboard - Carregando dados para projeto:', activeProject?.id);
      
      // 🎯 Passar o ID do projeto ativo para todas as consultas
      const [statsData, campaignData, timelineData] = await Promise.all([
        getDashboardStats(activeProject?.id),
        getCampaignPerformance(activeProject?.id),
        getTimelineData(30, activeProject?.id)
      ]);
      
      console.log('✅ Dashboard - Dados carregados:', {
        projectId: activeProject?.id,
        projectName: activeProject?.name,
        stats: statsData,
        campaigns: campaignData.length,
        timeline: timelineData.length
      });
      
      setStats(statsData);
      setCampaignPerformance(campaignData);
      setTimelineData(timelineData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject?.id]); // 🎯 Recarregar quando o projeto ativo mudar

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do seu negócio
              {activeProject && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Projeto: {activeProject.name}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Leads"
            value={stats.totalLeads}
            icon={Users}
            trend={stats.monthlyLeadsTrend}
          />
          <StatCard
            title="Vendas Realizadas"
            value={stats.totalSales}
            icon={UserCheck}
            trend={stats.monthlyRevenueTrend}
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={TrendingUp}
          />
          <StatCard
            title="Faturamento Total"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            trend={stats.monthlyRevenueTrend}
          />
        </div>

        {/* Today's Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Hoje</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmedSales}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas Pendentes</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingConversations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyLeads} leads este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignPerformance.length > 0 ? (
                <BarChart
                  data={campaignPerformance.map(cp => ({
                    name: cp.campaignName,
                    leads: cp.leads,
                    sales: cp.sales,
                    revenue: cp.revenue
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum dado de campanha disponível
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal (30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <LineChart
                  data={timelineData.map(td => ({
                    name: new Date(td.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    leads: td.leads,
                    sales: td.sales,
                    revenue: td.revenue
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum dado temporal disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
