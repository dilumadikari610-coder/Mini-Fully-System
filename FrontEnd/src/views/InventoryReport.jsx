import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Printer, UserCheck, 
  Box, RotateCcw, ChevronDown 
} from 'lucide-react';

const InventoryReport = () => {
  const [grns, setGrns] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStaffOpen, setIsStaffOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const close = () => setIsStaffOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const fetchData = async () => {
    try {
      const [grnRes, staffRes] = await Promise.all([
        axios.get('http://localhost:5000/api/grn'),
        axios.get('http://localhost:5000/api/users/staff')
      ]);
      setGrns(grnRes.data || []);
      setStaffList(staffRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const staffAssets = grns.flatMap(grn => 
    (grn.items || []).flatMap(item => 
      (item.assignments || [])
        .filter(assign => {
          const matchesStaff = selectedStaff ? assign.staffName === selectedStaff : false;
          const matchesGRN = searchTerm ? grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) : true;
          return matchesStaff && matchesGRN;
        })
        .map(assign => ({
          assetName: item.itemName,
          staffName: assign.staffName,
          batch: grn.grnNumber,
          date: assign.assignedDate,
          condition: "Active"
        }))
    )
  );

  return (
    <div className="p-8 space-y-6 font-sans text-black animate-in fade-in duration-500">
      
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-black">Staff Custody Report</h2>
          <p className="text-[10px] font-medium text-black/50 uppercase tracking-widest mt-1">Filtered Tool Assignment Ledger</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {setSelectedStaff(''); setSearchTerm('');}}
            className="p-3 bg-white border border-black/10 rounded-2xl hover:bg-slate-50 transition-all text-black/40 hover:text-black"
          >
            <RotateCcw size={18} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-black/20 hover:bg-zinc-900 transition-all">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* 2. SEARCH & STAFF SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[32px] border border-black/5 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Search GRN Ref</label>
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-black/30" size={18} />
            <input 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-black/10 rounded-2xl text-sm text-black outline-none focus:border-black transition-all"
              placeholder="Ex: GRN000001"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
          <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Select Staff Member</label>
          <button 
            onClick={() => setIsStaffOpen(!isStaffOpen)}
            className="w-full flex items-center justify-between pl-12 pr-6 py-4 bg-white border border-black/10 rounded-2xl text-sm font-normal text-black transition-all hover:border-black"
          >
            <UserCheck className="absolute left-4 text-black/30" size={18} />
            <span className="uppercase">{selectedStaff || "Choose Member"}</span>
            <ChevronDown size={14} className={`transition-transform text-black ${isStaffOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStaffOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/10 rounded-3xl shadow-2xl z-50 overflow-hidden py-2 animate-in slide-in-from-top-2">
              {staffList.map(staff => (
                <div 
                  key={staff._id}
                  onClick={() => {setSelectedStaff(staff.username); setIsStaffOpen(false);}}
                  className={`px-5 py-3 text-[11px] font-medium uppercase cursor-pointer hover:bg-slate-50 transition-colors ${selectedStaff === staff.username ? 'bg-black text-white' : 'text-black'}`}
                >
                  {staff.username}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. FILTERED STAFF CUSTODY TABLE */}
      <div className="bg-white rounded-[40px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white rounded-xl"><Box size={16} /></div>
            <h3 className="text-[11px] font-bold text-black uppercase tracking-widest">Tools Held by {selectedStaff || "..."}</h3>
          </div>
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
            {staffAssets.length} Items Assigned
          </span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5">Asset Description</th>
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5">GRN Ref</th>
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest border-b border-black/5">Assigned Date</th>
              <th className="px-8 py-5 text-[9px] font-bold text-black/40 uppercase tracking-widest text-right border-b border-black/5">Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {staffAssets.length > 0 ? staffAssets.map((asset, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-[13px] font-medium text-black uppercase">{asset.assetName}</td>
                <td className="px-8 py-5 text-[12px] font-normal text-black/60 uppercase">{asset.batch}</td>
                <td className="px-8 py-5 text-[12px] font-normal text-black/60 uppercase">{new Date(asset.date).toLocaleDateString()}</td>
                <td className="px-8 py-5 text-right">
                  <span className="px-3 py-1 bg-black/5 text-black rounded-lg text-[9px] font-bold uppercase tracking-widest">
                    {asset.condition}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="py-32 text-center">
                  <div className="flex flex-col items-center opacity-20">
                    <UserCheck size={48} className="mb-4 text-black" />
                    <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">
                      {selectedStaff ? "No tools assigned to this member" : "Select a member to view data"}
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