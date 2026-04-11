import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Banknote, CreditCard, QrCode, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../contexts/StoreContext';

export function Dashboard() {
  const { stats, chartData, sales, setActiveTab } = useStore();

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-sky-500">
          <p className="text-slate-500 text-sm font-medium mb-1">Vendas Hoje</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {stats.todayRevenue.toFixed(2)}</h3>
          <p className="text-xs text-sky-600 mt-2 font-semibold">{stats.todaySalesCount} transações</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <p className="text-slate-500 text-sm font-medium mb-1">Lucro Total</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {stats.totalProfit.toFixed(2)}</h3>
          <p className="text-xs text-emerald-600 mt-2 font-semibold">Margem saudável</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-pipa-orange">
          <p className="text-slate-500 text-sm font-medium mb-1">Faturamento Total</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {stats.totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-pipa-orange mt-2 font-semibold">Acumulado</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-sm font-medium mb-1">Alertas de Estoque</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.lowStockCount}</h3>
          <p className="text-xs text-amber-600 mt-2 font-semibold">Reposição necessária</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-slate-800 text-lg">Desempenho Semanal</h4>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-sky-500"></div> Vendas</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Lucro</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="vendas" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h4 className="font-bold text-slate-800 text-lg mb-8">Últimas Vendas</h4>
          <div className="space-y-6">
            {sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                    {sale.paymentMethod === 'dinheiro' && <Banknote size={18} />}
                    {(sale.paymentMethod === 'cartao_credito' || sale.paymentMethod === 'cartao_debito') && <CreditCard size={18} />}
                    {sale.paymentMethod === 'pix' && <QrCode size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">R$ {sale.total.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{format(sale.timestamp, 'HH:mm')} • {sale.items.length} itens</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-400 transition-colors" />
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">Nenhuma venda hoje</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab('finance')}
            className="w-full mt-8 py-3 text-sky-600 text-sm font-bold hover:bg-sky-50 rounded-xl transition-colors"
          >
            Ver todo histórico
          </button>
        </div>
      </div>
    </div>
  );
}
