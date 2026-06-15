import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  UserPlus, Shield, ChevronDown, Building2, 
  KeyRound, UserCircle, CheckCircle2, UserCog, 
  Users, Search, Trash2, AlertTriangle 
} from 'lucide-react';

// --- INTERNAL COMPONENT: MODERN CONFIRMATION MODAL ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl">
              <AlertTriangle size={32} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">{message}</p>
        </div>
        <div className="flex gap-3 p-6 bg-slate-50">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
          >
            Delete Now
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ Search State
  
  // UI States for Dropdowns
  const [roleOpen, setRoleOpen] = useState(false);
  const [depOpen, setDepOpen] = useState(false);
  const [modalData, setModalData] = useState({ isOpen: false, id: null, name: '' });
  
  const [formData, setFormData] = useState({
    username: '', password: '', userType: 'Normal User', department: ''
  });

  const systemColor = "#A47148";

  useEffect(() => { 
    fetchUsers(); 
    fetchDepartments(); 
    const closeAll = () => { setRoleOpen(false); setDepOpen(false); };
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data || []);
    } catch (err) { console.error("Error fetching users", err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/departments');
      setDepartments(res.data || []);
    } catch (err) { console.error("Error fetching departments", err); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.department) return toast.error("Please select a department");
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/users/register', formData);
      toast.success("Staff Account Created");
      setFormData({ username: '', password: '', userType: 'Normal User', department: '' });
      fetchUsers();
    } catch (err) { toast.error("Registration failed"); }
    finally { setLoading(false); }
  };

  const executeDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${modalData.id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) { toast.error("Delete failed"); }
  };

  // ✅ SEARCH LOGIC
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 font-sans">
      
      {/* 1. REGISTRATION FORM SECTION */}
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
            <UserPlus size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-800">Register New Staff</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MMS Core Access Management</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Username</label>
            <div className="relative group flex items-center">
              <UserCircle className="absolute left-4 text-slate-300 group-focus-within:text-[#A47148] transition-colors" size={20} />
              <input className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-[#A47148] transition-all" placeholder="e.g. jhon_doe" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group flex items-center">
              <KeyRound className="absolute left-4 text-slate-300 group-focus-within:text-[#A47148] transition-colors" size={20} />
              <input type="password" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-[#A47148] transition-all" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
          </div>

          {/* ROLE DROPDOWN */}
          <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">System Permission Role</label>
            <button type="button" onClick={() => {setRoleOpen(!roleOpen); setDepOpen(false);}} className={`w-full flex items-center justify-between pl-12 pr-6 py-4 bg-white border rounded-2xl text-sm transition-all ${roleOpen ? 'border-[#A47148] ring-4 ring-[#A47148]/5' : 'border-slate-200'}`}>
              <Shield className={`absolute left-4 ${roleOpen ? 'text-[#A47148]' : 'text-slate-300'}`} size={20} />
              <span className="uppercase font-medium text-slate-700">{formData.userType}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${roleOpen ? 'rotate-180' : ''}`} />
            </button>
            {roleOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-xl z-50 overflow-hidden py-2 animate-in slide-in-from-top-2">
                {[{ id: 'Admin', icon: Shield, label: 'Admin Access' }, { id: 'Maintenance Staff', icon: UserCog, label: 'Maintenance Staff' }, { id: 'Normal User', icon: Users, label: 'Standard User' }].map((role) => (
                  <div key={role.id} onClick={() => { setFormData({...formData, userType: role.id}); setRoleOpen(false); }} className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${formData.userType === role.id ? 'bg-[#A47148]/10 text-[#A47148]' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <role.icon size={18} />
                    <span className="text-[11px] font-medium uppercase tracking-wider">{role.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEPARTMENT DROPDOWN */}
          <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
            <button type="button" onClick={() => {setDepOpen(!depOpen); setRoleOpen(false);}} className={`w-full flex items-center justify-between pl-12 pr-6 py-4 bg-white border rounded-2xl text-sm transition-all ${depOpen ? 'border-[#A47148] ring-4 ring-[#A47148]/5' : 'border-slate-200'}`}>
              <Building2 className={`absolute left-4 ${depOpen ? 'text-[#A47148]' : 'text-slate-300'}`} size={20} />
              <span className="uppercase font-medium text-slate-700">{formData.department || "Select Department"}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${depOpen ? 'rotate-180' : ''}`} />
            </button>
            {depOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-xl z-50 overflow-hidden py-2 max-h-60 overflow-y-auto">
                {departments.map((dep) => (
                  <div key={dep._id} onClick={() => { setFormData({...formData, department: dep.name}); setDepOpen(false); }} className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${formData.department === dep.name ? 'bg-[#A47148]/10 text-[#A47148]' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <Building2 size={18} />
                    <span className="text-[11px] font-medium uppercase tracking-wider">{dep.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 mt-4 py-5 bg-[#A47148] text-white font-bold uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl shadow-[#A47148]/20 hover:brightness-110 active:scale-[0.98] transition-all">
            {loading ? 'Processing...' : 'Create Staff Account'}
          </button>
        </form>
      </div>

      {/* --- 2. SEARCH & DIRECTORY TABLE --- */}
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active System Directory</h3>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#A47148] transition-colors" size={18} />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-[#A47148] transition-all shadow-sm"
              placeholder="Search by name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Role Access</th>
                <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-8 py-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{u.username}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-widest">{u.userType}</span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-500 uppercase">{u.department}</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => setModalData({ isOpen: true, id: u._id, name: u.username })}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        onConfirm={executeDelete}
        title="Remove Staff"
        message={`Are you sure you want to delete ${modalData.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default UserManagement;