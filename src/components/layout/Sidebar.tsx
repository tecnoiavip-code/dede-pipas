import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, TrendingUp, Megaphone, Settings, Download } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { cn } from '../../lib/utils';
import { Kite } from '../Kite';

export function Sidebar() {
  const { activeTab, setActiveTab, deferredPrompt, handleInstallApp } = useStore();

  return (
    <aside className="fixed bottom-0 w-full md:relative md:w-64 bg-sky-700 text-white flex flex-row md:flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-xl z-50 md:z-20 flex-shrink-0">
      <div className="hidden md:flex p-6 items-center gap-3 border-b border-sky-600/50">
        <div className="bg-white p-2 rounded-xl shadow-inner">
          <Kite className="text-sky-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">Dedé Pipas</h1>
          <p className="text-sky-200 text-xs uppercase tracking-widest font-semibold">Gestão Profissional</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-row md:flex-col p-2 md:p-4 gap-1 md:space-y-2 overflow-x-auto md:overflow-visible no-scrollbar">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
            activeTab === 'dashboard' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
          )}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] md:text-base">Painel</span>
        </button>
        <button 
          onClick={() => setActiveTab('pos')}
          className={cn(
            "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
            activeTab === 'pos' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
          )}
        >
          <ShoppingCart size={20} />
          <span className="text-[10px] md:text-base">Caixa</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
            activeTab === 'inventory' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
          )}
        >
          <Package size={20} />
          <span className="text-[10px] md:text-base">Estoque</span>
        </button>
        <button 
          onClick={() => setActiveTab('finance')}
          className={cn(
            "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
            activeTab === 'finance' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
          )}
        >
          <TrendingUp size={20} />
          <span className="text-[10px] md:text-base">Finanças</span>
        </button>
        <button 
          onClick={() => setActiveTab('marketing')}
          className={cn(
            "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
            activeTab === 'marketing' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
          )}
        >
          <Megaphone size={20} />
          <span className="text-[10px] md:text-base">Mkt</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "md:hidden flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[72px]",
            activeTab === 'settings' ? "bg-white/20 text-white shadow-sm font-bold" : "hover:bg-sky-600/50 text-sky-200"
          )}
        >
          <Settings size={20} />
          <span className="text-[10px]">Config</span>
        </button>
      </nav>

      <div className="hidden md:block p-4 border-t border-sky-600/50">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            activeTab === 'settings' ? "bg-white text-sky-700 shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-100"
          )}
        >
          <Settings size={20} />
          Configurações
        </button>

        {deferredPrompt && (
          <button 
            onClick={handleInstallApp}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-lg font-bold hover:bg-emerald-600 transition-all animate-bounce"
          >
            <Download size={20} />
            Instalar App
          </button>
        )}
      </div>
    </aside>
  );
}
