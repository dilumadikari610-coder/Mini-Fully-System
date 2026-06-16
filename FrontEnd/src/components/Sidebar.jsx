import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  Users, 
  LogOut,
  Settings,
  PlusCircle,
  Package, 
  UserCheck,
  FilePlus,
  FileText,
  Boxes 
} from 'lucide-react';

const Sidebar = ({ user, logout, onAddNew }) => {
  const systemColor = "#A47148";

  // Configuration for Navigation Links
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'maintenance', name: 'Maintenance', icon: ClipboardList },
    
    // --- STOCK & INVENTORY SECTION ---
    { 
      id: 'grn-create', 
      name: 'Stock Entry (GRN)', 
      icon: FilePlus, 
      adminOnly: true 
    },
    { 
      id: 'inventory', 
      name: 'Tool Inventory', 
      icon: Package, 
      adminOnly: true 
    },
    { 
      id: 'materials', 
      name: 'Materials Registry', 
      icon: Boxes, 
      adminOnly: true 
    },
    { 
      id: 'allocation', 
      name: 'Staff Allocation', 
      icon: UserCheck, 
      adminOnly: true 
    },
    { 
      id: 'reports', 
      name: 'Inventory Report', 
      icon: FileText, 
      adminOnly: true 
    },
    
    // --- SYSTEM SECTION ---
    { 
      id: 'users', 
      name: 'User Management', 
      icon: Users, 
      adminOnly: true 
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: Settings, 
      adminOnly: true 
    },
  ];

  return (
    <>
      {/* 💡 SOLUTION: පරණ කැත Scrollbar එක අයින් කරලා Premium look එකක් දෙන Custom CSS Style බ්ලොක් එක */}
      <style>{`
        /* බ්‍රවුසර් එකේ default scrollbar එක sidebar එකෙන් අයින් කිරීම */
        .custom-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
          display: none; /* Default එකේදී හංගනවා */
        }

        /* Sidebar එක hover කරලා ලොකු වුණාම විතරක් සිහින් ලස්සන scrollbar එකක් පෙන්වීම */
        .group:hover .custom-sidebar-scroll::-webkit-scrollbar {
          display: block;
        }

        .custom-sidebar-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.45);
        }
      `}</style>

      <aside 
        className="group h-screen transition-all duration-300 ease-in-out flex flex-col w-20 hover:w-64 z-50 shadow-2xl shrink-0 overflow-hidden font-sans antialiased text-slate-200"
        style={{ backgroundColor: systemColor }}
      >
        {/* 1. BRAND LOGO */}
        <div className="flex items-center h-20 px-6 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm backdrop-blur-md">
            <Wrench size={16} strokeWidth={2} />
          </div>
          <span className="ml-4 font-semibold text-sm tracking-wide text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap uppercase">
            MMS Core
          </span>
        </div>
        
        {/* 2. NAVIGATION ITEMS (💡 FIXED: මෙතැනට custom scroll class එක සහ overflow-y-auto එකතු කළා) */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-sidebar-scroll">
          
          {/* ADD NEW JOB ACTION BUTTON */}
          <button
            onClick={onAddNew}
            className="w-full flex items-center h-12 rounded-xl transition-all relative group/add overflow-hidden mb-6 bg-white/10 hover:bg-white/20 border border-white/10"
          >
            <div className="w-[54px] min-w-[54px] flex items-center justify-center shrink-0">
              <PlusCircle size={20} className="text-white" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-[10px] uppercase tracking-wider text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2">
              New Job
            </span>
          </button>

          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={({ isActive }) => `
                  w-full flex items-center h-12 rounded-xl transition-all relative group/btn overflow-hidden
                  ${isActive ? 'bg-white/15' : 'hover:bg-white/5'}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full z-20" />
                    )}
                    
                    <div className="w-[54px] min-w-[54px] flex items-center justify-center shrink-0">
                      <item.icon 
                        size={20} 
                        strokeWidth={isActive ? 2 : 1.5}
                        className={`transition-all duration-300 ${isActive ? 'text-white' : 'text-white/60 group-hover/btn:text-white'}`}
                      />
                    </div>
                    
                    <span className={`font-medium text-[11px] tracking-wide whitespace-nowrap transition-all duration-300 ml-2 ${
                      isActive ? 'text-white' : 'text-white/60 group-hover/btn:text-white'
                    } opacity-0 group-hover:opacity-100`}>
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 3. LOGOUT FOOTER */}
        <div className="p-3 border-t border-white/10 mb-2 shrink-0">
          <button 
            onClick={logout}
            className="w-full flex items-center h-12 rounded-xl hover:bg-white/10 transition-all text-white/60 hover:text-white group/logout"
          >
            <div className="w-[54px] min-w-[54px] flex items-center justify-center shrink-0">
              <LogOut size={18} strokeWidth={1.5} />
            </div>
            <span className="font-medium text-[11px] tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ml-2">
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;