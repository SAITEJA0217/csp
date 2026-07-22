import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Clock, Lock, CheckCircle, Search, Download, 
  Trash2, QrCode, LogOut, Activity, X, ChevronLeft 
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

type BookingRecord = {
  Timestamp: string;
  'Booking ID': string;
  'Team Name': string;
  'Leader Name': string;
  'Roll Number': string;
  Section: string;
  Phone: string;
  Email: string;
  Startup: string;
  Date: string;
  Slot: string;
  Status: string;
  CheckInTime?: string;
};

const COLORS = ['#22c55e', '#ef4444', '#eab308'];

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [data, setData] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}>({msg: '', type: 'success'});

  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'organizer123') {
      setIsAuthenticated(true);
    } else {
      showToast('Incorrect password', 'error');
    }
  };

  const showToast = useCallback((msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      if (!url) return;
      const res = await fetch(`${url}?action=getAll`);
      const result = await res.json();
      if (result.success && result.records) {
        const normalized = result.records.map((r: any) => {
          let d = r.Date || '';
          if (d.includes('Jul 24') || d.includes('24 July')) d = '24 July 2026';
          else if (d.includes('Jul 25') || d.includes('25 July')) d = '25 July 2026';
          return { ...r, Date: d };
        });
        setData(normalized);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch data. Retrying...', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  const handleAction = async (action: 'cancel' | 'checkin', bookingId: string) => {
    if (action === 'cancel') {
      if (!window.confirm('Are you sure you want to CANCEL this booking? The slot will immediately become available again.')) return;
    }
    
    try {
      const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action, bookingId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        fetchData(); // refresh immediately
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_export_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(r => 
      (r['Team Name']?.toLowerCase() || '').includes(q) ||
      (r['Booking ID']?.toLowerCase() || '').includes(q) ||
      (r['Leader Name']?.toLowerCase() || '').includes(q) ||
      (r['Roll Number']?.toLowerCase() || '').includes(q) ||
      (r['Email']?.toLowerCase() || '').includes(q)
    ).reverse(); // latest first
  }, [data, search]);

  const stats = useMemo(() => {
    let total = 36;
    let day1 = 0, day2 = 0;
    let checkedIn = 0;
    
    data.forEach(r => {
      if (r.Status === 'Confirmed') {
        if (r.Date === '24 July 2026') day1++;
        if (r.Date === '25 July 2026') day2++;
      }
      if (r.CheckInTime) checkedIn++;
    });

    const booked = day1 + day2;
    return {
      booked, available: total - booked, day1, day2, checkedIn, total
    };
  }, [data]);

  const chartData = [
    { name: '24 July Booked', value: stats.day1 },
    { name: '25 July Booked', value: stats.day2 },
    { name: 'Available', value: stats.available }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
        
        <AnimatePresence>
          {toast.msg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 bg-red-600 text-white px-6 py-3 rounded-full flex items-center z-50">
              <Lock className="w-4 h-4 mr-2" /> {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-10 rounded-3xl w-full max-w-md z-10 text-center relative">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-slate-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Organizer Mode</h2>
          <p className="text-slate-400 mb-8">Enter the master password to access the dashboard.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-white outline-none"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors">
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col">
      <AnimatePresence>
        {toast.msg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4 z-10 relative">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Activity className="w-8 h-8 text-blue-600 mr-3 animate-pulse" /> 
            Live Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1 flex items-center"><Clock className="w-4 h-4 mr-1"/> Auto-refreshing every 10s</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
          <button onClick={() => {setIsAuthenticated(false); setPassword('');}} className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 z-10 relative">
        <div className="glass p-6 rounded-2xl col-span-1 lg:col-span-3">
           <h3 className="text-xl font-bold mb-4 dark:text-white">Live Overview</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
               <p className="text-slate-500 text-sm mb-1 font-medium">Total Booked</p>
               <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.booked}</p>
             </div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
               <p className="text-slate-500 text-sm mb-1 font-medium">Available Slots</p>
               <p className="text-3xl font-black text-green-600 dark:text-green-400">{stats.available}</p>
             </div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
               <p className="text-slate-500 text-sm mb-1 font-medium">Total Teams Reg.</p>
               <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{data.length}</p>
             </div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
               <p className="text-slate-500 text-sm mb-1 font-medium">Checked In</p>
               <p className="text-3xl font-black text-orange-600 dark:text-orange-400">{stats.checkedIn}</p>
             </div>
           </div>

           <div className="mt-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-sm font-semibold dark:text-white mb-2 flex justify-between"><span>24 July Occupancy</span><span>{stats.day1}/18</span></p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(stats.day1 / 18) * 100}%` }}></div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold dark:text-white mb-2 flex justify-between"><span>25 July Occupancy</span><span>{stats.day2}/18</span></p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(stats.day2 / 18) * 100}%` }}></div>
                </div>
              </div>
           </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-2 dark:text-white">Capacity</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between w-full text-xs font-medium dark:text-slate-300">
             <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1"/>24 Jul</div>
             <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"/>25 Jul</div>
             <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"/>Empty</div>
          </div>
        </div>
      </div>

      <div className="glass flex-1 rounded-2xl flex flex-col overflow-hidden z-10 relative">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold dark:text-white flex items-center">
            Booking Database
            {isLoading && <span className="ml-3 text-sm text-blue-500 font-normal animate-pulse">Syncing...</span>}
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Booking ID</th>
                <th className="px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold">Schedule</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  key={i} 
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                    {row['Booking ID']}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold dark:text-white">{row['Team Name']}</div>
                    <div className="text-xs text-slate-500">{row['Leader Name']} • {row['Roll Number']}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="dark:text-slate-200">{row.Date}</div>
                    <div className="text-xs text-slate-500">{row.Slot}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      row.Status === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      row.Status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {row.Status}
                    </span>
                    {row.CheckInTime && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Checked In
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {row.Status === 'Confirmed' && !row.CheckInTime && (
                      <button 
                        onClick={() => handleAction('checkin', row['Booking ID'])}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        title="Manual Check-In"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {row.Status === 'Confirmed' && (
                      <button 
                        onClick={() => handleAction('cancel', row['Booking ID'])}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                        title="Cancel Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filteredData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No bookings found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
