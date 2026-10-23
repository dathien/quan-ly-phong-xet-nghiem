import React, { useState } from 'react';
import {
  Boxes,
  Thermometer,
  Plus,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRightLeft,
  Calendar,
  User,
  History,
  FileCheck
} from 'lucide-react';
import {
  Cabinet,
  Shelf,
  ShelfCell,
  TemperatureLog,
  Batch,
  Reagent,
  UserRole
} from '../types';
import { isExpired, getDaysUntilExpiry } from '../services/calculationService';

interface CabinetViewProps {
  cabinets: Cabinet[];
  batches: Batch[];
  reagents: Reagent[];
  temperatureLogs: TemperatureLog[];
  onSaveCabinets: (cabinets: Cabinet[]) => void;
  onAddTemperatureLog: (log: Omit<TemperatureLog, 'id'>) => void;
  onConfirmRelocation: (sourceCellId: string, targetCellId: string) => void;
  userRole: UserRole;
  userName: string;
}

export const CabinetView: React.FC<CabinetViewProps> = ({
  cabinets,
  batches,
  reagents,
  temperatureLogs,
  onSaveCabinets,
  onAddTemperatureLog,
  onConfirmRelocation,
  userRole,
  userName
}) => {
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>(cabinets[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'LAYOUT' | 'TEMPERATURE'>('LAYOUT');

  // Proposal re-arrangement state (Section 9 Requirement: Draft proposal only, not applied until confirmed)
  const [proposedRelocation, setProposedRelocation] = useState<{
    sourceCell: ShelfCell;
    targetCell: ShelfCell;
    sourceCabinet: Cabinet;
    targetCabinet: Cabinet;
  } | null>(null);

  // Manual Temperature Log Modal
  const [showTempModal, setShowTempModal] = useState(false);
  const [measuredTemp, setMeasuredTemp] = useState<number>(4.0);
  const [tempDevice, setTempDevice] = useState('Nhiệt ẩm kế Testo 174T có hiệu chuẩn');
  const [tempNotes, setTempNotes] = useState('');

  const selectedCabinet = cabinets.find(c => c.id === selectedCabinetId) || cabinets[0];

  // Latest temp log for selected cabinet
  const cabinetLogs = temperatureLogs.filter(l => l.cabinetId === selectedCabinet?.id);
  const latestLog = cabinetLogs[0];

  // Check temperature violations
  const isCurrentTempViolated = latestLog && (latestLog.temperature < selectedCabinet.minTemp || latestLog.temperature > selectedCabinet.maxTemp);

  // Reagent map
  const reagentMap = new Map(reagents.map(r => [r.id, r]));

  return (
    <div className="space-y-6">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>SƠ ĐỒ TỦ HÓA CHẤT & NHẬT KÝ NHIỆT ĐỘ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mã hóa vị trí C-S-A, quản lý phương án sắp đặt chống nhầm lẫn và nhật ký nhiệt độ tủ kiểm định.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('LAYOUT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'LAYOUT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Sơ đồ trực quan tủ</span>
          </button>
          <button
            onClick={() => setActiveTab('TEMPERATURE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TEMPERATURE'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>Nhật ký nhiệt độ ({temperatureLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Cabinet Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {cabinets.map(cab => {
          const isSelected = cab.id === selectedCabinet?.id;
          const isCold = cab.type.includes('2-8°C') || cab.type.includes('âm');

          return (
            <button
              key={cab.id}
              onClick={() => setSelectedCabinetId(cab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600'}`}>
                {isCold ? <Thermometer className="w-3.5 h-3.5" /> : <Boxes className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left">
                <div>{cab.name}</div>
                <div className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  Mã: {cab.code} • Chuẩn: {cab.minTemp}°C đến {cab.maxTemp}°C
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* PROPOSAL NOTICE BANNER (Section 9 Rule) */}
      {proposedRelocation && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>PHƯƠNG ÁN ĐỀ XUẤT DI CHUYỂN VỊ TRÍ HÓA CHẤT (BẢN DỰ THẢO)</span>
            </div>
            <button onClick={() => setProposedRelocation(null)} className="text-amber-600 font-bold">✕ Hủy đề xuất</button>
          </div>
          <p className="text-amber-800 leading-relaxed">
            <strong>Quan trọng:</strong> Thao tác thay đổi vị trí trên sơ đồ chỉ tạo phương án đề xuất. Hệ thống <strong>KHÔNG tự động thay đổi tồn kho thực tế</strong> cho đến khi người có thẩm quyền xác nhận đã hoàn tất di chuyển vật lý tại phòng xét nghiệm.
          </p>
          <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500">Chuyển từ:</span>{' '}
              <strong className="font-mono text-slate-800">{proposedRelocation.sourceCell.code}</strong> ({proposedRelocation.sourceCell.reagentName || 'Hóa chất'})
              {' '}&rarr;{' '}
              <span className="text-slate-500">Sang vị trí mới:</span>{' '}
              <strong className="font-mono text-blue-700">{proposedRelocation.targetCell.code}</strong>
            </div>
            <button
              onClick={() => {
                onConfirmRelocation(proposedRelocation.sourceCell.id, proposedRelocation.targetCell.id);
                setProposedRelocation(null);
              }}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Xác nhận di chuyển thực tế
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: VISUAL SHELF LAYOUT */}
      {activeTab === 'LAYOUT' && selectedCabinet && (
        <div className="space-y-6">
          {/* Cabinet Info Overview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
            <div>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 mr-2">
                {selectedCabinet.code}
              </span>
              <span className="font-bold text-slate-800 text-sm">{selectedCabinet.name}</span>
              <div className="text-slate-500 mt-1">
                Vị trí: {selectedCabinet.locationDescription} | Phụ trách: <strong>{selectedCabinet.assignedPerson}</strong> | Tần suất đo: {selectedCabinet.checkFrequency}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-teal-600" />
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Nhiệt độ quy chuẩn</div>
                  <div className="font-mono font-bold text-slate-800">{selectedCabinet.minTemp}°C &rarr; {selectedCabinet.maxTemp}°C</div>
                </div>
              </div>

              <button
                onClick={() => setShowTempModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận đo nhiệt độ</span>
              </button>
            </div>
          </div>

          {/* Out of bounds alert notice if violated */}
          {isCurrentTempViolated && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl text-xs text-red-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>
                  <strong>CẢNH BÁO SỰ CỐ NHIỆT ĐỘ:</strong> Nhiệt độ gần nhất đo được là {latestLog.temperature}°C, vượt ra ngoài giới hạn cho phép ({selectedCabinet.minTemp}°C - {selectedCabinet.maxTemp}°C). Tất cả các lô trong tủ cần được người phụ trách đánh giá trước khi xuất sử dụng!
                </span>
              </div>
            </div>
          )}

          {/* Visual Shelf Display (Section 9) */}
          <div className="space-y-4">
            {selectedCabinet.shelves.map((shelf) => (
              <div key={shelf.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="font-extrabold text-sm text-slate-800">{shelf.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Tầng {shelf.shelfNumber} • {shelf.cells.length} ô lưu trữ
                  </span>
                </div>

                {/* Grid of Cells in Shelf */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {shelf.cells.map((cell) => {
                    const hasChemical = Boolean(cell.batchId || cell.reagentName);
                    const daysLeft = cell.expiryDate ? getDaysUntilExpiry(cell.expiryDate) : 999;
                    const expired = cell.expiryDate ? isExpired(cell.expiryDate) : false;

                    return (
                      <div
                        key={cell.id}
                        className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between min-h-[140px] ${
                          hasChemical
                            ? expired
                              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
                              : daysLeft <= 30
                              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs'
                            : 'bg-slate-50/60 border-dashed border-slate-300 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        <div>
                          {/* Top row: Cell code & status */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                              {cell.code}
                            </span>
                            {hasChemical && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                expired ? 'bg-red-100 text-red-800' : daysLeft <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {expired ? 'Hết hạn' : daysLeft <= 30 ? 'Cận hạn' : 'Khả dụng'}
                              </span>
                            )}
                          </div>

                          {/* Chemical info */}
                          {hasChemical ? (
                            <div>
                              <div className="font-bold text-slate-900 text-xs line-clamp-1" title={cell.reagentName}>
                                {cell.reagentName}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 font-semibold mt-0.5">
                                Lot: {cell.batchNumber || 'N/A'}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Hạn: <strong>{cell.expiryDate || 'N/A'}</strong> ({daysLeft < 900 ? `${daysLeft} ngày` : ''})
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Tồn: <strong>{cell.quantity || 0} đơn vị</strong>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-20 text-center">
                              <span className="text-[11px] font-semibold text-slate-400">{cell.name || 'Ô trống'}</span>
                              <span className="text-[10px] text-slate-400">Sẵn sàng bố trí</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom action: Propose relocation */}
                        {hasChemical && userRole !== 'NHAN_VIEN' && (
                          <div className="pt-2 mt-2 border-t border-slate-100/80 flex justify-end">
                            <button
                              onClick={() => {
                                // Find first empty cell in other shelves to propose
                                const target = selectedCabinet.shelves
                                  .flatMap(s => s.cells)
                                  .find(c => c.id !== cell.id && !c.batchId);
                                if (target) {
                                  setProposedRelocation({
                                    sourceCell: cell,
                                    targetCell: target,
                                    sourceCabinet: selectedCabinet,
                                    targetCabinet: selectedCabinet
                                  });
                                } else {
                                  alert('Không có ô trống nào khác trong tủ để đề xuất di chuyển.');
                                }
                              }}
                              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Lập đề xuất chuyển ô</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TEMPERATURE MONITORING LOGS (Section 10) */}
      {activeTab === 'TEMPERATURE' && selectedCabinet && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800">Nhật ký Theo Dõi Nhiệt Độ Tủ {selectedCabinet.name}</h2>
              <p className="text-slate-400 mt-0.5">
                Quy định giám sát tối thiểu 2 lần/ngày bằng thiết bị kiểm định. Không giả lập dữ liệu thời gian thực.
              </p>
            </div>
            <button
              onClick={() => setShowTempModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhận số đo mới</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thời gian đo</th>
                    <th className="py-3 px-4">Mã tủ</th>
                    <th className="py-3 px-4">Nhiệt độ đo được</th>
                    <th className="py-3 px-4">Dải quy chuẩn</th>
                    <th className="py-3 px-4">Thiết bị đo</th>
                    <th className="py-3 px-4">Người đo</th>
                    <th className="py-3 px-4">Đánh giá an toàn</th>
                    <th className="py-3 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cabinetLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Chưa có lượt ghi nhận nhiệt độ nào cho tủ này.
                      </td>
                    </tr>
                  ) : (
                    cabinetLogs.map((log) => {
                      const violated = log.temperature < selectedCabinet.minTemp || log.temperature > selectedCabinet.maxTemp;
                      return (
                        <tr key={log.id} className={`hover:bg-slate-50 ${violated ? 'bg-red-50/30' : ''}`}>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {new Date(log.recordedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{log.cabinetCode}</td>
                          <td className="py-3 px-4">
                            <span className={`font-mono text-sm font-black ${violated ? 'text-red-700 font-bold' : 'text-teal-700'}`}>
                              {log.temperature > 0 ? `+${log.temperature}` : log.temperature}°C
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {selectedCabinet.minTemp}°C đến {selectedCabinet.maxTemp}°C
                          </td>
                          <td className="py-3 px-4 text-slate-600">{log.deviceUsed}</td>
                          <td className="py-3 px-4 text-slate-800 font-semibold">{log.recordedBy}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              violated ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {violated ? 'VƯỢT GIỚI HẠN (SỰ CỐ)' : 'ĐẠT CHUẨN'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{log.notes || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECORD TEMPERATURE MODAL */}
      {showTempModal && selectedCabinet && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Ghi nhận Đo Nhiệt Độ Tủ {selectedCabinet.name}
            </h3>
            <p className="text-slate-500 mb-4">
              Dải nhiệt độ quy chuẩn: <strong className="text-blue-700 font-mono">{selectedCabinet.minTemp}°C đến {selectedCabinet.maxTemp}°C</strong>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const isOutOf = measuredTemp < selectedCabinet.minTemp || measuredTemp > selectedCabinet.maxTemp;
                onAddTemperatureLog({
                  cabinetId: selectedCabinet.id,
                  cabinetCode: selectedCabinet.code,
                  cabinetName: selectedCabinet.name,
                  recordedAt: new Date().toISOString(),
                  temperature: measuredTemp,
                  deviceUsed: tempDevice,
                  recordedBy: userName,
                  isOutOfRange: isOutOf,
                  notes: tempNotes
                });
                setShowTempModal(false);
                setTempNotes('');
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nhiệt độ đo được (°C) (*)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={measuredTemp}
                  onChange={(e) => setMeasuredTemp(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:border-teal-500"
                />
                {measuredTemp < selectedCabinet.minTemp || measuredTemp > selectedCabinet.maxTemp ? (
                  <div className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Nhiệt độ này vượt ngoài khoảng cho phép! Hệ thống sẽ kích hoạt cảnh báo sự cố.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Thiết bị đo nhiệt độ</label>
                <input
                  type="text"
                  required
                  value={tempDevice}
                  onChange={(e) => setTempDevice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú quan sát cảm quan</label>
                <textarea
                  rows={2}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Tình trạng gioăng tủ, tiếng máy nén, có đóng tuyết không..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTempModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Lưu kết quả đo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
