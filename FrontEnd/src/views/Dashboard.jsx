import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench 
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.01] duration-300">
    <div>
      {/* Changed font-black to font-semibold for a cleaner look */}
      <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1 font-sans">
        {title}
      </p>
      <h3 className="text-3xl font-medium text-slate-800 font-sans tracking-tight">
        {value}
      </h3>
    </div>
    <div className="p-4 rounded-2xl" style={{ backgroundColor: `${color}10`, color: color }}>
      <Icon size={24} />
    </div>
  </div>
);

const Dashboard = ({ requests = [] }) => {
  const systemColor = "#A47148";

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'Assign Pending').length,
    active: requests.filter(r => r.status === 'Assigned').length,
    completed: requests.filter(r => r.status === 'Completed').length,
  }), [requests]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 font-sans">
      
      <header className="flex flex-col gap-1">
        {/* Changed from font-black to font-semibold */}
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
          System Overview
        </h1>
        <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
          Real-time maintenance analytics and job tracking.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Requests" value={stats.total} icon={BarChart3} color="#3b82f6" />
        <StatCard title="Assign Pending" value={stats.pending} icon={AlertCircle} color="#f59e0b" />
        <StatCard title="Assigned Jobs" value={stats.active} icon={Clock} color={systemColor} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 uppercase text-[11px] tracking-widest">
                <TrendingUp size={18} style={{ color: systemColor }} />
                Workload Distribution
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">
                Average daily maintenance tasks
              </p>
            </div>
            <select className="text-[10px] font-semibold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none text-slate-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
            </select>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const heights = [45, 75, 55, 95, 70, 35, 25];
              const height = heights[i];
              const isToday = i === 4;

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-4 group">
                  <div 
                    className="w-full transition-all duration-700 rounded-xl relative cursor-pointer"
                    style={{ 
                      height: `${height}%`, 
                      backgroundColor: isToday ? systemColor : `${systemColor}15` 
                    }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-medium uppercase py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Math.floor(height/3)} Jobs
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase ${isToday ? 'text-slate-800' : 'text-slate-300'}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-8 uppercase text-[11px] tracking-widest">
            Recent Activity
          </h3>
          <div className="space-y-6 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" />

            {requests.length > 0 ? (
              requests.slice(0, 5).map((req, i) => (
                <div key={req._id || i} className="flex gap-4 items-start relative z-10">
                  <div 
                    className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0" 
                    style={{ backgroundColor: systemColor }}
                  />
                  <div className="flex flex-col">
                    <p className="text-xs font-medium text-slate-700 uppercase tracking-tight">
                      {req.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">
                          {req.tid}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[9px] font-semibold uppercase" style={{ color: systemColor }}>
                          {req.status}
                        </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Wrench size={32} className="text-slate-100 mb-4" />
                <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-widest">
                  No Active Jobs
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;