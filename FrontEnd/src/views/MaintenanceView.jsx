import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { X, UserCheck, ShieldCheck, Hammer, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

// --- INTERNAL COMPONENT: JOB DETAILS & ASSIGN MODAL ---
const JobDetailsModal = ({ isOpen, onClose, job, staffList, onAssign, onStatusUpdate, userRole }) => {
  if (!isOpen || !job) return null;

  // ✅ FIX FOR image_a205f6.png: Safe Date Parsing
  const getSafeDate = (dateVal) => {
    try {
      const d = new Date(dateVal);
      // Check if d is a valid date object
      if (isNaN(d.getTime())) return "DATE NOT SET";
      return d.toISOString().split('T')[0];
    } catch (e) {
      return "INVALID DATE";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-black/5">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black text-white rounded-2xl">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black uppercase tracking-tight">Job Details</h3>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-1">{job.tid}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-black" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-3xl border border-black/5 col-span-2">
              <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block mb-1">Description</label>
              <p className="text-sm font-bold text-black uppercase">{job.title}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-3xl border border-black/5">
              <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block mb-1">Created Date</label>
              {/* ✅ FIXED LINE: Using the safe date helper */}
              <p className="text-xs font-bold text-black">{getSafeDate(job.date)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-3xl border border-black/5">
              <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block mb-1">Current Status</label>
              <p className="text-xs font-bold text-black uppercase">{job.status === 'Assign Pending' ? 'DRAFT' : job.status}</p>
            </div>
          </div>

          {/* Logic: Assignment (Admin Only) */}
          {userRole === 'admin' && job.status === 'Assign Pending' && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-2 flex items-center gap-2">
                <UserCheck size={14} /> Assign Maintenance Member
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {staffList.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => onAssign(job._id, `${s._id}|${s.username}`)}
                    className="flex items-center justify-between px-6 py-4 bg-white border border-black/10 rounded-2xl hover:bg-black hover:text-white transition-all group text-left"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">{s.username}</span>
                    <ShieldCheck size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Logic: Status Progression */}
          <div className="mt-4">
            {job.status === 'Assigned' && (
              <button 
                onClick={() => onStatusUpdate(job._id, 'On Approval')}
                className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
              >
                Submit for Approval
              </button>
            )}
            {userRole === 'admin' && job.status === 'On Approval' && (
              <button 
                onClick={() => onStatusUpdate(job._id, 'Completed')}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Approve & Confirm
              </button>
            )}
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-4 text-center border-t border-black/5">
          <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest italic">MMS Task Management Portal</p>
        </div>
      </div>
    </div>
  );
};

const MaintenanceView = ({ requests = [], onRefresh }) => {
  const { user } = useApp();
  const [staffList, setStaffList] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      axios.get('http://localhost:5000/api/users/staff')
        .then(res => setStaffList(res.data))
        .catch(err => console.error("Error loading staff", err));
    }
  }, [user]);

  const rowStyles = {
    'Assign Pending': { bg: '#F8D7DA', text: '#721C24' },
    'Assigned':       { bg: '#CCE5FF', text: '#004085' },
    'On Approval':    { bg: '#D4EDDA', text: '#155724' },
    'Completed':      { bg: '#C3E6CB', text: '#155724' },
    'default':        { bg: '#FFFFFF', text: '#334155' }
  };

  const handleAssign = async (id, staff) => {
    try {
      const [staffId, staffName] = staff.split('|');
      await axios.patch(`http://localhost:5000/api/requests/assign/${id}`, { staffId, staffName });
      toast.success("Job Assigned Successfully");
      setSelectedJob(null);
      if (onRefresh) onRefresh();
    } catch (err) { toast.error("Assignment failed"); }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/requests/status/${id}`, { status: newStatus });
      toast.success(`Status updated: ${newStatus}`);
      setSelectedJob(null);
      if (onRefresh) onRefresh();
    } catch (err) { toast.error("Update failed"); }
  };

  return (
    <div className="p-4 animate-in fade-in duration-500 font-sans text-black">
      <div className="mb-6 flex justify-between items-end px-1">
        <div>
          <h1 className="text-xl font-bold text-black uppercase tracking-tight">Maintenance Jobs</h1>
          <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-0.5">Operational Task Tracking</p>
        </div>
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Total Records: {requests.length}</p>
      </div>

      <div className="bg-white border border-slate-300 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-black border-r border-slate-200">ID</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-black border-r border-slate-200">Description</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-black border-r border-slate-200">Assigned To</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-black border-r border-slate-200">Date</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-black border-r border-slate-200">Status</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-black text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {requests.map((req) => {
              const style = rowStyles[req.status] || rowStyles.default;
              return (
                <tr 
                  key={req._id} 
                  style={{ backgroundColor: style.bg, color: style.text }}
                  className="border-b border-slate-300 transition-all hover:brightness-95 cursor-pointer"
                  onClick={() => setSelectedJob(req)}
                >
                  <td className="px-4 py-2.5 font-bold border-r border-black/5">{req.tid}</td>
                  <td className="px-4 py-2.5 font-bold uppercase border-r border-black/5">{req.title}</td>
                  <td className="px-4 py-2.5 font-bold uppercase border-r border-black/5">{req.assignedTo || '---'}</td>
                  <td className="px-4 py-2.5 font-bold border-r border-black/5">
                    {req.date ? new Date(req.date).toISOString().split('T')[0] : '2026-05-12'}
                  </td>
                  <td className="px-4 py-2.5 font-bold uppercase border-r border-black/5">{req.status === 'Assign Pending' ? 'DRAFT' : req.status}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-[9px] uppercase tracking-tighter opacity-40">View Details</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <JobDetailsModal 
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
        staffList={staffList}
        onAssign={handleAssign}
        onStatusUpdate={handleStatusUpdate}
        userRole={user.role}
      />
    </div>
  );
};

export default MaintenanceView;