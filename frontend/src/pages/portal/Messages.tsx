import { useState, useEffect, useRef, useCallback } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/Sidebar';
import { messagesAPI, authAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import apiClient from '../../services/api';

interface Conversation {
  otherUserId: number | null;
  otherUserName: string;
  lastMessagePreview: string;
  lastMessageTime: string;
  unreadCount: number;
  isPoolEmail: boolean;
  isWhatsApp: boolean;
}

interface ChatMessage {
  id: number;
  senderId: number | null;
  senderName: string;
  content: string;
  subject: string;
  timestamp: string;
  isRead: boolean;
  isMine: boolean;
  isWhatsApp: boolean;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  gender?: string;
  fullName?: string;
}

export default function Messages() {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Conversation list state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Chat view state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);

  // New chat compose modal
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [composeSending, setComposeSending] = useState(false);

  const isClient = currentUser?.role === 'Client' || currentUser?.role === 'RegisteredUser';

  useEffect(() => {
    fetchCurrentUser();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userQuery.length >= 1) {
      const searchUsers = async () => {
        try {
          const response = await apiClient.get(`/users/search?query=${encodeURIComponent(userQuery)}`);
          setSearchResults(response.data);
        } catch {
          setSearchResults([]);
        }
      };
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [userQuery]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await messagesAPI.getConversations();
      const data: Conversation[] = (response.data || []).map((c: any) => ({
        otherUserId: c.otherUserId ?? null,
        otherUserName: c.otherUserName,
        lastMessagePreview: c.lastMessagePreview,
        lastMessageTime: new Date(c.lastMessageTime).toLocaleString('de-DE'),
        unreadCount: c.unreadCount,
        isPoolEmail: c.isPoolEmail,
        isWhatsApp: c.isWhatsApp ?? false,
      }));
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);
    setLoadingChat(true);
    setChatMessages([]);
    try {
      const userId = conv.isPoolEmail ? 0 : (conv.otherUserId ?? 0);
      const response = await messagesAPI.getConversation(userId);
      const msgs: ChatMessage[] = (response.data || []).map((m: any) => ({
        id: m.id,
        senderId: m.senderId ?? null,
        senderName: m.senderName,
        content: m.content,
        subject: m.subject,
        timestamp: new Date(m.timestamp).toLocaleString('de-DE'),
        isRead: m.isRead,
        isMine: m.isMine,
        isWhatsApp: m.isWhatsApp ?? false,
      }));
      setChatMessages(msgs);
      // Mark conversation as read by refreshing count
      setConversations(prev =>
        prev.map(c =>
          (c.otherUserId === conv.otherUserId && c.isPoolEmail === conv.isPoolEmail)
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  }, []);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConversation || activeConversation.isPoolEmail) return;
    setSending(true);
    try {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg) {
        // Reply to the last message in the conversation
        await messagesAPI.reply(lastMsg.id, chatInput.trim());
      } else {
        // No prior messages — use send endpoint with subject from compose context or default
        await messagesAPI.send({
          recipientUserId: activeConversation.otherUserId!,
          subject: t('messages.defaultChatSubject'),
          content: chatInput.trim(),
        });
      }
      setChatInput('');
      // Reload the conversation
      await openConversation(activeConversation);
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || t('messages.sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      alert(t('messages.selectRecipient'));
      return;
    }
    setComposeSending(true);
    try {
      await messagesAPI.send({
        recipientUserId: selectedUser.id,
        subject: composeSubject || t('messages.defaultChatSubject'),
        content: composeContent,
      });
      setShowComposeModal(false);
      setComposeSubject('');
      setComposeContent('');
      setSelectedUser(null);
      setUserQuery('');
      // Refresh conversations and open the new one
      await fetchConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || t('messages.sendError'));
    } finally {
      setComposeSending(false);
    }
  };

  const getProfileIcon = (gender?: string) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '🧑';
  };

  const isActive = (conv: Conversation) =>
    activeConversation?.otherUserId === conv.otherUserId &&
    activeConversation?.isPoolEmail === conv.isPoolEmail;

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 ml-64 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Top header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary dark:text-gray-100">{t('messages.title')}</h1>
            <p className="text-sm text-textSecondary dark:text-gray-400">{t('messages.subtitle')}</p>
          </div>
          {!isClient && (
            <button
              onClick={() => setShowComposeModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              ✏️ {t('messages.newChat')}
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — Conversations list */}
          <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-sm font-semibold text-textPrimary dark:text-gray-200 uppercase tracking-wide">
                {t('messages.conversations')}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-8 text-center text-textSecondary dark:text-gray-400 text-sm">
                  {t('common.loading')}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-textSecondary dark:text-gray-400 text-sm">
                  {t('messages.noConversations')}
                </div>
              ) : (
                conversations.map((conv, idx) => (
                  <div
                    key={idx}
                    onClick={() => openConversation(conv)}
                    className={`flex items-start gap-3 p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors ${
                      isActive(conv)
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                      conv.isPoolEmail ? 'bg-purple-500' : conv.isWhatsApp ? 'bg-green-500' : 'bg-teal-500'
                    }`}>
                      {conv.isPoolEmail ? '📧' : conv.isWhatsApp ? '📱' : conv.otherUserName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-medium truncate ${
                          conv.unreadCount > 0
                            ? 'text-textPrimary dark:text-gray-100'
                            : 'text-textSecondary dark:text-gray-300'
                        }`}>
                          {conv.otherUserName}
                          {conv.isWhatsApp && (
                            <span className="ml-1 text-xs text-green-600 dark:text-green-400">📱</span>
                          )}
                        </span>
                        <span className="text-xs text-textSecondary dark:text-gray-400 whitespace-nowrap ml-2">
                          {conv.lastMessageTime.split(',')[0]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-textSecondary dark:text-gray-400 truncate flex-1">
                          {conv.lastMessagePreview}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel — Chat view */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      activeConversation.isPoolEmail ? 'bg-purple-500' : activeConversation.isWhatsApp ? 'bg-green-500' : 'bg-teal-500'
                    }`}>
                      {activeConversation.isPoolEmail
                        ? '📧'
                        : activeConversation.isWhatsApp
                        ? '📱'
                        : activeConversation.otherUserName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-textPrimary dark:text-gray-100">
                        {activeConversation.otherUserName}
                      </h3>
                      {activeConversation.isPoolEmail && (
                        <span className="text-xs text-purple-600 dark:text-purple-400">Pool E-Mail</span>
                      )}
                      {activeConversation.isWhatsApp && !activeConversation.isPoolEmail && (
                        <span className="text-xs text-green-600 dark:text-green-400">WhatsApp</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingChat ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-textSecondary dark:text-gray-400">{t('common.loading')}</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-textSecondary dark:text-gray-400">
                        <div className="text-4xl mb-3">💬</div>
                        <p className="text-sm">{t('messages.startConversation')}</p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                            msg.isMine
                              ? msg.isWhatsApp ? 'bg-green-500 text-white rounded-br-sm' : 'bg-teal-500 text-white rounded-br-sm'
                              : msg.isWhatsApp
                                ? 'bg-green-50 dark:bg-green-900/20 text-textPrimary dark:text-gray-100 rounded-bl-sm border border-green-200 dark:border-green-800'
                                : 'bg-white dark:bg-gray-700 text-textPrimary dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600'
                          }`}
                        >
                          {!msg.isMine && (
                            <p className="text-xs font-semibold mb-1 text-teal-600 dark:text-teal-400">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${msg.isMine ? (msg.isWhatsApp ? 'text-green-100' : 'text-teal-100') : 'text-textSecondary dark:text-gray-400'}`}>
                            <span className="text-xs">{msg.timestamp.split(',')[1]?.trim() || msg.timestamp}</span>
                            {msg.isWhatsApp && (
                              <span className="text-xs" title="WhatsApp">📱</span>
                            )}
                            {msg.isMine && (
                              <span className="text-xs">{msg.isRead ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                {activeConversation.isPoolEmail ? (
                  <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-3 flex-shrink-0 text-center">
                    <p className="text-xs text-textSecondary dark:text-gray-400">
                      📧 {t('messages.poolEmailReadOnly')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
                    <form onSubmit={handleSendChatMessage} className="flex items-end gap-3">
                      <textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                            handleSendChatMessage(fakeEvent);
                          }
                        }}
                        placeholder={t('messages.typeMessage')}
                        rows={1}
                        disabled={sending}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-2xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        style={{ maxHeight: '120px', overflowY: 'auto' }}
                      />
                      <button
                        type="submit"
                        disabled={sending || !chatInput.trim()}
                        className="w-10 h-10 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                        title={t('messages.send')}
                      >
                        {sending ? (
                          <span className="text-xs">…</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-textSecondary dark:text-gray-400">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-medium dark:text-gray-300">{t('messages.selectConversation')}</p>
                  <p className="text-sm mt-1">{t('messages.selectConversationHint')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Chat compose modal */}
      <Dialog.Root open={showComposeModal} onOpenChange={setShowComposeModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">{t('messages.newChat')}</h2>
            </Dialog.Title>

            <form onSubmit={handleCompose} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">{t('messages.to')} *</label>
                <Combobox value={selectedUser} onChange={setSelectedUser}>
                  <div className="relative">
                    <Combobox.Input
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder={t('messages.recipientPlaceholder')}
                      displayValue={(user: User | null) => user ? (user.fullName || `${user.firstName} ${user.lastName}`) : ''}
                      onChange={e => setUserQuery(e.target.value)}
                      disabled={composeSending}
                    />
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      afterLeave={() => setUserQuery('')}
                    >
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600">
                        {searchResults.length === 0 && userQuery !== '' ? (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{t('messages.noUsersFound')}</div>
                        ) : (
                          searchResults.map(user => (
                            <Combobox.Option
                              key={user.id}
                              value={user}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-teal-500 text-white' : 'text-gray-900 dark:text-gray-100'}`
                              }
                            >
                              {({ selected, active }) => (
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{getProfileIcon(user.gender)}</span>
                                  <div className="flex-1">
                                    <div className={`font-medium ${selected ? 'font-bold' : ''}`}>
                                      {user.fullName || `${user.firstName} ${user.lastName}`}
                                    </div>
                                    <div className={`text-xs ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">{t('messages.subject')}</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  disabled={composeSending}
                  placeholder={t('messages.subjectPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">{t('messages.message')} *</label>
                <textarea
                  value={composeContent}
                  onChange={e => setComposeContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={5}
                  required
                  disabled={composeSending}
                  placeholder={t('messages.messagePlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex-1 btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    disabled={composeSending}
                  >
                    {t('common.cancel')}
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="flex-1 btn-primary bg-teal-500 hover:bg-teal-600"
                  disabled={composeSending}
                >
                  {composeSending ? t('messages.sending') : t('messages.send')}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
