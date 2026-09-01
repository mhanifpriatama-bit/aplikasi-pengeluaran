import { Expense, Subcategory, Product, Payee, DatabaseBackup } from '../types';
import { DEFAULT_SUBCATEGORIES, DEFAULT_PRODUCTS, DEFAULT_PAYEES, INITIAL_EXPENSES } from '../data/defaults';

const DB_NAME = 'CatatBiayaDB';
const DB_VERSION = 1;

const STORES = {
  EXPENSES: 'expenses',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  PAYEES: 'payees',
};

// Fallback in-memory/localStorage store for environments where IndexedDB is blocked
class MemoryStorage {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(`catat_biaya_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`catat_biaya_${key}`, JSON.stringify(val));
    } catch {
      // ignore
    }
  }

  getExpenses(): Expense[] {
    return this.get<Expense[]>('expenses', INITIAL_EXPENSES);
  }
  setExpenses(expenses: Expense[]): void {
    this.set('expenses', expenses);
  }

  getCategories(): Subcategory[] {
    return this.get<Subcategory[]>('categories', DEFAULT_SUBCATEGORIES);
  }
  setCategories(cats: Subcategory[]): void {
    this.set('categories', cats);
  }

  getProducts(): Product[] {
    return this.get<Product[]>('products', DEFAULT_PRODUCTS);
  }
  setProducts(prods: Product[]): void {
    this.set('products', prods);
  }

  getPayees(): Payee[] {
    return this.get<Payee[]>('payees', DEFAULT_PAYEES);
  }
  setPayees(payees: Payee[]): void {
    this.set('payees', payees);
  }
}

const memoryStore = new MemoryStorage();

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expStore.createIndex('date', 'date', { unique: false });
        expStore.createIndex('groupId', 'groupId', { unique: false });
        expStore.createIndex('subcategoryId', 'subcategoryId', { unique: false });
        expStore.createIndex('productId', 'productId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const catStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        catStore.createIndex('groupId', 'groupId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.PAYEES)) {
        const payeeStore = db.createObjectStore(STORES.PAYEES, { keyPath: 'id' });
        payeeStore.createIndex('name', 'name', { unique: true });
        payeeStore.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Ensure database is initialized with default master data
export async function initDatabase(): Promise<void> {
  try {
    const db = await openDB();

    // Check Categories
    const catCount = await getStoreCount(db, STORES.CATEGORIES);
    if (catCount === 0) {
      const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);
      DEFAULT_SUBCATEGORIES.forEach((cat) => store.add(cat));
      await txComplete(tx);
    }

    // Check Products
    const prodCount = await getStoreCount(db, STORES.PRODUCTS);
    if (prodCount === 0) {
      const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORES.PRODUCTS);
      DEFAULT_PRODUCTS.forEach((p) => store.add(p));
      await txComplete(tx);
    }

    // Check Payees
    const payeeCount = await getStoreCount(db, STORES.PAYEES);
    if (payeeCount === 0) {
      const tx = db.transaction(STORES.PAYEES, 'readwrite');
      const store = tx.objectStore(STORES.PAYEES);
      DEFAULT_PAYEES.forEach((payee) => store.add(payee));
      await txComplete(tx);
    }

    // Check Expenses
    const expCount = await getStoreCount(db, STORES.EXPENSES);
    if (expCount === 0) {
      const tx = db.transaction(STORES.EXPENSES, 'readwrite');
      const store = tx.objectStore(STORES.EXPENSES);
      INITIAL_EXPENSES.forEach((exp) => store.add(exp));
      await txComplete(tx);
    }
  } catch (err) {
    console.warn('IndexedDB init fallback to memory:', err);
    // fallback storage already has default values
  }
}

function getStoreCount(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const countReq = store.count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ----------------- EXPENSES CRUD -----------------
export async function getExpenses(): Promise<Expense[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXPENSES, 'readonly');
      const store = tx.objectStore(STORES.EXPENSES);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result as Expense[]).sort((a, b) => {
          // Sort by date desc, then by createdAt desc
          if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
          }
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return memoryStore.getExpenses();
  }
}

export async function addExpense(expense: Expense): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.EXPENSES, 'readwrite');
    tx.objectStore(STORES.EXPENSES).add(expense);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getExpenses();
    list.unshift(expense);
    memoryStore.setExpenses(list);
  }

  // Update Payee usage if payee was filled
  if (expense.payee && expense.payee.trim()) {
    await recordPayeeUsage(expense.payee.trim());
  }
}

export async function updateExpense(expense: Expense): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.EXPENSES, 'readwrite');
    tx.objectStore(STORES.EXPENSES).put(expense);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getExpenses();
    const idx = list.findIndex((e) => e.id === expense.id);
    if (idx !== -1) {
      list[idx] = expense;
      memoryStore.setExpenses(list);
    }
  }

  if (expense.payee && expense.payee.trim()) {
    await recordPayeeUsage(expense.payee.trim());
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.EXPENSES, 'readwrite');
    tx.objectStore(STORES.EXPENSES).delete(id);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getExpenses().filter((e) => e.id !== id);
    memoryStore.setExpenses(list);
  }
}

// ----------------- CATEGORIES (SUBCATEGORIES) CRUD -----------------
export async function getCategories(): Promise<Subcategory[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CATEGORIES, 'readonly');
      const store = tx.objectStore(STORES.CATEGORIES);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as Subcategory[];
        if (results.length === 0) {
          resolve(DEFAULT_SUBCATEGORIES);
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryStore.getCategories();
  }
}

export async function addCategory(category: Subcategory): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    tx.objectStore(STORES.CATEGORIES).add(category);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getCategories();
    list.push(category);
    memoryStore.setCategories(list);
  }
}

export async function updateCategory(category: Subcategory): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    tx.objectStore(STORES.CATEGORIES).put(category);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx !== -1) {
      list[idx] = category;
      memoryStore.setCategories(list);
    }
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    tx.objectStore(STORES.CATEGORIES).delete(id);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getCategories().filter((c) => c.id !== id);
    memoryStore.setCategories(list);
  }
}

// ----------------- PRODUCTS CRUD -----------------
export async function getProducts(): Promise<Product[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as Product[];
        if (results.length === 0) {
          resolve(DEFAULT_PRODUCTS);
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryStore.getProducts();
  }
}

export async function addProduct(product: Product): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    tx.objectStore(STORES.PRODUCTS).add(product);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getProducts();
    list.push(product);
    memoryStore.setProducts(list);
  }
}

export async function updateProduct(product: Product): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    tx.objectStore(STORES.PRODUCTS).put(product);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      list[idx] = product;
      memoryStore.setProducts(list);
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    tx.objectStore(STORES.PRODUCTS).delete(id);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getProducts().filter((p) => p.id !== id);
    memoryStore.setProducts(list);
  }
}

export async function bulkImportProducts(
  newProducts: Product[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<void> {
  try {
    const db = await openDB();
    if (mode === 'replace') {
      const txClear = db.transaction(STORES.PRODUCTS, 'readwrite');
      txClear.objectStore(STORES.PRODUCTS).clear();
      await txComplete(txClear);

      const txAdd = db.transaction(STORES.PRODUCTS, 'readwrite');
      const store = txAdd.objectStore(STORES.PRODUCTS);
      newProducts.forEach((p) => store.add(p));
      await txComplete(txAdd);
    } else {
      // Merge: put items
      const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORES.PRODUCTS);
      newProducts.forEach((p) => store.put(p));
      await txComplete(tx);
    }
  } catch {
    if (mode === 'replace') {
      memoryStore.setProducts(newProducts);
    } else {
      const existing = memoryStore.getProducts();
      const map = new Map<string, Product>();
      existing.forEach((p) => map.set(p.id, p));
      newProducts.forEach((p) => {
        // Also check by name
        const byName = Array.from(map.values()).find(
          (x) => x.name.toLowerCase() === p.name.toLowerCase()
        );
        if (byName) {
          map.set(byName.id, { ...byName, ...p, id: byName.id });
        } else {
          map.set(p.id, p);
        }
      });
      memoryStore.setProducts(Array.from(map.values()));
    }
  }
}

// ----------------- PAYEES / VENDORS -----------------
export async function getPayees(): Promise<Payee[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PAYEES, 'readonly');
      const store = tx.objectStore(STORES.PAYEES);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as Payee[]).sort((a, b) => (b.count || 0) - (a.count || 0));
        resolve(results.length === 0 ? DEFAULT_PAYEES : results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryStore.getPayees();
  }
}

export async function recordPayeeUsage(name: string): Promise<void> {
  if (!name.trim()) return;
  const cleanName = name.trim();

  try {
    const payees = await getPayees();
    const existing = payees.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());

    const db = await openDB();
    const tx = db.transaction(STORES.PAYEES, 'readwrite');
    const store = tx.objectStore(STORES.PAYEES);

    if (existing) {
      existing.count = (existing.count || 0) + 1;
      existing.lastUsedAt = Date.now();
      store.put(existing);
    } else {
      const newPayee: Payee = {
        id: `payee_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: cleanName,
        count: 1,
        lastUsedAt: Date.now(),
      };
      store.add(newPayee);
    }
    await txComplete(tx);
  } catch {
    const payees = memoryStore.getPayees();
    const existing = payees.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.count += 1;
      existing.lastUsedAt = Date.now();
    } else {
      payees.push({
        id: `payee_${Date.now()}`,
        name: cleanName,
        count: 1,
        lastUsedAt: Date.now(),
      });
    }
    memoryStore.setPayees(payees);
  }
}

export async function deletePayee(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PAYEES, 'readwrite');
    tx.objectStore(STORES.PAYEES).delete(id);
    await txComplete(tx);
  } catch {
    const list = memoryStore.getPayees().filter((p) => p.id !== id);
    memoryStore.setPayees(list);
  }
}

// ----------------- BACKUP & RESTORE JSON -----------------
export async function exportDatabaseJSON(): Promise<DatabaseBackup> {
  const [expenses, categories, products, payees] = await Promise.all([
    getExpenses(),
    getCategories(),
    getProducts(),
    getPayees(),
  ]);

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    app: 'Catat Pengeluaran Usaha PWA',
    data: {
      expenses,
      categories,
      products,
      payees,
    },
  };
}

export async function importDatabaseJSON(
  backup: DatabaseBackup,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string; counts: { expenses: number; categories: number; products: number } }> {
  if (!backup || !backup.data || !Array.isArray(backup.data.expenses)) {
    throw new Error('Format file backup JSON tidak valid!');
  }

  try {
    const db = await openDB();

    if (mode === 'replace') {
      // Clear all stores
      for (const storeName of Object.values(STORES)) {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        await txComplete(tx);
      }

      // Add all
      const txExp = db.transaction(STORES.EXPENSES, 'readwrite');
      const expStore = txExp.objectStore(STORES.EXPENSES);
      backup.data.expenses.forEach((e) => expStore.add(e));
      await txComplete(txExp);

      if (Array.isArray(backup.data.categories)) {
        const txCat = db.transaction(STORES.CATEGORIES, 'readwrite');
        const catStore = txCat.objectStore(STORES.CATEGORIES);
        backup.data.categories.forEach((c) => catStore.add(c));
        await txComplete(txCat);
      }

      if (Array.isArray(backup.data.products)) {
        const txProd = db.transaction(STORES.PRODUCTS, 'readwrite');
        const prodStore = txProd.objectStore(STORES.PRODUCTS);
        backup.data.products.forEach((p) => prodStore.add(p));
        await txComplete(txProd);
      }

      if (Array.isArray(backup.data.payees)) {
        const txPay = db.transaction(STORES.PAYEES, 'readwrite');
        const payStore = txPay.objectStore(STORES.PAYEES);
        backup.data.payees.forEach((p) => payStore.add(p));
        await txComplete(txPay);
      }
    } else {
      // Merge mode
      const txExp = db.transaction(STORES.EXPENSES, 'readwrite');
      const expStore = txExp.objectStore(STORES.EXPENSES);
      backup.data.expenses.forEach((e) => expStore.put(e));
      await txComplete(txExp);

      if (Array.isArray(backup.data.categories)) {
        const txCat = db.transaction(STORES.CATEGORIES, 'readwrite');
        const catStore = txCat.objectStore(STORES.CATEGORIES);
        backup.data.categories.forEach((c) => catStore.put(c));
        await txComplete(txCat);
      }

      if (Array.isArray(backup.data.products)) {
        const txProd = db.transaction(STORES.PRODUCTS, 'readwrite');
        const prodStore = txProd.objectStore(STORES.PRODUCTS);
        backup.data.products.forEach((p) => prodStore.put(p));
        await txComplete(txProd);
      }
    }

    return {
      success: true,
      message: 'Restore data berhasil!',
      counts: {
        expenses: backup.data.expenses.length,
        categories: (backup.data.categories || []).length,
        products: (backup.data.products || []).length,
      },
    };
  } catch (err) {
    // Memory fallback
    memoryStore.setExpenses(backup.data.expenses);
    if (backup.data.categories) memoryStore.setCategories(backup.data.categories);
    if (backup.data.products) memoryStore.setProducts(backup.data.products);
    if (backup.data.payees) memoryStore.setPayees(backup.data.payees);

    return {
      success: true,
      message: 'Restore data berhasil ke local storage!',
      counts: {
        expenses: backup.data.expenses.length,
        categories: (backup.data.categories || []).length,
        products: (backup.data.products || []).length,
      },
    };
  }
}

export async function resetDatabaseToDefaults(): Promise<void> {
  try {
    const db = await openDB();
    for (const storeName of Object.values(STORES)) {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      await txComplete(tx);
    }
  } catch {
    // ignore
  }

  memoryStore.setExpenses(INITIAL_EXPENSES);
  memoryStore.setCategories(DEFAULT_SUBCATEGORIES);
  memoryStore.setProducts(DEFAULT_PRODUCTS);
  memoryStore.setPayees(DEFAULT_PAYEES);

  await initDatabase();
}

// ----------------- UTILITY HELPERS -----------------
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDateIndonesian(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function generateId(prefix: string = 'exp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
