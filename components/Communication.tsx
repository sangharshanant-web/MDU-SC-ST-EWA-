import React, { useState, useRef, useEffect } from 'react';
import { generateDraftMessage, generateVideoScript, askSCSTLawBot } from '../services/geminiService';
import { ChatMessage, Member, BotMessage } from '../types';
import { MessageSquare, Video, Mic, Send, Loader2, Share2, StopCircle, RefreshCw, User, Paperclip, Bot, Sparkles, Volume2, MicOff, Globe, Square, Zap, BookOpen, PenTool, Scale, Receipt } from 'lucide-react';

interface CommunicationProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  isAdmin: boolean;
  members: Member[];
  botMessages: BotMessage[];
  onSendBotMessage: (msg: BotMessage) => void;
  currentUserMember: Member | null;
}

const LANGUAGES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'pa-IN', name: 'Punjabi' }
];

const BOT_SUGGESTIONS = [
  { text: "Draft a representation for promotion", icon: <PenTool size={14} /> },
  { text: "Explain Rule 14(2) of D&AR 1968", icon: <BookOpen size={14} /> },
  { text: "GST Applicability on Subscriptions", icon: <Receipt size={14} /> },
  { text: "Rights under SC/ST Atrocities Act", icon: <Zap size={14} /> },
];

const Communication: React.FC<CommunicationProps> = ({ messages, onSendMessage, isAdmin, members, botMessages, onSendBotMessage, currentUserMember }) => {
  const [view, setView] = useState<'CHAT' | 'LEGAL_BOT' | 'ADMIN_TOOLS'>('CHAT');
  
  // Chat State
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bot State
  const [botInput, setBotInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isBotListening, setIsBotListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const botScrollRef = useRef<HTMLDivElement>(null);

  // Admin Tools State
  const [adminTab, setAdminTab] = useState<'TEXT' | 'SCRIPT'>('TEXT');
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recordingType, setRecordingType] = useState<'AUDIO' | 'VIDEO' | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  useEffect(() => {
    if (botScrollRef.current) {
      botScrollRef.current.scrollTop = botScrollRef.current.scrollHeight;
    }
  }, [botMessages, view, isBotThinking]);

  // --- CHAT LOGIC ---

  const handleSendChat = () => {
    if (!inputText.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderName: isAdmin ? "General Secretary" : (currentUserMember?.name || "Member"),
      content: inputText,
      mediaType: 'TEXT',
      timestamp: new Date().toISOString()
    };
    onSendMessage(newMessage);
    setInputText('');
  };

  const startRecording = async (type: 'AUDIO' | 'VIDEO') => {
    try {
      setRecordingType(type);
      const constraints = type === 'VIDEO' ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current && type === 'VIDEO') {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: type === 'VIDEO' ? 'video/webm' : 'audio/webm' });
        
        // Convert to Base64 to store in localStorage (Warning: Limited size)
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Check size rough estimate (LS limit is ~5MB)
          if (base64data.length > 3000000) {
            alert("Recording too long for local storage demo!");
          } else {
            const newMessage: ChatMessage = {
              id: Date.now().toString(),
              senderName: isAdmin ? "General Secretary" : (currentUserMember?.name || "Member"),
              content: base64data,
              mediaType: type,
              timestamp: new Date().toISOString()
            };
            onSendMessage(newMessage);
          }
          // Stop tracks
          stream.getTracks().forEach(t => t.stop());
          setRecordingType(null);
          setIsRecording(false);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Media Error", err);
      alert("Permission denied or device unavailable");
      setRecordingType(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // --- BOT LOGIC ---

  const handleSendBotMessage = async (overrideText?: string) => {
    const textToSend = overrideText || botInput;
    if (!textToSend.trim()) return;
    
    const userMsg: BotMessage = {
      id: Date.now().toString(),
      sender: 'USER',
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    onSendBotMessage(userMsg);
    setBotInput('');
    setIsBotThinking(true);

    // Prepare history for API
    const history = botMessages.map(m => ({
      role: m.sender === 'USER' ? 'user' : 'model' as 'user' | 'model',
      text: m.text
    }));

    const responseText = await askSCSTLawBot(userMsg.text, history);

    const botMsg: BotMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'BOT',
      text: responseText,
      timestamp: new Date().toISOString()
    };
    onSendBotMessage(botMsg);
    setIsBotThinking(false);
    
    // Auto-speak response if enabled
    if (autoSpeak) {
      speakText(responseText);
    }
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
       const recognition = new SpeechRecognition();
       
       recognition.lang = selectedLang; 
       recognition.continuous = false;
       recognition.interimResults = false;

       recognition.onstart = () => setIsBotListening(true);
       
       recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setBotInput(transcript);
          // Optional: Auto-send on voice end
          // setTimeout(() => handleSendBotMessage(), 500); 
       };

       recognition.onerror = (event: any) => {
         console.error("Speech recognition error", event.error);
         setIsBotListening(false);
       };

       recognition.onend = () => setIsBotListening(false);

       recognition.start();
    } else {
       alert("Voice input is not supported in this browser. Please use Chrome or a compatible Android WebView.");
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to match the language used for input, assuming the bot replies in the same language
    utterance.lang = selectedLang;
    
    // Try to find a matching voice for better quality
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Helper to detect URLs and wrap them in anchors
  const renderMessageText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => 
      urlRegex.test(part) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline break-all hover:text-white">
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  // Ensure voices are loaded (browsers load async)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    // Cleanup on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- ADMIN AI LOGIC ---

  const handleGenerateText = async () => {
    if (!topic) return;
    setIsLoading(true);
    const result = await generateDraftMessage(topic, 'formal', details);
    setGeneratedContent(result);
    setIsLoading(false);
  };

  const handleGenerateScript = async () => {
    if (!topic) return;
    setIsLoading(true);
    const result = await generateVideoScript(topic, details);
    setGeneratedContent(result);
    setIsLoading(false);
  };

  const shareDraft = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(generatedContent)}`;
    window.open(url, '_blank');
  };

  // --- RENDER ---

  return (
    <div className="flex flex-col h-full">
      {/* Top Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-4 shrink-0 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setView('CHAT')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${view === 'CHAT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
          Group Chat
        </button>
        <button 
          onClick={() => setView('LEGAL_BOT')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 whitespace-nowrap ${view === 'LEGAL_BOT' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Sparkles size={14} /> Legal AI
        </button>
        {isAdmin && (
          <button 
            onClick={() => setView('ADMIN_TOOLS')}
            className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${view === 'ADMIN_TOOLS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Admin Tools
          </button>
        )}
      </div>

      {view === 'CHAT' && (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
          
          {/* Messages List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No messages yet. Start the conversation!</p>}
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderName.includes('Secretary') ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-400 px-1 mb-1">{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <div className={`max-w-[85%] p-3 rounded-2xl ${msg.senderName.includes('Secretary') ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                  {msg.mediaType === 'TEXT' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                  {msg.mediaType === 'AUDIO' && <audio controls src={msg.content} className="w-48 h-8" />}
                  {msg.mediaType === 'VIDEO' && <video controls src={msg.content} className="w-48 rounded-lg" />}
                </div>
              </div>
            ))}
          </div>

          {/* Recording Overlay */}
          {isRecording && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 text-white">
              {recordingType === 'VIDEO' && <video ref={videoRef} autoPlay muted playsInline className="w-48 h-32 bg-black mb-4 rounded-lg object-cover" />}
              {recordingType === 'AUDIO' && <div className="animate-pulse text-red-500 mb-4"><Mic size={48} /></div>}
              <p className="mb-4">Recording {recordingType}...</p>
              <button onClick={stopRecording} className="bg-red-600 px-6 py-2 rounded-full font-bold">Stop & Send</button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <button onClick={() => startRecording('AUDIO')} className="text-slate-400 hover:text-blue-600 p-2"><Mic size={20} /></button>
            <button onClick={() => startRecording('VIDEO')} className="text-slate-400 hover:text-blue-600 p-2"><Video size={20} /></button>
            <input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Type a message..."
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button onClick={handleSendChat} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><Send size={18} /></button>
          </div>
        </div>
      )}

      {view === 'LEGAL_BOT' && (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="bg-teal-600 text-white p-3">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Bot size={20} />
                  <div>
                      <h3 className="font-bold text-sm">SC/ST Law & Railway Expert</h3>
                      <p className="text-[10px] text-teal-100">Constitution, D&AR, Establishment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAutoSpeak(!autoSpeak)} 
                  className={`p-1.5 rounded-full ${autoSpeak ? 'bg-white/20 text-white' : 'text-teal-200 hover:bg-white/10'}`}
                  title={autoSpeak ? "Voice Output ON" : "Voice Output OFF"}
                >
                  {autoSpeak ? <Volume2 size={18} /> : <div className="relative"><Volume2 size={18} /><div className="absolute inset-0 border-r border-teal-200 rotate-45 transform origin-center translate-x-1"></div></div>}
                </button>
             </div>
             
             {/* Language Selector */}
             <div className="flex items-center gap-2 bg-teal-700/50 p-1.5 rounded-lg">
                <Globe size={14} className="text-teal-100" />
                <select 
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full font-medium"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="text-slate-800">
                      {lang.name}
                    </option>
                  ))}
                </select>
             </div>
          </div>
          
          <div ref={botScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
             {botMessages.length === 0 && (
               <div className="mt-4 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-teal-600">
                      <Sparkles size={32} />
                    </div>
                    <p className="text-slate-500 text-sm px-6">Hello! I am your AI Legal Assistant. Ask me about SC/ST Laws, Railway Rules, or GST.</p>
                  </div>
                  
                  {/* Quick Suggestions */}
                  <div className="grid grid-cols-2 gap-2 px-2">
                    {BOT_SUGGESTIONS.map((s, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleSendBotMessage(s.text)}
                        className="bg-white border border-teal-100 p-2 rounded-xl text-xs text-left text-teal-700 font-medium hover:bg-teal-50 transition flex items-center gap-2"
                      >
                         <span className="bg-teal-100 p-1 rounded-full shrink-0">{s.icon}</span>
                         {s.text}
                      </button>
                    ))}
                  </div>
               </div>
             )}
             {botMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'USER' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                      <div className="flex justify-between items-start gap-2">
                        {msg.sender === 'BOT' && <Bot size={14} className="text-teal-600 mb-1 mt-1 shrink-0" />}
                        <p className="whitespace-pre-wrap flex-1 break-words">
                          {msg.sender === 'BOT' ? renderMessageText(msg.text) : msg.text}
                        </p>
                        <button 
                          onClick={() => speakText(msg.text)}
                          className={`shrink-0 p-1 rounded-full ${msg.sender === 'USER' ? 'text-teal-100 hover:bg-teal-700' : 'text-slate-400 hover:bg-slate-100'}`}
                          title="Read Aloud"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                   </div>
                </div>
             ))}
             {isBotThinking && (
               <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
             )}
             
             {/* Stop Speaking Button Overlay */}
             {isSpeaking && (
               <div className="sticky bottom-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
                 <button 
                   onClick={stopSpeaking}
                   className="pointer-events-auto bg-red-500 text-white px-4 py-2 rounded-full shadow-xl border-2 border-white flex items-center gap-2 hover:bg-red-600 transition transform active:scale-95"
                 >
                   <Square size={14} fill="currentColor" /> Stop Reading
                 </button>
               </div>
             )}
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
             <button 
               onClick={startVoiceInput} 
               className={`p-2 rounded-full transition ${isBotListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:bg-slate-100 hover:text-teal-600'}`}
               title={`Speak in ${LANGUAGES.find(l => l.code === selectedLang)?.name}`}
             >
               {isBotListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>
            <input 
              value={botInput}
              onChange={e => setBotInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendBotMessage()}
              placeholder={isBotListening ? "Listening..." : "Type or speak..."}
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100"
              disabled={isBotThinking}
            />
            <button 
              onClick={() => handleSendBotMessage()} 
              disabled={isBotThinking}
              className={`text-white p-2 rounded-full transition ${isBotThinking ? 'bg-slate-300' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {view === 'ADMIN_TOOLS' && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex border-b border-slate-100 mb-2">
              <button 
                onClick={() => { setAdminTab('TEXT'); setGeneratedContent('') }}
                className={`flex-1 pb-2 text-sm font-semibold ${adminTab === 'TEXT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
              >
                Message Draft
              </button>
              <button 
                onClick={() => { setAdminTab('SCRIPT'); setGeneratedContent('') }}
                className={`flex-1 pb-2 text-sm font-semibold ${adminTab === 'SCRIPT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
              >
                Video Script
              </button>
            </div>

            <input 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g., Meeting Reminder)"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
            />
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Details..."
              rows={3}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
            />
            <button 
              onClick={adminTab === 'TEXT' ? handleGenerateText : handleGenerateScript}
              disabled={isLoading || !topic}
              className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Generate with AI
            </button>
          </div>

          {generatedContent && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
               <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-3 rounded-lg mb-3">
                 {generatedContent}
               </pre>
               <button onClick={shareDraft} className="w-full bg-green-500 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-600">
                 <Share2 size={18} /> Open in WhatsApp
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Communication;