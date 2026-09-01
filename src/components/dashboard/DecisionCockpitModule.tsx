import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Store,
  Layers,
  DollarSign,
  AlertCircle,
  Lightbulb,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const COLORS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#d97706', '#059669', '#0891b2'];

export const DecisionCockpitModule: React.FC = () => {
  const {
    simulationResult,
    provinces,
    scenarios,
    activeScenarioId,
    provinceQuotaOverrides,
    setActiveTab,
    applyAutoBalance
  } = useApp();

  const { summary, rows } = simulationResult;

  // Chart 1 Data: Province Allocation vs Quota Cap & Utilization Rate
  const provinceChartData = provinces.map(p => {
    const quotaCap = provinceQuotaOverrides[p.id] ?? p.totalQuotaCap;
    const provRows = rows.filter(r => r.provinceId === p.id);
    const plannedUnits = provRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
    const utilization = quotaCap > 0 ? Number(((plannedUnits / quotaCap) * 100).toFixed(1)) : 0;
    return {
      name: p.name.replace('省', '').replace('市', ''),
      fullName: p.name,
      plannedUnits,
      quotaCap,
      utilization,
    };
  });

  // Chart 2 Data: Product Category Distribution
  const categoryPieData = summary.productCategoryBreakdown.map(item => ({
    name: item.name,
    value: item.units,
    cost: item.cost,
    share: item.sharePercent,
  }));

  // Chart 3 Data: Position Type Allocation & Avg per Store
  const positionBarData = summary.positionTypeBreakdown.map(item => ({
    name: item.name.split('(')[0],
    fullName: item.name,
    units: item.units,
    stores: item.stores,
    avgPerStore: item.avgPerStore,
  }));

  // Chart 4 Data: Radar comparison for scenarios
  const radarData = [
    { subject: '陈列标准化', 标准方案: 100, 销效优先: 75, 新品攻坚: 82, 额度平衡: 90 },
    { subject: '销售产出匹配', 标准方案: 50, 销效优先: 96, 新品攻坚: 88, 额度平衡: 85 },
    { subject: '预算额度受控', 标准方案: 60, 销效优先: 88, 新品攻坚: 80, 额度平衡: 98 },
    { subject: '新品首销爆发力', 标准方案: 70, 销效优先: 90, 新品攻坚: 99, 额度平衡: 82 },
    { subject: '全场景协同覆盖', 标准方案: 92, 销效优先: 78, 新品攻坚: 72, 额度平衡: 86 },
  ];

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="space-y-6">
      {/* 4 Core Top Metrics - Matching Professional Polish Archetype */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">规划总样机</h3>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {summary.totalPlannedUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">台</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>额度上限: <strong className="text-slate-700 font-mono">{summary.totalQuotaCap.toLocaleString()}</strong> 台</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
              {summary.quotaUtilizationRate}%
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">核算总投入成本</h3>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ￥{(summary.totalPlannedBudgetRmb / 10000).toFixed(0)}
            </span>
            <span className="text-xs text-slate-500 font-medium">万元</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>单台均机成本</span>
            <span className="font-mono text-slate-700 font-medium">
              ￥{Math.round(summary.totalPlannedBudgetRmb / Math.max(1, summary.totalPlannedUnits))}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">标准化陈列率</h3>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {summary.displayComplianceRate}%
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SOP达标
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>细化陈列桌标准</span>
            <span className="font-mono text-slate-700 font-medium">12类标准桌型</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">终端覆盖与配置深度</h3>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {summary.totalStoresCovered.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">家门店</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>单店平均样机配额</span>
            <span className="font-mono text-slate-700 font-semibold">{summary.avgUnitsPerStore} 台/店</span>
          </div>
        </div>
      </section>

      {/* Main Charts Row 1: Province Allocation vs Quota Cap (Composed) & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Province Allocation vs Quota Cap */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>全国重点省份样机规划投放 vs 额度上限与利用率</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                柱状图展示规划台数与额度上限对比，折线展示省份额度利用率（100%警戒红线）
              </p>
            </div>
            <button
              onClick={() => setActiveTab('quota')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              <span>额度管控矩阵</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 h-76 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={provinceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickFormatter={v => `${v}台`} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} tickFormatter={v => `${v}%`} domain={[0, 140]} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px',
                    color: '#ffffff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' 
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === '利用率') return [`${value}%`, name];
                    return [`${value.toLocaleString()} 台`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="plannedUnits" name="规划试算台数" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="quotaCap" name="省份额度上限" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="utilization" name="利用率" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4, fill: '#d97706' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right 4 Cols: Product Category Breakdown */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-600" />
                <span>样机产品品类结构占比</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">旗舰直板与折叠屏占比超 60%</p>
            </div>
          </div>

          <div className="h-48 w-full relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()} 台`, '规划台数']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-slate-900 font-mono">{summary.totalPlannedUnits.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">总规划样机</span>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
            {summary.productCategoryBreakdown.map((item, idx) => (
              <div key={item.category} className="flex items-center justify-between pt-1.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span>{item.units.toLocaleString()}台</span>
                  <span className="text-slate-500 font-semibold">({item.sharePercent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Main Charts Row 2: Position Channel Depth & Scenarios Benchmark Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Position Channel Depth Chart */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>零售阵地类型样机投放深度与单店配置</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                高阶体验店Plus/形象店A级主打全场景深度体验，C级专区主攻高频走量
              </p>
            </div>
            <button
              onClick={() => setActiveTab('display')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <span>细化陈列桌</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${v}台`} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === '单店平均') return [`${value} 台/店`, name];
                    return [`${value.toLocaleString()} 台`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="units" name="总样机投入台数" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPerStore" name="单店平均配置台数" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4 Scenarios Multi-dimension Radar Benchmark */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>4 大规划试算方案多维雷达对比</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                综合评估陈列标准、销售匹配、预算受控、新品爆发与全场景协同
              </p>
            </div>
            <button
              onClick={() => setActiveTab('simulation')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <span>因子调优试算</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                />
                <Radar name="销效优先" dataKey="销效优先" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                <Radar name="新品攻坚" dataKey="新品攻坚" stroke="#db2777" fill="#db2777" fillOpacity={0.2} />
                <Radar name="额度平衡" dataKey="额度平衡" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Bottom Business Decision Recommendations & Risk Diagnostics */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-800">业务决策推荐与智能诊断建议 (Decision Insights)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">当前基准方案：【{activeScenario.name}】</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Recommendation 1 */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>1. 省份额度超配预警与智能配平</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-200/80 text-amber-900">
                {summary.exceededProvincesCount} 省超额
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              广东省和浙江省由于S/A级门店密度高且销量权重较大，规划样机已超出额度上限约 6%~10%。
            </p>
            <div className="pt-2">
              <button
                onClick={applyAutoBalance}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                执行一键智能配平 (释放非核心机位)
              </button>
            </div>
          </div>

          {/* Recommendation 2 */}
          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>2. S级新品 (Mate 70/X6) 终端铺市率</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-200/80 text-blue-900">
                98.2% 达标
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              全国 180 家体验店 Plus 与 650 家形象店 A 级已 100% 保障 C 位双色双折叠出样，首销体验爆发力充沛。
            </p>
            <div className="text-[11px] text-blue-800 font-medium pt-1">
              建议：运营商超级旗舰厅可适当增加 10% 5G合约版样机配置。
            </div>
          </div>

          {/* Recommendation 3 - Highlighted Solid Blue Card as in Design Theme */}
          <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-200" />
                  <span>3. 智能资产周转与回收机制</span>
                </h4>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  折损率 4.5%
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                检测到老品（上一代直板机）可启动退场流转机制，折价下沉或流转至售后备用机库，盘活流动资金。
              </p>
            </div>
            <button
              onClick={() => setActiveTab('simulation')}
              className="w-full py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              进入试算中心微调
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
