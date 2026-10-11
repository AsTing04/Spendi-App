import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Calendar } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function Dashboard({ session }) {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');
  const [groupBy, setGroupBy] = useState('daily'); // Default to 'daily'
  const [loading, setLoading] = useState(false);

  const expenseCategories = ['Food', 'Transpo', 'Bills', 'Others'];
  const incomeCategories = ['Salary', 'Allowance', 'Interest'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setExpenses(data);
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    setCategory(newType === 'expense' ? expenseCategories[0] : incomeCategories[0]);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than ₱0.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('expenses').insert([
      { title, amount: parsedAmount, category, type }
    ]);

    if (error) {
      alert(`Error adding entry: ${error.message}`);
    } else {
      setTitle('');
      setAmount('');
      fetchExpenses();
    }
    setLoading(false);
  };

  const handleDeleteExpense = async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) fetchExpenses();
  };

  // Date Formatting Helpers
  const getDayGroupKey = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthGroupKey = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getWeekGroupKey = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diffToMonday));
    return `Week of ${monday.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Grouping Logic
  const groupTransactions = () => {
    if (groupBy === 'all') return { 'All Transactions': expenses };

    return expenses.reduce((groups, item) => {
      let key;
      if (groupBy === 'daily') key = getDayGroupKey(item.created_at);
      else if (groupBy === 'week') key = getWeekGroupKey(item.created_at);
      else key = getMonthGroupKey(item.created_at);

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  };

  const groupedExpenses = groupTransactions();

  // Overall Totals
  const totalIncome = expenses.filter((i) => i.type === 'income').reduce((acc, i) => acc + Number(i.amount), 0);
  const totalExpenses = expenses.filter((i) => i.type === 'expense').reduce((acc, i) => acc + Number(i.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  // Today's Specific Totals
  const todayStr = new Date().toDateString();
  const todaysItems = expenses.filter((i) => new Date(i.created_at).toDateString() === todayStr);
  const todaysIncome = todaysItems.filter((i) => i.type === 'income').reduce((acc, i) => acc + Number(i.amount), 0);
  const todaysExpenses = todaysItems.filter((i) => i.type === 'expense').reduce((acc, i) => acc + Number(i.amount), 0);
  const todaysBalance = todaysIncome - todaysExpenses;

  return (
    <div className="space-y-6">
      {/* Today's Daily Summary Bar */}
      <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">Today's Remaining Balance</span>
          <h3 className="text-xl font-bold">{formatCurrency(todaysBalance)}</h3>
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-emerald-300 block">Today's Earnings</span>
            <strong className="text-sm">+{formatCurrency(todaysIncome)}</strong>
          </div>
          <div>
            <span className="text-red-300 block">Today's Expenses</span>
            <strong className="text-sm">-{formatCurrency(todaysExpenses)}</strong>
          </div>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Net Balance</span>
            <Wallet className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(netBalance)}</h2>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Income</span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</h2>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-red-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Expenses</span>
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</h2>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAddExpense} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
            placeholder="e.g. Lunch, Baon"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₱)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Type</label>
          <select
            value={type}
            onChange={handleTypeChange}
            className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
          >
            {(type === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add
        </button>
      </form>

      {/* Group Controls */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaction History</h3>
        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setGroupBy('daily')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              groupBy === 'daily' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setGroupBy('week')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              groupBy === 'week' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setGroupBy('month')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              groupBy === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setGroupBy('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              groupBy === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Grouped Table */}
      <div className="space-y-6">
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-700">
            No records found.
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([groupTitle, items]) => {
            const groupIncome = items.filter((i) => i.type === 'income').reduce((sum, i) => sum + Number(i.amount), 0);
            const groupExpense = items.filter((i) => i.type === 'expense').reduce((sum, i) => sum + Number(i.amount), 0);
            const groupBalance = groupIncome - groupExpense;

            return (
              <div key={groupTitle} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{groupTitle}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(groupIncome)}</span>
                    <span className="text-red-600 dark:text-red-400">-{formatCurrency(groupExpense)}</span>
                    <span className="text-slate-600 dark:text-slate-300 border-l pl-3 border-slate-300 dark:border-slate-600">
                      Bal: {formatCurrency(groupBalance)}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800 dark:text-white">{item.title}</h5>
                        <span className="text-xs text-slate-400 capitalize">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                        </span>
                        <button onClick={() => handleDeleteExpense(item.id)} className="text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
