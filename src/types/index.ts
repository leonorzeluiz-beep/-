export type ProductCategory = 'flagship_phone' | 'foldable_phone' | 'tablet' | 'wearable' | 'pc_laptop' | 'smart_screen' | 'audio_iot';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  modelCode: string;
  unitPrice: number; // 零售指导价
  sampleCost: number; // 样机核算成本
  launchTier: 'S' | 'A' | 'B'; // 新品首发推广级别
  lifecyclePhase: 'launch' | 'growth' | 'mature' | 'sunset'; // 生命周期阶段
  defaultDisplayPriority: number; // 陈列优先级 1-10
  colorOptions: string[];
  specs: string;
  recommendedTableTypes: string[];
}

export type PositionType = 
  | 'flagship_plus' // 旗舰级体验店 Plus (S级)
  | 'image_store_a' // 形象专卖店 (A级)
  | 'standard_store_b' // 标准专卖店 (B级)
  | 'telecom_flagship' // 运营商超级旗舰厅
  | 'ka_chain_3c' // 3C数码KA连锁大卖场
  | 'authorized_zone_c'; // 授权专区 (C级)

export interface ChannelPosition {
  id: PositionType;
  name: string;
  level: 'S' | 'A' | 'B' | 'KA' | 'C';
  description: string;
  avgAreaSqm: number;
  standardTableCount: number; // 标准陈列桌数量
  nationalStoreCount: number; // 全国总门店数
  colorTheme: string;
}

export interface Province {
  id: string;
  name: string;
  region: '华南' | '华东' | '华北' | '西南' | '华中' | '西北' | '东北';
  storeDistribution: Record<PositionType, number>; // 门店数分布
  salesWeight: number; // 销售权重占比 (例如 0.18 = 18%)
  historicalSalesVolume: number; // 历史月均销量(台)
  gdpTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  totalQuotaCap: number; // 样机额度上限(台)
  budgetCapRmb: number; // 样机预算上限(元)
}

// 样机额度分配记录
export interface QuotaAllocation {
  id: string;
  provinceId: string;
  positionType: PositionType;
  productId: string;
  allocatedQuota: number; // 分配台数
  maxCap: number; // 最大硬性上限
  minRequired: number; // 最低保底台数
  actualUsed: number; // 实际已绑定占用
  adjustedAmount: number; // 本期人工调整
  lastUpdated: string;
  status: 'normal' | 'warning' | 'exceeded';
}

// 陈列桌类型与槽位
export type TableCategory = 
  | 'center_island_1' // 主入口旗舰中岛1号桌
  | 'center_island_2' // 旗舰中岛2号桌
  | 'foldable_island' // 折叠屏高端尊享体验岛
  | 'pc_tablet_work' // 智慧办公/PC平板交互桌
  | 'health_audio' // 运动健康与穿戴音频台
  | 'iot_smart_home'; // 全场景智慧生活体验展台

export interface DisplaySlot {
  slotId: string;
  slotIndex: number; // 1-8
  slotName: string;
  targetCategory: ProductCategory;
  recommendedProductId: string;
  isRequired: boolean; // 必陈机位 vs 轮换机位
  preferredColor?: string;
  hasPowerSupply: boolean;
  hasAntiTheftLock: boolean;
  hasElectronicTag: boolean;
}

export interface DisplayTable {
  id: string;
  code: string;
  name: string;
  category: TableCategory;
  widthCm: number;
  depthCm: number;
  totalSlots: number;
  slots: DisplaySlot[];
  description: string;
  previewIcon: string;
}

// 阵地陈列模型中分产品的标准陈列台数规范
export interface PositionProductAllocation {
  productId: string;
  units: number; // 该阵地场景下单店标准陈列台数 (台/店)
  isMandatory: boolean; // 是否属于必陈机位
  preferredColor?: string;
  notes?: string;
}

// 阵地陈列模型 (阵地类型 对应的 各产品陈列标准台数与陈列桌组合配置要求)
export interface PositionDisplayModel {
  positionType: PositionType;
  positionName: string;
  productAllocations: PositionProductAllocation[]; // 分阵地场景的各样机产品标准台数清单
  tables: {
    tableId: string;
    tableCategory: TableCategory;
    tableName: string;
    quantity: number; // 该阵地该桌子配置数量
    slotsPerTable: number;
  }[];
  totalDisplayCapacity: number; // 单店总样机陈列容量 (台) = 各产品陈列台数之和
  powerSupplyCoveragePercent: number;
  mandatoryRatio: number; // 必陈机位占比
  notes: string;
}

// 样机规划试算因子
export interface SimulationFactors {
  // 基础因子与陈列收敛控制
  baseDisplayWeight: number; // 陈列模型基准需求权重 (0 - 1.5)
  displayConvergenceRatio?: number; // 陈列模型收敛/满足率系数 (0.4 - 1.0，用于平滑陈列大于额度矛盾)
  mandatorySlotProtection?: boolean; // 是否开启必陈机位 100% 刚性保底 (不被额度压缩削减)
  
  // 销售因子
  salesVolumeWeight: number; // 历史销量加权系数 (0 - 1.0)
  salesGrowthForecastWeight: number; // 销量增长预期因子 (0.8 - 1.5)
  salesPerSqmPremium: number; // 高坪效门店溢价倍数 (1.0 - 1.5)
  
  // 策略因子
  launchTierS_Multiplier: number; // S级新品样机加成系数 (1.0 - 2.0)
  launchTierA_Multiplier: number; // A级新品样机加成系数 (0.8 - 1.5)
  launchTierB_Multiplier: number; // B级新品样机加成系数 (0.5 - 1.2)
  strategicCityBoost: number; // 战略省份/一线核心商圈倾斜加成 (0% - 30%)
  kaCooperationBoost: number; // KA重点渠道合作加成 (0% - 25%)
  
  // 约束因子
  enforceQuotaCap: boolean; // 是否严格封顶于省份总额度
  maxStoreSaturationLimit: number; // 单店样机饱和度上限比例 (如 120%)
  lossAndTurnoverBufferPercent: number; // 损耗与周转备机率 (如 5%)
}

// 智能配平算法策略
export type AutoBalanceStrategy = 
  | 'mandatory_first' // 必陈机位优先保底 (锁死必陈，仅压缩轮换/可选机位)
  | 'position_tiered' // 阵地场景梯度削减 (S/A级保全品类，KA/B级保主力，C级专区精选)
  | 'sales_roi' // 销售效能产出优先 (高销省份与高坪效商圈高配，低潜门店收敛)
  | 'uniform'; // 全局等比线性收敛 (省内各品类等比缩放至额度红线)

// 试算方案定义
export type ScenarioId = 'standard_display' | 'sales_weighted' | 'launch_focused' | 'quota_balanced' | 'custom';

export interface SimulationScenario {
  id: ScenarioId;
  name: string;
  tag: string;
  description: string;
  factors: SimulationFactors;
  isCustom?: boolean;
}

// 试算结果明细 (逐省份/逐阵地/逐产品)
export interface SimulationResultRow {
  rowKey: string;
  provinceId: string;
  provinceName: string;
  region: string;
  positionType: PositionType;
  positionName: string;
  storeCount: number;
  productId: string;
  productName: string;
  productCategory: ProductCategory;
  launchTier: 'S' | 'A' | 'B';
  unitPrice: number;
  isMandatorySlot: boolean; // 是否属于该阵地必陈机位
  
  // 计算分解
  standardDisplayDemand: number; // 陈列模型SOP理论标准需求台数
  salesWeightedDemand: number; // 销售加权调整数
  strategyWeightedDemand: number; // 营销策略加权数
  rawCalculatedDemand: number; // 综合理论需求台数
  
  // 最终试算分配数 (考虑约束)
  finalPlannedUnits: number; // 最终规划试算台数
  manualAdjustOffset: number; // 人工微调量
  allocatedQuotaLimit: number; // 对应分配额度
  gapAgainstQuota: number; // 差额 (finalPlannedUnits - allocatedQuotaLimit)
  displayGap: number; // 相对SOP理论陈列的压缩差额 (finalPlannedUnits - standardDisplayDemand)
  quotaComplianceStatus: 'within_budget' | 'warning' | 'exceeded';
  
  totalPlannedCost: number; // 样机核算总成本
  avgUnitsPerStore: number; // 单店平均样机台数
}

export interface SimulationSummary {
  totalPlannedUnits: number;
  totalQuotaCap: number;
  quotaUtilizationRate: number; // 额度利用率 %
  totalPlannedBudgetRmb: number;
  totalStoresCovered: number;
  avgUnitsPerStore: number;
  
  // 供需缺口与收敛核心指标
  theoreticalDisplayDemand: number; // 理论全量陈列基准总需求 (未压缩时的理论值)
  displayToQuotaGap: number; // 理论需求与额度缺口 (理论需求 - 额度上限)
  displayToQuotaGapPercent: number; // 理论超额率 % = (理论需求 / 额度上限) * 100
  displayComplianceRate: number; // 陈列满足达标率 % = (最终规划 / 理论需求) * 100
  mandatoryUnitsPlanned: number; // 必陈机位已规划总台数
  mandatoryFulfillmentRate: number; // 必陈机位保障率 % (应为 100%)
  optionalUnitsPlanned: number; // 轮换/可选机位规划台数
  convergenceCompressionRate: number; // 额度收敛压缩率 %
  
  exceededProvincesCount: number;
  warningProvincesCount: number;
  healthyProvincesCount: number;
  productCategoryBreakdown: { category: ProductCategory; name: string; units: number; cost: number; sharePercent: number }[];
  positionTypeBreakdown: { positionType: PositionType; name: string; units: number; stores: number; avgPerStore: number }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  actionType: 'QUOTA_ADJUST' | 'DISPLAY_UPDATE' | 'SIMULATION_APPLY' | 'SCENARIO_CREATE' | 'QUOTA_TRANSFER';
  details: string;
}
