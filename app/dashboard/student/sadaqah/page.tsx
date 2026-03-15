"use client";

import { useState } from 'react';
import { useVibeStore } from '@/store/useVibeStore';
import Sidebar from '../components/Sidebar';
import { ErrorBoundary } from 'react-error-boundary';
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

export default function SadaqahHub() {
  const { user } = useVibeStore();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const tiers = [
    { label: "Share a Meal", amount: 25000, icon: "🍲" },
    { label: "Orphan Support", amount: 50000, icon: "🤝" },
    { label: "Mosque Builder", amount: 100000, icon: "🕌" }
  ];

  const handleCheckout = async () => {
    if (!selectedAmount || !user) return;
    setIsProcessing(true);
    
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate secure link');
      }

      // Berhasil membuat link, belokkan navigasi (Redirect)
      window.location.href = data.url;
    } catch (error: any) {
      // console.error(error);error
      toast.error(error.message || 'Payment system unavailable');
      setIsProcessing(false);
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Charity Hub 💸</h1>
            <p className="text-sage-500 dark:text-slate-400">Purify your wealth and secure your eternal rewards.</p>

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
                    className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                    selectedAmount === tier.amount 
                        ? 'bg-emerald-100 dark:bg-emerald-600/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-white dark:bg-slate-800/50 border-sage-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500'
                    }`}
                >
                    <div className="text-3xl mb-3 drop-shadow-sm">{tier.icon}</div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white">{tier.label}</h3>
                    <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-1">Rp {tier.amount.toLocaleString()}</p>
                </button>
                ))}
            </div>

            {/* Checkout Action */}
            <button 
                disabled={!selectedAmount || isProcessing}
                onClick={handleCheckout}
                className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-black font-bold rounded-xl disabled:opacity-50 transition-transform active:scale-[0.98] cursor-pointer"
            >
                {isProcessing ? 'Generating Secure Link...' : `Donate Rp ${selectedAmount.toLocaleString()} Now`}
            </button>
            </div>
        </main>
      </div>
    </>
  );
}
