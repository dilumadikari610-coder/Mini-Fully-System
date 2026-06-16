import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import axios from 'axios'; // (නැතහොත් axios)

// API Service & Context
import { AppProvider, useApp } from './context/AppContext';
import { fetchRequests } from './api/api';

// Components
import Sidebar from './components/Sidebar';
import MaintenanceForm from './components/MaintenanceForm';

// Views
import LoginView from './views/LoginView';
import Dashboard from './views/Dashboard';
import MaintenanceView from './views/MaintenanceView';
import UserManagement from './views/UserManagement';
import InventoryManager from './views/InventoryManager';
import ToolAllocation from './views/ToolAllocation';
import GRNPage from './views/GRNPage';
import InventoryReport from './views/InventoryReport';
import SettingsView from './views/SettingsView'; 
import MaterialsRegistry from './views/MaterialsRegistry'; // ✅ ADDED: Materials Registry පිටුව Import කිරීම

const MainAppContent = () => {
  const { user, logout } = useApp();
  const [requests, setRequests] = useState([]);
  const [grns, setGrns] = useState([]); 
  const [staffList, setStaffList] = useState([]); 
  const [departments, setDepartments] = useState([]); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const systemColor = "#A47148";

  // 1. Load Maintenance Job Data
  const loadData = async () => {
    if (!user) return;
    try {
      const data = await fetchRequests();
      setRequests(data || []);
    } catch (err) {
      console.error("Maintenance Sync Error:", err);
    }
  };

  // 2. Load Inventory, Staff, and Department Data
  const loadSystemData = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const [grnRes, staffRes, depRes] = await Promise.all([
        axios.get('http://192.168.1.19:5000/api/grn'),
        axios.get('http://192.168.1.19:5000/api/users/staff'),
        axios.get('http://192.168.1.19:5000/api/departments') 
      ]);
      
      setGrns(grnRes.data || []);
      setStaffList(staffRes.data || []);
      setDepartments(depRes.data || []); 
    } catch (err) {
      console.error("System Data Fetch Error:", err);
    }
  };

  // Global Sync Logic (Refresh every 60s)
  useEffect(() => {
    if (user) {
      loadData();
      loadSystemData();
      
      const interval = setInterval(() => {
        loadData();
        loadSystemData();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- AUTHENTICATION GUARD ---
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* SIDEBAR */}
      <Sidebar user={user} logout={logout} onAddNew={() => setIsFormOpen(true)} />

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-72 outline-none focus:ring-1 focus:ring-[#A47148] transition-all font-medium" 
                placeholder="Search system..." 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative transition-colors">
              <Bell size={19} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none mb-1 uppercase tracking-tight">{user.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: systemColor }}>
                  {user.role} Access
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md" style={{ backgroundColor: systemColor }}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN ROUTING AREA */}
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard requests={requests} />} />
            
            <Route 
              path="/maintenance" 
              element={<MaintenanceView requests={requests} onRefresh={loadData} />} 
            />

            <Route 
              path="/grn-create" 
              element={<GRNPage onRefresh={loadSystemData} />} 
            />

            <Route 
              path="/inventory" 
              element={<InventoryManager grns={grns} onRefresh={loadSystemData} />} 
            />

            {/* ✅ NEW ROUTE: Materials Registry පිටුවට අදාළ ලිපිනය */}
            <Route 
              path="/materials" 
              element={<MaterialsRegistry />} 
            />

            <Route 
              path="/allocation" 
              element={
                <ToolAllocation 
                  inventoryItems={grns} 
                  staffList={staffList} 
                  onRefresh={loadSystemData} 
                />
              } 
            />

            <Route 
              path="/reports" 
              element={<InventoryReport grns={grns} />} 
            />

            <Route path="/users" element={<UserManagement />} />

            <Route 
              path="/settings" 
              element={<SettingsView onRefresh={loadSystemData} />} 
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* GLOBAL FORM (Maintenance Request) */}
      <MaintenanceForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onRefresh={loadData}
        departments={departments} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}