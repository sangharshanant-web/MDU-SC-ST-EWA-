import React, { useState } from 'react';
import { Member, Transaction } from '../types';
import { Search, Plus, Phone, Trash2, MapPin, Briefcase, CheckCircle, Clock, Edit, FileText, ShieldAlert } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MembersProps {
  members: Member[];
  transactions: Transaction[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  isAdmin: boolean;
}

const Members: React.FC<MembersProps> = ({ members, transactions, onAddMember, onUpdateMember, onDeleteMember, isAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'DUE'>('ALL');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    designation: '',
    placeOfPosting: '',
    category: 'SC',
    mobile: '',
    role: 'MEMBER'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      designation: member.designation,
      placeOfPosting: member.placeOfPosting,
      category: member.category,
      mobile: member.mobile,
      role: member.role || 'MEMBER'
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({ name: '', designation: '', placeOfPosting: '', category: 'SC', mobile: '', role: 'MEMBER' });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.mobile) {
      if (editingId) {
        // Update existing
        const updatedMember: Member = {
          id: editingId,
          name: formData.name,
          designation: formData.designation || 'Member',
          placeOfPosting: formData.placeOfPosting || 'Unknown',
          category: formData.category || 'SC',
          mobile: formData.mobile,
          joinedDate: members.find(m => m.id === editingId)?.joinedDate || new Date().toISOString(),
          role: formData.role as 'MEMBER' | 'LIAISON'
        };
        onUpdateMember(updatedMember);
      } else {
        // Add new
        const newMember: Member = {
          id: Date.now().toString(),
          name: formData.name,
          designation: formData.designation || 'Member',
          placeOfPosting: formData.placeOfPosting || 'Unknown',
          category: formData.category || 'SC',
          mobile: formData.mobile,
          joinedDate: new Date().toISOString(),
          role: formData.role as 'MEMBER' | 'LIAISON'
        };
        onAddMember(newMember);
      }
      resetForm();
    }
  };

  // Check Subscription Status
  const isSubscriptionPaid = (memberId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.some(t => {
      const tDate = new Date(t.date);
      return t.memberId === memberId && 
             t.type === 'SUBSCRIPTION' && 
             tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear;
    });
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.placeOfPosting.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const paid = isSubscriptionPaid(m.id);
    if (filter === 'PAID') return paid;
    if (filter === 'DUE') return !paid;
    return true;
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("MDU SC/ST EWA - Members List", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

    const tableData = filteredMembers.map(m => [
      m.name,
      m.designation,
      m.placeOfPosting,
      m.category,
      m.mobile,
      isSubscriptionPaid(m.id) ? 'Paid' : 'Due'
    ]);

    autoTable(doc, {
      head: [['Name', 'Designation', 'Posting', 'Cat', 'Mobile', 'Status']],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] }
    });

    doc.save('MDU_EWA_Members.pdf');
  };

  if (isAdding) {
    return (
      <div className="pb-20 md:pb-0 animate-fade-in max-w-2xl mx-auto">
         <header className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Member' : 'Add Member'}</h2>
            <button type="button" onClick={resetForm} className="text-sm text-slate-500 font-medium">Cancel</button>
         </header>
         <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
              <input name="designation" value={formData.designation} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Senior Clerk" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Place of Posting</label>
              <input name="placeOfPosting" value={formData.placeOfPosting} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Zonal Office" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none">
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                <input name="mobile" type="tel" required value={formData.mobile} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="9876543210" />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              {editingId ? 'Update Member' : 'Save Member'}
            </button>
         </form>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0 space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Members List</h2>
          <p className="text-slate-500 text-sm">Transparent Directory</p>
        </div>
        <div className="flex gap-2">
           <button onClick={generatePDF} className="bg-red-500 text-white p-2 rounded-lg shadow-lg hover:bg-red-600 transition" title="Export PDF">
             <FileText size={24} />
           </button>
           {isAdmin && (
            <button onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition">
              <Plus size={24} />
            </button>
           )}
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Subscription Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto min-w-[300px]">
            <button 
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${filter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
            All ({members.length})
            </button>
            <button 
            onClick={() => setFilter('PAID')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${filter === 'PAID' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
            >
            Paid
            </button>
            <button 
            onClick={() => setFilter('DUE')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${filter === 'DUE' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500'}`}
            >
            Due
            </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-blue-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Responsive Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-10">No members found.</div>
        ) : (
          filteredMembers.map(member => {
            const isPaid = isSubscriptionPaid(member.id);
            return (
              <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 transition hover:shadow-md h-full">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold relative">
                      {member.name.charAt(0)}
                      {isPaid ? (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                          <CheckCircle size={10} />
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white">
                          <Clock size={10} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2 truncate max-w-[150px]">
                        {member.name}
                        {member.role === 'LIAISON' && <span title="Liaison Officer"><ShieldAlert size={14} className="text-orange-500" /></span>}
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">{member.category}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isPaid ? 'Paid' : 'Due'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(member)} className="text-slate-300 hover:text-blue-500 p-1">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => onDeleteMember(member.id)} className="text-slate-300 hover:text-red-500 p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mt-auto pt-2 border-t border-slate-50">
                   <div className="flex items-center gap-2 truncate">
                      <Briefcase size={14} className="text-slate-400 shrink-0"/> <span className="truncate">{member.designation}</span>
                   </div>
                   <div className="flex items-center gap-2 truncate">
                      <MapPin size={14} className="text-slate-400 shrink-0"/> <span className="truncate">{member.placeOfPosting}</span>
                   </div>
                   {/* Phone Call Action */}
                   <a href={`tel:${member.mobile}`} className="flex items-center gap-2 col-span-2 p-1.5 -mx-1.5 rounded-lg hover:bg-blue-50 transition group cursor-pointer border border-transparent hover:border-blue-100 mt-1">
                      <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 group-hover:bg-green-500 group-hover:text-white transition">
                        <Phone size={14} /> 
                      </div>
                      <span className="font-mono font-medium text-slate-700 group-hover:text-green-700 transition">{member.mobile}</span>
                      <span className="text-[10px] font-bold text-green-600 ml-auto bg-green-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition">CALL</span>
                   </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Members;