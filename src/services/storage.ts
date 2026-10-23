import {
  ChemicalGroup,
  Reagent,
  Batch,
  Cabinet,
  TemperatureLog,
  StockTransaction,
  InventorySession,
  ChecklistItem,
  SOPDocument,
  AuditLog,
  AppSettings,
  UserProfile
} from '../types';
import {
  INITIAL_GROUPS,
  INITIAL_REAGENTS,
  INITIAL_BATCHES,
  INITIAL_CABINETS,
  INITIAL_TEMPERATURE_LOGS,
  INITIAL_TRANSACTIONS,
  INITIAL_SOPS,
  INITIAL_CHECKLIST_TEMPLATE,
  INITIAL_SETTINGS
} from './demoData';

const STORAGE_KEYS = {
  GROUPS: 'labchem_groups_v1',
  REAGENTS: 'labchem_reagents_v1',
  BATCHES: 'labchem_batches_v1',
  CABINETS: 'labchem_cabinets_v1',
  TEMPERATURE_LOGS: 'labchem_temp_logs_v1',
  TRANSACTIONS: 'labchem_transactions_v1',
  INVENTORY_SESSIONS: 'labchem_inventory_v1',
  CHECKLIST: 'labchem_checklist_v1',
  SOPS: 'labchem_sops_v1',
  AUDIT_LOGS: 'labchem_audit_logs_v1',
  SETTINGS: 'labchem_settings_v1',
  USER_PROFILE: 'labchem_user_profile_v1',
  IS_DEMO_LOADED: 'labchem_demo_loaded_v1'
};

export const DEFAULT_USER: UserProfile = {
  id: 'usr-01',
  name: 'Lê Thị Ngọc Ánh',
  role: 'ADMIN',
  department: 'Quản lý Kho & Trang thiết bị',
  avatar: 'NA'
};

export class LabStorage {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving key ${key} to storage:`, e);
    }
  }

  // Initialize data if not yet present
  public static init(): void {
    const isLoaded = localStorage.getItem(STORAGE_KEYS.IS_DEMO_LOADED);
    if (!isLoaded) {
      this.loadDemoData();
    }
  }

  public static loadDemoData(): void {
    this.setItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    this.setItem(STORAGE_KEYS.REAGENTS, INITIAL_REAGENTS);
    this.setItem(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    this.setItem(STORAGE_KEYS.CABINETS, INITIAL_CABINETS);
    this.setItem(STORAGE_KEYS.TEMPERATURE_LOGS, INITIAL_TEMPERATURE_LOGS);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    this.setItem(STORAGE_KEYS.INVENTORY_SESSIONS, []);
    this.setItem(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST_TEMPLATE);
    this.setItem(STORAGE_KEYS.SOPS, INITIAL_SOPS);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'aud-init-01',
        timestamp: new Date().toISOString(),
        action: 'Khởi tạo hệ thống với Dữ liệu Demo phòng xét nghiệm',
        entityType: 'SETTINGS',
        entityId: 'system',
        user: 'Hệ thống tự động',
        details: 'Nạp 12 nhóm, 20 sản phẩm, 3 tủ mẫu, các lot kiểm tra FEFO.'
      }
    ]);
    this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.setItem(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO_LOADED, 'true');
  }

  public static clearAllData(): void {
    this.setItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    this.setItem(STORAGE_KEYS.REAGENTS, []);
    this.setItem(STORAGE_KEYS.BATCHES, []);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(STORAGE_KEYS.INVENTORY_SESSIONS, []);
    this.setItem(STORAGE_KEYS.TEMPERATURE_LOGS, []);
    this.setItem(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST_TEMPLATE);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'aud-clear-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'Đã xóa toàn bộ dữ liệu mẫu',
        entityType: 'SETTINGS',
        entityId: 'system',
        user: 'Người dùng',
        details: 'Xóa danh mục, lô, giao dịch theo yêu cầu làm sạch kho.'
      }
    ]);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO_LOADED, 'cleared');
  }

  // Getters & Setters
  public static getGroups(): ChemicalGroup[] {
    return this.getItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  }
  public static saveGroups(groups: ChemicalGroup[]): void {
    this.setItem(STORAGE_KEYS.GROUPS, groups);
  }

  public static getReagents(): Reagent[] {
    return this.getItem(STORAGE_KEYS.REAGENTS, []);
  }
  public static saveReagents(reagents: Reagent[]): void {
    this.setItem(STORAGE_KEYS.REAGENTS, reagents);
  }

  public static getBatches(): Batch[] {
    return this.getItem(STORAGE_KEYS.BATCHES, []);
  }
  public static saveBatches(batches: Batch[]): void {
    this.setItem(STORAGE_KEYS.BATCHES, batches);
  }

  public static getCabinets(): Cabinet[] {
    return this.getItem(STORAGE_KEYS.CABINETS, INITIAL_CABINETS);
  }
  public static saveCabinets(cabinets: Cabinet[]): void {
    this.setItem(STORAGE_KEYS.CABINETS, cabinets);
  }

  public static getTemperatureLogs(): TemperatureLog[] {
    return this.getItem(STORAGE_KEYS.TEMPERATURE_LOGS, []);
  }
  public static saveTemperatureLogs(logs: TemperatureLog[]): void {
    this.setItem(STORAGE_KEYS.TEMPERATURE_LOGS, logs);
  }

  public static getTransactions(): StockTransaction[] {
    return this.getItem(STORAGE_KEYS.TRANSACTIONS, []);
  }
  public static saveTransactions(txs: StockTransaction[]): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
  }

  public static getInventorySessions(): InventorySession[] {
    return this.getItem(STORAGE_KEYS.INVENTORY_SESSIONS, []);
  }
  public static saveInventorySessions(sessions: InventorySession[]): void {
    this.setItem(STORAGE_KEYS.INVENTORY_SESSIONS, sessions);
  }

  public static getChecklist(): ChecklistItem[] {
    return this.getItem(STORAGE_KEYS.CHECKLIST, INITIAL_CHECKLIST_TEMPLATE);
  }
  public static saveChecklist(items: ChecklistItem[]): void {
    this.setItem(STORAGE_KEYS.CHECKLIST, items);
  }

  public static getSOPs(): SOPDocument[] {
    return this.getItem(STORAGE_KEYS.SOPS, INITIAL_SOPS);
  }
  public static saveSOPs(sops: SOPDocument[]): void {
    this.setItem(STORAGE_KEYS.SOPS, sops);
  }

  public static getAuditLogs(): AuditLog[] {
    return this.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
  }
  public static logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  public static getSettings(): AppSettings {
    return this.getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
  public static saveSettings(settings: AppSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  public static getUserProfile(): UserProfile {
    const user = this.getItem(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER);
    if (user && (user.id === 'usr-01' || user.name.includes('Nguyễn Văn Minh'))) {
      user.name = 'Lê Thị Ngọc Ánh';
      user.avatar = 'NA';
      this.saveUserProfile(user);
    }
    return user;
  }
  public static saveUserProfile(profile: UserProfile): void {
    this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  // Backup & Restore
  public static exportFullBackupJSON(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'LAB CHEM SMART MANAGER AI',
      data: {
        groups: this.getGroups(),
        reagents: this.getReagents(),
        batches: this.getBatches(),
        cabinets: this.getCabinets(),
        temperatureLogs: this.getTemperatureLogs(),
        transactions: this.getTransactions(),
        inventorySessions: this.getInventorySessions(),
        checklist: this.getChecklist(),
        sops: this.getSOPs(),
        auditLogs: this.getAuditLogs(),
        settings: this.getSettings()
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  public static restoreFromBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !parsed.data) {
        return { success: false, message: 'Tệp JSON không đúng cấu trúc sao lưu của LAB CHEM SMART MANAGER AI.' };
      }
      const d = parsed.data;
      if (Array.isArray(d.groups)) this.saveGroups(d.groups);
      if (Array.isArray(d.reagents)) this.saveReagents(d.reagents);
      if (Array.isArray(d.batches)) this.saveBatches(d.batches);
      if (Array.isArray(d.cabinets)) this.saveCabinets(d.cabinets);
      if (Array.isArray(d.temperatureLogs)) this.saveTemperatureLogs(d.temperatureLogs);
      if (Array.isArray(d.transactions)) this.saveTransactions(d.transactions);
      if (Array.isArray(d.inventorySessions)) this.saveInventorySessions(d.inventorySessions);
      if (Array.isArray(d.checklist)) this.saveChecklist(d.checklist);
      if (Array.isArray(d.sops)) this.saveSOPs(d.sops);
      if (d.settings) this.saveSettings(d.settings);

      this.logAudit({
        action: 'Khôi phục dữ liệu từ tệp sao lưu JSON',
        entityType: 'SETTINGS',
        entityId: 'backup-restore',
        user: 'Quản trị viên',
        details: `Đã nhập thành công ${d.reagents?.length || 0} hóa chất, ${d.batches?.length || 0} lô.`
      });

      return { success: true, message: 'Đã khôi phục dữ liệu thành công!' };
    } catch (err: any) {
      return { success: false, message: 'Lỗi đọc tệp JSON: ' + err.message };
    }
  }
}
