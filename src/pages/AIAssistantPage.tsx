import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Terminal,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { ChatMessage } from '../types';
import apiService from '../services/api';

const PROMPT_SUGGESTIONS = [
  'Which tasks can delay our release?',
  'Why is the payment module at risk?',
  'Summarize the current sprint.',
  'Which developer has the highest workload?',
  'What should the team prioritize today?',
];

export const AIAssistantPage: React.FC = () => {
  const { selectedProjectId, currentProject, geminiStatus } = useProject();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am your DevPulse Delivery Intelligence Assistant. I monitor real-time task velocity, dependency cascades, and QA bugs across the engineering sprint. How can I assist your delivery decisions today?",
      key_takeaways: [
        'Ask questions about critical path blockers or workload distribution.',
        'Simulate delay scenarios or request executive sprint summaries.',
      ],
      source: 'gemini',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsSending(true);

    try {
      const res = await apiService.sendChatMessage(
        selectedProjectId,
        textToSend,
        messages.slice(-6)
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.response,
        key_takeaways: res.key_takeaways,
        referenced_tasks: res.referenced_tasks,
        source: res.source,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving project telemetry. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. What delivery questions would you like to explore?",
      },
    ]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Assistant Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100">AI Project Assistant</h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                <Sparkles className="h-2.5 w-2.5" />
                {geminiStatus?.configured ? 'Gemini 2.5 Flash' : 'Deterministic Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded in live telemetry for {currentProject?.name || 'Active Project'}
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Suggested Chips */}
      <div className="py-3 flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <HelpCircle className="h-3 w-3" /> Quick queries:
        </span>
        {PROMPT_SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => handleSend(suggestion)}
            disabled={isSending}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-2">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-sky-400'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
                }`}
              >
                {/* Content / Markdown styling */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Key Takeaways Card if assistant message has them */}
                {!isUser && msg.key_takeaways && msg.key_takeaways.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wide block mb-1">
                      Key Takeaways:
                    </span>
                    <ul className="space-y-1">
                      {msg.key_takeaways.map((takeaway, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-1.5 text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Referenced Tasks */}
                {!isUser && msg.referenced_tasks && msg.referenced_tasks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.referenced_tasks.map((taskLabel, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-blue-300 border border-slate-800"
                      >
                        {taskLabel}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
              <span>Analyzing telemetry with Gemini...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="pt-4 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about risks, blockers, workload, or sprint delivery..."
            disabled={isSending}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

