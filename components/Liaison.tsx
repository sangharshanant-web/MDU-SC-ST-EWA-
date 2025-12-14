import React, { useState } from 'react';
import { Grievance, Member } from '../types';
import { AlertCircle, CheckCircle, Clock, Send, MessageSquareWarning, FileText, Mail, Building2, UserCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LiaisonProps {
  grievances: Grievance[];
  members: Member[];
  onAddGrievance: (g: Grievance) => void;
  onUpdateGrievance: (g: Grievance) => void;
  userRole: 'MEMBER' | 'MANAGER' | 'LIAISON' | null;
  isAdmin: boolean;
}

const Liaison: React.FC<LiaisonProps> = ({ grievances, members, onAddGrievance, onUpdateGrievance, userRole, isAdmin }) => {
  const [activeTab, setActiveTab] = useState<'BOARD' | 'REPORT'>('BOARD');
  
  // Permissions
  const isLiaisonRole = userRole === 'LIAISON';
  const canResolve = userRole === 'MANAGER' || isLiaisonRole;

  // Report Form State
  const [selectedMember, setSelectedMember] = useState('');
  const [description, setDescription] = useState('');
  const [formation, setFormation] = useState('');
  const [addressedTo, setAddressedTo] = useState('');

  // Resolve State
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [actionTaken, setActionTaken] = useState('');

  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !description || !formation || !addressedTo) return;

    const member = members.find(m => m.id === selectedMember);
    const newGrievance: Grievance = {
      id: Date.now().toString(),
      memberId: selectedMember,
      memberName: member ? member.name : 'Unknown',
      description: description,
      formation: formation,
      addressedTo: addressedTo,
      dateReported: new Date().toISOString(),
      status: 'PENDING'
    };

    onAddGrievance(newGrievance);
    setDescription('');
    setFormation('');
    setAddressedTo('');
    setSelectedMember('');
    setActiveTab('BOARD');
  };

  const handleResolve = (id: string) => {
    const grievance = grievances.find(g => g.id === id);
    if (!grievance || !actionTaken) return;

    const updated: Grievance = {
      ...grievance,
      status: 'RESOLVED',
      actionTaken: actionTaken,
      dateResolved: new Date().toISOString()
    };

    onUpdateGrievance(updated);
    setResolveId(null);
    setActionTaken('');
  };

  const generateReport = (status: 'PENDING' | 'RESOLVED') => {
    const doc = new jsPDF('l'); // Landscape orientation for better column fit
    const title = status === 'PENDING' ? 'Unsolved Problem List' : 'Solved Problem List';
    const color: [number, number, number] = status === 'PENDING' ? [220, 53, 69] : [40, 167, 69]; // Red or Green

    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text(`MDU SC/ST EWA - ${title}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

    const filteredData = grievances.filter(g => g.status === status).map(g => {
      const member = members.find(m => m.id === g.memberId);
      return [
        member ? member.name : g.memberName,
        member ? member.designation : 'N/A',
        member ? member.placeOfPosting : 'N/A',
        new Date(g.dateReported).toLocaleDateString(),
        g.addressedTo || 'N/A',
        g.description
      ];
    });

    autoTable(doc, {
      head: [['Officer Name', 'Designation', 'Place of Posting', 'Date', 'Addressed To', 'Problem Description']],
      body: filteredData,
      startY: 32,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 35 },
        5: { cellWidth: 'auto' }, // Problem Description takes remaining space
      }
    });

    const filename = `MDU_EWA_${status === 'PENDING' ? 'Unsolved' : 'Solved'}_Problems.pdf`;
    doc.save(filename);

    // Email trigger
    const subject = `MDU SC/ST EWA - ${title}`;
    const body = `Please find attached the ${title}.\n\n(Note: Please attach the downloaded file: ${filename} manually)`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Sort: Pending first, then by date
  const sortedGrievances = [...grievances].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime();
    }
    return a.status === 'PENDING' ? -1 : 1;
  });

  return (
    <div className="pb-24 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Liaison / Responding Officer</h2>
          <p className="text-slate-500 text-sm">Problem Reporting & Action Tracking</p>
        </div>
      </header>

      {/* Admin Tools - Only Gen Secretary */}
      {isAdmin && activeTab === 'BOARD' && (
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
           <h3 className="text-xs font-bold text-slate-500 uppercase">Generate Reports</h3>
           <div className="flex gap-2">
             <button 
                onClick={() => generateReport('PENDING')}
                className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2"
             >
                <FileText size={14} /> Unsolved List (PDF) <Mail size={12} />
             </button>
             <button 
                onClick={() => generateReport('RESOLVED')}
                className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-xs font-bold border border-green-100 hover:bg-green-100 flex items-center justify-center gap-2"
             >
                <FileText size={14} /> Solved List (PDF) <Mail size={12} />
             </button>
           </div>
        </div>
      )}

      {/* Tabs - Hide Report Tab for Liaison Role */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('BOARD')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'BOARD' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
          <CheckCircle size={16} /> Status Board
        </button>
        {/* Liaison cannot report, only solve. Member/Admin can report */}
        {!isLiaisonRole && (
          <button 
            onClick={() => setActiveTab('REPORT')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'REPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <AlertCircle size={16} /> Report Problem
          </button>
        )}
      </div>

      {activeTab === 'REPORT' && !isLiaisonRole && (
        <form onSubmit={handleSubmitGrievance} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Select Member</label>
             <select 
               value={selectedMember} 
               onChange={(e) => setSelectedMember(e.target.value)} 
               className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
               required
             >
               <option value="">-- Choose Name --</option>
               {members.map(m => (
                 <option key={m.id} value={m.id}>{m.name} ({m.designation})</option>
               ))}
             </select>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Formation / Section</label>
             <input 
               value={formation}
               onChange={(e) => setFormation(e.target.value)}
               placeholder="E.g. Accounts, Admin, Engineering"
               className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
               required
             />
             <p className="text-[10px] text-slate-400 mt-1">Specify which section this problem pertains to.</p>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Problem Addressed To</label>
             <input 
               value={addressedTo}
               onChange={(e) => setAddressedTo(e.target.value)}
               placeholder="E.g. Sr. DPO, Sr. DEN, Branch Manager"
               className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
               required
             />
             <p className="text-[10px] text-slate-400 mt-1">Specify the authority or person this problem is addressed to.</p>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Problem Description</label>
             <textarea 
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Describe the issue clearly for the Liaison Officer..."
               rows={4}
               className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
               required
             />
           </div>
           <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
             <Send size={18} /> Submit to Officer
           </button>
        </form>
      )}

      {activeTab === 'BOARD' && (
        <div className="space-y-4">
          {sortedGrievances.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-100">
               <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
               <p className="text-slate-500">No pending issues reported.</p>
            </div>
          ) : (
            sortedGrievances.map(g => (
              <div key={g.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg ${g.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {g.status === 'RESOLVED' ? 'Action Taken' : 'Pending'}
                </div>

                <div className="mb-3">
                   <div className="flex items-center gap-2 mb-1">
                     <UserIcon />
                     <span className="font-semibold text-slate-800">{g.memberName}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(g.dateReported).toLocaleDateString()}</span>
                      {g.formation && <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600"><Building2 size={10} /> {g.formation}</span>}
                   </div>
                   {g.addressedTo && (
                     <div className="text-xs text-slate-500 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                        <span className="font-bold text-blue-600">To:</span> {g.addressedTo}
                     </div>
                   )}
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 mb-3 border border-slate-100">
                   <span className="font-medium text-slate-900 block mb-1">Problem:</span>
                   {g.description}
                </div>

                {g.status === 'RESOLVED' && (
                  <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800 border border-green-100">
                    <span className="font-bold block mb-1 flex items-center gap-1"><CheckCircle size={14}/> Action Taken:</span>
                    {g.actionTaken}
                  </div>
                )}

                {/* Action Area for Liaison / Manager */}
                {canResolve && g.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {resolveId === g.id ? (
                      <div className="space-y-3">
                        <textarea 
                          value={actionTaken}
                          onChange={(e) => setActionTaken(e.target.value)}
                          placeholder="Describe action taken..."
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                           <button onClick={() => handleResolve(g.id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium">Confirm Resolution</button>
                           <button onClick={() => setResolveId(null)} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setResolveId(g.id)} className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium border border-blue-100 hover:bg-blue-100">
                        Take Action ({isLiaisonRole ? 'Responding Officer' : 'General Secretary'})
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const UserIcon = () => (
  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
    <MessageSquareWarning size={14} />
  </div>
);

export default Liaison;