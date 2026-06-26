import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserCheck, Wrench, ChevronDown, Search, Plus, Trash2, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';

const ToolAllocation = ({ inventoryItems = [], staffList = [], onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  // 💡 AUTO GENERATE ALLOCATION DOCUMENT NUMBER (පිටුව ලෝඩ් වෙද්දීම හැදෙන අංකය)
  const [allocDocNumber, setAllocDocNumber] = useState(`ALC-${Date.now().toString().slice(-6)}`);

  // --- CUSTOM DROPDOWNS STATES ---
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);

  // 💡 MULTI-ITEM BASKET (එකම ඩොකියුමන්ට් එකට එකතු කරන බඩු ලැයිස්තුව)
  const [selectedItemsList, setSelectedItemsList] = useState([]);

  const toolRef = useRef(null);
  const staffRef = useRef(null);

  // Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolRef.current && !toolRef.current.contains(e.target)) setIsToolOpen(false);
      if (staffRef.current && !staffRef.current.contains(e.target)) setIsStaffOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // GRN ඩේටා ඇතුළෙන් ලබාගත හැකි සියලුම උපකරණ Array එකකට සැකසීම
  const allAvailableTools = inventoryItems.flatMap(grn => 
    (grn.items || []).map(item => ({
      ...item,
      itemCode: item.code || item.materialCode || item.itemCode || 'GEN-MAT',
      grnInvoiceCode: grn.invoiceCode || grn.grnId,
      // 💡 FIXED: ඩේටාබේස් එකේ පවතින සැබෑ උපරිම ප්‍රමාණය වෙන වෙනම හඳුනාගැනීම
      maxAvailableQty: Number(item.qty || item.quantity || 0) 
    }))
  );

  // Filter Dropdowns
  const filteredTools = allAvailableTools.filter(t => 
    !selectedItemsList.some(added => added.itemCode === t.itemCode) && // දැනටමත් එකතු කරපු ඒවා ලැයිස්තුවෙන් ඉවත් කරයි
    (t.itemName?.toLowerCase().includes(toolSearch.toLowerCase()) ||
     t.itemCode?.toLowerCase().includes(toolSearch.toLowerCase()))
  );

  const filteredStaff = staffList.filter(s => 
    s.username?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // ➕ ITEM එකක් BASKET එකට එකතු කිරීම
  const handleAddItemToBasket = (tool) => {
    setSelectedItemsList([...selectedItemsList, { ...tool, qty: 1 }]);
    setIsToolOpen(false);
    setToolSearch('');
  };

  // ➖ BASKET එකෙන් ITEM එකක් අයින් කිරීම
  const handleRemoveItemFromBasket = (itemCode) => {
    setSelectedItemsList(selectedItemsList.filter(item => item.itemCode !== itemCode));
  };

  // 🔢 Quantity වෙනස් කිරීමේ Logic එක
  const handleQtyChange = (itemCode, newQty) => {
    const parsedQty = parseInt(newQty);
    
    setSelectedItemsList(selectedItemsList.map(item => {
      if (item.itemCode === itemCode) {
        // 💡 LIVE INPUT VALIDATION: යූසර් කෝඩ් එකෙන් හෝ ඇරෝස් වලින් උපරිම සීමාව පැන්නොත් එය උපරිමයටම සීමා කර වෝනින් එකක් දෙයි
        if (parsedQty > item.maxAvailableQty) {
          toast.error(`Cannot exceed maximum available GRN stock! (Max: ${item.maxAvailableQty})`);
          return { ...item, qty: item.maxAvailableQty };
        }
        return { ...item, qty: parsedQty || 1 };
      }
      return item;
    }));
  };

  // --- 💾 SUBMIT ENTIRE DOCUMENT ALLOCATION ---
  const handleFinalAllocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return toast.error("Please select a maintenance staff member");
    if (selectedItemsList.length === 0) return toast.error("Please add at least one item to the allocation document");

    // 💡 SUBMIT TIME VALIDATION: සේව් කිරීමට පෙර නැවත වරක් සියලුම අයිතමයන්හි සීමාවන් පරික්ෂා කිරීම
    const hasOverAllocatedItem = selectedItemsList.some(item => Number(item.qty) > Number(item.maxAvailableQty));
    if (hasOverAllocatedItem) {
      return toast.error("Validation failed! Some items in the basket exceed the maximum available stock.");
    }

    setLoading(true);
    const t = toast.loading(`Processing Allocation Document ${allocDocNumber}...`);

    // 💡 GRN Process එක වගේම මුළු ඩොකියුමන්ට් එකම එකවර Backend එකට යැවීම
    const payload = {
      allocationDocNo: allocDocNumber,
      staffId: selectedStaff._id,
      staffName: selectedStaff.username,
      allocatedItems: selectedItemsList.map(item => ({
        grnInvoiceCode: item.grnInvoiceCode,
        materialCode: item.itemCode,
        itemName: item.itemName,
        qty: item.qty
      }))
    };

    try {
      // ඔයාගේ Backend එකේ Multi-item allocation patch/post endpoint එක කෝල් කරයි
      await axios.post('http://192.168.1.19:5000/api/grn/allocate-bulk', payload);
      
      toast.success(`Successfully Generated Document ${allocDocNumber}!`, { id: t });
      
      // Reset Page States
      setSelectedItemsList([]);
      setSelectedStaff(null);
      setStaffSearch('');
      setAllocDocNumber(`ALC-${Date.now().toString().slice(-6)}`); // අලුත් අංකයක් දීම
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Bulk tool allocation failed", { id: t });
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="p-8 antialiased text-slate-700 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-start w-full select-none" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* 1. PAGE HEADER */}
      <div className="w-full max-w-3xl mb-8 border-b border-slate-200/60 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck size={22} className="text-slate-600" /> Bulk Stock Allocation
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Allocate Multiple Workshop Items under One Document</p>
        </div>
        {/* Document Number Tag */}
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-sm">
          <FileText size={14} /> {allocDocNumber}
        </div>
      </div>

      {/* 2. MAIN LAYOUT CARD */}
      <div className="w-full max-w-3xl bg-white border border-slate-200 p-8 rounded-[32px] shadow-xl shadow-slate-200/40 space-y-6">
        
        {/* STEP A: SELECT STAFF */}
        <div className="space-y-2 relative" ref={staffRef}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">1. Assign To Maintenance Staff (Custodian)</label>
          <div 
            onClick={() => setIsStaffOpen(!isStaffOpen)}
            className="w-full flex items-center justify-between pl-4 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 cursor-pointer transition-all hover:bg-white hover:border-slate-400 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <UserCheck size={15} className="text-slate-400" />
              <span className="uppercase text-slate-800 font-bold">
                {selectedStaff ? selectedStaff.username : "Select Maintenance Member / Technician"}
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
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
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

        {/* STEP B: SEARCH AND CHOOSE ITEMS TO ADD */}
        <div className="space-y-2 relative" ref={toolRef}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">2. Search & Add Items to Document</label>
          <div 
            onClick={() => setIsToolOpen(!isToolOpen)}
            className="w-full flex items-center justify-between pl-4 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-400 cursor-pointer transition-all hover:bg-white hover:border-slate-400 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Wrench size={15} className="text-slate-400" />
              <span>Click here to search and append items...</span>
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
                  placeholder="Type Code or Item Name..."
                  value={toolSearch}
                  onChange={e => setToolSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-50">
                {filteredTools.length > 0 ? (
                  filteredTools.map((tool, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleAddItemToBasket(tool)}
                      className="p-3 text-xs font-semibold uppercase text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center rounded-xl"
                    >
                      <div>
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold">[{tool.itemCode}]</span>
                        {tool.itemName}
                        {/* 💡 Dropdown එක ඇතුළේදීම දැනට තිබෙන සැබෑ උපරිම ශේෂය පෙන්වීම */}
                        <span className="text-[10px] text-slate-400 ml-2 lowercase tracking-normal">({tool.maxAvailableQty} in stock)</span>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-lg">Add +</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">No items found or all items added</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP C: DYNAMIC TABLE INSIDE DOCUMENT */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
            Document Items Basket ({selectedItemsList.length})
          </label>
          
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3 pl-4">Item Details</th>
                  <th className="p-3 w-36 text-center">Qty to Allocate</th>
                  <th className="p-3 w-16 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white text-xs font-semibold text-slate-700 uppercase">
                {selectedItemsList.length > 0 ? (
                  selectedItemsList.map((item) => (
                    <tr key={item.itemCode} className="hover:bg-slate-50/40">
                      <td className="p-3 pl-4">
                        <div className="font-bold text-slate-800">{item.itemName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          Code: <span className="text-blue-600 font-bold">{item.itemCode}</span> | GRN Source: {item.grnInvoiceCode}
                        </div>
                      </td>
                      <td className="p-3 text-center flex flex-col items-center justify-center">
                        <input 
                          type="number"
                          min="1"
                          // 💡 FIXED: උපරිම සීමාව GRN Stock එකටම සීමා කර ලොක් කිරීම
                          max={item.maxAvailableQty} 
                          value={item.qty}
                          onChange={(e) => handleQtyChange(item.itemCode, e.target.value)}
                          className="w-16 text-center border border-slate-200 bg-slate-50 rounded-lg p-1 font-mono font-bold text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                        />
                        {/* 💡 ඉන්පුට් එකට පහළින් කුඩාවට Max Qty එක පෙන්වීම */}
                        <div className="text-[9px] text-slate-400 tracking-tight lowercase mt-0.5 font-mono">max: {item.maxAvailableQty} items</div>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItemFromBasket(item.itemCode)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Document basket is empty. Please search and append items above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* STEP D: SUMMARY CARD AND ALLOCATION TRIGGER */}
        {selectedStaff && selectedItemsList.length > 0 && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-150">
            <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-800 font-semibold uppercase leading-relaxed tracking-tight">
              Ready to Save Ledger: Document <span className="font-bold text-slate-900">{allocDocNumber}</span> will transfer custody of <span className="font-bold text-slate-900">{selectedItemsList.length} distinct item(s)</span> directly to technician <span className="font-bold text-slate-900">{selectedStaff.username}</span>.
            </div>
          </div>
        )}

        {/* MAIN MASTER SUBMIT BUTTON */}
        <button
          onClick={handleFinalAllocationSubmit}
          disabled={loading || !selectedStaff || selectedItemsList.length === 0}
          className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
        >
          Save & Post Allocation Document
        </button>

      </div>

      {/* SECURITY NOTICE FOOTER */}
      <div className="w-full max-w-3xl mt-4 flex items-center gap-1.5 px-3 opacity-60 text-slate-400 text-[10px] font-bold uppercase tracking-wide">
        <ShieldAlert size={12} /> Authorized Bulk Storekeeper Hand-over Authentication Protocol | MMS CORE
      </div>
    </div>
  );
};

export default ToolAllocation;