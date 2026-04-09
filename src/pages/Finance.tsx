import React from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { useStore } from '../contexts/StoreContext';
import { cn } from '../lib/utils';

export function Finance() {
  const { reportPeriod, setReportPeriod, customDateRange, setCustomDateRange, handleExportSpreadsheet, reportData } = useStore();

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold text-slate-800">Relatórios Financeiros</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setReportPeriod('week')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                reportPeriod === 'week' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Semana
            </button>
            <button 
              onClick={() => setReportPeriod('month')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                reportPeriod === 'month' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Mês
            </button>
            <button 
              onClick={() => setReportPeriod('year')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                reportPeriod === 'year' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Ano
            </button>
            <button 
              onClick={() => setReportPeriod('custom')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                reportPeriod === 'custom' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Personalizado
            </button>
          </div>
          <button 
            onClick={handleExportSpreadsheet}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Download size={16} />
            Exportar Planilha
          </button>
        </div>
      </div>

      {reportPeriod === 'custom' && (
        <div className="glass-card p-6 flex flex-wrap items-end gap-6 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Inicial</label>
            <input 
              type="date" 
              value={customDateRange.start}
              onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Final</label>
            <input 
              type="date" 
              value={customDateRange.end}
              onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
            />
          </div>
        </div>
      )}

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-sky-500">
          <p className="text-slate-500 text-sm font-medium mb-1">Vendas no Período</p>
          <h3 className="text-2xl font-bold text-slate-800">{reportData.count}</h3>
          <p className="text-xs text-sky-600 mt-2 font-semibold">Transações realizadas</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <p className="text-slate-500 text-sm font-medium mb-1">Faturamento no Período</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {reportData.totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-emerald-600 mt-2 font-semibold">Receita bruta</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-sm font-medium mb-1">Lucro no Período</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {reportData.totalProfit.toFixed(2)}</h3>
          <p className="text-xs text-amber-600 mt-2 font-semibold">Resultado líquido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h4 className="font-bold text-slate-800 text-lg mb-8">Desempenho de Vendas</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="vendas" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h4 className="font-bold text-slate-800 text-lg mb-8">Fluxo de Caixa</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="vendas" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-8">
          <h4 className="font-bold text-slate-800 text-lg mb-8">Vendas Detalhadas</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Data</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Itens</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Pagamento</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Total</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {reportData.sales.map((sale: any) => (
                  <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">{format(sale.timestamp, 'dd/MM/yyyy HH:mm')}</td>
                    <td className="p-4 text-sm text-slate-600">{sale.items.length} itens</td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">R$ {sale.total.toFixed(2)}</td>
                    <td className="p-4 font-bold text-emerald-600">R$ {sale.profit.toFixed(2)}</td>
                  </tr>
                ))}
                {reportData.sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">Nenhuma venda encontrada para este período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
