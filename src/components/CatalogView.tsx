import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { Reagent, ChemicalGroup, UserRole } from '../types';
import { ExcelService } from '../services/excelService';

interface CatalogViewProps {
  reagents: Reagent[];
  groups: ChemicalGroup[];
  onSaveReagent: (reagent: Reagent) => void;
  onDeleteReagent: (id: string) => void;
  onSaveGroup: (group: ChemicalGroup) => void;
  userRole: UserRole;
  searchQuery?: string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  reagents,
  groups,
  onSaveReagent,
  onDeleteReagent,
  onSaveGroup,
  userRole,
  searchQuery = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'group'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [editingReagent, setEditingReagent] = useState<Partial<Reagent> | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groupEditing, setGroupEditing] = useState<Partial<ChemicalGroup> | null>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const canEdit = userRole === 'ADMIN' || userRole === 'QUAN_LY_KHO';

  // Group Map
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // Auto-group suggest logic
  const suggestGroupForName = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('glucose') || lower.includes('urea') || lower.includes('creatinine') || lower.includes('ast') || lower.includes('alt') || lower.includes('crp') || lower.includes('bilirubin')) {
      return groups.find(g => g.code === 'SH')?.id || 'grp-12';
    }
    if (lower.includes('cellpack') || lower.includes('fluorocell') || lower.includes('lyse') || lower.includes('huyết học') || lower.includes('cbc')) {
      return groups.find(g => g.code === 'HH')?.id || 'grp-12';
    }
    if (lower.includes('tsh') || lower.includes('ft4') || lower.includes('troponin') || lower.includes('ferritin') || lower.includes('elecsys')) {
      return groups.find(g => g.code === 'MD')?.id || 'grp-12';
    }
    if (lower.includes('thromborel') || lower.includes('pathromtin') || lower.includes('pt') || lower.includes('aptt') || lower.includes('fibrinogen')) {
      return groups.find(g => g.code === 'DM')?.id || 'grp-12';
    }
    if (lower.includes('ise') || lower.includes('điện giải') || lower.includes('electrolytes')) {
      return groups.find(g => g.code === 'DG')?.id || 'grp-12';
    }
    if (lower.includes('combur') || lower.includes('urysis') || lower.includes('nước tiểu') || lower.includes('urinalysis')) {
      return groups.find(g => g.code === 'NT')?.id || 'grp-12';
    }
    if (lower.includes('precicontrol') || lower.includes('qc') || lower.includes('control') || lower.includes('calibrator') || lower.includes('chuẩn')) {
      return groups.find(g => g.code === 'QC')?.id || 'grp-12';
    }
    if (lower.includes('cellclean') || lower.includes('wash') || lower.includes('cleaner') || lower.includes('tẩy')) {
      return groups.find(g => g.code === 'CL')?.id || 'grp-12';
    }
    if (lower.includes('tip') || lower.includes('cuvette') || lower.includes('găng tay') || lower.includes('vật tư')) {
      return groups.find(g => g.code === 'VT')?.id || 'grp-12';
    }
    if (lower.includes('agar') || lower.includes('thạch') || lower.includes('cấy') || lower.includes('vi sinh')) {
      return groups.find(g => g.code === 'VS')?.id || 'grp-12';
    }
    // Default to "Chưa xác định"
    return groups.find(g => g.code === 'CXD')?.id || 'grp-12';
  };

  // Filter & Sort
  const filteredReagents = reagents
    .filter(r => {
      if (showActiveOnly && !r.isActive) return false;
      if (selectedGroupId !== 'ALL' && r.groupId !== selectedGroupId) return false;
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return (
          r.name.toLowerCase().includes(term) ||
          r.code.toLowerCase().includes(term) ||
          r.brandName.toLowerCase().includes(term) ||
          r.manufacturer.toLowerCase().includes(term) ||
          r.productCode.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'code') comparison = a.code.localeCompare(b.code);
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'group') {
        const groupA = groupMap.get(a.groupId)?.name || '';
        const groupB = groupMap.get(b.groupId)?.name || '';
        comparison = groupA.localeCompare(groupB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const defaultGroup = groups[0]?.id || 'grp-1';
      const parsed = await ExcelService.parseReagentsExcel(file, defaultGroup);
      let count = 0;
      for (const item of parsed) {
        if (item.name) {
          const newReagent: Reagent = {
            id: 'rg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            code: item.code || `HC-${Date.now().toString().slice(-4)}`,
            name: item.name,
            brandName: item.brandName || '',
            groupId: item.groupId || defaultGroup,
            manufacturer: item.manufacturer || 'Chưa rõ',
            productCode: item.productCode || '',
            packaging: item.packaging || 'Hộp',
            unitVolume: item.unitVolume || 100,
            volumeUnit: item.volumeUnit || 'mL',
            unit: (item.unit as any) || 'Hộp',
            standardTestsPerUnit: item.standardTestsPerUnit || 100,
            consumptionPerTest: item.consumptionPerTest || 0.1,
            averageTestsPerDay: item.averageTestsPerDay || 10,
            storageCondition: item.storageCondition || '2-8°C',
            minTemp: item.minTemp || 2,
            maxTemp: item.maxTemp || 8,
            usageFrequency: item.usageFrequency || 'Trung bình',
            importanceLevel: item.importanceLevel || 'Quan trọng',
            hazardClassification: item.hazardClassification || 'Chưa xác minh',
            sdsInfo: item.sdsInfo || '',
            notes: item.notes || 'Nhập từ file Excel',
            minStockThreshold: item.minStockThreshold || 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onSaveReagent(newReagent);
          count++;
        }
      }
      setImportStatusMessage(`Đã nhập thành công ${count} hóa chất từ file Excel.`);
      setTimeout(() => setImportStatusMessage(null), 4000);
    } catch (err: any) {
      setImportStatusMessage(`Lỗi khi đọc file Excel: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>DANH MỤC HÓA CHẤT XÉT NGHIỆM</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredReagents.length} / {reagents.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ kỹ thuật, thông số tiêu hao, điều kiện bảo quản và phân loại 12 nhóm chuyên môn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={() => {
                setEditingReagent({
                  code: `HC-${Date.now().toString().slice(-4)}`,
                  name: '',
                  brandName: '',
                  groupId: groups[0]?.id || 'grp-1',
                  manufacturer: '',
                  productCode: '',
                  packaging: 'Hộp 4 chai x 50mL',
                  unitVolume: 200,
                  volumeUnit: 'mL',
                  unit: 'Hộp',
                  standardTestsPerUnit: 1000,
                  consumptionPerTest: 0.2,
                  averageTestsPerDay: 50,
                  storageCondition: '2-8°C',
                  minTemp: 2,
                  maxTemp: 8,
                  usageFrequency: 'Cao',
                  importanceLevel: 'Quan trọng',
                  hazardClassification: 'Chưa có phân loại nguy hại',
                  sdsInfo: '',
                  notes: '',
                  minStockThreshold: 2,
                  isActive: true
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm hóa chất</span>
            </button>
          )}

          <button
            onClick={() => setShowGroupManager(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>12 Nhóm</span>
          </button>

          <button
            onClick={() => ExcelService.exportReagents(reagents, groups)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Xuất bảng Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          {canEdit && (
            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Nhập Excel</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {importStatusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{importStatusMessage}</span>
          <button onClick={() => setImportStatusMessage(null)} className="text-blue-500 font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên, hãng, Cat No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Nhóm:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả các nhóm (12 nhóm)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="name">Tên hóa chất</option>
              <option value="code">Mã hóa chất</option>
              <option value="group">Nhóm xét nghiệm</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Active status filter */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>Chỉ mục đang dùng</span>
          </label>
        </div>
      </div>

      {/* Chemical Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã HC</th>
                <th className="py-3 px-4">Tên hóa chất & Thương hiệu</th>
                <th className="py-3 px-4">Nhóm xét nghiệm</th>
                <th className="py-3 px-4">Quy cách & Thể tích</th>
                <th className="py-3 px-4">Tiêu hao / Ngày</th>
                <th className="py-3 px-4">Bảo quản</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReagents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Không tìm thấy hóa chất nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredReagents.map((reagent) => {
                  const grp = groupMap.get(reagent.groupId);
                  const isMissing = !reagent.unitVolume || !reagent.consumptionPerTest || !reagent.averageTestsPerDay;

                  return (
                    <tr key={reagent.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {reagent.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{reagent.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {reagent.brandName ? `${reagent.brandName} • ` : ''}{reagent.manufacturer} {reagent.productCode ? `(Cat: ${reagent.productCode})` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                          style={{ backgroundColor: grp?.color || '#64748B' }}
                        >
                          {grp?.name || 'Chưa xác định'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{reagent.packaging}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {reagent.unitVolume} {reagent.volumeUnit} / {reagent.unit}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isMissing ? (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Thiếu thông số
                          </span>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800">{reagent.averageTestsPerDay} test/ngày</span>
                            <div className="text-[11px] text-slate-400 font-mono">R = {reagent.consumptionPerTest} {reagent.volumeUnit}/test</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {reagent.storageCondition}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reagent.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {reagent.isActive ? 'Đang dùng' : 'Ngừng dùng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingReagent(reagent)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa thông tin hóa chất"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => setIsDeletingId(reagent.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Ngừng sử dụng hoặc Xóa hóa chất"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* ADD / EDIT REAGENT MODAL */}
      {editingReagent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingReagent.id ? 'Chỉnh sửa thông tin hóa chất' : 'Thêm mới hóa chất vào danh mục'}
              </h2>
              <button onClick={() => setEditingReagent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingReagent.code || !editingReagent.name) return;
                const fullReagent: Reagent = {
                  id: editingReagent.id || 'rg-' + Date.now(),
                  code: editingReagent.code.trim().toUpperCase(),
                  name: editingReagent.name.trim(),
                  brandName: editingReagent.brandName || '',
                  groupId: editingReagent.groupId || groups[0]?.id || 'grp-1',
                  manufacturer: editingReagent.manufacturer || 'Chưa rõ',
                  productCode: editingReagent.productCode || '',
                  packaging: editingReagent.packaging || 'Hộp',
                  unitVolume: Number(editingReagent.unitVolume || 0),
                  volumeUnit: editingReagent.volumeUnit || 'mL',
                  unit: editingReagent.unit || 'Hộp',
                  standardTestsPerUnit: Number(editingReagent.standardTestsPerUnit || 0),
                  consumptionPerTest: Number(editingReagent.consumptionPerTest || 0),
                  averageTestsPerDay: Number(editingReagent.averageTestsPerDay || 0),
                  storageCondition: editingReagent.storageCondition || '2-8°C',
                  minTemp: Number(editingReagent.minTemp || 2),
                  maxTemp: Number(editingReagent.maxTemp || 8),
                  usageFrequency: editingReagent.usageFrequency || 'Cao',
                  importanceLevel: editingReagent.importanceLevel || 'Quan trọng',
                  hazardClassification: editingReagent.hazardClassification || 'Chưa xác minh',
                  sdsInfo: editingReagent.sdsInfo || '',
                  notes: editingReagent.notes || '',
                  minStockThreshold: Number(editingReagent.minStockThreshold || 2),
                  isActive: editingReagent.isActive ?? true,
                  createdAt: editingReagent.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                onSaveReagent(fullReagent);
                setEditingReagent(null);
              }}
              className="py-4 space-y-4 text-xs"
            >
              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã hóa chất (*)</label>
                  <input
                    type="text"
                    required
                    value={editingReagent.code || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="HC-GLU-01"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Tên hóa chất danh pháp (*)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingReagent.name) {
                          const suggested = suggestGroupForName(editingReagent.name);
                          setEditingReagent({ ...editingReagent, groupId: suggested });
                        }
                      }}
                      className="text-[11px] text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Gợi ý nhóm
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReagent.name || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="Glucose Hexokinase Enzymatic"
                  />
                </div>
              </div>

              {/* Row 2: Brand, Group, Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tên thương mại</label>
                  <input
                    type="text"
                    value={editingReagent.brandName || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, brandName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="GLUC3 Cobas c501"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nhóm xét nghiệm (*)</label>
                  <select
                    value={editingReagent.groupId || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, groupId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hãng sản xuất</label>
                  <input
                    type="text"
                    value={editingReagent.manufacturer || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="Roche Diagnostics / Sysmex..."
                  />
                </div>
              </div>

              {/* Row 3: Product Code, Packaging, Unit, Volume */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã sản phẩm (Cat No)</label>
                  <input
                    type="text"
                    value={editingReagent.productCode || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, productCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="04404483190"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Đơn vị tính (*)</label>
                  <select
                    value={editingReagent.unit || 'Hộp'}
                    onChange={(e) => setEditingReagent({ ...editingReagent, unit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Hộp">Hộp</option>
                    <option value="Chai">Chai</option>
                    <option value="Bộ kit">Bộ kit</option>
                    <option value="Ống">Ống</option>
                    <option value="Gói">Gói</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dung tích đơn vị (*)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingReagent.unitVolume || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, unitVolume: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Đơn vị thể tích</label>
                  <select
                    value={editingReagent.volumeUnit || 'mL'}
                    onChange={(e) => setEditingReagent({ ...editingReagent, volumeUnit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="test">test</option>
                    <option value="g">g</option>
                    <option value="kit">kit</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Calculation parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200/60">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Số test chuẩn/đơn vị</label>
                  <input
                    type="number"
                    min="0"
                    value={editingReagent.standardTestsPerUnit || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, standardTestsPerUnit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                    placeholder="3200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Tiêu hao / test (R) [mL]</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editingReagent.consumptionPerTest || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, consumptionPerTest: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                    placeholder="0.15"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Số test TB/ngày (T)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingReagent.averageTestsPerDay || ''}
                    onChange={(e) => setEditingReagent({ ...editingReagent, averageTestsPerDay: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                    placeholder="250"
                  />
                </div>
              </div>

              {/* Row 5: Storage & Safety */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Điều kiện bảo quản (*)</label>
                  <select
                    value={editingReagent.storageCondition || '2-8°C'}
                    onChange={(e) => setEditingReagent({ ...editingReagent, storageCondition: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="2-8°C">2-8°C (Tủ mát)</option>
                    <option value="15-25°C">15-25°C (Nhiệt độ phòng)</option>
                    <option value="-20°C">-20°C (Âm sâu)</option>
                    <option value="-80°C">-80°C (Âm siêu sâu)</option>
                    <option value="Tránh ánh sáng">Tránh ánh sáng</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mức độ quan trọng</label>
                  <select
                    value={editingReagent.importanceLevel || 'Quan trọng'}
                    onChange={(e) => setEditingReagent({ ...editingReagent, importanceLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Tối quan trọng">Tối quan trọng (Cấp cứu/Chạy hàng ngày)</option>
                    <option value="Quan trọng">Quan trọng</option>
                    <option value="Bình thường">Bình thường</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngưỡng tồn tối thiểu (Đơn vị)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingReagent.minStockThreshold || 2}
                    onChange={(e) => setEditingReagent({ ...editingReagent, minStockThreshold: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Safety & SDS note */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phân loại nguy cơ (Theo tài liệu SDS đã xác minh)</label>
                <input
                  type="text"
                  value={editingReagent.hazardClassification || ''}
                  onChange={(e) => setEditingReagent({ ...editingReagent, hazardClassification: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Chứa Natri Azide <0.1%, GHS07 - Kích ứng nhẹ..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú chuyên môn</label>
                <textarea
                  rows={2}
                  value={editingReagent.notes || ''}
                  onChange={(e) => setEditingReagent({ ...editingReagent, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Lưu ý đặc thù khi pha, hoàn nguyên hoặc bảo quản..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingReagent.isActive ?? true}
                    onChange={(e) => setEditingReagent({ ...editingReagent, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Hóa chất đang được sử dụng trong phòng lab</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingReagent(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    Lưu thông tin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (Section 4 Rule: Soft delete preferred to preserve tx history) */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Xác nhận chuyển trạng thái hóa chất</h3>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Theo quy chuẩn an toàn lưu vết, hệ thống <strong>sẽ chuyển hóa chất sang trạng thái "Ngừng sử dụng"</strong> để bảo toàn toàn bộ lịch sử các giao dịch nhập xuất và kiểm kê trước đây.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteReagent(isDeletingId);
                  setIsDeletingId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-sm shadow-red-500/20"
              >
                Xác nhận ngừng dùng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROUP MANAGER MODAL (Section 5) */}
      {showGroupManager && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quản lý 12 Nhóm Xét Nghiệm</h3>
                <p className="text-xs text-slate-500">Phân định màu sắc và mã nhóm chuyên môn</p>
              </div>
              <button onClick={() => setShowGroupManager(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {groups.map(grp => (
                <div key={grp.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: grp.color }}></span>
                    <div>
                      <div className="font-bold text-slate-800">{grp.name} <span className="text-slate-400 font-mono font-normal">({grp.code})</span></div>
                      <div className="text-[11px] text-slate-500">{grp.description}</div>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setGroupEditing(grp)}
                      className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold cursor-pointer"
                    >
                      Sửa màu / tên
                    </button>
                  )}
                </div>
              ))}
            </div>

            {groupEditing && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 mt-3 space-y-3 text-xs">
                <span className="font-bold text-blue-900 block">Chỉnh sửa nhóm: {groupEditing.name}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tên nhóm</label>
                    <input
                      type="text"
                      value={groupEditing.name || ''}
                      onChange={(e) => setGroupEditing({ ...groupEditing, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Màu nhận diện</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={groupEditing.color || '#2563EB'}
                        onChange={(e) => setGroupEditing({ ...groupEditing, color: e.target.value })}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={groupEditing.color || ''}
                        onChange={(e) => setGroupEditing({ ...groupEditing, color: e.target.value })}
                        className="w-24 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setGroupEditing(null)}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      if (groupEditing.id && groupEditing.name) {
                        onSaveGroup(groupEditing as ChemicalGroup);
                        setGroupEditing(null);
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowGroupManager(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
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
