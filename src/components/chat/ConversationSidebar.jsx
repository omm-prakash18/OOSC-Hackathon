import React, { useState } from 'react';
import {
  MessageSquarePlus, Trash2, Edit2, Check, MessageSquare,
  RotateCcw, Globe, Gauge, Type, Plus, ChevronRight
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
    <aside className="order-2 lg:order-1 w-full lg:w-[320px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24 mb-6 lg:mb-0">
      {/* + New Chat Session Button */}
      <button
        disabled={isProcessing}
        onClick={() => {
          if (onStopSpeaking) onStopSpeaking();
          if (onCreateConversation) onCreateConversation();
        }}
        className="group w-full h-12 rounded-2xl bg-zinc-900 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md hover:bg-zinc-800 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:scale-110">
          <Plus size={14} strokeWidth={2.5} />
        </span>
        <span>{language === 'hi' ? '+ नई बातचीत (New Chat)' : '+ Start New Chat'}</span>
      </button>

      {/* ── Preferences Outer Double-Bezel Card ── */}
      <div className="rounded-[2rem] bg-zinc-200/90 p-1.5 ring-1 ring-zinc-300 shadow-sm">
        <div className="rounded-[calc(2rem-6px)] bg-white p-4 sm:p-5 space-y-4">
          
          {/* Language / Dialect Selection */}
          <div className="space-y-2">
            <p className="font-mono text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} className="text-emerald-700" />
              <span>{language === 'hi' ? 'भाषा / बोली' : 'Language / Dialect'}</span>
            </p>
            {setDialect && (
              <Select value={dialect} onValueChange={setDialect}>
                <SelectTrigger className="w-full justify-between h-10 text-xs font-bold rounded-xl border-zinc-300 bg-zinc-50 text-zinc-900 hover:bg-white hover:border-zinc-400 shadow-2xs transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 bg-white shadow-xl">
                  {Object.entries(dialectMap).map(([code, info]) => (
                    <SelectItem key={code} value={code} className="text-xs font-bold text-zinc-900 cursor-pointer">
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="border-t border-zinc-200/80 pt-3 space-y-2">
            {/* Speech Speed */}
            <p className="font-mono text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={14} className="text-emerald-700" />
              <span>{language === 'hi' ? 'बोलने की गति' : 'Speech Speed'}</span>
            </p>
            {setTtsRate && (
              <div className="grid grid-cols-3 gap-2">
                {[0.75, 1.0, 1.25].map(r => {
                  const isSelected = Math.abs(ttsRate - r) < 0.05;
                  return (
                    <button
                      key={r}
                      onClick={() => setTtsRate(r)}
                      className={cn(
                        'h-9 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-2xs',
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm scale-[1.02]'
                          : 'bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200 hover:text-zinc-950 font-extrabold'
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
            <div className="border-t border-zinc-200/80 pt-3">
              <button
                onClick={() => setLargeText(p => !p)}
                className={cn(
                  'w-full h-9 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer',
                  largeText
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200'
                )}
              >
                <Type size={14} />
                <span>{largeText ? (language === 'hi' ? 'सामान्य आकार' : 'Normal Text') : (language === 'hi' ? 'बड़ा टेक्स्ट A+' : 'Large Text A+')}</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Saved Chats List Outer Double-Bezel Card ── */}
      <div className="rounded-[2rem] bg-zinc-200/90 p-1.5 ring-1 ring-zinc-300 shadow-sm">
        <div className="rounded-[calc(2rem-6px)] bg-white p-4 sm:p-5 space-y-3">
          
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} className="text-emerald-700" />
              <span>{language === 'hi' ? 'सहेजी गई बातचीत' : 'Saved Chats'}</span>
            </p>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-zinc-900 text-white">
              {conversations.length}
            </span>
          </div>

          <ScrollArea className="max-h-72 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              {conversations.length === 0 ? (
                <p className="text-xs font-bold text-zinc-600 italic text-center py-6">
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
                        'group text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5',
                        isActive
                          ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 shadow-sm'
                          : 'bg-zinc-50 border-zinc-200/90 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300'
                      )}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-emerald-600 text-xs font-bold text-zinc-900 bg-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && submitRename(conv.id, e)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-700 hover:bg-emerald-100 shrink-0"
                            onClick={(e) => submitRename(conv.id, e)}
                          >
                            <Check size={13} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <span className="truncate w-full font-extrabold text-xs text-zinc-900">
                              {conv.title || (language === 'hi' ? 'सामान्य बातचीत' : 'General Assistance')}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1.5">
                              <span>{turns} {language === 'hi' ? 'टर्न' : 'turns'}</span>
                              <span>•</span>
                              <span>
                                {conv.createdAt
                                  ? new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                  : 'Today'}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                            <button
                              title={language === 'hi' ? 'नाम बदलें' : 'Rename'}
                              onClick={(e) => startRename(conv, e)}
                              className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-all"
                            >
                              <Edit2 size={12} />
                            </button>
                            {conversations.length > 1 && (
                              <button
                                title={language === 'hi' ? 'हटाएं' : 'Delete'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onStopSpeaking) onStopSpeaking();
                                  onDeleteConversation(conv.id);
                                }}
                                className="p-1 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={12} />
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
            <div className="pt-2 border-t border-zinc-200">
              <button
                onClick={() => {
                  if (window.confirm(language === 'hi' ? 'क्या आप सभी बातचीत मिटाना चाहते हैं?' : 'Clear all conversation history?')) {
                    if (onStopSpeaking) onStopSpeaking();
                    onClearAllConversations();
                  }
                }}
                className="w-full py-1.5 rounded-xl text-xs font-extrabold text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>{language === 'hi' ? 'सभी इतिहास साफ़ करें' : 'Clear All History'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </aside>
  );
}
