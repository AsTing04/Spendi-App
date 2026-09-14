import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
  PlusCircle, Trash2, Download, Upload, LogOut, Wallet, 
  TrendingUp, TrendingDown, DollarSign, Filter, Search, Lock, Mail, Key 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);

  // Expense Tracker State
  const [expenses, setExpenses] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // New Transaction Input
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');

  // Check active session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch expenses when session changes
  useEffect(() => {
    if (session?.user) {
      fetchExpenses();
    } else {
      setExpenses([]);
    }
  }, [session]);

  // Read: Fetch expenses for logged in user (RLS enforces user_id check)
  const fetchExpenses = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) console.error('Error fetching expenses:', error.message);
    else setExpenses(data || []);
    setFetching(false);
  };

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created successfully!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  // Create: Add transaction with Optimistic UI Update for zero lag
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newRecord = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      title,
      amount: parseFloat(amount),
      category,
      type,
      date: new Date().toISOString().split('T')[0]
    };

    // Optimistic Update
    setExpenses((prev) => [newRecord, ...prev]);
    setTitle('');
    setAmount('');

    const { data, error } = await supabase.from('expenses').insert([{
      title: newRecord.title,
      amount: newRecord.amount,
      category: newRecord.category,
      type: newRecord.type,
      date: newRecord.date,
      user_id: session.user.id
    }]).select();

    if (error) {
      alert('Failed to save transaction: ' + error.message);
      fetchExpenses(); // Rollback on error
    } else if (data && data[0]) {
      // Update with server generated ID
      setExpenses((prev) => prev.map(item => item.id === newRecord.id ? data[0] : item));
    }
  };

  // Delete transaction with Optimistic UI Update
  const handleDelete = async (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
      fetchExpenses();
    }
  };

  // JSON Features: Export user data
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `expenses_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON Features: Bulk Import
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!Array.isArray(importedData)) throw new Error('Invalid JSON format');

        const formatted = importedData.map(item => ({
          user_id: session.user.id,
          title: item.title || 'Untitled',
          amount: parseFloat(item.amount) || 0,
          category: item.category || 'Other',
          type: item.type === 'income' ? 'income' : 'expense',
          date: item.date || new Date().toISOString().split('T')[0]
        }));

        const { error } = await supabase.from('expenses').insert(formatted);
        if (error) throw error;
        
        fetchExpenses();
        alert('Data imported successfully!');
      } catch (err) {
        alert('Import Error: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Calculated Metrics
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [expenses, search, selectedCategory]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = expenses.filter(i => i.type === 'income').reduce((sum, i) => sum + Number(i.amount), 0);
    const expense = expenses.filter(i => i.type === 'expense').reduce((sum, i) => sum + Number(i.amount), 0);
    return { totalIncome: income, totalExpenses: expense, balance: income - expense };
  }, [expenses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Authentication Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Wallet className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            Strictly isolated user spending dashboard
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition shadow-lg shadow-indigo-600/30"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard Screen (Logged In)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SpendTracker</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400" /> Logged in as: {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
            >
              <Download className="w-4 h-4" /> Export JSON
            </button>

            <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition cursor-pointer">
              <Upload className="w-4 h-4" /> Import JSON
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Balance</p>
            <p className={`text-3xl font-bold mt-2 ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
              ₱{balance.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Income</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400 mt-2">+₱{totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Expenses</p>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-3xl font-bold text-rose-400 mt-2">-₱{totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Input & Records Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Transaction Form */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit">
            <h2 className="text-lg font-bold text-white mb-4">Add Transaction</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Grocery, Salary, etc." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Food">Food</option>
                    <option value="Bills">Bills</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Salary">Salary</option>
                    <option value="Fare">Fare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
              >
                <PlusCircle className="w-4 h-4" /> Add Record
              </button>
            </form>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-white">History</h2>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Bills">Bills</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Salary">Salary</option>
                  <option value="Fare">Fare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {fetching ? (
              <p className="text-center py-8 text-slate-500 text-sm">Loading records...</p>
            ) : filteredExpenses.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">No records found.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredExpenses.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold text-sm ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.type === 'income' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}