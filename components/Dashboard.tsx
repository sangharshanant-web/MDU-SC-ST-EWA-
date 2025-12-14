import React, { useMemo, useState } from 'react';
import { Member, Transaction, Grievance } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Users, Wallet, TrendingUp, TrendingDown, Activity, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  grievances: Grievance[];
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6'];

const Dashboard: React.FC<DashboardProps> = ({ members, transactions, grievances }) => {
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const totalIncome = transactions
      .filter(t => t.type === 'SUBSCRIPTION' || t.type === 'DONATION')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    return { totalMembers, totalIncome, totalExpense, balance };
  }, [members, transactions]);

  // Yearly Report Stats
  const reportStats = useMemo(() => {
    const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === reportYear);
    const yearGrievances = grievances.filter(g => new Date(g.dateReported).getFullYear() === reportYear);

    const income = yearTransactions
      .filter(t => t.type === 'SUBSCRIPTION' || t.type === 'DONATION')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expense = yearTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const solved = yearGrievances.filter(g => g.status === 'RESOLVED').length;
    const pending = yearGrievances.filter(g => g.status === 'PENDING').length;

    return { income, expense, balance: income - expense, solved, pending, totalIssues: yearGrievances.length };
  }, [transactions, grievances, reportYear]);

  const pieData = [
    { name: 'Income', value: stats.totalIncome },
    { name: 'Expense', value: stats.totalExpense },
  ];

  // Group transactions by month for the bar chart
  const barData = useMemo(() => {
    const data: Record<string, { name: string; Income: number; Expense: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.toLocaleString('default', { month: 'short' })}`;
      
      if (!data[key]) {
        data[key] = { name: key, Income: 0, Expense: 0 };
      }

      if (t.type === 'EXPENSE') {
        data[key].Expense += t.amount;
      } else {
        data[key].Income += t.amount;
      }
    });

    return Object.values(data).slice(-6); // Last 6 months
  }, [transactions]);

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <header className="mb-4">
        <h2 className="text-2xl font-extrabold text-slate-800">Overview</h2>
        <p className="text-slate-500 text-sm font-medium">Association Dashboard</p>
      </header>

      {/* Key Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 p-3 opacity-5">
             <Users size={64} className="text-blue-600" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Members</span>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats.totalMembers}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden hover:shadow-md transition">
          <div className="absolute right-0 top-0 p-3 opacity-10">
             <Wallet size={64} className="text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Wallet size={20} />
            </div>
          </div>
          <span className="text-emerald-600/70 text-xs font-bold uppercase tracking-wider">Balance</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹{stats.balance.toLocaleString()}</p>
        </div>
        
        {/* Added extra stats for Desktop view */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition hidden sm:block">
           <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Income</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{stats.totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition hidden sm:block">
           <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Expense</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{stats.totalExpense.toLocaleString()}</p>
        </div>
      </div>

      {/* Yearly Report Section */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <FileText size={16}/> YEARLY REPORT
          </h3>
          <select 
            value={reportYear} 
            onChange={(e) => setReportYear(Number(e.target.value))}
            className="bg-slate-700 text-white text-xs font-bold p-1.5 rounded-lg border-none outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Income</p>
             <p className="font-extrabold text-xl text-green-600">₹{reportStats.income.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenditure</p>
             <p className="font-extrabold text-xl text-red-600">₹{reportStats.expense.toLocaleString()}</p>
          </div>
          
          <div className="col-span-2 md:col-span-2 md:border-l md:border-slate-100 md:pl-6 md:pt-0 border-t border-slate-100 pt-4 flex justify-between px-2">
             <div className="flex flex-col items-center">
               <span className="bg-orange-100 text-orange-600 p-1.5 rounded-full mb-1"><AlertCircle size={14} /></span>
               <p className="text-xs font-bold text-slate-700">{reportStats.totalIssues}</p>
               <p className="text-[9px] text-slate-400 font-bold">ISSUES</p>
             </div>
             <div className="flex flex-col items-center">
               <span className="bg-green-100 text-green-600 p-1.5 rounded-full mb-1"><CheckCircle size={14} /></span>
               <p className="text-xs font-bold text-slate-700">{reportStats.solved}</p>
               <p className="text-[9px] text-slate-400 font-bold">SOLVED</p>
             </div>
             <div className="flex flex-col items-center">
               <span className="bg-red-100 text-red-600 p-1.5 rounded-full mb-1"><Activity size={14} /></span>
               <p className="text-xs font-bold text-slate-700">{reportStats.pending}</p>
               <p className="text-[9px] text-slate-400 font-bold">PENDING</p>
             </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-72">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
            <Activity size={14} /> Financial Ratio
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => `₹${value.toLocaleString()}`} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-72">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">6-Month Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => `₹${value.toLocaleString()}`} 
              />
              <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} iconType="circle" />
              <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;