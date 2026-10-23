import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Save,
  CheckCircle2,
  Globe,
  Sliders,
  History,
  Info
} from 'lucide-react';
import { AppSettings, UserRole, AuditLog } from '../types';
import { LabStorage } from '../services/storage';

interface SettingsViewProps {
  settings: AppSettings;
  auditLogs: AuditLog[];
  onSaveSettings: (settings: AppSettings) => void;
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
  onRestoreBackupJSON: (jsonStr: string) => { success: boolean; message: string };
  userRole: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  auditLogs,
  onSaveSettings,
  onClearDemoData,
  onRestoreDemoData,
  onRestoreBackupJSON,
  userRole
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [confirmRestoreModal, setConfirmRestoreModal] = useState(false);

  const canEdit = userRole === 'ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveMessage('Đã lưu cấu hình tham số hệ thống thành công.');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = LabStorage.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LAB_CHEM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = onRestoreBackupJSON(content);
      alert(res.message);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>CÀI ĐẶT THAM SỐ & LƯU TRỮ HỆ THỐNG</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tùy biến ngưỡng cảnh báo ngày tồn kho, thông tin đơn vị, sao lưu JSON và tích hợp đồng bộ đa người dùng.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Offline Mode Security Notice (Section 20 & 21 Mandatory) */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-800 leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block">THÔNG BÁO CHẾ ĐỘ LƯU TRỮ CÁ NHÂN (LOCAL / OFFLINE):</span>
          <span>
            Hệ thống hiện đang chạy ở <strong>Chế độ cá nhân (Offline / LocalStorage & IndexedDB)</strong>. Dữ liệu được bảo toàn trực tiếp trên trình duyệt của máy tính này. Chế độ này không sử dụng cơ chế xác thực phân quyền mật khẩu máy chủ. Khi triển khai nhiều người dùng đồng thời, cần kết nối Webhook Google Apps Script hoặc cơ sở dữ liệu tập trung.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Ngưỡng Cảnh Báo Tồn Kho (Ngày Tiêu Hao)</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-red-700 block mb-1">Ngưỡng Đỏ (Dưới X ngày)</label>
              <input
                type="number"
                min="1"
                required
                disabled={!canEdit}
                value={formData.thresholdRedDays}
                onChange={(e) => setFormData({ ...formData, thresholdRedDays: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50/30 text-xs font-bold font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="font-semibold text-orange-700 block mb-1">Ngưỡng Cam (Dưới X ngày)</label>
              <input
                type="number"
                min="2"
                required
                disabled={!canEdit}
                value={formData.thresholdOrangeDays}
                onChange={(e) => setFormData({ ...formData, thresholdOrangeDays: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/30 text-xs font-bold font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="font-semibold text-yellow-800 block mb-1">Ngưỡng Vàng (Dưới X ngày)</label>
              <input
                type="number"
                min="5"
                required
                disabled={!canEdit}
                value={formData.thresholdYellowDays}
                onChange={(e) => setFormData({ ...formData, thresholdYellowDays: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 rounded-xl border border-yellow-200 bg-yellow-50/30 text-xs font-bold font-mono focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="font-semibold text-amber-800 block mb-1">Cảnh báo Cận Hạn (Ngày)</label>
              <input
                type="number"
                min="7"
                required
                disabled={!canEdit}
                value={formData.nearExpiryAlertDays}
                onChange={(e) => setFormData({ ...formData, nearExpiryAlertDays: parseInt(e.target.value) || 7 })}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/30 text-xs font-bold font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-800 pt-3 border-t border-slate-100">
            Thông Tin Đơn Vị Phòng Xét Nghiệm
          </h2>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên đơn vị chính</label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={formData.labName}
              onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên khoa / Tiêu chuẩn áp dụng</label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={formData.labSubName}
              onChange={(e) => setFormData({ ...formData, labSubName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.requireFefoOverrideReason}
                onChange={(e) => setFormData({ ...formData, requireFefoOverrideReason: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Bắt buộc nhập lý do khi xuất lệch quy tắc FEFO</span>
            </label>
          </div>

          {canEdit && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          )}
        </form>

        {/* Data Persistence, Backup & Demo Data Management */}
        <div className="space-y-6 text-xs">
          {/* Backup & Restore JSON */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-600" />
              <span>Sao Lưu & Khôi Phục Dữ Liệu (JSON)</span>
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Tải về toàn bộ cơ sở dữ liệu (hóa chất, các lô, giao dịch, nhật ký nhiệt độ, SOPs, checklist) dưới dạng tệp JSON an toàn.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp Sao lưu (.json)</span>
              </button>

              {canEdit && (
                <label className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Khôi phục từ tệp .json</span>
                  <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Demo Data Management (Section 22 Requirement) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-sm">Quản Lý Bộ Dữ Liệu Demo Minh Họa</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Tất cả dữ liệu mẫu bao gồm 12 nhóm, 20 sản phẩm, các lô FEFO và tủ bảo quản được gắn nhãn:
              <br />
              <strong className="text-amber-900">"DỮ LIỆU DEMO – KHÔNG DÙNG CHO QUYẾT ĐỊNH CHUYÊN MÔN"</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmClearModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>XÓA DỮ LIỆU DEMO</span>
              </button>

              <button
                onClick={() => setConfirmRestoreModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl border border-teal-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Khôi phục dữ liệu Demo chuẩn</span>
              </button>
            </div>
          </div>

          {/* Shared Sync Connector (Section 21 Google Sheets / Apps Script) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Kết Nối Đồng Bộ Google Sheets & Apps Script</span>
            </h2>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Khi mở rộng dùng chung nhiều kỹ thuật viên, cấu hình URL Web App Google Apps Script để nhận webhook giao dịch nhập/xuất.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                disabled={!canEdit}
                placeholder="https://script.google.com/macros/s/.../exec"
                value={formData.googleSheetsUrl || ''}
                onChange={(e) => setFormData({ ...formData, googleSheetsUrl: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => alert('Webhook đồng bộ đã được cấu hình trong bộ nhớ client. Khi nhiều người thao tác đồng thời, cần sử dụng Apps Script LockService để chống ghi trùng và khóa tồn.')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shrink-0 cursor-pointer"
              >
                Kiểm tra
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table (Section 21) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span>Nhật Ký Vết Hệ Thống (Audit Logs)</span>
        </h2>
        <div className="overflow-x-auto max-h-60">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Thời gian</th>
                <th className="py-2 px-3">Người dùng</th>
                <th className="py-2 px-3">Hành động</th>
                <th className="py-2 px-3">Phân loại</th>
                <th className="py-2 px-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 15).map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{log.user}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{log.action}</td>
                  <td className="py-2 px-3 font-mono text-blue-700">{log.entityType}</td>
                  <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM CLEAR DEMO MODAL */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base mb-3">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Xác nhận xóa sạch dữ liệu demo</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Thao tác này sẽ dọn sạch danh mục, các lô và giao dịch demo để bạn bắt đầu nhập dữ liệu phòng lab thực tế của đơn vị.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onClearDemoData();
                  setConfirmClearModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESTORE DEMO MODAL */}
      {confirmRestoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-base mb-3">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <span>Khôi phục dữ liệu demo mẫu</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Nạp lại 12 nhóm, 20 sản phẩm xét nghiệm thực tế (Glucose, Urea, Creatinine, Cellpack, TSH, Thromborel...) và các kịch bản kiểm thử FEFO.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmRestoreModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onRestoreDemoData();
                  setConfirmRestoreModal(false);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Khôi phục ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
