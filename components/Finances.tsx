import React, { useState, useMemo } from 'react';
import { Transaction, Member, TransactionType } from '../types';
import { Plus, ArrowDownLeft, ArrowUpRight, Calendar, Wallet, TrendingUp, TrendingDown, Filter, FileText, Table2, List } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancesProps {
  transactions: Transaction[];
  members: Member[];
  onAddTransaction: (t: Transaction) => void;
  isAdmin: boolean;
}

const Finances: React.FC<FinancesProps> = ({ transactions, members, onAddTransaction, isAdmin }) => {
  const [viewMode, setViewMode] = useState<'TRANSACTIONS' | 'LEDGER'>('TRANSACTIONS');
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  
  // Ledger Filters
  const [ledgerYear, setLedgerYear] = useState<number>(new Date().getFullYear());
  const [ledgerMonth, setLedgerMonth] = useState<number>(new Date().getMonth()); // 0-11

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    type: 'SUBSCRIPTION' as TransactionType,
    description: '',
    memberId: '',
    date: new Date().toISOString().split('T')[0]
  });

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'SUBSCRIPTION' || t.type === 'DONATION')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // --- LEDGER CALCULATION ---
  const fullLedger = useMemo(() => {
    // Sort ascending by date for calculation
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    return sorted.map(t => {
      const isExpense = t.type === 'EXPENSE';
      const income = isExpense ? 0 : t.amount;
      const expense = isExpense ? t.amount : 0;
      const prevBalance = runningBalance;
      runningBalance += income - expense;
      
      return {
        ...t,
        prevBalance,
        income,
        expense,
        balance: runningBalance
      };
    });
  }, [transactions]);

  const filteredLedgerData = useMemo(() => {
    return fullLedger.filter(row => {
      const d = new Date(row.date);
      return d.getFullYear() === ledgerYear && d.getMonth() === ledgerMonth;
    });
  }, [fullLedger, ledgerYear, ledgerMonth]);

  const ledgerOpeningBalance = useMemo(() => {
    if (filteredLedgerData.length > 0) {
      return filteredLedgerData[0].prevBalance;
    }
    // If no data in this month, we need to find the balance at the end of the previous relevant transaction
    // Or just calculate it up to the start of this month
    const startOfPeriod = new Date(ledgerYear, ledgerMonth, 1).getTime();
    const priorTransactions = transactions.filter(t => new Date(t.date).getTime() < startOfPeriod);
    
    const income = priorTransactions
      .filter(t => t.type !== 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = priorTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    return income - expense;
  }, [filteredLedgerData, transactions, ledgerYear, ledgerMonth]);

  const ledgerClosingBalance = useMemo(() => {
    if (filteredLedgerData.length > 0) {
      return filteredLedgerData[filteredLedgerData.length - 1].balance;
    }
    return ledgerOpeningBalance;
  }, [filteredLedgerData, ledgerOpeningBalance]);


  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'SUBSCRIPTION' && !formData.memberId) {
      alert("Please select a member for the subscription.");
      return;
    }
    if (formData.amount && formData.type && formData.date) {
      const desc = formData.description || (formData.type === 'SUBSCRIPTION' ? 'Monthly Subscription' : 'Expense');
      const dateObj = new Date(formData.date);
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: dateObj.toISOString(),
        amount: Number(formData.amount),
        type: formData.type as TransactionType,
        description: desc,
        memberId: formData.memberId
      };
      onAddTransaction(newTransaction);
      setFormData({ 
        amount: '', 
        type: 'SUBSCRIPTION', 
        description: '', 
        memberId: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      setIsAdding(false);
    }
  };

  const sortedTransactions = [...transactions]
    .filter(t => {
      if (filterType === 'ALL') return true;
      if (filterType === 'INCOME') return t.type !== 'EXPENSE';
      if (filterType === 'EXPENSE') return t.type === 'EXPENSE';
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- PDF GENERATORS ---
  const generateListPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("MDU SC/ST EWA - Transaction Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);
    doc.text(`Filter: ${filterType}`, 14, 30);
    
    const tableData = sortedTransactions.map(t => {
      const memberName = t.memberId ? members.find(m => m.id === t.memberId)?.name || 'N/A' : '-';
      return [new Date(t.date).toLocaleDateString(), t.type, t.description, memberName, t.amount.toString()];
    });

    autoTable(doc, {
      head: [['Date', 'Type', 'Description', 'Member', 'Amount (Rs)']],
      body: tableData,
      startY: 40,
    });
    doc.save('MDU_EWA_Transactions.pdf');
  };

  const generateLedgerPDF = () => {
    const doc = new jsPDF();
    const monthName = new Date(ledgerYear, ledgerMonth).toLocaleString('default', { month: 'long' });
    
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("MDU SC/ST EWA - Monthly Ledger", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Period: ${monthName} ${ledgerYear}`, 14, 28);
    
    doc.setFontSize(10);
    doc.text(`Opening Balance: Rs. ${ledgerOpeningBalance.toLocaleString()}`, 14, 35);
    doc.text(`Closing Balance: Rs. ${ledgerClosingBalance.toLocaleString()}`, 14, 40);

    const tableData = filteredLedgerData.map(row => [
      new Date(row.date).toLocaleDateString(),
      row.description,
      row.prevBalance.toLocaleString(),
      row.income > 0 ? row.income.toLocaleString() : '-',
      row.expense > 0 ? row.expense.toLocaleString() : '-',
      row.balance.toLocaleString()
    ]);

    autoTable(doc, {
      head: [['Date', 'Description', 'Prev Bal', 'Income', 'Expense', 'Balance']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [44, 62, 80] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right', textColor: [0, 128, 0] },
        4: { halign: 'right', textColor: [255, 0, 0] },
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Add Summary at bottom
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Net Closing Balance: Rs. ${ledgerClosingBalance.toLocaleString()}`, 14, finalY + 10);

    doc.save(`MDU_EWA_Ledger_${monthName}_${ledgerYear}.pdf`);
  };

  if (isAdding) {
    return (
      <div className="pb-20 animate-fade-in">
         <header className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Add Entry</h2>
            <button type="button" onClick={() => setIsAdding(false)} className="text-sm font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-lg">Cancel</button>
         </header>
         <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Transaction Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['SUBSCRIPTION', 'DONATION', 'EXPENSE'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type: type as TransactionType})}
                    className={`py-2 text-xs font-bold rounded-lg border-2 transition ${formData.type === type ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date <span className="text-red-500">*</span></label>
              <input name="date" type="date" required value={formData.date} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 transition font-mono" />
            </div>
            {formData.type === 'SUBSCRIPTION' && (
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Member <span className="text-red-500">*</span></label>
                <select name="memberId" value={formData.memberId} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 transition" required>
                  <option value="">-- Choose Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Amount (₹) <span className="text-red-500">*</span></label>
              <input name="amount" type="number" required min="1" value={formData.amount} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 transition text-lg font-mono" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 transition" placeholder={formData.type === 'SUBSCRIPTION' ? "Monthly subscription" : "Details about this entry..."} />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition transform active:scale-95">
              Save Entry
            </button>
         </form>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Treasury</h2>
          <p className="text-slate-500 text-sm font-medium">
             {viewMode === 'TRANSACTIONS' ? 'Association Funds' : 'Detailed Ledger'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="bg-indigo-600 text-white px-3 py-2 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2 font-bold text-sm"
          >
            <Plus size={18} /> Add
          </button>
        )}
      </header>

      {/* Colorful Summary Card */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-purple-100 text-sm font-medium mb-1 flex items-center gap-2"><Wallet size={16}/> Net Available Balance</p>
          <h3 className="text-4xl font-extrabold mb-6">₹ {stats.balance.toLocaleString()}</h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/20 backdrop-blur-md rounded-xl p-3">
               <div className="flex items-center gap-1 text-green-300 text-xs font-bold mb-1">
                 <TrendingUp size={12} /> INCOME
               </div>
               <p className="font-bold text-lg">₹ {stats.income.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur-md rounded-xl p-3">
               <div className="flex items-center gap-1 text-red-300 text-xs font-bold mb-1">
                 <TrendingDown size={12} /> EXPENSE
               </div>
               <p className="font-bold text-lg">₹ {stats.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/30 rounded-full blur-2xl -ml-10 -mb-10"></div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setViewMode('TRANSACTIONS')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${viewMode === 'TRANSACTIONS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          <List size={14} /> Transactions
        </button>
        <button 
          onClick={() => setViewMode('LEDGER')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${viewMode === 'LEDGER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Table2 size={14} /> Ledger Book
        </button>
      </div>

      {viewMode === 'TRANSACTIONS' ? (
        <>
          {/* List Filters */}
          <div className="flex justify-between items-center">
             <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {['ALL', 'INCOME', 'EXPENSE'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f as any)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition whitespace-nowrap ${filterType === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                    {f}
                  </button>
                ))}
             </div>
             <button onClick={generateListPDF} className="text-slate-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm border border-slate-100">
                <FileText size={18} />
             </button>
          </div>

          <div className="space-y-3">
            {sortedTransactions.length === 0 ? (
               <div className="text-center py-12 opacity-50">
                 <Filter size={48} className="mx-auto mb-3 text-slate-300" />
                 <p className="text-slate-400 font-medium">No records found for this filter.</p>
               </div>
            ) : (
              sortedTransactions.map(t => {
                const isExpense = t.type === 'EXPENSE';
                return (
                  <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center transition hover:shadow-md">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${isExpense ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                          {isExpense ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{t.description}</p>
                          <div className="flex items-center text-xs text-slate-400 gap-2 mt-1">
                             <Calendar size={12} />
                             {new Date(t.date).toLocaleDateString()}
                          </div>
                        </div>
                     </div>
                     <span className={`font-bold text-base whitespace-nowrap ${isExpense ? 'text-red-500' : 'text-green-600'}`}>
                       {isExpense ? '-' : '+'} ₹{t.amount}
                     </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="animate-fade-in space-y-4">
          {/* Ledger Filters */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-2">
             <div className="flex-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Year</label>
                <select 
                  value={ledgerYear} 
                  onChange={(e) => setLedgerYear(Number(e.target.value))}
                  className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm font-bold text-slate-700 outline-none"
                >
                   {[...Array(5)].map((_, i) => {
                      const y = new Date().getFullYear() - i;
                      return <option key={y} value={y}>{y}</option>
                   })}
                </select>
             </div>
             <div className="flex-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Month</label>
                <select 
                  value={ledgerMonth} 
                  onChange={(e) => setLedgerMonth(Number(e.target.value))}
                  className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm font-bold text-slate-700 outline-none"
                >
                   {Array.from({length: 12}, (_, i) => (
                      <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                   ))}
                </select>
             </div>
             <div className="flex items-end">
               <button onClick={generateLedgerPDF} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 transition" title="Download PDF Ledger">
                  <FileText size={20} />
               </button>
             </div>
          </div>

          {/* Ledger Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             {/* Opening Balance Row */}
             <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Opening Balance</span>
                <span className="text-sm font-bold text-slate-800">₹ {ledgerOpeningBalance.toLocaleString()}</span>
             </div>
             
             {/* Table */}
             <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                   <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                      <tr>
                         <th className="px-4 py-3 text-left">Date</th>
                         <th className="px-4 py-3 text-left">Desc</th>
                         <th className="px-4 py-3 text-right text-green-600">Income</th>
                         <th className="px-4 py-3 text-right text-red-500">Exp.</th>
                         <th className="px-4 py-3 text-right">Bal.</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-sm">
                      {filteredLedgerData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No transactions in this period.</td>
                        </tr>
                      ) : (
                        filteredLedgerData.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                             <td className="px-4 py-3 font-mono text-xs text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                             <td className="px-4 py-3 text-slate-700 max-w-[150px] truncate" title={row.description}>{row.description}</td>
                             <td className="px-4 py-3 text-right text-green-600 font-medium">
                               {row.income > 0 ? `₹${row.income}` : '-'}
                             </td>
                             <td className="px-4 py-3 text-right text-red-500 font-medium">
                               {row.expense > 0 ? `₹${row.expense}` : '-'}
                             </td>
                             <td className="px-4 py-3 text-right font-bold text-slate-800">
                               ₹{row.balance.toLocaleString()}
                             </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>

             {/* Closing Balance Row */}
             <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                <span className="text-xs font-bold uppercase">Closing Balance</span>
                <span className="text-lg font-bold">₹ {ledgerClosingBalance.toLocaleString()}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finances;