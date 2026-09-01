import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, FileText, Tag, Box, UserCheck, Layers } from 'lucide-react';
import { Expense, ExpenseGroup, Subcategory, Product, Payee } from '../types';
import { EXPENSE_GROUPS } from '../data/defaults';
import { formatRupiah } from '../lib/db';

interface EditExpenseModalProps {
  isOpen: boolean;
  expense: Expense | null;
  categories: Subcategory[];
  products: Product[];
  payees: Payee[];
  onClose: () => void;
  onUpdate: (updated: Expense) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  expense,
  categories,
  products,
  payees,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [groupId, setGroupId] = useState<ExpenseGroup>('HPP');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (expense) {
      setAmountStr(expense.amount.toString());
      setGroupId(expense.groupId);
      setSubcategoryId(expense.subcategoryId);
      setProductId(expense.productId || '');
      setPayee(expense.payee || '');
      setDate(expense.date);
      setNotes(expense.notes || '');
      setIsDeleting(false);
      setError('');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const currentSubcat = categories.find((c) => c.id === subcategoryId);
  const requiresProduct = currentSubcat ? currentSubcat.requiresProduct : false;
  const availableSubcats = categories.filter((c) => c.groupId === groupId);

  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, '') || '0', 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }
    if (!subcategoryId || !currentSubcat) {
      setError('Pilih subkategori');
      return;
    }
    if (requiresProduct && !productId) {
      setError('Subkategori ini mewajibkan pemilihan produk!');
      return;
    }

    const selectedProd = products.find((p) => p.id === productId);

    const updatedExpense: Expense = {
      ...expense,
      amount: numericAmount,
      date,
      groupId,
      subcategoryId,
      subcategoryLabel: currentSubcat.label,
      productId: requiresProduct ? productId : undefined,
      productName: requiresProduct && selectedProd ? selectedProd.name : undefined,
      payee: payee.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: Date.now(),
    };

    await onUpdate(updatedExpense);
    onClose();
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    await onDelete(expense.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Edit Transaksi Pengeluaran</h3>
            <p className="text-xs text-slate-500">Ubah data atau hapus catatan ini</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={numericAmount > 0 ? numericAmount.toLocaleString('id-ID') : ''}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kelompok Biaya</label>
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              {(Object.keys(EXPENSE_GROUPS) as ExpenseGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGroupId(g);
                    const subs = categories.filter((c) => c.groupId === g);
                    if (subs.length > 0) setSubcategoryId(subs[0].id);
                  }}
                  className={`py-1.5 rounded-lg font-bold text-center transition-all ${
                    groupId === g ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-600'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subkategori</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableSubcats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} {c.requiresProduct ? '(🏷️ Terikat Produk)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product (if required) */}
          {requiresProduct && (
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
              <label className="block text-xs font-bold text-blue-900 mb-1">Alokasi Produk (Wajib)</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vendor / Payee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima / Toko / Vendor</label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="Misal: Toko Berkah Bahan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rincian / keterangan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDeleting
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Konfirmasi Hapus?' : 'Hapus'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
