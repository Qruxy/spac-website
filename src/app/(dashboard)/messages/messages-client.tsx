'use client';

/**
 * Messages Client Component
 *
 * Two-panel messaging interface with conversation list and message thread.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  User as UserIcon,
} from 'lucide-react';

// Types
interface User {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  type: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  type: string;
  title?: string | null;
  listing?: {
    id: string;
    title: string;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  otherParticipants: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  }[];
  hasUnread: boolean;
  lastMessageAt: string;
  isMuted: boolean;
}

interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

// Format relative time
function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return then.toLocaleDateString();
}

// Avatar component
function Avatar({ name, imageUrl, size = 'md' }: { name: string; imageUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const initial = name?.[0]?.toUpperCase() || 'U';

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-semibold flex-shrink-0`}>
      {initial}
    </div>
  );
}

// New message dialog
function NewMessageDialog({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/messages/user-search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !message.trim() || isSending) return;

    setIsSending(true);
    setError('');

    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setMessage('');
      setSearchQuery('');
      setSelectedUser(null);
      setSearchResults([]);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 border border-white/10 rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">New Message</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSend}>
          {/* User selection */}
          {!selectedUser ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search for a user
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a name or email..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Search results */}
              {isSearching && (
                <div className="mt-2 p-4 text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="mt-2 bg-slate-900/50 border border-white/10 rounded-lg overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <Avatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                      <span className="text-white">{user.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mt-2 p-4 text-center text-slate-400 text-sm">
                  No users found
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                To
              </label>
              <div className="flex items-center gap-2 p-2 bg-slate-900/50 border border-white/10 rounded-lg">
                <Avatar name={selectedUser.name} imageUrl={selectedUser.avatarUrl} size="sm" />
                <span className="text-white flex-1">{selectedUser.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Message input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
              disabled={!selectedUser}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUser || !message.trim() || isSending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component
export function MessagesClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileThread, setShowMobileThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      const data = await res.json();
      setSelectedConversation(data);
      setShowMobileThread(true);

      // Mark as read
      await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });

      // Update conversation list to clear unread indicator
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, hasUnread: false } : c)
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send message
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConversation.conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      // Add new message to the list
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, data.message],
      } : null);

      setNewMessage('');

      // Reload conversations to update last message
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.otherParticipants.some(p => p.name.toLowerCase().includes(query)) ||
      c.listing?.title.toLowerCase().includes(query) ||
      c.lastMessage?.content.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            <p className="text-slate-400 mt-1">Chat with other members</p>
          </div>
          <button
            onClick={() => setShowNewMessageDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Message</span>
          </button>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
          {/* Left panel - Conversation list */}
          <div className={`lg:col-span-1 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden flex flex-col ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-2">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewMessageDialog(true)}
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      Start a conversation
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = conversation.otherParticipants[0];
                  const isActive = selectedConversation?.conversation.id === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => loadMessages(conversation.id)}
                      className={`w-full flex items-start gap-3 p-4 hover:bg-slate-700/50 transition-colors border-b border-white/5 text-left ${
                        isActive ? 'bg-slate-700/50' : ''
                      }`}
                    >
                      <Avatar name={otherUser?.name || 'User'} imageUrl={otherUser?.avatarUrl} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-white truncate">
                            {otherUser?.name || 'User'}
                          </span>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {conversation.lastMessageAt && formatRelativeTime(conversation.lastMessageAt)}
                          </span>
                        </div>

                        {conversation.listing && (
                          <div className="text-xs text-indigo-400 mb-1 truncate">
                            Re: {conversation.listing.title}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-400 truncate flex-1">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                          {conversation.hasUnread && (
                            <div className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel - Message thread */}
          <div className={`lg:col-span-2 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden flex flex-col ${showMobileThread ? 'flex' : 'hidden lg:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileThread(false)}
                    className="lg:hidden text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {selectedConversation.conversation.otherParticipants[0] && (
                    <>
                      <Avatar
                        name={selectedConversation.conversation.otherParticipants[0].name}
                        imageUrl={selectedConversation.conversation.otherParticipants[0].avatarUrl}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-white truncate">
                          {selectedConversation.conversation.otherParticipants[0].name}
                        </h2>
                        {selectedConversation.conversation.listing && (
                          <p className="text-sm text-slate-400 truncate">
                            Re: {selectedConversation.conversation.listing.title}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <>
                      {selectedConversation.hasMore && (
                        <div className="text-center">
                          <button className="text-sm text-indigo-400 hover:text-indigo-300">
                            Load older messages
                          </button>
                        </div>
                      )}

                      {selectedConversation.messages.map((message, idx) => {
                        const isCurrentUser = message.senderId === selectedConversation.conversation.otherParticipants[0]?.id ? false : true;
                        const showAvatar = idx === 0 || selectedConversation.messages[idx - 1].senderId !== message.senderId;

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isCurrentUser && (
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <Avatar
                                    name={`${message.sender.firstName} ${message.sender.lastName}`}
                                    imageUrl={message.sender.avatarUrl}
                                    size="sm"
                                  />
                                ) : (
                                  <div className="h-8 w-8" />
                                )}
                              </div>
                            )}

                            <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isCurrentUser
                                    ? 'bg-indigo-600/80 text-white'
                                    : 'bg-slate-700/80 text-white'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              <span className="text-xs text-slate-500 mt-1">
                                {formatRelativeTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      disabled={isSendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSendingMessage}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New message dialog */}
      <NewMessageDialog
        isOpen={showNewMessageDialog}
        onClose={() => setShowNewMessageDialog(false)}
        onSuccess={loadConversations}
      />
    </>
  );
}
