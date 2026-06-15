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
  FileText // ✅ Icon for Inventory Report
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
      id: 'allocation', 
      name: 'Staff Allocation', 
      icon: UserCheck, 
      adminOnly: true 
    },
    { 
      id: 'reports', 
      name: 'Inventory Report', 
      icon: FileText, // ✅ New Report Item
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
      adminOnly: true // ✅ Restricted to Admin for Department management
    },
  ];

  return (
    <aside 
      className="group h-screen transition-all duration-300 ease-in-out flex flex-col w-20 hover:w-64 z-50 shadow-2xl shrink-0 overflow-x-hidden font-sans"
      style={{ backgroundColor: systemColor }}
    >
      {/* 1. BRAND LOGO */}
      <div className="flex items-center h-20 px-6 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm backdrop-blur-md">
          <Wrench size={16} strokeWidth={2} />
        </div>
        <span className="ml-4 font-semibold text-base tracking-tight text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap uppercase">
          MMS Core
        </span>
      </div>
      
      {/* 2. NAVIGATION ITEMS */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        
        {/* ADD NEW JOB ACTION BUTTON */}
        <button
          onClick={onAddNew}
          className="w-full flex items-center h-12 rounded-xl transition-all relative group/add overflow-hidden mb-6 bg-white/10 hover:bg-white/20 border border-white/10"
        >
          <div className="w-[54px] min-w-[54px] flex items-center justify-center shrink-0">
            <PlusCircle size={22} className="text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[10px] uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2">
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
                      size={22} 
                      strokeWidth={isActive ? 2 : 1.5}
                      className={`transition-all duration-300 ${isActive ? 'text-white' : 'text-white/60 group-hover/btn:text-white'}`}
                    />
                  </div>
                  
                  <span className={`font-medium text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 ml-2 ${
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
      <div className="p-3 border-t border-white/10 mb-2">
        <button 
          onClick={logout}
          className="w-full flex items-center h-12 rounded-xl hover:bg-white/10 transition-all text-white/60 hover:text-white group/logout"
        >
          <div className="w-[54px] min-w-[54px] flex items-center justify-center shrink-0">
            <LogOut size={20} strokeWidth={1.5} />
          </div>
          <span className="font-medium text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ml-2">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;