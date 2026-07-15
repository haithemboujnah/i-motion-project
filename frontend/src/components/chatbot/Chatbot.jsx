import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaTimes, FaPaperPlane, FaRobot, FaUser, 
  FaSpinner, FaTrash, FaEdit, FaCheck, FaTimesCircle,
  FaBars, FaChevronLeft, FaRegClock, FaSmile
} from 'react-icons/fa';
import { chatbotService } from '../../services/chatbotService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const user = authService.getUser();

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await chatbotService.getConversations();
      if (response.success) {
        setConversations(response.data.conversations || []);
        
        // Sélectionner la première conversation ou en créer une
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
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback: créer une conversation locale
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
    
    // Ajouter le message localement
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
        // Ajouter le message du bot
        setMessages(prev => [...prev, {
          id: response.data.bot_message?.id || Date.now() + 1,
          sender: 'bot',
          message: response.data.response?.message || response.data.bot_message?.message,
          intent: response.data.response?.intent,
          confidence: response.data.response?.confidence,
          created_at: response.data.bot_message?.created_at || new Date().toISOString()
        }]);

        // Mettre à jour la conversation dans la liste
        if (response.data.conversation_id) {
          const updatedConv = {
            ...currentConversation,
            id: response.data.conversation_id,
            updated_at: new Date().toISOString()
          };
          setCurrentConversation(updatedConv);
          
          // Mettre à jour la liste des conversations
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === response.data.conversation_id);
            if (index > -1) {
              const newList = [...prev];
              newList[index] = updatedConv;
              // Déplacer en haut
              newList.unshift(newList.splice(index, 1)[0]);
              return newList;
            }
            return [updatedConv, ...prev];
          });
        }
      } else {
        toast.error('Erreur lors de la réponse du chatbot');
        // Supprimer le message utilisateur temporaire
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-[#57a1ce] to-[#afadb3] shadow-lg shadow-[#57a1ce]/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#57a1ce] to-[#afadb3] animate-pulse opacity-75"></div>
        <FaRobot className="text-white text-3xl relative z-10 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden"
      >
        {/* Sidebar - Style ChatGPT */}
        <div className={`${showSidebar ? 'w-72' : 'w-0'} bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaRobot className="text-[#57a1ce] text-xl" />
              <h2 className="font-semibold text-gray-800">Conversations</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createNewConversation}
                className="p-2 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1"
              >
                <FaPlus size={12} />
                Nouveau
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition lg:hidden"
              >
                <FaChevronLeft size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group p-3 rounded-lg cursor-pointer transition ${
                  currentConversation?.id === conv.id
                    ? 'bg-[#57a1ce]/10 text-[#57a1ce]'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  setCurrentConversation(conv);
                  loadMessages(conv.id);
                }}
              >
                <div className="flex items-center justify-between">
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSave(conv.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleRenameSave(conv.id)}
                        className="p-1 hover:bg-green-100 rounded"
                      >
                        <FaCheck size={12} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <FaTimes size={12} className="text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        {conv.last_message && (
                          <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(conv.updated_at)}
                          {conv.message_count > 0 && (
                            <span className="ml-2">• {conv.message_count} messages</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => handleRenameStart(e, conv)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Renommer"
                        >
                          <FaEdit size={12} className="text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Supprimer"
                        >
                          <FaTrash size={12} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FaRobot className="text-4xl mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune conversation</p>
                <button
                  onClick={createNewConversation}
                  className="mt-2 text-[#57a1ce] hover:underline text-sm"
                >
                  Commencer une nouvelle conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col">
          {/* En-tête */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden"
                >
                  <FaBars size={18} />
                </button>
              )}
              <div>
                <h3 className="font-semibold text-gray-800">
                  {currentConversation?.title || 'Nouvelle conversation'}
                </h3>
                <p className="text-xs text-gray-400">
                  {messages.length} messages • {currentConversation?.message_count || 0} total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                En ligne
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <FaRobot className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700">
                    Comment puis-je vous aider ?
                  </h3>
                  <p className="text-gray-400 mt-2">
                    Posez-moi une question sur vos séances, programmes ou performances
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition"
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
                  <div className={`flex items-start gap-3 max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user' 
                        ? 'bg-[#57a1ce] text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {msg.sender === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl ${
                        msg.sender === 'user' 
                          ? 'bg-[#57a1ce] text-white rounded-br-none' 
                          : 'bg-white border border-gray-200 shadow-sm rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        {msg.confidence && msg.confidence > 0 && msg.sender === 'bot' && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] opacity-70">
                              {msg.confidence > 0.7 ? '🤖' : '📝'} 
                              {Math.round(msg.confidence * 100)}%
                            </span>
                            {msg.intent && (
                              <span className="text-[10px] opacity-50">• {msg.intent}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 px-1">
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
                  <div className="flex items-center gap-2 bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#57a1ce] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#57a1ce] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#57a1ce] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm text-gray-500">Je réfléchis...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message..."
                  rows="1"
                  className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent text-sm resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
                {input && (
                  <button
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimesCircle size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#57a1ce] to-[#afadb3] text-white font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaPaperPlane size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Chatbot;