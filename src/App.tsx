import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Users, ArrowRight, CheckCircle, AlertCircle, Phone, Mail, Building, User, ChevronLeft, Lock, Moon, Sun, Download, Share2, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Confetti from 'react-confetti';
import { QRCodeSVG } from 'qrcode.react';
import AdminDashboard from './AdminDashboard';

// --- Types ---
type BookingData = {
  teamName: string;
  leaderName: string;
  rollNumber: string;
  section: string;
  phone: string;
  email: string;
  startup: string;
  date?: string;
  slot?: string;
};

// --- Toast Component ---
const Toast = ({ message, type }: { message: string, type: 'success' | 'error' | 'network' }) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full flex items-center shadow-2xl ${
      type === 'success' ? 'bg-green-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' :
      'bg-orange-500 text-white'
    }`}
    role="alert"
  >
    {type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
    {type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
    {type === 'network' && <AlertCircle className="w-5 h-5 mr-2" />}
    <span className="font-semibold">{message}</span>
  </motion.div>
);

// --- Theme Toggle ---
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);
  const toggle = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };
  return (
    <button onClick={toggle} className="fixed top-6 right-6 p-3 rounded-full glass hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors z-50 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500">
      {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
    </button>
  );
};

// --- Banner ---
const Banner = () => (
  <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 overflow-hidden sticky top-0 z-40">
    <div className="whitespace-nowrap animate-marquee flex items-center font-medium text-sm">
      <span className="mx-4">🌟 Welcome to the Case Presentation Contest 2026! 🌟</span>
      <span className="mx-4">• Venue: SOE-7, Malla Reddy University •</span>
      <span className="mx-4">⚠️ Reporting Time: strictly 15 minutes before your scheduled slot. ⚠️</span>
      <span className="mx-4">🌟 Spots are filling up fast! 🌟</span>
    </div>
  </div>
);

// --- Slot Button Component ---
const SlotButton = React.memo(({ 
  slot, 
  index, 
  isSelected, 
  isBooked, 
  isRecentlyBooked,
  onSelect 
}: { 
  slot: string, 
  index: number, 
  isSelected: boolean, 
  isBooked: boolean, 
  isRecentlyBooked: boolean,
  onSelect: (slotLabel: string, isBooked: boolean) => void 
}) => {
  const slotLabel = `Slot ${index + 1} (${slot})`;

  return (
    <motion.button
      layout
      key={slot}
      initial={false}
      animate={isRecentlyBooked ? { scale: [1, 1.15, 1], boxShadow: ["0px 0px 0px rgba(239, 68, 68, 0)", "0px 0px 20px rgba(239, 68, 68, 0.8)", "0px 0px 0px rgba(239, 68, 68, 0)"] } : {}}
      transition={{ duration: 0.7 }}
      whileHover={!isBooked ? { scale: 1.05 } : {}}
      whileTap={!isBooked ? { scale: 0.95 } : {}}
      onClick={() => onSelect(slotLabel, isBooked)}
      className={`p-4 rounded-2xl border-2 font-semibold flex flex-col items-center justify-center text-center transition-all duration-300 shadow-sm relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 ${
        isBooked 
          ? 'border-red-500 bg-red-500 text-white cursor-not-allowed opacity-50 bg-stripes'
          : isSelected 
            ? 'border-blue-600 bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
            : 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] cursor-pointer'
      }`}
      aria-label={`${slotLabel}, ${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}`}
      aria-disabled={isBooked}
    >
      <div className="flex items-center justify-center mb-1">
        {isBooked ? <Lock className="w-5 h-5" /> : (isSelected ? <CheckCircle className="w-5 h-5 animate-bounce" /> : <CheckCircle className="w-5 h-5" />)}
      </div>
      <span className="text-sm z-10">Slot {index + 1}</span>
      <span className="text-xs font-normal opacity-80 mt-1 z-10">{isBooked ? 'Booked' : 'Available'}</span>
    </motion.button>
  );
});

// --- Date Card Component ---
const DateCard = React.memo(({
  date,
  bookedCount,
  onSelect
}: {
  date: string,
  bookedCount: number,
  onSelect: (date: string) => void
}) => {
  const isFull = bookedCount >= 18;
  const percentage = (bookedCount / 18) * 100;
  
  let barColor = 'bg-green-500';
  if (bookedCount >= 6) barColor = 'bg-yellow-500';
  if (bookedCount >= 12) barColor = 'bg-orange-500';
  if (bookedCount >= 15) barColor = 'bg-red-500';

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isFull) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFull]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass p-6 rounded-3xl flex flex-col items-center relative overflow-hidden"
      >
        {isFull ? (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-red-500/50">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold tracking-widest text-xl">🔴 FULL</span>
          </div>
        ) : null}

        <Calendar className="w-12 h-12 text-blue-500 mb-4" />
        <h3 className="text-2xl font-bold dark:text-white mb-2">{date}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">{18 - bookedCount} / 18 Slots Available</p>
        
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
          <div className={`h-full transition-all duration-1000 ${barColor}`} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold w-full text-right">{bookedCount} / 18 Booked</div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(date)}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-semibold shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-blue-500"
        >
          Choose {date.split(' ')[0]} July
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
});

// --- Landing Page ---
const LandingPage = () => {
  const navigate = useNavigate();

  // Registration Timer Logic
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isClosed, setIsClosed] = useState(false);
  useEffect(() => {
    const deadline = new Date("2026-07-23T23:59:59").getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;
      if (distance < 0) {
        clearInterval(timer);
        setIsClosed(true);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <ThemeToggle />
      <button onClick={() => navigate('/admin')} className="fixed bottom-6 right-6 flex items-center px-4 py-2 bg-slate-800 text-white rounded-full text-xs font-bold shadow-lg hover:bg-slate-700 transition-colors z-50">
        <Activity className="w-3 h-3 mr-1" /> Organizer
      </button>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center z-10 max-w-3xl mt-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Case Presentation Contest
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8">
          Book your presentation slot for the upcoming contest. Spots are limited.
        </p>

        {!isClosed ? (
          <div className="flex justify-center items-center gap-4 mb-12">
            <div className="flex flex-col items-center"><div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-2xl font-bold dark:text-white">{timeLeft.days}</div><span className="text-xs text-slate-500 mt-2 uppercase font-bold">Days</span></div>
            <span className="text-2xl font-bold dark:text-white pb-6">:</span>
            <div className="flex flex-col items-center"><div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-2xl font-bold dark:text-white">{timeLeft.hours}</div><span className="text-xs text-slate-500 mt-2 uppercase font-bold">Hours</span></div>
            <span className="text-2xl font-bold dark:text-white pb-6">:</span>
            <div className="flex flex-col items-center"><div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-2xl font-bold dark:text-white">{timeLeft.minutes}</div><span className="text-xs text-slate-500 mt-2 uppercase font-bold">Mins</span></div>
          </div>
        ) : (
          <div className="inline-block bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-6 py-3 rounded-full font-bold mb-12 border border-red-200 dark:border-red-800">
            Registration Closed
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10 mb-12 w-full max-w-4xl">
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center"><Calendar className="w-10 h-10 text-blue-500 mb-4" /><h3 className="font-semibold text-lg dark:text-white">Date</h3><p className="text-slate-600 dark:text-slate-400">24 & 25 July 2026</p></div>
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center"><Users className="w-10 h-10 text-purple-500 mb-4" /><h3 className="font-semibold text-lg dark:text-white">Venue</h3><p className="text-slate-600 dark:text-slate-400">SOE-7, Malla Reddy University</p></div>
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center"><Clock className="w-10 h-10 text-indigo-500 mb-4" /><h3 className="font-semibold text-lg dark:text-white">Timing</h3><p className="text-slate-600 dark:text-slate-400">9:10 AM onwards</p></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="glass p-8 rounded-3xl z-10 max-w-xl w-full mb-12">
        <h3 className="text-2xl font-bold mb-6 dark:text-white text-center">Rules</h3>
        <ul className="space-y-4">
          {['First Come First Serve', 'One booking per team', 'Booked slots cannot be selected', 'Reach venue 15 minutes early', 'No edits after booking'].map((rule, idx) => (
            <li key={idx} className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0" /><span>{rule}</span></li>
          ))}
        </ul>
      </motion.div>

      <motion.button 
        whileHover={{ scale: isClosed ? 1 : 1.05 }} 
        whileTap={{ scale: isClosed ? 1 : 0.95 }} 
        onClick={() => !isClosed && navigate('/booking')} 
        disabled={isClosed}
        className={`z-10 px-8 py-4 rounded-full font-semibold text-lg flex items-center shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 ${isClosed ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-purple-500/30'}`}
      >
        {isClosed ? 'Registration Closed' : <>Book Slot <ArrowRight className="ml-2 w-5 h-5" /></>}
      </motion.button>
    </div>
  );
};

// --- Booking Flow ---
const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({ "24 July 2026": [], "25 July 2026": [] });
  const [recentlyBooked, setRecentlyBooked] = useState<string[]>([]);
  
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'network'} | null>(null);

  const navigate = useNavigate();
  const previousBookedRef = useRef<Record<string, string[]>>({ "24 July 2026": [], "25 July 2026": [] });

  const showToast = useCallback((message: string, type: 'success'|'error'|'network') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) return;
      const res = await fetch(scriptUrl);
      const data = await res.json();
      if (data.success && data.bookedSlots) {
        
        // Normalize keys because Google Sheets sometimes returns Date objects as strings like "Fri Jul 24..."
        const normalizedBookedSlots: Record<string, string[]> = {
          "24 July 2026": [],
          "25 July 2026": []
        };
        
        Object.keys(data.bookedSlots).forEach(key => {
          let targetDate = '';
          if (key.includes("Jul 24") || key.includes("24 July")) targetDate = "24 July 2026";
          else if (key.includes("Jul 25") || key.includes("25 July")) targetDate = "25 July 2026";
          
          if (targetDate) {
             normalizedBookedSlots[targetDate].push(...data.bookedSlots[key]);
          }
        });

        // Detect newly booked slots for animation
        const newBooked: string[] = [];
        Object.keys(normalizedBookedSlots).forEach(date => {
          const currentArr = normalizedBookedSlots[date];
          const prevArr = previousBookedRef.current[date] || [];
          currentArr.forEach((s: string) => {
            if (!prevArr.includes(s)) newBooked.push(s);
          });
        });

        if (newBooked.length > 0) {
          setRecentlyBooked(newBooked);
          setTimeout(() => setRecentlyBooked([]), 1500); // clear animation state after 1.5s
        }
        
        previousBookedRef.current = normalizedBookedSlots;
        setBookedSlots(normalizedBookedSlots);
      }
    } catch (err) {
      showToast('Unable to reach server', 'network');
    }
  }, [showToast]);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 10000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = 36;
    const booked = (bookedSlots["24 July 2026"]?.length || 0) + (bookedSlots["25 July 2026"]?.length || 0);
    const available = total - booked;
    return { total, booked, available };
  }, [bookedSlots]);

  const { register, handleSubmit } = useForm<BookingData>();

  const onSubmitDetails = useCallback((data: BookingData) => {
    setBookingData(prev => ({ ...prev, ...data }));
    setStep(2);
  }, []);

  const selectDate = useCallback((date: string) => {
    setBookingData(prev => ({ ...prev, date }));
    setStep(3);
  }, []);

  const handleSelectSlot = useCallback((slotLabel: string, isBooked: boolean) => {
    if (isBooked) {
      showToast('❌ Slot Already Booked', 'error');
    } else {
      setBookingData(prev => ({ ...prev, slot: slotLabel }));
    }
  }, [showToast]);

  const submitBooking = async () => {
    if (!bookingData.slot || !bookingData.date) return;
    
    setIsSubmitting(true);
    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'YOUR_GOOGLE_SCRIPT_URL';
      
      if (scriptUrl !== 'YOUR_GOOGLE_SCRIPT_URL') {
        // --- Final Verification (Pre-submit check) ---
        const verifyRes = await fetch(scriptUrl);
        const verifyData = await verifyRes.json();
        
        if (verifyData.success && verifyData.bookedSlots) {
          const normalizedBookedSlots: Record<string, string[]> = {
            "24 July 2026": [],
            "25 July 2026": []
          };
          Object.keys(verifyData.bookedSlots).forEach(key => {
            let targetDate = '';
            if (key.includes("Jul 24") || key.includes("24 July")) targetDate = "24 July 2026";
            else if (key.includes("Jul 25") || key.includes("25 July")) targetDate = "25 July 2026";
            if (targetDate) normalizedBookedSlots[targetDate].push(...verifyData.bookedSlots[key]);
          });

          const latestBooked = normalizedBookedSlots[bookingData.date] || [];
          if (latestBooked.some(s => s === bookingData.slot || s.startsWith(bookingData.slot + ' '))) {
            // Race condition caught!
            setBookedSlots(normalizedBookedSlots);
            previousBookedRef.current = normalizedBookedSlots;
            setBookingData(prev => ({ ...prev, slot: undefined })); // clear selected
            showToast('❌ Sorry! This presentation slot was just booked by another team. Please select another slot.', 'error');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Proceed with POST
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const result = await response.json();
      
      if (result.success) {
        setBookingId(result.bookingId);
        showToast('✅ Slot Reserved Successfully', 'success');
        fetchSlots(); // Immediately refresh
        setStep(4);
      } else {
        showToast(`❌ ${result.message || 'Failed to submit booking.'}`, 'error');
      }
    } catch (err) {
      showToast('⚠ Unable to reach server', 'network');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = useCallback(() => {
    if (step === 4) return;
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  }, [step, navigate]);

  const isCurrentSlotBooked = useMemo(() => {
    return bookingData.slot && bookingData.date && bookedSlots[bookingData.date]?.includes(bookingData.slot);
  }, [bookingData, bookedSlots]);

  const buttonText = useMemo(() => {
    if (isSubmitting) return 'Submitting...';
    if (!bookingData.slot) return 'Choose a Slot';
    if (isCurrentSlotBooked) return 'Slot Already Booked';
    return 'Confirm & Submit';
  }, [bookingData.slot, isCurrentSlotBooked, isSubmitting]);

  return (
    <div className="min-h-screen flex flex-col">
      <Banner />
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col items-center py-12 px-6 relative overflow-hidden">
        <ThemeToggle />
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} />}
        </AnimatePresence>

        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
        
        <div className="z-10 w-full max-w-3xl">
        
        {/* Booking Statistics Header */}
        <div className="flex justify-center mb-8">
          <div className="glass px-8 py-4 rounded-full flex gap-8 items-center shadow-lg">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">{stats.total}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-red-500 uppercase tracking-wider font-bold">Booked</span>
              <span className="text-xl font-black text-red-600 dark:text-red-400">{stats.booked}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-green-500 uppercase tracking-wider font-bold">Available</span>
              <span className="text-xl font-black text-green-600 dark:text-green-400">{stats.available}</span>
            </div>
          </div>
        </div>

        {step < 4 && (
          <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-6 font-medium focus:outline-none focus:underline">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </button>
        )}

        <div className="flex justify-between items-center mb-8 px-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className={`flex items-center ${num !== 3 ? 'flex-1' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'} transition-colors duration-300`}>
                {num}
              </div>
              {num !== 3 && <div className={`flex-1 h-1 mx-4 rounded-full ${step > num ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'} transition-colors duration-300`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass p-8 rounded-3xl">
              <h2 className="text-3xl font-bold mb-6 dark:text-white">Team Details</h2>
              <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 mb-1">Team Name</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input {...register('teamName', { required: true })} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none" placeholder="Avengers" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 mb-1">Team Leader Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input {...register('leaderName', { required: true })} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none" placeholder="John Doe" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 mb-1">Roll Number</label>
                      <input {...register('rollNumber', { required: true })} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none" placeholder="21XX1A0501" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 mb-1">Section</label>
                      <select {...register('section', { required: true })} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none">
                        <option value="">Select Section</option>
                        {['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma'].map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 mb-1">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input {...register('phone', { required: true, pattern: /^[0-9]{10}$/ })} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none" placeholder="9876543210" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input type="email" {...register('email', { required: true })} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none" placeholder="john@example.com" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 mb-1">Startup / Case Study Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input {...register('startup', { required: true })} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none" placeholder="Uber Case Study" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold flex items-center shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-500">
                    Continue <ArrowRight className="ml-2 w-5 h-5" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-3xl font-bold mb-6 dark:text-white text-center">Select Presentation Date</h2>
              
              {stats.available === 0 ? (
                 <div className="glass p-10 rounded-3xl flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                     <Lock className="w-10 h-10 text-red-500" />
                   </div>
                   <h3 className="text-2xl font-bold dark:text-white mb-2">🚫 Registrations Closed</h3>
                   <p className="text-slate-600 dark:text-slate-400">All presentation slots have been booked.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['24 July 2026', '25 July 2026'].map((date) => (
                    <DateCard 
                      key={date}
                      date={date}
                      bookedCount={bookedSlots[date]?.length || 0}
                      onSelect={selectDate}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <h2 className="text-3xl font-bold mb-2 dark:text-white text-center">Select Slot for {bookingData.date}</h2>
               
               <div className="flex justify-center items-center gap-6 mb-8 text-sm font-medium glass rounded-full py-2 px-6 w-fit mx-auto shadow-md">
                 <div className="flex items-center text-green-600 dark:text-green-400"><CheckCircle className="w-4 h-4 mr-2"/> Available</div>
                 <div className="flex items-center text-red-500"><Lock className="w-4 h-4 mr-2"/> Booked</div>
                 <div className="flex items-center text-blue-600 dark:text-blue-400"><div className="w-4 h-4 rounded-full bg-blue-600 mr-2 border-2 border-white"/> Selected</div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 18 }, (_, i) => `Slot ${i + 1}`).map((slotLabel, index) => {
                    const isSelected = bookingData.slot === slotLabel;
                    const isBooked = bookingData.date ? (bookedSlots[bookingData.date] || []).some(s => s === slotLabel || s.startsWith(slotLabel + ' ')) : false;
                    const isRecBooked = recentlyBooked.includes(slotLabel);

                    return (
                      <SlotButton 
                        key={slotLabel}
                        slot={slotLabel}
                        index={index}
                        isSelected={isSelected}
                        isBooked={isBooked}
                        isRecentlyBooked={isRecBooked}
                        onSelect={handleSelectSlot}
                      />
                    );
                  })}
               </div>

               <div className="mt-10 flex justify-center">
                  <motion.button
                    whileHover={{ scale: (bookingData.slot && !isSubmitting && !isCurrentSlotBooked) ? 1.05 : 1 }}
                    whileTap={{ scale: (bookingData.slot && !isSubmitting && !isCurrentSlotBooked) ? 0.95 : 1 }}
                    onClick={submitBooking}
                    disabled={!bookingData.slot || isSubmitting || isCurrentSlotBooked}
                    className={`px-10 py-4 rounded-full font-semibold flex items-center shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                      (bookingData.slot && !isSubmitting && !isCurrentSlotBooked)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {buttonText}
                    {(!isSubmitting && bookingData.slot && !isCurrentSlotBooked) && <ArrowRight className="ml-2 w-5 h-5" />}
                  </motion.button>
               </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass p-10 rounded-3xl text-center relative overflow-hidden">
               <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
               <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-10 h-10 text-green-500" />
               </div>
               <h2 className="text-3xl font-bold mb-4 dark:text-white">Booking Confirmed 🎉</h2>
               <div className="text-slate-600 dark:text-slate-300 mb-8 space-y-4 text-sm leading-relaxed">
                 <p>Your presentation slot has been successfully booked.</p>
                 <p>An email with these details and a QR code has been sent to <strong>{bookingData.email}</strong>.</p>
               </div>
               
               <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-8">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <QRCodeSVG value={bookingId || ''} size={150} />
                    <p className="text-xs text-slate-500 mt-2 font-mono">{bookingId}</p>
                 </div>
                 
                 <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl text-left space-y-3 text-sm flex-1 w-full">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-500">Booking ID</span><span className="font-bold dark:text-white text-blue-600">{bookingId}</span></div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 pt-2"><span className="text-slate-500">Team Name</span><span className="font-semibold dark:text-white">{bookingData.teamName}</span></div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 pt-2"><span className="text-slate-500">Date</span><span className="font-semibold dark:text-white">{bookingData.date}</span></div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 pt-2"><span className="text-slate-500">Time Slot</span><span className="font-semibold dark:text-white">{bookingData.slot}</span></div>
                    <div className="flex justify-between pt-2"><span className="text-slate-500">Venue</span><span className="font-semibold dark:text-white text-right">SOE-7<br/>Malla Reddy University</span></div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.button onClick={() => window.print()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-semibold shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-slate-500 flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" /> Download Ticket
                  </motion.button>
                  <motion.button 
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hey! I just booked our slot for the Case Presentation Contest.\n\nTeam: ${bookingData.teamName}\nDate: ${bookingData.date}\nSlot: ${bookingData.slot}\nVenue: SOE-7, Malla Reddy University\n\nBooking ID: ${bookingId}`)}`)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-green-500 flex items-center justify-center"
                  >
                    <Share2 className="w-5 h-5 mr-2" /> Share on WhatsApp
                  </motion.button>
               </div>
               <button onClick={() => navigate('/')} className="mt-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors font-medium focus:outline-none focus:underline">
                 Return to Home
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
};

// --- App Component ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/booking" element={<BookingFlow />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
