import {
  Product,
  ChannelPosition,
  Province,
  PositionDisplayModel,
  DisplayTable,
  SimulationFactors,
  SimulationResultRow,
  SimulationSummary,
  PositionType,
  ProductCategory,
  AutoBalanceStrategy
} from '../types';

/**
 * 计算某阵地类型单店对某具体产品的标准陈列需求台数 (分阵地场景的各样机产品数)
 */
export function getProductStandardSlotCount(
  positionModel: PositionDisplayModel,
  displayTables: DisplayTable[],
  productId: string
): number {
  if (!positionModel) return 0;
  
  // 优先从阵地陈列模型中分产品的标准陈列配置清单获取
  if (positionModel.productAllocations && positionModel.productAllocations.length > 0) {
    const alloc = positionModel.productAllocations.find(a => a.productId === productId);
    if (alloc !== undefined) {
      return alloc.units;
    }
  }

  // 备用：从陈列桌台和槽位汇总统计
  let count = 0;
  for (const tableConfig of positionModel.tables || []) {
    const tableDef = displayTables.find(t => t.id === tableConfig.tableId);
    if (!tableDef) continue;
    
    const slotsForProduct = tableDef.slots.filter(s => s.recommendedProductId === productId).length;
    count += slotsForProduct * tableConfig.quantity;
  }
  return count;
}

/**
 * 判断某阵地场景下某产品是否属于必陈机位
 */
export function isProductMandatoryInPosition(
  positionModel: PositionDisplayModel,
  productId: string,
  launchTier: string
): boolean {
  if (!positionModel) return launchTier === 'S';
  const alloc = positionModel.productAllocations?.find(a => a.productId === productId);
  if (alloc !== undefined) return alloc.isMandatory;
  return launchTier === 'S';
}

/**
 * 执行多因子样机规划试算
 */
export function runSimulationCalculation(
  products: Product[],
  positions: ChannelPosition[],
  provinces: Province[],
  positionModels: Record<string, PositionDisplayModel>,
  displayTables: DisplayTable[],
  factors: SimulationFactors,
  manualAdjustments: Record<string, number> = {}, // key: `${provinceId}_${positionType}_${productId}`
  provinceQuotaOverrides: Record<string, number> = {} // provinceId -> quota
): {
  rows: SimulationResultRow[];
  summary: SimulationSummary;
} {
  const rows: SimulationResultRow[] = [];
  const convergenceRatio = factors.displayConvergenceRatio ?? 1.0;
  const isMandatoryProtected = factors.mandatorySlotProtection !== false;
  
  // 按照省份 -> 阵地类型 -> 产品 进行笛卡尔乘积遍历计算
  for (const province of provinces) {
    const provinceQuotaCap = provinceQuotaOverrides[province.id] ?? province.totalQuotaCap;
    
    // 计算该省份对各阵地和各产品的原始需求
    for (const position of positions) {
      const storeCount = province.storeDistribution[position.id] || 0;
      if (storeCount === 0) continue;
      
      const posModel = positionModels[position.id];
      if (!posModel) continue;

      for (const product of products) {
        const rowKey = `${province.id}__${position.id}__${product.id}`;
        
        // 1. 标准陈列基准需求: 单店标配台数 * 门店数
        const singleStoreStdUnits = getProductStandardSlotCount(posModel, displayTables, product.id);
        const standardDisplayDemand = Math.round(singleStoreStdUnits * storeCount);
        const isMandatorySlot = isProductMandatoryInPosition(posModel, product.id, product.launchTier);
        
        if (singleStoreStdUnits === 0 && standardDisplayDemand === 0) {
          if (product.launchTier !== 'S' || position.level === 'C') {
            continue;
          }
        }
        
        // 2. 陈列收敛基准需求 (考虑陈列权重、收敛系数及通电展台保障系数)
        const powerConstraint = factors.powerSupplyConstraintWeight
          ? ((posModel.powerSupplyCoveragePercent / 100) * factors.powerSupplyConstraintWeight + (1 - factors.powerSupplyConstraintWeight))
          : 1.0;
        const baseDemand = Math.round(standardDisplayDemand * factors.baseDisplayWeight * convergenceRatio * powerConstraint);
        
        // 3. 销售赋能因子加权: 
        const normalizedSalesFactor = (province.salesWeight / 0.10);
        const salesWeightAdjust = factors.salesVolumeWeight > 0
          ? (1 + (normalizedSalesFactor - 1) * factors.salesVolumeWeight * factors.salesGrowthForecastWeight)
          : 1.0;
        
        // 坪效加成 (S/A级门店受坪效因子影响大)
        const sqrPremium = (position.level === 'S' || position.level === 'A') 
          ? factors.salesPerSqmPremium 
          : 1.0;
        
        // 专职体验顾问/促销员赋能加成
        const repBoost = factors.repEffectivenessBoost ? (1 + factors.repEffectivenessBoost * (position.level === 'S' || position.level === 'A' ? 1.0 : 0.5)) : 1.0;
        
        // 高端机型转化倾斜 (针对Tier 1省份的折叠屏与高端机)
        const isHighEnd = (product.category === 'flagship_phone' || product.category === 'foldable_phone') && (product.name.includes('X6') || product.name.includes('Fold') || product.name.includes('Pro+'));
        const highEndBoost = (isHighEnd && province.gdpTier === 'Tier 1' && factors.highEndConversionPremium)
          ? factors.highEndConversionPremium
          : 1.0;
          
        const salesWeightedDemand = Math.round(baseDemand * salesWeightAdjust * sqrPremium * repBoost * highEndBoost);
        
        // 4. 营销策略因子加权
        let tierMultiplier = 1.0;
        if (product.launchTier === 'S') tierMultiplier = factors.launchTierS_Multiplier;
        else if (product.launchTier === 'A') tierMultiplier = factors.launchTierA_Multiplier;
        else tierMultiplier = factors.launchTierB_Multiplier;
        
        // 重点战略省份加成 (GDP Tier 1 省份享受倾斜)
        const cityBoost = province.gdpTier === 'Tier 1' ? (1 + factors.strategicCityBoost) : 1.0;
        // KA渠道加成
        const kaBoost = (position.level === 'KA') ? (1 + factors.kaCooperationBoost) : 1.0;
        // 核心商圈竞品压制加成
        const competitorBoost = (factors.competitorSuppressionBoost && (position.level === 'S' || position.level === 'A'))
          ? (1 + factors.competitorSuppressionBoost)
          : 1.0;
        // 生命周期收敛系数
        const lifecycleMultiplier = (product.lifecyclePhase === 'mature' || product.lifecyclePhase === 'sunset') && factors.lifeCyclePhaseMultiplier
          ? factors.lifeCyclePhaseMultiplier
          : 1.0;
        
        const strategyMultiplier = tierMultiplier * cityBoost * kaBoost * competitorBoost * lifecycleMultiplier;
        const strategyWeightedDemand = Math.round(salesWeightedDemand * strategyMultiplier);
        
        // 5. 周转与损耗缓冲 (包含补货周期换算)
        const cycleBufferPercent = factors.replenishmentCycleDays
          ? ((factors.replenishmentCycleDays / 30) * 0.015)
          : 0;
        const totalBufferRate = factors.lossAndTurnoverBufferPercent + cycleBufferPercent;
        const rawWithBuffer = Math.round(strategyWeightedDemand * (1 + totalBufferRate));
        
        // 考虑下沉网点保底底线 (如果该产品属于该店核心必陈品)
        let rawCalculatedDemand = Math.max(0, rawWithBuffer);
        if (factors.minStoreFloorStockUnits && isMandatorySlot && storeCount > 0) {
          rawCalculatedDemand = Math.max(rawCalculatedDemand, factors.minStoreFloorStockUnits * storeCount);
        }
        
        // 6. 考虑单店饱和度限制
        const maxAllowedPerStore = Math.ceil(posModel.totalDisplayCapacity * factors.maxStoreSaturationLimit);
        const cappedByStoreCapacity = Math.min(rawCalculatedDemand, maxAllowedPerStore * storeCount);
        
        // 7. 人工微调量
        const manualOffset = manualAdjustments[rowKey] || 0;
        let finalPlannedUnits = Math.max(0, cappedByStoreCapacity + manualOffset);
        
        // 计算理论分摊的额度上限 (供逐行对齐参考)
        const allocatedQuotaLimit = Math.round(
          (provinceQuotaCap * province.salesWeight * (product.launchTier === 'S' ? 0.35 : 0.15)) / positions.length
        );
        
        const gapAgainstQuota = finalPlannedUnits - allocatedQuotaLimit;
        const displayGap = finalPlannedUnits - standardDisplayDemand;
        const totalPlannedCost = finalPlannedUnits * product.sampleCost;
        const avgUnitsPerStore = storeCount > 0 ? Number((finalPlannedUnits / storeCount).toFixed(2)) : 0;
        
        rows.push({
          rowKey,
          provinceId: province.id,
          provinceName: province.name,
          region: province.region,
          positionType: position.id,
          positionName: position.name,
          storeCount,
          productId: product.id,
          productName: product.name,
          productCategory: product.category,
          launchTier: product.launchTier,
          unitPrice: product.unitPrice,
          isMandatorySlot,
          standardDisplayDemand,
          salesWeightedDemand,
          strategyWeightedDemand,
          rawCalculatedDemand,
          finalPlannedUnits,
          manualAdjustOffset: manualOffset,
          allocatedQuotaLimit,
          gapAgainstQuota,
          displayGap,
          quotaComplianceStatus: 'within_budget',
          totalPlannedCost,
          avgUnitsPerStore,
        });
      }
    }
  }
  
  // 8. 如果开启了全局额度硬性约束 (enforceQuotaCap)，按省份对超额情况进行智能梯度压缩与配平
  if (factors.enforceQuotaCap) {
    for (const province of provinces) {
      const provinceCap = provinceQuotaOverrides[province.id] ?? province.totalQuotaCap;
      const provinceRows = rows.filter(r => r.provinceId === province.id);
      const totalProvincePlanned = provinceRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
      
      if (totalProvincePlanned > provinceCap && totalProvincePlanned > 0) {
        const excess = totalProvincePlanned - provinceCap;
        
        if (isMandatoryProtected) {
          // 方案A：必陈机位优先保底。仅对可选/轮换机位进行强压缩
          const optionalRows = provinceRows.filter(r => !r.isMandatorySlot && r.launchTier !== 'S');
          const optionalTotal = optionalRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
          
          if (optionalTotal >= excess) {
            // 可选机位足以吸收全部超额
            const compressRatio = (optionalTotal - excess) / optionalTotal;
            for (const row of optionalRows) {
              row.finalPlannedUnits = Math.max(0, Math.round(row.finalPlannedUnits * compressRatio));
              row.totalPlannedCost = row.finalPlannedUnits * (products.find(p => p.id === row.productId)?.sampleCost || 3000);
              row.avgUnitsPerStore = row.storeCount > 0 ? Number((row.finalPlannedUnits / row.storeCount).toFixed(2)) : 0;
              row.displayGap = row.finalPlannedUnits - row.standardDisplayDemand;
            }
          } else {
            // 可选机位清零后仍超额，剩余超额由必陈机位极轻度分摊
            for (const row of optionalRows) {
              row.finalPlannedUnits = 0;
              row.totalPlannedCost = 0;
              row.avgUnitsPerStore = 0;
              row.displayGap = -row.standardDisplayDemand;
            }
            const remainingExcess = excess - optionalTotal;
            const mandatoryRows = provinceRows.filter(r => r.isMandatorySlot || r.launchTier === 'S');
            const mandatoryTotal = mandatoryRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
            if (mandatoryTotal > 0) {
              const mRatio = (mandatoryTotal - remainingExcess) / mandatoryTotal;
              for (const row of mandatoryRows) {
                row.finalPlannedUnits = Math.max(1, Math.round(row.finalPlannedUnits * mRatio));
                row.totalPlannedCost = row.finalPlannedUnits * (products.find(p => p.id === row.productId)?.sampleCost || 3000);
                row.avgUnitsPerStore = row.storeCount > 0 ? Number((row.finalPlannedUnits / row.storeCount).toFixed(2)) : 0;
                row.displayGap = row.finalPlannedUnits - row.standardDisplayDemand;
              }
            }
          }
        } else {
          // 方案B：全品类等比缩放
          const ratio = provinceCap / totalProvincePlanned;
          for (const row of provinceRows) {
            row.finalPlannedUnits = Math.max(0, Math.round(row.finalPlannedUnits * ratio));
            row.totalPlannedCost = row.finalPlannedUnits * (products.find(p => p.id === row.productId)?.sampleCost || 3000);
            row.avgUnitsPerStore = row.storeCount > 0 ? Number((row.finalPlannedUnits / row.storeCount).toFixed(2)) : 0;
            row.displayGap = row.finalPlannedUnits - row.standardDisplayDemand;
          }
        }
      }
    }
  }

  // 9. 汇总省份层面的合规状态
  for (const row of rows) {
    const provinceCap = provinceQuotaOverrides[row.provinceId] ?? (provinces.find(p => p.id === row.provinceId)?.totalQuotaCap || 5000);
    const provinceTotal = rows.filter(r => r.provinceId === row.provinceId).reduce((sum, r) => sum + r.finalPlannedUnits, 0);
    const utilization = provinceTotal / provinceCap;
    
    if (utilization > 1.05) {
      row.quotaComplianceStatus = 'exceeded';
    } else if (utilization >= 0.90) {
      row.quotaComplianceStatus = 'warning';
    } else {
      row.quotaComplianceStatus = 'within_budget';
    }
  }

  // 10. 构建全局汇总数据指标
  const totalPlannedUnits = rows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
  const totalQuotaCap = provinces.reduce((sum, p) => sum + (provinceQuotaOverrides[p.id] ?? p.totalQuotaCap), 0);
  const totalPlannedBudgetRmb = rows.reduce((sum, r) => sum + r.totalPlannedCost, 0);
  
  // 理论全量陈列总需求 (未压缩时的理想SOP全铺量)
  const theoreticalDisplayDemand = rows.reduce((sum, r) => sum + r.standardDisplayDemand, 0);
  const displayToQuotaGap = theoreticalDisplayDemand - totalQuotaCap;
  const displayToQuotaGapPercent = totalQuotaCap > 0 ? Number(((theoreticalDisplayDemand / totalQuotaCap) * 100).toFixed(1)) : 0;
  
  // 计算总覆盖门店数
  const totalStoresCovered = provinces.reduce((sum, p) => {
    return sum + Object.values(p.storeDistribution).reduce((s, c) => s + c, 0);
  }, 0);
  
  const avgUnitsPerStore = totalStoresCovered > 0 ? Number((totalPlannedUnits / totalStoresCovered).toFixed(2)) : 0;
  const quotaUtilizationRate = totalQuotaCap > 0 ? Number(((totalPlannedUnits / totalQuotaCap) * 100).toFixed(1)) : 0;
  
  // 计算陈列达标满足率: 最终规划数 vs 理论基准需求
  const displayComplianceRate = theoreticalDisplayDemand > 0 
    ? Number(((totalPlannedUnits / theoreticalDisplayDemand) * 100).toFixed(1)) 
    : 100;
    
  // 必陈机位与可选机位拆解
  const mandatoryRows = rows.filter(r => r.isMandatorySlot || r.launchTier === 'S');
  const mandatoryUnitsPlanned = mandatoryRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
  const mandatoryStdDemand = mandatoryRows.reduce((sum, r) => sum + r.standardDisplayDemand, 0);
  const mandatoryFulfillmentRate = mandatoryStdDemand > 0 
    ? Number((Math.min(100, (mandatoryUnitsPlanned / mandatoryStdDemand) * 100)).toFixed(1))
    : 100;
  const optionalUnitsPlanned = totalPlannedUnits - mandatoryUnitsPlanned;
  
  const convergenceCompressionRate = theoreticalDisplayDemand > 0
    ? Number((((theoreticalDisplayDemand - totalPlannedUnits) / theoreticalDisplayDemand) * 100).toFixed(1))
    : 0;
  
  // 省份健康度统计
  let exceededProvincesCount = 0;
  let warningProvincesCount = 0;
  let healthyProvincesCount = 0;
  
  for (const p of provinces) {
    const cap = provinceQuotaOverrides[p.id] ?? p.totalQuotaCap;
    const provUnits = rows.filter(r => r.provinceId === p.id).reduce((sum, r) => sum + r.finalPlannedUnits, 0);
    const rate = provUnits / cap;
    if (rate > 1.05) exceededProvincesCount++;
    else if (rate >= 0.90) warningProvincesCount++;
    else healthyProvincesCount++;
  }
  
  // 按产品品类分组统计
  const categoryMap: Record<ProductCategory, { name: string; units: number; cost: number }> = {
    flagship_phone: { name: '旗舰直板手机', units: 0, cost: 0 },
    foldable_phone: { name: '折叠屏旗舰', units: 0, cost: 0 },
    tablet: { name: '智慧平板', units: 0, cost: 0 },
    pc_laptop: { name: 'PC笔记本', units: 0, cost: 0 },
    wearable: { name: '运动穿戴', units: 0, cost: 0 },
    audio_iot: { name: '智能音频', units: 0, cost: 0 },
    smart_screen: { name: '智慧大屏', units: 0, cost: 0 },
  };
  
  for (const r of rows) {
    if (categoryMap[r.productCategory]) {
      categoryMap[r.productCategory].units += r.finalPlannedUnits;
      categoryMap[r.productCategory].cost += r.totalPlannedCost;
    }
  }
  
  const productCategoryBreakdown = Object.entries(categoryMap).map(([cat, val]) => ({
    category: cat as ProductCategory,
    name: val.name,
    units: val.units,
    cost: val.cost,
    sharePercent: totalPlannedUnits > 0 ? Number(((val.units / totalPlannedUnits) * 100).toFixed(1)) : 0,
  }));
  
  // 按阵地类型分组统计
  const positionTypeBreakdown = positions.map(pos => {
    const posRows = rows.filter(r => r.positionType === pos.id);
    const units = posRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
    const stores = provinces.reduce((sum, p) => sum + (p.storeDistribution[pos.id] || 0), 0);
    return {
      positionType: pos.id,
      name: pos.name,
      units,
      stores,
      avgPerStore: stores > 0 ? Number((units / stores).toFixed(1)) : 0,
    };
  });

  const summary: SimulationSummary = {
    totalPlannedUnits,
    totalQuotaCap,
    quotaUtilizationRate,
    totalPlannedBudgetRmb,
    totalStoresCovered,
    avgUnitsPerStore,
    theoreticalDisplayDemand,
    displayToQuotaGap,
    displayToQuotaGapPercent,
    displayComplianceRate,
    mandatoryUnitsPlanned,
    mandatoryFulfillmentRate,
    optionalUnitsPlanned,
    convergenceCompressionRate,
    exceededProvincesCount,
    warningProvincesCount,
    healthyProvincesCount,
    productCategoryBreakdown,
    positionTypeBreakdown,
  };

  return { rows, summary };
}

/**
 * 智能一键配平多策略算法：
 * 针对当前超额的省份，提供4种科学收敛策略将其压减至额度红线内
 */
export function autoBalanceExceededProvinces(
  rows: SimulationResultRow[],
  provinces: Province[],
  provinceQuotaOverrides: Record<string, number> = {},
  strategy: AutoBalanceStrategy = 'mandatory_first'
): Record<string, number> {
  const newAdjustments: Record<string, number> = {};
  
  for (const province of provinces) {
    const cap = provinceQuotaOverrides[province.id] ?? province.totalQuotaCap;
    const provRows = rows.filter(r => r.provinceId === province.id);
    const totalCurrent = provRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
    
    if (totalCurrent > cap) {
      const excess = totalCurrent - cap;
      
      if (strategy === 'mandatory_first') {
        // 策略1：必陈机位绝对保底。只压缩轮换/长尾可选机位
        const shrinkableRows = provRows.filter(r => !r.isMandatorySlot && r.launchTier !== 'S');
        const shrinkableTotal = shrinkableRows.reduce((sum, r) => sum + r.finalPlannedUnits, 0);
        
        if (shrinkableTotal > 0) {
          const cutRatio = Math.min(1.0, excess / shrinkableTotal);
          for (const row of shrinkableRows) {
            const cut = Math.round(row.finalPlannedUnits * cutRatio);
            newAdjustments[row.rowKey] = (row.manualAdjustOffset || 0) - cut;
          }
        }
      } else if (strategy === 'position_tiered') {
        // 策略2：阵地场景梯度削减 (C级专区与KA大卖场优先缩减)
        const cRows = provRows.filter(r => r.positionType === 'authorized_zone_c');
        const kaRows = provRows.filter(r => r.positionType === 'ka_chain_3c' || r.positionType === 'standard_store_b');
        const highRows = provRows.filter(r => r.positionType === 'flagship_plus' || r.positionType === 'image_store_a');
        
        const cTotal = cRows.reduce((s, r) => s + r.finalPlannedUnits, 0);
        const kaTotal = kaRows.reduce((s, r) => s + r.finalPlannedUnits, 0);
        
        // 优先从C级专区削减50%超额，KA/B级削减40%，剩余10%从高端店削减
        for (const row of cRows) {
          if (!row.isMandatorySlot) {
            const cut = Math.round((row.finalPlannedUnits / (cTotal || 1)) * (excess * 0.5));
            newAdjustments[row.rowKey] = (row.manualAdjustOffset || 0) - cut;
          }
        }
        for (const row of kaRows) {
          if (!row.isMandatorySlot) {
            const cut = Math.round((row.finalPlannedUnits / (kaTotal || 1)) * (excess * 0.4));
            newAdjustments[row.rowKey] = (row.manualAdjustOffset || 0) - cut;
          }
        }
      } else if (strategy === 'sales_roi') {
        // 策略3：销售效能产出优先 (低坪效、长尾B级品优先削减)
        const lowRoiRows = provRows.filter(r => r.launchTier === 'B' || r.productCategory === 'smart_screen' || r.productCategory === 'audio_iot');
        const lowRoiTotal = lowRoiRows.reduce((s, r) => s + r.finalPlannedUnits, 0);
        
        if (lowRoiTotal > 0) {
          for (const row of lowRoiRows) {
            const cut = Math.round((row.finalPlannedUnits / lowRoiTotal) * excess);
            newAdjustments[row.rowKey] = (row.manualAdjustOffset || 0) - cut;
          }
        }
      } else {
        // 策略4：全局等比均匀收敛
        for (const row of provRows) {
          const cut = Math.round((row.finalPlannedUnits / totalCurrent) * excess);
          newAdjustments[row.rowKey] = (row.manualAdjustOffset || 0) - cut;
        }
      }
    }
  }
  
  return newAdjustments;
}

/**
 * 导出试算与规划数据为 CSV 文件
 */
export function exportRowsToCsv(rows: SimulationResultRow[], filename = '样机资源规划与试算结果.csv') {
  const headers = [
    '省份',
    '区域',
    '阵地类型',
    '门店数',
    '产品品类',
    '产品名称',
    '推广级别',
    '机位属性',
    '单价(元)',
    'SOP理论陈列需求(台)',
    '销售加权需求(台)',
    '策略加权需求(台)',
    '最终试算规划台数',
    '人工微调数',
    '相对理论陈列缺口',
    '单店平均台数',
    '样机核算成本(元)',
    '额度合规状态'
  ];
  
  const statusMap = {
    within_budget: '合规在控',
    warning: '预警关注',
    exceeded: '超额预警'
  };

  const csvRows = [
    headers.join(','),
    ...rows.map(r => [
      `"${r.provinceName}"`,
      `"${r.region}"`,
      `"${r.positionName}"`,
      r.storeCount,
      `"${r.productCategory}"`,
      `"${r.productName}"`,
      r.launchTier,
      r.isMandatorySlot ? '必陈机位' : '轮换机位',
      r.unitPrice,
      r.standardDisplayDemand,
      r.salesWeightedDemand,
      r.strategyWeightedDemand,
      r.finalPlannedUnits,
      r.manualAdjustOffset,
      r.displayGap,
      r.avgUnitsPerStore,
      r.totalPlannedCost,
      `"${statusMap[r.quotaComplianceStatus]}"`
    ].join(','))
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
