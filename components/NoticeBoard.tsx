import React, { useState } from 'react';
import { Notice, Holiday } from '../types';
import { Bell, Calendar, Trash2, Video, Plus, Link as LinkIcon, AlertTriangle, Pin, ExternalLink, CalendarDays, Palmtree, Briefcase } from 'lucide-react';

interface NoticeBoardProps {
  notices: Notice[];
  meetingLink: string;
  holidays: Holiday[];
  isAdmin: boolean;
  userRole: 'MEMBER' | 'MANAGER' | 'LIAISON' | null;
  onAddNotice: (notice: Notice) => void;
  onDeleteNotice: (id: string) => void;
  onUpdateMeetingLink: (link: string) => void;
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ 
  notices, 
  meetingLink, 
  holidays,
  isAdmin, 
  userRole,
  onAddNotice, 
  onDeleteNotice,
  onUpdateMeetingLink,
  onAddHoliday,
  onDeleteHoliday
}) => {
  // Default to HOLIDAYS for Liaison, otherwise NOTICES
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'HOLIDAYS'>(userRole === 'LIAISON' ? 'HOLIDAYS' : 'NOTICES');
  
  // Notice State
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState(meetingLink);
  const [newNotice, setNewNotice] = useState<Partial<Notice>>({
    title: '',
    content: '',
    isImportant: false
  });

  // Holiday State
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({
    name: '',
    date: '',
    type: 'RESTRICTED'
  });

  // --- HANDLERS ---

  const handleAddNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotice.title && newNotice.content) {
      onAddNotice({
        id: Date.now().toString(),
        title: newNotice.title,
        content: newNotice.content,
        isImportant: newNotice.isImportant || false,
        date: new Date().toISOString()
      });
      setNewNotice({ title: '', content: '', isImportant: false });
      setIsAddingNotice(false);
    }
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHoliday.name && newHoliday.date && newHoliday.type) {
      onAddHoliday({
        id: Date.now().toString(),
        name: newHoliday.name,
        date: newHoliday.date,
        type: newHoliday.type as 'RESTRICTED' | 'CLOSED'
      });
      setNewHoliday({ name: '', date: '', type: 'RESTRICTED' });
      setIsAddingHoliday(false);
    }
  };

  const handleSaveLink = () => {
    onUpdateMeetingLink(tempLink);
    setIsEditingLink(false);
  };

  const joinMeeting = () => {
    if (meetingLink) {
      let url = meetingLink.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert("No meeting link scheduled yet.");
    }
  };

  // --- SORTING ---

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isImportant === b.isImportant) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return a.isImportant ? -1 : 1;
  });

  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const restrictedHolidays = sortedHolidays.filter(h => h.type === 'RESTRICTED');
  const closedHolidays = sortedHolidays.filter(h => h.type === 'CLOSED');

  // --- RENDER ---

  return (
    <div className="pb-24 space-y-6">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'NOTICES' ? 'Notice Board' : 'Holiday List'}
           </h2>
           <p className="text-slate-500 text-sm">
              {activeTab === 'NOTICES' ? 'Official Announcements' : 'Official Holidays'}
           </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {userRole !== 'LIAISON' && (
          <button 
            onClick={() => setActiveTab('NOTICES')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'NOTICES' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Bell size={16} /> Notices
          </button>
        )}
        <button 
          onClick={() => setActiveTab('HOLIDAYS')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'HOLIDAYS' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
        >
          <CalendarDays size={16} /> Holidays
        </button>
      </div>

      {activeTab === 'NOTICES' && userRole !== 'LIAISON' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Online Meeting Section - HIDDEN FOR LIAISON */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2">
                      <Video size={24} className="text-blue-200" />
                      <h3 className="text-lg font-bold">Online Meeting Hall</h3>
                   </div>
                   {isAdmin && (
                     <button 
                       onClick={() => setIsEditingLink(!isEditingLink)} 
                       className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition"
                     >
                       {isEditingLink ? 'Cancel' : 'Manage Link'}
                     </button>
                   )}
                </div>

                {isEditingLink ? (
                  <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm space-y-2 animate-fade-in">
                    <label className="text-xs text-blue-100">Meeting URL (Zoom/Meet/Jitsi)</label>
                    <div className="flex gap-2">
                      <input 
                        value={tempLink}
                        onChange={(e) => setTempLink(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="flex-1 px-3 py-1.5 rounded text-slate-800 text-sm outline-none"
                      />
                      <button onClick={handleSaveLink} className="bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-bold hover:bg-blue-50">Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {meetingLink ? (
                       <div className="space-y-3">
                          <p className="text-sm text-blue-100 flex items-center gap-2">
                             <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                             Meeting Link is Active
                          </p>
                          <button 
                            onClick={joinMeeting}
                            className="w-full bg-white text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-50 transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                          >
                             Join Now <ExternalLink size={16} />
                          </button>
                       </div>
                    ) : (
                       <p className="text-sm text-blue-200 italic py-2">No meeting scheduled at the moment.</p>
                    )}
                  </div>
                )}
              </div>
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
          </div>

          {/* Notices Header */}
          <div className="flex justify-between items-center mt-8">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Bell size={18} /> Announcements
            </h3>
            {isAdmin && !isAddingNotice && (
              <button 
                onClick={() => setIsAddingNotice(true)} 
                className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-700 transition"
              >
                <Plus size={14} /> Add Notice
              </button>
            )}
          </div>

          {/* Add Notice Form */}
          {isAddingNotice && (
            <form onSubmit={handleAddNoticeSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3 animate-fade-in">
               <input 
                 className="w-full p-2 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500"
                 placeholder="Notice Title"
                 value={newNotice.title}
                 onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                 required
               />
               <textarea 
                 className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                 placeholder="Notice details..."
                 rows={3}
                 value={newNotice.content}
                 onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                 required
               />
               <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="important" 
                   checked={newNotice.isImportant} 
                   onChange={e => setNewNotice({...newNotice, isImportant: e.target.checked})}
                 />
                 <label htmlFor="important" className="text-sm text-slate-600">Mark as Important</label>
               </div>
               <div className="flex gap-2 pt-2">
                 <button type="submit" className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">Post Notice</button>
                 <button type="button" onClick={() => setIsAddingNotice(false)} className="flex-1 bg-slate-100 text-slate-600 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200">Cancel</button>
               </div>
            </form>
          )}

          {/* Notices List */}
          <div className="space-y-3">
            {sortedNotices.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notices available.</p>
              </div>
            ) : (
              sortedNotices.map(notice => (
                <div 
                  key={notice.id} 
                  className={`p-4 rounded-xl shadow-sm border relative transition hover:shadow-md ${notice.isImportant ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {notice.isImportant && <Pin size={14} className="text-amber-600 fill-amber-600" />}
                      <h4 className={`font-bold ${notice.isImportant ? 'text-amber-900' : 'text-slate-800'}`}>
                        {notice.title}
                      </h4>
                    </div>
                    {isAdmin && (
                      <button onClick={() => onDeleteNotice(notice.id)} className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className={`text-sm mb-3 whitespace-pre-wrap ${notice.isImportant ? 'text-amber-800' : 'text-slate-600'}`}>
                    {notice.content}
                  </p>
                  <p className="text-[10px] text-slate-400 text-right">
                    Posted on {new Date(notice.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           {/* Admin Add Holiday */}
           {isAdmin && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                {!isAddingHoliday ? (
                  <button 
                    onClick={() => setIsAddingHoliday(true)} 
                    className="w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold border border-dashed border-slate-300 hover:bg-slate-100 hover:text-slate-800 transition flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Update Holiday List
                  </button>
                ) : (
                  <form onSubmit={handleAddHolidaySubmit} className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700">Add New Holiday</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                         <input 
                           className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-100"
                           placeholder="Holiday Name (e.g. Diwali)"
                           value={newHoliday.name}
                           onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                           required
                         />
                      </div>
                      <input 
                        type="date"
                        className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-100"
                        value={newHoliday.date}
                        onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                        required
                      />
                      <select
                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-100"
                        value={newHoliday.type}
                        onChange={e => setNewHoliday({...newHoliday, type: e.target.value as any})}
                      >
                         <option value="RESTRICTED">Restricted (RH)</option>
                         <option value="CLOSED">Closed (Gazetted)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                       <button type="submit" className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-teal-700">Save</button>
                       <button type="button" onClick={() => setIsAddingHoliday(false)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
           )}

           {/* First List: Restricted Holiday */}
           <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                 <Palmtree size={18} className="text-orange-500" />
                 <h3 className="font-bold text-slate-700">Restricted Holidays (RH)</h3>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 {restrictedHolidays.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-sm italic">No restricted holidays listed.</p>
                 ) : (
                    <div className="divide-y divide-slate-50">
                       {restrictedHolidays.map(h => (
                         <div key={h.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                               <div className="bg-orange-100 text-orange-700 font-bold text-xs px-2 py-1 rounded text-center min-w-[50px]">
                                  {new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                               </div>
                               <span className="text-sm font-medium text-slate-700">{h.name}</span>
                            </div>
                            {isAdmin && (
                               <button onClick={() => onDeleteHoliday(h.id)} className="text-slate-300 hover:text-red-500 px-2"><Trash2 size={14} /></button>
                            )}
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {/* Second List: Closed Holiday */}
           <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                 <Briefcase size={18} className="text-red-500" />
                 <h3 className="font-bold text-slate-700">Closed Holidays (Gazetted)</h3>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 {closedHolidays.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-sm italic">No closed holidays listed.</p>
                 ) : (
                    <div className="divide-y divide-slate-50">
                       {closedHolidays.map(h => (
                         <div key={h.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                               <div className="bg-red-100 text-red-700 font-bold text-xs px-2 py-1 rounded text-center min-w-[50px]">
                                  {new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                               </div>
                               <span className="text-sm font-medium text-slate-700">{h.name}</span>
                            </div>
                            {isAdmin && (
                               <button onClick={() => onDeleteHoliday(h.id)} className="text-slate-300 hover:text-red-500 px-2"><Trash2 size={14} /></button>
                            )}
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;