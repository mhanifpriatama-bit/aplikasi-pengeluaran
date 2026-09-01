import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Box,
  UserCheck,
  Edit2,
  Trash2,
  ArrowUpDown,
  Tag,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, ExpenseGroup, Subcategory, Product, Payee } from '../types';
import { EXPENSE_GROUPS } from '../data/defaults';
import { formatRupiah, formatDateIndonesian } from '../lib/db';
import { EditExpenseModal } from './EditExpenseModal';

interface TransactionHistoryProps {
  expenses: Expense[];
  categories: Subcategory[];
  products: Product[];
  payees: Payee[];
  onUpdateExpense: (updated: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  expenses,
  categories,
  products,
  payees,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | ExpenseGroup>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const thisMonthPrefix = `${currentYear}-${currentMonth}`;

    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const prevMonthPrefix = `${prevYear}-${prevMonth}`;

    return expenses.filter((exp) => {
      // Group filter
      if (selectedGroup !== 'ALL' && exp.groupId !== selectedGroup) return false;

      // Product filter
      if (selectedProduct !== 'ALL' && exp.productId !== selectedProduct) return false;

      // Date filter
      if (dateFilter === 'TODAY' && exp.date !== todayStr) return false;
      if (dateFilter === '7DAYS' && exp.date < sevenDaysAgo) return false;
      if (dateFilter === 'THIS_MONTH' && !exp.date.startsWith(thisMonthPrefix)) return false;
      if (dateFilter === 'LAST_MONTH' && !exp.date.startsWith(prevMonthPrefix)) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNotes = (exp.notes || '').toLowerCase().includes(query);
        const matchPayee = (exp.payee || '').toLowerCase().includes(query);
        const matchSubcat = (exp.subcategoryLabel || '').toLowerCase().includes(query);
        const matchProd = (exp.productName || '').toLowerCase().includes(query);
        const matchAmount = exp.amount.toString().includes(query);
        if (!matchNotes && !matchPayee && !matchSubcat && !matchProd && !matchAmount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'date_asc') {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [expenses, selectedGroup, selectedProduct, dateFilter, searchTerm, sortBy]);

  // Total calculated for current filter
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['Tanggal', 'Kelompok', 'Subkategori', 'Produk Terkait', 'Penerima / Vendor', 'Nominal', 'Catatan'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      e.groupId,
      `"${e.subcategoryLabel.replace(/"/g, '""')}"`,
      e.productName ? `"${e.productName.replace(/"/g, '""')}"` : '-',
      e.payee ? `"${e.payee.replace(/"/g, '""')}"` : '-',
      e.amount,
      e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '-',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pengeluaran_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3.5">
      {/* FILTER & SEARCH CARD */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari transaksi, toko/vendor, catatan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Group Filter Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kelompok Biaya
            </span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGroup === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({expenses.length})
            </button>
            {(Object.keys(EXPENSE_GROUPS) as ExpenseGroup[]).map((g) => {
              const meta = EXPENSE_GROUPS[g];
              const count = expenses.filter((e) => e.groupId === g).length;
              const isSelected = selectedGroup === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeText} border-blue-500 ring-2 ring-blue-400/30`
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary filters (Product, Date, Sort) */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Product Filter */}
          <div>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="7DAYS">7 Hari Terakhir</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="date_desc">Terbaru</option>
              <option value="date_asc">Terlama</option>
              <option value="amount_desc">Nominal Tertinggi</option>
              <option value="amount_asc">Nominal Terendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* FILTER SUMMARY BAR & EXPORT CSV */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="text-slate-600 font-medium">
          Menampilkan <strong className="text-slate-900">{filteredExpenses.length}</strong> transaksi •{' '}
          <span className="text-blue-700 font-bold">{formatRupiah(totalAmount)}</span>
        </div>

        {filteredExpenses.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
        )}
      </div>

      {/* EXPENSE LIST */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-700 text-sm">Tidak ada transaksi ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Coba ubah filter pencarian atau catat pengeluaran baru pada tab form input.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => {
            const groupMeta = EXPENSE_GROUPS[exp.groupId] || EXPENSE_GROUPS.LAIN;
            const prod = products.find((p) => p.id === exp.productId);

            return (
              <div
                key={exp.id}
                onClick={() => setEditingExpense(exp)}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer border-l-4 ${groupMeta.accentColor}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {/* Header tags: Group, Subcategory, Product */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${groupMeta.badgeBg} ${groupMeta.badgeText} border ${groupMeta.badgeBorder}`}
                      >
                        {groupMeta.label}
                      </span>

                      <span className="text-xs font-bold text-slate-800">
                        {exp.subcategoryLabel}
                      </span>

                      {/* Product Tag */}
                      {exp.productName && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: prod?.color || '#2563eb' }}
                          />
                          🏷️ {exp.productName}
                        </span>
                      )}
                    </div>

                    {/* Payee & Notes */}
                    {exp.payee && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium pt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exp.payee}</span>
                      </div>
                    )}

                    {exp.notes && (
                      <p className="text-xs text-slate-500 leading-snug line-clamp-2 pt-0.5">
                        {exp.notes}
                      </p>
                    )}
                  </div>

                  {/* Right side: Amount & Date */}
                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      {formatRupiah(exp.amount)}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateIndonesian(exp.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      <EditExpenseModal
        isOpen={Boolean(editingExpense)}
        expense={editingExpense}
        categories={categories}
        products={products}
        payees={payees}
        onClose={() => setEditingExpense(null)}
        onUpdate={onUpdateExpense}
        onDelete={onDeleteExpense}
      />
    </div>
  );
};
