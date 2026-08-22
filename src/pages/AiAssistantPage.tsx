import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { askAiAssistant, AiChatMessage, AiErrorInfo, normalizeAiError } from '../services/aiService';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Mail,
  FileCheck2,
  TrendingUp,
  RotateCcw,
  KeyRound,
  WifiOff,
  Clock,
  AlertTriangle,
  ServerCrash,
  ShieldAlert,
  Settings,
  Edit3,
  CheckCircle2,
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const { business, invoices, incrementAiUsage, showToast, setActivePage } = useApp();

  const unpaidCount = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').length;
  const overdueTotal = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + (i.total || 0), 0);
  const monthlyRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello! I am your InvoiceFlow AI Business Assistant powered by Google Gemini. I can help you draft customized invoice descriptions, calculate global tax rules (VAT / Sales Tax), write polite overdue payment reminders, or analyze your monthly cash flow trends. How can I help you today?`,
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastFailedUserPrompt, setLastFailedUserPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    {
      title: 'Draft Reminder Email',
      icon: <Mail className="w-4 h-4 text-blue-600" />,
      prompt: 'Write a polite, professional payment reminder email for an overdue invoice of $1,260.',
    },
    {
      title: 'Tax Regulations & VAT',
      icon: <HelpCircle className="w-4 h-4 text-purple-600" />,
      prompt: 'What are the VAT / Sales Tax rules for selling software and consulting services to UK and US clients?',
    },
    {
      title: 'Optimize Payment Terms',
      icon: <FileCheck2 className="w-4 h-4 text-emerald-600" />,
      prompt: 'How can I structure my payment terms and late fee policies to encourage faster client payments?',
    },
    {
      title: 'Summarize Cash Flow',
      icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
      prompt: `Summarize my business financial health based on $${monthlyRevenue.toFixed(2)} paid and $${overdueTotal.toFixed(2)} overdue.`,
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    // Check AI usage quota in user's subscription
    const allowed = await incrementAiUsage();
    if (!allowed) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: AiChatMessage = { id: userMsgId, role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);
    setLastFailedUserPrompt(null);

    try {
      const reply = await askAiAssistant({
        messages: updatedMessages.map((m) => ({
          role: m.role,
          text: m.text,
        })),
        businessContext: {
          name: business.name,
          currency: business.default_currency || 'USD',
          unpaidCount,
          overdueTotal,
          monthlyRevenue,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: reply,
        },
      ]);
    } catch (rawErr: any) {
      const errorInfo: AiErrorInfo = normalizeAiError(rawErr);
      setLastFailedUserPrompt(text);

      // Display actionable toast notification
      showToast(`${errorInfo.title}: ${errorInfo.message}`, 'error');

      // Append descriptive, structured error message in the chat thread
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: errorInfo.message,
          errorInfo,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderErrorCard = (errorInfo: AiErrorInfo, originalUserPrompt?: string) => {
    const getBadgeStyle = () => {
      switch (errorInfo.errorType) {
        case 'missing_api_key':
        case 'invalid_api_key':
          return {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
            icon: <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />,
          };
        case 'rate_limit_exceeded':
          return {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-900',
            badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
            icon: <Clock className="w-4 h-4 text-orange-600 shrink-0" />,
          };
        case 'network_error':
          return {
            bg: 'bg-rose-50',
            border: 'border-rose-200',
            text: 'text-rose-900',
            badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
            icon: <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />,
          };
        case 'service_unavailable':
          return {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
            icon: <ServerCrash className="w-4 h-4 text-amber-600 shrink-0" />,
          };
        case 'safety_blocked':
          return {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-900',
            badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
            icon: <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />,
          };
        default:
          return {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-900',
            badgeBg: 'bg-red-100 text-red-800 border-red-300',
            icon: <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />,
          };
      }
    };

    const style = getBadgeStyle();
    const targetPromptToRetry = originalUserPrompt || lastFailedUserPrompt;

    return (
      <div className={`rounded-2xl border p-4 text-xs space-y-3 ${style.bg} ${style.border} ${style.text} shadow-xs`}>
        {/* Error Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {style.icon}
            <span className="font-extrabold text-slate-900 text-[13px]">{errorInfo.title}</span>
          </div>
          {errorInfo.statusCode && (
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${style.badgeBg}`}>
              HTTP {errorInfo.statusCode}
            </span>
          )}
        </div>

        {/* Error Message & Suggestion */}
        <div className="space-y-1.5 text-slate-700 leading-relaxed">
          <p className="font-medium text-slate-800">{errorInfo.message}</p>
          {errorInfo.suggestion && (
            <p className="text-[11px] text-slate-600 bg-white/70 rounded-xl p-2.5 border border-slate-200/60 flex items-start gap-2">
              <span className="font-bold text-slate-700 shrink-0">Recommendation:</span>
              <span>{errorInfo.suggestion}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {errorInfo.retryable && targetPromptToRetry && (
            <button
              onClick={() => handleSendMessage(targetPromptToRetry)}
              disabled={isTyping}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Request</span>
            </button>
          )}

          {targetPromptToRetry && (
            <button
              onClick={() => {
                setInputMessage(targetPromptToRetry);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>Edit Prompt</span>
            </button>
          )}

          {(errorInfo.errorType === 'missing_api_key' || errorInfo.errorType === 'invalid_api_key') && (
            <button
              onClick={() => setActivePage('settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] transition-all shadow-xs cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Go to Settings</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>AI Assistant</span>
            <span className="text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              Gemini 3.7 Flash
            </span>
          </h1>
          <p className="text-xs text-slate-500">Context-aware advice for invoicing, taxes, client emails, and billing terms</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.prompt)}
            className="p-3.5 bg-white border border-slate-200/80 hover:border-blue-500/50 rounded-2xl text-left transition-all flex items-center gap-3 group shadow-2xs hover:shadow-sm cursor-pointer"
          >
            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
              {q.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800">{q.title}</p>
              <p className="text-[11px] text-slate-400 truncate">{q.prompt}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Chat Thread Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col h-[520px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const associatedUserPrompt = prevMsg && prevMsg.role === 'user' ? prevMsg.text : undefined;

            return (
              <div
                key={msg.id || idx}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : msg.errorInfo
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : msg.errorInfo ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div className="max-w-[85%] sm:max-w-[80%] space-y-2">
                  {msg.errorInfo ? (
                    renderErrorCard(msg.errorInfo, associatedUserPrompt)
                  ) : (
                    <div
                      className={`rounded-2xl p-4 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white font-medium shadow-2xs'
                          : 'bg-slate-50 text-slate-800 border border-slate-200/80 whitespace-pre-line shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs text-slate-500 italic flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                <span>Gemini AI is analyzing and crafting response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mt-4 pt-3 border-t border-slate-100 flex gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI Assistant anything about invoices, taxes, or cash flow..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isTyping || !inputMessage.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
