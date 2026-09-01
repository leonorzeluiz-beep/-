import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DecisionCockpitModule } from './components/dashboard/DecisionCockpitModule';
import { QuotaManagementModule } from './components/quota/QuotaManagementModule';
import { DisplayModelModule } from './components/display/DisplayModelModule';
import { PlanningSimulationModule } from './components/simulation/PlanningSimulationModule';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, toast } = useApp();

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden select-none">
      {/* Sleek Enterprise Dark Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Crisp Top Header */}
        <Header />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && <DecisionCockpitModule />}
            {activeTab === 'quota' && <QuotaManagementModule />}
            {activeTab === 'display' && <DisplayModelModule />}
            {activeTab === 'simulation' && <PlanningSimulationModule />}
          </div>
        </main>
      </div>

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-emerald-800 shadow-emerald-900/10'
                : toast.type === 'warning'
                ? 'bg-white border-amber-300 text-amber-800 shadow-amber-900/10'
                : toast.type === 'error'
                ? 'bg-white border-rose-300 text-rose-800 shadow-rose-900/10'
                : 'bg-white border-blue-300 text-blue-800 shadow-blue-900/10'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
