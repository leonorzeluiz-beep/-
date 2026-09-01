import React, { useState, useMemo } from 'react';
import {
  Settings2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  TrendingUp,
  Sparkles,
  DollarSign,
  Info,
  CheckSquare,
  Square,
  Eye,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Search,
  X
} from 'lucide-react';
import { FactorDefinition, SimulationFactors } from '../../types';
import { FACTOR_CATALOG, DEFAULT_ENABLED_FACTOR_IDS } from '../../data/factorCatalog';

interface FactorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledFactorIds: (keyof SimulationFactors)[];
  onToggleFactor: (id: keyof SimulationFactors) => void;
  onBatchSet?: (ids: (keyof SimulationFactors)[]) => void;
  onSetAllFactors?: (ids: (keyof SimulationFactors)[]) => void;
  onResetDefaults: () => void;
  currentFactors?: SimulationFactors;
}

export const FactorManagerModal: React.FC<FactorManagerModalProps> = ({
  isOpen,
  onClose,
  enabledFactorIds = [],
  onToggleFactor,
  onBatchSet,
  onSetAllFactors,
  onResetDefaults,
  currentFactors = {} as SimulationFactors,
}) => {
  const handleBatch = onBatchSet || onSetAllFactors || (() => {});
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'display' | 'sales' | 'strategy' | 'constraint'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'all', label: '全量因子库', icon: SlidersHorizontal, count: FACTOR_CATALOG.length },
    { key: 'display', label: '1. 陈列与收敛', icon: Layers, count: FACTOR_CATALOG.filter(f => f.category === 'display').length },
    { key: 'sales', label: '2. 销售与效能', icon: TrendingUp, count: FACTOR_CATALOG.filter(f => f.category === 'sales').length },
    { key: 'strategy', label: '3. 策略与新品', icon: Sparkles, count: FACTOR_CATALOG.filter(f => f.category === 'strategy').length },
    { key: 'constraint', label: '4. 风控与约束', icon: DollarSign, count: FACTOR_CATALOG.filter(f => f.category === 'constraint').length },
  ];

  const filteredFactors = useMemo(() => {
    return FACTOR_CATALOG.filter(f => {
      if (activeCategoryTab !== 'all' && f.category !== activeCategoryTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchDesc = f.description.toLowerCase().includes(q);
        const matchCat = f.categoryName.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [activeCategoryTab, searchQuery]);

  const enabledCount = enabledFactorIds.length;
  const totalCount = FACTOR_CATALOG.length;

  const handleSelectAllVisible = () => {
    const visibleIds = filteredFactors.map(f => f.id);
    const combined = Array.from(new Set([...enabledFactorIds, ...visibleIds]));
    handleBatch(combined);
  };

  const handleDeselectAllVisible = () => {
    const visibleIdSet = new Set(filteredFactors.map(f => f.id));
    const remaining = enabledFactorIds.filter(id => !visibleIdSet.has(id));
    handleBatch(remaining);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  核心模型因子管理与控制台应用设置
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30 font-medium">
                  当前已启用 {enabledCount} / {totalCount}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                可自由勾选添加或精简控制台中参与计算与微调的模型因子，支持即时动态插拔
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(c => {
              const Icon = c.icon;
              const isSelected = activeCategoryTab === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCategoryTab(c.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索因子名称/说明/公式..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-52"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={handleSelectAllVisible}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-medium shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>全选当前</span>
            </button>
            <button
              onClick={handleDeselectAllVisible}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-medium shadow-2xs transition-colors"
            >
              <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>清空当前</span>
            </button>
            <button
              onClick={onResetDefaults}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-300 text-xs font-medium shadow-2xs transition-colors"
              title="恢复预设默认启用的12个核心因子"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>恢复默认</span>
            </button>
          </div>
        </div>

        {/* Factors List View */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredFactors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <div className="text-sm font-medium text-slate-600">未找到匹配的模型因子</div>
              <div className="text-xs text-slate-400">尝试更换搜索关键字或切换分类标签</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFactors.map(factor => {
                const isEnabled = enabledFactorIds.includes(factor.id);
                const currentValue = (currentFactors && currentFactors[factor.id] !== undefined)
                  ? currentFactors[factor.id]
                  : factor.defaultValue;
                const formattedVal = factor.formatValue(currentValue);

                return (
                  <div
                    key={factor.id}
                    onClick={() => onToggleFactor(factor.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isEnabled
                        ? 'bg-blue-50/40 border-blue-300 shadow-2xs ring-1 ring-blue-400/40'
                        : 'bg-white border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isEnabled
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">{factor.name}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {factor.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {factor.badge}
                            </span>
                          )}
                          {factor.isAdvanced && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              高阶扩展
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed pl-6">
                        {factor.description}
                      </p>

                      <div className="mt-2 pl-6 text-[10px] font-mono text-slate-400 bg-slate-100/60 p-1.5 rounded-lg border border-slate-200/50">
                        公式: {factor.formulaDescription}
                      </div>
                    </div>

                    {/* Current Active Value Preview */}
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between pl-6 text-xs">
                      <span className="text-slate-500 text-[11px]">当前取值/状态:</span>
                      <span className={`font-mono font-bold ${isEnabled ? 'text-blue-700' : 'text-slate-400'}`}>
                        {formattedVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>在控制台中勾选启用的因子将立即渲染为可拖拽滑块或控制开关，实时参与全量数据试算。</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
          >
            完成设置
          </button>
        </div>
      </div>
    </div>
  );
};
