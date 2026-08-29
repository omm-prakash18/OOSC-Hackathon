import React, { useState } from 'react';
import {
  MessageSquarePlus, Trash2, Edit2, Check, MessageSquare,
  RotateCcw, Globe, Gauge, Type, Plus, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function ConversationSidebar({
  conversations = [],
  activeConvId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onClearAllConversations,
  language = 'hi',
  dialect,
  setDialect,
  dialectMap = {},
  ttsRate = 1.0,
  setTtsRate,
  largeText,
  setLargeText,
  isProcessing = false,
  onStopSpeaking
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const submitRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim() && onRenameConversation) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="order-2 lg:order-1 w-full lg:w-[320px] shrink-0 flex flex-col gap-5 lg:sticky lg:top-24 mb-6 lg:mb-0">
      
      {/* ── Main CTA: + New Chat Session Button (Vibrant Emerald Gradient) ── */}
      <button
        disabled={isProcessing}
        onClick={() => {
          if (onStopSpeaking) onStopSpeaking();
          if (onCreateConversation) onCreateConversation();
        }}
        className="group w-full h-12 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-700/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:scale-110">
          <Plus size={14} strokeWidth={3} />
        </span>
        <span>{language === 'hi' ? '+ नई बातचीत (New Chat)' : '+ Start New Chat'}</span>
      </button>

      {/* ── Preferences Panel (Bold Vibrant Border & Bezel) ── */}
      <div className="rounded-[2.2rem] bg-emerald-500/20 p-2 ring-2 ring-emerald-600/30 shadow-md">
        <div className="rounded-[calc(2.2rem-8px)] bg-white p-4.5 sm:p-5 space-y-4">
          
          {/* Language / Dialect Selection Header */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Globe size={14} strokeWidth={2.5} />
              </div>
              <p className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                {language === 'hi' ? 'भाषा / बोली' : 'Language / Dialect'}
              </p>
            </div>
            {setDialect && (
              <Select value={dialect} onValueChange={setDialect}>
                <SelectTrigger className="w-full justify-between h-11 text-xs font-black rounded-xl border-2 border-emerald-600/40 bg-emerald-50/50 text-emerald-950 hover:bg-white hover:border-emerald-600 shadow-2xs transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-emerald-600/30 bg-white shadow-xl">
                  {Object.entries(dialectMap).map(([code, info]) => (
                    <SelectItem key={code} value={code} className="text-xs font-black text-emerald-950 cursor-pointer">
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="border-t border-emerald-100 pt-3.5 space-y-2.5">
            {/* Speech Speed Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Gauge size={14} strokeWidth={2.5} />
              </div>
              <p className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                {language === 'hi' ? 'बोलने की गति' : 'Speech Speed'}
              </p>
            </div>
            {setTtsRate && (
              <div className="grid grid-cols-3 gap-2">
                {[0.75, 1.0, 1.25].map(r => {
                  const isSelected = Math.abs(ttsRate - r) < 0.05;
                  return (
                    <button
                      key={r}
                      onClick={() => setTtsRate(r)}
                      className={cn(
                        'h-10 rounded-xl text-xs font-black transition-all cursor-pointer border-2 shadow-2xs',
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-md scale-[1.03]'
                          : 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500'
                      )}
                    >
                      {r}×
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Large Text Toggle Button */}
          {setLargeText && (
            <div className="border-t border-emerald-100 pt-3.5">
              <button
                onClick={() => setLargeText(p => !p)}
                className={cn(
                  'w-full h-10 rounded-xl text-xs font-black flex items-center justify-center gap-2 border-2 transition-all cursor-pointer',
                  largeText
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                    : 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500'
                )}
              >
                <Type size={14} strokeWidth={2.5} />
                <span>{largeText ? (language === 'hi' ? 'सामान्य आकार' : 'Normal Text') : (language === 'hi' ? 'बड़ा टेक्स्ट A+' : 'Large Text A+')}</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Saved Chats Panel (Bold Vibrant Border & Bezel) ── */}
      <div className="rounded-[2.2rem] bg-emerald-500/20 p-2 ring-2 ring-emerald-600/30 shadow-md">
        <div className="rounded-[calc(2.2rem-8px)] bg-white p-4.5 sm:p-5 space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <MessageSquare size={14} strokeWidth={2.5} />
              </div>
              <p className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                {language === 'hi' ? 'सहेजी गई बातचीत' : 'Saved Chats'}
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-700 text-white shadow-xs">
              {conversations.length}
            </span>
          </div>

          <ScrollArea className="max-h-72 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              {conversations.length === 0 ? (
                <p className="text-xs font-extrabold text-emerald-900 italic text-center py-6">
                  {language === 'hi' ? 'कोई बातचीत सहेजी नहीं गई है' : 'No saved chats yet'}
                </p>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isEditing = editingId === conv.id;
                  const msgCount = conv.messages?.length || 0;
                  const turns = Math.floor(msgCount / 2);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        if (onStopSpeaking) onStopSpeaking();
                        onSelectConversation(conv.id);
                      }}
                      className={cn(
                        'group text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-2.5',
                        isActive
                          ? 'bg-emerald-700 border-emerald-800 text-white shadow-md'
                          : 'bg-white border-emerald-200 text-emerald-950 hover:bg-emerald-50/70 hover:border-emerald-500 shadow-2xs'
                      )}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border-2 border-emerald-600 text-xs font-black text-emerald-950 bg-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && submitRename(conv.id, e)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-700 hover:bg-emerald-100 shrink-0"
                            onClick={(e) => submitRename(conv.id, e)}
                          >
                            <Check size={14} strokeWidth={3} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <span className={cn('truncate w-full font-black text-xs', isActive ? 'text-white' : 'text-emerald-950')}>
                              {conv.title || (language === 'hi' ? 'सामान्य बातचीत' : 'General Assistance')}
                            </span>
                            <span className={cn('text-[11px] font-extrabold flex items-center gap-1.5', isActive ? 'text-emerald-100' : 'text-emerald-800')}>
                              <span>{turns} {language === 'hi' ? 'टर्न' : 'turns'}</span>
                              <span>•</span>
                              <span>
                                {conv.createdAt
                                  ? new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                  : 'Today'}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100">
                            <button
                              title={language === 'hi' ? 'नाम बदलें' : 'Rename'}
                              onClick={(e) => startRename(conv, e)}
                              className={cn(
                                'p-1 rounded-lg transition-all',
                                isActive ? 'text-emerald-100 hover:text-white hover:bg-emerald-600' : 'text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100'
                              )}
                            >
                              <Edit2 size={13} strokeWidth={2.5} />
                            </button>
                            {conversations.length > 1 && (
                              <button
                                title={language === 'hi' ? 'हटाएं' : 'Delete'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onStopSpeaking) onStopSpeaking();
                                  onDeleteConversation(conv.id);
                                }}
                                className={cn(
                                  'p-1 rounded-lg transition-all',
                                  isActive ? 'text-emerald-100 hover:text-white hover:bg-emerald-600' : 'text-emerald-700 hover:text-red-600 hover:bg-red-50'
                                )}
                              >
                                <Trash2 size={13} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {conversations.length > 1 && (
            <div className="pt-2 border-t border-emerald-100">
              <button
                onClick={() => {
                  if (window.confirm(language === 'hi' ? 'क्या आप सभी बातचीत मिटाना चाहते हैं?' : 'Clear all conversation history?')) {
                    if (onStopSpeaking) onStopSpeaking();
                    onClearAllConversations();
                  }
                }}
                className="w-full py-2 rounded-xl text-xs font-black text-red-700 hover:text-red-800 hover:bg-red-50 border-2 border-red-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} strokeWidth={2.5} />
                <span>{language === 'hi' ? 'सभी इतिहास साफ़ करें' : 'Clear All History'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </aside>
  );
}
