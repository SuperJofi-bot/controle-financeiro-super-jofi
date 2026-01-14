
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { DashboardData } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: string;
}> = ({ title, value, icon, trend, trendUp, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${color}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardData>({
    totalFuncionarios: 0,
    pontosHoje: 0,
    ausentesHoje: 0,
    horasExtrasMes: 0,
    horasNegativasMes: 0,
    solicitacoesPendentes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealMetrics();
  }, []);

  const fetchRealMetrics = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Total de Funcionários Ativos
      const { count: totalUsers } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // 2. Pontos batidos hoje
      const { count: pointsToday } = await supabase
        .from('pontos')
        .select('*', { count: 'exact', head: true })
        .gte('data_hora', today.toISOString());

      // 3. Solicitações Pendentes
      const { count: pendingRequests } = await supabase
        .from('solicitacoes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      setMetrics({
        totalFuncionarios: totalUsers || 0,
        pontosHoje: pointsToday || 0,
        ausentesHoje: Math.max(0, (totalUsers || 0) - (pointsToday || 0)),
        horasExtrasMes: 12, // Exemplo simulado pois depende de cálculo complexo de interval
        horasNegativasMes: 5,
        solicitacoesPendentes: pendingRequests || 0
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-2xl"></div>
    </div>
  );

  const chartData = [
    { name: 'Seg', horas: 84 }, { name: 'Ter', horas: 86 },
    { name: 'Qua', horas: 83 }, { name: 'Qui', horas: 88 },
    { name: 'Sex', horas: 81 }, { name: 'Sáb', horas: 12 },
    { name: 'Dom', horas: 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Colaboradores" value={metrics.totalFuncionarios} icon={<Users size={24} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Presença Hoje" value={metrics.pontosHoje} icon={<CheckCircle2 size={24} className="text-emerald-600" />} color="bg-emerald-50" trend="Real-time" trendUp />
        <StatCard title="Ausentes" value={metrics.ausentesHoje} icon={<AlertCircle size={24} className="text-amber-600" />} color="bg-amber-50" />
        <StatCard title="Solicitações" value={metrics.solicitacoesPendentes} icon={<Clock size={24} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Extras (Mês)" value={`${metrics.horasExtrasMes}h`} icon={<TrendingUp size={24} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Débitos (Mês)" value={`${metrics.horasNegativasMes}h`} icon={<TrendingDown size={24} className="text-rose-600" />} color="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-800 mb-8">Volume de Registros Semanal</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="horas" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHoras)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Status da Equipe</h3>
          <div className="space-y-6">
            <StatusItem label="Em Atividade" count={metrics.pontosHoje} color="bg-emerald-500" subtext="Registros hoje" />
            <StatusItem label="Pendentes" count={metrics.solicitacoesPendentes} color="bg-amber-500" subtext="Aguardando aprovação" />
            <StatusItem label="Total Base" count={metrics.totalFuncionarios} color="bg-indigo-500" subtext="Funcionários ativos" />
          </div>
          <button onClick={fetchRealMetrics} className="w-full mt-10 py-3 bg-slate-50 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-sm">
            Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusItem: React.FC<{ label: string, count: number, color: string, subtext: string }> = ({ label, count, color, subtext }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-10 ${color} rounded-full`}></div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{subtext}</p>
      </div>
    </div>
    <p className="text-lg font-bold text-slate-800">{count}</p>
  </div>
);

export default Dashboard;
