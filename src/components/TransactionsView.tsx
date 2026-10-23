import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  History
} from 'lucide-react';
import {
  Reagent,
  Batch,
  StockTransaction,
  Cabinet,
  UserRole,
  TransactionType
} from '../types';
import { isExpired, getDaysUntilExpiry, getFefoRecommendation } from '../services/calculationService';
import { ExcelService } from '../services/excelService';

interface TransactionsViewProps {
  reagents: Reagent[];
  batches: Batch[];
  transactions: StockTransaction[];
  cabinets: Cabinet[];
  onAddTransaction: (
    tx: Omit<StockTransaction, 'id' | 'timestamp'>,
    batchPayload?: { isNewBatch: boolean; batchData: Partial<Batch> }
  ) => { success: boolean; message: string };
  userRole: UserRole;
  userName: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  reagents,
  batches,
  transactions,
  cabinets,
  onAddTransaction,
  userRole,
  userName
}) => {
  const [activeTab, setActiveTab] = useState<'INBOUND' | 'OUTBOUND' | 'HISTORY'>('INBOUND');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Inbound Form State
  const [inDate, setInDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [inReagentId, setInReagentId] = useState<string>(reagents[0]?.id || '');
  const [inSupplier, setInSupplier] = useState<string>('');
  const [inBatchNumber, setInBatchNumber] = useState<string>('');
  const [inExpiryDate, setInExpiryDate] = useState<string>('');
  const [inQuantity, setInQuantity] = useState<number>(1);
  const [inLocationId, setInLocationId] = useState<string>('');
  const [inPackagingCondition, setInPackagingCondition] = useState<'Nguyên vẹn' | 'Móp méo' | 'Rò rỉ' | 'Nhiệt độ giao nhận sai lệch'>('Nguyên vẹn');
  const [inNotes, setInNotes] = useState<string>('');

  // Outbound Form State
  const [outDate, setOutDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [outReagentId, setOutReagentId] = useState<string>(reagents[0]?.id || '');
  const [outBatchId, setOutBatchId] = useState<string>('');
  const [outQuantity, setOutQuantity] = useState<number>(1);
  const [outDepartment, setOutDepartment] = useState<string>('Bộ phận Sinh hóa');
  const [outReceiver, setOutReceiver] = useState<string>('');
  const [outPurpose, setOutPurpose] = useState<string>('Cấp phát chạy máy xét nghiệm định kỳ');
  const [outFefoOverrideReason, setOutFefoOverrideReason] = useState<string>('');
  const [outNotes, setOutNotes] = useState<string>('');

  // History Search
  const [historySearch, setHistorySearch] = useState<string>('');

  const selectedInReagent = reagents.find(r => r.id === inReagentId);
  const selectedOutReagent = reagents.find(r => r.id === outReagentId);

  // Available batches for selected outbound reagent
  const availableBatchesForOut = batches.filter(b => b.reagentId === outReagentId && b.remainingQuantity > 0);
  const fefoData = getFefoRecommendation(availableBatchesForOut);
  const recommendedFefoBatch = fefoData.recommendedBatch;

  // Selected Outbound Batch
  const selectedOutBatch = batches.find(b => b.id === (outBatchId || recommendedFefoBatch?.id));

  // Check if selected batch differs from FEFO recommendation
  const isDifferentFromFefo = Boolean(
    recommendedFefoBatch &&
    selectedOutBatch &&
    selectedOutBatch.id !== recommendedFefoBatch.id
  );

  // Handle Inbound Submit
  const handleInboundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInReagent) {
      setStatusMessage({ type: 'error', text: 'Vui lòng chọn hóa chất nhập kho.' });
      return;
    }
    if (inQuantity <= 0) {
      setStatusMessage({ type: 'error', text: 'TEST 01 & Quy tắc: Số lượng nhập phải lớn hơn 0, không được nhập số âm.' });
      return;
    }
    if (!inBatchNumber.trim()) {
      setStatusMessage({ type: 'error', text: 'Vui lòng nhập số Lot/Batch của nhà sản xuất.' });
      return;
    }
    if (!inExpiryDate) {
      setStatusMessage({ type: 'error', text: 'Vui lòng nhập hạn dùng của lô hóa chất.' });
      return;
    }
    if (isExpired(inExpiryDate)) {
      setStatusMessage({
        type: 'error',
        text: 'CẢNH BÁO AN TOÀN: Hóa chất này đã hết hạn dùng tại thời điểm nhập kho. Không thể tiếp nhận!'
      });
      return;
    }

    // Check duplicate lot
    const duplicateLot = batches.find(
      b => b.reagentId === inReagentId && b.batchNumber.toLowerCase() === inBatchNumber.trim().toLowerCase()
    );

    const batchData: Partial<Batch> = {
      reagentId: inReagentId,
      batchNumber: inBatchNumber.trim().toUpperCase(),
      inboundDate: inDate,
      expiryDate: inExpiryDate,
      initialQuantity: inQuantity,
      remainingQuantity: inQuantity,
      unit: selectedInReagent.unit,
      locationId: inLocationId || 'Chưa gán vị trí',
      supplier: inSupplier || 'Nhà phân phối ủy quyền',
      packagingCondition: inPackagingCondition,
      inspectionStatus: inPackagingCondition === 'Nguyên vẹn' ? 'Đạt' : 'Chưa kiểm tra',
      status: inPackagingCondition === 'Nguyên vẹn' ? 'KHA_DUNG' : 'CACH_LY',
      notes: inNotes,
      statusHistory: [
        {
          timestamp: new Date().toISOString(),
          fromStatus: 'CHO_KIEM_TRA',
          toStatus: inPackagingCondition === 'Nguyên vẹn' ? 'KHA_DUNG' : 'CACH_LY',
          reason: `Tiếp nhận ban đầu với tình trạng bao bì: ${inPackagingCondition}`,
          performedBy: userName
        }
      ]
    };

    const res = onAddTransaction(
      {
        type: 'NHAP_KHO',
        date: inDate,
        reagentId: inReagentId,
        reagentName: selectedInReagent.name,
        reagentCode: selectedInReagent.code,
        batchId: duplicateLot ? duplicateLot.id : 'new-batch',
        batchNumber: inBatchNumber.trim().toUpperCase(),
        quantity: inQuantity,
        unit: selectedInReagent.unit,
        locationId: inLocationId,
        performer: userName,
        notes: inNotes + (duplicateLot ? ' (Cộng dồn vào lô đã có)' : '')
      },
      {
        isNewBatch: !duplicateLot,
        batchData: duplicateLot
          ? { ...duplicateLot, remainingQuantity: duplicateLot.remainingQuantity + inQuantity }
          : batchData
      }
    );

    if (res.success) {
      setStatusMessage({ type: 'success', text: `Đã nhập kho thành công: ${inQuantity} ${selectedInReagent.unit} ${selectedInReagent.name} (Lot: ${inBatchNumber.trim().toUpperCase()}).` });
      setInBatchNumber('');
      setInQuantity(1);
      setInNotes('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Outbound Submit
  const handleOutboundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutReagent) {
      setStatusMessage({ type: 'error', text: 'Vui lòng chọn hóa chất cần xuất.' });
      return;
    }

    const currentBatch = selectedOutBatch || recommendedFefoBatch;
    if (!currentBatch) {
      setStatusMessage({ type: 'error', text: 'Không có lô nào khả dụng để xuất cho hóa chất này.' });
      return;
    }

    // TEST 02: Check export <= 0 or exceed available
    if (outQuantity <= 0) {
      setStatusMessage({ type: 'error', text: 'TEST 02: Không cho phép xuất số lượng âm hoặc bằng 0.' });
      return;
    }
    if (outQuantity > currentBatch.remainingQuantity) {
      setStatusMessage({
        type: 'error',
        text: `TEST 02: Xuất vượt tồn! Lô ${currentBatch.batchNumber} chỉ còn tồn ${currentBatch.remainingQuantity} ${currentBatch.unit}, bạn yêu cầu xuất ${outQuantity} ${currentBatch.unit}. Hệ thống từ chối!`
      });
      return;
    }

    // TEST 04: Check if batch is expired or locked
    if (isExpired(currentBatch.expiryDate) || currentBatch.status === 'HET_HAN') {
      setStatusMessage({
        type: 'error',
        text: `TEST 04: Lô ${currentBatch.batchNumber} đã hết hạn (${currentBatch.expiryDate}). Quy chế cấm tuyệt đối xuất sử dụng!`
      });
      return;
    }

    if (currentBatch.status !== 'KHA_DUNG') {
      setStatusMessage({
        type: 'error',
        text: `Lô ${currentBatch.batchNumber} đang ở trạng thái "${currentBatch.status}". Không được phép xuất sử dụng!`
      });
      return;
    }

    // Section 8: If selecting different batch than FEFO, require reason
    if (isDifferentFromFefo && !outFefoOverrideReason.trim()) {
      setStatusMessage({
        type: 'warning',
        text: 'CẢNH BÁO FEFO: Bạn đang chọn xuất lô khác với lô FEFO tối ưu được đề xuất. Bạn BẮT BUỘC phải ghi lý do ngoại lệ trước khi xuất!'
      });
      return;
    }

    const res = onAddTransaction(
      {
        type: 'XUAT_KHO',
        date: outDate,
        reagentId: outReagentId,
        reagentName: selectedOutReagent.name,
        reagentCode: selectedOutReagent.code,
        batchId: currentBatch.id,
        batchNumber: currentBatch.batchNumber,
        quantity: outQuantity,
        unit: currentBatch.unit,
        locationId: currentBatch.locationId,
        department: outDepartment,
        receiver: outReceiver || 'Kỹ thuật viên phòng lab',
        performer: userName,
        purpose: outPurpose,
        isFefoException: isDifferentFromFefo,
        exceptionReason: isDifferentFromFefo ? outFefoOverrideReason.trim() : undefined,
        notes: outNotes
      },
      {
        isNewBatch: false,
        batchData: {
          ...currentBatch,
          remainingQuantity: currentBatch.remainingQuantity - outQuantity,
          status: currentBatch.remainingQuantity - outQuantity === 0 ? 'DA_SU_DUNG_HET' : currentBatch.status
        }
      }
    );

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Đã xuất kho thành công: ${outQuantity} ${currentBatch.unit} cho ${outDepartment}. Tồn lô ${currentBatch.batchNumber} còn lại: ${currentBatch.remainingQuantity - outQuantity} ${currentBatch.unit}.`
      });
      setOutQuantity(1);
      setOutFefoOverrideReason('');
      setOutNotes('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Filter history
  const filteredHistory = transactions.filter(t => {
    if (historySearch.trim() === '') return true;
    const term = historySearch.toLowerCase();
    return (
      t.reagentName.toLowerCase().includes(term) ||
      t.reagentCode.toLowerCase().includes(term) ||
      t.batchNumber.toLowerCase().includes(term) ||
      t.performer.toLowerCase().includes(term) ||
      (t.department && t.department.toLowerCase().includes(term)) ||
      (t.id && t.id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>QUẢN LÝ NHẬP – XUẤT KHO HÓA CHẤT</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm soát chặt chẽ điều kiện tiếp nhận, số lot, hạn dùng và tuân thủ tuyệt đối quy tắc FEFO khi cấp phát.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('INBOUND')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'INBOUND'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Phiếu Nhập kho</span>
          </button>
          <button
            onClick={() => setActiveTab('OUTBOUND')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'OUTBOUND'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Phiếu Xuất kho (FEFO)</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />}
            {statusMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 ml-4">✕</button>
        </div>
      )}

      {/* TAB 1: NHẬP KHO (Section 7) */}
      {activeTab === 'INBOUND' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Tạo Phiếu Nhập Kho Tiếp Nhận Hóa Chất</h2>
                  <p className="text-[11px] text-slate-400">Kiểm tra thông số chất lượng trước khi nạp vào tồn kho chính thức</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border">
                Người lập: {userName}
              </span>
            </div>

            <form onSubmit={handleInboundSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày tiếp nhận nhập kho (*)</label>
                  <input
                    type="date"
                    required
                    value={inDate}
                    onChange={(e) => setInDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hóa chất xét nghiệm (*)</label>
                  <select
                    value={inReagentId}
                    onChange={(e) => {
                      setInReagentId(e.target.value);
                      const rg = reagents.find(r => r.id === e.target.value);
                      if (rg) {
                        setInSupplier(rg.manufacturer);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {reagents.filter(r => r.isActive).map(r => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name} ({r.packaging})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số Lot / Batch (*)</label>
                  <input
                    type="text"
                    required
                    value={inBatchNumber}
                    onChange={(e) => setInBatchNumber(e.target.value)}
                    placeholder="LOT-2026-X..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hạn dùng nhà sản xuất (*)</label>
                  <input
                    type="date"
                    required
                    value={inExpiryDate}
                    onChange={(e) => setInExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Số lượng nhập ({selectedInReagent?.unit || 'Đơn vị'}) (*)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inQuantity}
                    onChange={(e) => setInQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nhà cung cấp / Phân phối</label>
                  <input
                    type="text"
                    value={inSupplier}
                    onChange={(e) => setInSupplier(e.target.value)}
                    placeholder="Công ty TNHH Thiết bị Y tế..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vị trí lưu trữ đề xuất</label>
                  <select
                    value={inLocationId}
                    onChange={(e) => setInLocationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white font-mono"
                  >
                    <option value="">-- Chưa gán vị trí cố định --</option>
                    {cabinets.flatMap(c => c.shelves.flatMap(s => s.cells.map(cell => (
                      <option key={cell.id} value={cell.code}>
                        {cell.code} - {c.name} ({s.name})
                      </option>
                    ))))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tình trạng bao bì tiếp nhận</label>
                  <select
                    value={inPackagingCondition}
                    onChange={(e) => setInPackagingCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Nguyên vẹn">Nguyên vẹn (Đạt nghiệm thu)</option>
                    <option value="Móp méo">Móp méo (Cách ly theo dõi)</option>
                    <option value="Rò rỉ">Rò rỉ thuốc thử (Cách ly / Trả về)</option>
                    <option value="Nhiệt độ giao nhận sai lệch">Nhiệt độ giao nhận sai lệch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú tiếp nhận (Số hóa đơn, biên bản giao nhận...)</label>
                <textarea
                  rows={2}
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                  placeholder="Ghi nhận số hóa đơn, số biên bản nghiệm thu hoặc lưu ý về lô..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Sau khi xác nhận: Tồn kho cập nhật tức thì, ghi vết Audit Log có mã định danh.
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20"
                >
                  Xác nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info Card */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Quy chuẩn Tiếp nhận (SOP-KHO-01)</span>
              </h3>
              <ul className="space-y-2 text-slate-600 text-[11px] leading-relaxed">
                <li>• <strong>Kiểm tra nhiệt độ:</strong> Hóa chất 2-8°C phải có nhiệt kế thùng hàng hợp lệ khi mở kiện.</li>
                <li>• <strong>Kiểm tra hạn dùng:</strong> Tuyệt đối không nhập lô còn dưới 25% thời hạn hoặc đã quá hạn.</li>
                <li>• <strong>Xếp tầng an toàn:</strong> Chai lọ thể tích lớn hoặc hóa chất ăn mòn xếp ở tầng dưới.</li>
              </ul>
            </div>

            {selectedInReagent && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
                <span className="font-bold text-slate-900 block">Thông tin hóa chất đang chọn:</span>
                <div className="text-slate-600"><strong>Mã:</strong> {selectedInReagent.code}</div>
                <div className="text-slate-600"><strong>Hãng:</strong> {selectedInReagent.manufacturer}</div>
                <div className="text-slate-600"><strong>Bảo quản:</strong> {selectedInReagent.storageCondition} ({selectedInReagent.minTemp}°C - {selectedInReagent.maxTemp}°C)</div>
                <div className="text-slate-600"><strong>Quy cách:</strong> {selectedInReagent.packaging} ({selectedInReagent.unitVolume} {selectedInReagent.volumeUnit})</div>
                <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                  SDS: {selectedInReagent.sdsInfo || 'Chưa đính kèm tài liệu SDS'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: XUẤT KHO FEFO (Section 8 & Section 11) */}
      {activeTab === 'OUTBOUND' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Tạo Phiếu Xuất Kho Cấp Phát Theo FEFO</h2>
                  <p className="text-[11px] text-slate-400">First Expired, First Out - Ưu tiên lô hạn dùng gần nhất</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border">
                Người xuất: {userName}
              </span>
            </div>

            {/* FEFO Automated Suggestion Box */}
            <div className="mb-4 p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-950 block text-sm">
                    Khuyến nghị thuật toán FEFO:
                  </span>
                  <p className="text-blue-900 mt-0.5 leading-relaxed font-medium">
                    {fefoData.explanation}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleOutboundSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày xuất kho (*)</label>
                  <input
                    type="date"
                    required
                    value={outDate}
                    onChange={(e) => setOutDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hóa chất cần xuất (*)</label>
                  <select
                    value={outReagentId}
                    onChange={(e) => {
                      setOutReagentId(e.target.value);
                      setOutBatchId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {reagents.filter(r => r.isActive).map(r => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lot Selection with FEFO Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Chọn Lô xuất kho (*)</span>
                    {recommendedFefoBatch && (
                      <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        FEFO: {recommendedFefoBatch.batchNumber}
                      </span>
                    )}
                  </label>
                  <select
                    value={outBatchId || (recommendedFefoBatch?.id || '')}
                    onChange={(e) => setOutBatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white font-mono"
                  >
                    {availableBatchesForOut.length === 0 ? (
                      <option value="">Không có lô nào còn hàng khả dụng</option>
                    ) : (
                      availableBatchesForOut.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} (Hạn: {b.expiryDate} - Tồn: {b.remainingQuantity} {b.unit} - Vị trí: {b.locationId || 'Chưa rõ'})
                          {b.id === recommendedFefoBatch?.id ? ' ★ [FEFO KHUYÊN DÙNG]' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Số lượng xuất ({selectedOutReagent?.unit || 'Đơn vị'}) (*)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedOutBatch?.remainingQuantity || 999}
                    required
                    value={outQuantity}
                    onChange={(e) => setOutQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Tồn khả dụng lô hiện tại: <strong className="text-slate-700">{selectedOutBatch?.remainingQuantity || 0} {selectedOutReagent?.unit}</strong>
                  </div>
                </div>
              </div>

              {/* WARNING & EXCEPTION REASON IF DEVIATING FROM FEFO (Section 8 Requirement) */}
              {isDifferentFromFefo && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>CẢNH BÁO: Bạn đang chọn xuất lô khác với đề xuất FEFO ({recommendedFefoBatch?.batchNumber})!</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Theo quy trình SOP-KHO-02, người có thẩm quyền bắt buộc phải ghi rõ lý do ngoại lệ (ví dụ: chạy loạt mẫu cùng lot nghiên cứu, hoặc QC song hành) để lưu hồ sơ truy xuất.
                  </p>
                  <div>
                    <label className="font-bold text-amber-950 block mb-1">
                      Lý do xuất ngoại lệ FEFO (* Bắt buộc nhập):
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={outFefoOverrideReason}
                      onChange={(e) => setOutFefoOverrideReason(e.target.value)}
                      placeholder="Ghi rõ lý do đặc thù đã được phê duyệt..."
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bộ phận sử dụng (*)</label>
                  <select
                    value={outDepartment}
                    onChange={(e) => setOutDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Bộ phận Sinh hóa">Bộ phận Sinh hóa</option>
                    <option value="Bộ phận Huyết học">Bộ phận Huyết học</option>
                    <option value="Bộ phận Miễn dịch">Bộ phận Miễn dịch</option>
                    <option value="Bộ phận Đông máu">Bộ phận Đông máu</option>
                    <option value="Bộ phận Vi sinh">Bộ phận Vi sinh</option>
                    <option value="Bộ phận Nước tiểu">Bộ phận Nước tiểu</option>
                    <option value="Phòng QC & Chuẩn">Phòng QC & Chuẩn</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Người nhận hóa chất (*)</label>
                  <input
                    type="text"
                    required
                    value={outReceiver}
                    onChange={(e) => setOutReceiver(e.target.value)}
                    placeholder="Tên kỹ thuật viên nhận..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mục đích sử dụng</label>
                  <input
                    type="text"
                    value={outPurpose}
                    onChange={(e) => setOutPurpose(e.target.value)}
                    placeholder="Chạy máy Cobas / Sysmex..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="Ghi chú thêm nếu cần..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Không cho xuất số lượng âm hoặc vượt tồn khả dụng thực tế.
                </span>
                <button
                  type="submit"
                  disabled={availableBatchesForOut.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm shadow-blue-600/20"
                >
                  Xác nhận Xuất Kho (FEFO)
                </button>
              </div>
            </form>
          </div>

          {/* Outbound Checklist Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Quy tắc FEFO (SOP-KHO-02)</span>
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Hệ thống tự động so khớp tất cả các lô khả dụng, loại trừ các lô hết hạn hoặc cách ly, và đưa ra gợi ý tối ưu nhằm giảm tỷ lệ hủy thuốc thử cận hạn về 0%.
              </p>
            </div>

            {selectedOutBatch && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
                <span className="font-bold text-slate-900 block">Lô xuất hiện tại:</span>
                <div className="text-slate-700 font-mono font-bold">{selectedOutBatch.batchNumber}</div>
                <div className="text-slate-600">Hạn dùng: <strong>{selectedOutBatch.expiryDate}</strong></div>
                <div className="text-slate-600">Vị trí kho: <strong>{selectedOutBatch.locationId || 'Chưa gán'}</strong></div>
                <div className="text-slate-600">Tồn hiện tại: <strong>{selectedOutBatch.remainingQuantity} {selectedOutBatch.unit}</strong></div>
                <div className="text-slate-600">Trạng thái: <strong className="text-emerald-700">{selectedOutBatch.status}</strong></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LỊCH SỬ GIAO DỊCH (Transaction History) */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã giao dịch, hóa chất, số lot, người thực hiện..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500 bg-slate-50/50"
              />
            </div>
            <button
              onClick={() => ExcelService.exportTransactions(transactions)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất Sổ Giao Dịch Excel</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã GD</th>
                    <th className="py-3 px-4">Loại GD</th>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Hóa chất</th>
                    <th className="py-3 px-4">Số Lot</th>
                    <th className="py-3 px-4">Số lượng</th>
                    <th className="py-3 px-4">Bộ phận / Người nhận</th>
                    <th className="py-3 px-4">Người thực hiện</th>
                    <th className="py-3 px-4">FEFO / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                        Chưa có giao dịch nhập/xuất nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{tx.id}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            tx.type === 'NHAP_KHO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type === 'NHAP_KHO' ? (
                              <><ArrowDownLeft className="w-3 h-3" /> Nhập kho</>
                            ) : (
                              <><ArrowUpRight className="w-3 h-3" /> Xuất kho</>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{tx.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{tx.reagentName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{tx.reagentCode}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.batchNumber}</td>
                        <td className="py-3 px-4 font-bold font-mono">
                          {tx.type === 'NHAP_KHO' ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {tx.department || 'Kho trung tâm'}
                          {tx.receiver && <div className="text-[10px] text-slate-400">Người nhận: {tx.receiver}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{tx.performer}</td>
                        <td className="py-3 px-4">
                          {tx.isFefoException && (
                            <div className="text-amber-700 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mb-1 inline-block">
                              Ngoại lệ FEFO: {tx.exceptionReason}
                            </div>
                          )}
                          <div className="text-slate-500 text-[11px] truncate max-w-xs">{tx.notes || '-'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
