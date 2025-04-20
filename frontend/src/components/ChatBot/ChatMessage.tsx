import { FC, MouseEvent, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import Collapsible from './Collapsible';

// Source object structure that comes from the backend
interface Source {
  num: number;
  file: string;
  url: string;
  chunkId?: string;
}

// Updated Message interface to include sources
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Source[];
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  // Function to handle citation clicks
  const handleCitationClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'SUP' && target.dataset.sourceNum) {
      const sourceNum = Number.parseInt(target.dataset.sourceNum, 10);
      const source = message.sources?.find(s => s.num === sourceNum);
      if (source?.url) {
        window.open(source.url, '_blank');
      }
    }
  };
  
  // Function to handle citation keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'SUP' && target.dataset.sourceNum) {
        e.preventDefault();
        const sourceNum = Number.parseInt(target.dataset.sourceNum, 10);
        const source = message.sources?.find(s => s.num === sourceNum);
        if (source?.url) {
          window.open(source.url, '_blank');
        }
      }
    }
  };
  
  // Format text with citation markers
  const formatMessage = (text: string) => {
    // Replace markdown citation syntax [^1] with HTML superscript
    const formattedText = text.replace(/\[\^(\d+)\]/g, (_, num) => {
      const source = message.sources?.find(s => s.num === Number.parseInt(num, 10));
      if (source?.url) {
        return `<sup class="text-blue-600 cursor-pointer" data-source-num="${num}">[${num}]</sup>`;
      }
      return `<sup>[${num}]</sup>`;
    });
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: formattedText }}
        onClick={handleCitationClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      />
    );
  };
  
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
          <Collapsible title="Sources / context">
            <ul className="text-xs list-disc pl-4">
              {message.sources.map(source => (
                <li key={source.num}>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    [{source.num}] {source.file}
                  </a>
                </li>
              ))}
            </ul>
          </Collapsible>
        )}
        
        {/* Message content */}
        <div className="text-sm">
          {isBot ? formatMessage(message.text) : message.text}
        </div>
        
        <p className="text-xs mt-1 opacity-70">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;