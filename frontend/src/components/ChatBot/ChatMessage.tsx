import * as React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Collapsible from './Collapsible';
import './markdown-styles.css';

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

// Updated Message interface to include sources and context
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Source[];
  context?: Context[];
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  // Function to handle citation clicks (wrapped in useCallback to maintain referential stability)
  const handleCitationClick = React.useCallback((sourceId: string): void => {
    const source = message.sources?.find(s => s.id === sourceId);
    if (source?.url) {
      window.open(source.url, '_blank');
    }
  }, [message.sources]);
  
  // Add click handler for citations after the markdown renders
  const markdownRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!markdownRef.current || !isBot) return;
    
    // Find all citation elements and add click handlers
    const citations = markdownRef.current.querySelectorAll('sup');
    for (const citation of Array.from(citations)) {
      const text = citation.textContent;
      if (!text) return;
      
      const match = text.match(/\[(\d+)\]/);
      if (match) {
        const sourceId = match[1];
        const source = message.sources?.find(s => s.id === sourceId);
        if (source?.url) {
          citation.classList.add('text-blue-600', 'cursor-pointer');
          citation.setAttribute('role', 'button');
          citation.setAttribute('tabindex', '0');
          
          // Create stable event listeners with sourceId closure
          const clickHandler = () => handleCitationClick(sourceId);
          const keydownHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCitationClick(sourceId);
            }
          };
          
          // Add the event listeners
          citation.addEventListener('click', clickHandler);
          citation.addEventListener('keydown', keydownHandler);
          
          // Store the handlers on the element for cleanup
          // Define an interface for the extended HTMLElement
          type ExtendedElement = HTMLElement & {
            _clickHandler?: () => void;
            _keydownHandler?: (e: KeyboardEvent) => void;
          };
          
          const extendedCitation = citation as ExtendedElement;
          extendedCitation._clickHandler = clickHandler;
          extendedCitation._keydownHandler = keydownHandler;
        }
      }
    }
    
    // Cleanup function to remove event listeners
    return () => {
      if (!markdownRef.current) return;
      const citations = markdownRef.current.querySelectorAll('sup');
      for (const citation of Array.from(citations)) {
        // Use the extended element type
        const extendedCitation = citation as HTMLElement & {
          _clickHandler?: () => void;
          _keydownHandler?: (e: KeyboardEvent) => void;
        };
        
        const clickHandler = extendedCitation._clickHandler;
        const keydownHandler = extendedCitation._keydownHandler;
        
        if (clickHandler) citation.removeEventListener('click', clickHandler);
        if (keydownHandler) citation.removeEventListener('keydown', keydownHandler);
      }
    };
  }, [isBot, message.sources, handleCitationClick]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[85%] rounded-lg p-3 ${isBot ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'}`}
      >
        {/* Sources list for bot messages */}
        {isBot && message.sources && message.sources.length > 0 && (
          <Collapsible title="Sources">
            <ul className="text-xs list-disc pl-4">
              {message.sources.map(source => (
                <li key={source.id}>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    [{source.id}] {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </Collapsible>
        )}
        
        {/* Context for bot messages */}
        {isBot && message.context && message.context.length > 0 && (
          <Collapsible title="Context">
            <div className="text-xs bg-gray-50 p-2 rounded-md max-h-60 overflow-auto">
              {message.context.map(ctx => (
                <div key={ctx.id} className="mb-2 border-b border-gray-200 pb-2">
                  <div className="font-semibold">[{ctx.id}]</div>
                  <div>{ctx.text}</div>
                </div>
              ))}
            </div>
          </Collapsible>
        )}
        
        {/* Message content */}
        <div className="text-sm">
          {isBot ? (
            <div ref={markdownRef} className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            </div>
          ) : (
            message.text
          )}
        </div>
        
        <p className="text-xs mt-1 opacity-70">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;