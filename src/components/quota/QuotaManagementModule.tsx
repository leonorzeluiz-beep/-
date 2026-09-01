import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  PieChart, 
  ArrowRightLeft, 
  Sliders, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  Building2, 
  MapPin, 
  History, 
  FileText, 
  ShieldAlert,
  Percent,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PositionType } from '../../types';

export const QuotaManagementModule: React.FC = () => {
  const {
    provinces,
    positions,
    provinceQuotaOverrides,
    simulationResult,
    adjustProvinceQuota,
    transferProvinceQuota,
    batchAdjustAllQuotas,
    auditLogs,
    showToast
  } = useApp();

  // Selected province for single adjustment modal
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('prov-guangdong');
  const [adjustAmountInput, setAdjustAmountInput] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Transfer state
  const [fromProvinceId, setFromProvinceId] = useState<string>('prov-shanghai');
  const [toProvinceId, setToProvinceId] = useState<string>('prov-guangdong');
  const [transferAmount, setTransferAmount] = useState<string>('200');
  const [transferReason, setTransferReason] = useState<string>('重点商圈旗舰新店开业，申请特批资源倾斜');

  // Filter for matrix view
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<'all' | 'exceeded' | 'warning' | 'healthy'>('all');

  const selectedProvince = provinces.find(p => p.id === selectedProvinceId) || provinces[0];

  // Calculate province level aggregations from simulation results
  const provinceStats = provinces.map(p => {
    const quotaCap = provinceQuotaOverrides[p.id] ?? p.totalQuotaCap;
    const provRows = simulationResult.rows.filter(r => r.provinceId === p.id);
    const plannedUnits = provRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
    const plannedCost = provRows.reduce((sum, r) => sum + r.totalPlannedCost, 0);
    const utilization = quotaCap > 0 ? (plannedUnits / quotaCap) * 100 : 0;
    const totalStores: number = (Object.values(p.storeDistribution) as number[]).reduce((sum, val) => sum + val, 0);
    const avgUnitsPerStore = totalStores > 0 ? (plannedUnits / totalStores).toFixed(1) : '0';

    // Position breakdown
    const positionUnits: Record<PositionType, number> = {
      flagship_plus: 0,
      image_store_a: 0,
      standard_store_b: 0,
      telecom_flagship: 0,
      ka_chain_3c: 0,
      authorized_zone_c: 0,
    };

    provRows.forEach(r => {
      if (positionUnits[r.positionType] !== undefined) {
        positionUnits[r.positionType] += r.finalPlannedUnits;
      }
    });

    let healthStatus: 'healthy' | 'warning' | 'exceeded' = 'healthy';
    if (utilization > 105) healthStatus = 'exceeded';
    else if (utilization >= 90) healthStatus = 'warning';

    return {
      ...p,
      quotaCap,
      plannedUnits,
      plannedCost,
      utilization: Number(utilization.toFixed(1)),
      totalStores,
      avgUnitsPerStore,
      positionUnits,
      healthStatus,
    };
  });

  // Filtered list
  const filteredProvinces = provinceStats.filter(p => {
    if (selectedRegion !== 'all' && p.region !== selectedRegion) return false;
    if (filterHealth !== 'all' && p.healthStatus !== filterHealth) return false;
    return true;
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuota = parseInt(adjustAmountInput, 10);
    if (isNaN(newQuota) || newQuota <= 0) {
      showToast('请输入有效的额度数值！', 'error');
      return;
    }
    adjustProvinceQuota(selectedProvinceId, newQuota, adjustReason || '常规业务额度调整');
    setAdjustAmountInput('');
    setAdjustReason('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('请输入有效的划拨台数！', 'error');
      return;
    }
    if (fromProvinceId === toProvinceId) {
      showToast('调出省份与调入省份不能相同！', 'error');
      return;
    }
    transferProvinceQuota(fromProvinceId, toProvinceId, amount, transferReason);
  };

  const totalCap = provinceStats.reduce((sum, p) => sum + p.quotaCap, 0);
  const totalPlanned = provinceStats.reduce((sum, p) => sum + p.plannedUnits, 0);
  const totalRemaining = totalCap - totalPlanned;
  const overallUtilization = totalCap > 0 ? ((totalPlanned / totalCap) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">全国样机总额度池 (Cap)</h3>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalCap.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-medium">台</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>核算总预算上限</span>
            <span className="font-semibold text-slate-800 font-mono">￥{(simulationResult.summary.totalPlannedBudgetRmb / 10000).toFixed(1)} 万元</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">试算规划已占用额度</h3>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalPlanned.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-medium">台</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>全国整体额度利用率</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
              Number(overallUtilization) > 100 
                ? 'text-rose-700 bg-rose-50 border border-rose-200' 
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            }`}>
              {overallUtilization}%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">机动剩余额度 (Buffer)</h3>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className={`text-2xl font-bold font-mono ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalRemaining >= 0 ? `+${totalRemaining.toLocaleString()}` : totalRemaining.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">台</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>弹性调节空间</span>
            <span className="font-semibold text-slate-800 font-mono">{((totalRemaining / totalCap) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">超额风险与健康诊断</h3>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {simulationResult.summary.exceededProvincesCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">省超额 / {simulationResult.summary.warningProvincesCount} 预警</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-3 pt-3 border-t border-slate-100 font-medium">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {simulationResult.summary.healthyProvincesCount} 健康
            </span>
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {simulationResult.summary.warningProvincesCount} 临界
            </span>
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {simulationResult.summary.exceededProvincesCount} 超标
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Left Matrix Table + Right Adjustment & Audit Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Province × Position Quota Matrix Table (Span 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>省份 × 阵地类型样机额度管控矩阵</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                基于各省销售贡献与阵地门店等级细化分配，实时校验额度利用率与超配红线
              </p>
            </div>

            {/* Matrix Filters */}
            <div className="flex items-center gap-2">
              <select
                aria-label="区域筛选"
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="all">所有大区</option>
                <option value="华东">华东大区</option>
                <option value="华南">华南大区</option>
                <option value="华北">华北大区</option>
                <option value="西南">西南大区</option>
                <option value="华中">华中大区</option>
                <option value="西北">西北大区</option>
              </select>

              <select
                aria-label="健康状态筛选"
                value={filterHealth}
                onChange={e => setFilterHealth(e.target.value as any)}
                className="bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value="all">全部健康度</option>
                <option value="exceeded">仅看超额预警 (&gt;105%)</option>
                <option value="warning">临界预警 (90%~105%)</option>
                <option value="healthy">健康合规 (&lt;90%)</option>
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                  <th className="py-3 px-3">省份/区域</th>
                  <th className="py-3 px-2">销售权重</th>
                  <th className="py-3 px-2 text-amber-700">S级旗舰</th>
                  <th className="py-3 px-2 text-blue-700">A级形象</th>
                  <th className="py-3 px-2 text-emerald-700">B级标准</th>
                  <th className="py-3 px-2 text-purple-700">运营商厅</th>
                  <th className="py-3 px-2 text-indigo-700">3C KA</th>
                  <th className="py-3 px-2 text-slate-500">C级专区</th>
                  <th className="py-3 px-2 text-right text-slate-800">规划占用</th>
                  <th className="py-3 px-2 text-right text-slate-800">额度Cap</th>
                  <th className="py-3 px-3 text-center">利用率</th>
                  <th className="py-3 px-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredProvinces.map(prov => {
                  const isSelected = selectedProvinceId === prov.id;
                  return (
                    <tr
                      key={prov.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{prov.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">{prov.region}</span>
                          <span>{prov.totalStores}店</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-700">
                        {(prov.salesWeight * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 font-mono text-amber-800 font-semibold">
                        {prov.positionUnits.flagship_plus.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-blue-800">
                        {prov.positionUnits.image_store_a.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-emerald-800">
                        {prov.positionUnits.standard_store_b.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-purple-800">
                        {prov.positionUnits.telecom_flagship.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-indigo-800">
                        {prov.positionUnits.ka_chain_3c.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">
                        {prov.positionUnits.authorized_zone_c.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {prov.plannedUnits.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-blue-700">
                        {prov.quotaCap.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                          <div className="flex items-center justify-between w-full text-[11px]">
                            <span
                              className={`font-semibold ${
                                prov.healthStatus === 'exceeded'
                                  ? 'text-rose-600'
                                  : prov.healthStatus === 'warning'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {prov.utilization}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {prov.plannedUnits > prov.quotaCap ? `+${prov.plannedUnits - prov.quotaCap}` : `余${prov.quotaCap - prov.plannedUnits}`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                prov.healthStatus === 'exceeded'
                                  ? 'bg-rose-500'
                                  : prov.healthStatus === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, prov.utilization)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedProvinceId(prov.id);
                            setAdjustAmountInput(prov.quotaCap.toString());
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                        >
                          调额
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>分配逻辑说明：S级旗舰店单店额度配置上限为28台，A级形象店为19台，B级标准店为15台。</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">快捷批量调额:</span>
              <button
                onClick={() => batchAdjustAllQuotas(5)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-xs"
              >
                全国 +5%
              </button>
              <button
                onClick={() => batchAdjustAllQuotas(-5)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-xs"
              >
                全国 -5%
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Quota Adjustment Center & Audit Logs (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Province Quota Adjust Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>省份样机额度专项调配</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {selectedProvince.name}
              </span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">目标省份</label>
                <select
                  aria-label="目标省份选择"
                  value={selectedProvinceId}
                  onChange={e => {
                    setSelectedProvinceId(e.target.value);
                    const p = provinces.find(x => x.id === e.target.value);
                    setAdjustAmountInput((provinceQuotaOverrides[e.target.value] ?? p?.totalQuotaCap ?? 0).toString());
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (当前额度: {provinceQuotaOverrides[p.id] ?? p.totalQuotaCap} 台)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-medium">调整后总额度上限 (台)</label>
                  <span className="text-slate-400 text-[11px]">
                    原额度: {provinceQuotaOverrides[selectedProvinceId] ?? selectedProvince.totalQuotaCap}台
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="请输入新额度总台数"
                  value={adjustAmountInput}
                  onChange={e => setAdjustAmountInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">调额原因 / 审批依据</label>
                <input
                  type="text"
                  placeholder="如：核心商圈增开2家S级旗舰店，配额增拨"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>确认调整并生效</span>
                </button>
              </div>
            </form>
          </div>

          {/* Inter-Province Quota Transfer Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                <span>省份间跨区域额度划拨</span>
              </h3>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                总额度恒定平移
              </span>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">调出省份 (扣减)</label>
                  <select
                    aria-label="调出省份选择"
                    value={fromProvinceId}
                    onChange={e => setFromProvinceId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({provinceQuotaOverrides[p.id] ?? p.totalQuotaCap}台)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">调入省份 (增补)</label>
                  <select
                    aria-label="调入省份选择"
                    value={toProvinceId}
                    onChange={e => setToProvinceId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({provinceQuotaOverrides[p.id] ?? p.totalQuotaCap}台)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">划拨样机台数</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">划拨调令备注</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>执行跨省额度调拨</span>
              </button>
            </form>
          </div>

          {/* Audit Logs Trail */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>额度变更审计轨迹</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">最近 {auditLogs.length} 条记录</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-blue-600">{log.actionType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 leading-tight">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
