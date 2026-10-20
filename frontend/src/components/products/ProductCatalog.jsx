import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { NO_IMAGE_PLACEHOLDER } from '../../utils/imagePlaceholder';
import {
  Package,
  Plus,
  FolderPlus,
  Tag,
  Check,
  AlertTriangle,
  Trash2,
  Edit2,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProductCatalog = () => {
  const { token, tenant } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // New Category state
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryImage, setCategoryImage] = useState('');

  // New Product state
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodComparePrice, setProdComparePrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [variants, setVariants] = useState([]);

  // Temp variant input
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      if (prodData.success) setProducts(prodData.data);
      if (catData.success) setCategories(catData.data);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDesc,
          image: categoryImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCategoryModal(false);
        setCategoryName('');
        setCategoryDesc('');
        setCategoryImage('');
        fetchData();
      } else {
        alert(data.message || 'Failed to create category');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddVariant = () => {
    if (!variantName || !variantPrice) return;
    setVariants([
      ...variants,
      {
        name: variantName,
        price: Number(variantPrice),
        stockQuantity: Number(variantStock || 0),
      },
    ]);
    setVariantName('');
    setVariantPrice('');
    setVariantStock('');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice || prodStock === '') {
      alert('Product name, selling price, and stock quantity are required.');
      return;
    }
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: prodName,
          categoryId: prodCategory || null,
          price: Number(prodPrice),
          compareAtPrice: Number(prodComparePrice || 0),
          stockQuantity: Number(prodStock),
          description: prodDesc,
          images: prodImage ? [prodImage] : [],
          variants,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        setProdName('');
        setProdPrice('');
        setProdComparePrice('');
        setProdDesc('');
        setProdImage('');
        setVariants([]);
        fetchData();
      } else {
        alert(data.message || 'Failed to create product');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" /> Product Catalog & Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your items, pack sizes, variant pricing, and live inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Add Category
          </button>
          <button
            onClick={() => setShowProductModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Categories Showcase with Photos */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Active Categories ({categories.length})
            </span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((c) => {
              const catProdCount = products.filter(
                (p) => (p.categoryId?._id || p.categoryId) === c._id
              ).length;
              const catImg = c.image || NO_IMAGE_PLACEHOLDER;
              return (
                <div
                  key={c._id}
                  className="flex items-center gap-2.5 p-2 pr-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shrink-0"
                >
                  <img
                    src={catImg}
                    alt={c.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                    }}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-800"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{c.name}</div>
                    <div className="text-[10px] text-slate-500">{catProdCount} items</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Grid with Photo Covers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Package className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
            No products in catalog yet. Click "Add Product" to get started!
          </div>
        ) : (
          products.map((prod) => {
            const prodImg = prod.images?.[0] || NO_IMAGE_PLACEHOLDER;
            return (
              <div
                key={prod._id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-xs"
              >
                {/* Product Photo Header */}
                <div className="relative w-full h-40 bg-slate-100 overflow-hidden">
                  <img
                    src={prodImg}
                    alt={prod.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {prod.categoryId?.name || 'General'}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md ${
                        prod.stockQuantity > 10
                          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                          : prod.stockQuantity > 0
                          ? 'bg-amber-950/80 border-amber-500/30 text-amber-300'
                          : 'bg-rose-950/80 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {prod.stockQuantity > 10
                        ? `${prod.stockQuantity} in stock`
                        : prod.stockQuantity > 0
                        ? `Low: ${prod.stockQuantity} left`
                        : 'Out of stock'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-300 transition line-clamp-1">
                      {prod.name}
                    </h3>

                    {prod.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}

                    {/* Variants Preview */}
                    {prod.variants?.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Pack Variants ({prod.variants.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {prod.variants.map((v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-700"
                            >
                              {v.name}: ₹{v.price} ({v.stockQuantity} qty)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900">₹{prod.price}</div>
                      {prod.compareAtPrice > prod.price && (
                        <div className="text-[11px] text-slate-500 line-through">
                          ₹{prod.compareAtPrice}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteProduct(prod._id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Product</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product name"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  >
                    <option value="">General / None</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Base Stock Quantity</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="299"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Compare At / MRP (₹)</label>
                  <input
                    type="number"
                    placeholder="399"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Product Photo URL & Quick Presets */}
              <div className="space-y-2">
                <label className="text-slate-700 font-medium block mb-1">Product Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
                {prodImage && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 mt-2 bg-slate-100">
                    <img
                      src={prodImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute bottom-1 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-emerald-400">
                      Live Preview
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Short Description</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, taste profile, shelf life..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>

              {/* Variants Section */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-700">Product Variants (Optional)</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Large / 500g / Red"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-[11px]"
                  />
                  <input
                    type="number"
                    placeholder="Price ₹"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-[11px]"
                  />
                  <input
                    type="number"
                    placeholder="Stock qty"
                    value={variantStock}
                    onChange={(e) => setVariantStock(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-[11px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-semibold transition cursor-pointer"
                >
                  + Add Variant Option
                </button>

                {variants.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1">
                    {variants.map((v, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px]"
                      >
                        {v.name} - ₹{v.price} ({v.stockQuantity} pcs)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product category"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>

              {/* Category Photo URL & Presets */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-medium block mb-1">Category Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={categoryImage}
                  onChange={(e) => setCategoryImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
                {categoryImage && (
                  <div className="relative w-full h-20 rounded-xl overflow-hidden border border-slate-200 mt-1 bg-slate-100">
                    <img
                      src={categoryImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief note"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
