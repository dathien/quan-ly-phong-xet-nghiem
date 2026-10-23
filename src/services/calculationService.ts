import { Reagent, Batch, AlertLevel, AppSettings } from '../types';

export interface ReagentStockSummary {
  reagentId: string;
  totalAvailableUnits: number; // Q
  totalAvailableVolume: number; // V = Q * U
  volumeUnit: string;
  dailyBurnVolume: number | null; // D = T * R
  testsRemaining: number | null; // K = V / R
  daysRemaining: number | null; // N = V / D
  daysRemainingText: string;
  alertLevel: AlertLevel;
  alertReason: string;
  recommendedBatchForIssue: Batch | null;
  fefoExplanation: string;
  activeBatchesCount: number;
  hasExpiredBatches: boolean;
  hasQuarantinedBatches: boolean;
  hasNearExpiryBatches: boolean;
  isMissingCriticalData: boolean;
  missingDataReasons: string[];
}

/**
 * Checks if a date is expired relative to current reference date
 */
export function isExpired(expiryDateStr: string, refDate: Date = new Date('2026-10-22')): boolean {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr + 'T23:59:59');
  return expiry.getTime() < refDate.getTime();
}

/**
 * Calculates remaining days until expiration
 */
export function getDaysUntilExpiry(expiryDateStr: string, refDate: Date = new Date('2026-10-22')): number {
  if (!expiryDateStr) return 9999;
  const expiry = new Date(expiryDateStr + 'T23:59:59');
  const diffTime = expiry.getTime() - refDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Sorts batches by FEFO (First Expired, First Out)
 * Condition: Batch must be KHA_DUNG and not already expired.
 */
export function getFefoRecommendation(batches: Batch[], refDate: Date = new Date('2026-10-22')): {
  recommendedBatch: Batch | null;
  explanation: string;
  availableBatches: Batch[];
} {
  const available = batches.filter(b => b.status === 'KHA_DUNG' && b.remainingQuantity > 0 && !isExpired(b.expiryDate, refDate));

  if (available.length === 0) {
    return {
      recommendedBatch: null,
      explanation: 'Không có lô nào khả dụng để xuất (hết tồn, đang cách ly hoặc đã hết hạn).',
      availableBatches: []
    };
  }

  // Check if any batch is missing expiry date
  const missingExpiry = available.some(b => !b.expiryDate);
  if (missingExpiry) {
    return {
      recommendedBatch: available[0],
      explanation: 'Có lô thiếu hạn dùng; không thể khẳng định đã xếp hoàn toàn đúng FEFO.',
      availableBatches: available
    };
  }

  // Sort ascending by expiry date
  const sorted = [...available].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  const best = sorted[0];
  const daysLeft = getDaysUntilExpiry(best.expiryDate, refDate);

  return {
    recommendedBatch: best,
    explanation: `Đề xuất xuất lô ${best.batchNumber} theo FEFO vì có hạn dùng sớm nhất (${best.expiryDate}, còn ${daysLeft} ngày) trong các lô khả dụng.`,
    availableBatches: sorted
  };
}

/**
 * Main calculation of reagent stock and alerts
 */
export function calculateReagentStock(
  reagent: Reagent,
  allBatches: Batch[],
  settings: AppSettings,
  refDate: Date = new Date('2026-10-22')
): ReagentStockSummary {
  const reagentBatches = allBatches.filter(b => b.reagentId === reagent.id);
  const missingDataReasons: string[] = [];

  // Check missing critical data
  if (!reagent.unitVolume || reagent.unitVolume <= 0) {
    missingDataReasons.push('Thiếu dung tích mỗi đơn vị (unitVolume)');
  }
  if (!reagent.consumptionPerTest || reagent.consumptionPerTest <= 0) {
    missingDataReasons.push('Thiếu mức tiêu hao/test (R)');
  }
  if (reagent.averageTestsPerDay === undefined || reagent.averageTestsPerDay === null || reagent.averageTestsPerDay <= 0) {
    missingDataReasons.push('Thiếu số test trung bình/ngày (T)');
  }

  // Calculate available units Q
  const availableBatches = reagentBatches.filter(b => b.status === 'KHA_DUNG' && b.remainingQuantity > 0 && !isExpired(b.expiryDate, refDate));
  const totalAvailableUnits = availableBatches.reduce((acc, b) => acc + (b.remainingQuantity || 0), 0);

  // V = Q * U
  const unitVol = reagent.unitVolume || 0;
  const totalAvailableVolume = totalAvailableUnits * unitVol;

  // D = T * R
  const T = reagent.averageTestsPerDay || 0;
  const R = reagent.consumptionPerTest || 0;
  const D = T * R;

  let dailyBurnVolume: number | null = null;
  let testsRemaining: number | null = null;
  let daysRemaining: number | null = null;
  let daysRemainingText = '';

  if (T > 0 && R > 0 && unitVol > 0) {
    dailyBurnVolume = D;
    testsRemaining = Math.floor(totalAvailableVolume / R);
    if (D > 0) {
      daysRemaining = Math.floor(totalAvailableVolume / D);
      daysRemainingText = `${daysRemaining} ngày`;
    } else {
      daysRemainingText = 'Chưa thể tính số ngày còn do chưa có mức tiêu hao hợp lệ.';
    }
  } else {
    daysRemainingText = 'Chưa thể tính số ngày còn do chưa có mức tiêu hao hợp lệ.';
  }

  // Check batch statuses
  const hasExpiredBatches = reagentBatches.some(b => b.status === 'HET_HAN' || isExpired(b.expiryDate, refDate));
  const hasQuarantinedBatches = reagentBatches.some(b => b.status === 'CACH_LY' || b.status === 'CHO_KIEM_TRA');
  const hasNearExpiryBatches = reagentBatches.some(b => b.status === 'KHA_DUNG' && getDaysUntilExpiry(b.expiryDate, refDate) <= settings.nearExpiryAlertDays && !isExpired(b.expiryDate, refDate));

  const { recommendedBatch, explanation } = getFefoRecommendation(reagentBatches, refDate);

  // Determine Alert Level
  let alertLevel: AlertLevel = 'GREEN';
  let alertReason = 'Tồn kho trong ngưỡng an toàn';

  if (missingDataReasons.length > 0) {
    alertLevel = 'INSUFFICIENT_DATA';
    alertReason = `Chưa đủ dữ liệu: ${missingDataReasons.join(', ')}`;
  } else if (totalAvailableUnits === 0) {
    alertLevel = 'RED';
    alertReason = 'Hết hàng khả dụng trong kho (Tồn = 0)';
  } else if (daysRemaining !== null && daysRemaining < settings.thresholdRedDays) {
    alertLevel = 'RED';
    alertReason = `Thời gian tồn kho còn lại dưới ${settings.thresholdRedDays} ngày (${daysRemaining} ngày)`;
  } else if (reagent.minStockThreshold && totalAvailableUnits < reagent.minStockThreshold) {
    alertLevel = 'RED';
    alertReason = `Tồn kho khả dụng (${totalAvailableUnits} ${reagent.unit}) dưới ngưỡng tối thiểu (${reagent.minStockThreshold} ${reagent.unit})`;
  } else if (daysRemaining !== null && daysRemaining < settings.thresholdOrangeDays) {
    alertLevel = 'ORANGE';
    alertReason = `Thời gian tồn kho còn từ 7 đến dưới ${settings.thresholdOrangeDays} ngày (${daysRemaining} ngày)`;
  } else if (daysRemaining !== null && daysRemaining <= settings.thresholdYellowDays) {
    alertLevel = 'YELLOW';
    alertReason = `Thời gian tồn kho trong vùng cảnh báo vàng 15-30 ngày (${daysRemaining} ngày)`;
  } else {
    alertLevel = 'GREEN';
    alertReason = 'Mức tồn an toàn trên 30 ngày';
  }

  return {
    reagentId: reagent.id,
    totalAvailableUnits,
    totalAvailableVolume,
    volumeUnit: reagent.volumeUnit,
    dailyBurnVolume,
    testsRemaining,
    daysRemaining,
    daysRemainingText,
    alertLevel,
    alertReason,
    recommendedBatchForIssue: recommendedBatch,
    fefoExplanation: explanation,
    activeBatchesCount: reagentBatches.length,
    hasExpiredBatches,
    hasQuarantinedBatches,
    hasNearExpiryBatches,
    isMissingCriticalData: missingDataReasons.length > 0,
    missingDataReasons
  };
}
