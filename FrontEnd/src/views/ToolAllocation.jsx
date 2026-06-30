import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserCheck, Wrench, ChevronDown, Search, Plus, Trash2, CheckCircle2, ShieldAlert, FileText, Lock as LockIcon } from 'lucide-react';

const ToolAllocation = ({ inventoryItems = [], staffList = [], onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  // TRANSACTION TYPE: ISSUE TO STAFF හෝ RETURN TO STORE
  const [transactionType, setTransactionType] = useState('ISSUE_TO_STAFF'); 

  // AUTO GENERATE TRANSFER NOTE REF NUMBER
  const [allocDocNumber, setAllocDocNumber] = useState(`STN-${Date.now().toString().slice(-6)}`);

  // --- WAREHOUSE & STAFF DISPATCH STATES ---
  const [warehouseDomain, setWarehouseDomain] = useState('MAIN_MATERIAL_STORES'); 
  const [selectedStaffId, setSelectedStaffId] = useState(''); 

  // --- CUSTOM DROPDOWNS STATES ---
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [selectedItemsList, setSelectedItemsList] = useState([]);

  // LIVE DEDUCTION STATE: එකම සෙෂන් එකක් ඇතුළත ස්ටොක් ශේෂයන් සජීවීව අඩු කිරීමට
  const [allocatedQuantitiesTracker, setAllocatedQuantitiesTracker] = useState({});

  const toolRef = useRef(null);

  // Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolRef.current && !toolRef.current.contains(e.target)) setIsToolOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // GRN Data Flatten Pipeline
  const allAvailableTools = inventoryItems.flatMap(grn => 
    (grn.items || []).map(item => {
      const itemCode = item.code || item.materialCode || item.itemCode || 'GEN-MAT';
      const grnInvoiceCode = grn.invoiceCode || grn.grnId;
      const uniqueTrackerKey = `${grnInvoiceCode}_${itemCode}`;
      
      const cleanTotalQty = Number(item.qty || item.quantity || 0);
      const alreadyAllocatedInSession = allocatedQuantitiesTracker[uniqueTrackerKey] || 0;
      const finalLiveStockLeft = cleanTotalQty - alreadyAllocatedInSession;

      return {
        ...item,
        itemCode,
        grnInvoiceCode,
        grnObjectId: grn._id, 
        itemObjectId: item._id,
        maxAvailableQty: finalLiveStockLeft 
      };
    })
  );

  // Filter Dropdown Tools
  const filteredTools = allAvailableTools.filter(t => 
    t.maxAvailableQty > 0 && 
    !selectedItemsList.some(added => added.itemCode === t.itemCode) && 
    (t.itemName?.toLowerCase().includes(toolSearch.toLowerCase()) ||
     t.itemCode?.toLowerCase().includes(toolSearch.toLowerCase()))
  );

  const handleTransactionTypeSwitch = (type) => {
    setTransactionType(type);
    setSelectedItemsList([]);
    setSelectedStaffId('');
    setAllocDocNumber(type === 'ISSUE_TO_STAFF' ? `STN-${Date.now().toString().slice(-6)}` : `RTN-${Date.now().toString().slice(-6)}`);
  };

  const handleAddItemToBasket = (tool) => {
    if (tool.maxAvailableQty <= 0) {
      toast.error("This item is completely out of stock!");
      return;
    }
    setSelectedItemsList([...selectedItemsList, { ...tool, qty: 1 }]);
    setIsToolOpen(false);
    setToolSearch('');
  };

  const handleRemoveItemFromBasket = (itemCode) => {
    setSelectedItemsList(selectedItemsList.filter(item => item.itemCode !== itemCode));
  };

  const handleQtyChange = (itemCode, newQty) => {
    const parsedQty = parseInt(newQty);
    
    setSelectedItemsList(selectedItemsList.map(item => {
      if (item.itemCode === itemCode) {
        if (transactionType === 'ISSUE_TO_STAFF' && parsedQty > item.maxAvailableQty) {
          toast.error(`Cannot exceed maximum available stock! (Available: ${item.maxAvailableQty})`);
          return { ...item, qty: item.maxAvailableQty };
        }
        return { ...item, qty: parsedQty || 1 };
      }
      return item;
    }));
  };

  const currentSelectedStaff = staffList.find(s => s._id === selectedStaffId);

  // --- SAVE MECHANISM ---
  const handleFinalAllocationSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStaffId) return toast.error("Please select a maintenance staff member reference");
    if (selectedItemsList.length === 0) return toast.error("Please add at least one item to the basket");

    setLoading(true);
    const toastLabel = transactionType === 'ISSUE_TO_STAFF' ? "Posting Stock Handover Note..." : "Posting Stock Return Note...";
    const t = toast.loading(`${toastLabel} ${allocDocNumber}...`);

    try {
      // 💡 FIXED DISPATCH WORKFLOW:
      // ඔයාගේ සර්වර් එකේ තියෙන පරණ ලොජික් එක ඇතුළේ සිදුවන `$inc: { quantity: inventoryItem.quantity }` කියන දෝෂය මඟහැරවීමට,
      // අපි සර්වර් එකට දත්ත යවන්න කලින්, සර්වර් එක ඩේටාබේස් එකෙන් සොයාගන්නා Inventory Object එකේ quantity එක, 
      // යූසර් ටයිප් කරපු සැබෑ ප්‍රමාණයට සමාන වන පරිදි සකසා එකින් එක Patch කරනු ලබනවා.
      const allocationPromises = selectedItemsList.map(item => {
        const payload = {
          grnObjectId: item.grnObjectId,
          itemObjectId: item.itemObjectId,
          staffId: selectedStaffId,
          staffName: currentSelectedStaff ? currentSelectedStaff.username : "UNKNOWN_STAFF",
          // 💡 සර්වර් එකේ Inventory findOne එක හරියටම මැච් වෙන්න 'itemName' එක නූලටම යවයි
          itemName: item.itemName, 
          // 💡 සර්වර් එකේ වැරදි ඩේටා ටයිප් Increment බග එක පාලනය කිරීමට සැබෑ ප්‍රමාණය කෙලින්ම යවයි
          quantity: Number(item.qty) 
        };
        
        return axios.patch('http://localhost:5000/api/grn/allocate', payload);
      });

      await Promise.all(allocationPromises);

      // සජීවීව ෆ්‍රන්ට්එන්ඩ් එකෙන් ප්‍රමාණයන් අඩු කිරීමේ Tracker එක යාවත්කාලීන කිරීම
      const updatedTracker = { ...allocatedQuantitiesTracker };
      selectedItemsList.forEach(item => {
        const uniqueTrackerKey = `${item.grnInvoiceCode}_${item.itemCode}`;
        if (transactionType === 'ISSUE_TO_STAFF') {
          updatedTracker[uniqueTrackerKey] = (updatedTracker[uniqueTrackerKey] || 0) + Number(item.qty);
        } else {
          updatedTracker[uniqueTrackerKey] = Math.max(0, (updatedTracker[uniqueTrackerKey] || 0) - Number(item.qty));
        }
      });
      setAllocatedQuantitiesTracker(updatedTracker);

      toast.success(`Successfully Logged Transaction Document: ${allocDocNumber}!`, { id: t });
      
      // Reset Page Layout
      setSelectedItemsList([]);
      setSelectedStaffId('');
      setAllocDocNumber(transactionType === 'ISSUE_TO_STAFF' ? `STN-${Date.now().toString().slice(-6)}` : `RTN-${Date.now().toString().slice(-6)}`); 
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("❌ Transmission Alignment Failed:", err);
      toast.error(err.response?.data?.message || "Transaction submission failed. Verify backend alignment.", { id: t });
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="p-8 antialiased text-black bg-[#EFEFEF] min-h-screen flex flex-col items-center justify-start w-full select-none" style={{ fontFamily: 'Segoe UI, Open Sans, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal', letterSpacing: '0.02em' }}>
      
      {/* 1. ERP HUB PAGE HEADER */}
      <div className="w-full max-w-5xl mb-8 border-b border-slate-300 pb-4 flex justify-between items-end">
        <div className="text-left">
          <h1 className="text-xl text-black tracking-wide" style={{ fontWeight: 'normal' }}>
            Workshop Stock Allocation & Return Hub
          </h1>
          <p className="text-xs text-slate-500 tracking-wider mt-1 uppercase" style={{ fontWeight: 'normal' }}>Dynamically Handover Material Balances or Process Custody Return Notes</p>
        </div>
        
        <div className="bg-white border border-slate-300 text-black px-4 py-1.5 rounded-lg text-xs font-mono shadow-sm">
          DOC REF: <span className="text-blue-600 font-bold tracking-wider">{allocDocNumber}</span>
        </div>
      </div>

      {/* 2. MAIN GRID WORKSPACE */}
      <div className="w-full max-w-5xl grid grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 p-6 rounded-[24px] space-y-6 text-left shadow-sm">
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Select Inventory Movement Direction</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => handleTransactionTypeSwitch('ISSUE_TO_STAFF')}
                className={`py-2.5 text-[10px] uppercase tracking-wider rounded-lg transition-all font-sans ${transactionType === 'ISSUE_TO_STAFF' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                1. Issue To Staff ⬇
              </button>
              <button
                type="button"
                onClick={() => handleTransactionTypeSwitch('RETURN_TO_STORE')}
                className={`py-2.5 text-[10px] uppercase tracking-wider rounded-lg transition-all font-sans ${transactionType === 'RETURN_TO_STORE' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                2. Return To Store ⬆
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {transactionType === 'ISSUE_TO_STAFF' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Source Issuing Warehouse</label>
                <select className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none font-mono tracking-wide uppercase cursor-not-allowed" value={warehouseDomain} disabled>
                  <option value="MAIN_MATERIAL_STORES">ELISHA MAIN MATERIAL STORES</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Target Destination Staff (Recipient Custodian)</label>
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-black outline-none focus:border-slate-400 focus:bg-white cursor-pointer uppercase font-mono tracking-wide"
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                >
                  <option value="">-- SELECT TARGET MAINTENANCE STAFF --</option>
                  {staffList.map(staff => (
                    <option key={staff._id} value={staff._id}>{staff.username.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Source Issuing Custodian (Staff Member)</label>
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-black outline-none focus:border-slate-400 focus:bg-white cursor-pointer uppercase font-mono tracking-wide"
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                >
                  <option value="">-- SELECT SOURCE MAINTENANCE STAFF --</option>
                  {staffList.map(staff => (
                    <option key={staff._id} value={staff._id}>{staff.username.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Target Destination Warehouse</label>
                <select className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none font-mono tracking-wide uppercase cursor-not-allowed" value={warehouseDomain} disabled>
                  <option value="MAIN_MATERIAL_STORES">ELISHA MAIN MATERIAL STORES</option>
                </select>
              </div>
            </>
          )}

          {/* MATERIAL SEARCH INGESTION BOX */}
          <div className="space-y-1.5 relative" ref={toolRef}>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Search & Append Material Items</label>
            <div 
              onClick={() => setIsToolOpen(!isToolOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-pointer transition-all hover:bg-white focus:border-slate-400 shadow-sm"
            >
              <span className="tracking-wide">CLICK TO SEARCH AVAILABLE MATERIAL...</span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>

            {isToolOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-2 space-y-1 animate-in fade-in duration-100">
                <div className="flex items-center border border-slate-200 bg-slate-50 rounded-md px-2 py-1.5">
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-xs text-black placeholder:text-slate-400 uppercase font-mono tracking-wide"
                    placeholder="Type SKU Code or Item Description..."
                    value={toolSearch}
                    onChange={e => setToolSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleAddItemToBasket(tool)}
                        className="p-2 text-xs text-black hover:bg-slate-100 transition-colors cursor-pointer flex justify-between items-center font-mono tracking-wide uppercase border-b border-slate-100 last:border-none"
                      >
                        <div className="truncate pr-2">
                          <span className="text-blue-600 font-bold mr-1">[{tool.itemCode}]</span>
                          <span className="text-slate-800 font-sans normal-case">{tool.itemName}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                          {tool.maxAvailableQty} STK
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[10px] text-slate-400 uppercase tracking-wider">No physical inventory detected</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-[24px] overflow-hidden text-left shadow-sm">
          
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
            <LockIcon size={14} className="text-slate-500" />
            <span className="text-xs uppercase tracking-wider text-slate-600 font-sans" style={{ fontWeight: 'normal' }}>
              {transactionType === 'ISSUE_TO_STAFF' ? "Allocation Line Items Basket" : "Return Line Items Basket"} ({selectedItemsList.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] text-slate-500 uppercase tracking-wider font-sans select-none" style={{ fontWeight: 'normal' }}>
                  <th className="px-4 py-3 border-r border-slate-200 w-7/12" style={{ fontWeight: 'normal' }}>Material SKU Parameters</th>
                  <th className="px-2 py-3 text-center border-r border-slate-200 w-3/12" style={{ fontWeight: 'normal' }}>
                    {transactionType === 'ISSUE_TO_STAFF' ? "Issue Qty" : "Return Qty"}
                  </th>
                  <th className="px-4 py-3 text-center w-2/12" style={{ fontWeight: 'normal' }}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-black" style={{ fontWeight: 'normal' }}>
                {selectedItemsList.length > 0 ? (
                  selectedItemsList.map((item) => (
                    <tr key={item.itemCode} className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 border-r border-slate-200 tracking-wide text-left">
                        <div className="text-black font-sans text-xs font-medium normal-case">{item.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-normal mt-0.5 uppercase">
                          SKU: <span className="text-blue-600 font-bold">[{item.itemCode}]</span> | SOURCE: {item.grnInvoiceCode}
                        </div>
                      </td>
                      
                      <td className="p-2 border-r border-slate-200 bg-slate-50/20 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <input 
                            type="number"
                            min="1"
                            max={transactionType === 'ISSUE_TO_STAFF' ? item.maxAvailableQty : undefined} 
                            value={item.qty}
                            onChange={(e) => handleQtyChange(item.itemCode, e.target.value)}
                            className="w-20 text-center border border-slate-300 bg-white rounded px-1.5 py-0.5 font-mono text-xs text-black outline-none focus:border-slate-500 font-medium"
                          />
                          {transactionType === 'ISSUE_TO_STAFF' && (
                            <span className="text-[9px] text-slate-400 font-mono tracking-tight lowercase">max: {item.maxAvailableQty}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-2 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItemFromBasket(item.itemCode)}
                          className="text-xs text-red-500 hover:text-red-700 tracking-wide font-sans hover:underline px-2 py-1 transition-all"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-16 text-center text-slate-400 text-xs uppercase tracking-wider bg-slate-50/10 font-sans" style={{ fontWeight: 'normal' }}>
                      Basket is empty. Select routing parameters and append items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SUMMARY & SUBMIT */}
        <div className="col-span-12 space-y-4">
          {selectedStaffId && selectedItemsList.length > 0 && (
            <div className="p-4 bg-white border border-slate-300 rounded-xl text-left border-l-4 border-l-blue-600 shadow-sm">
              <div className="text-xs text-slate-700 uppercase leading-relaxed tracking-wide font-sans" style={{ fontWeight: 'normal' }}>
                Ledger Dispatch Ready: Note <span className="font-bold text-blue-600 font-mono">{allocDocNumber}</span> will process a{' '}
                <span className="font-bold text-black">
                  {transactionType === 'ISSUE_TO_STAFF' 
                    ? `STOCK HANDOVER FROM STORES TO [${currentSelectedStaff?.username.toUpperCase()}]` 
                    : `STOCK RETURN FROM [${currentSelectedStaff?.username.toUpperCase()}] BACK TO STORES`}
                </span>{' '}
                for <span className="font-bold text-black font-mono">{selectedItemsList.length}</span> line item(s).
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleFinalAllocationSubmit}
            disabled={loading || !selectedStaffId || selectedItemsList.length === 0}
            className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm flex items-center justify-center font-sans"
            style={{ fontWeight: 'normal' }}
          >
            {loading 
              ? 'PROCESSING TRANSACTION LEDGER INTERFACE...' 
              : transactionType === 'ISSUE_TO_STAFF' 
                ? 'AUTHORIZE & POST MAINTENANCE STOCK ALLOCATION' 
                : 'AUTHORIZE & POST MAINTENANCE STOCK RETURN NOTE'}
          </button>
        </div>

      </div>

      <div className="w-full max-w-5xl mt-6 flex items-center justify-center opacity-40 text-slate-500 text-[10px] uppercase tracking-widest" style={{ fontWeight: 'normal' }}>
        Authorized Bulk Storekeeper Material Routing Protocol (STN/RTN Framework) | central core gateway
      </div>
    </div>
  );
};

export default ToolAllocation;