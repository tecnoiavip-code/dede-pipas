import React from 'react';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Modals } from './components/Modals';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { Marketing } from './pages/Marketing';
import { Settings } from './pages/Settings';

function AppContent() {
  const { activeTab } = useStore();

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-slate-50 overflow-hidden font-sans antialiased text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'pos' && <POS />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'finance' && <Finance />}
          {activeTab === 'marketing' && <Marketing />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      <Modals />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
