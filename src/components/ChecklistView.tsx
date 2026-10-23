import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ShieldAlert,
  Save,
  RotateCcw
} from 'lucide-react';
import { ChecklistItem, UserRole } from '../types';

interface ChecklistViewProps {
  checklist: ChecklistItem[];
  onSaveChecklist: (items: ChecklistItem[]) => void;
  userRole: UserRole;
  userName: string;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist,
  onSaveChecklist,
  userRole,
  userName
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(checklist);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const canEdit = userRole === 'ADMIN' || userRole === 'QUAN_LY_KHO';

  const handleStatusChange = (id: number, status: 'DAT' | 'CHUA_DAT' | 'KHONG_AP_DUNG') => {
    const updated = items.map(it => it.id === id ? { ...it, status } : it);
    setItems(updated);
  };

  const handleNoteChange = (id: number, notes: string) => {
    const updated = items.map(it => it.id === id ? { ...it, notes } : it);
    setItems(updated);
  };

  const handleSave = () => {
    onSaveChecklist(items);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Computations
  const passCount = items.filter(it => it.status === 'DAT').length;
  const failCount = items.filter(it => it.status === 'CHUA_DAT').length;
  const naCount = items.filter(it => it.status === 'KHONG_AP_DUNG').length;
  const applicableCount = items.length - naCount;
  const passRate = applicableCount > 0 ? Math.round((passCount / applicableCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>BẢNG KIỂM TRA ĐÁNH GIÁ 15 TIÊU CHÍ AN TOÀN KHO (CHECKLIST)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bộ tiêu chí chuẩn hóa ISO 15189 phục vụ tự thanh tra và kiểm soát tuân thủ định kỳ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
            <span>Tỷ lệ đạt áp dụng:</span>
            <span className={`px-2 py-0.5 rounded-full text-white ${passRate >= 90 ? 'bg-emerald-600' : passRate >= 75 ? 'bg-amber-600' : 'bg-red-600'}`}>
              {passRate}%
            </span>
          </div>

          {canEdit && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu bảng kiểm</span>
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold">
          Đã lưu kết quả đánh giá 15 tiêu chí thành công!
        </div>
      )}

      {/* Safety Notice (Section 17 Rule) */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 leading-relaxed flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          <strong>LƯU Ý PHÁP LÝ:</strong> "Không tự động kết luận đạt chuẩn an toàn phòng xét nghiệm chỉ dựa trên điểm số checklist. Bảng kiểm là công cụ hỗ trợ rà soát nội bộ, cần kết hợp hồ sơ thẩm định thực tế của hội đồng chuyên môn."
        </span>
      </div>

      {/* 15 Checklist Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Nội dung tiêu chí kiểm tra</th>
                <th className="py-3 px-4 text-center w-56">Đánh giá</th>
                <th className="py-3 px-4">Ghi chú & Bằng chứng kiểm tra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center font-bold text-slate-500 font-mono">
                    {item.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {item.title}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'DAT')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                          item.status === 'DAT'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đạt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'CHUA_DAT')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                          item.status === 'CHUA_DAT'
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-red-700'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Chưa đạt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'KHONG_AP_DUNG')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                          item.status === 'KHONG_AP_DUNG'
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>K/A</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      placeholder="Ghi chú đối chứng..."
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
