import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { ChatMessage, GroundingLink } from '../types';
import { generateChatResponse, generateSpeech } from '../services/geminiService';
import { Button } from './Button';

interface ChatInterfaceProps {
  initialContextImage?: string;
  currentStyle?: string;
  onUpdateDesignRequest: (prompt: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  initialContextImage, 
  currentStyle,
  onUpdateDesignRequest 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<GroundingLink[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      setMessages([{
        id: 'init',
        role: 'model',
        text: "Hi! I'm Lumina. I can help refine this design or find furniture items for you. What do you think of this look?",
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Check if user is asking for a visual change
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('change') || lowerInput.includes('make') || lowerInput.includes('replace') || lowerInput.includes('add')) {
         onUpdateDesignRequest(input);
      }

      // Generate text response
      const response = await generateChatResponse(
        messages.map(m => ({ role: m.role, text: m.text })),
        input,
        initialContextImage,
        currentStyle
      );

      // Extract search links if any
      const links: GroundingLink[] = [];
      if (response.groundingLinks) {
          response.groundingLinks.forEach((chunk: any) => {
             if (chunk.web?.uri && chunk.web?.title) {
                 links.push({ title: chunk.web.title, url: chunk.web.uri });
             }
          });
      }
      setGroundingLinks(links);

      // Generate Audio for the response
      const audioUrl = await generateSpeech(response.text);

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        audioUrl,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting to the design studio right now. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const playAudio = (url: string, id: string) => {
    if (playingAudioId === id && audioRef.current) {
        audioRef.current.pause();
        setPlayingAudioId(null);
        return;
    }

    if (audioRef.current) {
        audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingAudioId(id);
    audio.onended = () => setPlayingAudioId(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold flex items-center text-white">
          <Sparkles className="w-5 h-5 mr-2 text-brand-400" />
          Design Assistant
        </h3>
        <p className="text-xs text-gray-400 mt-1">
            Refine designs or ask for shopping links.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-br-none' 
                  : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {msg.role === 'model' && msg.audioUrl && (
                <button 
                  onClick={() => playAudio(msg.audioUrl!, msg.id)}
                  className="mt-3 flex items-center text-xs text-brand-300 hover:text-brand-200 transition-colors bg-gray-900/30 px-2 py-1.5 rounded-full w-fit"
                >
                  <Volume2 className={`w-3 h-3 mr-1.5 ${playingAudioId === msg.id ? 'animate-pulse text-brand-400' : ''}`} />
                  {playingAudioId === msg.id ? 'Listening...' : 'Listen'}
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-none p-3 border border-gray-700">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            </div>
          </div>
        )}
      </div>

      {/* Shoppable Links Area (Context Sensitive) */}
      {groundingLinks.length > 0 && (
          <div className="bg-gray-800/50 p-3 border-t border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shopping Suggestions</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {groundingLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center flex-shrink-0 bg-gray-900 border border-gray-700 hover:border-brand-500 rounded-lg p-2 text-xs transition-colors max-w-[200px]"
                      >
                          <ExternalLink className="w-3 h-3 mr-1.5 text-brand-400" />
                          <span className="truncate">{link.title}</span>
                      </a>
                  ))}
              </div>
          </div>
      )}

      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type 'Make the rug blue'..."
            className="w-full bg-gray-800 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-12 scrollbar-hide"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-brand-500 rounded-lg text-white hover:bg-brand-400 disabled:opacity-50 disabled:hover:bg-brand-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};