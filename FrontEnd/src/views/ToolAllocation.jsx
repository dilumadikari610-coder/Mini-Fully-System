import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserCheck, Wrench, ChevronDown, Search, CheckCircle2, ShieldAlert } from 'lucide-react';

const ToolAllocation = ({ inventoryItems = [], staffList = [], onRefresh }) => {
  const [loading, setLoading] = useState(false);

  // --- CUSTOM DROPDOWNS STATES ---
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);

  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);

  const toolRef = useRef(null);
  const staffRef = useRef(null);

  // Click Outside Logic (Dropdowns වසා දැමීමට)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolRef.current && !toolRef.current.contains(e.target)) setIsToolOpen(false);
      if (staffRef.current && !staffRef.current.contains(e.target)) setIsStaffOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // INVENTORY ITEMS (GRN) ඇතුළෙන් තියෙන සියලුම උපකරණ ලැයිස්තුව තනි Array එකකට සැකසීම
  const allAvailableTools = inventoryItems.flatMap(grn => 
    (grn.items || []).map(item => ({
      ...item,
      itemCode: item.code || item.materialCode || item.itemCode || 'GEN-MAT',
      grnInvoiceCode: grn.invoiceCode || grn.grnId
    }))
  );

  // Filters Logic for Dropdowns
  const filteredTools = allAvailableTools.filter(t => 
    t.itemName?.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.itemCode?.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const filteredStaff = staffList.filter(s => 
    s.username?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // --- SUBMIT ALLOCATION LOGIC ---
  const handleAssignTool = async (e) => {
    e.preventDefault();
    if (!selectedTool) return toast.error("Please select an inventory tool / item");
    if (!selectedStaff) return toast.error("Please select a maintenance staff member");

    setLoading(true);
    const t = toast.loading("Processing Staff Tool Allocation...");

    const payload = {
      grnInvoiceCode: selectedTool.grnInvoiceCode,
      materialCode: selectedTool.itemCode,
      itemName: selectedTool.itemName,
      staffId: selectedStaff._id,
      staffName: selectedStaff.username,
      qty: 1
    };

    try {
      await axios.patch('http://192.168.1.19:5000/api/grn/allocate', payload);
      toast.success(`Successfully Assigned ${selectedTool.itemName} to ${selectedStaff.username}`, { id: t });
      
      setSelectedTool(null);
      setSelectedStaff(null);
      setToolSearch('');
      setStaffSearch('');
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to complete tool allocation", { id: t });
    } finally {
      // ✅ FIXED: 'finaly' වෙනුවට නිවැරදි JavaScript වචනය වන 'finally' ලෙස සකස් කරන ලදී
      setLoading(false);
    }
  };

  return (
    <div className="p-8 antialiased text-slate-700 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-start w-full select-none" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* 1. PAGE HEADER */}
      <div className="w-full max-w-2xl mb-8 border-b border-slate-200/60 pb-4 text-left">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <UserCheck size={22} className="text-slate-600" /> Staff Tool Allocation
        </h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Assign Workshop Inventory to Maintenance Members</p>
      </div>

      {/* 2. MODERN FLOATING CARD */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 p-8 rounded-[32px] shadow-xl shadow-slate-200/40 relative overflow-visible">
        
        <form onSubmit={handleAssignTool} className="space-y-6">
          
          {/* STEP A: SEARCHABLE TOOL DROPDOWN */}
          <div className="space-y-2 relative" ref={toolRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Select Tool / Item Description</label>
            <div 
              onClick={() => setIsToolOpen(!isToolOpen)}
              className="w-full flex items-center justify-between pl-4 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 cursor-pointer transition-all hover:bg-white hover:border-slate-400 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Wrench size={15} className="text-slate-400" />
                <span className="uppercase">
                  {selectedTool ? `[${selectedTool.itemCode}] ${selectedTool.itemName}` : "Choose item from available stock"}
                </span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 text-slate-500 ${isToolOpen ? 'rotate-180' : ''}`} />
            </div>

            {isToolOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative flex items-center border border-slate-200 bg-slate-50 rounded-xl px-3 py-2">
                  <Search size={13} className="text-slate-400 mr-2 shrink-0" />
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 uppercase"
                    placeholder="Search tool by name or code..."
                    value={toolSearch}
                    onChange={e => setToolSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 custom-sidebar-scroll">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setSelectedTool(tool);
                          setIsToolOpen(false);
                        }}
                        className="p-3 text-xs font-semibold uppercase text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center rounded-xl"
                      >
                        <div>
                          <span className="font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold">[{tool.itemCode}]</span>
                          {tool.itemName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Source: {tool.grnInvoiceCode}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">No matching warehouse stock found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP B: SEARCHABLE STAFF DROPDOWN */}
          <div className="space-y-2 relative" ref={staffRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Assign To Maintenance Staff</label>
            <div 
              onClick={() => setIsStaffOpen(!isStaffOpen)}
              className="w-full flex items-center justify-between pl-4 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 cursor-pointer transition-all hover:bg-white hover:border-slate-400 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck size={15} className="text-slate-400" />
                <span className="uppercase">
                  {selectedStaff ? selectedStaff.username : "Select Maintenance Member"}
                </span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 text-slate-500 ${isStaffOpen ? 'rotate-180' : ''}`} />
            </div>

            {isStaffOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative flex items-center border border-slate-200 bg-slate-50 rounded-xl px-3 py-2">
                  <Search size={13} className="text-slate-400 mr-2 shrink-0" />
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 uppercase"
                    placeholder="Search staff member name..."
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-50 custom-sidebar-scroll">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <div 
                        key={staff._id}
                        onClick={() => {
                          setSelectedStaff(staff);
                          setIsStaffOpen(false);
                        }}
                        className="p-3 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer rounded-xl"
                      >
                        {staff.username}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">No active team members match</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CONFIRMATION SUMMARY CARD */}
          {selectedTool && selectedStaff && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs text-emerald-800 font-semibold uppercase leading-relaxed tracking-tight">
                Allocation Ledger Ready: Handing over custody of <span className="font-bold text-slate-900">[{selectedTool.itemCode}] {selectedTool.itemName}</span> to technician <span className="font-bold text-slate-900">{selectedStaff.username}</span>.
              </div>
            </div>
          )}

          {/* SUBMIT INDICATOR */}
          <button
            type="submit"
            disabled={loading || !selectedTool || !selectedStaff}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md shadow-slate-900/10 flex items-center justify-center gap-1.5"
          >
            Confirm & Assign Tool
          </button>
        </form>
      </div>

      {/* SECURITY NOTICE FOOTER */}
      <div className="w-full max-w-2xl mt-4 flex items-center gap-1.5 px-3 opacity-60 text-slate-400 text-[10px] font-bold uppercase tracking-wide">
        <ShieldAlert size={12} /> Authorized Storekeeper Hand-over Authentication Protocol
      </div>
    </div>
  );
};

export default ToolAllocation;