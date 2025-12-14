import React, { useState } from 'react';
import { Member } from '../types';
import { Lock, User, Phone, ArrowRight, ShieldCheck, KeyRound, Smartphone, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getManagerCreds } from '../services/storageService';

interface LoginProps {
  members: Member[];
  onLogin: (role: 'MEMBER' | 'MANAGER' | 'LIAISON', member?: Member) => void;
}

const Login: React.FC<LoginProps> = ({ members, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'MEMBER' | 'MANAGER' | 'LIAISON'>('MEMBER');
  
  // Member State
  const [memberMobile, setMemberMobile] = useState('');
  const [memberPassword, setMemberPassword] = useState('');

  // Liaison State
  const [liaisonMobile, setLiaisonMobile] = useState('');
  const [liaisonPassword, setLiaisonPassword] = useState('');

  // Manager State
  const [managerStep, setManagerStep] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerOtp, setManagerOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = memberMobile.replace(/\D/g, '');
    const cleanPass = memberPassword.replace(/\D/g, '');

    // Check if member exists
    const member = members.find(m => m.mobile.replace(/\D/g, '') === cleanMobile);

    if (member) {
      if (cleanPass === cleanMobile) {
        onLogin('MEMBER', member);
      } else {
        alert("Incorrect Password. Your password is your Mobile Number.");
      }
    } else {
      alert("Access Denied: This mobile number is not registered.");
    }
  };

  const handleLiaisonLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Liaison login does not require pre-registration in the member list.
    // Logic: Mobile Number as ID, '$Solver' as password.
    
    if (liaisonPassword === '$Solver') {
      const cleanMobile = liaisonMobile.replace(/\D/g, '');
      if (cleanMobile.length >= 10) {
        // Create a temporary member object for the session
        const liaisonUser: Member = {
           id: `LO-${cleanMobile}`,
           name: 'Responding Officer',
           mobile: liaisonMobile,
           designation: 'Liaison Officer',
           placeOfPosting: 'HQ',
           category: 'N/A',
           joinedDate: new Date().toISOString(),
           role: 'LIAISON'
        };
        onLogin('LIAISON', liaisonUser);
      } else {
        alert("Please enter a valid mobile number.");
      }
    } else {
      alert("Access Denied: Incorrect Password.");
    }
  };

  const handleManagerPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = getManagerCreds();
    if (managerPassword === creds.password) {
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      setManagerStep('OTP');
      alert(`OTP sent to ${creds.mobile}: ${newOtp}`);
    } else {
      alert("Incorrect General Secretary Password.");
    }
  };

  const handleManagerOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerOtp === generatedOtp) {
      onLogin('MANAGER');
    } else {
      alert("Invalid OTP.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/5 rounded-full blur-3xl"></div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
             <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">MDU SC/ST EWA</h1>
          <p className="text-blue-100 text-sm font-medium mt-1">Association Management</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-50 border-b border-slate-100 gap-1 overflow-x-auto">
          <button 
            onClick={() => { setActiveTab('MEMBER'); setManagerStep('PASSWORD'); }}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'MEMBER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Member
          </button>
          <button 
            onClick={() => setActiveTab('LIAISON')}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'LIAISON' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Liaison
          </button>
          <button 
            onClick={() => setActiveTab('MANAGER')}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'MANAGER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Gen. Sec
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {activeTab === 'MEMBER' && (
            <div className="animate-fade-in space-y-6">
               <div className="text-center">
                 <h2 className="text-lg font-bold text-slate-800">Member Access</h2>
                 <p className="text-slate-500 text-xs">Login enabled only for registered members.</p>
               </div>

               <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Mobile Number (ID)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="tel"
                        value={memberMobile}
                        onChange={(e) => setMemberMobile(e.target.value)}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="password"
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        placeholder="Enter Mobile Number"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">* Use your Mobile Number as Password</p>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    Login <ArrowRight size={18} />
                  </button>
               </form>
            </div>
          )}

          {activeTab === 'LIAISON' && (
            <div className="animate-fade-in space-y-6">
               <div className="text-center">
                 <h2 className="text-lg font-bold text-slate-800">Liaison / Responding Officer</h2>
                 <p className="text-slate-500 text-xs">Login with Mobile & Password.</p>
               </div>

               <form onSubmit={handleLiaisonLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Mobile Number (ID)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="tel"
                        value={liaisonMobile}
                        onChange={(e) => setLiaisonMobile(e.target.value)}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-mono font-medium"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="password"
                        value={liaisonPassword}
                        onChange={(e) => setLiaisonPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition flex items-center justify-center gap-2">
                    Access Status Board <ShieldAlert size={18} />
                  </button>
               </form>
            </div>
          )}

          {activeTab === 'MANAGER' && (
            <div className="animate-fade-in space-y-6">
               <div className="text-center">
                 <h2 className="text-lg font-bold text-slate-800">General Secretary Access</h2>
                 <p className="text-slate-500 text-xs">Two-Factor Authentication</p>
               </div>
               
               {managerStep === 'PASSWORD' ? (
                 <form onSubmit={handleManagerPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Secretary Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                          type="password"
                          value={managerPassword}
                          onChange={(e) => setManagerPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                       Verify Password <ArrowRight size={18} />
                    </button>
                 </form>
               ) : (
                 <form onSubmit={handleManagerOtpVerify} className="space-y-4">
                    <div className="bg-indigo-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-indigo-700 font-medium mb-1">OTP Verification</p>
                      <p className="text-[10px] text-indigo-400 mb-2">Sent to registered mobile</p>
                      {/* SIMULATION DISPLAY */}
                      <div className="bg-yellow-100 border border-yellow-200 rounded p-2 text-yellow-800 text-xs font-mono flex items-center justify-center gap-2">
                         <AlertTriangle size={12} />
                         <span>DEMO OTP: <strong>{generatedOtp}</strong></span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Enter OTP</label>
                      <input 
                        type="text"
                        value={managerOtp}
                        onChange={(e) => setManagerOtp(e.target.value)}
                        placeholder="XXXX"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center text-xl tracking-widest"
                        required
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:scale-[1.02] transition">
                      Verify & Login
                    </button>
                    <button type="button" onClick={() => setManagerStep('PASSWORD')} className="w-full text-xs text-slate-400 font-medium py-2">Cancel</button>
                 </form>
               )}
            </div>
          )}
        </div>
      </div>
      <p className="absolute bottom-6 text-slate-400 text-xs font-medium">© MDU SC/ST EWA v1.0.6</p>
    </div>
  );
};

export default Login;