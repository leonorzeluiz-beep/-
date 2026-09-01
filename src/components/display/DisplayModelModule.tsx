import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Watch, 
  Tv, 
  Headphones, 
  Zap, 
  Lock, 
  Tag, 
  Info,
  Edit3,
  Sparkles,
  Sliders,
  LayoutGrid,
  Table,
  Check,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { PositionType, TableCategory, ProductCategory, DisplaySlot } from '../../types';

export const DisplayModelModule: React.FC = () => {
  const {
    positions,
    products,
    displayTables,
    positionModels,
    updateTableSlot,
    addTableSlot,
    removeTableSlot,
    updatePositionTableQty,
    updatePositionProductUnits,
    showToast
  } = useApp();

  const [selectedPositionId, setSelectedPositionId] = useState<PositionType>('flagship_plus');
  const [activeSubView, setActiveSubView] = useState<'product_allocation' | 'cross_matrix' | 'table_slots'>('product_allocation');
  const [selectedTableId, setSelectedTableId] = useState<string>('table-center-1');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingSlot, setEditingSlot] = useState<{ tableId: string; slot: DisplaySlot } | null>(null);

  const currentPosition = positions.find(p => p.id === selectedPositionId) || positions[0];
  const currentModel = positionModels[selectedPositionId] || positionModels['flagship_plus'];
  const currentTable = displayTables.find(t => t.id === selectedTableId) || displayTables[0];

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'flagship_phone':
      case 'foldable_phone':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-purple-600" />;
      case 'pc_laptop':
        return <Laptop className="w-4 h-4 text-amber-600" />;
      case 'wearable':
        return <Watch className="w-4 h-4 text-emerald-600" />;
      case 'smart_screen':
        return <Tv className="w-4 h-4 text-rose-600" />;
      case 'audio_iot':
        return <Headphones className="w-4 h-4 text-cyan-600" />;
      default:
        return <Smartphone className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryName = (cat: ProductCategory) => {
    const map: Record<ProductCategory, string> = {
      flagship_phone: '旗舰直板手机',
      foldable_phone: '折叠屏旗舰',
      tablet: '智慧平板',
      pc_laptop: 'PC轻薄本',
      wearable: '智能穿戴',
      audio_iot: '智能音频',
      smart_screen: '智慧大屏',
    };
    return map[cat] || cat;
  };

  const handleSlotSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    updateTableSlot(editingSlot.tableId, editingSlot.slot.slotId, editingSlot.slot);
    setEditingSlot(null);
    showToast('陈列机位标准已保存！');
  };

  // Filtered products for allocation list
  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate stats for current position model
  const totalAllocatedUnits = (currentModel.productAllocations || []).reduce((sum, a) => sum + a.units, 0);
  const mandatoryAllocatedUnits = (currentModel.productAllocations || []).filter(a => a.isMandatory).reduce((sum, a) => sum + a.units, 0);
  const sTierUnits = (currentModel.productAllocations || []).filter(a => {
    const prod = products.find(p => p.id === a.productId);
    return prod?.launchTier === 'S';
  }).reduce((sum, a) => sum + a.units, 0);

  const nationalPositionDemand = currentPosition.nationalStoreCount * totalAllocatedUnits;

  return (
    <div className="space-y-6">
      {/* Top Banner & Position Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>阵地场景陈列模型与样机标准细化</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              基于 6 大零售阵地场景细化 16 款样机产品的单店标准陈列台数与陈列桌机位规范，作为多因子试算的核心基准
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setActiveSubView('product_allocation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubView === 'product_allocation'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>分阵地各产品台数配置</span>
            </button>
            <button
              onClick={() => setActiveSubView('cross_matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubView === 'cross_matrix'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>6大阵地横向对比矩阵</span>
            </button>
            <button
              onClick={() => setActiveSubView('table_slots')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubView === 'table_slots'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>陈列桌 2D 俯瞰与槽位</span>
            </button>
          </div>
        </div>

        {/* Position Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          {positions.map(pos => {
            const isSelected = selectedPositionId === pos.id;
            const model = positionModels[pos.id];
            const capacity = model?.totalDisplayCapacity || 0;
            return (
              <button
                key={pos.id}
                onClick={() => setSelectedPositionId(pos.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    pos.level === 'S' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    pos.level === 'A' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    pos.level === 'KA' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {pos.level}级阵地
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-700">{capacity} 台/店</span>
                </div>
                <div className="mt-2 font-bold text-xs text-slate-900 truncate">{pos.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{pos.nationalStoreCount} 家门店</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW 1: Product-by-Product Allocation Editor for Selected Position */}
      {activeSubView === 'product_allocation' && (
        <div className="space-y-6">
          {/* Position Overview & Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>单店标准陈列总台数</span>
                <span className="p-1 rounded bg-blue-50 text-blue-600"><Layers className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">{totalAllocatedUnits}</span>
                <span className="text-xs text-slate-500">台/店</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                涵盖 {products.filter(p => (currentModel.productAllocations || []).some(a => a.productId === p.id && a.units > 0)).length} 款出样产品
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>必陈机位占比 (Mandatory)</span>
                <span className="p-1 rounded bg-amber-50 text-amber-600"><ShieldCheck className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-700 font-mono">
                  {totalAllocatedUnits > 0 ? ((mandatoryAllocatedUnits / totalAllocatedUnits) * 100).toFixed(0) : 0}%
                </span>
                <span className="text-xs text-slate-500">({mandatoryAllocatedUnits}台必陈)</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>符合总部SOP底线规范</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>S级首发新品机位占比</span>
                <span className="p-1 rounded bg-purple-50 text-purple-600"><Sparkles className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-purple-700 font-mono">
                  {totalAllocatedUnits > 0 ? ((sTierUnits / totalAllocatedUnits) * 100).toFixed(0) : 0}%
                </span>
                <span className="text-xs text-slate-500">({sTierUnits}台S级)</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Mate 70系列与Mate X6优先超配
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>全国该阵地基准总需求</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600"><TrendingUp className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">{nationalPositionDemand.toLocaleString()}</span>
                <span className="text-xs text-slate-500">台</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                覆盖全国 {currentPosition.nationalStoreCount} 家门店
              </div>
            </div>
          </div>

          {/* Product Allocation Table & Control */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>【{currentPosition.name}】各样机产品标准陈列台数配置清单</span>
                </h3>
                <span className="text-xs text-slate-400">({filteredProducts.length} 款样机)</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索样机名称..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                  />
                </div>

                <select
                  aria-label="按品类筛选样机"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">全产品品类</option>
                  <option value="flagship_phone">旗舰直板手机</option>
                  <option value="foldable_phone">折叠屏旗舰</option>
                  <option value="tablet">智慧平板</option>
                  <option value="pc_laptop">PC轻薄本</option>
                  <option value="wearable">智能穿戴</option>
                  <option value="audio_iot">智能音频</option>
                  <option value="smart_screen">智慧大屏</option>
                </select>
              </div>
            </div>

            {/* Product Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                    <th className="py-3 px-3">样机产品名称</th>
                    <th className="py-3 px-3">品类</th>
                    <th className="py-3 px-3 text-center">推广级别</th>
                    <th className="py-3 px-3 text-right">样机成本</th>
                    <th className="py-3 px-3 text-center">标准陈列台数 (台/店)</th>
                    <th className="py-3 px-3 text-center">机位性质</th>
                    <th className="py-3 px-3">主推色系/配置</th>
                    <th className="py-3 px-3 text-right">全国该阵地总需求</th>
                    <th className="py-3 px-3">陈列规范备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(prod => {
                    const alloc = (currentModel.productAllocations || []).find(a => a.productId === prod.id);
                    const units = alloc ? alloc.units : 0;
                    const isMandatory = alloc ? alloc.isMandatory : false;
                    const preferredColor = alloc?.preferredColor || prod.colorOptions[0] || '默认主打色';
                    const notes = alloc?.notes || '-';
                    const nationalUnits = units * currentPosition.nationalStoreCount;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Product Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                              {getCategoryIcon(prod.category)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{prod.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{prod.modelCode}</div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {getCategoryName(prod.category)}
                          </span>
                        </td>

                        {/* Launch Tier */}
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                            prod.launchTier === 'S' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            prod.launchTier === 'A' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {prod.launchTier}级
                          </span>
                        </td>

                        {/* Cost */}
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          ￥{prod.sampleCost.toLocaleString()}
                        </td>

                        {/* Units Stepper */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-300 shadow-xs">
                            <button
                              onClick={() => updatePositionProductUnits(selectedPositionId, prod.id, Math.max(0, units - 1), isMandatory)}
                              className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition-colors shadow-xs"
                              title="减少单店标准台数"
                            >
                              -
                            </button>
                            <span className={`w-8 text-center font-mono font-bold text-sm ${units > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                              {units}
                            </span>
                            <button
                              onClick={() => updatePositionProductUnits(selectedPositionId, prod.id, units + 1, isMandatory)}
                              className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition-colors shadow-xs"
                              title="增加单店标准台数"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Mandatory Switch */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => updatePositionProductUnits(selectedPositionId, prod.id, units, !isMandatory)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                              isMandatory
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {isMandatory ? '必陈机位' : '轮换/可选'}
                          </button>
                        </td>

                        {/* Preferred Color */}
                        <td className="py-3 px-3 text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-blue-50/60 text-blue-700 text-[11px] border border-blue-100 font-medium">
                            {preferredColor}
                          </span>
                        </td>

                        {/* National Demand */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                          {nationalUnits > 0 ? `${nationalUnits.toLocaleString()} 台` : <span className="text-slate-300">-</span>}
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                          {notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span>提示：在上方调整任意样机单店台数，将直接实时联动并重新驱动全国样机规划与多因子试算引擎。</span>
              <span className="font-mono font-semibold text-slate-700">单店标准容量合计: {totalAllocatedUnits} 台/店</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Cross-Position Matrix (All 16 Products x 6 Position Scenarios) */}
      {activeSubView === 'cross_matrix' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-600" />
                <span>6大阵地场景样机陈列标准全景矩阵对比表 (Position x Product Standard Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                横向对比 16 款样机产品在各阵地单店标准出样台数 (台/店)，清晰掌握不同门店业态的陈列深度梯度
              </p>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              共 <strong className="text-slate-800 font-mono">{products.length}</strong> 款样机 · <strong className="text-slate-800 font-mono">{positions.length}</strong> 类阵地场景
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <th className="py-3 px-3 sticky left-0 bg-slate-50 z-10">样机产品</th>
                  <th className="py-3 px-3">品类</th>
                  <th className="py-3 px-3 text-center">推广级别</th>
                  {positions.map(pos => (
                    <th key={pos.id} className="py-3 px-3 text-center">
                      <div>{pos.name.split('(')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">({pos.level}级 · {pos.nationalStoreCount}店)</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">全国基准总需求</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(prod => {
                  let totalProdDemand = 0;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      {/* Product Name */}
                      <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(prod.category)}
                          <span>{prod.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-500">{getCategoryName(prod.category)}</td>

                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] border ${
                          prod.launchTier === 'S' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          prod.launchTier === 'A' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {prod.launchTier}级
                        </span>
                      </td>

                      {/* Position Columns */}
                      {positions.map(pos => {
                        const model = positionModels[pos.id];
                        const alloc = (model?.productAllocations || []).find(a => a.productId === prod.id);
                        const units = alloc ? alloc.units : 0;
                        const isMandatory = alloc?.isMandatory;
                        totalProdDemand += units * pos.nationalStoreCount;

                        return (
                          <td key={pos.id} className="py-2.5 px-3 text-center font-mono">
                            {units > 0 ? (
                              <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                                units >= 3 ? 'bg-blue-600 text-white shadow-xs' :
                                units >= 2 ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {units}台 {isMandatory && <span className="text-[9px] opacity-80">★</span>}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {totalProdDemand.toLocaleString()} 台
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-3 sticky left-0 bg-slate-100 z-10">单店总陈列容量 (台/店)</td>
                  <td className="py-3 px-3">-</td>
                  <td className="py-3 px-3 text-center">-</td>
                  {positions.map(pos => {
                    const model = positionModels[pos.id];
                    const cap = (model?.productAllocations || []).reduce((sum, a) => sum + a.units, 0);
                    return (
                      <td key={pos.id} className="py-3 px-3 text-center font-mono text-blue-700 text-sm">
                        {cap} 台/店
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right font-mono text-sm text-blue-700">
                    {positions.reduce((sum, pos) => {
                      const model = positionModels[pos.id];
                      const cap = (model?.productAllocations || []).reduce((s, a) => s + a.units, 0);
                      return sum + cap * pos.nationalStoreCount;
                    }, 0).toLocaleString()} 台
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: 2D Table Surface Slot Layout Visualizer */}
      {activeSubView === 'table_slots' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 2D Physical Fixture Table Slot View */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>陈列桌 2D 俯瞰可视化布局与机位分配</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  查看与定制实体陈列桌的每个机位槽位、推荐主打色、通电与防盗设备规范
                </p>
              </div>

              {/* Table Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {displayTables.map(tbl => {
                  const isSelected = selectedTableId === tbl.id;
                  return (
                    <button
                      key={tbl.id}
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <span>{tbl.name.split('(')[0]}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tbl.slots.length}位
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Surface Representation */}
            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-300 relative">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] border border-blue-200 font-semibold">
                    {currentTable.code}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{currentTable.name}</span>
                  <span className="text-slate-400 text-xs">
                    (物理规格: {currentTable.widthCm}cm × {currentTable.depthCm}cm · {currentTable.slots.length}槽位)
                  </span>
                </div>

                <button
                  onClick={() => addTableSlot(currentTable.id, 'flagship_phone')}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增机位槽</span>
                </button>
              </div>

              {/* Display Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentTable.slots.map(slot => {
                  const matchedProduct = products.find(p => p.id === slot.recommendedProductId);
                  return (
                    <div
                      key={slot.slotId}
                      className={`group relative rounded-xl p-4 border transition-all duration-150 flex flex-col justify-between ${
                        slot.isRequired
                          ? 'bg-white border-blue-400 shadow-xs ring-1 ring-blue-400/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono font-bold flex items-center justify-center border border-slate-200">
                            {slot.slotIndex}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">{slot.slotName}</span>
                        </div>

                        {slot.isRequired ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            必陈机位
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                            轮换机位
                          </span>
                        )}
                      </div>

                      <div className="py-2 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            {getCategoryIcon(slot.targetCategory)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {matchedProduct?.name || '待指定机型'}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{getCategoryName(slot.targetCategory)}</span>
                              {slot.preferredColor && (
                                <>
                                  <span>·</span>
                                  <span className="text-blue-700 font-medium">主推: {slot.preferredColor}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Equipment Indicators */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span
                            title={slot.hasPowerSupply ? '已配备24H持续通电体验线' : '未接电'}
                            className={`flex items-center gap-0.5 font-medium ${
                              slot.hasPowerSupply ? 'text-emerald-700' : 'text-slate-300 line-through'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            <span>通电</span>
                          </span>
                          <span
                            title={slot.hasAntiTheftLock ? '配备防盗拉线锁' : '无防盗锁'}
                            className={`flex items-center gap-0.5 font-medium ${
                              slot.hasAntiTheftLock ? 'text-blue-700' : 'text-slate-300 line-through'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>防盗</span>
                          </span>
                          <span
                            title={slot.hasElectronicTag ? '配置电子价签' : '无价签'}
                            className={`flex items-center gap-0.5 font-medium ${
                              slot.hasElectronicTag ? 'text-amber-700' : 'text-slate-300 line-through'
                            }`}
                          >
                            <Tag className="w-3 h-3" />
                            <span>价签</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingSlot({ tableId: currentTable.id, slot: { ...slot } })}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                            title="编辑该槽位规范"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {currentTable.slots.length > 2 && (
                            <button
                              onClick={() => removeTableSlot(currentTable.id, slot.slotId)}
                              className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                              title="删除槽位"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                <span>{currentTable.description}</span>
                <span className="text-slate-400 text-[11px] font-mono">陈列标准版本: SOP-2026-V3</span>
              </div>
            </div>
          </div>

          {/* Right: Table Composition in Store */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>【{currentPosition.name}】陈列桌配比</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                  单店 {currentModel.totalDisplayCapacity} 台
                </span>
              </div>

              <div className="space-y-3">
                {displayTables.map(tbl => {
                  const assigned = currentModel.tables.find(t => t.tableId === tbl.id);
                  const qty = assigned ? assigned.quantity : 0;
                  return (
                    <div
                      key={tbl.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{tbl.name.split('(')[0]}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          单桌容量: {tbl.slots.length}台样机 · {tbl.category}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-mono font-medium">
                          小计 {qty * tbl.slots.length}台
                        </span>
                        <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-300 shadow-xs">
                          <button
                            onClick={() => updatePositionTableQty(selectedPositionId, tbl.id, Math.max(0, qty - 1))}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition-colors"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-slate-900">{qty}</span>
                          <button
                            onClick={() => updatePositionTableQty(selectedPositionId, tbl.id, qty + 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SOP Rules */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>零售终端陈列 SOP 规范要点</span>
                </h3>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  合规执行
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-800">S级新品必陈：</strong>Mate 70系列与Mate X6必须占据核心中岛与专岛。</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-800">100%全天通电：</strong>所有样机必须保持接电亮屏状态并装载演示软件。</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-800">防盗与声光报警：</strong>所有开放体验机位配备隐藏式拉线锁。</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>配置陈列槽位规范 - 【{editingSlot.slot.slotName}】</span>
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSlotSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">槽位名称</label>
                <input
                  type="text"
                  value={editingSlot.slot.slotName}
                  onChange={e =>
                    setEditingSlot({
                      ...editingSlot,
                      slot: { ...editingSlot.slot, slotName: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">推荐出样产品</label>
                <select
                  aria-label="推荐出样产品选择"
                  value={editingSlot.slot.recommendedProductId}
                  onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    setEditingSlot({
                      ...editingSlot,
                      slot: {
                        ...editingSlot.slot,
                        recommendedProductId: e.target.value,
                        targetCategory: prod?.category || editingSlot.slot.targetCategory,
                        preferredColor: prod?.colorOptions[0] || '',
                      },
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({getCategoryName(p.category)} · 推广级别:{p.launchTier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">主打推荐颜色</label>
                <input
                  type="text"
                  value={editingSlot.slot.preferredColor || ''}
                  onChange={e =>
                    setEditingSlot({
                      ...editingSlot,
                      slot: { ...editingSlot.slot, preferredColor: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSlot.slot.isRequired}
                    onChange={e =>
                      setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, isRequired: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>设定为<strong>必陈机位 (Mandatory)</strong></span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSlot.slot.hasPowerSupply}
                    onChange={e =>
                      setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, hasPowerSupply: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>要求配备 24H 持续通电线</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSlot.slot.hasAntiTheftLock}
                    onChange={e =>
                      setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, hasAntiTheftLock: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>配备防盗拉线锁与电子声光报警</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  保存槽位规范
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
