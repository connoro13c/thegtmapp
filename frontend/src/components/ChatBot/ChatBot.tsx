import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

// Source object structure that comes from the backend
interface Source {
  id: string;
  label: string;
  url: string;
}

// Context object structure from the backend
interface Context {
  id: string;
  text: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Source[];
  context?: Context[];
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Add initial welcome message when opening chat
      if (messages.length === 0) {
        const welcomeMessage = 'Hi there! I\'m your GTM Assistant. Ask me anything about Go-to-Market strategies or search your connected documents.';
        
        setMessages([
          {
            id: Date.now().toString(),
            text: welcomeMessage,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      let responseText = '';
      
      // Call API to get bot response
      // Get token from localStorage if available
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch('http://localhost:3002/api/chatbot/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ message: text }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle structured response format from the backend
        if (typeof data === 'object' && data !== null) {
          // Check for the new structured response format (answer/sources/context)
          if (data.answer) {
            responseText = data.answer;
            
            // Create bot message with structured data
            const botMessage: Message = {
              id: Date.now().toString(),
              text: responseText,
              sender: 'bot',
              timestamp: new Date(),
              sources: data.sources || [],
              context: data.context || []
            };
            
            setMessages((prev) => [...prev, botMessage]);
            setIsLoading(false);
            return; // Exit early as we've already handled the message
          }
          // Fallback for text-based format
          if (data.text) {
            responseText = data.text;
            
            // Create bot message with structured data
            const botMessage: Message = {
              id: Date.now().toString(),
              text: responseText,
              sender: 'bot',
              timestamp: new Date(),
              sources: data.sources || []
            };
            
            setMessages((prev) => [...prev, botMessage]);
            setIsLoading(false);
            return; // Exit early as we've already handled the message
          }
          
          if (data.message) {
            // Legacy format (plain string message)
            responseText = data.message;
            return;
          }
          
          responseText = 'Sorry, no response received from server.';
        }
      } catch (error) {
        console.error('Error fetching response:', error);
        responseText = 'Sorry, there was an error connecting to the server. Please try again later.';
      }
      
      // Add bot response
      const botMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, an error occurred. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`bg-white rounded-lg shadow-lg flex flex-col ${
            isExpanded ? 'fixed inset-10 z-50' : 'w-96 h-[500px]'
          }`}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">GTM Assistant</h2>
            <div className="flex space-x-2">
              <button type="button" onClick={toggleExpand} className="text-gray-500 hover:text-gray-700">
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button type="button" onClick={toggleOpen} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex justify-center">
                <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t p-4">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </motion.div>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleOpen}
          className="bg-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <MessageSquare size={24} />
        </motion.button>
      )}
    </div>
  );
};

export default ChatBot;
