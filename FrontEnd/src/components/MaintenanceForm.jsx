import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRequest } from '../api/api';
import { useApp } from '../context/AppContext';

const MaintenanceForm = ({ isOpen, onClose, onRefresh }) => {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  
  // ✅ IMPORTANT: Default values must match the 'enum' in Request.js exactly
  const [formData, setFormData] = useState({
    title: '',
    type: 'Repair',
    priority: 'Medium',
    description: ''
  });

  const systemColor = "#A47148";

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const t = toast.loading('Syncing with database...');
    
    try {
      // ✅ VALIDATION: Ensure user is logged in to provide required fields
      if (!user) {
        throw new Error("You must be logged in to submit a request.");
      }

      const payload = {
        ...formData,
        requestedBy: user.name || user.username || "System User",
        userId: user.uid || user.id || "N/A",
        status: 'Assign Pending' // Force initial state
      };

      await createRequest(payload);
      
      toast.success('Request Submitted Successfully!', {
        id: t,
        style: {
          borderRadius: '16px',
          background: '#FFFFFF',
          color: '#334155',
          fontSize: '13px',
          fontWeight: 'bold',
          border: '1px solid #f1f5f9'
        },
        iconTheme: {
          primary: systemColor,
          secondary: '#fff',
        },
      });

      // Clear form after success
      setFormData({ title: '', type: 'Repair', priority: 'Medium', description: '' });
      onRefresh(); 
      onClose();   
    } catch (err) {
      // ✅ LOGGING: Check the console to see exactly why the backend said "400"
      const serverMsg = err.response?.data?.error || err.message;
      console.error("Submission Error Details:", serverMsg);
      
      toast.error(`Failed: ${serverMsg}`, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">New Maintenance Request</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ISSUE TITLE */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Issue Title</label>
            <input 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#A47148] transition-all"
              placeholder="e.g. AC Leaking in Room 204"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* JOB TYPE - MATCHES Request.js enum */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Job Type</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none cursor-pointer focus:border-[#A47148] transition-all"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Repair">Repair</option>
                <option value="Preventive">Preventive</option>
                <option value="Installation">Installation</option>
                <option value="Emergency">Emergency</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Furniture">Furniture</option>
                <option value="Network">Network</option>
              </select>
            </div>

            {/* PRIORITY - MATCHES Request.js enum */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Priority</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none cursor-pointer focus:border-[#A47148] transition-all"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Detailed Description</label>
            <textarea 
              rows="4"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#A47148] transition-all"
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
              style={{ backgroundColor: systemColor }}
            >
              {loading ? "Saving..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;