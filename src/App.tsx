/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { QuickExpenseForm } from './components/QuickExpenseForm';
import { TransactionHistory } from './components/TransactionHistory';
import { SummaryReports } from './components/SummaryReports';
import { MasterManagement } from './components/MasterManagement';
import { ImportProductsModal } from './components/ImportProductsModal';
import {
  initDatabase,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  addProduct,
  deleteProduct,
  bulkImportProducts,
  getPayees,
  deletePayee,
} from './lib/db';
import { Expense, Subcategory, Product, Payee } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'reports' | 'master'>('create');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalImportModalOpen, setGlobalImportModalOpen] = useState<boolean>(false);

  // Database State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.warn('SW registration error:', err));
    }
  }, []);

  // Fetch initial data from IndexedDB
  const refreshAllData = async () => {
    try {
      const [expList, catList, prodList, payeeList] = await Promise.all([
        getExpenses(),
        getCategories(),
        getProducts(),
        getPayees(),
      ]);

      setExpenses(expList);
      setCategories(catList);
      setProducts(prodList);
      setPayees(payeeList);
    } catch (err) {
      console.error('Failed to load IndexedDB data:', err);
    }
  };

  useEffect(() => {
    async function start() {
      setIsLoading(true);
      await initDatabase();
      await refreshAllData();
      setIsLoading(false);
    }
    start();
  }, []);

  // Handlers for Expenses
  const handleSaveExpense = async (newExpense: Expense) => {
    await addExpense(newExpense);
    await refreshAllData();
  };

  const handleUpdateExpense = async (updated: Expense) => {
    await updateExpense(updated);
    await refreshAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    await refreshAllData();
  };

  // Handlers for Categories
  const handleAddSubcategory = async (newSubcat: Subcategory) => {
    await addCategory(newSubcat);
    await refreshAllData();
  };

  const handleUpdateSubcategory = async (updated: Subcategory) => {
    await updateCategory(updated);
    await refreshAllData();
  };

  const handleDeleteSubcategory = async (id: string) => {
    await deleteCategory(id);
    await refreshAllData();
  };

  // Handlers for Products
  const handleAddProduct = async (newProduct: Product) => {
    await addProduct(newProduct);
    await refreshAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    await refreshAllData();
  };

  const handleBulkImportProducts = async (importedList: Product[], mode: 'merge' | 'replace') => {
    await bulkImportProducts(importedList, mode);
    await refreshAllData();
  };

  // Handlers for Payees
  const handleDeletePayee = async (id: string) => {
    await deletePayee(id);
    await refreshAllData();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header with PWA & Offline Indicator */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 max-w-2xl w-full mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Memuat database lokal (IndexedDB)...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'create' && (
              <QuickExpenseForm
                categories={categories}
                products={products}
                payees={payees}
                onSaveExpense={handleSaveExpense}
                onAddSubcategory={handleAddSubcategory}
                onAddProduct={handleAddProduct}
                onBulkImportProducts={handleBulkImportProducts}
              />
            )}

            {activeTab === 'history' && (
              <TransactionHistory
                expenses={expenses}
                categories={categories}
                products={products}
                payees={payees}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {activeTab === 'reports' && (
              <SummaryReports
                expenses={expenses}
                products={products}
                categories={categories}
                payees={payees}
              />
            )}

            {activeTab === 'master' && (
              <MasterManagement
                categories={categories}
                products={products}
                payees={payees}
                onRefreshAllData={refreshAllData}
                onAddSubcategory={handleAddSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onUpdateSubcategory={handleUpdateSubcategory}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onDeletePayee={handleDeletePayee}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={expenses.length}
      />

      {/* Global Import Products Modal */}
      <ImportProductsModal
        isOpen={globalImportModalOpen}
        existingProducts={products}
        onClose={() => setGlobalImportModalOpen(false)}
        onImportSuccess={async (imported, mode) => {
          await handleBulkImportProducts(imported, mode);
          setGlobalImportModalOpen(false);
        }}
      />
    </div>
  );
}
