import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, TrendingUp, Megaphone, Settings, Download } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { cn } from '../../lib/utils';
import { Kite } from '../Kite';

export function Sidebar() {
  const { activeTab, setActiveTab, deferredPrompt, handleInstallApp } = useStore();

  const NavItem = ({ id, icon: Icon, label, hiddenMd = false }: { id: string, icon: any, label: string, hiddenMd?: boolean }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id as any)}
        className={cn(
          "group relative flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 py-1.5 px-0 md:px-6 md:py-3.5 transition-all duration-300 md:my-0.5",
          "md:rounded-r-full rounded-2xl md:rounded-l-none outline-none",
          isActive 
            ? "text-sky-400 md:bg-sky-500/10 md:before:absolute md:before:left-0 md:before:top-0 md:before:h-full md:before:w-1 md:before:bg-sky-400 md:before:shadow-[0_0_10px_rgba(56,189,248,0.5)] md:before:rounded-r-full" 
            : "text-slate-500 md:text-slate-400 md:hover:bg-slate-800/50 hover:text-slate-200",
          hiddenMd && "md:hidden"
        )}
      >
        <div className={cn("relative transition-transform duration-300 group-hover:scale-110", isActive && "md:scale-110 text-sky-400")}>
          <Icon className="w-6 h-6 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
          {isActive && <div className="absolute -bottom-2 md:hidden left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,1)]" />}
        </div>
        <span className={cn(
            "text-[13px] md:text-[17px] tracking-wide mt-1 md:mt-0 transition-colors", 
            isActive ? "font-bold text-sky-400 md:text-sky-400" : "font-medium text-slate-500 md:text-slate-400 group-hover:text-slate-200"
        )}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <aside className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-900 md:bg-[#0B1120] text-slate-300 flex flex-row md:flex-col shadow-[0_-8px_20px_-1px_rgba(0,0,0,0.1)] md:shadow-2xl z-[60] md:z-20 flex-shrink-0 md:border-r border-slate-800/80 backdrop-blur-xl md:backdrop-blur-none bg-opacity-95 md:bg-opacity-100">
      <div className="hidden md:flex p-6 mt-2 items-center gap-4 border-b border-slate-800/50">
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/20">
          <Kite className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">
            Dedé Pipas
          </h1>
          <p className="text-sky-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">Gestão PRO</p>
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-row justify-around md:justify-start md:flex-col py-1 px-1 md:px-0 md:py-6 gap-0 md:gap-1">
        <NavItem id="dashboard" icon={LayoutDashboard} label="Painel" />
        <NavItem id="pos" icon={ShoppingCart} label="Caixa" />
        <NavItem id="inventory" icon={Package} label="Estoque" />
        <NavItem id="finance" icon={TrendingUp} label="Finanças" />
        <NavItem id="marketing" icon={Megaphone} label="Mkt" />
      </nav>

      <div className="hidden md:flex flex-col gap-3 p-6 border-t border-slate-800/50">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300",
            activeTab === 'settings' 
              ? "bg-slate-800 text-sky-400 shadow-inner font-bold ring-1 ring-slate-700" 
              : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
          )}
        >
          <Settings size={24} className={cn("transition-transform duration-500", activeTab === 'settings' ? "rotate-90 text-sky-400" : "group-hover:rotate-90")} />
          <span className="text-[17px] font-medium transition-colors">Configurações</span>
        </button>

        {deferredPrompt && (
          <button 
            onClick={handleInstallApp}
            className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)] font-bold hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:-translate-y-0.5 transition-all"
          >
            <Download size={22} className="group-hover:translate-y-1 transition-transform duration-300" />
            <span className="text-[17px]">Instalar App</span>
          </button>
        )}
      </div>
    </aside>
  );
}
