import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  Layers,
  Tag,
  Box,
  UserCheck,
  Calendar,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ExpenseGroup, Subcategory, Product, Payee, Expense } from '../types';
import { EXPENSE_GROUPS } from '../data/defaults';
import { generateId, formatRupiah } from '../lib/db';
import { AddSubcategoryModal, AddProductModal } from './QuickAddModal';

interface QuickExpenseFormProps {
  categories: Subcategory[];
  products: Product[];
  payees: Payee[];
  onSaveExpense: (expense: Expense) => Promise<void>;
  onAddSubcategory: (subcat: Subcategory) => Promise<void>;
  onAddProduct: (product: Product) => Promise<void>;
}

export const QuickExpenseForm: React.FC<QuickExpenseFormProps> = ({
  categories,
  products,
  payees,
  onSaveExpense,
  onAddSubcategory,
  onAddProduct,
}) => {
  // Form State
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<ExpenseGroup>('HPP');
  const [selectedSubcatId, setSelectedSubcatId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [payeeInput, setPayeeInput] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [showAddSubcatModal, setShowAddSubcatModal] = useState<boolean>(false);
  const [showAddProdModal, setShowAddProdModal] = useState<boolean>(false);
  const [payeeSuggestionsOpen, setPayeeSuggestionsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const payeeInputRef = useRef<HTMLInputElement>(null);

  // Filter subcategories for the selected group
  const availableSubcats = categories.filter((c) => c.groupId === selectedGroup);

  // Auto-select the first subcategory when group changes
  useEffect(() => {
    if (availableSubcats.length > 0) {
      // If current subcat is not in this group, select first one
      const exists = availableSubcats.some((c) => c.id === selectedSubcatId);
      if (!exists) {
        setSelectedSubcatId(availableSubcats[0].id);
      }
    } else {
      setSelectedSubcatId('');
    }
  }, [selectedGroup, categories]);

  // Selected subcategory object
  const currentSubcat = categories.find((c) => c.id === selectedSubcatId);
  const requiresProduct = currentSubcat ? currentSubcat.requiresProduct : false;

  // Auto-select first product if required and none selected
  useEffect(() => {
    if (requiresProduct && !selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [requiresProduct, products, selectedProductId]);

  // Amount parsing
  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, '') || '0', 10);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawVal);
    if (errorMsg) setErrorMsg(null);
  };

  const addAmountPreset = (addVal: number) => {
    const current = numericAmount;
    setAmountStr((current + addVal).toString());
    if (errorMsg) setErrorMsg(null);
  };

  const clearAmount = () => {
    setAmountStr('');
  };

  // Autocomplete payees
  const filteredPayees = payees.filter((p) =>
    p.name.toLowerCase().includes(payeeInput.toLowerCase().trim())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setErrorMsg('Nominal pengeluaran harus lebih dari Rp 0');
      return;
    }

    if (!selectedSubcatId || !currentSubcat) {
      setErrorMsg('Pilih subkategori terlebih dahulu');
      return;
    }

    if (requiresProduct && !selectedProductId) {
      setErrorMsg('Subkategori ini mewajibkan pemilihan Produk!');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProd = products.find((p) => p.id === selectedProductId);

      const newExpense: Expense = {
        id: generateId('exp'),
        date,
        amount: numericAmount,
        groupId: selectedGroup,
        subcategoryId: currentSubcat.id,
        subcategoryLabel: currentSubcat.label,
        productId: requiresProduct ? selectedProductId : undefined,
        productName: requiresProduct && selectedProd ? selectedProd.name : undefined,
        payee: payeeInput.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await onSaveExpense(newExpense);

      // Toast feedback
      setToastMessage(`Tersimpan: ${formatRupiah(numericAmount)} (${currentSubcat.label})`);
      setTimeout(() => setToastMessage(null), 3500);

      // Reset fields
      setAmountStr('');
      setNotes('');
      setErrorMsg(null);
      // Keep payee & product or clear based on preference
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGroupMeta = EXPENSE_GROUPS[selectedGroup];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-100 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* CARD 1: INPUT NOMINAL & PRESET */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            1. Nominal Pengeluaran (Rp)
          </label>

          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 font-bold text-lg">Rp</div>
            <input
              type="text"
              inputMode="numeric"
              value={numericAmount > 0 ? numericAmount.toLocaleString('id-ID') : ''}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-2xl sm:text-3xl font-extrabold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-tight"
            />
            {numericAmount > 0 && (
              <button
                type="button"
                onClick={clearAmount}
                className="absolute right-3.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/70 hover:bg-slate-200 px-2 py-1 rounded-md"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Amount Add Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[10000, 25000, 50000, 100000, 250000, 500000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => addAmountPreset(val)}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
              </button>
            ))}
          </div>
        </div>

        {/* CARD 2: KELOMPOK BIAYA (A. HPP, B. OPEX, C. CAPEX, D. PRIVE, E. LAIN) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              2. Kelompok Biaya
            </label>
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              {activeGroupMeta.fullName}
            </span>
          </div>

          {/* Group Segmented Buttons */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl">
            {(Object.keys(EXPENSE_GROUPS) as ExpenseGroup[]).map((group) => {
              const meta = EXPENSE_GROUPS[group];
              const isSelected = selectedGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? `${meta.badgeBg} ${meta.badgeText}` : 'text-slate-400'
                    }`}
                  >
                    {meta.code}
                  </span>
                  <span className="text-[11px] truncate w-full text-center">{group}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 mt-2 italic px-1">
            💡 {activeGroupMeta.description}
          </p>
        </div>

        {/* CARD 3: SUBKATEGORI (CHIPS + INLINE ADD) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              3. Subkategori ({selectedGroup})
            </label>
            <button
              type="button"
              onClick={() => setShowAddSubcatModal(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Subkategori
            </button>
          </div>

          {/* Subcategories Chip List */}
          <div className="flex flex-wrap gap-1.5">
            {availableSubcats.map((subcat) => {
              const isSelected = selectedSubcatId === subcat.id;
              return (
                <button
                  key={subcat.id}
                  type="button"
                  onClick={() => setSelectedSubcatId(subcat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {subcat.requiresProduct && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                      }`}
                      title="Terikat Produk"
                    >
                      🏷️ Produk
                    </span>
                  )}
                  <span>{subcat.label}</span>
                </button>
              );
            })}

            {/* Quick Add Button Chip */}
            <button
              type="button"
              onClick={() => setShowAddSubcatModal(true)}
              className="px-2.5 py-2 rounded-xl text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Baru</span>
            </button>
          </div>
        </div>

        {/* CARD 4: SMART DYNAMIC PRODUCT SELECTOR (ONLY APPEARS IF SUBCATEGORY REQUIRES PRODUCT) */}
        {requiresProduct && (
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-2xl p-4 shadow-xs border border-blue-200 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-blue-600" />
                4. Alokasikan ke Produk (HPP Langsung)
              </label>
              <button
                type="button"
                onClick={() => setShowAddProdModal(true)}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Produk
              </button>
            </div>

            <p className="text-xs text-blue-700/80 mb-2.5">
              Subkategori <strong className="text-blue-900">{currentSubcat?.label}</strong> terikat produk.
              Pilih produk tujuan biaya ini:
            </p>

            <div className="flex flex-wrap gap-2">
              {products.map((prod) => {
                const isSelected = selectedProductId === prod.id;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-blue-400/50 font-bold'
                        : 'bg-white text-slate-800 border-blue-200/80 hover:bg-blue-50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: prod.color || '#2563eb' }}
                    />
                    <span>{prod.name}</span>
                    {prod.code && (
                      <span className="text-[10px] opacity-70 font-mono">({prod.code})</span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowAddProdModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-dashed border-blue-300 text-blue-700 hover:bg-white transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Produk Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* CARD 5: PENERIMA / VENDOR (OPSIONAL DENGAN AUTOCOMPLETE & RECENT CHIPS) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              5. Pihak Penerima / Vendor / Toko{' '}
              <span className="text-[10px] font-normal text-slate-400 lowercase">(opsional)</span>
            </label>
          </div>

          <div className="relative">
            <input
              ref={payeeInputRef}
              type="text"
              value={payeeInput}
              onChange={(e) => {
                setPayeeInput(e.target.value);
                setPayeeSuggestionsOpen(true);
              }}
              onFocus={() => setPayeeSuggestionsOpen(true)}
              placeholder="Misal: Toko Berkah Bahan, PLN, SPBU, Pak Slamet..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Dropdown Suggestions */}
            {payeeSuggestionsOpen && payeeInput && filteredPayees.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-20 max-h-48 overflow-y-auto">
                {filteredPayees.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPayeeInput(p.name);
                      setPayeeSuggestionsOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between border-b border-slate-100 last:border-0"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.count}x digunakan</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Payee Chips */}
          {payees.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-400 self-center mr-1">Sering dipakai:</span>
              {payees.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayeeInput(p.name)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                    payeeInput === p.name
                      ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CARD 6: TANGGAL & CATATAN */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Catatan / Rincian Belanja
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Tepung Cakra 2 sak @ 125rb"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting || numericAmount <= 0}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white shadow-md flex items-center justify-center gap-2 transition-all ${
            numericAmount > 0 && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/25 cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {numericAmount > 0
              ? `Simpan Pengeluaran • ${formatRupiah(numericAmount)}`
              : 'Masukkan Nominal Pengeluaran'}
          </span>
        </button>
      </form>

      {/* MODALS */}
      <AddSubcategoryModal
        isOpen={showAddSubcatModal}
        onClose={() => setShowAddSubcatModal(false)}
        defaultGroup={selectedGroup}
        onAddSubcategory={async (newSubcat) => {
          await onAddSubcategory(newSubcat);
          setSelectedGroup(newSubcat.groupId);
          setSelectedSubcatId(newSubcat.id);
        }}
      />

      <AddProductModal
        isOpen={showAddProdModal}
        onClose={() => setShowAddProdModal(false)}
        onOpenImport={() => setShowImportProdModal(true)}
        onAddProduct={async (newProd) => {
          await onAddProduct(newProd);
          setSelectedProductId(newProd.id);
        }}
      />
    </div>
  );
};
