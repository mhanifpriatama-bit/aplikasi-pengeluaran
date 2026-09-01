import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  ClipboardPaste,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Box,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../types';
import { extractProductsFromUnknownJSON } from '../lib/productExtractor';

interface ImportProductsModalProps {
  isOpen: boolean;
  existingProducts: Product[];
  onClose: () => void;
  onImportSuccess: (importedProducts: Product[], mode: 'merge' | 'replace') => Promise<void>;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  existingProducts,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedJson, setPastedJson] = useState<string>('');
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessJSON = (jsonString: string, sourceName?: string) => {
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(jsonString);
      const extracted = extractProductsFromUnknownJSON(parsed);

      if (extracted.length === 0) {
        setErrorMsg(
          'Tidak menemukan data produk di dalam file JSON ini. Pastikan file berisi daftar produk atau backup database yang memiliki field nama/produk.'
        );
        setExtractedProducts([]);
        return;
      }

      setExtractedProducts(extracted);
      if (sourceName) setFileName(sourceName);
    } catch (err: any) {
      setErrorMsg('Format JSON tidak valid: ' + err.message);
      setExtractedProducts([]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      handleProcessJSON(text, file.name);
    } catch (err: any) {
      setErrorMsg('Gagal membaca file: ' + err.message);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedJson.trim()) {
      setErrorMsg('Silakan tempel (paste) teks JSON terlebih dahulu.');
      return;
    }
    handleProcessJSON(pastedJson, 'Teks JSON dari Clipboard');
  };

  const handleSaveImport = async () => {
    if (extractedProducts.length === 0) return;

    setIsProcessing(true);
    try {
      await onImportSuccess(extractedProducts, importMode);
      setExtractedProducts([]);
      setPastedJson('');
      setFileName(null);
      onClose();
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan produk: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Impor Produk dari Backup / Titip Jual
              </h3>
              <p className="text-[11px] text-slate-500">
                Deteksi otomatis ID & nama produk dari file database apa pun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {/* Method Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Backup (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('paste');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Tempel Teks JSON</span>
            </button>
          </div>

          {/* Upload File Section */}
          {activeTab === 'upload' && (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-5 text-center cursor-pointer transition-all"
              >
                <FileJson className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {fileName ? `File: ${fileName}` : 'Pilih file backup database (.json)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bisa file backup utuh Titip Jual, POS, atau database lain
                </p>
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Jelajahi File Ponsel</span>
                </button>
              </div>
            </div>
          )}

          {/* Paste JSON Section */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <textarea
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder="Tempelkan isi file JSON atau data produk di sini..."
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ekstrak Produk dari Teks</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Extracted Products Preview */}
          {extractedProducts.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ditemukan {extractedProducts.length} Produk dari Backup
                </span>
              </div>

              {/* Product preview list */}
              <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-emerald-100 text-xs">
                {extractedProducts.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between py-1 px-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#2563eb' }}
                      />
                      <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      ID: {p.id.length > 12 ? `${p.id.slice(0, 10)}...` : p.id}
                    </span>
                  </div>
                ))}
              </div>

              {/* Import Options (Merge vs Replace) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Metode Penyimpanan:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'bg-white border-emerald-500 ring-2 ring-emerald-400/30'
                        : 'bg-emerald-50/40 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Gabungkan (Merge)</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">
                        Tambahkan ke {existingProducts.length} produk yang sudah ada
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-white border-emerald-500 ring-2 ring-emerald-400/30'
                        : 'bg-emerald-50/40 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Ganti Semua</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">
                        Timpa seluruh daftar produk lama
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSaveImport}
            disabled={extractedProducts.length === 0 || isProcessing}
            className={`py-2.5 px-5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition ${
              extractedProducts.length > 0 && !isProcessing
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{isProcessing ? 'Menyimpan...' : `Simpan ${extractedProducts.length} Produk`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
