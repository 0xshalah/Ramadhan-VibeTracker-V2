"use client";
import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import type { InsightPayload } from '@/lib/schemas';

interface AIChatPanelProps {
  progressData: InsightPayload;
}

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
}

export default function AIChatPanel({ progressData }: AIChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Assalamu\'alaikum. Is there any spiritual reflection you would like to share today?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Unauthorized");

      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ progressData, messages: newMsgs })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Insight failure");
      }
      
      setMessages([...newMsgs, { role: 'ai', content: data.insight }]);
    } catch (e: any) {
      toast.error(e.message === "Unauthorized" ? "Silakan login ulang." : "AI is resting. Try again later.");
    }
  };

  return (
    <>
      {/* Tombol Pemicu di Sudut Kanan Bawah */}
      <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 bg-emerald-600 p-4 rounded-full shadow-emerald-500/50 shadow-lg hover:scale-110 transition-transform z-40 cursor-pointer">
        <MessageSquare className="text-white" />
      </button>

      {/* Slide-out Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <h3 className="font-bold text-white">Spiritual Companion</h3>
          <button onClick={() => setIsOpen(false)} className="cursor-pointer"><X className="text-slate-400 hover:text-white" /></button>
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
            placeholder="Share your reflection..." 
          />
          <button onClick={sendMessage} className="bg-emerald-600 p-2 rounded-xl text-white hover:bg-emerald-500 cursor-pointer">
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
