import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle,
  Eye,
  History,
  Lock,
  Unlock,
  MapPin
} from 'lucide-react';
import { Batch, Reagent, BatchStatus, UserRole } from '../types';
import { isExpired, getDaysUntilExpiry } from '../services/calculationService';
import { ExcelService } from '../services/excelService';

interface LotManagementViewProps {
  batches: Batch[];
  reagents: Reagent[];
  onUpdateBatch: (batch: Batch) => void;
  userRole: UserRole;
  selectedBatchId?: string;
}

export const LotManagementView: React.FC<LotManagementViewProps> = ({
  batches,
  reagents,
  onUpdateBatch,
  userRole,
  selectedBatchId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReagentFilter, setSelectedReagentFilter] = useState<string>('ALL');
  const [inspectingBatch, setInspectingBatch] = useState<Batch | null>(
    selectedBatchId ? batches.find(b => b.id === selectedBatchId) || null : null
  );

  // Status Change Modal
  const [statusModalBatch, setStatusModalBatch] = useState<Batch | null>(null);
  const [newStatus, setNewStatus] = useState<BatchStatus>('KHA_DUNG');
  const [statusChangeReason, setStatusChangeReason] = useState('');

  const canManage = userRole === 'ADMIN' || userRole === 'QUAN_LY_KHO';
  const reagentMap = new Map(reagents.map(r => [r.id, r]));

  const statusConfigMap: Record<BatchStatus, { label: string; badge: string }> = {
    CHO_KIEM_TRA: { label: 'Chờ kiểm tra', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    KHA_DUNG: { label: 'Khả dụng', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    CACH_LY: { label: 'Cách ly', badge: 'bg-orange-100 text-orange-800 border-orange-300' },
    HET_HAN: { label: 'Hết hạn (Khóa)', badge: 'bg-red-100 text-red-800 border-red-300' },
    HU_HONG: { label: 'Hư hỏng (Khóa)', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
    DA_SU_DUNG_HET: { label: 'Đã hết hàng', badge: 'bg-slate-200 text-slate-700 border-slate-300' }
  };

  const filteredBatches = batches.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (selectedReagentFilter !== 'ALL' && b.reagentId !== selectedReagentFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const rg = reagentMap.get(b.reagentId);
      return (
        b.batchNumber.toLowerCase().includes(term) ||
        (b.locationId && b.locationId.toLowerCase().includes(term)) ||
        (rg && rg.name.toLowerCase().includes(term)) ||
        (rg && rg.code.toLowerCase().includes(term)) ||
        b.supplier.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>QUẢN LÝ LÔ HÓA CHẤT (LOT / BATCH)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              {filteredBatches.length} / {batches.length} lô
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi từng số lot, hạn dùng theo ngày, vị trí khay kệ, nguồn gốc tiếp nhận và lịch sử trạng thái kiểm soát.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ExcelService.exportBatches(batches, reagents)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số lot, vị trí, tên hóa chất..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="KHA_DUNG">Khả dụng</option>
              <option value="CHO_KIEM_TRA">Chờ kiểm tra</option>
              <option value="CACH_LY">Cách ly</option>
              <option value="HET_HAN">Hết hạn</option>
              <option value="HU_HONG">Hư hỏng</option>
              <option value="DA_SU_DUNG_HET">Đã dùng hết</option>
            </select>
          </div>

          {/* Chemical Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Hóa chất:</span>
            <select
              value={selectedReagentFilter}
              onChange={(e) => setSelectedReagentFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-500 cursor-pointer max-w-xs truncate"
            >
              <option value="ALL">Tất cả hóa chất</option>
              {reagents.map(r => (
                <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Số Lot / Batch</th>
                <th className="py-3 px-4">Hóa chất</th>
                <th className="py-3 px-4">Ngày nhập</th>
                <th className="py-3 px-4">Hạn dùng & Còn lại</th>
                <th className="py-3 px-4">Số lượng tồn</th>
                <th className="py-3 px-4">Vị trí lưu trữ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Không tìm thấy lô hóa chất nào theo tiêu chí đã chọn.
                  </td>
                </tr>
              ) : (
                filteredBatches.map(batch => {
                  const rg = reagentMap.get(batch.reagentId);
                  const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                  const expired = isExpired(batch.expiryDate) || batch.status === 'HET_HAN';
                  const nearExpiry = !expired && daysLeft <= 30 && batch.status === 'KHA_DUNG';

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{rg?.name || 'Chưa liên kết'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rg?.code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{batch.inboundDate}</td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${expired ? 'text-rose-700 font-bold' : nearExpiry ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                          {batch.expiryDate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {expired ? 'ĐÃ HẾT HẠN' : `Còn ${daysLeft} ngày`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {batch.remainingQuantity} <span className="text-xs font-normal text-slate-500">{batch.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Nhập: {batch.initialQuantity} {batch.unit}</div>
                      </td>
                      <td className="py-3 px-4">
                        {batch.locationId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
                            <MapPin className="w-3 h-3" />
                            {batch.locationId}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Chưa gán vị trí
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfigMap[batch.status].badge}`}>
                          {statusConfigMap[batch.status].label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingBatch(batch)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg cursor-pointer"
                            title="Xem chi tiết & Lịch sử"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => {
                                setStatusModalBatch(batch);
                                setNewStatus(batch.status);
                                setStatusChangeReason('');
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Thay đổi trạng thái lô (Khóa, Cách ly...)"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BATCH DETAIL & AUDIT HISTORY MODAL */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded">
                  LOT: {inspectingBatch.batchNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {reagentMap.get(inspectingBatch.reagentId)?.name || 'Hóa chất xét nghiệm'}
                </h3>
              </div>
              <button onClick={() => setInspectingBatch(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Số lượng còn lại</span>
                  <span className="font-mono text-base font-black text-slate-800">
                    {inspectingBatch.remainingQuantity} / {inspectingBatch.initialQuantity} {inspectingBatch.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Hạn dùng</span>
                  <span className="font-semibold text-slate-800">{inspectingBatch.expiryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Vị trí tủ/kệ</span>
                  <span className="font-mono font-bold text-blue-700">{inspectingBatch.locationId || 'Chưa gán'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Nhà cung cấp</span>
                  <span className="text-slate-700">{inspectingBatch.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Kiểm tra bao bì</span>
                  <span className="text-slate-700">{inspectingBatch.packagingCondition}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Trạng thái</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusConfigMap[inspectingBatch.status].badge}`}>
                    {statusConfigMap[inspectingBatch.status].label}
                  </span>
                </div>
              </div>

              {/* Status Change History (Section 6 Requirement) */}
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Lịch sử thay đổi trạng thái lô:</span>
                </h4>
                {inspectingBatch.statusHistory && inspectingBatch.statusHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inspectingBatch.statusHistory.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">
                            {h.fromStatus} &rarr; <span className="font-bold text-blue-700">{h.toStatus}</span>
                          </span>
                          <span className="text-slate-400">{new Date(h.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="text-slate-600 italic">"{h.reason}"</div>
                        <div className="text-[10px] text-slate-400 font-medium">Bởi: {h.performedBy}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Chưa có thay đổi trạng thái nào sau khi nhập kho ban đầu.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectingBatch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {statusModalBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Thay đổi trạng thái kiểm soát lô
            </h3>
            <p className="text-slate-500 mb-4">
              Lot: <strong className="font-mono text-slate-800">{statusModalBatch.batchNumber}</strong> ({reagentMap.get(statusModalBatch.reagentId)?.name})
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!statusChangeReason.trim()) return;

                const historyEntry = {
                  timestamp: new Date().toISOString(),
                  fromStatus: statusModalBatch.status,
                  toStatus: newStatus,
                  reason: statusChangeReason.trim(),
                  performedBy: userRole === 'ADMIN' ? 'Quản trị viên' : 'Quản lý kho'
                };

                const updated: Batch = {
                  ...statusModalBatch,
                  status: newStatus,
                  statusHistory: [historyEntry, ...(statusModalBatch.statusHistory || [])]
                };

                onUpdateBatch(updated);
                setStatusModalBatch(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chọn trạng thái mới (*)</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as BatchStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="KHA_DUNG">Khả dụng (Cho phép xuất dùng)</option>
                  <option value="CHO_KIEM_TRA">Chờ kiểm tra</option>
                  <option value="CACH_LY">Cách ly (Tạm khóa)</option>
                  <option value="HET_HAN">Hết hạn (Khóa xuất hoàn toàn)</option>
                  <option value="HU_HONG">Hư hỏng / Rò rỉ / Biến chất (Khóa)</option>
                  <option value="DA_SU_DUNG_HET">Đã sử dụng hết</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lý do thay đổi trạng thái (* Bắt buộc ghi nhận)</label>
                <textarea
                  required
                  rows={3}
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  placeholder="Ghi rõ lý do (ví dụ: phát hiện nhiệt độ vận chuyển không đạt, kết tủa nghi ngờ, hoặc đã nghiệm thu sau cách ly...)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalBatch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-sm shadow-teal-500/20"
                >
                  Cập nhật trạng thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
