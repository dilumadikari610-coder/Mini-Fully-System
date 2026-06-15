import React, { useState } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ToolAllocation = ({ inventoryItems = [], staffList = [], onRefresh }) => {
  const [selection, setSelection] = useState({ 
    grnObjectId: '', 
    itemObjectId: '', 
    staffName: '' 
  });
  const [loading, setLoading] = useState(false);

  // ✅ NEW REGEX FILTER: Handles the extra spaces shown in your DB image
  const maintenanceStaff = Array.isArray(staffList) 
    ? staffList.filter(user => {
        const type = user.userType || "";
        const pattern = /maintenance\s+staff/i; 
        return pattern.test(type.trim());
      })
    : [];

  const handleAllocate = async () => {
    if (!selection.itemObjectId || !selection.staffName) {
      return toast.error("Please select both an item and a staff member");
    }

    setLoading(true);
    const t = toast.loading('Processing allocation...');

    try {
      await axios.patch('http://localhost:5000/api/grn/allocate', {
        grnObjectId: selection.grnObjectId,
        itemObjectId: selection.itemObjectId,
        staffName: selection.staffName
      });

      toast.success(`Allocated to ${selection.staffName}`, { id: t });
      setSelection({ grnObjectId: '', itemObjectId: '', staffName: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Allocation failed", { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 font-sans animate-in slide-in-from-right duration-500 selection:bg-[#A47148]/10">
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm max-w-2xl">
        
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-[#A47148]/10 rounded-2xl text-[#A47148]">
            <UserCheck size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight uppercase">Staff Tool Allocation</h2>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Assign Inventory to Maintenance Members</p>
          </div>
        </div>

        {/* Sync Warning */}
        {maintenanceStaff.length === 0 && staffList.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase">Database Value Mismatch</p>
              <p className="text-[10px] text-amber-600 mt-1">
                Found {staffList.length} users. Your DB value is "{staffList[0].userType}". 
                The system is now using a flexible search to find it.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Select Tool / Item</label>
            <select 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-2xl text-sm font-medium outline-none focus:ring-1 focus:ring-[#A47148] focus:border-[#A47148] transition-all"
              value={`${selection.grnObjectId}|${selection.itemObjectId}`}
              onChange={(e) => {
                const parts = e.target.value.split('|');
                if(parts.length === 2) {
                  setSelection({...selection, grnObjectId: parts[0], itemObjectId: parts[1]});
                }
              }}
            >
              <option value="|">Choose item from available stock</option>
              {inventoryItems?.map((grn) => (
                grn.items?.filter(i => i.status === 'In Stock').map(item => (
                  <option key={item._id} value={`${grn._id}|${item._id}`}>
                    {item.itemName} ({item.quantity}) - {grn.grnId}
                  </option>
                ))
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Assign To Staff</label>
            <select 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-2xl text-sm font-medium outline-none focus:ring-1 focus:ring-[#A47148] focus:border-[#A47148] transition-all"
              value={selection.staffName}
              onChange={(e) => setSelection({...selection, staffName: e.target.value})}
            >
              <option value="">Select Maintenance Member</option>
              {maintenanceStaff.map(staff => (
                <option key={staff._id} value={staff.username}>
                  {staff.username}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleAllocate}
            disabled={loading}
            className="w-full py-4 bg-[#A47148] text-white rounded-2xl text-[10px] font-semibold uppercase tracking-[0.25em] shadow-lg shadow-[#A47148]/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Processing..." : "Confirm & Assign Tool"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolAllocation;