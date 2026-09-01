import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SlidersHorizontal,
  Zap,
  RotateCcw,
  Download,
  Filter,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  TrendingUp,
  Building,
  DollarSign,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
  Info,
  ChevronDown,
  Gauge
} from 'lucide-react';
import { exportRowsToCsv } from '../../utils/calculator';
import { PositionType, ProductCategory, AutoBalanceStrategy } from '../../types';

export const PlanningSimulationModule: React.FC = () => {
  const {
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    currentFactors,
    updateFactor,
    saveAsNewScenario,
    simulationResult,
    manualAdjustments,
    setManualAdjustment,
    resetAllManualAdjustments,
    applyAutoBalance,
    provinces,
    positions,
    products,
    showToast,
    addAuditLog
  } = useApp();

  const { summary } = simulationResult;

  // Filters for the big simulation table
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSlotTypeFilter, setSelectedSlotTypeFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Strategy selection for auto balance
  const [selectedStrategy, setSelectedStrategy] = useState<AutoBalanceStrategy>('mandatory_first');
  const [isStrategyMenuOpen, setIsStrategyMenuOpen] = useState(false);

  // Custom scenario modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');

  // Filter the rows
  const filteredRows = simulationResult.rows.filter(row => {
    if (selectedProvinceFilter !== 'all' && row.provinceId !== selectedProvinceFilter) return false;
    if (selectedPositionFilter !== 'all' && row.positionType !== selectedPositionFilter) return false;
    if (selectedCategoryFilter !== 'all' && row.productCategory !== selectedCategoryFilter) return false;
    if (selectedStatusFilter !== 'all' && row.quotaComplianceStatus !== selectedStatusFilter) return false;
    if (selectedSlotTypeFilter === 'mandatory' && !row.isMandatorySlot) return false;
    if (selectedSlotTypeFilter === 'optional' && row.isMandatorySlot) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        row.provinceName.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        row.positionName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSaveScenarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) {
      showToast('请输入方案名称', 'error');
      return;
    }
    saveAsNewScenario(newScenarioName, newScenarioDesc);
    setIsCustomModalOpen(false);
    setNewScenarioName('');
    setNewScenarioDesc('');
  };

  const handleApplyToExecution = () => {
    addAuditLog('SIMULATION_APPLY', `锁定并正式应用试算方案【${scenarios.find(s => s.id === activeScenarioId)?.name}】作为下发执行基准`);
    showToast('规划试算结果已成功锁定并应用生效！', 'success');
  };

  const handleRunAutoBalance = (strat: AutoBalanceStrategy) => {
    setSelectedStrategy(strat);
    setIsStrategyMenuOpen(false);
    applyAutoBalance(strat);
  };

  const strategyLabels: Record<AutoBalanceStrategy, { title: string; desc: string; badge: string }> = {
    mandatory_first: {
      title: '策略一：必陈机位绝对保底 (推荐)',
      desc: '100%锁死各店必陈机位，仅对轮换可选机位等比压缩至额度红线内',
      badge: '保底最强'
    },
    position_tiered: {
      title: '策略二：阵地场景梯度削减',
      desc: '旗舰/形象店(S/A)足额保障，C级专区与KA连锁深度收敛，强化核心商圈',
      badge: '商圈分级'
    },
    sales_roi: {
      title: '策略三：销售效能产出优先',
      desc: '高坪效省份足额供给，低效区域及长尾品类优先精简，ROI最大化',
      badge: '坪效驱动'
    },
    uniform: {
      title: '策略四：全局等比线性收敛',
      desc: '所有省份与机位按超额比例统一等比线性削减，保持原有结构',
      badge: '全局等比'
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Diagnostic Banner: Display SOP Demand vs Quota Gap */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-5 border-b border-white/10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Scale className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                陈列模型需求 vs 样机额度供需缺口诊断与平衡引擎
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                陈列需求天然大于额度
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              根据零售业务规律，各阵地陈列桌SOP标准铺满理论需求通常远大于总部预算额度。本系统采用<strong>「前置平滑收敛 + 必陈机位刚性保底 + 多策略智能配平」</strong>，实现既不超预算又保核心形象。
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto Balance Multi-Strategy Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsStrategyMenuOpen(!isStrategyMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-current" />
                <span>一键智能配平</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isStrategyMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                    选择配平收敛算法（将超配省份压减至额度红线内）：
                  </div>
                  <div className="space-y-1 mt-1">
                    {(Object.keys(strategyLabels) as AutoBalanceStrategy[]).map(key => {
                      const item = strategyLabels[key];
                      const isCurrent = selectedStrategy === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleRunAutoBalance(key)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex flex-col gap-0.5 ${
                            isCurrent
                              ? 'bg-amber-50/90 text-amber-950 border border-amber-300'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{item.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-white rounded border text-amber-800 font-semibold shadow-2xs">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-blue-300" />
              <span>保存方案</span>
            </button>

            <button
              onClick={() => exportRowsToCsv(simulationResult.rows)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>导出报表</span>
            </button>

            <button
              onClick={handleApplyToExecution}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>锁定生效</span>
            </button>
          </div>
        </div>

        {/* 4 Quantitative Diagnostic Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Diagnostic 1: SOP Theoretical Display Demand */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span>SOP 理论陈列总需求</span>
              <span className="p-1 rounded bg-blue-500/20 text-blue-300"><Layers className="w-3.5 h-3.5" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">
                {summary.theoreticalDisplayDemand.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">台</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-300/90 font-medium">
              相对额度理论超额 +{summary.displayToQuotaGapPercent}%
            </div>
          </div>

          {/* Diagnostic 2: Total HQ Quota Cap */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span>总部样机额度上限红线</span>
              <span className="p-1 rounded bg-amber-500/20 text-amber-300"><DollarSign className="w-3.5 h-3.5" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">
                {summary.totalQuotaCap.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">台</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center gap-1 font-medium">
              <span>当前规划利用率:</span>
              <span className={`font-mono font-bold ${summary.quotaUtilizationRate > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.quotaUtilizationRate}%
              </span>
            </div>
          </div>

          {/* Diagnostic 3: Mandatory Slots Fulfillment */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span>核心新品必陈机位保障率</span>
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {summary.mandatoryFulfillmentRate}%
              </span>
              <span className="text-xs text-slate-400">({summary.mandatoryUnitsPlanned.toLocaleString()}台)</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>S级新品C位与核心桌100%保底</span>
            </div>
          </div>

          {/* Diagnostic 4: Convergence & Final Output */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
              <span>最终试算规划产出台数</span>
              <span className="p-1 rounded bg-purple-500/20 text-purple-300"><Gauge className="w-3.5 h-3.5" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">
                {summary.totalPlannedUnits.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">台</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between font-medium">
              <span>动态收敛压缩率:</span>
              <span className="font-mono text-amber-300 font-bold">-{summary.convergenceCompressionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Scenarios Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>规划测算预设方案库 (Simulation Scenarios)</span>
          </div>
          <span className="text-xs text-slate-400">点击切换方案以快速加载对应的因子配置组合</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {scenarios.map(sc => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setActiveScenarioId(sc.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate mr-2">{sc.name.split('(')[0]}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border shrink-0 ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {sc.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Factor Simulation Parameters Tuning Dashboard */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">核心模型因子微调控制台 (Model Factors)</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">滑动因子即可实时秒级重算全量数据</span>
            {Object.keys(manualAdjustments).length > 0 && (
              <button
                onClick={resetAllManualAdjustments}
                className="text-amber-700 hover:text-amber-800 underline font-semibold text-xs"
              >
                清空全部人工微调 ({Object.keys(manualAdjustments).length}项)
              </button>
            )}
          </div>
        </div>

        {/* 4 Factor Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Group 1: 基础陈列与收敛控制 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>1. 基础陈列与供需收敛</span>
            </div>

            {/* Display Convergence Ratio Slider */}
            <div>
              <div className="flex justify-between text-slate-700 mb-1 font-medium">
                <span>陈列需求收敛/满足率</span>
                <span className="font-mono font-bold text-blue-700">
                  {((currentFactors.displayConvergenceRatio ?? 0.72) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.02"
                value={currentFactors.displayConvergenceRatio ?? 0.72}
                onChange={e => updateFactor('displayConvergenceRatio', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                用于在额度约束前平滑缩小理论SOP需求与预算缺口
              </span>
            </div>

            {/* Mandatory Slot Protection Switch */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-700 font-medium block">必陈机位 100% 刚性保底</span>
                <span className="text-[10px] text-slate-400">收敛与压缩时免削减</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentFactors.mandatorySlotProtection ?? true}
                  onChange={e => updateFactor('mandatorySlotProtection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Group 2: 销售赋能因子 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>2. 销售赋能与效能因子</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1 font-medium">
                <span>历史销量加权系数</span>
                <span className="font-mono font-bold text-emerald-700">
                  {(currentFactors.salesVolumeWeight * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={currentFactors.salesVolumeWeight}
                onChange={e => updateFactor('salesVolumeWeight', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1 font-medium">
                <span>坪效溢价系数 (S/A店)</span>
                <span className="font-mono font-bold text-emerald-700">
                  {currentFactors.salesPerSqmPremium}x
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={currentFactors.salesPerSqmPremium}
                onChange={e => updateFactor('salesPerSqmPremium', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Group 3: 营销策略因子 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-purple-700 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. 营销策略与新品倾斜</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1 font-medium">
                <span>S级新品加成 (Mate 70/X6)</span>
                <span className="font-mono font-bold text-purple-700">
                  {currentFactors.launchTierS_Multiplier}x
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                value={currentFactors.launchTierS_Multiplier}
                onChange={e => updateFactor('launchTierS_Multiplier', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1 font-medium">
                <span>重点城市/核心商圈倾斜</span>
                <span className="font-mono font-bold text-purple-700">
                  +{(currentFactors.strategicCityBoost * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.30"
                step="0.02"
                value={currentFactors.strategicCityBoost}
                onChange={e => updateFactor('strategicCityBoost', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Group 4: 约束边界因子 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>4. 资源约束与红线</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-700 font-medium">强制封顶于省份总额度</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentFactors.enforceQuotaCap}
                  onChange={e => updateFactor('enforceQuotaCap', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1 font-medium">
                <span>损耗与周转备机率</span>
                <span className="font-mono font-bold text-amber-700">
                  +{(currentFactors.lossAndTurnoverBufferPercent * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.10"
                step="0.01"
                value={currentFactors.lossAndTurnoverBufferPercent}
                onChange={e => updateFactor('lossAndTurnoverBufferPercent', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>
          </div>
        </div>

        {/* Calculation Flow Pipeline Diagram */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2 text-slate-500 font-medium">
            <span className="text-blue-700 font-bold">试算推演全流程链路：</span>
            <span className="text-slate-800">SOP标准陈列需求</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800">平滑收敛与必陈机位保底</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800">销售效能/坪效加权</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800">新品S级策略倾斜</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800">省份额度红线校验</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              最终试算台数 (支持人工微调 & 智能配平)
            </span>
          </div>
        </div>
      </div>

      {/* Main Simulation Pivot Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Table Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">试算明细与缺口审计清单 (共 {filteredRows.length} 条)</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="搜索省份 / 产品 / 阵地..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 shadow-xs"
              />
            </div>

            {/* Province Filter */}
            <select
              aria-label="省份筛选"
              value={selectedProvinceFilter}
              onChange={e => setSelectedProvinceFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">所有省份</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Position Filter */}
            <select
              aria-label="阵地类型筛选"
              value={selectedPositionFilter}
              onChange={e => setSelectedPositionFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">所有阵地类型</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Product Category Filter */}
            <select
              aria-label="产品品类筛选"
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">所有品类</option>
              <option value="flagship_phone">旗舰直板手机</option>
              <option value="foldable_phone">折叠屏旗舰</option>
              <option value="tablet">智慧平板</option>
              <option value="pc_laptop">PC笔记本</option>
              <option value="wearable">运动穿戴</option>
              <option value="audio_iot">智能音频</option>
              <option value="smart_screen">智慧大屏</option>
            </select>

            {/* Slot Type Filter */}
            <select
              aria-label="机位属性筛选"
              value={selectedSlotTypeFilter}
              onChange={e => setSelectedSlotTypeFilter(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">全部机位属性</option>
              <option value="mandatory">仅看必陈机位</option>
              <option value="optional">仅看轮换机位</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="合规状态筛选"
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">全部合规状态</option>
              <option value="within_budget">在控正常</option>
              <option value="warning">临界预警</option>
              <option value="exceeded">超额预警</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-3">省份</th>
                <th className="py-3 px-2">阵地类型</th>
                <th className="py-3 px-2">门店数</th>
                <th className="py-3 px-3">样机产品型号</th>
                <th className="py-3 px-2">机位属性</th>
                <th className="py-3 px-2 text-right text-slate-500">SOP理论需求</th>
                <th className="py-3 px-2 text-right text-slate-500">销售加权</th>
                <th className="py-3 px-2 text-right text-purple-700">策略需求</th>
                <th className="py-3 px-3 text-right text-blue-700">最终规划台数</th>
                <th className="py-3 px-2 text-right text-amber-700">相对SOP缺口</th>
                <th className="py-3 px-3 text-center text-amber-700">人工微调(台)</th>
                <th className="py-3 px-2 text-right">单店均台</th>
                <th className="py-3 px-2 text-right">核算成本(万)</th>
                <th className="py-3 px-3 text-center">额度状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono bg-white">
              {filteredRows.slice(0, 100).map(row => {
                const currentOffset = manualAdjustments[row.rowKey] || 0;
                return (
                  <tr key={row.rowKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      {row.provinceName}
                    </td>
                    <td className="py-2.5 px-2 font-sans text-slate-600 text-[11px]">
                      {row.positionName.split('(')[0]}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500">{row.storeCount}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-slate-800 text-xs truncate max-w-[170px]">
                        {row.productName.split('(')[0]}
                      </div>
                      <div className="text-[10px] text-slate-400">{row.productCategory}</div>
                    </td>
                    <td className="py-2.5 px-2 font-sans">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                        row.isMandatorySlot 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {row.isMandatorySlot ? '必陈' : '轮换'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500">
                      {row.standardDisplayDemand.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500">
                      {row.salesWeightedDemand.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-purple-700 font-semibold">
                      {row.strategyWeightedDemand.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700 text-sm">
                      {row.finalPlannedUnits.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-sans">
                      <span className={`text-[11px] font-mono font-medium ${
                        row.displayGap < 0 ? 'text-amber-700' : 'text-slate-400'
                      }`}>
                        {row.displayGap < 0 ? `${row.displayGap}` : '0'}
                      </span>
                    </td>
                    {/* Inline Manual Adjustment Input */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setManualAdjustment(row.rowKey, currentOffset - 5)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors"
                          title="-5台"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={currentOffset === 0 ? '' : currentOffset}
                          placeholder="0"
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setManualAdjustment(row.rowKey, isNaN(val) ? 0 : val);
                          }}
                          className={`w-12 text-center text-xs font-mono rounded py-0.5 border ${
                            currentOffset !== 0
                              ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                              : 'bg-white border-slate-300 text-slate-700'
                          } focus:outline-none shadow-xs`}
                        />
                        <button
                          onClick={() => setManualAdjustment(row.rowKey, currentOffset + 5)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors"
                          title="+5台"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 font-medium">
                      {row.avgUnitsPerStore}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700">
                      {(row.totalPlannedCost / 10000).toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {row.quotaComplianceStatus === 'exceeded' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          超额
                        </span>
                      ) : row.quotaComplianceStatus === 'warning' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          临界
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          在控
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 100 && (
          <div className="text-center py-2 text-xs text-slate-400">
            已显示前 100 条记录（共 {filteredRows.length} 条），可使用上方筛选器精确检索
          </div>
        )}
      </div>

      {/* Save Scenario Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Save className="w-4 h-4 text-blue-600" />
                <span>保存当前试算参数为新方案</span>
              </h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScenarioSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">方案名称</label>
                <input
                  type="text"
                  placeholder="如：双十一高端折叠屏爆破方案"
                  value={newScenarioName}
                  onChange={e => setNewScenarioName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">方案策略描述与依据</label>
                <textarea
                  rows={3}
                  placeholder="说明该方案针对的业务场景、核心加成逻辑与预期目标..."
                  value={newScenarioDesc}
                  onChange={e => setNewScenarioDesc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  确认保存方案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
