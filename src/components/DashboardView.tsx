import React, { useState } from 'react';
import {
  Boxes,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  HelpCircle,
  FileQuestion,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Eye,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Reagent, Batch, ChemicalGroup, StockTransaction, AppSettings } from '../types';
import { calculateReagentStock, isExpired, getDaysUntilExpiry, ReagentStockSummary } from '../services/calculationService';

interface DashboardViewProps {
  reagents: Reagent[];
  batches: Batch[];
  groups: ChemicalGroup[];
  transactions: StockTransaction[];
  settings: AppSettings;
  onNavigateToCatalog: (searchQuery?: string) => void;
  onNavigateToBatch: (batchId: string) => void;
  onNavigateToAlerts: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reagents,
  batches,
  groups,
  transactions,
  settings,
  onNavigateToCatalog,
  onNavigateToBatch,
  onNavigateToAlerts
}) => {
  const [selectedItemDetail, setSelectedItemDetail] = useState<{
    reagent: Reagent;
    stock: ReagentStockSummary;
    batches: Batch[];
  } | null>(null);

  // Calculate summaries for all active reagents
  const stockSummaries: { reagent: Reagent; stock: ReagentStockSummary }[] = reagents.map((r) => ({
    reagent: r,
    stock: calculateReagentStock(r, batches, settings)
  }));

  // KPI Calculations
  const totalReagentsCount = reagents.filter(r => r.isActive).length;
  const totalActiveBatches = batches.filter(b => b.remainingQuantity > 0).length;
  const totalActiveGroups = groups.length;

  const safeStockCount = stockSummaries.filter(s => s.stock.alertLevel === 'GREEN').length;
  const yellowAlertCount = stockSummaries.filter(s => s.stock.alertLevel === 'YELLOW').length;
  const orangeAlertCount = stockSummaries.filter(s => s.stock.alertLevel === 'ORANGE').length;
  const redAlertCount = stockSummaries.filter(s => s.stock.alertLevel === 'RED').length;
  const insufficientDataCount = stockSummaries.filter(s => s.stock.alertLevel === 'INSUFFICIENT_DATA').length;

  // Near expiry batches (within settings.nearExpiryAlertDays)
  const nearExpiryBatches = batches.filter(
    b => b.status === 'KHA_DUNG' &&
      b.remainingQuantity > 0 &&
      getDaysUntilExpiry(b.expiryDate) <= settings.nearExpiryAlertDays &&
      !isExpired(b.expiryDate)
  );

  // Expired batches
  const expiredBatches = batches.filter(
    b => b.status === 'HET_HAN' || (b.remainingQuantity > 0 && isExpired(b.expiryDate))
  );

  // Top 5 chemical needing immediate action (RED alerts, Expired, or 0 stock)
  const topCriticalReagents = [...stockSummaries]
    .filter(s => s.stock.alertLevel === 'RED' || s.stock.totalAvailableUnits === 0 || s.stock.hasExpiredBatches)
    .sort((a, b) => (a.stock.daysRemaining ?? 999) - (b.stock.daysRemaining ?? 999))
    .slice(0, 5);

  // Top 5 high stock reagents (highest available days or units)
  const topHighStockReagents = [...stockSummaries]
    .filter(s => s.stock.daysRemaining !== null && s.stock.daysRemaining > 45)
    .sort((a, b) => (b.stock.daysRemaining ?? 0) - (a.stock.daysRemaining ?? 0))
    .slice(0, 5);

  // Reagents/Batches without location
  const batchesWithoutLocation = batches.filter(b => b.remainingQuantity > 0 && (!b.locationId || b.locationId.trim() === ''));

  // Reagents missing data
  const reagentsMissingData = stockSummaries.filter(s => s.stock.isMissingCriticalData);

  // Group distribution
  const groupStats = groups.map(g => {
    const count = reagents.filter(r => r.groupId === g.id && r.isActive).length;
    return { group: g, count };
  }).filter(g => g.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>BẢNG ĐIỀU KHIỂN TRUNG TÂM (DASHBOARD)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát thời gian thực số lượng tồn kho, cảnh báo FEFO, hạn dùng và an toàn lưu trữ hóa chất.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Xem {redAlertCount + orangeAlertCount} cảnh báo gấp</span>
          </button>
        </div>
      </div>

      {/* 10 KPI CARDS (Section 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* 1. Tổng số hóa chất */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng hóa chất</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalReagentsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Danh mục đang hoạt động</p>
        </div>

        {/* 2. Tổng số lô đang quản lý */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng số lô</span>
            <Boxes className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalActiveBatches}</div>
          <p className="text-[10px] text-slate-400 mt-1">Lô còn tồn trong kho</p>
        </div>

        {/* 3. Tổng số nhóm xét nghiệm */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Nhóm xét nghiệm</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalActiveGroups}</div>
          <p className="text-[10px] text-slate-400 mt-1">12 phân nhóm tiêu chuẩn</p>
        </div>

        {/* 4. Tồn an toàn (Xanh) */}
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tồn an toàn</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{safeStockCount}</div>
          <p className="text-[10px] text-emerald-600 mt-1">&gt; 30 ngày sử dụng</p>
        </div>

        {/* 5. Cảnh báo vàng */}
        <div className="bg-yellow-50/70 p-3.5 rounded-2xl border border-yellow-200 shadow-xs">
          <div className="flex items-center justify-between text-yellow-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cảnh báo Vàng</span>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black text-yellow-900">{yellowAlertCount}</div>
          <p className="text-[10px] text-yellow-700 mt-1">15 đến 30 ngày dùng</p>
        </div>

        {/* 6. Cảnh báo cam */}
        <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200 shadow-xs">
          <div className="flex items-center justify-between text-orange-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cảnh báo Cam</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-900">{orangeAlertCount}</div>
          <p className="text-[10px] text-orange-700 mt-1">7 đến dưới 15 ngày</p>
        </div>

        {/* 7. Cảnh báo đỏ */}
        <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-red-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cảnh báo Đỏ</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700">{redAlertCount}</div>
          <p className="text-[10px] text-red-600 mt-1">&lt; 7 ngày hoặc chạm đáy</p>
        </div>

        {/* 8. Gần hết hạn */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gần hết hạn</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{nearExpiryBatches.length}</div>
          <p className="text-[10px] text-amber-700 mt-1">Hạn dùng &le; 30 ngày</p>
        </div>

        {/* 9. Quá hạn */}
        <div className="bg-rose-100/70 p-3.5 rounded-2xl border border-rose-300 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Quá hạn (Khóa)</span>
            <AlertOctagon className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-2xl font-black text-rose-900">{expiredBatches.length}</div>
          <p className="text-[10px] text-rose-700 mt-1">Cấm xuất sử dụng</p>
        </div>

        {/* 10. Thiếu dữ liệu */}
        <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Thiếu dữ liệu</span>
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{insufficientDataCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Chưa đủ dữ liệu tính</p>
        </div>
      </div>

      {/* CHARTS ROW (Visual Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ mức cảnh báo tồn kho */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>CƠ CẤU MỨC CẢNH BÁO TỒN KHO</span>
            <span className="text-xs text-slate-400 font-normal">{totalReagentsCount} sản phẩm</span>
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> An toàn (&gt; 30 ngày)</span>
                <span>{safeStockCount} ({totalReagentsCount > 0 ? Math.round((safeStockCount / totalReagentsCount) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${totalReagentsCount > 0 ? (safeStockCount / totalReagentsCount) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Cảnh báo vàng (15-30 ngày)</span>
                <span>{yellowAlertCount} ({totalReagentsCount > 0 ? Math.round((yellowAlertCount / totalReagentsCount) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${totalReagentsCount > 0 ? (yellowAlertCount / totalReagentsCount) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Cảnh báo cam (7-15 ngày)</span>
                <span>{orangeAlertCount} ({totalReagentsCount > 0 ? Math.round((orangeAlertCount / totalReagentsCount) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${totalReagentsCount > 0 ? (orangeAlertCount / totalReagentsCount) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Cảnh báo đỏ (&lt; 7 ngày)</span>
                <span>{redAlertCount} ({totalReagentsCount > 0 ? Math.round((redAlertCount / totalReagentsCount) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${totalReagentsCount > 0 ? (redAlertCount / totalReagentsCount) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Chưa đủ dữ liệu</span>
                <span>{insufficientDataCount} ({totalReagentsCount > 0 ? Math.round((insufficientDataCount / totalReagentsCount) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${totalReagentsCount > 0 ? (insufficientDataCount / totalReagentsCount) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            Mức cảnh báo tự động tính theo công thức: <strong>N = (Q × U) / (T × R)</strong> kết hợp ngưỡng tồn tối thiểu.
          </div>
        </div>

        {/* Biểu đồ phân bố nhóm hóa chất */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>PHÂN BỐ THEO NHÓM XÉT NGHIỆM</span>
            <span className="text-xs text-slate-400 font-normal">{groupStats.length} nhóm có hàng</span>
          </h2>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {groupStats.map(({ group, count }) => {
              const pct = totalReagentsCount > 0 ? Math.round((count / totalReagentsCount) * 100) : 0;
              return (
                <div key={group.id} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: group.color }}></span>
                      {group.name}
                    </span>
                    <span className="font-mono text-slate-600 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: group.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Biểu đồ Nhập - Xuất gần đây */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>HOẠT ĐỘNG NHẬP – XUẤT KHO</span>
            <span className="text-xs text-slate-400 font-normal">{transactions.length} giao dịch</span>
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>Tổng nhập</span>
                </div>
                <div className="text-xl font-black text-emerald-900">
                  {transactions.filter(t => t.type === 'NHAP_KHO').reduce((sum, t) => sum + t.quantity, 0)}
                  <span className="text-xs font-normal text-emerald-700 ml-1">đơn vị</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  <span>Tổng xuất</span>
                </div>
                <div className="text-xl font-black text-blue-900">
                  {transactions.filter(t => t.type === 'XUAT_KHO').reduce((sum, t) => sum + t.quantity, 0)}
                  <span className="text-xs font-normal text-blue-700 ml-1">đơn vị</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Giao dịch mới nhất:</span>
              <div className="space-y-2">
                {transactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{tx.reagentName}</div>
                      <div className="text-[10px] text-slate-400">{tx.date} | Lot: {tx.batchNumber}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${tx.type === 'NHAP_KHO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {tx.type === 'NHAP_KHO' ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 TABLES (Section 3 Requirement) */}
      <div className="space-y-6">
        {/* Table 1: TOP 5 HÓA CHẤT CẦN XỬ LÝ NGAY */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-xs overflow-hidden">
          <div className="bg-red-50/80 px-4 py-3 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-extrabold text-red-950 uppercase tracking-wide">
                TOP 5 HÓA CHẤT CẦN XỬ LÝ NGAY (ƯU TIÊN KHẨN CẤP)
              </h2>
            </div>
            <span className="text-xs font-semibold text-red-700">Nguy cơ đứt hàng hoặc quá hạn</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Mã HC</th>
                  <th className="py-2.5 px-4">Tên hóa chất</th>
                  <th className="py-2.5 px-4">Tồn khả dụng</th>
                  <th className="py-2.5 px-4">Số ngày còn</th>
                  <th className="py-2.5 px-4">Lý do cảnh báo</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCriticalReagents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                      Hiện tại không có hóa chất nào chạm ngưỡng nguy cấp đỏ.
                    </td>
                  </tr>
                ) : (
                  topCriticalReagents.map(({ reagent, stock }) => (
                    <tr key={reagent.id} className="hover:bg-red-50/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{reagent.code}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{reagent.name}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-red-700">
                        {stock.totalAvailableUnits} {reagent.unit}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                          {stock.daysRemaining !== null ? `${stock.daysRemaining} ngày` : 'Chưa xác định'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px]">{stock.alertReason}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedItemDetail({ reagent, stock, batches: batches.filter(b => b.reagentId === reagent.id) })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grid 2 Columns for Table 2 & Table 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 2: TOP 5 HÓA CHẤT TỒN CAO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-teal-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  TOP 5 HÓA CHẤT TỒN CAO (&gt; 45 NGÀY)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Tránh đặt dư</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3">Tên hóa chất</th>
                    <th className="py-2 px-3">Tồn khả dụng</th>
                    <th className="py-2 px-3">Thời gian bao phủ</th>
                    <th className="py-2 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topHighStockReagents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        Không có hóa chất nào tồn vượt mức 45 ngày.
                      </td>
                    </tr>
                  ) : (
                    topHighStockReagents.map(({ reagent, stock }) => (
                      <tr key={reagent.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[180px]">{reagent.name}</td>
                        <td className="py-2 px-3 font-mono font-bold">{stock.totalAvailableUnits} {reagent.unit}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {stock.daysRemaining} ngày
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setSelectedItemDetail({ reagent, stock, batches: batches.filter(b => b.reagentId === reagent.id) })}
                            className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: DANH SÁCH HÓA CHẤT GẦN HẾT HẠN */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
            <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  DANH SÁCH LÔ GẦN HẾT HẠN (&le; 30 NGÀY)
                </h2>
              </div>
              <span className="text-[11px] font-bold text-amber-800">{nearExpiryBatches.length} lô</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3">Lot</th>
                    <th className="py-2 px-3">Hạn dùng</th>
                    <th className="py-2 px-3">Số lượng còn</th>
                    <th className="py-2 px-3">Vị trí</th>
                    <th className="py-2 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nearExpiryBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        Không có lô nào cận hạn trong 30 ngày tới.
                      </td>
                    </tr>
                  ) : (
                    nearExpiryBatches.map(b => {
                      const rg = reagents.find(r => r.id === b.reagentId);
                      const daysLeft = getDaysUntilExpiry(b.expiryDate);
                      return (
                        <tr key={b.id} className="hover:bg-amber-50/40">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                          <td className="py-2 px-3 font-medium text-amber-900">
                            {b.expiryDate} ({daysLeft} ngày)
                          </td>
                          <td className="py-2 px-3 font-bold">{b.remainingQuantity} {b.unit}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{b.locationId || 'Chưa gán'}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => onNavigateToBatch(b.id)}
                              className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                              title="Xem chi tiết lô"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Grid 2 Columns for Table 4 & Table 5 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 4: DANH SÁCH HÓA CHẤT CHƯA RÕ VỊ TRÍ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  DANH SÁCH HÓA CHẤT CHƯA RÕ VỊ TRÍ
                </h2>
              </div>
              <span className="text-[11px] text-rose-600 font-semibold">{batchesWithoutLocation.length} lô chưa gán</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3">Tên hóa chất</th>
                    <th className="py-2 px-3">Lot</th>
                    <th className="py-2 px-3">Tồn</th>
                    <th className="py-2 px-3">Trạng thái an toàn</th>
                    <th className="py-2 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchesWithoutLocation.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-emerald-600 font-medium italic">
                        Tất cả các lô hóa chất đều đã được gán mã vị trí chuẩn xác.
                      </td>
                    </tr>
                  ) : (
                    batchesWithoutLocation.map(b => {
                      const rg = reagents.find(r => r.id === b.reagentId);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800 truncate max-w-[150px]">{rg?.name || 'N/A'}</td>
                          <td className="py-2 px-3 font-mono">{b.batchNumber}</td>
                          <td className="py-2 px-3 font-bold">{b.remainingQuantity} {b.unit}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Chưa đủ dữ liệu vị trí an toàn
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => onNavigateToBatch(b.id)}
                              className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 5: DANH SÁCH HÓA CHẤT THIẾU DỮ LIỆU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  DANH SÁCH HÓA CHẤT THIẾU DỮ LIỆU TIÊU HAO
                </h2>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold">{reagentsMissingData.length} mục</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3">Mã HC</th>
                    <th className="py-2 px-3">Tên hóa chất</th>
                    <th className="py-2 px-3">Dữ liệu còn thiếu</th>
                    <th className="py-2 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reagentsMissingData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-emerald-600 font-medium italic">
                        Tất cả hóa chất đều có đủ thông số tiêu hao và thể tích chuẩn.
                      </td>
                    </tr>
                  ) : (
                    reagentsMissingData.map(({ reagent, stock }) => (
                      <tr key={reagent.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{reagent.code}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[150px]">{reagent.name}</td>
                        <td className="py-2 px-3 text-[11px] text-amber-700 font-medium">
                          {stock.missingDataReasons.join('; ')}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setSelectedItemDetail({ reagent, stock, batches: batches.filter(b => b.reagentId === reagent.id) })}
                            className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* REAGENT DETAIL POPUP MODAL */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {selectedItemDetail.reagent.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedItemDetail.reagent.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Tên thương mại: {selectedItemDetail.reagent.brandName || 'Chưa cập nhật'} | Hãng: {selectedItemDetail.reagent.manufacturer}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Status Alert Banner */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                selectedItemDetail.stock.alertLevel === 'RED' ? 'bg-red-50 border-red-200 text-red-900' :
                selectedItemDetail.stock.alertLevel === 'ORANGE' ? 'bg-orange-50 border-orange-200 text-orange-900' :
                selectedItemDetail.stock.alertLevel === 'YELLOW' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
                selectedItemDetail.stock.alertLevel === 'INSUFFICIENT_DATA' ? 'bg-slate-100 border-slate-300 text-slate-800' :
                'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold text-sm">
                    {selectedItemDetail.stock.alertLevel === 'RED' ? 'MỨC CẢNH BÁO ĐỎ (< 7 NGÀY)' :
                     selectedItemDetail.stock.alertLevel === 'ORANGE' ? 'MỨC CẢNH BÁO CAM (7-15 NGÀY)' :
                     selectedItemDetail.stock.alertLevel === 'YELLOW' ? 'MỨC CẢNH BÁO VÀNG (15-30 NGÀY)' :
                     selectedItemDetail.stock.alertLevel === 'INSUFFICIENT_DATA' ? 'CHƯA ĐỦ DỮ LIỆU – CẦN XÁC MINH' :
                     'TỒN KHO AN TOÀN (> 30 NGÀY)'}
                  </div>
                  <p className="text-[11px] opacity-90">{selectedItemDetail.stock.alertReason}</p>
                </div>
              </div>

              {/* Calculation Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">Tồn khả dụng (Q)</div>
                  <div className="font-mono text-base font-black text-slate-800">
                    {selectedItemDetail.stock.totalAvailableUnits} {selectedItemDetail.reagent.unit}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">Tổng thể tích (V)</div>
                  <div className="font-mono text-base font-black text-slate-800">
                    {selectedItemDetail.stock.totalAvailableVolume} {selectedItemDetail.stock.volumeUnit}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">Số test còn (K)</div>
                  <div className="font-mono text-base font-black text-slate-800">
                    {selectedItemDetail.stock.testsRemaining !== null ? `${selectedItemDetail.stock.testsRemaining} test` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">Số ngày còn (N)</div>
                  <div className="font-mono text-base font-black text-blue-700">
                    {selectedItemDetail.stock.daysRemainingText}
                  </div>
                </div>
              </div>

              {/* FEFO Recommendation */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 block mb-1">Quy tắc FEFO đề xuất:</span>
                <p className="text-blue-800 leading-relaxed">{selectedItemDetail.stock.fefoExplanation}</p>
              </div>

              {/* Batches Table */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">Các lô đang lưu trữ:</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedItemDetail.batches.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{b.batchNumber}</span>
                        <span className="text-slate-400 ml-2">Hạn: {b.expiryDate}</span>
                        <span className="text-slate-500 ml-2">Vị trí: {b.locationId || 'Chưa rõ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{b.remainingQuantity} {b.unit}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'KHA_DUNG' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'HET_HAN' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
