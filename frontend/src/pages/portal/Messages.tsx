import { useState, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Sidebar from '../../components/Sidebar';
import { messagesAPI, authAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import apiClient from '../../services/api';

interface Message {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  unread: boolean;
  isPoolEmail?: boolean;
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
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientUserId: 0, subject: '', content: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchMessages();
  }, []);

  useEffect(() => {
    // Search users as user types
    if (userQuery.length > 1) {
      const searchUsers = async () => {
        try {
          const response = await apiClient.get(`/users/search?query=${encodeURIComponent(userQuery)}`);
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        }
      };
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [userQuery]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data);
      // Fetch all users for compose modal (if not client)
      if (response.data.role !== 'Client') {
        // TODO: Add endpoint to get all users
        // For now, we'll handle this in the compose modal
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await messagesAPI.getAll();
      const messagesData = Array.isArray(response.data) ? response.data : [];
      const transformedMessages = messagesData.map((m: any) => ({
        id: m.id,
        sender: m.sender,
        subject: m.subject,
        preview: m.preview,
        body: m.body,
        timestamp: new Date(m.timestamp).toLocaleString('de-DE'),
        unread: m.unread,
        isPoolEmail: m.isPoolEmail || false,
      }));
      setMessages(transformedMessages);
      if (transformedMessages.length > 0 && !selectedMessage) {
        setSelectedMessage(transformedMessages[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (id: number) => {
    setSelectedMessage(id);
    try {
      // Fetch full message details and mark as read
      const response = await messagesAPI.getById(id);
      const fullMessage = response.data;
      // Update message in list
      setMessages(prev => prev.map(m => 
        m.id === id ? {
          ...m,
          body: fullMessage.body,
          unread: false,
        } : m
      ));
    } catch (error) {
      console.error('Error fetching message:', error);
    }
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Bitte wählen Sie einen Empfänger aus');
      return;
    }
    setSending(true);
    try {
      await messagesAPI.send({
        recipientUserId: selectedUser.id,
        subject: composeForm.subject,
        content: composeForm.content,
      });
      setShowComposeModal(false);
      setComposeForm({ recipientUserId: 0, subject: '', content: '' });
      setSelectedUser(null);
      setUserQuery('');
      await fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Senden der Nachricht';
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const getProfileIcon = (gender?: string) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '🧑'; // diverse
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;
    setSending(true);
    try {
      await messagesAPI.reply(selectedMessage, replyContent);
      setShowReplyModal(false);
      setReplyContent('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Fehler beim Senden der Antwort');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie diese Nachricht wirklich löschen?')) return;
    try {
      await messagesAPI.delete(id);
      await fetchMessages();
      if (selectedMessage === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Fehler beim Löschen der Nachricht');
    }
  };

  const selectedMsg = messages.find(m => m.id === selectedMessage);
  const isClient = currentUser?.role === 'Client';

  // Filter messages based on active tab
  const filteredMessages = messages; // For now, show all messages in both tabs

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100 mb-2">Nachrichten</h1>
          <p className="text-textSecondary dark:text-gray-400">Kommunikation und Benachrichtigungen</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              {!isClient && (
                <button 
                  onClick={() => setShowComposeModal(true)}
                  className="btn-primary"
                >
                  ✏️ Neue Nachricht
                </button>
              )}
              <button className="btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                📧 Alle als gelesen markieren
              </button>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Nachrichten durchsuchen..."
                className="flex-1 md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Gesamt</p>
            <p className="text-2xl font-bold text-primary dark:text-blue-400">{messages.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Ungelesen</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{messages.filter(m => m.unread).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Pool E-Mails</p>
            <p className="text-2xl font-bold text-primary dark:text-blue-400">{messages.filter(m => m.isPoolEmail).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Diese Woche</p>
            <p className="text-2xl font-bold text-primary dark:text-blue-400">5</p>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-secondary dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="font-semibold text-textPrimary dark:text-gray-100">Posteingang</h2>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-textSecondary dark:text-gray-400">Lädt...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-textSecondary dark:text-gray-400">Keine Nachrichten</div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedMessage === message.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary'
                        : 'hover:bg-secondary dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {message.unread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                        {message.isPoolEmail && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">
                            📧 Pool
                          </span>
                        )}
                        <h3 className={`font-medium text-sm flex-1 ${message.unread ? 'text-textPrimary dark:text-gray-100' : 'text-textSecondary dark:text-gray-400'}`}>
                          {message.sender}
                        </h3>
                      </div>
                      <span className="text-xs text-textSecondary dark:text-gray-400 whitespace-nowrap ml-2">
                        {message.timestamp.split(',')[0]}
                      </span>
                    </div>
                    
                    <h4 className={`text-sm mb-1 ${message.unread ? 'font-semibold dark:text-gray-100' : 'font-normal dark:text-gray-300'}`}>
                      {message.subject}
                    </h4>
                    
                    <p className="text-xs text-textSecondary dark:text-gray-400 line-clamp-2">
                      {message.preview}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Preview */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {selectedMsg ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">
                        {selectedMsg.subject}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-textSecondary dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                            {selectedMsg.sender.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium dark:text-gray-300">{selectedMsg.sender}</span>
                        </div>
                        <span>{selectedMsg.timestamp}</span>
                        {selectedMsg.isPoolEmail && (
                          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs">
                            📧 Pool E-Mail
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowReplyModal(true)}
                        className="p-2 hover:bg-secondary dark:hover:bg-gray-700 rounded" 
                        title="Antworten"
                      >
                        ↩️
                      </button>
                      <button 
                        onClick={() => handleDelete(selectedMsg.id)}
                        className="p-2 hover:bg-secondary dark:hover:bg-gray-700 rounded" 
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-textPrimary dark:text-gray-300">
                    {selectedMsg.body}
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setShowReplyModal(true)}
                    className="btn-primary"
                  >
                    Antworten
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">✉️</div>
                  <p className="text-textSecondary dark:text-gray-400">Wählen Sie eine Nachricht aus</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        <Dialog.Root open={showComposeModal} onOpenChange={setShowComposeModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">Neue Nachricht</h2>
              </Dialog.Title>
              
              <form onSubmit={handleCompose} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">An *</label>
                  <Combobox value={selectedUser} onChange={setSelectedUser}>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Name oder E-Mail eingeben..."
                        displayValue={(user: User | null) => user?.fullName || user ? `${user.firstName} ${user.lastName}` : ''}
                        onChange={(event) => setUserQuery(event.target.value)}
                        disabled={sending}
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
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Keine Benutzer gefunden</div>
                          ) : (
                            searchResults.map((user) => (
                              <Combobox.Option
                                key={user.id}
                                value={user}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 px-4 ${
                                    active ? 'bg-primary text-white' : 'text-gray-900 dark:text-gray-100'
                                  }`
                                }
                              >
                                {({ selected }) => (
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
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Betreff *</label>
                  <input
                    type="text"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={sending}
                    placeholder="Betreff eingeben"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Nachricht *</label>
                  <textarea
                    value={composeForm.content}
                    onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={8}
                    required
                    disabled={sending}
                    placeholder="Ihre Nachricht..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      disabled={sending}
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={sending}
                  >
                    {sending ? 'Wird gesendet...' : 'Senden'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Reply Modal */}
        <Dialog.Root open={showReplyModal} onOpenChange={setShowReplyModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">Antworten</h2>
              </Dialog.Title>
              
              <form onSubmit={handleReply} className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">An: {selectedMsg?.sender}</p>
                  <p className="text-sm text-textSecondary dark:text-gray-400">Betreff: Re: {selectedMsg?.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Antwort *</label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={8}
                    required
                    disabled={sending}
                    placeholder="Ihre Antwort..."
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm text-textSecondary dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  <p className="font-medium mb-2">Ursprüngliche Nachricht:</p>
                  <p className="whitespace-pre-wrap">{selectedMsg?.body}</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      disabled={sending}
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={sending}
                  >
                    {sending ? 'Wird gesendet...' : 'Antwort senden'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </main>
    </div>
  );
}
