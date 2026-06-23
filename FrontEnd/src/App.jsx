import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Search, Bell, Check, MailOpen, CheckSquare, Trash2, Layers } from 'lucide-react'; 
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import toast from 'react-hot-toast';

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
import MaterialsRegistry from './views/MaterialsRegistry';
import SupplierRegister from './views/SupplierRegister';
import WorkflowConfiguration from './views/WorkflowConfiguration';
import GRNApprovalsView from './views/GRNApprovalsView';

const MainAppContent = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate(); 
  const [requests, setRequests] = useState([]);
  const [grns, setGrns] = useState([]); 
  const [staffList, setStaffList] = useState([]); 
  const [departments, setDepartments] = useState([]); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const systemColor = "#A47148";

  // 🔔 NOTIFICATION STATES
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

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

  // 🔔 3. Fetch Real-time Notifications for the logged-in User
  const loadNotifications = async () => {
    if (!user || !user.uid) return;
    try {
      const res = await axios.get(`http://192.168.1.19:5000/api/notifications/${user.uid}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // 🔔 4. Mark Single Notification as Read
  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`http://192.168.1.19:5000/api/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success("Notification marked as read");
    } catch (err) {
      console.error(err);
    }
  };

  // 🔔 5. Mark All Notifications as Read
  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length === 0) return;

    try {
      await Promise.all(unreadNotifs.map(n => axios.patch(`http://192.168.1.19:5000/api/notifications/read/${n._id}`)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // 🔔 6. Clear Notifications
  const handleClearNotifications = () => {
    if (notifications.length === 0) return;
    setNotifications([]); 
    toast.success("Notification panel cleared locally");
  };

  // Global Sync Logic (Refresh every 60s)
  useEffect(() => {
    if (user) {
      loadData();
      loadSystemData();
      loadNotifications(); 
      
      const interval = setInterval(() => {
        loadData();
        loadSystemData();
        loadNotifications(); 
      }, 60000);

      const handleClickOutside = (e) => {
        if (notifRef.current && !notifRef.current.contains(e.target)) {
          setIsNotifOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        clearInterval(interval);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased select-none">
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
            
            {/* NOTIFICATION SYSTEM CONTAINER */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative transition-colors outline-none"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* DROP-DOWN NOTIFICATION BLOCK */}
              {isNotifOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200 overflow-hidden font-normal"
                  style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <h3 className="text-xs font-normal text-slate-800 uppercase tracking-wide">System Notifications</h3>
                    <span className="text-[10px] font-normal bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                      {unreadCount} New
                    </span>
                  </div>

                  {/* BULK OPTION BUTTONS */}
                  {notifications.length > 0 && (
                    <div className="p-1.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] font-normal text-slate-500">
                      <button 
                        onClick={handleMarkAllAsRead} 
                        className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-slate-200/60 rounded-md text-slate-600 transition-colors font-normal"
                      >
                        <CheckSquare size={13} /> Mark all read
                      </button>
                      <button 
                        onClick={handleClearNotifications} 
                        className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-red-50 text-red-600 rounded-md transition-colors font-normal"
                      >
                        <Trash2 size={13} /> Clear view
                      </button>
                    </div>
                  )}

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          onClick={() => {
                            handleMarkAsRead(notif._id);
                            setIsNotifOpen(false);
                            if (notif.message?.toLowerCase().includes("grn")) {
                              navigate('/grn-approvals');
                            }
                          }}
                          className={`p-4 text-xs transition-colors flex justify-between items-start gap-3.5 cursor-pointer ${
                            notif.isRead ? 'bg-white opacity-60' : 'bg-blue-50/40 hover:bg-blue-50/70'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 font-normal">
                            <p className="text-slate-700 font-normal leading-relaxed uppercase tracking-tight">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 font-normal flex items-center gap-1">
                              <Layers size={10} className="text-slate-300" />
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}) : 'Just Now'}
                            </p>
                          </div>
                          
                          {!notif.isRead && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                handleMarkAsRead(notif._id);
                              }}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors shadow-sm shrink-0 mt-0.5"
                              title="Mark as Read"
                            >
                              <Check size={12} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-slate-400 text-[11px] font-normal uppercase tracking-wider space-y-1.5 bg-white">
                        <MailOpen size={24} className="mx-auto text-slate-200 mb-2" />
                        <p>No Notifications Found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

            <Route 
              path="/materials" 
              element={<MaterialsRegistry />} 
            />

            <Route 
              path="/supplier-register" 
              element={<SupplierRegister />} 
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
              path="/workflow-setup" 
              element={<WorkflowConfiguration />} 
            />

            <Route 
              path="/grn-approvals" 
              element={<GRNApprovalsView onRefresh={loadSystemData} />} 
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