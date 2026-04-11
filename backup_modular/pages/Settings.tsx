import React from 'react';
import { AlertTriangle, Download, ShieldCheck, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../contexts/StoreContext';
import { cn } from '../lib/utils';
import { Kite } from '../components/Kite';

export function Settings() {
  const { settings, setSettings, seedDatabase, products, sales, transactions, connectionStatus, debugInfo } = useStore();

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">Configurações</h3>
        <div className="flex gap-2">
          <button 
            onClick={seedDatabase}
            className="text-sky-600 text-sm font-bold hover:bg-sky-50 px-4 py-2 rounded-xl transition-all border border-sky-100"
          >
            Popular Banco (Seed)
          </button>
          <button 
            onClick={() => {
              if(confirm('Deseja realmente resetar todos os dados? Esta ação não pode ser desfeita.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-rose-600 text-sm font-bold hover:bg-rose-50 px-4 py-2 rounded-xl transition-all"
          >
            Resetar Sistema
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-8 space-y-6">
            <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Informações da Loja</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nome da Loja</label>
                <input 
                  type="text" 
                  value={settings.storeName}
                  onChange={e => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nome do Proprietário</label>
                <input 
                  type="text" 
                  value={settings.ownerName}
                  onChange={e => setSettings(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">Endereço</label>
                <input 
                  type="text" 
                  value={settings.address}
                  onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={settings.phone}
                  onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Pagamentos & PIX</h4>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                <div>
                  <p className="font-bold text-sky-900">Ativar QR Code PIX no Checkout</p>
                  <p className="text-xs text-sky-700">Mostra o QR Code automaticamente ao selecionar PIX</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, enablePixQR: !prev.enablePixQR }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    settings.enablePixQR ? "bg-sky-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    settings.enablePixQR ? "left-7" : "left-1"
                  )}></div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Chave PIX</label>
                  <input 
                    type="text" 
                    placeholder="Sua chave PIX aqui"
                    value={settings.pixKey}
                    onChange={e => setSettings(prev => ({ ...prev, pixKey: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nome do Beneficiário</label>
                  <input 
                    type="text" 
                    placeholder="Ex: JOSE DA SILVA"
                    value={settings.pixName}
                    onChange={e => setSettings(prev => ({ ...prev, pixName: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Cidade (Sem acentos)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: SAO PAULO"
                    value={settings.pixCity}
                    onChange={e => setSettings(prev => ({ ...prev, pixCity: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Atenção:</strong> Esta integração gera um QR Code estático. A confirmação do pagamento deve ser feita manualmente conferindo o saldo no seu banco. Integrações automáticas (API) requerem um servidor backend.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Preferências</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800">Notificações de Estoque</p>
                  <p className="text-xs text-slate-500">Avisar quando itens estiverem acabando</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    settings.notifications ? "bg-sky-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    settings.notifications ? "left-7" : "left-1"
                  )}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800">Modo Escuro (Beta)</p>
                  <p className="text-xs text-slate-500">Alterar aparência do sistema</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    settings.darkMode ? "bg-sky-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    settings.darkMode ? "left-7" : "left-1"
                  )}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 bg-sky-700 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Kite className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg mb-2">Plano Profissional</h4>
            <p className="text-sky-100 text-sm mb-4">
              Você está utilizando a versão completa do sistema Dedé Pipas.
            </p>
            <div className="text-xs font-bold bg-white/10 p-3 rounded-xl">
              Versão: 2.4.0-stable
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h4 className="font-bold text-slate-800">Backup de Dados</h4>
            <p className="text-xs text-slate-500">
              Seus dados são salvos automaticamente neste navegador. Para segurança extra, exporte seu banco de dados.
            </p>
            <button 
              onClick={() => {
                const data = { products, sales, transactions, settings };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_dede_pipas_${format(new Date(), 'yyyy-MM-dd')}.json`;
                a.click();
              }}
              className="w-full py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Exportar JSON
            </button>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-sky-500">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800">Status do Firebase</h4>
              <div className={cn(
                "w-3 h-3 rounded-full",
                connectionStatus === 'connected' ? "bg-emerald-500" :
                connectionStatus === 'error' ? "bg-rose-500" : "bg-slate-300 animate-pulse"
              )}></div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Projeto ID</p>
                <p className="text-sm font-mono text-slate-700 truncate">{debugInfo?.projectId}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">API Key (Mascarada)</p>
                <p className="text-sm font-mono text-slate-700">{debugInfo?.apiKeyMasked}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Ambiente</p>
                <p className="text-sm text-slate-700 flex items-center gap-2">
                  {debugInfo?.isProd ? (
                    <><ShieldCheck size={14} className="text-emerald-600" /> Produção (Vercel)</>
                  ) : (
                    <><Edit2 size={14} className="text-amber-600" /> Desenvolvimento (Preview)</>
                  )}
                </p>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-all"
            >
              Testar Conexão Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
