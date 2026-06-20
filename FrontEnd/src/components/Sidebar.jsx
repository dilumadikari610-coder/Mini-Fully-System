import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Boxes,
  ChevronDown,
  Truck // ✅ Supplier මෙනු එක සඳහා Truck Icon එක Import කරන ලදී
} from 'lucide-react';

const Sidebar = ({ user, logout, onAddNew }) => {
  const systemColor = "#A47148";
  const location = useLocation();

  // 💡 STATE: Settings Dropdown එක Open/Close ද කියා තීරණය කිරීමට
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- MAIN NAVIGATION LINKS CONFIGURATION ---
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
  ];

  // 💡 FIXED: Settings Dropdown එක ඇතුළට Supplier Registration පිටුව මුලින්ම එකතු කරන ලදී
  const settingsSubItems = [
    { id: 'supplier-register', name: 'Supplier Registration', icon: Truck }, // ✅ ADDED
    { id: 'materials', name: 'Materials Registry', icon: Boxes },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'settings', name: 'Department', icon: Settings },
  ];

  // දැනට සක්‍රීය පිටුව Settings එක ඇතුළේ එකක්දැයි සෙවීම (Active Highlight එක සඳහා)
  const isSubItemActive = settingsSubItems.some(sub => location.pathname === `/${sub.id}`);

  return (
    <>
      <style>{`
        .custom-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
          display: none;
        }

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
        
        {/* 2. NAVIGATION ITEMS */}
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

          {/* Standard Navigation Rendering */}
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

          {/* ================================================== */}
          {/* Collapsible Dropdown System Accordion (Admin Only) */}
          {/* ================================================== */}
          {user?.role === 'admin' && (
            <div className="space-y-1 block relative">
              {/* Trigger Button */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center h-12 rounded-xl transition-all relative overflow-hidden outline-none ${
                  isSubItemActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="w-[54px] min-w-[54px] flex items-center justify-center shrink-0">
                  <Settings 
                    size={20} 
                    strokeWidth={isSubItemActive ? 2 : 1.5}
                    className={`transition-all duration-300 ${isSubItemActive ? 'text-white' : 'text-white/60'}`}
                  />
                </div>
                
                <span className="font-medium text-[11px] tracking-wide ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-1 text-left whitespace-nowrap">
                  Settings Menu
                </span>

                {/* Dropdown Arrow */}
                <div className="pr-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <ChevronDown 
                    size={14} 
                    className={`transform transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : 'rotate-0'}`} 
                  />
                </div>
              </button>

              {/* Sub-items Grid Container (Smooth Slide Accordion) */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden space-y-1 pl-4 ${
                  isSettingsOpen ? 'max-h-56 opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                {settingsSubItems.map((sub) => (
                  <NavLink
                    key={sub.id}
                    to={`/${sub.id}`}
                    className={({ isActive }) => `
                      w-full flex items-center h-10 rounded-lg transition-all relative overflow-hidden
                      ${isActive ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="w-10 min-w-10 flex items-center justify-center shrink-0">
                          <sub.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                        </div>
                        <span className="font-medium text-[11px] tracking-wide ml-2 whitespace-nowrap transition-opacity duration-300">
                          {sub.name}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

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