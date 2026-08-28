import React, { useState } from 'react';
import { MessageSquarePlus, Trash2, Edit2, Check, MessageSquare, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ConversationSidebar({
  conversations = [],
  activeConvId,
  onSelectConversation,
  onCreateNewConversation,
  onDeleteConversation,
  onClearAllConversations,
  onRenameConversation,
  language = 'hi'
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
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <MessageSquare size={14} className="text-emerald-600" />
          {language === 'hi' ? 'बातचीत इतिहास' : 'Chat History'}
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-emerald-600/30 text-emerald-800 hover:bg-emerald-50"
                onClick={onCreateNewConversation}
              >
                <MessageSquarePlus size={13} />
                {language === 'hi' ? 'नई चैट' : 'New Chat'}
              </Button>
            } />
            <TooltipContent>
              <p className="text-xs">{language === 'hi' ? 'नया प्रश्न पूछें' : 'Start a fresh topic'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ScrollArea className="h-48 pr-2">
        <div className="space-y-1.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">
              {language === 'hi' ? 'कोई इतिहास नहीं' : 'No previous conversations'}
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-emerald-500 text-xs text-slate-900 bg-white"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-emerald-700 hover:bg-emerald-100"
                        onClick={(e) => submitRename(conv.id, e)}
                      >
                        <Check size={12} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate pr-2">
                        {conv.title || (language === 'hi' ? 'सत्र बातचीत' : 'Voice Query Session')}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-slate-400 hover:text-slate-700"
                          onClick={(e) => startRename(conv, e)}
                        >
                          <Edit2 size={11} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-slate-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                        >
                          <Trash2 size={11} />
                        </Button>
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
        <div className="pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-7 text-[11px] text-slate-400 hover:text-red-600 gap-1.5"
            onClick={onClearAllConversations}
          >
            <RotateCcw size={11} />
            {language === 'hi' ? 'सभी इतिहास साफ़ करें' : 'Clear All History'}
          </Button>
        </div>
      )}
    </div>
  );
}
