import { Product } from '../types';
import { generateId } from './db';

const COLOR_PALETTE = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#db2777',
  '#0284c7',
  '#4f46e5',
];

/**
 * Smart Universal Product Extractor:
 * Analyzes any JSON object or database dump (e.g. from Titip Jual app, POS, or Inventory app)
 * and extracts all product records automatically.
 */
export function extractProductsFromUnknownJSON(rawJson: any): Product[] {
  if (!rawJson || typeof rawJson !== 'object') {
    return [];
  }

  const foundProducts: Product[] = [];
  const visitedObjects = new Set<any>();

  // 1. First priority: Check standard arrays/keys known in full database backups
  const candidateArrays: any[][] = [];

  function collectCandidateArrays(obj: any, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 6 || visitedObjects.has(obj)) {
      return;
    }
    visitedObjects.add(obj);

    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object') {
        candidateArrays.push(obj);
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const lowerKey = key.toLowerCase();

      // High likelihood keys for products in Indonesian and English apps
      if (
        Array.isArray(val) &&
        (lowerKey.includes('product') ||
          lowerKey.includes('produk') ||
          lowerKey.includes('barang') ||
          lowerKey.includes('item') ||
          lowerKey.includes('menu') ||
          lowerKey.includes('titip') ||
          lowerKey.includes('consignment') ||
          lowerKey.includes('varian') ||
          lowerKey.includes('goods'))
      ) {
        candidateArrays.unshift(val); // high priority
      } else if (typeof val === 'object' && val !== null) {
        collectCandidateArrays(val, depth + 1);
      }
    }
  }

  collectCandidateArrays(rawJson);

  // 2. Normalize items from candidate arrays
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const arr of candidateArrays) {
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;

      // Extract Name
      const name =
        item.name ||
        item.nama ||
        item.namaProduk ||
        item.nama_produk ||
        item.namaBarang ||
        item.nama_barang ||
        item.productName ||
        item.product_name ||
        item.title ||
        item.judul ||
        item.label ||
        item.deskripsi ||
        item.description;

      // Extract ID
      const rawId =
        item.id ||
        item.productId ||
        item.product_id ||
        item.kode ||
        item.kodeProduk ||
        item.kode_produk ||
        item.sku ||
        item.code;

      // Extract Code / SKU
      const code =
        item.code ||
        item.kode ||
        item.sku ||
        item.kodeProduk ||
        item.kode_produk ||
        item.barcode ||
        undefined;

      if (typeof name === 'string' && name.trim().length > 0) {
        const cleanName = name.trim();
        const cleanId = rawId ? String(rawId).trim() : generateId('prod');

        // Prevent duplicate items in the extracted list
        const lowerName = cleanName.toLowerCase();
        if (!seenNames.has(lowerName) && !seenIds.has(cleanId)) {
          seenNames.add(lowerName);
          seenIds.add(cleanId);

          const colorIdx = foundProducts.length % COLOR_PALETTE.length;
          foundProducts.push({
            id: cleanId,
            name: cleanName,
            code: typeof code === 'string' ? code.trim() : undefined,
            color: item.color || COLOR_PALETTE[colorIdx],
            isDefault: false,
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          });
        }
      }
    }

    // If we already extracted a good batch of products from a high priority array, stop
    if (foundProducts.length > 0 && candidateArrays[0] === arr) {
      break;
    }
  }

  return foundProducts;
}
