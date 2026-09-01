import React from 'react';
import { useApp, NavTab } from '../../context/AppContext';
import { 
  BarChart3, 
  Layers, 
  SlidersHorizontal, 
  PieChart, 
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    planningPeriod,
    simulationResult,
    scenarios,
    activeScenarioId,
    applyAutoBalance
  } = useApp();

  const isExceeded = simulationResult.summary.exceededProvincesCount > 0;
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { 
      id: 'dashboard', 
      label: '决策数据看板', 
      icon: <BarChart3 className="w-4 h-4" /> 
    },
    { 
      id: 'quota', 
      label: '样机额度管控', 
      icon: <PieChart className="w-4 h-4" />,
      badge: isExceeded ? `${simulationResult.summary.exceededProvincesCount}省超额` : '受控',
      badgeColor: isExceeded ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    { 
      id: 'display', 
      label: '阵地陈列模型', 
      icon: <Layers className="w-4 h-4" /> 
    },
    { 
      id: 'simulation', 
      label: '规划试算中心', 
      icon: <SlidersHorizontal className="w-4 h-4" />,
      badge: `${(simulationResult.summary.totalPlannedUnits / 1000).toFixed(1)}k台`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30">
            P
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-sm flex items-center gap-1.5">
              <span>样机资源规划系统</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] text-slate-400 font-mono">v3.2 Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          核心业务模块
        </div>

        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}>
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                    item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Current Active Scenario Badge */}
        <div className="pt-4 px-1">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">当前试算方案</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                {activeScenario.tag}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 truncate">
              {activeScenario.name}
            </p>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span>全国门店: {simulationResult.summary.totalStoresCovered.toLocaleString()}家</span>
              <span className={isExceeded ? 'text-rose-400' : 'text-emerald-400'}>
                {simulationResult.summary.quotaUtilizationRate}% Cap
              </span>
            </div>
          </div>
        </div>

        {isExceeded && (
          <div className="pt-2 px-1">
            <button
              onClick={applyAutoBalance}
              className="w-full py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>一键智能配平 (Auto-Balance)</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-800/90 space-y-2">
        <div className="p-3 bg-slate-800/40 rounded-xl text-xs border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">规划周期</span>
            <span className="text-slate-200 font-medium font-mono">
              {planningPeriod === '2026_Q3_LAUNCH' ? '2026 Q3 首销' : planningPeriod === '2026_Q4_PROMO' ? '2026 Q4 大促' : '2026 全年'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">系统状态</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              在线协同良好
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
