import React, { useState } from 'react';
import { Archive, X, MessageSquare, RotateCcw, Search, Trash2, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import archieve from "../assets/archieve.png";
import archieveLogo from "../assets/archieve_logo.png";

const ArchivedChatsModal = ({ isOpen, onClose, archivedChats = [], onUnarchive, onDelete, onOpen }) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;

  const filtered = archivedChats.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4"
         style={{ background: 'rgba(2,4,14,0.85)', backdropFilter: 'blur(16px)' }}
         onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col"
           style={{ background: 'linear-gradient(160deg,#111827,#080d1a)', border: '1px solid rgba(59,130,246,0.2)', maxHeight: '80vh' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src={archieveLogo} className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Archived Chats</h2>
              <p className="text-xs text-gray-500">{archivedChats.length} archived conversation{archivedChats.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-600 hover:text-white hover:bg-white/6 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        {archivedChats.length > 0 && (
          <div className="px-6 py-3 border-b border-white/5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search archived chats . . ."
                className="w-full text-sm bg-white/4 border border-white/8 rounded-xl py-2.5 pl-9 pr-4 text-gray-300 outline-none focus:border-blue-500/40 placeholder-gray-700 transition-all" />
                {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X size={15} />
                </button>
                )}
            </div>
            
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex items-center justify-center">
                <img src={archieve} className="h-30 w-30" />
              </div>
              <p className="text-sm text-gray-600">{search ? 'No matches found' : 'No archived chats yet'}</p>
            </div>
          ) : (
            filtered.map(chat => (
              <div key={chat.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl group transition-all hover:bg-white/3"
                   style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <MessageSquare size={14} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpen && onOpen(chat.id)}>
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-blue-400 transition-colors">{chat.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{new Date(chat.updatedAt || Date.now()).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">                  {onOpen && (
                    <button onClick={() => onOpen(chat.id)}
                      className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors" title="Open Chat">
                      <ExternalLink size={14} />
                    </button>
                  )}
                  {onUnarchive && (
                    <button onClick={() => onUnarchive(chat.id)}
                      className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Restore Chat">
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(chat.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete Chat">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ArchivedChatsModal;
