import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaRobot, FaRegClock } from 'react-icons/fa';

const ChatbotMessage = ({ message, type, timestamp, suggestions, confidence, intent, onSuggestionClick }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-start gap-2 max-w-[85%] ${type === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          type === 'user' 
            ? 'bg-[#57a1ce] text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {type === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
        </div>
        <div>
          <div className={`p-3 rounded-2xl ${
            type === 'user' 
              ? 'bg-[#57a1ce] text-white rounded-br-none' 
              : 'bg-white shadow-sm rounded-bl-none'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message}</p>
            {confidence !== undefined && confidence > 0 && type === 'bot' && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[10px] opacity-70">
                  {confidence > 0.7 ? '🤖' : '📝'} 
                  {Math.round(confidence * 100)}%
                </span>
                <span className="text-[10px] opacity-50">
                  • {intent}
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
            <FaRegClock size={10} />
            {formatDate(timestamp)}
          </p>
          {suggestions && suggestions.length > 0 && type === 'bot' && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition shadow-sm hover:shadow"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatbotMessage;