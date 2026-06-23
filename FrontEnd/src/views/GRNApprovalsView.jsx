import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { Check, X, FileText, Calendar, Printer, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';

const GRNApprovalsView = ({ onRefresh }) => {
  const { user } = useApp(); // Auth Context එකෙන් ලොග් වූ යූසර් profile එක ලබා ගනී
  const [pendingGRNs, setPendingGRNs] = useState([]);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [rejectionReason, setRejectionComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // 1. APPROVER ට අදාළ PENDING GRN ලැයිස්තුව පමණක් FETCH කිරීම
  const loadPendingGRNRecords = async () => {
    // 💡 FIXED: Auth Context එකට අනුව 'user.uid' පවතීදැයි නිවැරදිව පරීක්ෂා කරයි
    if (!user || !user.uid) return; 
    
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/grn');
      const allGRNs = Array.isArray(res.data) ? res.data : [];
      
      const filteredForMe = allGRNs.filter(grn => {
        if (grn.status !== 'PENDING_APPROVAL') return false;
        
        // දැනට පවතින Approval මට්ටමට අදාළ Approver ව සෙවීම
        const currentTier = grn.approversChain?.find(appr => Number(appr.orderLevel) === Number(grn.currentApprovalLevel));
        
        // 💡 FIXED LOGIC: 'appr.user' (DB ID) එක ලොග් වී සිටින යූසර්ගේ 'user.uid' එක සමඟ 100%ක්ම නිවැරදිව සන්සන්දනය කරයි
        return currentTier && currentTier.user?.toString() === user.uid?.toString();
      });

      setPendingGRNs(filteredForMe);
    } catch (err) {
      console.error("Error loading pending queue:", err);
    }
  };

  // යූසර් profile එක වෙනස් වන හැමවිටම රන් වේ
  useEffect(() => {
    if (user && user.uid) {
      loadPendingGRNRecords();
    }
  }, [user]);

  // 💾 2. APPROVE ACTION PIPELINE
  const handleApproveGRN = async (grnId) => {
    if (!window.confirm("Are you sure you want to authorize and approve this GRN stock record?")) return;
    const t = toast.loading("Processing authorization transaction matrix...");
    
    try {
      const res = await axios.patch(`http://192.168.1.19:5000/api/grn/review/${grnId}`, {
        action: 'APPROVE',
        userId: user.uid,
        username: user.name
      });

      toast.success(res.data.message, { id: t });
      setSelectedGRN(null);
      loadPendingGRNRecords();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to post approval matrix step", { id: t });
    } finally {
      toast.dismiss(t);
    }
  };

  // ❌ 3. REJECT ACTION PIPELINE (DRAFT)
  const handleRejectGRN = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return toast.error("Please enter a valid reason for rejection");

    const t = toast.loading("Rejecting GRN sequence back to draft status...");
    try {
      const res = await axios.patch(`http://192.168.1.19:5000/api/grn/review/${selectedGRN._id}`, {
        action: 'REJECT',
        userId: user.uid,
        username: user.name,
        rejectionComment: rejectionReason.trim()
      });

      toast.success("GRN rejected back to storekeeper draft configuration", { id: t });
      setSelectedGRN(null);
      setRejectionComment('');
      setIsRejecting(false);
      loadPendingGRNRecords();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Rejection routing transaction failed", { id: t });
    } finally {
      toast.dismiss(t);
    }
  };

  return (
    <div className="p-8 antialiased text-[#000000] bg-[#EFEFEF] min-h-screen flex flex-col items-center justify-start w-full select-none" style={{ fontFamily: 'Segoe UI, Open Sans, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
      
      {/* PAGE HEADER */}
      <div className="w-full max-w-5xl mb-8 border-b border-slate-300 pb-4">
        <h1 className="text-xl text-[#000000] tracking-tight flex items-center gap-2" style={{ fontWeight: 'normal' }}>
          <Layers size={22} className="text-[#000000]" /> Workflow Authorization Tasks
        </h1>
        <p className="text-xs text-slate-500 tracking-widest mt-1 uppercase" style={{ fontWeight: 'normal' }}>Pending goods received notes (GRN) requiring your professional authorization</p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PENDING APPROVAL QUEUE LIST */}
        <div className="col-span-12 md:col-span-5 bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-2" style={{ fontWeight: 'normal' }}>Pending Action Queue ({pendingGRNs.length})</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {pendingGRNs.length > 0 ? (
              pendingGRNs.map((grn) => (
                <div 
                  key={grn._id}
                  onClick={() => { setSelectedGRN(grn); setIsRejecting(false); }}
                  className={`p-4 border rounded-xl text-left cursor-pointer transition-all uppercase ${
                    selectedGRN?._id === grn._id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs text-blue-600 font-mono">{grn.invoiceCode || grn.grnId}</div>
                  <div className="text-xs text-slate-800 font-normal mt-1 lowercase tracking-tight">source vendor: {grn.supplier || grn.vendor}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1 normal-case tracking-normal">
                    <Calendar size={11}/> Submitted Date: {grn.date ? grn.date.split('T')[0] : 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/40 rounded-xl" style={{ fontWeight: 'normal' }}>
                Excellent! Your pending approval action queue is empty.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PRINT RECEIPT PREVIEW & ACTIONS */}
        <div className="col-span-12 md:col-span-7 space-y-4">
          {selectedGRN ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* THE GRN AUDIT PRINT LAYOUT */}
              <div className="bg-white border border-slate-300 p-8 rounded-none shadow-sm text-left uppercase text-xs text-black" style={{ fontWeight: 'normal' }}>
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                  <h1 className="text-base text-black tracking-tight" style={{ fontWeight: 'normal' }}>GOODS RECEIVED NOTE (GRN) AUDIT</h1>
                  <div className="text-[10px] text-slate-400 font-mono lowercase tracking-normal mt-0.5">mms core workflow authorization routing engine</div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-4 font-mono text-[11px]">
                  <div className="space-y-1">
                    <p><span className="text-slate-400">GRN REF:</span> <span className="text-blue-600 font-bold">{selectedGRN.invoiceCode}</span></p>
                    <p><span className="text-slate-400">ENTRY DATE:</span> {selectedGRN.date ? selectedGRN.date.split('T')[0] : 'N/A'}</p>
                    <p><span className="text-slate-400">VEHICLE NO:</span> {selectedGRN.vehicleNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p><span className="text-slate-400">SUPPLIER:</span> {selectedGRN.supplier}</p>
                    <p><span className="text-slate-400">DELIVERED BY:</span> {selectedGRN.driverName}</p>
                  </div>
                </div>

                {/* SKU ITEMS TABLE */}
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px] mb-6">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-black uppercase" style={{ fontWeight: 'normal' }}>
                      <th className="p-2 border-r border-slate-200 text-center w-10" style={{ fontWeight: 'normal' }}>#</th>
                      <th className="p-2 border-r border-slate-200" style={{ fontWeight: 'normal' }}>Material / Code</th>
                      <th className="p-2 border-r border-slate-200 text-center w-16" style={{ fontWeight: 'normal' }}>Qty</th>
                      <th className="p-2 text-right w-24" style={{ fontWeight: 'normal' }}>Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800" style={{ fontWeight: 'normal' }}>
                    {selectedGRN.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="p-2 border-r border-slate-200">
                          <span className="font-mono text-blue-600">[{item.code || item.materialCode}]</span> {item.itemName || item.itemDescription}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{item.qty || item.quantity}</td>
                        <td className="p-2 text-right font-mono">{(Number(item.cost || item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTION TRIGGER BUTTONS PANEL */}
              {!isRejecting ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                    style={{ fontWeight: 'normal' }}
                  >
                    <X size={14} /> Send Back To Draft (Reject)
                  </button>
                  <button
                    onClick={() => handleApproveGRN(selectedGRN._id)}
                    className="py-3 bg-slate-900 text-white rounded-xl text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-1 shadow-md"
                    style={{ fontWeight: 'normal' }}
                  >
                    <Check size={14} /> Authorize & Post To Stock
                  </button>
                </div>
              ) : (
                /* REJECTION REASON INPUT AREA */
                <form onSubmit={handleRejectGRN} className="bg-white border border-slate-200 p-5 rounded-2xl text-left space-y-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="text-xs text-red-600 flex items-center gap-1.5 uppercase" style={{ fontWeight: 'normal' }}>
                    <AlertTriangle size={14}/> Rejection Parameters Input
                  </div>
                  <input 
                    type="text"
                    placeholder="Type reason for sending this GRN back to draft status..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black outline-none focus:border-red-400 focus:bg-white"
                    style={{ fontWeight: 'normal' }}
                    value={rejectionReason}
                    onChange={e => setRejectionComment(e.target.value)}
                    required
                  />
                  <div className="flex justify-end gap-2 text-[10px] uppercase tracking-wide">
                    <button type="button" onClick={() => setIsRejecting(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-red-600 text-white rounded-lg shadow-sm">Confirm Rejection</button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 p-24 text-center rounded-[24px] text-[10px] text-slate-400 uppercase tracking-wider" style={{ fontWeight: 'normal' }}>
              Select a pending GRN reference sequence from the queue dashboard to load auditing matrix templates
            </div>
          )}
        </div>

      </div>

      {/* FOOTER NOTICE METRICS */}
      <div className="w-full max-w-5xl mt-8 flex items-center gap-1.5 px-3 opacity-50 text-slate-500 text-[10px] uppercase tracking-wide" style={{ fontWeight: 'normal' }}>
        <ShieldAlert size={12} /> Secure Hierarchy Approval Execution Pipeline Hub | MMS CORE
      </div>
    </div>
  );
};

export default GRNApprovalsView;