'use client';

import { useState, FormEvent, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export default function Home() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string>('');
  const [editingName, setEditingName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active messages from the current chat session
  const activeMessages = useMemo(() => {
    const activeSession = chatSessions.find(
      (session) => session.id === activeChatId
    );
    return activeSession ? activeSession.messages : [];
  }, [chatSessions, activeChatId]);

  // Load chat sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    const savedActiveChatId = localStorage.getItem('activeChatId');

    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map(
          (session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            lastActivity: new Date(session.lastActivity),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })
        );
        setChatSessions(parsedSessions);

        if (
          savedActiveChatId &&
          parsedSessions.find((s: ChatSession) => s.id === savedActiveChatId)
        ) {
          setActiveChatId(savedActiveChatId);
        } else if (parsedSessions.length > 0) {
          setActiveChatId(parsedSessions[0].id);
        } else {
          // Create initial chat session if none exist
          const initialSession = createNewSession('Chat inicial');
          setChatSessions([initialSession]);
          setActiveChatId(initialSession.id);
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        // Create initial session on error
        const initialSession = createNewSession('Chat inicial');
        setChatSessions([initialSession]);
        setActiveChatId(initialSession.id);
      }
    } else {
      // Create initial chat session
      const initialSession = createNewSession('Chat inicial');
      setChatSessions([initialSession]);
      setActiveChatId(initialSession.id);
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Save active chat ID to localStorage whenever it changes
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const createNewSession = (namePrefix = 'Chat') => {
    // Find the first available chat number starting from 1
    const existingNumbers = chatSessions
      .map((session) => {
        const match = session.name.match(/^Chat (\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((num) => num > 0)
      .sort((a, b) => a - b); // Sort numbers in ascending order

    // Find the first gap in the sequence or use 1 if no chats exist
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break; // Found a gap, use the current nextNumber
      }
    }

    const newSession: ChatSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${namePrefix} ${nextNumber}`,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    return newSession;
  };

  const handleCreateNewChat = (switchToNew = true) => {
    const newSession = createNewSession();
    setChatSessions((prevSessions) => [newSession, ...prevSessions]);
    if (switchToNew) {
      setActiveChatId(newSession.id);
    }
    return newSession.id;
  };

  const handleSelectChat = (sessionId: string) => {
    setActiveChatId(sessionId);
  };

  const handleDeleteChat = (sessionIdToDelete: string) => {
    setChatSessions((prevSessions) =>
      prevSessions.filter((session) => session.id !== sessionIdToDelete)
    );
    if (activeChatId === sessionIdToDelete) {
      const remainingSessions = chatSessions.filter(
        (session) => session.id !== sessionIdToDelete
      );
      if (remainingSessions.length > 0) {
        const sortedRemaining = [...remainingSessions].sort(
          (a, b) =>
            new Date(b.lastActivity).getTime() -
            new Date(a.lastActivity).getTime()
        );
        setActiveChatId(sortedRemaining[0].id);
      } else {
        handleCreateNewChat();
      }
    }
  };

  const getSessionDisplayName = (session: ChatSession) => {
    // If the user has edited the name (not default Chat X format), use the custom name
    if (!session.name.match(/^Chat \d+$/)) {
      return session.name;
    }

    // For default names, show first user message if available
    if (session.messages.length > 0) {
      const firstUserMessage = session.messages.find(
        (m) => m.sender === 'user'
      );
      if (firstUserMessage) {
        return (
          firstUserMessage.text.substring(0, 30) +
          (firstUserMessage.text.length > 30 ? '...' : '')
        );
      }
    }
    return session.name;
  };

  const sortedChatSessions = useMemo(() => {
    return [...chatSessions].sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }, [chatSessions]);

  const handleStartEditingName = (sessionId: string, currentName: string) => {
    setEditingChatId(sessionId);
    setEditingName(currentName);
  };

  const handleSaveEditedName = (sessionId: string) => {
    if (editingName.trim()) {
      setChatSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === sessionId
            ? { ...session, name: editingName.trim() }
            : session
        )
      );
    }
    setEditingChatId('');
    setEditingName('');
  };

  const handleCancelEditing = () => {
    setEditingChatId('');
    setEditingName('');
  };

  const updateActiveSessionMessages = (newMessages: Message[]) => {
    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === activeChatId
          ? { ...session, messages: newMessages, lastActivity: new Date() }
          : session
      )
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    updateActiveSessionMessages([...activeMessages, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Use the Next.js API route instead of direct FastAPI call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // --- MODIFICACIÓN PARA FILTRAR <think>...</think> ---
      let botResponseText =
        data.prediction || 'No se pudo obtener una respuesta.';
      // Filtra el bloque <think>...</think> usando una expresión regular
      botResponseText = botResponseText
        .replace(/<think>[\s\S]*?<\/think>\s*/g, '')
        .trim();
      // --- FIN DE LA MODIFICACIÓN ---

      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        // Usa el texto filtrado
        text: botResponseText || 'No se pudo obtener una respuesta.', // Fallback si el texto queda vacío
        sender: 'bot',
        timestamp: new Date(),
      };
      updateActiveSessionMessages([...activeMessages, userMessage, botMessage]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        text: `Error al conectar con el bot: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }. Inténtalo de nuevo.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      updateActiveSessionMessages([
        ...activeMessages,
        userMessage,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex'>
      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col max-w-4xl mx-auto p-4'>
        {/* Header */}
        <header className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-t-2xl p-6 shadow-2xl'>
          <div className='flex items-center justify-center space-x-3'>
            <div className='relative'>
              <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center'>
                <Sparkles className='w-5 h-5 text-white' />
              </div>
              <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse'></div>
            </div>
            <div>
              <h1 className='text-2xl font-bold text-white'>Qwen3</h1>
              <p className='text-sm text-white/70'>Tu asistente inteligente</p>
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <main className='flex-1 bg-white/5 backdrop-blur-lg border-x border-white/20 overflow-hidden'>
          <div className='h-full overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent'>
            {activeMessages.length === 0 && (
              <div className='flex flex-col items-center justify-center h-full text-center'>
                <div className='w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4'>
                  <Bot className='w-10 h-10 text-white' />
                </div>
                <h2 className='text-xl font-semibold text-white mb-2'>
                  ¡Hola! Soy Qwen3 AI
                </h2>
                <p className='text-white/70 max-w-md'>
                  Estoy aquí para ayudarte con cualquier pregunta que tengas.
                  Escribe un mensaje para comenzar nuestra conversación.
                </p>
              </div>
            )}

            {activeMessages.map(
              (
                msg // Eliminé 'index' ya que 'msg.id' es la key
              ) => (
                <div
                  key={msg.id}
                  className='group'
                >
                  <div
                    className={`flex items-start space-x-3 ${
                      msg.sender === 'user'
                        ? 'flex-row-reverse space-x-reverse'
                        : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <User className='w-4 h-4 text-white' />
                      ) : (
                        <Bot className='w-4 h-4 text-white' />
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`flex-1 max-w-3xl ${
                        msg.sender === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400/30'
                            : 'bg-white/10 text-white border-white/20'
                        } ${
                          msg.sender === 'user'
                            ? 'rounded-br-md'
                            : 'rounded-bl-md'
                        }`}
                      >
                        <p className='whitespace-pre-wrap leading-relaxed'>
                          {msg.text}
                        </p>
                      </div>
                      <div
                        className={`mt-1 text-xs text-white/50 ${
                          msg.sender === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Loading Animation */}
            {isLoading && (
              <div className='flex items-start space-x-3'>
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center'>
                  <Bot className='w-4 h-4 text-white' />
                </div>
                <div className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl rounded-bl-md px-4 py-3'>
                  <div className='flex space-x-1'>
                    <div className='w-2 h-2 bg-white/60 rounded-full animate-bounce'></div>
                    <div
                      className='w-2 h-2 bg-white/60 rounded-full animate-bounce'
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className='w-2 h-2 bg-white/60 rounded-full animate-bounce'
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Section */}
        <footer className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-b-2xl p-6 shadow-2xl'>
          <form
            onSubmit={handleSubmit}
            className='block'
          >
            {' '}
            {/* Envolver en un form para mejor semántica y manejo de Enter */}
            <div className='flex items-center space-x-4'>
              <div className='flex-1 relative'>
                <input
                  type='text'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevenir nueva línea
                      handleSubmit(e as any); // 'as any' aquí es por simplicidad, idealmente se crearía un evento sintético si es necesario
                    }
                  }}
                  placeholder='Escribe tu mensaje...'
                  className='w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200'
                  disabled={isLoading}
                />
              </div>
              <button
                type='submit' // Tipo submit para el botón dentro del form
                disabled={isLoading || !input.trim()}
                className='flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 rounded-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 shadow-lg'
              >
                <Send className='w-5 h-5 text-white' />
              </button>
            </div>
          </form>
          <div className='mt-3 text-center'>
            <p className='text-xs text-white/40'>
              Powered by DeepSeek R1 • Presiona Enter para enviar
            </p>
          </div>
        </footer>
      </div>

      {/* Sidebar */}
      <aside className='w-80 bg-slate-900/50 backdrop-blur-md p-4 flex flex-col border-l border-white/10 h-screen overflow-hidden'>
        <div className='mb-4'>
          <button
            onClick={() => handleCreateNewChat(true)}
            className='flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400'
          >
            <Plus className='w-5 h-5' />
            <span className='text-sm font-medium'>Nuevo Chat</span>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 pr-1'>
          <h3 className='text-sm font-semibold text-white/70 mb-3 px-2'>
            Chats Recientes
          </h3>
          {sortedChatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectChat(session.id)}
              className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                activeChatId === session.id
                  ? 'bg-purple-600/40 hover:bg-purple-500/50'
                  : 'hover:bg-slate-700/30'
              }`}
            >
              <div className='flex items-center space-x-3 overflow-hidden flex-1'>
                <MessageSquare
                  className={`w-4 h-4 flex-shrink-0 ${
                    activeChatId === session.id
                      ? 'text-pink-400'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <div className='overflow-hidden flex-1'>
                  {editingChatId === session.id ? (
                    <input
                      type='text'
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveEditedName(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEditedName(session.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEditing();
                        }
                      }}
                      className='text-sm bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-purple-400 w-full'
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditingName(session.id, getSessionDisplayName(session));
                      }}
                      className={`text-sm block truncate cursor-pointer hover:bg-slate-700/30 px-1 py-0.5 rounded transition-colors ${
                        activeChatId === session.id
                          ? 'text-white font-medium'
                          : 'text-slate-300 group-hover:text-white'
                      }`}
                      title='Haz clic para editar el nombre'
                    >
                      {getSessionDisplayName(session)}
                    </span>
                  )}
                  <span className='text-xs text-slate-500 block truncate'>
                    {session.messages.length} mensajes
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(session.id);
                }}
                className='p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'
                title='Eliminar chat'
              >
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          ))}

          {sortedChatSessions.length === 0 && (
            <div className='text-center py-8'>
              <MessageSquare className='w-12 h-12 text-slate-600 mx-auto mb-3' />
              <p className='text-sm text-slate-500'>No hay chats todavía</p>
              <p className='text-xs text-slate-600 mt-1'>Crea tu primer chat</p>
            </div>
          )}
        </div>

        <div className='mt-4 pt-4 border-t border-slate-700/50'>
          <p className='text-xs text-slate-500 text-center'>
            Historial de Chats
          </p>
        </div>
      </aside>
    </div>
  );
}
