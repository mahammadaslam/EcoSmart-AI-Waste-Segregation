import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, ArrowRight, Loader2, Sparkles, User, Brain, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatService } from '../services/api.js';
import { ChatHistory } from '../types.js';
import { translateError } from '../utils/errorHelper.ts';
import ErrorAlert from '../components/ErrorAlert.tsx';
import { ToastContainer, useToasts } from '../components/Toast.tsx';

interface ChatProps {
  darkMode: boolean;
}

export default function Chat({ darkMode }: ChatProps) {
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic'>('generic');
  const { toasts, addToast, removeToast } = useToasts();
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat session logs from database
  const fetchChatHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await chatService.getChatHistory();
      setHistory(data.chatHistory || []);
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Smooth scroll to bottom on thread inserts
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  // Post prompt to Gemini conversation endpoint
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || input.trim() === '') return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setError('');

    // Pre-insert question in UI for instantaneous visual response feedback
    const tempId = Math.random();
    setHistory(prev => [
      ...prev, 
      { id: tempId, user_id: 0, question: userMsg, answer: '...', created_at: new Date().toISOString() }
    ]);

    try {
      const data = await chatService.askAssistant(userMsg);
      // Replace placeholder with verified backend output
      setHistory(prev => prev.map(m => m.id === tempId ? data.chat : m));
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
      addToast(friendly.message, 'error');
      // Remove loading placeholder
      setHistory(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  // Perform message deletions
  const handleDeleteMessage = async (id: number) => {
    try {
      await chatService.clearChatMessage(id);
      setHistory(prev => prev.filter(m => m.id !== id));
      addToast('Message deleted successfully', 'info');
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
      addToast(friendly.message, 'error');
    }
  };

  // Preset environmental prompts
  const PRESET_PROMPTS = [
    { text: "Can pizza boxes be recycled?", icon: "🍕" },
    { text: "Where should batteries be disposed?", icon: "🔋" },
    { text: "How harmful is electronic e-waste?", icon: "💻" },
    { text: "What do plastic resin codes 1-7 mean?", icon: "♻️" }
  ];

  const handleApplyPreset = (text: string) => {
    setInput(text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col min-h-[82vh]">
      
      {/* Header section info */}
      <div className="border-b pb-4 mb-4 border-natural-border/20">
        <h2 className="text-2xl font-extrabold tracking-tight text-natural-primary">SDG 12 Chat Companion</h2>
        <p className={`text-sm mt-1 mb-2 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
          Ask EcoSmart AI regarding sustainable waste hierarchies, container markings, and safety disposal codes.
        </p>

        {error && (
          <div className="my-2">
            <ErrorAlert
              message={error}
              type={errorType}
              onRetry={fetchChatHistory}
              retryText="Restore Chat"
            />
          </div>
        )}
      </div>

      {/* Main chat window container */}
      <div className={`flex-1 rounded-2xl border flex flex-col overflow-hidden relative ${
        darkMode ? 'bg-natural-dark-card/30 border-natural-dark-border' : 'bg-natural-sand/35 border-natural-border'
      }`}>
        
        {/* Chat Threads viewports */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[50vh]">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-natural-primary" />
            </div>
          ) : history.length === 0 ? (
            /* CONVERSATION READY EMPTY STATES */
            <div className="flex flex-col items-center justify-center text-center py-10 text-natural-muted h-full">
              <div className="p-4 bg-natural-primary/10 rounded-full text-natural-primary mb-4 animate-bounce">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-sm text-natural-dark dark:text-natural-dark-text">No chat history available.</h3>
              <p className="text-xs text-natural-muted mt-1.5 max-w-sm leading-relaxed">
                Initialize conversation regarding any sustainable development target. Choose a template query or enter a prompt below.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((msg, index) => (
                <div key={msg.id || index} className="space-y-4">
                  
                  {/* QUESTION (USER MSG RAIL) */}
                  <div className="flex items-start space-x-3.5 max-w-2xl ml-auto justify-end">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-md ${
                      darkMode 
                        ? 'bg-natural-primary/15 border border-natural-primary/20 text-natural-dark-text' 
                        : 'bg-natural-primary text-white shadow-md shadow-natural-primary/10'
                    }`}>
                      <p className="font-medium">{msg.question}</p>
                    </div>
                    <div className="p-2.5 bg-natural-primary/15 rounded-xl text-natural-primary self-end shrink-0">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  {/* ANSWER (AI ASSISTANT RAIL) */}
                  <div className="flex items-start space-x-3.5 max-w-3xl">
                    <div className="p-2.5 bg-natural-primary/10 rounded-xl text-natural-primary mt-1 shrink-0">
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    
                    <div className={`p-5 rounded-2xl border text-xs leading-relaxed flex-1 group relative ${
                      darkMode ? 'bg-natural-dark-card/40 border-natural-dark-border text-natural-dark-text' : 'bg-white border-natural-border text-natural-dark'
                    }`}>
                      {/* Markdown mock renderer for list styling */}
                      {msg.answer === '...' ? (
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-natural-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-natural-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-natural-primary rounded-full animate-bounce"></span>
                        </div>
                      ) : (
                        <div className="space-y-2 whitespace-pre-wrap">
                          {msg.answer}
                        </div>
                      )}

                      {/* Deletes individual records */}
                      {msg.answer !== '...' && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition duration-150 text-rose-500 hover:text-rose-400 p-1 bg-rose-500/10 rounded-md cursor-pointer"
                          title="Delete message from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Dynamic prompt templates selection layout */}
        {history.length === 0 && (
          <div className="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl mx-auto w-full">
            {PRESET_PROMPTS.map((p) => (
              <button
                key={p.text}
                type="button"
                onClick={() => handleApplyPreset(p.text)}
                className={`p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center space-x-2.5 transition shrink-0 cursor-pointer ${
                  darkMode 
                    ? 'bg-natural-dark-bg border-natural-dark-border hover:border-natural-secondary text-natural-dark-text' 
                    : 'bg-white border-natural-border hover:border-natural-secondary text-natural-dark'
                }`}
              >
                <span className="text-sm">{p.icon}</span>
                <span className="truncate flex-1">{p.text}</span>
                <ArrowRight className="w-3.5 h-3.5 text-natural-muted" />
              </button>
            ))}
          </div>
        )}

        {/* Input Text form rails */}
        <div className={`p-4 border-t ${darkMode ? 'border-natural-dark-border bg-natural-dark-bg/20' : 'border-natural-border bg-natural-sand'}`}>
          <form onSubmit={handleSend} className="flex gap-2.5 relative max-w-4xl mx-auto">
            <input
              type="text"
              required
              disabled={loading || historyLoading}
              placeholder="Ask EcoSmart AI regarding sustainable recycling techniques..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-natural-primary transition ${
                darkMode 
                  ? 'bg-natural-dark-bg border-natural-dark-border text-natural-dark-text focus:bg-natural-dark-card' 
                  : 'bg-white border-natural-border text-natural-dark focus:bg-natural-cream'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input || historyLoading}
              className="bg-natural-primary hover:bg-natural-primary-hover text-white font-semibold py-3 px-5 rounded-xl transition shadow-lg shadow-natural-primary/10 shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
