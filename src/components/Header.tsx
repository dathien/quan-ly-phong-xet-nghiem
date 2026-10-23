import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Bell,
  Clock,
  ShieldAlert,
  UserCheck,
  ChevronDown,
  HardDrive
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface HeaderProps {
  user: UserProfile;
  onRoleChange: (role: UserRole) => void;
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  labName: string;
  isDemoActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onRoleChange,
  unreadAlertsCount,
  onOpenNotifications,
  labName,
  isDemoActive
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const timePart = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(`${datePart} | ${timePart}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleLabelMap: Record<UserRole, { label: string; color: string }> = {
    ADMIN: { label: 'Quản trị viên (Admin)', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    QUAN_LY_KHO: { label: 'Quản lý kho', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    NHAN_VIEN: { label: 'Nhân viên kỹ thuật', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Unit Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-blue-800 text-lg leading-tight">
                LAB CHEM <span className="text-teal-600">SMART MANAGER</span> <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white">AI</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 truncate max-w-xs md:max-w-md">
              {labName}
            </p>
          </div>
        </div>

        {/* Center / Demo Mode Banner */}
        {isDemoActive && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-300/80 rounded-lg text-amber-900 text-xs font-semibold shadow-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>DỮ LIỆU DEMO – KHÔNG DÙNG CHO QUYẾT ĐỊNH CHUYÊN MÔN</span>
          </div>
        )}

        {/* Right Actions: Clock, Mode, Alerts, User */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Live Date Time */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentTime}</span>
          </div>

          {/* Local Storage Mode indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
            <HardDrive className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">Chế độ cá nhân</span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Xem danh sách cảnh báo tồn kho và hạn dùng"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 transition-all cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                {user.avatar || 'NA'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                <div className="text-[10px] font-medium text-blue-600">{roleLabelMap[user.role].label}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Đang đăng nhập với vai trò:</p>
                  <p className="text-sm font-bold text-slate-800">{user.name}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${roleLabelMap[user.role].color}`}>
                    {roleLabelMap[user.role].label}
                  </span>
                </div>

                <div className="p-2">
                  <p className="text-[11px] font-semibold text-slate-500 px-2 py-1">Chuyển đổi vai trò kiểm thử:</p>
                  <button
                    onClick={() => { onRoleChange('ADMIN'); setShowUserMenu(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <span>Quản trị viên (Admin)</span>
                    {user.role === 'ADMIN' && <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { onRoleChange('QUAN_LY_KHO'); setShowUserMenu(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${user.role === 'QUAN_LY_KHO' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <span>Quản lý kho</span>
                    {user.role === 'QUAN_LY_KHO' && <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { onRoleChange('NHAN_VIEN'); setShowUserMenu(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${user.role === 'NHAN_VIEN' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <span>Nhân viên kỹ thuật</span>
                    {user.role === 'NHAN_VIEN' && <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-400">
                  Lưu ý: Chế độ cá nhân/offline không có xác thực máy chủ.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
