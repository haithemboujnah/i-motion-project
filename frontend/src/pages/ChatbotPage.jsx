import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaTimes, FaPaperPlane, FaRobot, FaUser, 
  FaSpinner, FaTrash, FaEdit, FaCheck, FaTimesCircle,
  FaChevronLeft, FaRegClock, FaSmile, FaBars,
  FaHome, FaComment, FaHistory
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/adherent/AdherentNavbar';
import Sidebar from '../components/adherent/AdherentSidebar';
import { chatbotService } from '../services/chatbotService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const ChatbotPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const user = authService.getUser();
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadConversations();
    loadSuggestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await chatbotService.getConversations();
      if (response.success) {
        setConversations(response.data.conversations || []);
        
        if (response.data.conversations?.length > 0) {
          const firstConv = response.data.conversations[0];
          setCurrentConversation(firstConv);
          loadMessages(firstConv.id);
        } else {
          createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      createNewConversation();
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await chatbotService.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data.messages || []);
        setCurrentConversation(response.data.conversation);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await chatbotService.createConversation();
      if (response.success) {
        const newConv = response.data.conversation;
        setConversations([newConv, ...conversations]);
        setCurrentConversation(newConv);
        setMessages([]);
        if (isMobile) {
          setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      const localConv = {
        id: Date.now(),
        title: 'Nouvelle conversation',
        created_at: new Date().toISOString()
      };
      setConversations([localConv, ...conversations]);
      setCurrentConversation(localConv);
      setMessages([]);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await chatbotService.getSuggestions();
      if (response.success) {
        setSuggestions(response.data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      message: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    setIsLoading(true);
    setIsTyping(true);

    try {
      const context = {
        first_name: user?.first_name || 'Cher adhérent',
        last_message: userMessage
      };

      const response = await chatbotService.sendMessage(
        userMessage,
        currentConversation?.id,
        context
      );
      
      setIsTyping(false);
      
      if (response.success) {
        setMessages(prev => [...prev, {
          id: response.data.bot_message?.id || Date.now() + 1,
          sender: 'bot',
          message: response.data.response?.message || response.data.bot_message?.message,
          intent: response.data.response?.intent,
          confidence: response.data.response?.confidence,
          created_at: response.data.bot_message?.created_at || new Date().toISOString()
        }]);

        if (response.data.conversation_id) {
          const updatedConv = {
            ...currentConversation,
            id: response.data.conversation_id,
            updated_at: new Date().toISOString()
          };
          setCurrentConversation(updatedConv);
          
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === response.data.conversation_id);
            if (index > -1) {
              const newList = [...prev];
              newList[index] = updatedConv;
              newList.unshift(newList.splice(index, 1)[0]);
              return newList;
            }
            return [updatedConv, ...prev];
          });
        }
      } else {
        toast.error('Erreur lors de la réponse du chatbot');
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast.error('Erreur de communication');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer cette conversation ?')) return;
    
    try {
      const response = await chatbotService.deleteConversation(convId);
      if (response.success) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (currentConversation?.id === convId) {
          const remaining = conversations.filter(c => c.id !== convId);
          if (remaining.length > 0) {
            setCurrentConversation(remaining[0]);
            loadMessages(remaining[0].id);
          } else {
            createNewConversation();
          }
        }
        toast.success('Conversation supprimée');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRenameStart = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleRenameSave = async (convId) => {
    if (!editTitle.trim()) return;
    
    try {
      const response = await chatbotService.renameConversation(convId, editTitle.trim());
      if (response.success) {
        setConversations(prev => prev.map(c => 
          c.id === convId ? { ...c, title: editTitle.trim() } : c
        ));
        if (currentConversation?.id === convId) {
          setCurrentConversation({ ...currentConversation, title: editTitle.trim() });
        }
        toast.success('Conversation renommée');
      }
    } catch (error) {
      toast.error('Erreur lors du renommage');
    }
    setEditingId(null);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Navbar />
      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-dark-secondary">
          {/* En-tête de la page */}
          <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FaRobot className="text-[#57a1ce]" />
                Assistant I-Motion
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                En ligne
              </span>
              <button
                onClick={createNewConversation}
                className="btn-logo text-sm flex items-center gap-2"
              >
                <FaPlus /> Nouvelle conversation
              </button>
            </div>
          </div>

          {/* Corps principal avec sidebar et chat */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar conversations - Dark Mode */}
            <div className={`${
              showSidebar ? 'w-72' : 'w-0'
            } bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col overflow-hidden flex-shrink-0`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FaHistory className="text-[#57a1ce]" />
                  Historique
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">{conversations.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg cursor-pointer transition ${
                      currentConversation?.id === conv.id
                        ? 'bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20 text-[#57a1ce]'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setCurrentConversation(conv);
                      loadMessages(conv.id);
                      if (isMobile) setShowSidebar(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {editingId === conv.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-[#57a1ce] dark:bg-dark-secondary dark:text-white"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameSave(conv.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleRenameSave(conv.id)}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                          >
                            <FaCheck size={12} className="text-green-600 dark:text-green-400" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <FaTimes size={12} className="text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {conv.title}
                            </p>
                            {conv.last_message && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                {conv.last_message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {formatDate(conv.updated_at)}
                              {conv.message_count > 0 && (
                                <span className="ml-2">• {conv.message_count} messages</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => handleRenameStart(e, conv)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              title="Renommer"
                            >
                              <FaEdit size={12} className="text-gray-400 dark:text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              title="Supprimer"
                            >
                              <FaTrash size={12} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <FaComment className="text-4xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune conversation</p>
                    <button
                      onClick={createNewConversation}
                      className="mt-2 text-[#57a1ce] hover:underline text-sm"
                    >
                      Démarrer une conversation
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Zone de chat - Dark Mode */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-secondary">
              {/* Bouton toggle sidebar mobile */}
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-dark-card rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition lg:hidden"
                >
                  <FaBars className="text-gray-600 dark:text-gray-400" />
                </button>
              )}

              {/* Messages - Dark Mode */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-24 h-24 mx-auto bg-gradient-to-r from-[#57a1ce] to-[#afadb3] rounded-full flex items-center justify-center shadow-lg mb-4">
                        <FaRobot className="text-white text-4xl" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                        Comment puis-je vous aider ?
                      </h3>
                      <p className="text-gray-400 dark:text-gray-500 mt-2 max-w-md mx-auto">
                        Posez-moi une question sur vos séances, programmes, performances ou toute autre chose concernant I-Motion.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-2xl mx-auto">
                        {suggestions.slice(0, 6).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-[#57a1ce] transition shadow-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'user' 
                            ? 'bg-gradient-to-r from-[#57a1ce] to-[#3d7fa8] text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {msg.sender === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
                        </div>
                        <div>
                          <div className={`p-4 rounded-2xl ${
                            msg.sender === 'user' 
                              ? 'bg-gradient-to-r from-[#57a1ce] to-[#3d7fa8] text-white rounded-br-none shadow-md' 
                              : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-sm rounded-bl-none'
                          }`}>
                            <p className={`text-sm whitespace-pre-wrap ${
                              msg.sender === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {msg.message}
                            </p>
                            {msg.confidence && msg.confidence > 0 && msg.sender === 'bot' && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[10px] opacity-70 text-gray-600 dark:text-gray-400">
                                  {msg.confidence > 0.7 ? '🤖' : '📝'} 
                                  {Math.round(msg.confidence * 100)}%
                                </span>
                                {msg.intent && (
                                  <span className="text-[10px] opacity-50 text-gray-500 dark:text-gray-500">• {msg.intent}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 flex items-center gap-1">
                            <FaRegClock size={10} />
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-3 rounded-2xl rounded-bl-none shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-[#57a1ce] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-[#57a1ce] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-[#57a1ce] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Je réfléchis...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input - Dark Mode */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez votre message..."
                      rows="1"
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent text-sm resize-none transition bg-white dark:bg-dark-secondary text-gray-800 dark:text-gray-200"
                      style={{ minHeight: '50px', maxHeight: '150px' }}
                      disabled={isLoading}
                    />
                    {input && (
                      <button
                        onClick={() => setInput('')}
                        className="absolute right-3 bottom-1/2 translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                      >
                        <FaTimesCircle size={18} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#57a1ce] to-[#afadb3] text-white font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
                  L'assistant peut faire des erreurs. Vérifiez les informations importantes.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatbotPage;