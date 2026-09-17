"use client";

import React, { useState, useEffect, useRef } from 'react';

interface ManufacturingCopilotProps {
  contextType?: string;
  contextId?: string;
}

export function ManufacturingCopilot({ contextType, contextId }: ManufacturingCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'USER', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/copilot/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMsg,
          conversationId,
          contextType,
          contextId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (!conversationId) setConversationId(data.data.conversationId);
        setMessages(prev => [...prev, data.data.message]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ASSISTANT', content: 'An error occurred contacting the Copilot.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-purple-700 text-white rounded-full shadow-lg hover:bg-purple-800 transition transform hover:scale-105 z-50 flex items-center justify-center"
          title="Manufacturing Copilot"
        >
          <span className="text-2xl">✨</span>
        </button>
      )}

      {/* Copilot Sidebar / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white rounded-xl shadow-2xl border border-purple-200 flex flex-col z-50 overflow-hidden">
          
          {/* Header */}
          <div className="bg-purple-700 p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg flex items-center">
                ✨ Operations Copilot
              </h3>
              <p className="text-xs text-purple-200">AI Intelligence & Assistance</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-purple-200 hover:text-white">
              ✖
            </button>
          </div>

          {/* Context Banner */}
          {contextType && (
            <div className="bg-purple-50 px-4 py-2 text-xs text-purple-800 border-b border-purple-100 flex justify-between">
              <span>Context: {contextType} {contextId ? `(${contextId})` : ''}</span>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-sm">How can I help you optimize operations today?</p>
                <div className="mt-4 flex flex-col space-y-2 px-4">
                  <button onClick={() => setInput('What is the operational health summary?')} className="text-xs bg-white border border-gray-200 rounded p-2 text-left hover:bg-purple-50 transition">
                    "What is the operational health summary?"
                  </button>
                  <button onClick={() => setInput('Show me the top exceptions.')} className="text-xs bg-white border border-gray-200 rounded p-2 text-left hover:bg-purple-50 transition">
                    "Show me the top exceptions."
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'USER' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {msg.content}
                </div>
                
                {/* Structured Data Visualization */}
                {msg.structuredData && (
                  <div className="mt-2 w-full max-w-[90%] bg-white border border-gray-200 rounded p-3 text-xs shadow-sm overflow-x-auto">
                    <div className="font-semibold text-purple-700 mb-1 flex items-center">
                      <span className="mr-1">📊</span> {msg.structuredData.tool}
                    </div>
                    <pre className="text-gray-600 mt-2 font-mono whitespace-pre-wrap">
                      {JSON.stringify(msg.structuredData.result, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-1 text-[10px] text-gray-400 flex items-center space-x-1">
                    <span>Evidence:</span>
                    {msg.citations.map((c: any, idx: number) => (
                      <span key={idx} className="bg-gray-100 px-1 rounded">{c.source}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="bg-white border border-gray-200 text-gray-500 rounded-lg p-3 text-sm shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex relative">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Copilot..."
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-600 hover:bg-purple-50 rounded-full disabled:opacity-50"
              >
                ➤
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-gray-400">
              AI responses are generated based on authorized tenant data.
            </div>
          </div>

        </div>
      )}
    </>
  );
}
