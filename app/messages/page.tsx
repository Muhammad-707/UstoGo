'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { MASTERS } from '@/lib/mockData';

export default function MessagesPage() {
  const [selectedMaster, setSelectedMaster] = useState(MASTERS[0]);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'master', text: 'Hello Alex! I have reviewed your electrical panel request.', time: '10:14 AM' },
    { id: 2, sender: 'client', text: 'Great! Are you able to bring a 200A main breaker as well?', time: '10:16 AM' },
    { id: 3, sender: 'master', text: 'Yes, absolutely. I have a brand new Leviton Smart Panel in stock. See you at 10 AM tomorrow!', time: '10:18 AM' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'client', text: inputText, time: 'Just now' },
    ]);
    setInputText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl h-[750px] flex overflow-hidden">
        
        {/* Left Contacts Sidebar */}
        <div className="w-full sm:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">Messages</h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
            {MASTERS.slice(0, 4).map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMaster(m)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition ${
                  selectedMaster.id === m.id
                    ? 'bg-blue-50 dark:bg-blue-950/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-12 h-12 rounded-2xl object-cover" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</h4>
                    <span className="text-[10px] text-slate-400">10:18 AM</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{m.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Chat View */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={selectedMaster.avatar} alt={selectedMaster.name} className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedMaster.name}</h3>
                <span className="text-[11px] text-emerald-500 font-bold">Online • Responds in ~5m</span>
              </div>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'client'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message to the master..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
            >
              Send
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
