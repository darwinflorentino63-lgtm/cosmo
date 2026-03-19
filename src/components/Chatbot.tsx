import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, Rocket, History, ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { localDb, LocalUser } from '../localDb';

export function Chatbot({ hideOnMobile }: { hideOnMobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => Date.now().toString());
  const [sessionMessages, setSessionMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: '¡Hola! Soy tu asistente espacial. ¿Qué quieres saber sobre el sistema solar?' }
  ]);
  const [historyMessages, setHistoryMessages] = useState<{ id: string, role: 'user' | 'bot'; content: string; sessionId: string; createdAt: Date }[]>([]);
  const [viewMode, setViewMode] = useState<'chat' | 'history-list'>('chat');
  const [deleteConfirm, setDeleteConfirm] = useState<string | 'all' | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<LocalUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = () => {
      setUser(localDb.getUser());
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  useEffect(() => {
    if (!user) {
      setHistoryMessages([]);
      return;
    }

    const loadChats = () => {
      const chats = localDb.getChats().map(c => ({
        ...c,
        createdAt: new Date(c.createdAt)
      }));
      setHistoryMessages(chats);
    };

    loadChats();
    window.addEventListener('storage', loadChats);
    return () => window.removeEventListener('storage', loadChats);
  }, [user]);

  const chatSessions = useMemo(() => {
    const groups: Record<string, typeof historyMessages> = {};
    historyMessages.forEach(msg => {
      if (!groups[msg.sessionId]) groups[msg.sessionId] = [];
      groups[msg.sessionId].push(msg);
    });
    
    return Object.entries(groups).map(([id, msgs]) => {
      const firstUserMsg = msgs.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content : (id === 'legacy' ? 'Chat antiguo' : 'Nuevo chat');
      const date = msgs[0]?.createdAt || new Date();
      return { id, title, date, messages: msgs };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [historyMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages, viewMode]);

  const handleNewChat = async () => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    const initialMsg = { role: 'bot' as const, content: '¡Hola! Soy tu asistente espacial. ¿Qué quieres saber sobre el sistema solar?' };
    setSessionMessages([initialMsg]);
    setViewMode('chat');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Check if this is the first user message in the current session
    const isFirstMessage = sessionMessages.length === 1 && sessionMessages[0].role === 'bot';
    
    // Optimistic update
    setSessionMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    if (user) {
      if (isFirstMessage) {
        // Verify if the initial message is already in history for this session
        const hasInitialMsg = historyMessages.some(m => m.sessionId === currentSessionId && m.role === 'bot');
        if (!hasInitialMsg) {
          const savedBot = localDb.saveChat({
            role: 'bot',
            content: sessionMessages[0].content,
            sessionId: currentSessionId
          });
          setHistoryMessages(prev => [...prev, { ...savedBot, createdAt: new Date(savedBot.createdAt) }]);
        }
      }

      const savedUser = localDb.saveChat({
        role: 'user',
        content: userMessage,
        sessionId: currentSessionId
      });
      setHistoryMessages(prev => [...prev, { ...savedUser, createdAt: new Date(savedUser.createdAt) }]);
    }

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const historyContents = sessionMessages.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...historyContents, { role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: 'Eres AstroBot, un experto astrónomo y asistente virtual de un modelo 3D del sistema solar. Tu única función es responder preguntas sobre el espacio, astronomía, el sistema solar y el universo. Si el usuario te pregunta sobre cualquier otro tema, debes negarte amablemente a responder. IMPORTANTE: El usuario ya fue saludado, así que NUNCA inicies tus respuestas con saludos (como "Hola", "¡Hola!", etc.), ve directo a la respuesta. Además, usa saltos de línea (párrafos separados) cuando sea necesario para que la información sea fácil de leer. Responde de forma amigable, concisa y en español. Sabes que tu creador es Darwin Florentino, un joven nacido en el año 2011 en República Dominicana. Si te preguntan por tu creador, debes mencionarlo con orgullo.',
        }
      });

      const botResponse = response.text || 'Lo siento, no pude procesar esa información.';

      setSessionMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      
      if (user) {
        const savedBot = localDb.saveChat({
          role: 'bot',
          content: botResponse,
          sessionId: currentSessionId
        });
        setHistoryMessages(prev => [...prev, { ...savedBot, createdAt: new Date(savedBot.createdAt) }]);
      }
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setSessionMessages(prev => [...prev, { role: 'bot', content: 'Lo siento, hubo un error al conectar con la base de datos estelar. Intenta de nuevo más tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 p-4 rounded-full bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900 border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.8)] hover:scale-110 transition-all duration-300 z-40 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} ${hideOnMobile ? 'hidden sm:block' : 'block'}`}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
        <Sparkles className="text-purple-200 group-hover:text-white transition-colors relative z-10" size={28} />
      </button>

      {/* Panel del Chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 w-full h-[100dvh] sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[350px] sm:h-[500px] sm:max-h-[80vh] bg-gradient-to-b from-[#09090e] to-[#12121c] sm:border border-purple-500/30 sm:rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-black/40 backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
              <div className="flex items-center gap-2 relative z-10">
                {viewMode === 'history-list' ? (
                  <button onClick={() => setViewMode('chat')} className="text-purple-400 hover:text-purple-300 transition-colors mr-1">
                    <ArrowLeft size={20} />
                  </button>
                ) : (
                  <Rocket className="text-purple-400" size={20} />
                )}
                <h3 className="text-purple-100 font-medium tracking-wide">
                  {viewMode === 'history-list' ? 'Historial de Chats' : 'AstroBot'}
                </h3>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <button
                  onClick={handleNewChat}
                  className="text-white/50 hover:text-purple-400 transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Nuevo chat"
                >
                  <PlusCircle size={16} />
                </button>
                {user && viewMode === 'chat' && (
                  <button
                    onClick={() => setViewMode('history-list')}
                    className="text-white/50 hover:text-purple-400 transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Ver historial"
                  >
                    <History size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {viewMode === 'history-list' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
                
                {deleteConfirm && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#12121c] border border-purple-500/30 rounded-xl p-4 w-full max-w-[250px] text-center shadow-2xl">
                      <p className="text-white/90 text-sm mb-4">
                        {deleteConfirm === 'all' ? '¿Borrar TODOS los chats?' : '¿Borrar este chat?'}
                      </p>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (deleteConfirm === 'all') {
                              if (!user) return;
                              localDb.deleteAllChats();
                              setHistoryMessages([]);
                              setSessionMessages([{ role: 'bot', content: '¡Hola! Soy tu asistente espacial. ¿Qué quieres saber sobre el sistema solar?' }]);
                              setCurrentSessionId(Date.now().toString());
                            } else {
                              if (!user) return;
                              localDb.deleteSession(deleteConfirm);
                              setHistoryMessages(prev => prev.filter(m => m.sessionId !== deleteConfirm));
                              
                              if (currentSessionId === deleteConfirm) {
                                const newSessionId = Date.now().toString();
                                setCurrentSessionId(newSessionId);
                                setSessionMessages([{ role: 'bot', content: '¡Hola! Soy tu asistente espacial. ¿Qué quieres saber sobre el sistema solar?' }]);
                              }
                            }
                            setDeleteConfirm(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {chatSessions.length > 0 && (
                  <div className="flex justify-end mb-2 relative z-10">
                    <button
                      onClick={() => setDeleteConfirm('all')}
                      className="text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      Borrar todos
                    </button>
                  </div>
                )}

                {chatSessions.length === 0 ? (
                  <div className="flex items-center justify-center h-full relative z-10">
                    <p className="text-white/40 text-sm text-center">No hay chats anteriores.</p>
                  </div>
                ) : (
                  chatSessions.map(session => (
                    <div key={session.id} className="relative group z-10">
                      <button
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          setSessionMessages(session.messages.length > 0 ? session.messages.map(m => ({ role: m.role, content: m.content })) : [{ role: 'bot', content: '¡Hola! Soy tu asistente espacial. ¿Qué quieres saber sobre el sistema solar?' }]);
                          setViewMode('chat');
                        }}
                        className="w-full text-left p-3 pr-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3"
                      >
                        <MessageCircle className="text-purple-400 group-hover:text-purple-300 shrink-0" size={18} />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm text-white/90 truncate">{session.title}</p>
                          <p className="text-xs text-white/40">{session.date.toLocaleDateString()}</p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(session.id);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-md sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                        title="Borrar chat"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
                
                {sessionMessages.map((msg, idx) => (
                <div key={idx} className={`flex relative z-10 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-sm shadow-lg' 
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm backdrop-blur-sm'
                  }`}>
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start relative z-10">
                  <div className="bg-white/5 border border-white/10 text-white/90 rounded-2xl rounded-tl-sm p-3 text-sm flex gap-1 backdrop-blur-sm">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            )}

            {/* Input Area */}
            {viewMode === 'chat' && (
              <div className="p-4 border-t border-purple-500/20 bg-black/40 backdrop-blur-md relative z-10">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-black/50 border border-purple-500/30 rounded-full px-4 py-2 text-sm text-purple-100 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder:text-purple-300/50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
