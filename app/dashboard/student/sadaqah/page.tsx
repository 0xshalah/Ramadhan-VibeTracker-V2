"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVibeStore } from '@/store/useVibeStore';
import Sidebar from '../components/Sidebar';
import { ErrorBoundary } from 'react-error-boundary';
import { getUserProfile, syncSadaqahImpact } from '@/lib/firebase';
import { toast } from 'sonner';

// --- ErrorBoundary Fallback Component ---
function WidgetFallback() {
  return (
    <div className="p-4 bg-red-50/10 border border-red-500/50 rounded-2xl text-center w-full h-full min-h-[120px] flex flex-col justify-center items-center">
      <span className="material-symbols-outlined text-red-500">warning</span>
      <p className="text-xs text-slate-500 mt-2">Gagal memuat Charity Hub.</p>
    </div>
  );
}

// --- Success Modal Component ---
function SuccessModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Jazakallah Khairan!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Your donation has been verified. May it bring blessings to you and those in need. ✨
        </p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

// --- Main Content (Wrapped in Suspense for useSearchParams) ---
function SadaqahContent() {
  const { user } = useVibeStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalImpact, setTotalImpact] = useState<number>(0);

  // 0. Load existing impact from Firestore
  useEffect(() => {
    const fetchImpact = async () => {
      if (user?.uid) {
        const profile = await getUserProfile(user.uid);
        if (profile?.impactSadaqah) {
          setTotalImpact(profile.impactSadaqah);
        }
      }
    };
    fetchImpact();
  }, [user]);

  // 1. Deteksi Status dari URL (redirect dari Mayar)
  useEffect(() => {
    const processSuccess = async () => {
      const status = searchParams.get('status');
      if (status === 'success' && user?.uid) {
        setShowSuccess(true);
        toast.success('Donation successful!');
        
        // Cek apakah ada nominal yang ditunda di localstorage
        const pendingAmountStr = localStorage.getItem('vibe_pending_sadaqah');
        if (pendingAmountStr) {
          const amountText = parseInt(pendingAmountStr, 10);
          if (!isNaN(amountText)) {
            // Update Firestore impactSadaqah
            const success = await syncSadaqahImpact(user.uid, amountText);
            if (success) {
              setTotalImpact(prev => prev + amountText);
              localStorage.removeItem('vibe_pending_sadaqah');
            }
          }
        }
        
        // Bersihkan URL agar tidak trigger lagi saat refresh
        window.history.replaceState({}, '', window.location.pathname);
      }
    };
    processSuccess();
  }, [searchParams, user]);

  const tiers = [
    { label: "Share a Meal", amount: 25000, icon: "🍲" },
    { label: "Orphan Support", amount: 50000, icon: "🤝" },
    { label: "Mosque Builder", amount: 100000, icon: "🕌" }
  ];

  const handleCheckout = async () => {
    if (!selectedAmount || !user) return;
    setIsProcessing(true);
    
    // Simpan amount ke localstorage untuk di process setelah success redirect
    localStorage.setItem('vibe_pending_sadaqah', selectedAmount.toString());

    try {
      const response = await fetch('/api/checkout/mayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          email: user.email,
          name: user.displayName || 'VibeTracker Student'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate secure link');

      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Payment system unavailable');
      setIsProcessing(false);
      localStorage.removeItem('vibe_pending_sadaqah');
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <ErrorBoundary FallbackComponent={WidgetFallback}>
          <Sidebar onLogout={() => { window.location.href = '/' }} />
        </ErrorBoundary>

        <main className="flex-1 overflow-y-auto scroll-smooth relative p-8">
            <div className="max-w-4xl mx-auto space-y-8 mt-4">
            <header>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Charity Hub 💸</h1>
              <p className="text-sage-500 dark:text-slate-400">Purify your wealth and secure your eternal rewards.</p>
            </header>

            {/* Impact Dashboard Widget */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 p-6 rounded-2xl flex items-center justify-between">
                <div>
                <h2 className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">Your Total Impact This Month</h2>
                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-2">Rp 0</p>
                </div>
                <div className="text-5xl opacity-50 drop-shadow-sm">✨</div>
            </div>

            {/* Donation Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                <button
                    key={tier.amount}
                    onClick={() => setSelectedAmount(tier.amount)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer text-left ${
                    selectedAmount === tier.amount 
                        ? 'bg-emerald-100 dark:bg-emerald-600/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-white dark:bg-slate-800/50 border-sage-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500'
                    }`}
                >
                    <div className="text-3xl mb-3 drop-shadow-sm">{tier.icon}</div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white">{tier.label}</h3>
                    <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-1">Rp {tier.amount.toLocaleString('id-ID')}</p>
                </button>
                ))}
            </div>

            {/* Checkout Action */}
            <button 
                disabled={!selectedAmount || isProcessing}
                onClick={handleCheckout}
                className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-black font-bold rounded-xl disabled:opacity-50 transition-transform active:scale-[0.98] cursor-pointer"
            >
                {isProcessing ? 'Generating Secure Link...' : `Donate Rp ${selectedAmount.toLocaleString('id-ID')} Now`}
            </button>
            </div>
        </main>

        {/* Success Modal */}
        <SuccessModal isOpen={showSuccess} onClose={() => { setShowSuccess(false); router.push('/dashboard/student'); }} />
      </div>
    </>
  );
}

export default function SadaqahHub() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    }>
      <SadaqahContent />
    </Suspense>
  );
}
