import React, { useState } from 'react';
import { 
  Car, 
  Share2, 
  RotateCcw, 
  ShieldCheck, 
  FileText, 
  Radio, 
  ListOrdered, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Check,
  ChevronDown,
  Bell
} from 'lucide-react';
import { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userRole: 'admin' | 'user' | 'driver';
  setUserRole: (role: 'admin' | 'user' | 'driver') => void;
  onResetData: () => void;
  pendingCount: number;
  onOpenLineModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  onResetData,
  pendingCount,
  onOpenLineModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const navTabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'booking_form', label: 'ฟอร์มจองรถ', icon: <FileText className="w-4 h-4" /> },
    { id: 'realtime_tracking', label: 'ติดตามเรียลไทม์', icon: <Radio className="w-4 h-4 animate-pulse text-emerald-400" /> },
    { id: 'booking_list', label: 'รายการจอง', icon: <ListOrdered className="w-4 h-4" />, badge: pendingCount },
    { id: 'schedule', label: 'ตารางการใช้รถ', icon: <Calendar className="w-4 h-4" /> },
    { id: 'drivers', label: 'ระบบสารถี', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'รายงานสถิติ', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'admin', label: 'จัดการหลังบ้าน', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="w-full bg-[#0b1120] border-b border-slate-800/80 sticky top-0 z-50 shadow-2xl">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight font-['Prompt']">
                dtp-carbooking
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                v2.0 GPS Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-light hidden sm:block">
              ระบบจองรถและติดตามตำแหน่งรถแบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          
          {/* LINE Bot Diagnostics Button */}
          {onOpenLineModal && (
            <button
              onClick={onOpenLineModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 text-xs font-semibold border border-emerald-500/40 shadow-sm transition-all cursor-pointer active:scale-95"
              title="ตรวจสอบสถานะและตั้งค่าการแจ้งเตือน LINE Bot"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แจ้งเตือน LINE Bot</span>
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'คัดลอกลิงก์แล้ว!' : 'แชร์ลิงก์ให้สมาชิก'}</span>
          </button>

          {/* User / Admin Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>
                ผู้ดูแล: <strong className="text-white capitalize">{userRole}</strong>
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase px-2 py-1">เปลี่ยนบทบาท</p>
                {(['admin', 'user', 'driver'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setUserRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      userRole === r ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r === 'admin' ? '🛡️ ผู้ดูแลระบบ (Admin)' : r === 'user' ? '👤 ผู้ขอใช้รถ (User)' : '🚗 สารถี (Driver)'}</span>
                    {userRole === r && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
            title="รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">รีเซ็ต</span>
          </button>

        </div>
      </div>

      {/* Sub-Navigation Bar Tabs */}
      <div className="bg-[#0f172a] border-t border-slate-800/60 px-4 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
