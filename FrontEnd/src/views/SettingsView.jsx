import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Settings as SettingsIcon, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

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

// --- MAIN VIEW COMPONENT ---
const SettingsView = ({ onRefresh }) => {
  const [departments, setDepartments] = useState([]);
  const [newDep, setNewDep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [modalData, setModalData] = useState({ isOpen: false, id: null, name: '' });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error("Could not load departments");
    }
  };

  const handleAdd = async (e) => {
    if (e) e.preventDefault();
    const trimmedDep = newDep.trim().toUpperCase();
    if (!trimmedDep) return toast.error("Enter a name");

    setIsSubmitting(true);
    try {
      await axios.post('http://192.168.1.19:5000/api/departments', { name: trimmedDep });
      setNewDep('');
      toast.success("Department Added");
      fetchDepartments();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Error adding department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (id, name) => {
    setModalData({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    try {
      await axios.delete(`http://192.168.1.19:5000/api/departments/${modalData.id}`);
      toast.success("Department Removed");
      fetchDepartments();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-8 font-sans animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-sm max-w-2xl border border-slate-100">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-[#A47148]/10 rounded-2xl text-[#A47148]"><SettingsIcon size={24}/></div>
          <div>
            <h2 className="text-xl font-semibold uppercase tracking-tight text-slate-800">System Settings</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Configuration</p>
          </div>
        </div>

        {/* INPUT */}
        <form onSubmit={handleAdd} className="flex gap-3 mb-10">
          <input 
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#A47148]/20 text-sm font-medium uppercase"
            placeholder="e.g. Engineering"
            value={newDep}
            onChange={(e) => setNewDep(e.target.value)}
          />
          <button type="submit" className="bg-slate-900 text-white px-8 rounded-2xl flex items-center justify-center min-w-[64px]">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={24}/>}
          </button>
        </form>

        {/* LIST */}
        <div className="grid grid-cols-1 gap-3">
          {departments.map(dep => (
            <div key={dep._id} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
              <span className="text-sm font-bold text-slate-700 uppercase">{dep.name}</span>
              <button 
                onClick={() => openDeleteModal(dep._id, dep.name)} 
                className="text-slate-300 hover:text-red-500 p-2 transition-colors"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODERN CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        onConfirm={executeDelete}
        title="Delete Department"
        message={`Confirm permanent deletion of ${modalData.name}? All linked users will lose their department reference.`}
      />
    </div>
  );
};

export default SettingsView;