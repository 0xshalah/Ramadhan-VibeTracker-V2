"use client";
import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AIChatPanel({ progressData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Assalamu\'alaikum. Ada yang ingin direfleksikan dari ibadahmu hari ini?' }]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');

    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressData, userMessage: input })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: 'ai', content: data.insight }]);
    } catch {
      toast.error("AI is resting. Try again later.");
    }
  };

  return (
    <>
      {/* Tombol Pemicu di Sudut Kanan Bawah */}
      <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 bg-emerald-600 p-4 rounded-full shadow-emerald-500/50 shadow-lg hover:scale-110 transition-transform z-40">
        <MessageSquare className="text-white" />
      </button>

      {/* Slide-out Panel ala Shadcn Sheet */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <h3 className="font-bold text-white">Spiritual Companion</h3>
          <button onClick={() => setIsOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-2xl max-w-[85%] ${m.role === 'ai' ? 'bg-slate-800 text-slate-200 self-start rounded-tl-sm' : 'bg-emerald-600 text-white self-end ml-auto rounded-tr-sm'}`}>
              {m.content}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <input 
            value={input} 
            onChange={(e)=>setInput(e.target.value)} 
            onKeyDown={(e)=>e.key==='Enter'&&sendMessage()} 
            className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500" 
            placeholder="Curhat soal ibadah..." 
          />
          <button onClick={sendMessage} className="bg-emerald-600 p-2 rounded-xl text-white hover:bg-emerald-500">
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
