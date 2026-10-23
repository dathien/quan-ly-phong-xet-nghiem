import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Calendar,
  Save,
  Check
} from 'lucide-react';
import {
  InventorySession,
  InventoryItemDetail,
  Batch,
  Reagent,
  Cabinet,
  ChemicalGroup,
  UserRole,
  AppSettings
} from '../types';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';

interface InventoryAuditViewProps {
  sessions: InventorySession[];
  batches: Batch[];
  reagents: Reagent[];
  cabinets: Cabinet[];
  groups: ChemicalGroup[];
  settings: AppSettings;
  onSaveSession: (session: InventorySession) => void;
  onApplyInventoryBalance: (session: InventorySession) => { success: boolean; message: string };
  userRole: UserRole;
  userName: string;
}

export const InventoryAuditView: React.FC<InventoryAuditViewProps> = ({
  sessions,
  batches,
  reagents,
  cabinets,
  groups,
  settings,
  onSaveSession,
  onApplyInventoryBalance,
  userRole,
  userName
}) => {
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Session Parameters
  const [sessionTitle, setSessionTitle] = useState('Đợt kiểm kê định kỳ tháng 10/2026');
  const [sessionScope, setSessionScope] = useState<'Toàn bộ kho' | 'Theo tủ' | 'Theo nhóm hóa chất'>('Toàn bộ kho');
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>(cabinets[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');

  const canConfirm = userRole === 'ADMIN' || userRole === 'QUAN_LY_KHO';
  const reagentMap = new Map(reagents.map(r => [r.id, r]));

  // Create new session items from active batches
  const createNewSession = () => {
    let targetBatches = batches.filter(b => b.remainingQuantity > 0 || b.status !== 'DA_SU_DUNG_HET');

    if (sessionScope === 'Theo tủ') {
      const cab = cabinets.find(c => c.id === selectedCabinetId);
      const cabCellCodes = new Set(cab?.shelves.flatMap(s => s.cells.map(c => c.code)) || []);
      targetBatches = targetBatches.filter(b => b.locationId && cabCellCodes.has(b.locationId));
    } else if (sessionScope === 'Theo nhóm hóa chất') {
      const reagentIdsInGroup = new Set(reagents.filter(r => r.groupId === selectedGroupId).map(r => r.id));
      targetBatches = targetBatches.filter(b => reagentIdsInGroup.has(b.reagentId));
    }

    const items: InventoryItemDetail[] = targetBatches.map(b => {
      const rg = reagentMap.get(b.reagentId);
      return {
        id: 'inv-item-' + b.id,
        reagentId: b.reagentId,
        reagentCode: rg?.code || 'N/A',
        reagentName: rg?.name || 'N/A',
        batchId: b.id,
        batchNumber: b.batchNumber,
        locationId: b.locationId || 'Chưa gán',
        expiryDate: b.expiryDate,
        systemQuantity: b.remainingQuantity,
        physicalQuantity: b.remainingQuantity, // Default to system for quick verification
        discrepancy: 0,
        discrepancyReason: '',
        status: 'Chờ đối chiếu'
      };
    });

    const newSession: InventorySession = {
      id: 'inv-sess-' + Date.now(),
      sessionCode: `KK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 90 + 10)}`,
      date: new Date().toISOString().slice(0, 10),
      title: sessionTitle,
      scope: sessionScope,
      cabinetId: sessionScope === 'Theo tủ' ? selectedCabinetId : undefined,
      groupId: sessionScope === 'Theo nhóm hóa chất' ? selectedGroupId : undefined,
      status: 'DANG_TIEN_HANH',
      auditor: userName,
      notes: '',
      items
    };

    onSaveSession(newSession);
    setActiveSession(newSession);
    setShowCreateModal(false);
  };

  // Update item physical count
  const handleItemCountChange = (itemId: string, physicalCount: number) => {
    if (!activeSession) return;
    const updatedItems = activeSession.items.map(it => {
      if (it.id === itemId) {
        const diff = physicalCount - it.systemQuantity;
        return {
          ...it,
          physicalQuantity: physicalCount,
          discrepancy: diff,
          status: 'Đã kiểm tra' as const
        };
      }
      return it;
    });

    const updatedSession = { ...activeSession, items: updatedItems };
    setActiveSession(updatedSession);
    onSaveSession(updatedSession);
  };

  // Update discrepancy reason
  const handleItemReasonChange = (itemId: string, reason: string) => {
    if (!activeSession) return;
    const updatedItems = activeSession.items.map(it => {
      if (it.id === itemId) {
        return { ...it, discrepancyReason: reason };
      }
      return it;
    });
    const updatedSession = { ...activeSession, items: updatedItems };
    setActiveSession(updatedSession);
    onSaveSession(updatedSession);
  };

  // Apply Balance to actual stock
  const handleApplyBalance = () => {
    if (!activeSession) return;
    const res = onApplyInventoryBalance(activeSession);
    setStatusMessage(res.message);
    if (res.success) {
      setActiveSession({
        ...activeSession,
        status: 'DA_CAN_DOI',
        confirmer: userName,
        confirmedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>KIỂM KÊ KHO HÓA CHẤT XÉT NGHIỆM</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              ISO 15189
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu đối chiếu tồn hệ thống vs thực đếm, giải trình chênh lệch và phê duyệt cân đối kho an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đợt kiểm kê mới</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* ACTIVE INVENTORY WORKSPACE */}
      {activeSession ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {activeSession.sessionCode}
                </span>
                <h2 className="text-base font-bold text-slate-900">{activeSession.title}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeSession.status === 'DA_CAN_DOI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeSession.status === 'DA_CAN_DOI' ? 'Đã cân đối kho' : 'Đang kiểm kê'}
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                Ngày: {activeSession.date} • Phạm vi: {activeSession.scope} • Người kiểm: {activeSession.auditor}
                {activeSession.confirmer && ` • Người duyệt: ${activeSession.confirmer}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => ExcelService.exportInventorySession(activeSession)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Xuất Excel</span>
              </button>

              <button
                onClick={() => PdfService.exportInventoryPDF(activeSession, settings)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4 text-rose-600" />
                <span>In Biên Bản PDF</span>
              </button>

              {activeSession.status !== 'DA_CAN_DOI' && canConfirm && (
                <button
                  onClick={handleApplyBalance}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác nhận & Cân đối kho</span>
                </button>
              )}

              <button
                onClick={() => setActiveSession(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
              >
                Đóng phiếu
              </button>
            </div>
          </div>

          {/* Table of items to count */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Mã HC</th>
                  <th className="py-2.5 px-3">Tên hóa chất</th>
                  <th className="py-2.5 px-3">Số Lot</th>
                  <th className="py-2.5 px-3">Vị trí</th>
                  <th className="py-2.5 px-3">Hạn dùng</th>
                  <th className="py-2.5 px-3 text-center">Tồn hệ thống</th>
                  <th className="py-2.5 px-3 text-center">Thực đếm (*)</th>
                  <th className="py-2.5 px-3 text-center">Chênh lệch</th>
                  <th className="py-2.5 px-3">Lý do giải trình chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSession.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{item.reagentCode}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{item.reagentName}</td>
                    <td className="py-2 px-3 font-mono">{item.batchNumber}</td>
                    <td className="py-2 px-3 font-mono text-blue-700">{item.locationId}</td>
                    <td className="py-2 px-3 text-slate-500">{item.expiryDate}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                      {item.systemQuantity}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={activeSession.status === 'DA_CAN_DOI'}
                        value={item.physicalQuantity}
                        onChange={(e) => handleItemCountChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        item.discrepancy === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        disabled={activeSession.status === 'DA_CAN_DOI'}
                        value={item.discrepancyReason || ''}
                        onChange={(e) => handleItemReasonChange(item.id, e.target.value)}
                        placeholder={item.discrepancy !== 0 ? 'Ghi rõ nguyên nhân lệch...' : 'Khớp đúng'}
                        className={`w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${
                          item.discrepancy !== 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* SESSIONS HISTORY LIST */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span>Lịch Sử Các Đợt Kiểm Kê ({sessions.length})</span>
        </h2>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic">
            Chưa có đợt kiểm kê nào được tạo. Hãy bấm "Tạo đợt kiểm kê mới" để bắt đầu.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {s.sessionCode}
                    </span>
                    <span className="font-bold text-slate-900">{s.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'DA_CAN_DOI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.status === 'DA_CAN_DOI' ? 'Đã cân đối' : 'Chưa cân đối'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ngày: {s.date} • Phạm vi: {s.scope} • {s.items.length} mặt hàng đối chiếu • Người thực hiện: {s.auditor}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSession(s)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Mở phiếu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Khởi Tạo Đợt Kiểm Kê Kho Hóa Chất
            </h3>
            <p className="text-slate-500 mb-4">
              Hệ thống sẽ lấy ảnh chụp số lượng tồn kho hiện tại để đối chiếu với thực tế đếm được.
            </p>

            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên đợt kiểm kê (*)</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phạm vi kiểm kê (*)</label>
                <select
                  value={sessionScope}
                  onChange={(e) => setSessionScope(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Toàn bộ kho">Toàn bộ kho (Tất cả hóa chất)</option>
                  <option value="Theo tủ">Theo từng tủ / kệ lưu trữ cụ thể</option>
                  <option value="Theo nhóm hóa chất">Theo nhóm xét nghiệm</option>
                </select>
              </div>

              {sessionScope === 'Theo tủ' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chọn tủ kiểm kê</label>
                  <select
                    value={selectedCabinetId}
                    onChange={(e) => setSelectedCabinetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {cabinets.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {sessionScope === 'Theo nhóm hóa chất' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chọn nhóm xét nghiệm</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={createNewSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Bắt đầu kiểm kê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
