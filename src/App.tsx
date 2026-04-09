import React from 'react';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { Marketing } from './pages/Marketing';
import { Settings } from './pages/Settings';
import { Modals } from './components/Modals';

function AppContent() {
  const { activeTab, isAuthReady } = useStore();

  if (!isAuthReady) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col md:flex-row bg-slate-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden pb-[88px] md:pb-0 relative">
          <Header />
          <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'pos' && <POS />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'finance' && <Finance />}
            {activeTab === 'marketing' && <Marketing />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
        <Modals />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
