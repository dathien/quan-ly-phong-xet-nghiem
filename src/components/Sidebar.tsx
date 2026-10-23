import React from 'react';
import {
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  Boxes,
  AlertTriangle,
  Camera,
  ClipboardCheck,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type TabKey =
  | 'DASHBOARD'
  | 'CATALOG'
  | 'TRANSACTIONS'
  | 'CABINETS'
  | 'ALERTS'
  | 'AI_VISION'
  | 'INVENTORY'
  | 'FORECASTING'
  | 'REPORTS_SOP'
  | 'SETTINGS';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  alertCounts: {
    critical: number;
    warning: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  alertCounts
}) => {
  const menuItems = [
    {
      key: 'DASHBOARD' as TabKey,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null
    },
    {
      key: 'CATALOG' as TabKey,
      label: 'Danh mục hóa chất',
      icon: Layers,
      badge: null
    },
    {
      key: 'TRANSACTIONS' as TabKey,
      label: 'Nhập – xuất kho',
      icon: ArrowLeftRight,
      badge: null
    },
    {
      key: 'CABINETS' as TabKey,
      label: 'Quản lý tủ hóa chất',
      icon: Boxes,
      badge: null
    },
    {
      key: 'ALERTS' as TabKey,
      label: 'Cảnh báo tồn kho',
      icon: AlertTriangle,
      badge: alertCounts.critical > 0 ? { count: alertCounts.critical, color: 'bg-red-500 text-white' } : null
    },
    {
      key: 'AI_VISION' as TabKey,
      label: 'Phân tích ảnh AI',
      icon: Camera,
      badge: { count: 'AI', color: 'bg-teal-600 text-white' }
    },
    {
      key: 'INVENTORY' as TabKey,
      label: 'Kiểm kê kho',
      icon: ClipboardCheck,
      badge: null
    },
    {
      key: 'FORECASTING' as TabKey,
      label: 'Dự báo & đặt hàng',
      icon: TrendingUp,
      badge: null
    },
    {
      key: 'REPORTS_SOP' as TabKey,
      label: 'Báo cáo & SOP',
      icon: FileText,
      badge: null
    },
    {
      key: 'SETTINGS' as TabKey,
      label: 'Cài đặt hệ thống',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Menu List */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer group text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                }`}
              />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${item.badge.color}`}
                    >
                      {item.badge.count}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-100 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium px-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>v2.5 Lab Edition</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors ml-auto cursor-pointer"
          title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
