import React, { useState, useMemo } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Box,
  Layers,
  Store,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Expense, ExpenseGroup, Product, Subcategory, Payee } from '../types';
import { EXPENSE_GROUPS } from '../data/defaults';
import { formatRupiah } from '../lib/db';

interface SummaryReportsProps {
  expenses: Expense[];
  products: Product[];
  categories: Subcategory[];
  payees: Payee[];
}

export const SummaryReports: React.FC<SummaryReportsProps> = ({
  expenses,
  products,
  categories,
  payees,
}) => {
  const [period, setPeriod] = useState<'THIS_MONTH' | '30DAYS' | 'ALL'>('THIS_MONTH');

  // Filter expenses by period
  const filtered = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const thisMonthPrefix = `${currentYear}-${currentMonth}`;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    return expenses.filter((e) => {
      if (period === 'THIS_MONTH') return e.date.startsWith(thisMonthPrefix);
      if (period === '30DAYS') return e.date >= thirtyDaysAgo;
      return true;
    });
  }, [expenses, period]);

  const totalAll = filtered.reduce((s, e) => s + e.amount, 0);

  // Group breakdown
  const groupBreakdown = useMemo(() => {
    const groups: ExpenseGroup[] = ['HPP', 'OPEX', 'CAPEX', 'PRIVE', 'LAIN'];
    return groups.map((g) => {
      const groupExpenses = filtered.filter((e) => e.groupId === g);
      const total = groupExpenses.reduce((s, e) => s + e.amount, 0);
      const percentage = totalAll > 0 ? (total / totalAll) * 100 : 0;
      return {
        group: g,
        meta: EXPENSE_GROUPS[g],
        total,
        percentage,
        count: groupExpenses.length,
      };
    });
  }, [filtered, totalAll]);

  // Product HPP allocation
  const productAllocation = useMemo(() => {
    const hppExpenses = filtered.filter((e) => e.groupId === 'HPP');
    const totalHPP = hppExpenses.reduce((s, e) => s + e.amount, 0);

    const map: Record<string, { name: string; color: string; total: number; count: number }> = {};

    products.forEach((p) => {
      map[p.id] = { name: p.name, color: p.color || '#2563eb', total: 0, count: 0 };
    });
    map['unallocated'] = { name: 'HPP Umum / Non-Alokasi', color: '#64748b', total: 0, count: 0 };

    hppExpenses.forEach((e) => {
      const key = e.productId && map[e.productId] ? e.productId : 'unallocated';
      map[key].total += e.amount;
      map[key].count += 1;
    });

    return Object.entries(map)
      .filter(([_, data]) => data.total > 0)
      .map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        total: data.total,
        percentage: totalHPP > 0 ? (data.total / totalHPP) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, products]);

  // Top Subcategories
  const topSubcategories = useMemo(() => {
    const map: Record<string, { label: string; group: ExpenseGroup; total: number; count: number }> = {};

    filtered.forEach((e) => {
      if (!map[e.subcategoryId]) {
        map[e.subcategoryId] = {
          label: e.subcategoryLabel,
          group: e.groupId,
          total: 0,
          count: 0,
        };
      }
      map[e.subcategoryId].total += e.amount;
      map[e.subcategoryId].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  // Top Payees / Suppliers
  const topPayees = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};

    filtered.forEach((e) => {
      if (e.payee && e.payee.trim()) {
        const name = e.payee.trim();
        if (!map[name]) {
          map[name] = { name, total: 0, count: 0 };
        }
        map[name].total += e.amount;
        map[name].count += 1;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  const totalHPP = groupBreakdown.find((g) => g.group === 'HPP')?.total || 0;
  const totalOPEX = groupBreakdown.find((g) => g.group === 'OPEX')?.total || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* PERIOD SELECTOR */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-xs border border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Periode Laporan:</span>
        </div>
        <div className="flex gap-1 text-xs">
          {[
            { id: 'THIS_MONTH', label: 'Bulan Ini' },
            { id: '30DAYS', label: '30 Hari' },
            { id: 'ALL', label: 'Semua' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                period === p.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRAND TOTAL METRIC */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-semibold">
          <span>Total Pengeluaran ({period === 'THIS_MONTH' ? 'Bulan Ini' : period === '30DAYS' ? '30 Hari' : 'Semua'})</span>
          <span>{filtered.length} Transaksi</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
          {formatRupiah(totalAll)}
        </div>

        {/* Quick KPI pills */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700/60">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-blue-400 font-semibold block">Total HPP (Pokok)</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{formatRupiah(totalHPP)}</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-orange-400 font-semibold block">Total OPEX (Operasional)</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{formatRupiah(totalOPEX)}</span>
          </div>
        </div>
      </div>

      {/* STRUKTUR KELOMPOK BIAYA (HPP, OPEX, CAPEX, PRIVE, LAIN) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Distribusi Kelompok Biaya
          </h3>
          <span className="text-xs text-slate-500 font-medium">100% Beban Usaha</span>
        </div>

        {/* Distribution Progress Bar */}
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {groupBreakdown.map((g) => {
            if (g.percentage === 0) return null;
            return (
              <div
                key={g.group}
                style={{ width: `${g.percentage}%`, backgroundColor: g.meta.color }}
                className="h-full transition-all duration-300"
                title={`${g.meta.label}: ${g.percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* List Breakdown */}
        <div className="space-y-2 pt-1">
          {groupBreakdown.map((g) => (
            <div
              key={g.group}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: g.meta.color }}
                />
                <div>
                  <span className="font-bold text-slate-800">{g.meta.label}</span>
                  <span className="text-slate-500 block text-[11px]">{g.meta.fullName}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{formatRupiah(g.total)}</span>
                <span className="text-slate-400 block text-[11px]">{g.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALOKASI HPP PER PRODUK (LANGSUNG TERIKAT PRODUK) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-600" />
              Alokasi HPP per Produk
            </h3>
            <p className="text-[11px] text-slate-500">
              Total biaya bahan & kemasan yang terserap ke masing-masing produk
            </p>
          </div>
        </div>

        {productAllocation.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2 text-center">
            Belum ada pengeluaran HPP berlabel produk pada periode ini.
          </p>
        ) : (
          <div className="space-y-2.5">
            {productAllocation.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(item.total)}{' '}
                    <span className="text-slate-400 font-normal">({item.percentage.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP SUBCATEGORIES & TOP VENDORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Top Subcategories */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-2.5">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            Top 5 Subkategori
          </h4>
          <div className="space-y-1.5 text-xs">
            {topSubcategories.map((sub, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 truncate pr-2">
                  {idx + 1}. {sub.label}
                </span>
                <span className="font-bold text-slate-900 shrink-0">{formatRupiah(sub.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors / Payees */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-2.5">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            Top 5 Vendor / Toko
          </h4>
          <div className="space-y-1.5 text-xs">
            {topPayees.length === 0 ? (
              <p className="text-slate-400 italic py-2 text-center text-xs">Belum ada vendor tercatat.</p>
            ) : (
              topPayees.map((p, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700 truncate pr-2">
                    {idx + 1}. {p.name}
                  </span>
                  <span className="font-bold text-slate-900 shrink-0">{formatRupiah(p.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
