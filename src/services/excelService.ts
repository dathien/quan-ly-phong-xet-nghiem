import * as XLSX from 'xlsx';
import { Reagent, Batch, StockTransaction, InventorySession, ChemicalGroup } from '../types';

export class ExcelService {
  /**
   * Export Reagent catalog to Excel
   */
  public static exportReagents(reagents: Reagent[], groups: ChemicalGroup[]): void {
    const groupMap = new Map(groups.map(g => [g.id, g.name]));

    const data = reagents.map((r, idx) => ({
      'STT': idx + 1,
      'Mã Hóa Chất': r.code,
      'Tên Hóa Chất': r.name,
      'Tên Thương Mại': r.brandName || '',
      'Nhóm Xét Nghiệm': groupMap.get(r.groupId) || 'Chưa xác định',
      'Hãng Sản Xuất': r.manufacturer,
      'Mã Sản Phẩm (Cat)': r.productCode,
      'Quy Cách Đóng Gói': r.packaging,
      'Dung Tích Đơn Vị': `${r.unitVolume} ${r.volumeUnit}`,
      'Đơn Vị Tính': r.unit,
      'Số Test Chuẩn': r.standardTestsPerUnit || 'N/A',
      'Tiêu Hao/Test (mL)': r.consumptionPerTest || 'N/A',
      'Test TB/Ngày': r.averageTestsPerDay || 'N/A',
      'Bảo Quản': r.storageCondition,
      'Nhiệt Độ (°C)': `${r.minTemp}°C - ${r.maxTemp}°C`,
      'Tần Suất': r.usageFrequency,
      'Mức Độ': r.importanceLevel,
      'Phân Loại Nguy Cơ': r.hazardClassification || 'Chưa xác minh',
      'Hồ Sơ SDS': r.sdsInfo || 'N/A',
      'Trạng Thái': r.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng',
      'Ghi Chú': r.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhMucHoaChat');
    XLSX.writeFile(workbook, `DanhMuc_HoaChat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Export Batches and Stock levels
   */
  public static exportBatches(batches: Batch[], reagents: Reagent[]): void {
    const reagentMap = new Map(reagents.map(r => [r.id, r]));

    const data = batches.map((b, idx) => {
      const rg = reagentMap.get(b.reagentId);
      return {
        'STT': idx + 1,
        'Mã Lô': b.id,
        'Lot / Batch': b.batchNumber,
        'Mã Hóa Chất': rg?.code || 'N/A',
        'Tên Hóa Chất': rg?.name || 'N/A',
        'Ngày Nhập': b.inboundDate,
        'Hạn Dùng': b.expiryDate,
        'Số Lượng Nhập': b.initialQuantity,
        'Số Lượng Còn': b.remainingQuantity,
        'Đơn Vị': b.unit,
        'Vị Trí Lưu Trữ': b.locationId || 'Chưa gán vị trí',
        'Nhà Cung Cấp': b.supplier,
        'Bao Bì': b.packagingCondition,
        'Kiểm Tra Tiếp Nhận': b.inspectionStatus,
        'Trạng Thái Lô': b.status,
        'Ghi Chú': b.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachLo');
    XLSX.writeFile(workbook, `QuanLyLo_HoaChat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Export Transaction Log
   */
  public static exportTransactions(transactions: StockTransaction[]): void {
    const data = transactions.map((t, idx) => ({
      'STT': idx + 1,
      'Mã Giao Dịch': t.id,
      'Loại': t.type === 'NHAP_KHO' ? 'Nhập kho' : t.type === 'XUAT_KHO' ? 'Xuất kho' : 'Điều chỉnh',
      'Ngày': t.date,
      'Mã Hóa Chất': t.reagentCode,
      'Tên Hóa Chất': t.reagentName,
      'Số Lot': t.batchNumber,
      'Số Lượng': t.quantity,
      'Đơn Vị': t.unit,
      'Bộ Phận Nhận': t.department || '',
      'Người Nhận': t.receiver || '',
      'Người Thực Hiện': t.performer,
      'Xuất Lệch FEFO': t.isFefoException ? 'Có' : 'Không',
      'Lý Do Ngoại Lệ': t.exceptionReason || '',
      'Ghi Chú': t.notes || '',
      'Thời Gian Ghi': t.timestamp
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSuGiaoDich');
    XLSX.writeFile(workbook, `LichSu_NhapXuat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Export Inventory Session
   */
  public static exportInventorySession(session: InventorySession): void {
    const data = session.items.map((it, idx) => ({
      'STT': idx + 1,
      'Mã Hóa Chất': it.reagentCode,
      'Tên Hóa Chất': it.reagentName,
      'Số Lot': it.batchNumber,
      'Hạn Dùng': it.expiryDate,
      'Vị Trí': it.locationId,
      'Tồn Hệ Thống': it.systemQuantity,
      'Tồn Thực Tế': it.physicalQuantity,
      'Chênh Lệch': it.discrepancy,
      'Nguyên Nhân': it.discrepancyReason || '',
      'Trạng Thái': it.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KiemKe');
    XLSX.writeFile(workbook, `BienBan_KiemKe_${session.sessionCode}_${session.date}.xlsx`);
  }

  /**
   * Parse Reagent catalog from uploaded Excel file
   */
  public static async parseReagentsExcel(file: File, defaultGroupId: string): Promise<Partial<Reagent>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet);

          const parsedList: Partial<Reagent>[] = rawRows.map((row) => ({
            code: row['Mã Hóa Chất'] || row['Mã'] || row['Code'] || `HC-${Date.now().toString().slice(-4)}`,
            name: row['Tên Hóa Chất'] || row['Tên'] || row['Name'] || 'Chưa đặt tên',
            brandName: row['Tên Thương Mại'] || row['Brand'] || '',
            groupId: defaultGroupId,
            manufacturer: row['Hãng Sản Xuất'] || row['NSX'] || 'Chưa rõ',
            productCode: row['Mã Sản Phẩm (Cat)'] || row['CatNo'] || '',
            packaging: row['Quy Cách Đóng Gói'] || row['Quy Cách'] || 'Hộp',
            unitVolume: Number(row['Dung Tích Đơn Vị'] || row['Dung Tích'] || 100),
            volumeUnit: 'mL',
            unit: (row['Đơn Vị Tính'] || row['Đơn vị'] || 'Hộp') as any,
            standardTestsPerUnit: Number(row['Số Test Chuẩn'] || 100),
            consumptionPerTest: Number(row['Tiêu Hao/Test (mL)'] || 0.1),
            averageTestsPerDay: Number(row['Test TB/Ngày'] || 10),
            storageCondition: (row['Bảo Quản'] || '2-8°C') as any,
            minTemp: 2,
            maxTemp: 8,
            usageFrequency: 'Trung bình',
            importanceLevel: 'Quan trọng',
            hazardClassification: row['Phân Loại Nguy Cơ'] || 'Chưa xác minh',
            sdsInfo: row['Hồ Sơ SDS'] || '',
            notes: row['Ghi Chú'] || 'Nhập từ tệp Excel',
            minStockThreshold: 2,
            isActive: true
          }));

          resolve(parsedList);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
}
