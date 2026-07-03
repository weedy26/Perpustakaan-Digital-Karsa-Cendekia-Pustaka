import React from "react";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  ArrowRightLeft,
  CreditCard,
  Clock,
  FileBarChart,
  Settings,
  LogOut,
  X
} from "lucide-react";
import LibraryLogo from "./LibraryLogo";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLoansCount: number;
  libraryName: string;
  schoolName: string;
  logo?: string;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeLoansCount,
  libraryName,
  schoolName,
  logo,
  onLogout,
  isOpen = false,
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "Kelas", icon: GraduationCap },
    { id: "books", label: "Data Buku", icon: BookOpen },
    { id: "members", label: "Data Anggota", icon: Users },
    { id: "loans", label: "Peminjaman", icon: ArrowRightLeft, badge: activeLoansCount },
    { id: "card", label: "Kartu Anggota", icon: CreditCard },
    { id: "history", label: "Riwayat", icon: Clock },
    { id: "reports", label: "Laporan", icon: FileBarChart },
    { id: "settings", label: "Pengaturan", icon: Settings }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`w-64 bg-emerald-950 text-emerald-100 flex flex-col h-screen fixed left-0 top-0 border-r border-emerald-900/60 z-50 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Header Brand */}
        <div className="p-5 border-b border-emerald-900/60 flex items-center justify-between">
          {/* Colorful Icon */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden p-0.5">
              {logo && logo.startsWith("data:") ? (
                <img src={logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <LibraryLogo size={34} variant="colored" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold tracking-tight text-white leading-tight font-sans break-words uppercase">
                {libraryName}
              </div>
              <div className="text-[9px] font-bold text-amber-400 tracking-wider uppercase leading-tight mt-1 break-words">
                {schoolName}
              </div>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="px-5 py-3 text-[10px] uppercase tracking-widest font-extrabold text-emerald-400/80 mt-4">
        Menu Utama
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-1 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left text-sm cursor-pointer ${
                isActive
                  ? "bg-emerald-900 text-amber-400 font-bold border border-amber-500/20 shadow-md"
                  : "hover:bg-emerald-900/50 hover:text-white text-emerald-200/80 font-medium"
              }`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-emerald-400 group-hover:text-emerald-200"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile/Footer */}
      <div className="p-4 border-t border-emerald-900/60 bg-emerald-950 flex flex-col space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 border border-emerald-800 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
              A
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">Admin</div>
              <div className="text-[10px] text-emerald-300/70 font-medium">
                {libraryName}
              </div>
              <div className="text-[9px] text-amber-400 uppercase font-bold tracking-tight">
                Pustaka
              </div>
            </div>
          </div>
          <button 
            title="Keluar"
            className="text-emerald-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-emerald-900/60 cursor-pointer"
            onClick={() => {
              if (onLogout) onLogout();
            }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Footnote under Admin */}
        <div className="text-center text-[9px] font-bold text-emerald-500/80 tracking-wider uppercase pt-2 border-t border-emerald-900/40">
          @2026 v.1 dibuat oleh Mr. Wiwid W
        </div>
      </div>
    </div>
  </>
  );
}
