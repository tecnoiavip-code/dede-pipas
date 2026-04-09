import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { cn } from '../../lib/utils';

export function Header() {
  const { activeTab, connectionStatus, stats } = useStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="text-slate-500 font-medium capitalize">
          {activeTab === 'dashboard' && 'Painel Administrativo'}
          {activeTab === 'pos' && 'Caixa Aberto'}
          {activeTab === 'inventory' && 'Controle de Estoque'}
          {activeTab === 'finance' && 'Relatórios Financeiros'}
          {activeTab === 'marketing' && 'Marketing & Redes Sociais'}
          {activeTab === 'settings' && 'Configurações do Sistema'}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
          connectionStatus === 'connected' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
          connectionStatus === 'error' ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" :
          "bg-slate-50 text-slate-400 border border-slate-100"
        )}>
          {connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">
            {connectionStatus === 'connected' ? 'Online' : connectionStatus === 'error' ? 'Erro' : '...'}
          </span>
        </div>
        {stats.lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium border border-amber-100">
            <AlertTriangle size={16} />
            <span className="hidden md:inline">{stats.lowStockCount} itens com estoque baixo</span>
            <span className="md:hidden">{stats.lowStockCount}</span>
          </div>
        )}
        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border-2 border-white shadow-sm">
          DP
        </div>
      </div>
    </header>
  );
}
