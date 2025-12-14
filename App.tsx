import React, { useState, useEffect } from 'react';
import { AppState, Member, Transaction, Tab, ChatMessage, Grievance, Notice, BotMessage, Holiday } from './types';
import { 
  getMembers, saveMembers, 
  getTransactions, saveTransactions, 
  getChatMessages, saveChatMessages, 
  getManagerCreds, saveManagerCreds, 
  getGrievances, saveGrievances,
  getNotices, saveNotices,
  getMeetingLink, saveMeetingLink,
  getBotMessages, saveBotMessages,
  getHolidays, saveHolidays
} from './services/storageService';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Finances from './components/Finances';
import Communication from './components/Communication';
import Liaison from './components/Liaison';
import NoticeBoard from './components/NoticeBoard';
import Login from './components/Login';
import { LayoutDashboard, Users, IndianRupee, MessageCircle, Lock, Settings, ShieldAlert, Bell, LogOut, X, KeyRound, Smartphone, RefreshCw, ChevronRight, ShieldCheck, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'MEMBER' | 'MANAGER' | 'LIAISON' | null>(null);
  const [currentUserMember, setCurrentUserMember] = useState<Member | null>(null);
  
  const [appVersion, setAppVersion] = useState("1.1.0 (Web)");
  const [data, setData] = useState<AppState>({
    members: [],
    transactions: [],
    chatMessages: [],
    grievances: [],
    notices: [],
    meetingLink: '',
    botMessages: [],
    holidays: []
  });

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'MENU' | 'VERIFY' | 'UPDATE'>('MENU');
  const [otpSent, setOtpSent] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newCreds, setNewCreds] = useState({ mobile: '', password: '' });

  // Load data on mount
  useEffect(() => {
    setData({
      members: getMembers(),
      transactions: getTransactions(),
      chatMessages: getChatMessages(),
      grievances: getGrievances(),
      notices: getNotices(),
      meetingLink: getMeetingLink(),
      botMessages: getBotMessages(),
      holidays: getHolidays()
    });
  }, []);

  const handleLogin = (role: 'MEMBER' | 'MANAGER' | 'LIAISON', member?: Member) => {
    setUserRole(role);
    if (member) {
      setCurrentUserMember(member);
    }
    setIsLoggedIn(true);
    // Determine default tab based on role
    if (role === 'LIAISON') {
      setActiveTab(Tab.LIAISON);
    } else {
      setActiveTab(Tab.DASHBOARD);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentUserMember(null);
  };

  const isAdmin = userRole === 'MANAGER';
  const isLiaison = userRole === 'LIAISON';

  // Handlers for Data Updates
  const addMember = (member: Member) => {
    const updatedMembers = [...data.members, member];
    setData(prev => ({ ...prev, members: updatedMembers }));
    saveMembers(updatedMembers);
  };

  const updateMember = (updatedMember: Member) => {
    const updatedMembers = data.members.map(m => m.id === updatedMember.id ? updatedMember : m);
    setData(prev => ({ ...prev, members: updatedMembers }));
    saveMembers(updatedMembers);
  };

  const deleteMember = (id: string) => {
    const updatedMembers = data.members.filter(m => m.id !== id);
    setData(prev => ({ ...prev, members: updatedMembers }));
    saveMembers(updatedMembers);
  };

  const addTransaction = (transaction: Transaction) => {
    const updatedTransactions = [...data.transactions, transaction];
    setData(prev => ({ ...prev, transactions: updatedTransactions }));
    saveTransactions(updatedTransactions);
  };

  const addChatMessage = (message: ChatMessage) => {
    const updatedMessages = [...data.chatMessages, message];
    setData(prev => ({ ...prev, chatMessages: updatedMessages }));
    saveChatMessages(updatedMessages);
  };

  const addBotMessage = (message: BotMessage) => {
    const updatedMessages = [...data.botMessages, message];
    setData(prev => ({ ...prev, botMessages: updatedMessages }));
    saveBotMessages(updatedMessages);
  };

  const addGrievance = (grievance: Grievance) => {
    const updatedGrievances = [...data.grievances, grievance];
    setData(prev => ({ ...prev, grievances: updatedGrievances }));
    saveGrievances(updatedGrievances);
  };

  const updateGrievance = (grievance: Grievance) => {
    const updatedGrievances = data.grievances.map(g => g.id === grievance.id ? grievance : g);
    setData(prev => ({ ...prev, grievances: updatedGrievances }));
    saveGrievances(updatedGrievances);
  };

  const addNotice = (notice: Notice) => {
    const updatedNotices = [...data.notices, notice];
    setData(prev => ({ ...prev, notices: updatedNotices }));
    saveNotices(updatedNotices);
  };

  const deleteNotice = (id: string) => {
    const updatedNotices = data.notices.filter(n => n.id !== id);
    setData(prev => ({ ...prev, notices: updatedNotices }));
    saveNotices(updatedNotices);
  };

  const updateMeetingLink = (link: string) => {
    setData(prev => ({ ...prev, meetingLink: link }));
    saveMeetingLink(link);
  };

  const addHoliday = (holiday: Holiday) => {
    const updatedHolidays = [...data.holidays, holiday];
    setData(prev => ({ ...prev, holidays: updatedHolidays }));
    saveHolidays(updatedHolidays);
  };

  const deleteHoliday = (id: string) => {
    const updatedHolidays = data.holidays.filter(h => h.id !== id);
    setData(prev => ({ ...prev, holidays: updatedHolidays }));
    saveHolidays(updatedHolidays);
  };

  // --- SETTINGS LOGIC ---
  const handleOpenSettings = () => {
    if (!isAdmin) return;
    setShowSettings(true);
    setSettingsView('MENU');
  };

  const handleStartUpdateCreds = () => {
    const currentCreds = getManagerCreds();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpSent(otp);
    setOtpInput('');
    setSettingsView('VERIFY');
    
    // Simulate SMS
    setTimeout(() => {
        alert(`SECURITY VERIFICATION:\nOTP sent to registered mobile (${currentCreds.mobile}): ${otp}`);
    }, 500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === otpSent) {
        const currentCreds = getManagerCreds();
        setNewCreds({ mobile: currentCreds.mobile, password: '' });
        setSettingsView('UPDATE');
    } else {
        alert("Incorrect OTP. Please try again.");
    }
  };

  const handleUpdateCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCreds.password.length < 4) {
        alert("Password must be at least 4 characters.");
        return;
    }
    saveManagerCreds(newCreds);
    alert("Credentials updated successfully! Please login again with new password.");
    setShowSettings(false);
    handleLogout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <Dashboard members={data.members} transactions={data.transactions} grievances={data.grievances} />;
      case Tab.MEMBERS:
        return <Members members={data.members} transactions={data.transactions} onAddMember={addMember} onUpdateMember={updateMember} onDeleteMember={deleteMember} isAdmin={isAdmin} />;
      case Tab.FINANCES:
        return <Finances transactions={data.transactions} members={data.members} onAddTransaction={addTransaction} isAdmin={isAdmin} />;
      case Tab.LIAISON:
        return <Liaison grievances={data.grievances} members={data.members} onAddGrievance={addGrievance} onUpdateGrievance={updateGrievance} userRole={userRole} isAdmin={isAdmin} />;
      case Tab.NOTICES:
        return <NoticeBoard notices={data.notices} meetingLink={data.meetingLink} holidays={data.holidays} isAdmin={isAdmin} userRole={userRole} onAddNotice={addNotice} onDeleteNotice={deleteNotice} onUpdateMeetingLink={updateMeetingLink} onAddHoliday={addHoliday} onDeleteHoliday={deleteHoliday} />;
      case Tab.COMMUNICATION:
        return <Communication messages={data.chatMessages} onSendMessage={addChatMessage} isAdmin={isAdmin} members={data.members} botMessages={data.botMessages} onSendBotMessage={addBotMessage} currentUserMember={currentUserMember} />;
      default:
        if (isLiaison) return <Liaison grievances={data.grievances} members={data.members} onAddGrievance={addGrievance} onUpdateGrievance={updateGrievance} userRole={userRole} isAdmin={isAdmin} />;
        return <Dashboard members={data.members} transactions={data.transactions} grievances={data.grievances} />;
    }
  };

  if (!isLoggedIn) {
    return <Login members={data.members} onLogin={handleLogin} />;
  }

  // --- RESPONSIVE LAYOUT CONFIG ---
  
  const navItems = [
    { id: Tab.DASHBOARD, label: "Dashboard", icon: <LayoutDashboard size={20} />, role: "ALL" },
    { id: Tab.MEMBERS, label: "Members", icon: <Users size={20} />, role: "ALL", hideForLiaison: true },
    { id: Tab.FINANCES, label: "Finances", icon: <IndianRupee size={20} />, role: "ALL", hideForLiaison: true },
    { id: Tab.LIAISON, label: "Liaison", icon: <ShieldAlert size={20} />, role: "ALL" },
    { id: Tab.NOTICES, label: "Notices", icon: <Bell size={20} />, role: "ALL" },
    { id: Tab.COMMUNICATION, label: "Chat", icon: <MessageCircle size={20} />, role: "ALL", hideForLiaison: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (isLiaison && item.hideForLiaison) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
           <h1 className="text-xl font-extrabold text-blue-800 flex items-center gap-2">
              <ShieldCheck className="text-blue-600 fill-blue-100" /> MDU EWA
           </h1>
           <p className="text-xs text-slate-500 mt-1 pl-8 font-medium">Association Manager</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
           {filteredNavItems.map(item => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
             >
               {item.icon} {item.label}
             </button>
           ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
           {isAdmin && (
             <button onClick={handleOpenSettings} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm transition mb-2">
                <Settings size={20} /> Settings
             </button>
           )}
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition">
              <LogOut size={20} /> Logout
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-4 shadow-md flex justify-between items-center z-10">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
               <ShieldCheck size={18} className="text-white/80" /> MDU SC/ST EWA
            </h1>
            <p className="text-[10px] text-blue-100 opacity-90 flex items-center gap-1">
               {isAdmin ? 'General Secretary Mode' : (isLiaison ? 'Liaison Officer Mode' : (currentUserMember ? currentUserMember.name : 'Member View'))}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={handleOpenSettings} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <Settings size={18} />
              </button>
            )}
            <button onClick={handleLogout} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Desktop Header / Toolbar (Visible on Desktop) */}
        <header className="hidden md:flex bg-white border-b border-slate-200 h-16 px-8 items-center justify-between shrink-0">
           <h2 className="text-xl font-bold text-slate-800">
             {navItems.find(i => i.id === activeTab)?.label}
           </h2>
           <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                 {isAdmin ? 'Administrator' : (isLiaison ? 'Liaison Officer' : `Member: ${currentUserMember?.name}`)}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                 {isAdmin ? 'GS' : (isLiaison ? 'LO' : currentUserMember?.name?.charAt(0))}
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-slate-50">
           <div className="max-w-7xl mx-auto h-full flex flex-col">
              {renderContent()}
           </div>
        </main>

        {/* Mobile Bottom Navigation (Hidden on Desktop) */}
        <div className="md:hidden bg-white border-t border-slate-200 flex justify-around py-2 shrink-0 z-20 pb-safe">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}
            >
              {React.cloneElement(item.icon as React.ReactElement, { size: 22 })}
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- MODALS (Settings) --- */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90%] animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Settings size={18} className="text-slate-500" /> Settings
               </h3>
               <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-slate-200 transition">
                 <X size={20} className="text-slate-500" />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {settingsView === 'MENU' && (
                <div className="space-y-3">
                   <button 
                     onClick={handleStartUpdateCreds}
                     className="w-full bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-slate-50 transition group"
                   >
                     <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                           <KeyRound size={20} />
                        </div>
                        <div className="text-left">
                           <h4 className="font-bold text-slate-800 text-sm">Change Credentials</h4>
                           <p className="text-[10px] text-slate-500">Update Password & Mobile</p>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                   </button>
                   <button 
                     onClick={() => alert(`App Version: ${appVersion}\nPlatform: Web/PWA`)}
                     className="w-full bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-slate-50 transition group"
                   >
                     <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                           <RefreshCw size={20} />
                        </div>
                        <div className="text-left">
                           <h4 className="font-bold text-slate-800 text-sm">Check Updates</h4>
                           <p className="text-[10px] text-slate-500">Current v{appVersion}</p>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
                   </button>
                </div>
              )}

              {settingsView === 'VERIFY' && (
                <div className="space-y-4">
                   <div className="text-center mb-4">
                      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                         <ShieldCheck size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800">Security Check</h4>
                      <p className="text-xs text-slate-500">Enter OTP sent to registered mobile.</p>
                   </div>
                   
                   <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <input 
                        type="text" 
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full text-center text-2xl font-mono tracking-widest p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                        placeholder="XXXX"
                        maxLength={4}
                        autoFocus
                      />
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                        Verify OTP
                      </button>
                      <button type="button" onClick={() => setSettingsView('MENU')} className="w-full text-xs text-slate-400 font-medium py-2">Cancel</button>
                   </form>
                </div>
              )}

              {settingsView === 'UPDATE' && (
                <div className="space-y-4">
                   <div className="text-center mb-4">
                      <h4 className="font-bold text-slate-800">Update Credentials</h4>
                   </div>
                   <form onSubmit={handleUpdateCreds} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">New Mobile</label>
                        <input 
                              type="tel"
                              value={newCreds.mobile}
                              onChange={(e) => setNewCreds({...newCreds, mobile: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                              required
                           />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">New Password</label>
                        <input 
                              type="text"
                              value={newCreds.password}
                              onChange={(e) => setNewCreds({...newCreds, password: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                              required
                           />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">Save & Logout</button>
                      <button type="button" onClick={() => setSettingsView('MENU')} className="w-full text-xs text-slate-400 font-medium py-2">Cancel</button>
                   </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;