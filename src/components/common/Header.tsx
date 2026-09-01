import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Download, 
  RotateCcw, 
  Calendar, 
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  User,
  SlidersHorizontal,
  Layers,
  PieChart,
  BarChart3
} from 'lucide-react';
import { exportRowsToCsv } from '../../utils/calculator';

export const Header: React.FC = () => {
  const {
    activeTab,
    planningPeriod,
    setPlanningPeriod,
    simulationResult,
    applyAutoBalance,
    resetToDefaults,
    showToast
  } = useApp();

  const isExceeded = simulationResult.summary.exceededProvincesCount > 0;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return '决策数据看板';
      case 'quota': return '样机额度管控';
      case 'display': return '阵地陈列模型';
      case 'simulation': return '规划试算中心';
      default: return '数据概览看板';
    }
  };

  const handleExport = () => {
    exportRowsToCsv(simulationResult.rows, `样机规划试算表_${planningPeriod}_${Date.now()}.csv`);
    showToast('已成功导出规划试算明细报表 (CSV)');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 z-20 shadow-xs">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-normal">系统首页</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{getTabTitle()}</span>
        <span className="ml-2 hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          全国覆盖 {simulationResult.summary.totalStoresCovered.toLocaleString()} 家门店
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Planning Period Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            aria-label="规划周期选择"
            value={planningPeriod}
            onChange={e => {
              setPlanningPeriod(e.target.value);
              showToast(`已切换规划周期至：${e.target.selectedOptions[0]?.text || e.target.value}`);
            }}
            className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value="2026_Q3_LAUNCH">2026 Q3 新品首销季 (Mate 70/X6)</option>
            <option value="2026_Q4_PROMO">2026 Q4 年终双十一全场景大促</option>
            <option value="2026_FULL_YEAR">2026 年度常态零售样机运营</option>
          </select>
        </div>

        {/* Action Buttons */}
        {isExceeded && (
          <button
            onClick={applyAutoBalance}
            title="自动将超额省份配平至额度红线内"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>一键智能配平</span>
          </button>
        )}

        <button
          onClick={handleExport}
          title="导出当前试算规划明细报表"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>导出报表</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm('确定要恢复所有样机额度、陈列模型与试算因子的初始默认配置吗？')) {
              resetToDefaults();
            }
          }}
          title="重置为初始配置"
          className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* User Profile Avatar */}
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-600 font-semibold text-xs">
            OP
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight">
            <div className="font-semibold text-slate-800">运营决策中心</div>
            <div className="text-[10px] text-slate-400">样机管控专员</div>
          </div>
        </div>
      </div>
    </header>
  );
};
