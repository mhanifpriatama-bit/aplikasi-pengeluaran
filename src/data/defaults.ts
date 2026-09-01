import { ExpenseGroup, ExpenseGroupMeta, Subcategory, Product, Payee, Expense } from '../types';

export const EXPENSE_GROUPS: Record<ExpenseGroup, ExpenseGroupMeta> = {
  HPP: {
    id: 'HPP',
    code: 'A',
    label: 'A. HPP',
    fullName: 'Harga Pokok Penjualan',
    color: '#2563eb', // blue
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentColor: 'border-l-blue-600',
    description: 'Biaya langsung produksi (bahan, kemasan, upah langsung, gas dapur)',
  },
  OPEX: {
    id: 'OPEX',
    code: 'B',
    label: 'B. OPEX',
    fullName: 'Beban Operasional',
    color: '#ea580c', // orange
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    accentColor: 'border-l-orange-500',
    description: 'Biaya rutin operasional non-produksi (listrik, bensin, parkir, gas toko)',
  },
  CAPEX: {
    id: 'CAPEX',
    code: 'C',
    label: 'C. CAPEX',
    fullName: 'Belanja Modal & Aset',
    color: '#7c3aed', // violet
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    accentColor: 'border-l-purple-600',
    description: 'Investasi perlengkapan, mesin & alat yang memiliki masa pakai panjang',
  },
  PRIVE: {
    id: 'PRIVE',
    code: 'D',
    label: 'D. PRIVE',
    fullName: 'Penarikan Dana Pemilik',
    color: '#059669', // emerald
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentColor: 'border-l-emerald-600',
    description: 'Penarikan dana oleh pemilik untuk keperluan pribadi (di luar gaji)',
  },
  LAIN: {
    id: 'LAIN',
    code: 'E',
    label: 'E. LAIN',
    fullName: 'Biaya Lain-lain',
    color: '#4b5563', // gray
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    accentColor: 'border-l-slate-500',
    description: 'Biaya non-operasional, admin bank, pajak, atau tak terduga',
  },
};

export const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  // A. HPP
  { id: 'hpp_bahan', groupId: 'HPP', label: 'Bahan Baku', requiresProduct: true, isDefault: true },
  { id: 'hpp_persediaan', groupId: 'HPP', label: 'Persediaan', requiresProduct: true, isDefault: true },
  { id: 'hpp_kemasan', groupId: 'HPP', label: 'Kemasan', requiresProduct: true, isDefault: true },
  { id: 'hpp_gas', groupId: 'HPP', label: 'Gas (Produksi)', requiresProduct: false, isDefault: true },
  { id: 'hpp_upah', groupId: 'HPP', label: 'Upah Tenaga Kerja', requiresProduct: false, isDefault: true },

  // B. OPEX
  { id: 'opex_gas', groupId: 'OPEX', label: 'Gas (Operasional)', requiresProduct: false, isDefault: true },
  { id: 'opex_listrik', groupId: 'OPEX', label: 'Listrik', requiresProduct: false, isDefault: true },
  { id: 'opex_parkir', groupId: 'OPEX', label: 'Parkir', requiresProduct: false, isDefault: true },
  { id: 'opex_bensin', groupId: 'OPEX', label: 'Bensin & Transport', requiresProduct: false, isDefault: true },

  // C. CAPEX
  { id: 'capex_alat', groupId: 'CAPEX', label: 'Alat & Mesin', requiresProduct: false, isDefault: true },

  // D. PRIVE
  { id: 'prive_pemilik', groupId: 'PRIVE', label: 'Prive Pemilik', requiresProduct: false, isDefault: true },

  // E. LAIN
  { id: 'lain_umum', groupId: 'LAIN', label: 'Lain-lain / Admin', requiresProduct: false, isDefault: true },
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod_a', name: 'Produk A', code: 'PRD-A', color: '#2563eb', isDefault: true },
  { id: 'prod_b', name: 'Produk B', code: 'PRD-B', color: '#059669', isDefault: true },
  { id: 'prod_c', name: 'Produk C', code: 'PRD-C', color: '#d97706', isDefault: true },
];

export const DEFAULT_PAYEES: Payee[] = [
  { id: 'payee_1', name: 'Toko Berkah Bahan', lastUsedAt: Date.now() - 3600000 * 2, count: 5 },
  { id: 'payee_2', name: 'Percetakan Karton Jaya', lastUsedAt: Date.now() - 3600000 * 4, count: 3 },
  { id: 'payee_3', name: 'PLN Token', lastUsedAt: Date.now() - 86400000 * 3, count: 2 },
  { id: 'payee_4', name: 'SPBU Pertamina', lastUsedAt: Date.now() - 86400000 * 1, count: 4 },
  { id: 'payee_5', name: 'Pak Slamet (Upah)', lastUsedAt: Date.now() - 86400000 * 2, count: 2 },
];

// Today in YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    date: today,
    amount: 175000,
    groupId: 'HPP',
    subcategoryId: 'hpp_bahan',
    subcategoryLabel: 'Bahan Baku',
    productId: 'prod_a',
    productName: 'Produk A',
    payee: 'Toko Berkah Bahan',
    notes: 'Beli tepung cakra 25kg & ragi',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'exp_2',
    date: today,
    amount: 85000,
    groupId: 'HPP',
    subcategoryId: 'hpp_kemasan',
    subcategoryLabel: 'Kemasan',
    productId: 'prod_b',
    productName: 'Produk B',
    payee: 'Percetakan Karton Jaya',
    notes: 'Box cetak premium 100 pcs',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'exp_3',
    date: yesterday,
    amount: 150000,
    groupId: 'OPEX',
    subcategoryId: 'opex_listrik',
    subcategoryLabel: 'Listrik',
    payee: 'PLN Token',
    notes: 'Token listrik ruko operasional',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'exp_4',
    date: yesterday,
    amount: 35000,
    groupId: 'OPEX',
    subcategoryId: 'opex_bensin',
    subcategoryLabel: 'Bensin & Transport',
    payee: 'SPBU Pertamina',
    notes: 'Bensin motor kurir pengantaran',
    createdAt: Date.now() - 86400000 + 3600000,
    updatedAt: Date.now() - 86400000 + 3600000,
  },
  {
    id: 'exp_5',
    date: threeDaysAgo,
    amount: 850000,
    groupId: 'CAPEX',
    subcategoryId: 'capex_alat',
    subcategoryLabel: 'Alat & Mesin',
    payee: 'Toko Mesin Usaha',
    notes: 'Hand sealer & timbangan digital 10kg',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'exp_6',
    date: threeDaysAgo,
    amount: 500000,
    groupId: 'PRIVE',
    subcategoryId: 'prive_pemilik',
    subcategoryLabel: 'Prive Pemilik',
    payee: 'Owner Hanif',
    notes: 'Penarikan dana pribadi pemilik',
    createdAt: Date.now() - 86400000 * 3 + 7200000,
    updatedAt: Date.now() - 86400000 * 3 + 7200000,
  },
];
