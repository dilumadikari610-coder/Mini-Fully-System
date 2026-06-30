import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext'; // Context එකෙන් දැනට ලොග් වී සිටින යූසර්ව ලබා ගනී
import { 
  Search, Printer, UserCheck, 
  Box, RotateCcw, ChevronDown, Calendar 
} from 'lucide-react';

const InventoryReport = () => {
  const { user } = useApp(); // ලොග් වී සිටින යූසර්ගේ විස්තර (user.role, user.uid, user.name)
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(''); 
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [staffAssets, setStaffAssets] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // යූසර් Admin කෙනෙක් නම් පමණක් මුළු ස්ටාෆ් ලැයිස්තුවම ලෝඩ් කරයි
    if (user && user.role === 'admin') {
      fetchStaffList();
    } else if (user && user.uid) {
      // යූසර් Staff කෙනෙක් නම්, Dropdown එකක් නැතිව එයාගේ ID එක කෙලින්ම සෙට් කරයි
      setSelectedStaffId(user.uid);
      setSelectedStaffName(user.name);
    }

    const close = () => setIsStaffOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [user]);

  // Staff ID එක වෙනස් වන සෑම විටම ස්ටොක් එක ලෝඩ් කරයි
  useEffect(() => {
    if (selectedStaffId) {
      fetchStaffInventory(selectedStaffId);
    } else {
      setStaffAssets([]);
    }
  }, [selectedStaffId]);

  const fetchStaffList = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/users/staff');
      setStaffList(res.data || []);
    } catch (err) {
      console.error("Fetch staff list error:", err);
    }
  };

  const fetchStaffInventory = async (staffId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://192.168.1.19:5000/api/staff-inventory/${staffId}`);
      setStaffAssets(res.data || []);
    } catch (err) {
      console.error("Fetch staff inventory error:", err);
    } finally {
      setLoading(false);
    }
  };

  // GRN Ref එකෙන් සර්ච් කරද්දී filter කිරීමේ ලොජික් එක
  const filteredAssets = staffAssets.filter(asset => {
    const matchesGRN = searchTerm 
      ? asset.grnId?.toLowerCase().includes(searchTerm.toLowerCase()) 
      : true;
    return matchesGRN;
  });

  const isSidebarAdmin = user?.role === 'admin';

  return (
    <div className="p-8 space-y-6 font-sans text-black antialiased" style={{ fontFamily: 'Segoe UI, Open Sans, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
      
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-xl text-black tracking-wide uppercase" style={{ fontWeight: 'normal' }}>
            {isSidebarAdmin ? "Staff Custody Report" : "My Tool Custody Ledger"}
          </h2>
          <p className="text-[10px] font-medium text-black/50 uppercase tracking-widest mt-1" style={{ fontWeight: 'normal' }}>
            {isSidebarAdmin ? "Filtered Tool Assignment Ledger" : "Your personally assigned factory tools inventory"}
          </p>
        </div>
        <div className="flex gap-3">
          {isSidebarAdmin && (
            <button 
              onClick={() => {setSelectedStaffId(''); setSelectedStaffName(''); setSearchTerm(''); setStaffAssets([]);}}
              className="p-3 bg-white border border-black/10 rounded-2xl hover:bg-slate-50 transition-all text-black/40 hover:text-black"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all" style={{ fontWeight: 'normal' }}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* 2. SEARCH & STAFF SELECTOR BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[32px] border border-black/5 shadow-sm">
        <div className="space-y-2 text-left">
          <label className="text-[10px] text-black uppercase tracking-widest ml-1" style={{ fontWeight: 'normal' }}>Search GRN Ref</label>
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-black/30" size={18} />
            <input 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-black/10 rounded-2xl text-sm text-black outline-none focus:border-black transition-all font-mono"
              placeholder="Ex: GRN000001"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 relative text-left" onClick={(e) => e.stopPropagation()}>
          <label className="text-[10px] text-black uppercase tracking-widest ml-1" style={{ fontWeight: 'normal' }}>
            {isSidebarAdmin ? "Select Staff Member" : "Active Staff Member"}
          </label>
          
          {isSidebarAdmin ? (
            <button 
              onClick={() => setIsStaffOpen(!isStaffOpen)}
              className="w-full flex items-center justify-between pl-12 pr-6 py-4 bg-white border border-black/10 rounded-2xl text-sm font-normal text-black transition-all hover:border-black"
            >
              <UserCheck className="absolute left-4 text-black/30" size={18} />
              <span className="uppercase">{selectedStaffName || "Choose Member"}</span>
              <ChevronDown size={14} className={`transition-transform text-black ${isStaffOpen ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <div className="w-full flex items-center pl-12 pr-6 py-4 bg-slate-100 border border-black/5 text-slate-500 rounded-2xl text-sm font-bold uppercase relative">
              <UserCheck className="absolute left-4 text-slate-400" size={18} />
              {selectedStaffName}
            </div>
          )}

          {isSidebarAdmin && isStaffOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/10 rounded-3xl shadow-2xl z-50 overflow-hidden py-2 animate-in slide-in-from-top-2">
              {staffList.map(staff => (
                <div 
                  key={staff._id}
                  onClick={() => {
                    setSelectedStaffId(staff._id);
                    setSelectedStaffName(staff.username);
                    setIsStaffOpen(false);
                  }}
                  className={`px-5 py-3 text-[11px] font-medium uppercase cursor-pointer hover:bg-slate-50 transition-colors ${selectedStaffId === staff._id ? 'bg-black text-white' : 'text-black'}`}
                >
                  {staff.username}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. FILTERED STAFF CUSTODY TABLE */}
      <div className="bg-white rounded-[40px] border border-black/5 shadow-sm overflow-hidden text-left">
        <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white rounded-xl"><Box size={16} /></div>
            <h3 className="text-[11px] font-bold text-black uppercase tracking-widest" style={{ fontWeight: 'normal' }}>
              {isSidebarAdmin ? `Tools Held by ${selectedStaffName || "..."}` : "My Factory Assets & Tools Registry"}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest" style={{ fontWeight: 'normal' }}>
            {filteredAssets.length} Items Assigned
          </span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5" style={{ fontWeight: 'normal' }}>Asset Description</th>
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5" style={{ fontWeight: 'normal' }}>GRN Ref</th>
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5 text-center w-32" style={{ fontWeight: 'normal' }}>Holding Qty</th>
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5" style={{ fontWeight: 'normal' }}>Assigned Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-xs text-black">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-20 text-center text-[11px] font-bold uppercase tracking-wider text-black/40" style={{ fontWeight: 'normal' }}>
                  Syncing live custody ledger records...
                </td>
              </tr>
            ) : filteredAssets.length > 0 ? filteredAssets.map((asset, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors uppercase font-mono">
                {/* Asset Description SKU */}
                <td className="px-8 py-5 text-[12px] text-black font-semibold">
                  <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold">[{asset.code || 'GEN-MAT'}]</span>
                  <span className="font-sans normal-case font-medium">{asset.itemName}</span>
                </td>
                
                {/* GRN Ref */}
                <td className="px-8 py-5 text-[12px] text-slate-500 font-bold">{asset.grnId || 'N/A'}</td>
                
                {/* 💡 FIXED COLUMN: `flex` හෝ අනවශ්‍ය Default values ඉවත් කර පිරිසිදු මැද ලයිනමන්ට් එක ලබා දුනි */}
                <td className="px-8 py-5 text-[13px] text-center text-black font-bold">
                  {asset.quantity !== undefined && asset.quantity !== null ? asset.quantity : 1}
                </td>
                
                {/* 💡 FIXED COLUMN: `<td>` එක ඇතුළෙන් කෙලින්ම තිබුණු `flex` ඉවත් කර `<div>` බ්ලොක් එකක් ඇතුළට දමා Layout බිඳීම සදහටම විසඳන ලදී */}
                <td className="px-8 py-5 text-[11px] text-slate-500 font-sans normal-case">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-300 shrink-0" />
                    <span>{asset.allocatedDate ? asset.allocatedDate.split('T')[0] : 'N/A'}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="py-32 text-center">
                  <div className="flex flex-col items-center opacity-20">
                    <UserCheck size={48} className="mb-4 text-black" />
                    <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em]" style={{ fontWeight: 'normal' }}>
                      {selectedStaffName ? "No operational tools assigned to this profile" : "Select a team member to fetch custody ledger data"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryReport;