"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Edit3, Loader2, Package, Plus, Search, Tag, Trash2, X } from "lucide-react";

type Product = { _id: string; name: string; sku: string; price: number; thumbnail?: string; status?: string; stock?: number };
type Combo = {
  _id: string; name: string; products: Product[]; originalPrice: number; comboPrice: number;
  savings: number; discountPercent: number; offerText: string; startsAt?: string | null;
  endsAt?: string | null; isActive: boolean;
};
type ComboForm = { name: string; productIds: string[]; comboPrice: string; offerText: string; startsAt: string; endsAt: string; isActive: boolean };
const emptyForm: ComboForm = { name: "", productIds: [], comboPrice: "", offerText: "", startsAt: "", endsAt: "", isActive: true };
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const toDateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [form, setForm] = useState<ComboForm>(emptyForm);

  async function loadData() {
    try {
      setLoading(true); setError("");
      const [combosResponse, productsResponse] = await Promise.all([
        fetch("/api/admin/combos", { cache: "no-store" }),
        fetch("/api/admin/products?limit=100", { cache: "no-store" }),
      ]);
      const combosData = await combosResponse.json();
      const productsData = await productsResponse.json();
      if (!combosResponse.ok) throw new Error(combosData.message || "Unable to load combo offers.");
      if (!productsResponse.ok) throw new Error(productsData.message || "Unable to load products.");
      setCombos(Array.isArray(combosData.combos) ? combosData.combos : []);
      setProducts(Array.isArray(productsData.products) ? productsData.products : []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load combo offers."); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const selectedProducts = useMemo(() => form.productIds.map((id) => products.find((product) => product._id === id)).filter((product): product is Product => Boolean(product)), [form.productIds, products]);
  const originalPrice = selectedProducts.reduce((total, product) => total + Number(product.price || 0), 0);
  const comboPrice = Number(form.comboPrice) || 0;
  const savings = Math.max(0, originalPrice - comboPrice);
  const discount = originalPrice ? (savings / originalPrice) * 100 : 0;
  const searchableProducts = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setEditing(null); setForm(emptyForm); setSearch(""); setError(""); setModalOpen(true); }
  function openEdit(combo: Combo) {
    setEditing(combo); setSearch(""); setError("");
    setForm({ name: combo.name, productIds: combo.products.map((product) => String(product._id)), comboPrice: String(combo.comboPrice), offerText: combo.offerText || "", startsAt: toDateInput(combo.startsAt), endsAt: toDateInput(combo.endsAt), isActive: combo.isActive });
    setModalOpen(true);
  }
  function toggleProduct(productId: string) {
    setForm((current) => ({ ...current, productIds: current.productIds.includes(productId) ? current.productIds.filter((id) => id !== productId) : current.productIds.length < 2 ? [...current.productIds, productId] : current.productIds }));
  }
  function productIdsFor(combo: Combo) { return combo.products.map((product) => String(product._id)); }
  async function sendUpdate(combo: Combo, isActive: boolean) {
    const response = await fetch(`/api/admin/combos/${combo._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: combo.name, productIds: productIdsFor(combo), comboPrice: combo.comboPrice, offerText: combo.offerText, startsAt: combo.startsAt || "", endsAt: combo.endsAt || "", isActive }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to update combo."); return data.combo as Combo;
  }
  async function toggleActive(combo: Combo) {
    try { const updated = await sendUpdate(combo, !combo.isActive); setCombos((current) => current.map((item) => item._id === combo._id ? updated : item)); }
    catch (toggleError) { setError(toggleError instanceof Error ? toggleError.message : "Unable to update combo."); }
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!form.name.trim()) { setError("Combo name is required."); return; }
    if (form.productIds.length !== 2) { setError("Select exactly two products."); return; }
    if (!Number.isFinite(comboPrice) || comboPrice < 0 || comboPrice > originalPrice) { setError("Enter a combo price lower than or equal to the original price."); return; }
    try {
      setSaving(true);
      const response = await fetch(editing ? `/api/admin/combos/${editing._id}` : "/api/admin/combos", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, name: form.name.trim(), comboPrice, offerText: form.offerText.trim() }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to save combo.");
      setCombos((current) => editing ? current.map((combo) => combo._id === editing._id ? data.combo : combo) : [data.combo, ...current]);
      setModalOpen(false);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save combo."); }
    finally { setSaving(false); }
  }
  async function deleteCombo(combo: Combo) {
    if (!window.confirm(`Delete “${combo.name}”? This cannot be undone.`)) return;
    try { const response = await fetch(`/api/admin/combos/${combo._id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to delete combo."); setCombos((current) => current.filter((item) => item._id !== combo._id)); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete combo."); }
  }

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="flex flex-col gap-4 rounded-2xl bg-black p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm text-gray-300"><Tag size={18} /> Offer management</div><h1 className="mt-2 text-3xl font-bold">Combo Offers</h1><p className="mt-2 text-sm text-gray-300">Create two-product offers with secure, automatic savings calculations.</p></div><button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-semibold text-black hover:bg-gray-200"><Plus size={18} /> Create Combo</button></section>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-200 p-6"><h2 className="text-lg font-bold">All Combo Offers</h2><p className="mt-1 text-sm text-gray-500">{combos.length} combo offer{combos.length === 1 ? "" : "s"}</p></div>
      {loading ? <div className="flex min-h-72 items-center justify-center gap-3 text-gray-600"><Loader2 className="animate-spin" size={22} /> Loading combo offers…</div> : combos.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center text-center"><Tag size={48} className="text-gray-300" /><h3 className="mt-4 text-xl font-bold">No combo offers yet</h3><p className="mt-2 text-gray-500">Create your first two-product offer.</p><button onClick={openCreate} className="mt-5 rounded-lg bg-black px-4 py-2 font-semibold text-white">Create Combo</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[960px]"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-4">Combo</th><th className="px-6 py-4">Products</th><th className="px-6 py-4">Price & savings</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-center">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{combos.map((combo) => <tr key={combo._id} className="hover:bg-gray-50"><td className="px-6 py-4"><p className="font-semibold">{combo.name}</p><p className="mt-1 max-w-xs text-xs text-gray-500">{combo.offerText || "No offer text"}</p></td><td className="px-6 py-4"><div className="space-y-2">{combo.products.map((product) => <div className="flex items-center gap-2" key={product._id}>{product.thumbnail ? <img src={product.thumbnail} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100"><Package size={14} /></div>}<span className="max-w-48 truncate text-sm">{product.name}</span></div>)}</div></td><td className="px-6 py-4"><p className="text-sm text-gray-400 line-through">{money(combo.originalPrice)}</p><p className="font-bold">{money(combo.comboPrice)}</p><p className="mt-1 text-xs font-semibold text-green-700">Save {money(combo.savings)} ({combo.discountPercent}%)</p></td><td className="px-6 py-4"><button type="button" onClick={() => toggleActive(combo)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${combo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${combo.isActive ? "bg-green-600" : "bg-gray-400"}`} />{combo.isActive ? "Active" : "Inactive"}</button></td><td className="px-6 py-4"><div className="flex justify-center gap-2"><button onClick={() => openEdit(combo)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Edit3 size={15} /> Edit</button><button onClick={() => deleteCombo(combo)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"><Trash2 size={15} /> Delete</button></div></td></tr>)}</tbody></table></div>}
    </section>
    {modalOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4"><div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b p-5"><div><h2 className="text-xl font-bold">{editing ? "Edit Combo Offer" : "Create Combo Offer"}</h2><p className="mt-1 text-sm text-gray-500">Select exactly two products and set a discounted combo price.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 hover:bg-gray-100"><X size={20} /></button></div><form onSubmit={handleSubmit} className="p-5"><div className="grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><label className="mb-2 block text-sm font-medium">Combo Name *</label><input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="T-Shirt + Jeans" className="w-full rounded-lg border border-gray-300 px-4 py-3" /></div><div><label className="mb-2 block text-sm font-medium">Offer Text</label><input value={form.offerText} onChange={(e) => setForm((current) => ({ ...current, offerText: e.target.value }))} placeholder="Complete the look and save" className="w-full rounded-lg border border-gray-300 px-4 py-3" /></div><div><label className="mb-2 block text-sm font-medium">Combo Price (₹) *</label><input type="number" min="0" step="0.01" value={form.comboPrice} onChange={(e) => setForm((current) => ({ ...current, comboPrice: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3" /></div><div><label className="mb-2 block text-sm font-medium">Start Date</label><input type="date" value={form.startsAt} onChange={(e) => setForm((current) => ({ ...current, startsAt: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3" /></div><div><label className="mb-2 block text-sm font-medium">End Date</label><input type="date" value={form.endsAt} onChange={(e) => setForm((current) => ({ ...current, endsAt: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3" /></div></div><label className="mt-5 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} className="h-4 w-4" />Active immediately</label><div className="mt-6 rounded-xl border border-gray-200"><div className="border-b p-4"><h3 className="font-bold">Select 2 Products</h3><p className="mt-1 text-sm text-gray-500">{form.productIds.length}/2 selected</p><div className="relative mt-4"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product name or SKU…" className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4" /></div></div><div className="max-h-72 divide-y overflow-y-auto">{searchableProducts.map((product) => { const selected = form.productIds.includes(product._id); const unavailable = !selected && form.productIds.length === 2; return <button type="button" key={product._id} disabled={unavailable} onClick={() => toggleProduct(product._id)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45">{product.thumbnail ? <img src={product.thumbnail} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100"><Package size={17} /></div>}<span className="min-w-0 flex-1"><span className="block truncate font-medium">{product.name}</span><span className="block text-xs text-gray-500">{product.sku} · {money(product.price)} · Stock {product.stock ?? 0}</span></span><span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-black bg-black text-white" : "border-gray-300"}`}>{selected && <Check size={14} />}</span></button>; })}</div></div><div className="mt-5 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-3"><div><p className="text-xs text-gray-500">Original total</p><p className="mt-1 font-bold">{money(originalPrice)}</p></div><div><p className="text-xs text-gray-500">You save</p><p className="mt-1 font-bold text-green-700">{money(savings)}</p></div><div><p className="text-xs text-gray-500">Discount</p><p className="mt-1 font-bold text-green-700">{discount.toFixed(1)}%</p></div></div><div className="mt-6 flex justify-end gap-3 border-t pt-5"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 font-semibold text-white disabled:opacity-60">{saving && <Loader2 size={17} className="animate-spin" />}{editing ? "Update Combo" : "Create Combo"}</button></div></form></div></div>}
  </div>;
}