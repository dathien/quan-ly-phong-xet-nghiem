import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Eye,
  CheckCircle,
  ShieldAlert,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Boxes,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Reagent,
  Batch,
  StockTransaction,
  ChemicalGroup,
  Cabinet,
  SOPDocument,
  AppSettings,
  UserRole
} from '../types';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
import { calculateReagentStock, isExpired, getDaysUntilExpiry } from '../services/calculationService';

interface ReportsAndSopViewProps {
  reagents: Reagent[];
  batches: Batch[];
  transactions: StockTransaction[];
  groups: ChemicalGroup[];
  cabinets: Cabinet[];
  sops: SOPDocument[];
  settings: AppSettings;
  userRole: UserRole;
}

export const ReportsAndSopView: React.FC<ReportsAndSopViewProps> = ({
  reagents,
  batches,
  transactions,
  groups,
  cabinets,
  sops,
  settings,
  userRole
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'REPORTS' | 'SOPS'>('REPORTS');

  // Report Filter states
  const [reportType, setReportType] = useState<
    'INVENTORY_BALANCE' | 'EXPIRY' | 'MOVEMENTS' | 'ALERTS' | 'CABINET_OCCUPANCY'
  >('INVENTORY_BALANCE');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [filterCabinet, setFilterCabinet] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-23');

  // SOP Inspector Modal
  const [viewingSop, setViewingSop] = useState<SOPDocument | null>(null);

  const groupMap = new Map(groups.map(g => [g.id, g]));
  const reagentMap = new Map(reagents.map(r => [r.id, r]));

  // Computed Report Rows
  const inventoryReportData = reagents.map(r => {
    const stock = calculateReagentStock(r, batches, settings);
    return {
      reagent: r,
      stock,
      group: groupMap.get(r.groupId)?.name || 'Chưa xác định'
    };
  }).filter(item => {
    if (filterGroup !== 'ALL' && item.reagent.groupId !== filterGroup) return false;
    return true;
  });

  const expiryReportData = batches
    .filter(b => b.remainingQuantity > 0)
    .map(b => {
      const rg = reagentMap.get(b.reagentId);
      const daysLeft = getDaysUntilExpiry(b.expiryDate);
      const expired = isExpired(b.expiryDate);
      return {
        batch: b,
        reagent: rg,
        daysLeft,
        expired
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const movementReportData = transactions.filter(t => {
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>BÁO CÁO THỐNG KÊ & THƯ VIỆN SOP TIÊU CHUẨN</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xuất báo cáo tồn kho định dạng Excel/PDF theo biểu mẫu y khoa và 9 quy trình thao tác chuẩn SOP ISO 15189.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('REPORTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'REPORTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Trung tâm Báo cáo</span>
          </button>
          <button
            onClick={() => setActiveSubTab('SOPS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'SOPS'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Thư viện 9 SOP</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: BÁO CÁO (Section 19) */}
      {activeSubTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700">Loại báo cáo:</span>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-blue-900 bg-blue-50/50 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="INVENTORY_BALANCE">Báo cáo cân đối tồn kho chi tiết</option>
                  <option value="EXPIRY">Báo cáo hạn dùng hóa chất (FEFO)</option>
                  <option value="MOVEMENTS">Báo cáo nhập – xuất theo kỳ</option>
                  <option value="CABINET_OCCUPANCY">Báo cáo sức chứa tủ hóa chất</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (reportType === 'INVENTORY_BALANCE') ExcelService.exportReagents(reagents, groups);
                    else if (reportType === 'EXPIRY') ExcelService.exportBatches(batches, reagents);
                    else if (reportType === 'MOVEMENTS') ExcelService.exportTransactions(transactions);
                    else ExcelService.exportReagents(reagents, groups);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Date and Group Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Nhóm:</span>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="ALL">Tất cả các nhóm</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Report Content Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
            {reportType === 'INVENTORY_BALANCE' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã HC</th>
                      <th className="py-3 px-4">Tên hóa chất</th>
                      <th className="py-3 px-4">Nhóm</th>
                      <th className="py-3 px-4 text-center">Tồn khả dụng (Q)</th>
                      <th className="py-3 px-4 text-center">Thể tích (V)</th>
                      <th className="py-3 px-4 text-center">Số ngày còn (N)</th>
                      <th className="py-3 px-4">Đánh giá cảnh báo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryReportData.map(({ reagent, stock, group }) => (
                      <tr key={reagent.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{reagent.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{reagent.name}</td>
                        <td className="py-3 px-4 text-slate-600">{group}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {stock.totalAvailableUnits} {reagent.unit}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {stock.totalAvailableVolume} {stock.volumeUnit}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                          {stock.daysRemaining !== null ? `${stock.daysRemaining} ngày` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stock.alertLevel === 'RED' ? 'bg-red-100 text-red-800' :
                            stock.alertLevel === 'ORANGE' ? 'bg-orange-100 text-orange-800' :
                            stock.alertLevel === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                            stock.alertLevel === 'INSUFFICIENT_DATA' ? 'bg-slate-200 text-slate-700' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {stock.alertReason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'EXPIRY' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Lot / Batch</th>
                      <th className="py-3 px-4">Hóa chất</th>
                      <th className="py-3 px-4">Hạn dùng</th>
                      <th className="py-3 px-4">Thời gian còn</th>
                      <th className="py-3 px-4">Số lượng tồn</th>
                      <th className="py-3 px-4">Vị trí</th>
                      <th className="py-3 px-4">Trạng thái FEFO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiryReportData.map(({ batch, reagent, daysLeft, expired }) => (
                      <tr key={batch.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{batch.batchNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{reagent?.name || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium">{batch.expiryDate}</td>
                        <td className="py-3 px-4">
                          <span className={`font-mono font-bold ${expired ? 'text-red-700' : daysLeft <= 30 ? 'text-amber-700' : 'text-slate-700'}`}>
                            {expired ? 'ĐÃ QUÁ HẠN' : `${daysLeft} ngày`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">{batch.remainingQuantity} {batch.unit}</td>
                        <td className="py-3 px-4 font-mono text-blue-700">{batch.locationId || 'Chưa gán'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            expired ? 'bg-red-100 text-red-800' : daysLeft <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {expired ? 'Khóa - Cấm xuất' : daysLeft <= 30 ? 'Ưu tiên xuất trước' : 'Bình thường'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'MOVEMENTS' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã GD</th>
                      <th className="py-3 px-4">Ngày</th>
                      <th className="py-3 px-4">Loại GD</th>
                      <th className="py-3 px-4">Hóa chất</th>
                      <th className="py-3 px-4">Số Lot</th>
                      <th className="py-3 px-4">Số lượng</th>
                      <th className="py-3 px-4">Người thực hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movementReportData.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{tx.id}</td>
                        <td className="py-3 px-4 text-slate-600">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'NHAP_KHO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type === 'NHAP_KHO' ? 'Nhập kho' : 'Xuất kho'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{tx.reagentName}</td>
                        <td className="py-3 px-4 font-mono">{tx.batchNumber}</td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {tx.type === 'NHAP_KHO' ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{tx.performer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: THƯ VIỆN SOP (Section 18) */}
      {activeSubTab === 'SOPS' && (
        <div className="space-y-6">
          {/* Draft Disclaimer Notice (Section 18 Mandatory) */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 leading-relaxed flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block">QUY ĐỊNH PHÁP QUY VỀ QUY TRÌNH THAO TÁC CHUẨN (SOP):</span>
              <span>
                "SOP được tạo trong ứng dụng chỉ là <strong>bản dự thảo</strong> cho đến khi được phê duyệt chính thức theo quy trình quản lý chất lượng nội bộ của đơn vị. Ứng dụng không tự nhận đây là tài liệu đã có hiệu lực pháp lý."
              </span>
            </div>
          </div>

          {/* 9 SOPs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {sops.map(sop => (
              <div
                key={sop.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-[11px]">
                      {sop.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Bản Dự Thảo
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {sop.title}
                  </h3>

                  <p className="text-slate-500 line-clamp-3 leading-relaxed">
                    {sop.purpose}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 space-y-0.5">
                    <div>Soạn: {sop.author}</div>
                    <div>Phiên bản: {sop.version} • {sop.effectiveDate}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => setViewingSop(sop)}
                    className="flex items-center gap-1 text-teal-600 font-bold hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem nội dung</span>
                  </button>

                  <button
                    onClick={() => PdfService.exportSopPDF(sop, settings)}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 cursor-pointer"
                    title="In tài liệu SOP"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Xuất PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOP DETAIL VIEWER MODAL */}
      {viewingSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded">
                  {viewingSop.code} (v{viewingSop.version})
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {viewingSop.title}
                </h2>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  BẢN DỰ THẢO NỘI BỘ
                </span>
              </div>
              <button onClick={() => setViewingSop(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="py-4 space-y-4 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Mục đích:</h4>
                <p className="text-slate-700">{viewingSop.purpose}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Phạm vi áp dụng:</h4>
                <p className="text-slate-700">{viewingSop.scope}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Trách nhiệm thực hiện:</h4>
                <p className="text-slate-700">{viewingSop.responsibility}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">4. Các bước tiến hành:</h4>
                <ol className="space-y-2 text-slate-700">
                  {viewingSop.content.map((step, idx) => (
                    <li key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">5. Biểu mẫu hồ sơ kèm theo:</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {viewingSop.forms.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                <div>Người soạn: <strong>{viewingSop.author}</strong></div>
                <div>Kiểm tra: <strong>{viewingSop.reviewer}</strong></div>
                <div>Phê duyệt: <strong>{viewingSop.approver}</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => PdfService.exportSopPDF(viewingSop, settings)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất PDF in ấn</span>
              </button>
              <button
                onClick={() => setViewingSop(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
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
