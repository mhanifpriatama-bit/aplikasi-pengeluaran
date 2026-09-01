export type ExpenseGroup = 'HPP' | 'OPEX' | 'CAPEX' | 'PRIVE' | 'LAIN';

export interface ExpenseGroupMeta {
  id: ExpenseGroup;
  label: string;
  code: string;
  fullName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  description: string;
}

export interface Subcategory {
  id: string;
  groupId: ExpenseGroup;
  label: string;
  requiresProduct: boolean;
  isDefault?: boolean;
  createdAt?: number;
}

export interface Product {
  id: string;
  name: string;
  code?: string;
  color?: string;
  isDefault?: boolean;
  createdAt?: number;
}

export interface Payee {
  id: string;
  name: string;
  lastUsedAt: number;
  count: number;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  groupId: ExpenseGroup;
  subcategoryId: string;
  subcategoryLabel: string;
  productId?: string;
  productName?: string;
  payee?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DatabaseBackup {
  version: number;
  exportDate: string;
  app: string;
  data: {
    expenses: Expense[];
    categories: Subcategory[];
    products: Product[];
    payees: Payee[];
  };
}

export interface FilterState {
  search: string;
  groupId: 'ALL' | ExpenseGroup;
  subcategoryId: string;
  productId: string;
  payee: string;
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}
