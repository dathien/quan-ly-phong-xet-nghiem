import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  HelpCircle,
  ShieldAlert,
  Thermometer,
  Layers,
  MapPin,
  ExternalLink,
  CheckCircle,
  Filter
} from 'lucide-react';
import { Reagent, Batch, Cabinet, TemperatureLog, AppSettings } from '../types';
import { calculateReagentStock, isExpired, getDaysUntilExpiry } from '../services/calculationService';

interface StockAlertsViewProps {
  reagents: Reagent[];
  batches: Batch[];
  cabinets: Cabinet[];
  temperatureLogs: TemperatureLog[];
  settings: AppSettings;
  onNavigateToReagent: (reagentId: string) => void;
  onNavigateToBatch: (batchId: string) => void;
  onNavigateToTransactions: () => void;
}

export interface DetailedAlertItem {
  id: string;
  category: 'CRITICAL_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY' | 'QUARANTINE' | 'MISSING_DATA' | 'MISSING_LOCATION' | 'TEMP_VIOLATION';
  level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREY';
  reagentName: string;
  reagentCode: string;
  batchNumber?: string;
  locationId?: string;
  cause: string;
  priority: 'Khẩn cấp (P1)' | 'Ưu tiên cao (P2)' | 'Cần rà soát (P3)';
  suggestedAction: string;
  reagentId?: string;
  batchId?: string;
}

export const StockAlertsView: React.FC<StockAlertsViewProps> = ({
  reagents,
  batches,
  cabinets,
  temperatureLogs,
  settings,
  onNavigateToReagent,
  onNavigateToBatch,
  onNavigateToTransactions
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const reagentMap = new Map(reagents.map(r => [r.id, r]));
  const alertsList: DetailedAlertItem[] = [];

  // 1. Stock level alerts from calculation
  reagents.forEach(r => {
    if (!r.isActive) return;
    const stock = calculateReagentStock(r, batches, settings);

    if (stock.alertLevel === 'RED') {
      alertsList.push({
        id: `alert-stock-red-${r.id}`,
        category: 'CRITICAL_STOCK',
        level: 'RED',
        reagentName: r.name,
        reagentCode: r.code,
        locationId: 'Nhiều vị trí',
        cause: stock.alertReason,
        priority: 'Khẩn cấp (P1)',
        suggestedAction: 'Lập dự trù đặt hàng khẩn hoặc điều chuyển từ cơ sở dự phòng để tránh đứt gãy xét nghiệm.',
        reagentId: r.id
      });
    } else if (stock.alertLevel === 'ORANGE') {
      alertsList.push({
        id: `alert-stock-orange-${r.id}`,
        category: 'CRITICAL_STOCK',
        level: 'ORANGE',
        reagentName: r.name,
        reagentCode: r.code,
        cause: stock.alertReason,
        priority: 'Ưu tiên cao (P2)',
        suggestedAction: 'Bổ sung vào danh mục dự trù đợt mua sắm định kỳ sắp tới.',
        reagentId: r.id
      });
    } else if (stock.alertLevel === 'YELLOW') {
      alertsList.push({
        id: `alert-stock-yellow-${r.id}`,
        category: 'CRITICAL_STOCK',
        level: 'YELLOW',
        reagentName: r.name,
        reagentCode: r.code,
        cause: stock.alertReason,
        priority: 'Cần rà soát (P3)',
        suggestedAction: 'Theo dõi tốc độ tiêu hao thực tế theo tuần.',
        reagentId: r.id
      });
    } else if (stock.alertLevel === 'INSUFFICIENT_DATA') {
      alertsList.push({
        id: `alert-missing-${r.id}`,
        category: 'MISSING_DATA',
        level: 'RED',
        reagentName: r.name,
        reagentCode: r.code,
        cause: `CHƯA ĐỦ DỮ LIỆU – CẦN XÁC MINH: ${stock.missingDataReasons.join(', ')}`,
        priority: 'Khẩn cấp (P1)',
        suggestedAction: 'Cập nhật định mức tiêu hao/test (R) hoặc dung tích đơn vị (U) trong danh mục.',
        reagentId: r.id
      });
    }
  });

  // 2. Expired Batches (Hóa chất quá hạn)
  batches.forEach(b => {
    const rg = reagentMap.get(b.reagentId);
    if (!rg) return;
    const expired = isExpired(b.expiryDate) || b.status === 'HET_HAN';

    if (expired && b.remainingQuantity > 0) {
      alertsList.push({
        id: `alert-expired-${b.id}`,
        category: 'EXPIRED',
        level: 'RED',
        reagentName: rg.name,
        reagentCode: rg.code,
        batchNumber: b.batchNumber,
        locationId: b.locationId || 'Chưa rõ',
        cause: `Lô đã hết hạn vào ngày ${b.expiryDate} (Còn tồn ${b.remainingQuantity} ${b.unit})`,
        priority: 'Khẩn cấp (P1)',
        suggestedAction: 'Khóa trạng thái HET_HAN, dán nhãn cách ly niêm phong và làm thủ tục tiêu hủy theo SOP-KHO-08.',
        reagentId: rg.id,
        batchId: b.id
      });
    }
  });

  // 3. Near-expiry Batches (Hóa chất cận hạn <= 30 ngày)
  batches.forEach(b => {
    const rg = reagentMap.get(b.reagentId);
    if (!rg) return;
    const expired = isExpired(b.expiryDate) || b.status === 'HET_HAN';
    const daysLeft = getDaysUntilExpiry(b.expiryDate);

    if (!expired && daysLeft <= settings.nearExpiryAlertDays && b.remainingQuantity > 0 && b.status === 'KHA_DUNG') {
      alertsList.push({
        id: `alert-nearexp-${b.id}`,
        category: 'NEAR_EXPIRY',
        level: daysLeft <= 7 ? 'RED' : 'ORANGE',
        reagentName: rg.name,
        reagentCode: rg.code,
        batchNumber: b.batchNumber,
        locationId: b.locationId || 'Chưa rõ',
        cause: `Lô cận hạn dùng (${b.expiryDate}, còn ${daysLeft} ngày)`,
        priority: daysLeft <= 7 ? 'Khẩn cấp (P1)' : 'Ưu tiên cao (P2)',
        suggestedAction: 'Áp dụng tuyệt đối quy tắc FEFO, đưa lô ra hàng đầu khay cấp phát.',
        reagentId: rg.id,
        batchId: b.id
      });
    }
  });

  // 4. Quarantined Batches (Hàng đang cách ly)
  batches.forEach(b => {
    const rg = reagentMap.get(b.reagentId);
    if (!rg) return;
    if (b.status === 'CACH_LY' && b.remainingQuantity > 0) {
      alertsList.push({
        id: `alert-quarantine-${b.id}`,
        category: 'QUARANTINE',
        level: 'ORANGE',
        reagentName: rg.name,
        reagentCode: rg.code,
        batchNumber: b.batchNumber,
        locationId: b.locationId || 'Khu vực cách ly',
        cause: `Hóa chất đang bị cách ly: ${b.notes || 'Chưa hoàn tất kiểm tra nghiệm thu'}`,
        priority: 'Ưu tiên cao (P2)',
        suggestedAction: 'Cán bộ kiểm nghiệm khẩn trương đánh giá hồ sơ để giải tỏa hoặc hoàn trả nhà cung cấp.',
        reagentId: rg.id,
        batchId: b.id
      });
    }
  });

  // 5. Missing Location (Chưa rõ vị trí lưu trữ)
  batches.forEach(b => {
    const rg = reagentMap.get(b.reagentId);
    if (!rg) return;
    if ((!b.locationId || b.locationId.trim() === '') && b.remainingQuantity > 0) {
      alertsList.push({
        id: `alert-nolocation-${b.id}`,
        category: 'MISSING_LOCATION',
        level: 'YELLOW',
        reagentName: rg.name,
        reagentCode: rg.code,
        batchNumber: b.batchNumber,
        cause: 'Chưa đủ dữ liệu để xác nhận vị trí bảo quản an toàn (Chưa gán mã ô tủ)',
        priority: 'Cần rà soát (P3)',
        suggestedAction: 'Phân loại điều kiện nhiệt độ và gán vị trí ô kệ chính xác theo định dạng C-S-A.',
        reagentId: rg.id,
        batchId: b.id
      });
    }
  });

  // 6. Temperature Violations
  temperatureLogs.filter(l => l.isOutOfRange).slice(0, 3).forEach(l => {
    const cab = cabinets.find(c => c.id === l.cabinetId);
    alertsList.push({
      id: `alert-temp-${l.id}`,
      category: 'TEMP_VIOLATION',
      level: 'RED',
      reagentName: `Tủ bảo quản ${l.cabinetName} (${l.cabinetCode})`,
      reagentCode: l.cabinetCode,
      cause: `Nhiệt độ đo được ${l.temperature}°C vượt dải quy định (${cab?.minTemp || 2}°C - ${cab?.maxTemp || 8}°C)`,
      priority: 'Khẩn cấp (P1)',
      suggestedAction: 'Kiểm tra kỹ thuật ngay lập tức, chuyển hóa chất sang tủ dự phòng nếu sự cố kéo dài quá 30 phút.',
    });
  });

  const filteredAlerts = alertsList.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.level === filterLevel;
  });

  const redCount = alertsList.filter(a => a.level === 'RED').length;
  const orangeCount = alertsList.filter(a => a.level === 'ORANGE').length;
  const yellowCount = alertsList.filter(a => a.level === 'YELLOW').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>TRUNG TÂM CẢNH BÁO TỒN KHO & AN TOÀN HÓA CHẤT</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp cảnh báo hạn dùng, mức tồn tới hạn, thiếu thông số kỹ thuật, cách ly và sự cố nhiệt độ.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({alertsList.length})
          </button>
          <button
            onClick={() => setFilterLevel('RED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'RED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Đỏ ({redCount})
          </button>
          <button
            onClick={() => setFilterLevel('ORANGE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'ORANGE' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            Cam ({orangeCount})
          </button>
          <button
            onClick={() => setFilterLevel('YELLOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'YELLOW' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
            }`}
          >
            Vàng ({yellowCount})
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
        <span>
          <strong>Nguyên tắc phòng ngừa:</strong> "Không coi dữ liệu thiếu là tồn an toàn. Khi thiếu định mức tiêu hao, hệ thống luôn gắn nhãn <em>CHƯA ĐỦ DỮ LIỆU – CẦN XÁC MINH</em> và yêu cầu xác minh trực tiếp trước khi quyết định cấp phát."
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Không có cảnh báo nào trong nhóm này</h3>
            <p className="text-xs text-slate-400 mt-1">Kho hóa chất đang vận hành ổn định trong ngưỡng an toàn.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                alert.level === 'RED'
                  ? 'bg-red-50/60 border-red-200'
                  : alert.level === 'ORANGE'
                  ? 'bg-orange-50/60 border-orange-200'
                  : 'bg-yellow-50/60 border-yellow-200'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    alert.level === 'RED'
                      ? 'bg-red-600 text-white'
                      : alert.level === 'ORANGE'
                      ? 'bg-orange-500 text-white'
                      : 'bg-yellow-500 text-slate-900'
                  }`}>
                    {alert.priority}
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-slate-200/80">
                    {alert.reagentCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{alert.reagentName}</h3>
                </div>

                <div className="text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {alert.batchNumber && (
                    <span className="font-mono">
                      Lot: <strong>{alert.batchNumber}</strong>
                    </span>
                  )}
                  {alert.locationId && (
                    <span className="flex items-center gap-1 font-mono text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Vị trí: <strong>{alert.locationId}</strong>
                    </span>
                  )}
                </div>

                <p className="text-slate-800 font-semibold leading-relaxed">
                  Nguyên nhân: {alert.cause}
                </p>

                <div className="p-2 rounded-xl bg-white/70 border border-slate-200/70 text-[11px] text-slate-600">
                  <strong className="text-blue-900">Hành động đề xuất:</strong> {alert.suggestedAction}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {alert.reagentId && (
                  <button
                    onClick={() => onNavigateToReagent(alert.reagentId!)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-2xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hóa chất</span>
                  </button>
                )}
                {alert.batchId && (
                  <button
                    onClick={() => onNavigateToBatch(alert.batchId!)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-2xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                    <span>Chi tiết lô</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
