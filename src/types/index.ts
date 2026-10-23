// LAB CHEM SMART MANAGER AI - Type Definitions

export type AlertLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'INSUFFICIENT_DATA';

export type UserRole = 'ADMIN' | 'QUAN_LY_KHO' | 'NHAN_VIEN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar?: string;
}

export interface ChemicalGroup {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
}

export interface Reagent {
  id: string;
  code: string; // Mã hóa chất e.g. HC-GLU-01
  name: string; // Tên hóa chất e.g. Glucose Hexokinase
  brandName: string; // Tên thương mại e.g. GLUC3 Cobas
  groupId: string; // ID nhóm xét nghiệm
  manufacturer: string; // Hãng sản xuất e.g. Roche Diagnostics
  productCode: string; // Mã sản phẩm / Cat No
  packaging: string; // Quy cách e.g. Hộp 4 chai x 50mL
  unitVolume: number; // Dung tích mỗi đơn vị (mL hoặc tương đương)
  volumeUnit: 'mL' | 'L' | 'g' | 'mg' | 'test' | 'kit';
  unit: 'Chai' | 'Hộp' | 'Bộ kit' | 'Ống' | 'Gói'; // Đơn vị tính
  standardTestsPerUnit: number; // Số test tiêu chuẩn mỗi đơn vị
  consumptionPerTest: number; // Lượng tiêu hao mL/test hoặc đơn vị/test (R)
  averageTestsPerDay: number; // Số test trung bình/ngày (T)
  storageCondition: '2-8°C' | '15-25°C' | '-20°C' | '-80°C' | 'Tránh ánh sáng';
  minTemp: number; // °C
  maxTemp: number; // °C
  usageFrequency: 'Cao' | 'Trung bình' | 'Thấp' | 'Theo yêu cầu';
  importanceLevel: 'Tối quan trọng' | 'Quan trọng' | 'Bình thường';
  hazardClassification: string; // e.g. GHS07 - Kích ứng, Không độc hại... (phải xác minh)
  sdsInfo: string;
  notes: string;
  minStockThreshold: number; // Ngưỡng tồn tối thiểu (theo đơn vị tính)
  isActive: boolean; // Trạng thái hoạt động hay ngừng sử dụng
  createdAt: string;
  updatedAt: string;
}

export type BatchStatus = 'CHO_KIEM_TRA' | 'KHA_DUNG' | 'CACH_LY' | 'HET_HAN' | 'HU_HONG' | 'DA_SU_DUNG_HET';

export interface StatusHistoryEntry {
  timestamp: string;
  fromStatus: BatchStatus;
  toStatus: BatchStatus;
  reason: string;
  performedBy: string;
}

export interface Batch {
  id: string;
  reagentId: string; // Mã hóa chất liên kết
  batchNumber: string; // Lot / Batch
  inboundDate: string; // Ngày nhập (YYYY-MM-DD)
  expiryDate: string; // Hạn dùng (YYYY-MM-DD)
  initialQuantity: number; // Số lượng nhập ban đầu
  remainingQuantity: number; // Số lượng còn lại hiện tại
  unit: string;
  locationId: string; // Vị trí e.g. C1-S1-A
  supplier: string; // Nhà cung cấp
  packagingCondition: 'Nguyên vẹn' | 'Móp méo' | 'Rò rỉ' | 'Nhiệt độ giao nhận sai lệch';
  inspectionStatus: 'Đạt' | 'Chưa kiểm tra' | 'Từ chối';
  status: BatchStatus;
  notes: string;
  statusHistory: StatusHistoryEntry[];
}

export type TransactionType = 'NHAP_KHO' | 'XUAT_KHO' | 'DIEU_CHINH_KIEM_KE' | 'HUY_BO';

export interface StockTransaction {
  id: string; // Mã giao dịch duy nhất
  type: TransactionType;
  date: string;
  reagentId: string;
  reagentName: string;
  reagentCode: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  locationId?: string;
  department?: string; // Bộ phận sử dụng (Sinh hóa, Huyết học...)
  receiver?: string; // Người nhận
  performer: string; // Người thực hiện
  purpose?: string; // Mục đích
  isFefoException?: boolean;
  exceptionReason?: string; // Lý do xuất lệch FEFO nếu có
  notes: string;
  timestamp: string;
}

export interface ShelfCell {
  id: string; // e.g. C1-S1-A
  code: string;
  name: string;
  batchId?: string; // ID lô đang gán (nếu có)
  reagentId?: string;
  reagentName?: string;
  batchNumber?: string;
  quantity?: number;
  expiryDate?: string;
  alertLevel?: AlertLevel;
}

export interface Shelf {
  id: string;
  cabinetId: string;
  shelfNumber: number;
  name: string;
  maxWeightKg?: number;
  cells: ShelfCell[];
}

export interface Cabinet {
  id: string;
  code: string; // e.g. C1, C2, C3
  name: string;
  type: 'Tủ mát 2-8°C' | 'Tủ nhiệt độ phòng 15-25°C' | 'Tủ âm sâu -20°C' | 'Tủ hóa chất an toàn' | 'Kệ để vật tư';
  locationDescription: string;
  minTemp: number; // °C
  maxTemp: number; // °C
  assignedPerson: string;
  checkFrequency: '2 lần/ngày' | '1 lần/ngày' | 'Theo ca';
  shelves: Shelf[];
}

export interface TemperatureLog {
  id: string;
  cabinetId: string;
  cabinetCode: string;
  cabinetName: string;
  recordedAt: string;
  temperature: number; // °C
  deviceUsed: string;
  recordedBy: string;
  isOutOfRange: boolean;
  notes?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface InventoryItemDetail {
  id: string;
  reagentId: string;
  reagentCode: string;
  reagentName: string;
  batchId: string;
  batchNumber: string;
  locationId: string;
  expiryDate: string;
  systemQuantity: number;
  physicalQuantity: number;
  discrepancy: number; // physical - system
  discrepancyReason?: string;
  status: 'Chờ đối chiếu' | 'Đã kiểm tra' | 'Đã cân đối';
}

export interface InventorySession {
  id: string;
  sessionCode: string; // e.g. KK-2026-10
  date: string;
  title: string;
  scope: 'Toàn bộ kho' | 'Theo tủ' | 'Theo nhóm hóa chất';
  cabinetId?: string;
  groupId?: string;
  status: 'DANG_TIEN_HANH' | 'DA_HOAN_THANH' | 'DA_CAN_DOI';
  auditor: string;
  confirmer?: string;
  confirmedAt?: string;
  notes: string;
  items: InventoryItemDetail[];
}

export interface ChecklistItem {
  id: number;
  title: string;
  status: 'DAT' | 'CHUA_DAT' | 'KHONG_AP_DUNG';
  notes: string;
}

export interface SOPDocument {
  id: string;
  code: string;
  title: string;
  purpose: string;
  scope: string;
  responsibility: string;
  content: string[];
  forms: string[];
  author: string;
  reviewer: string;
  approver: string;
  effectiveDate: string;
  version: string;
  isDraft: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'REAGENT' | 'BATCH' | 'TRANSACTION' | 'CABINET' | 'INVENTORY' | 'TEMPERATURE' | 'SETTINGS';
  entityId: string;
  user: string;
  details: string;
}

export interface AppSettings {
  labName: string;
  labSubName: string;
  address: string;
  thresholdRedDays: number; // mặc định 7
  thresholdOrangeDays: number; // mặc định 15
  thresholdYellowDays: number; // mặc định 30
  nearExpiryAlertDays: number; // mặc định 30
  autoSuggestFefo: boolean;
  requireFefoOverrideReason: boolean;
  googleSheetsUrl?: string;
  googleSheetsSyncEnabled?: boolean;
  lastSyncTime?: string;
}
