import React, { useState, useRef } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Tag,
  Box,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
} from 'lucide-react';
import { ExpenseGroup, Subcategory, Product, Payee, DatabaseBackup } from '../types';
import { EXPENSE_GROUPS } from '../data/defaults';
import {
  exportDatabaseJSON,
  importDatabaseJSON,
  resetDatabaseToDefaults,
  bulkImportProducts,
  generateId,
} from '../lib/db';
import { AddSubcategoryModal, AddProductModal } from './QuickAddModal';
import { ImportProductsModal } from './ImportProductsModal';

interface MasterManagementProps {
  categories: Subcategory[];
  products: Product[];
  payees: Payee[];
  onRefreshAllData: () => Promise<void>;
  onAddSubcategory: (subcat: Subcategory) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
  onUpdateSubcategory: (subcat: Subcategory) => Promise<void>;
  onAddProduct: (prod: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onDeletePayee: (id: string) => Promise<void>;
}

export const MasterManagement: React.FC<MasterManagementProps> = ({
  categories,
  products,
  payees,
  onRefreshAllData,
  onAddSubcategory,
  onDeleteSubcategory,
  onUpdateSubcategory,
  onAddProduct,
  onDeleteProduct,
  onDeletePayee,
}) => {
  const [activeSection, setActiveSection] = useState<'categories' | 'products' | 'backup' | 'payees'>('categories');
  const [showAddSubcatModal, setShowAddSubcatModal] = useState<boolean>(false);
  const [showAddProdModal, setShowAddProdModal] = useState<boolean>(false);
  const [showImportProdModal, setShowImportProdModal] = useState<boolean>(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<ExpenseGroup>('HPP');

  // Backup / Restore state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup Export Action
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backup = await exportDatabaseJSON();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup_catat_pengeluaran_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setRestoreMessage('File cadangan JSON berhasil diunduh!');
      setTimeout(() => setRestoreMessage(null), 4000);
    } catch (err: any) {
      setRestoreError('Gagal mengekspor data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Backup Restore Action
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DatabaseBackup;

      if (!parsed || !parsed.data || !Array.isArray(parsed.data.expenses)) {
        throw new Error('Struktur file JSON tidak sesuai dengan format backup Catat Pengeluaran.');
      }

      const result = await importDatabaseJSON(parsed, 'replace');
      await onRefreshAllData();

      setRestoreMessage(
        `Sukses memulihkan ${result.counts.expenses} transaksi, ${result.counts.categories} kategori, ${result.counts.products} produk!`
      );
      setTimeout(() => setRestoreMessage(null), 5000);
    } catch (err: any) {
      setRestoreError('Gagal memulihkan backup: ' + err.message);
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset to initial defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang data ke data awal / contoh? Semua transaksi kustom akan terhapus.')) {
      await resetDatabaseToDefaults();
      await onRefreshAllData();
      setRestoreMessage('Database berhasil di-reset ke data bawaan.');
      setTimeout(() => setRestoreMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* SECTION NAV BUTTONS */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs">
        <button
          onClick={() => setActiveSection('categories')}
          className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeSection === 'categories'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span className="truncate">Kategori</span>
        </button>

        <button
          onClick={() => setActiveSection('products')}
          className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeSection === 'products'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Box className="w-4 h-4" />
          <span className="truncate">Produk</span>
        </button>

        <button
          onClick={() => setActiveSection('payees')}
          className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeSection === 'payees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="truncate">Vendor</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeSection === 'backup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span className="truncate">Backup</span>
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {restoreMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {restoreError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{restoreError}</span>
        </div>
      )}

      {/* QUICK PROMPT BANNER FOR IMPORTING FROM TITIP JUAL */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
            Fitur Sinkronisasi
          </span>
          <h4 className="font-bold text-sm leading-tight">Impor Produk Titip Jual</h4>
          <p className="text-xs text-emerald-100 leading-snug">
            Punya backup database Titip Jual? Ekstrak ID & nama produk otomatis ke sini.
          </p>
        </div>
        <button
          onClick={() => setShowImportProdModal(true)}
          className="shrink-0 px-3.5 py-2 bg-white text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>Buka Impor</span>
        </button>
      </div>

      {/* TAB 1: MASTER SUBCATEGORIES */}
      {activeSection === 'categories' && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                Kelola Subkategori Biaya
              </h3>
              <p className="text-xs text-slate-500">Atur jenis biaya dan aturan keterikatan produk</p>
            </div>
            <button
              onClick={() => setShowAddSubcatModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Group Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {(Object.keys(EXPENSE_GROUPS) as ExpenseGroup[]).map((g) => {
              const meta = EXPENSE_GROUPS[g];
              const isSelected = selectedGroupFilter === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGroupFilter(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeText} border-blue-500 ring-1 ring-blue-400/30`
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* List of Subcategories for selected Group */}
          <div className="space-y-2">
            {categories
              .filter((c) => c.groupId === selectedGroupFilter)
              .map((subcat) => (
                <div
                  key={subcat.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-sm">{subcat.label}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 text-[11px]">
                      <input
                        type="checkbox"
                        checked={subcat.requiresProduct}
                        onChange={async (e) => {
                          await onUpdateSubcategory({
                            ...subcat,
                            requiresProduct: e.target.checked,
                          });
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                      />
                      <span>Wajib pilih Produk (Alokasi HPP Langsung)</span>
                    </label>
                  </div>

                  {!subcat.isDefault ? (
                    <button
                      onClick={() => onDeleteSubcategory(subcat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Subkategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                      Bawaan
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 2: MASTER PRODUCTS */}
      {activeSection === 'products' && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Box className="w-4 h-4 text-emerald-600" />
                Daftar Produk / Varian
              </h3>
              <p className="text-xs text-slate-500">Produk yang menerima alokasi bahan & kemasan</p>
            </div>
            <button
              onClick={() => setShowAddProdModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="space-y-2">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: prod.color || '#2563eb' }}
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{prod.name}</span>
                    {prod.code && <span className="text-[11px] text-slate-400 block font-mono">Kode: {prod.code}</span>}
                  </div>
                </div>

                {!prod.isDefault && (
                  <button
                    onClick={() => onDeleteProduct(prod.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYEES / VENDORS */}
      {activeSection === 'payees' && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Daftar Vendor & Penerima
              </h3>
              <p className="text-xs text-slate-500">Toko atau rekanan yang tersimpan dari riwayat transaksi</p>
            </div>
          </div>

          {payees.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">Belum ada data vendor.</p>
          ) : (
            <div className="space-y-1.5">
              {payees.map((payee) => (
                <div
                  key={payee.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{payee.name}</span>
                    <span className="text-[11px] text-slate-400 block">{payee.count}x digunakan</span>
                  </div>

                  <button
                    onClick={() => onDeletePayee(payee.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Hapus Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE JSON (DATABASE PERSISTENCE) */}
      {activeSection === 'backup' && (
        <div className="space-y-4">
          {/* Card 1: Backup JSON */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Cadangkan Data (Backup JSON)</h4>
                <p className="text-xs text-slate-500">Simpan seluruh data transaksi & master ke file JSON</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              File backup dapat Anda simpan di Google Drive, flashdisk, atau dikirimkan ke perangkat ponsel lain.
            </p>

            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses Ekspor...' : 'Unduh Backup JSON'}</span>
            </button>
          </div>

          {/* Card 2: Restore JSON */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Pulihkan Data (Restore JSON)</h4>
                <p className="text-xs text-slate-500">Upload file backup JSON untuk memulihkan transaksi</p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isRestoring ? 'Memulihkan Data...' : 'Pilih File Backup (.json)'}</span>
            </button>
          </div>

          {/* Card 3: Reset to Initial Data */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-rose-200/80 space-y-2">
            <h4 className="font-bold text-rose-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Reset Database
            </h4>
            <p className="text-xs text-slate-500">
              Hapus semua data kustom dan kembalikan ke setelan awal aplikasi.
            </p>
            <button
              onClick={handleResetDefaults}
              className="py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset ke Contoh Bawaan</span>
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddSubcategoryModal
        isOpen={showAddSubcatModal}
        onClose={() => setShowAddSubcatModal(false)}
        defaultGroup={selectedGroupFilter}
        onAddSubcategory={onAddSubcategory}
      />

      <AddProductModal
        isOpen={showAddProdModal}
        onClose={() => setShowAddProdModal(false)}
        onOpenImport={() => setShowImportProdModal(true)}
        onAddProduct={onAddProduct}
      />

      <ImportProductsModal
        isOpen={showImportProdModal}
        existingProducts={products}
        onClose={() => setShowImportProdModal(false)}
        onImportSuccess={async (imported, mode) => {
          await bulkImportProducts(imported, mode);
          await onRefreshAllData();
          setRestoreMessage(
            `Berhasil mengimpor ${imported.length} produk ke database!`
          );
          setTimeout(() => setRestoreMessage(null), 4500);
        }}
      />
    </div>
  );
};
