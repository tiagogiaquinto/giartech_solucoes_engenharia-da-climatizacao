import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  Settings, 
  Volume2, 
  Search, 
  MoreVertical, 
  X, 
  Check, 
  Clock, 
  ChevronLeft, 
  Menu,
  Image,
  Users
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface Message {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isMe: boolean;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isGroup: boolean;
  participants: string[];
  status: 'online' | 'offline' | 'away' | 'busy';
  avatar?: string;
}

const Chat = () => {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Equipe Técnica',
      lastMessage: 'Carlos: Vou atender o chamado agora',
      lastMessageTime: new Date(Date.now() - 5 * 60000),
      unreadCount: 3,
      isGroup: true,
      participants: ['Carlos', 'Ana', 'Pedro', 'Maria'],
      status: 'online',
      avatar: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    {
      id: '2',
      name: 'Carlos Técnico',
      lastMessage: 'Já finalizei a instalação do cliente',
      lastMessageTime: new Date(Date.now() - 30 * 60000),
      unreadCount: 0,
      isGroup: false,
      participants: ['Carlos'],
      status: 'online'
    },
    {
      id: '3',
      name: 'Ana Técnica',
      lastMessage: 'Preciso de ajuda com um cliente',
      lastMessageTime: new Date(Date.now() - 2 * 3600000),
      unreadCount: 1,
      isGroup: false,
      participants: ['Ana'],
      status: 'busy'
    },
    {
      id: '4',
      name: 'Departamento Comercial',
      lastMessage: 'Maria: Novo contrato fechado!',
      lastMessageTime: new Date(Date.now() - 5 * 3600000),
      unreadCount: 0,
      isGroup: true,
      participants: ['João', 'Maria', 'Roberto'],
      status: 'online'
    }
  ]);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inCall, setInCall] = useState<'none' | 'audio' | 'video'>('none');
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [showIncomingCall, setShowIncomingCall] = useState<'none' | 'audio' | 'video'>('none');
  const [callFrom, setCallFrom] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [settingsData, setSettingsData] = useState({
    notifications: true,
    sounds: true,
    darkMode: false,
    readReceipts: true,
    fontSize: 'medium'
  });
  
  // For mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [temporarySidebarVisible, setTemporarySidebarVisible] = useState(true);

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate sample messages for the active conversation
  useEffect(() => {
    if (activeConversation) {
      // Mark conversation as read
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === activeConversation.id 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      // Generate sample messages
      const sampleMessages: Message[] = [];
      const messageCount = 10 + Math.floor(Math.random() * 10);
      const now = new Date();
      
      for (let i = 0; i < messageCount; i++) {
        const isMe = Math.random() > 0.5;
        const sender = isMe ? user?.name || 'Você' : activeConversation.isGroup 
          ? activeConversation.participants[Math.floor(Math.random() * activeConversation.participants.length)]
          : activeConversation.name;
        
        sampleMessages.push({
          id: `msg-${i}`,
          content: getRandomMessage(isMe, activeConversation.isGroup),
          sender,
          senderId: isMe ? 'me' : sender,
          timestamp: new Date(now.getTime() - (messageCount - i) * 5 * 60000),
          status: isMe ? (i < messageCount - 3 ? 'read' : i < messageCount - 1 ? 'delivered' : 'sent') : 'read',
          isMe
        });
      }
      
      setMessages(sampleMessages);
      
      // Hide sidebar on mobile after selecting a conversation
      if (isMobile) {
        setTemporarySidebarVisible(false);
      }
    }
  }, [activeConversation, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Today
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    if (diff < 604800000) {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return days[date.getDay()];
    }
    
    // Older
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  // Format call duration
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get random message for demo
  const getRandomMessage = (isMe: boolean, isGroup: boolean) => {
    const messages = isMe 
      ? [
          'Olá, como posso ajudar?',
          'Já estou a caminho do cliente',
          'Finalizei o serviço agora',
          'Preciso de mais informações sobre este chamado',
          'Vou precisar de mais peças para o conserto',
          'O cliente não está no local',
          'Serviço concluído com sucesso',
          'Estou com dificuldade para acessar o local'
        ]
      : [
          'Temos um novo chamado urgente',
          'O cliente está aguardando',
          'Pode me ajudar com um problema?',
          'Já verificou o estoque de peças?',
          'Precisamos finalizar este serviço hoje',
          'O cliente alterou o horário',
          'Tem disponibilidade amanhã?',
          isGroup ? 'Pessoal, reunião às 15h' : 'Preciso da sua ajuda com um cliente'
        ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      sender: user?.name || 'Você',
      senderId: 'me',
      timestamp: new Date(),
      status: 'sending',
      isMe: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate message being sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'sent' } : msg
        )
      );
      
      // Simulate message being delivered
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
          )
        );
        
        // Simulate message being read
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMsg.id ? { ...msg, status: 'read' } : msg
            )
          );
        }, 2000);
      }, 1000);
    }, 500);
    
    // Simulate typing indicator from the other person
    setTimeout(() => {
      setIsTyping(true);
      
      // Simulate response after typing
      setTimeout(() => {
        setIsTyping(false);
        
        const response: Message = {
          id: `msg-${Date.now()}`,
          content: getRandomMessage(false, activeConversation.isGroup),
          sender: activeConversation.isGroup 
            ? activeConversation.participants[Math.floor(Math.random() * activeConversation.participants.length)]
            : activeConversation.name,
          senderId: 'other',
          timestamp: new Date(),
          status: 'read',
          isMe: false
        };
        
        setMessages(prev => [...prev, response]);
        
        // Update last message in conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: activeConversation.isGroup ? `${response.sender}: ${response.content}` : response.content,
                  lastMessageTime: response.timestamp
                } 
              : conv
          )
        );
      }, 2000 + Math.random() * 1000);
    }, 1000 + Math.random() * 2000);
    
    // Update last message in conversation list
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation.id 
          ? { 
              ...conv, 
              lastMessage: newMessage,
              lastMessageTime: new Date()
            } 
          : conv
      )
    );
  };

  // Start call
  const startCall = (type: 'audio' | 'video') => {
    if (!activeConversation) return;
    
    // Request permissions before starting call
    const mediaConstraints = type === 'video' 
      ? { video: true, audio: true } 
      : { audio: true };
    
    navigator.mediaDevices.getUserMedia(mediaConstraints)
      .then(stream => {
        console.log('Media access granted for call');
        // Stop the stream immediately since we're just checking permissions
        stream.getTracks().forEach(track => track.stop());
        
        // Now start the call
        setInCall(type);
        setCallDuration(0);
        
        const timer = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        
        setCallTimer(timer);
      })
      .catch(err => {
        console.error('Error accessing media devices:', err);
        alert('Para fazer chamadas, é necessário permitir o acesso à câmera e microfone.');
      });
  };

  // End call
  const endCall = () => {
    if (callTimer) {
      clearInterval(callTimer);
    }
    
    setInCall('none');
    setCallDuration(0);
    setCallTimer(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsFullscreen(false);
  };

  // Simulate incoming call
  const simulateIncomingCall = (type: 'audio' | 'video') => {
    const caller = conversations[Math.floor(Math.random() * conversations.length)];
    setCallFrom(caller.name);
    setShowIncomingCall(type);
    
    // Auto decline after 15 seconds if not answered
    setTimeout(() => {
      setShowIncomingCall('none');
    }, 15000);
  };

  // Answer incoming call
  const answerCall = () => {
    const type = showIncomingCall;
    setShowIncomingCall('none');
    setInCall(type);
    setCallDuration(0);
    
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    setCallTimer(timer);
  };

  // Decline incoming call
  const declineCall = () => {
    setShowIncomingCall('none');
  };

  // Handle emoji picker (simplified)
  const handleEmojiClick = () => {
    // In a real app, this would open an emoji picker
    // For this demo, we'll just add a simple emoji
    setNewMessage(prev => prev + ' 😊');
    messageInputRef.current?.focus();
  };

  // Handle attachment (simplified)
  const handleAttachment = () => {
    // In a real app, this would open a file picker
    alert('Funcionalidade de anexo seria implementada aqui');
  };

  // Get status icon
  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending': return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent': return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered': return (
        <div className="relative">
          <Check className="h-3 w-3 text-blue-500 absolute" />
          <Check className="h-3 w-3 text-blue-500 ml-0.5" />
        </div>
      );
      case 'read': return (
        <div className="relative text-blue-500">
          <Check className="h-3 w-3 absolute" />
          <Check className="h-3 w-3 ml-0.5" />
        </div>
      );
      default: return null;
    }
  };

  // Get status color
  const getStatusColor = (status: 'online' | 'offline' | 'away' | 'busy') => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-400';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setTemporarySidebarVisible(!temporarySidebarVisible);
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex">
      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || (isMobile && temporarySidebarVisible)) && (
          <motion.div 
            initial={isMobile ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -300 } : undefined}
            className="w-80 border-r border-gray-200 flex flex-col bg-white z-10"
            style={{ 
              position: isMobile ? 'absolute' : 'relative',
              height: '100%',
              boxShadow: isMobile ? '0 0 15px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {/* Sidebar Header */}
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Conversas</h2>
              <div className="flex items-center space-x-1.5">
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <Settings className="h-4 w-4" />
                </button>
                {isMobile && (
                  <button 
                    onClick={toggleSidebar}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full md:hidden"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Search Bar */}
            <AnimatePresence>
              {showSearch && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-3 border-b border-gray-200 overflow-hidden"
                >
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    className={`p-2.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      activeConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {/* Avatar */}
                      <div className="relative">
                        {conversation.avatar ? (
                          <img 
                            src={conversation.avatar} 
                            alt={conversation.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            conversation.isGroup ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {conversation.isGroup ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              <span className="text-base font-semibold">{conversation.name.charAt(0)}</span>
                            )}
                          </div>
                        )}
                        
                        {/* Status Indicator */}
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          getStatusColor(conversation.status)
                        }`}></div>
                      </div>
                      
                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-900 text-sm truncate">{conversation.name}</h3>
                          <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                      
                      {/* Unread Count */}
                      {conversation.unreadCount > 0 && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">{conversation.unreadCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
            
            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 bg-white z-10 flex flex-col"
                >
                  <div className="p-3 border-b border-gray-200 flex items-center">
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full mr-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-base font-bold text-gray-900">Configurações</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {/* Notification Settings */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-2">Notificações</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Notificações de mensagens</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settingsData.notifications} 
                              onChange={() => setSettingsData({...settingsData, notifications: !settingsData.notifications})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sons de notificação</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settingsData.sounds} 
                              onChange={() => setSettingsData({...settingsData, sounds: !settingsData.sounds})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Privacy Settings */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-2">Privacidade</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Confirmações de leitura</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settingsData.readReceipts} 
                              onChange={() => setSettingsData({...settingsData, readReceipts: !settingsData.readReceipts})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Appearance Settings */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-2">Aparência</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Modo escuro</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settingsData.darkMode} 
                              onChange={() => setSettingsData({...settingsData, darkMode: !settingsData.darkMode})}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Tamanho da fonte</span>
                          <select
                            value={settingsData.fontSize}
                            onChange={(e) => setSettingsData({...settingsData, fontSize: e.target.value})}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="small">Pequeno</option>
                            <option value="medium">Médio</option>
                            <option value="large">Grande</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border-t border-gray-200">
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Salvar Configurações
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                {isMobile && (
                  <button 
                    onClick={toggleSidebar}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full mr-2 md:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  {/* Avatar */}
                  {activeConversation.avatar ? (
                    <img 
                      src={activeConversation.avatar} 
                      alt={activeConversation.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activeConversation.isGroup ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {activeConversation.isGroup ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <span className="text-base font-semibold">{activeConversation.name.charAt(0)}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Conversation Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{activeConversation.name}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(activeConversation.status)} mr-1`}></div>
                      <span>
                        {activeConversation.status === 'online' ? 'Online' : 
                         activeConversation.status === 'away' ? 'Ausente' : 
                         activeConversation.status === 'busy' ? 'Ocupado' : 'Offline'}
                      </span>
                      {activeConversation.isGroup && (
                        <span className="ml-1">{activeConversation.participants.length} participantes</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Call Actions */}
              <div className="flex items-center space-x-1.5">
                <button 
                  onClick={() => startCall('audio')}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => startCall('video')}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <Video className="h-4 w-4" />
                </button>
                <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {messages.map((message, index) => {
                // Check if we should show date separator
                const showDateSeparator = index === 0 || 
                  new Date(message.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();
                
                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-3">
                        <div className="px-2.5 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
                          {new Date(message.timestamp).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${message.isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'} rounded-lg px-3 py-1.5 shadow-sm`}>
                        {/* Sender name for group chats */}
                        {activeConversation.isGroup && !message.isMe && (
                          <p className="text-xs font-medium mb-0.5" style={{ color: message.isMe ? 'white' : '#6366f1' }}>
                            {message.sender}
                          </p>
                        )}
                        
                        {/* Message content */}
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Time and status */}
                        <div className={`flex items-center justify-end space-x-1 mt-0.5 text-xs ${message.isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.isMe && getStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-lg px-3 py-1.5 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef}></div>
            </div>
            
            {/* Message Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-1.5">
                <button 
                  onClick={handleEmojiClick}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleAttachment}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`p-1.5 rounded-full ${
                    newMessage.trim() 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
            <MessageSquare className="h-14 w-14 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Interno</h3>
            <p className="text-gray-600 text-center max-w-md mb-5 text-sm">
              Selecione uma conversa para começar a enviar mensagens ou iniciar uma chamada com sua equipe.
            </p>
            {isMobile && !temporarySidebarVisible && (
              <button 
                onClick={toggleSidebar}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Ver Conversas
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Call Overlay */}
      <AnimatePresence>
        {inCall !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 ${
              isFullscreen ? 'p-0' : 'p-4'
            }`}
          >
            <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${
              isFullscreen ? 'w-full h-full' : 'max-w-md w-full'
            }`}>
              {/* Call Header */}
              <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center space-x-2 text-white">
                  {activeConversation?.avatar ? (
                    <img 
                      src={activeConversation.avatar} 
                      alt={activeConversation.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-base font-semibold text-white">{activeConversation?.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-sm">{activeConversation?.name}</h3>
                    <p className="text-xs opacity-80">
                      {inCall === 'audio' ? 'Chamada de voz' : 'Chamada de vídeo'} • {formatCallDuration(callDuration)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Call Content */}
              <div className="w-full h-full flex items-center justify-center">
                {inCall === 'video' ? (
                  isVideoOff ? (
                    <div className="w-full h-full min-h-[250px] bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-white/50 mx-auto mb-3" />
                        <p className="text-white/70 text-sm">Câmera desligada</p>
                      </div>
                    </div>
                  ) : (
                    // Simulated video feed
                    <div className="w-full h-full min-h-[250px] bg-gray-800 relative">
                      <img 
                        src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                        alt="Video call" 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Self view */}
                      <div className="absolute bottom-3 right-3 w-24 h-20 bg-gray-900 rounded-lg overflow-hidden border-2 border-white">
                        <img 
                          src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150" 
                          alt="Self view" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-3">
                      <span className="text-4xl font-semibold text-white">{activeConversation?.name.charAt(0)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{activeConversation?.name}</h3>
                    <p className="text-white/70 text-sm">{formatCallDuration(callDuration)}</p>
                  </div>
                )}
              </div>
              
              {/* Call Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-center space-x-3 z-10 bg-gradient-to-t from-black/60 to-transparent">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full ${
                    isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                
                {inCall === 'video' && (
                  <button 
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-3 rounded-full ${
                      isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                )}
                
                <button 
                  onClick={endCall}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
                
                <button 
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3 rounded-full ${
                    isSpeakerOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Incoming Call Modal */}
      <AnimatePresence>
        {showIncomingCall !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-3 right-3 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-72"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">{callFrom.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{callFrom}</h3>
                <p className="text-xs text-gray-600">
                  {showIncomingCall === 'audio' ? 'Chamada de voz' : 'Chamada de vídeo'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={declineCall}
                className="flex-1 py-1.5 bg-red-500 text-white rounded-lg mr-2 hover:bg-red-600 transition-colors text-sm"
              >
                Recusar
              </button>
              <button 
                onClick={answerCall}
                className="flex-1 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Atender
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Demo Controls (for testing) */}
      <div className="fixed bottom-16 right-3 z-40 space-y-1.5">
        <button 
          onClick={() => simulateIncomingCall('audio')}
          className="p-1.5 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          title="Simular chamada de voz"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button 
          onClick={() => simulateIncomingCall('video')}
          className="p-1.5 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors"
          title="Simular chamada de vídeo"
        >
          <Video className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Chat;