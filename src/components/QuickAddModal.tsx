import React, { useState } from 'react';
import { X, Plus, Tag, Box, Check, Sparkles, Upload } from 'lucide-react';
import { ExpenseGroup, Subcategory, Product } from '../types';
import { EXPENSE_GROUPS } from '../data/defaults';
import { generateId } from '../lib/db';

interface AddSubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroup?: ExpenseGroup;
  onAddSubcategory: (subcat: Subcategory) => void;
}

export const AddSubcategoryModal: React.FC<AddSubcategoryModalProps> = ({
  isOpen,
  onClose,
  defaultGroup = 'HPP',
  onAddSubcategory,
}) => {
  const [label, setLabel] = useState('');
  const [groupId, setGroupId] = useState<ExpenseGroup>(defaultGroup);
  const [requiresProduct, setRequiresProduct] = useState<boolean>(defaultGroup === 'HPP');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Nama subkategori wajib diisi');
      return;
    }

    const newSubcat: Subcategory = {
      id: generateId('subcat'),
      groupId,
      label: label.trim(),
      requiresProduct,
      isDefault: false,
      createdAt: Date.now(),
    };

    onAddSubcategory(newSubcat);
    setLabel('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Tambah Subkategori Baru</h3>
              <p className="text-xs text-slate-500">Buat jenis biaya baru dalam hitungan detik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kelompok Biaya Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Pilih Kelompok Biaya
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(EXPENSE_GROUPS) as ExpenseGroup[]).map((group) => {
                const meta = EXPENSE_GROUPS[group];
                const isSelected = groupId === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setGroupId(group);
                      if (group === 'HPP') setRequiresProduct(true);
                      else setRequiresProduct(false);
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.badgeText} border-blue-500 ring-2 ring-blue-400/30 font-bold`
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nama Subkategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Nama Subkategori
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError('');
              }}
              placeholder="Misal: Stiker / Ongkir / Gas Resto"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              autoFocus
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          {/* Opsi Keterikatan Produk */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresProduct}
                onChange={(e) => setRequiresProduct(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  🏷️ Terikat dengan Produk Tertentu?
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal mt-0.5">
                  Jika dicentang, form pencatatan wajib memilih produk (seperti Bahan Baku, Kemasan per varian).
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Simpan Kategori
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  onOpenImport?: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onOpenImport,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const colorOptions = [
    { label: 'Biru', value: '#2563eb' },
    { label: 'Hijau', value: '#059669' },
    { label: 'Kuning', value: '#d97706' },
    { label: 'Ungu', value: '#7c3aed' },
    { label: 'Merah', value: '#dc2626' },
    { label: 'Pink', value: '#db2777' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }

    const newProd: Product = {
      id: generateId('prod'),
      name: name.trim(),
      code: code.trim() || undefined,
      color,
      isDefault: false,
      createdAt: Date.now(),
    };

    onAddProduct(newProd);
    setName('');
    setCode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Tambah Produk Baru</h3>
              <p className="text-xs text-slate-500">Alokasikan biaya langsung ke produk ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Produk / Varian
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Misal: Brownies Cokelat / Roti Bakar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              autoFocus
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kode / SKU (Opsional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Misal: BRW-01"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Warna Label
            </label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {color === c.value && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Simpan Produk
            </button>
          </div>

          {/* Tombol Impor Produk di Bawah Tombol + Simpan Produk */}
          {onOpenImport && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200/70 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Impor Produk dari Backup Database Titip Jual</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-1">
                Punya banyak produk di aplikasi lain? Ekstrak sekaligus dari file backup .json
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
