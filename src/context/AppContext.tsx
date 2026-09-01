import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  Product,
  ChannelPosition,
  Province,
  DisplayTable,
  PositionDisplayModel,
  SimulationScenario,
  SimulationFactors,
  SimulationResultRow,
  SimulationSummary,
  AuditLog,
  PositionType,
  AutoBalanceStrategy
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_POSITIONS,
  INITIAL_PROVINCES,
  INITIAL_DISPLAY_TABLES,
  INITIAL_POSITION_DISPLAY_MODELS,
  INITIAL_SCENARIOS,
} from '../data/initialData';
import { runSimulationCalculation, autoBalanceExceededProvinces } from '../utils/calculator';

export type NavTab = 'quota' | 'display' | 'simulation' | 'dashboard';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  planningPeriod: string;
  setPlanningPeriod: (period: string) => void;
  
  // Data Sources
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  positions: ChannelPosition[];
  provinces: Province[];
  displayTables: DisplayTable[];
  setDisplayTables: React.Dispatch<React.SetStateAction<DisplayTable[]>>;
  positionModels: Record<string, PositionDisplayModel>;
  setPositionModels: React.Dispatch<React.SetStateAction<Record<string, PositionDisplayModel>>>;
  
  // Scenarios & Factors
  scenarios: SimulationScenario[];
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  currentFactors: SimulationFactors;
  updateFactor: <K extends keyof SimulationFactors>(key: K, val: SimulationFactors[K]) => void;
  saveAsNewScenario: (name: string, description: string) => void;
  
  // Simulation Execution
  simulationResult: {
    rows: SimulationResultRow[];
    summary: SimulationSummary;
  };
  manualAdjustments: Record<string, number>;
  setManualAdjustment: (rowKey: string, offset: number) => void;
  resetAllManualAdjustments: () => void;
  applyAutoBalance: (strategy?: AutoBalanceStrategy) => void;
  
  // Quota Management Overrides & Operations
  provinceQuotaOverrides: Record<string, number>;
  adjustProvinceQuota: (provinceId: string, newQuota: number, reason?: string) => void;
  transferProvinceQuota: (fromProvId: string, toProvId: string, amount: number, reason?: string) => void;
  batchAdjustAllQuotas: (percentChange: number) => void;
  
  // Display Table Slot & Product Allocation Management
  updateTableSlot: (tableId: string, slotId: string, updates: Partial<DisplayTable['slots'][0]>) => void;
  addTableSlot: (tableId: string, targetCategory: Product['category']) => void;
  removeTableSlot: (tableId: string, slotId: string) => void;
  updatePositionTableQty: (positionType: PositionType, tableId: string, newQty: number) => void;
  updatePositionProductUnits: (positionType: PositionType, productId: string, units: number, isMandatory?: boolean) => void;
  batchSetPositionProductUnits: (positionType: PositionType, allocations: PositionDisplayModel['productAllocations']) => void;
  
  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (actionType: AuditLog['actionType'], details: string) => void;
  
  // UI Helpers
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [planningPeriod, setPlanningPeriod] = useState<string>('2026_Q3_LAUNCH');
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [positions] = useState<ChannelPosition[]>(INITIAL_POSITIONS);
  const [provinces] = useState<Province[]>(INITIAL_PROVINCES);
  const [displayTables, setDisplayTables] = useState<DisplayTable[]>(INITIAL_DISPLAY_TABLES);
  const [positionModels, setPositionModels] = useState<Record<string, PositionDisplayModel>>(INITIAL_POSITION_DISPLAY_MODELS);
  
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(INITIAL_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('quota_balanced');
  
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);
  
  const [currentFactors, setCurrentFactors] = useState<SimulationFactors>(activeScenario.factors);
  
  // Sync factor changes when switching scenario
  useEffect(() => {
    const found = scenarios.find(s => s.id === activeScenarioId);
    if (found) {
      setCurrentFactors({ ...found.factors });
    }
  }, [activeScenarioId, scenarios]);

  const [manualAdjustments, setManualAdjustments] = useState<Record<string, number>>({});
  const [provinceQuotaOverrides, setProvinceQuotaOverrides] = useState<Record<string, number>>({});
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-08-31 09:30:00',
      operator: '系统自动初始化',
      actionType: 'QUOTA_ADJUST',
      details: '载入2026年Q3新品季全国各省份基准样机额度（总额度: 33,500台）',
    },
    {
      id: 'log-2',
      timestamp: '2026-08-31 10:15:22',
      operator: '零售规划部-张主管',
      actionType: 'SCENARIO_CREATE',
      details: '创建并载入【新品首发攻坚方案】，加成S级旗舰直板与折叠屏样机投放系数',
    },
  ]);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const addAuditLog = (actionType: AuditLog['actionType'], details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      operator: '当前登录用户(零售策略规划组)',
      actionType,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const updateFactor = <K extends keyof SimulationFactors>(key: K, val: SimulationFactors[K]) => {
    setCurrentFactors(prev => ({
      ...prev,
      [key]: val,
    }));
  };

  const saveAsNewScenario = (name: string, description: string) => {
    const newId = `custom_${Date.now()}`;
    const newScenario: SimulationScenario = {
      id: newId as any,
      name,
      tag: '自定义微调',
      description,
      factors: { ...currentFactors },
      isCustom: true,
    };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newId);
    addAuditLog('SCENARIO_CREATE', `保存并启用了新的自定义试算方案【${name}】`);
    showToast(`方案【${name}】保存成功并已应用！`);
  };

  // 运行试算引擎
  const simulationResult = useMemo(() => {
    return runSimulationCalculation(
      products,
      positions,
      provinces,
      positionModels,
      displayTables,
      currentFactors,
      manualAdjustments,
      provinceQuotaOverrides
    );
  }, [
    products,
    positions,
    provinces,
    positionModels,
    displayTables,
    currentFactors,
    manualAdjustments,
    provinceQuotaOverrides,
  ]);

  const setManualAdjustment = (rowKey: string, offset: number) => {
    setManualAdjustments(prev => {
      if (offset === 0) {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      }
      return {
        ...prev,
        [rowKey]: offset,
      };
    });
  };

  const resetAllManualAdjustments = () => {
    setManualAdjustments({});
    showToast('已清空所有人工试算微调值，恢复纯模型试算结果', 'info');
  };

  const applyAutoBalance = (strategy: AutoBalanceStrategy = 'mandatory_first') => {
    const newAdjusts = autoBalanceExceededProvinces(
      simulationResult.rows,
      provinces,
      provinceQuotaOverrides,
      strategy
    );
    setManualAdjustments(prev => ({ ...prev, ...newAdjusts }));
    const strategyNames: Record<AutoBalanceStrategy, string> = {
      mandatory_first: '必陈机位保底优先',
      position_tiered: '阵地场景梯度削减',
      sales_roi: '销售效能产出优先',
      uniform: '全局等比线性收敛',
    };
    addAuditLog('SIMULATION_APPLY', `执行【一键智能配平算法】(策略: ${strategyNames[strategy] || strategy})，自动优化超额省份配额，对齐额度红线`);
    showToast(`智能配平完成！已采用【${strategyNames[strategy] || strategy}】策略校准超额省份`, 'success');
  };

  const adjustProvinceQuota = (provinceId: string, newQuota: number, reason?: string) => {
    const prov = provinces.find(p => p.id === provinceId);
    const oldQuota = provinceQuotaOverrides[provinceId] ?? prov?.totalQuotaCap ?? 0;
    
    setProvinceQuotaOverrides(prev => ({
      ...prev,
      [provinceId]: newQuota,
    }));
    
    addAuditLog(
      'QUOTA_ADJUST',
      `调整【${prov?.name || provinceId}】样机额度上限: 由 ${oldQuota}台 变更为 ${newQuota}台 ${reason ? `(原因: ${reason})` : ''}`
    );
    showToast(`【${prov?.name}】样机额度已更新为 ${newQuota} 台`);
  };

  const transferProvinceQuota = (fromProvId: string, toProvId: string, amount: number, reason?: string) => {
    const fromP = provinces.find(p => p.id === fromProvId);
    const toP = provinces.find(p => p.id === toProvId);
    if (!fromP || !toP) return;

    const fromCurrent = provinceQuotaOverrides[fromProvId] ?? fromP.totalQuotaCap;
    const toCurrent = provinceQuotaOverrides[toProvId] ?? toP.totalQuotaCap;

    if (fromCurrent < amount) {
      showToast(`调出方【${fromP.name}】可用额度不足！`, 'error');
      return;
    }

    setProvinceQuotaOverrides(prev => ({
      ...prev,
      [fromProvId]: fromCurrent - amount,
      [toProvId]: toCurrent + amount,
    }));

    addAuditLog(
      'QUOTA_TRANSFER',
      `从【${fromP.name}】划拨 ${amount}台 额度至【${toP.name}】 ${reason ? `(备注: ${reason})` : ''}`
    );
    showToast(`成功划拨 ${amount}台 额度从 ${fromP.name} 至 ${toP.name}`);
  };

  const batchAdjustAllQuotas = (percentChange: number) => {
    const newOverrides: Record<string, number> = {};
    for (const p of provinces) {
      const current = provinceQuotaOverrides[p.id] ?? p.totalQuotaCap;
      newOverrides[p.id] = Math.round(current * (1 + percentChange / 100));
    }
    setProvinceQuotaOverrides(newOverrides);
    addAuditLog(
      'QUOTA_ADJUST',
      `批量调整全国所有省份样机额度：统一${percentChange >= 0 ? '+' : ''}${percentChange}%`
    );
    showToast(`全国省份额度已统一调整 ${percentChange >= 0 ? '+' : ''}${percentChange}%`);
  };

  // Display Table Slot modifications
  const updateTableSlot = (tableId: string, slotId: string, updates: Partial<DisplayTable['slots'][0]>) => {
    setDisplayTables(prev =>
      prev.map(table => {
        if (table.id !== tableId) return table;
        return {
          ...table,
          slots: table.slots.map(s => (s.slotId === slotId ? { ...s, ...updates } : s)),
        };
      })
    );
    addAuditLog('DISPLAY_UPDATE', `更新了陈列桌位配置 (Table: ${tableId}, Slot: ${slotId})`);
  };

  const addTableSlot = (tableId: string, targetCategory: Product['category']) => {
    setDisplayTables(prev =>
      prev.map(table => {
        if (table.id !== tableId) return table;
        const newIndex = table.slots.length + 1;
        const matchingProd = products.find(p => p.category === targetCategory) || products[0];
        const newSlot = {
          slotId: `slot-${Date.now()}`,
          slotIndex: newIndex,
          slotName: `扩展机位-${newIndex}`,
          targetCategory,
          recommendedProductId: matchingProd.id,
          isRequired: false,
          hasPowerSupply: true,
          hasAntiTheftLock: true,
          hasElectronicTag: true,
        };
        return {
          ...table,
          totalSlots: table.slots.length + 1,
          slots: [...table.slots, newSlot],
        };
      })
    );
    addAuditLog('DISPLAY_UPDATE', `为陈列桌【${tableId}】新增了 1 个机位槽位`);
    showToast('已新增陈列桌位！');
  };

  const removeTableSlot = (tableId: string, slotId: string) => {
    setDisplayTables(prev =>
      prev.map(table => {
        if (table.id !== tableId) return table;
        const filtered = table.slots.filter(s => s.slotId !== slotId);
        return {
          ...table,
          totalSlots: filtered.length,
          slots: filtered.map((s, idx) => ({ ...s, slotIndex: idx + 1 })),
        };
      })
    );
    addAuditLog('DISPLAY_UPDATE', `从陈列桌【${tableId}】移除了机位槽位【${slotId}】`);
    showToast('已移除机位槽位');
  };

  const updatePositionTableQty = (positionType: PositionType, tableId: string, newQty: number) => {
    setPositionModels(prev => {
      const model = prev[positionType];
      if (!model) return prev;
      const updatedTables = model.tables.map(t => (t.tableId === tableId ? { ...t, quantity: Math.max(0, newQty) } : t));
      const totalCap = updatedTables.reduce((sum, t) => sum + t.quantity * t.slotsPerTable, 0);
      return {
        ...prev,
        [positionType]: {
          ...model,
          tables: updatedTables,
          totalDisplayCapacity: totalCap,
        },
      };
    });
    addAuditLog('DISPLAY_UPDATE', `更新了阵地【${positionType}】的陈列桌【${tableId}】配置数量为: ${newQty}张`);
    showToast('已更新阵地陈列桌配置台数');
  };

  const updatePositionProductUnits = (positionType: PositionType, productId: string, units: number, isMandatory?: boolean) => {
    const validUnits = Math.max(0, units);
    const prod = products.find(p => p.id === productId);
    const pos = positions.find(p => p.id === positionType);
    
    setPositionModels(prev => {
      const model = prev[positionType];
      if (!model) return prev;
      
      const existing = model.productAllocations || [];
      const foundIdx = existing.findIndex(a => a.productId === productId);
      let updatedAllocations = [...existing];
      
      if (foundIdx >= 0) {
        updatedAllocations[foundIdx] = {
          ...updatedAllocations[foundIdx],
          units: validUnits,
          ...(isMandatory !== undefined ? { isMandatory } : {}),
        };
      } else {
        updatedAllocations.push({
          productId,
          units: validUnits,
          isMandatory: isMandatory ?? (prod?.launchTier === 'S'),
          notes: '自定义陈列配置',
        });
      }
      
      const totalCap = updatedAllocations.reduce((sum, a) => sum + a.units, 0);
      const mandatoryUnits = updatedAllocations.filter(a => a.isMandatory).reduce((sum, a) => sum + a.units, 0);
      const mandatoryRatio = totalCap > 0 ? Number((mandatoryUnits / totalCap).toFixed(2)) : 0;
      
      return {
        ...prev,
        [positionType]: {
          ...model,
          productAllocations: updatedAllocations,
          totalDisplayCapacity: totalCap,
          mandatoryRatio,
        },
      };
    });

    addAuditLog('DISPLAY_UPDATE', `调整阵地【${pos?.name || positionType}】中产品【${prod?.name || productId}】标准陈列为: ${validUnits}台/店`);
    showToast(`已更新【${pos?.name}】的【${prod?.name}】单店标准陈列为 ${validUnits} 台`);
  };

  const batchSetPositionProductUnits = (positionType: PositionType, allocations: PositionDisplayModel['productAllocations']) => {
    const pos = positions.find(p => p.id === positionType);
    const totalCap = allocations.reduce((sum, a) => sum + a.units, 0);
    const mandatoryUnits = allocations.filter(a => a.isMandatory).reduce((sum, a) => sum + a.units, 0);
    const mandatoryRatio = totalCap > 0 ? Number((mandatoryUnits / totalCap).toFixed(2)) : 0;

    setPositionModels(prev => ({
      ...prev,
      [positionType]: {
        ...prev[positionType],
        productAllocations: allocations,
        totalDisplayCapacity: totalCap,
        mandatoryRatio,
      },
    }));

    addAuditLog('DISPLAY_UPDATE', `批量更新阵地【${pos?.name || positionType}】的各产品样机陈列标准模型`);
    showToast(`已更新【${pos?.name}】全产品陈列标准模型`);
  };

  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setDisplayTables(INITIAL_DISPLAY_TABLES);
    setPositionModels(INITIAL_POSITION_DISPLAY_MODELS);
    setScenarios(INITIAL_SCENARIOS);
    setActiveScenarioId('launch_focused');
    setManualAdjustments({});
    setProvinceQuotaOverrides({});
    addAuditLog('QUOTA_ADJUST', '将系统所有配置重置为出厂预设基准状态');
    showToast('已恢复系统预设初始数据', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        planningPeriod,
        setPlanningPeriod,
        products,
        setProducts,
        positions,
        provinces,
        displayTables,
        setDisplayTables,
        positionModels,
        setPositionModels,
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
        provinceQuotaOverrides,
        adjustProvinceQuota,
        transferProvinceQuota,
        batchAdjustAllQuotas,
        updateTableSlot,
        addTableSlot,
        removeTableSlot,
        updatePositionTableQty,
        updatePositionProductUnits,
        batchSetPositionProductUnits,
        auditLogs,
        addAuditLog,
        toast,
        showToast,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
