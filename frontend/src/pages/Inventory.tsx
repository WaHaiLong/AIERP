import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Package, Search, RefreshCw, AlertTriangle } from 'lucide-react'
import type { Product, Category } from '../types'
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, deleteCategory,
} from '../lib/db'
import Modal from '../components/ui/Modal'


type Tab = 'products' | 'categories'

interface ProductForm {
  code: string
  name: string
  description: string
  category_id: string
  unit: string
  cost_price: string
  selling_price: string
  stock_quantity: string
  min_stock: string
}

interface CategoryForm {
  name: string
  description: string
}

const emptyProductForm: ProductForm = {
  code: '',
  name: '',
  description: '',
  category_id: '',
  unit: '',
  cost_price: '',
  selling_price: '',
  stock_quantity: '',
  min_stock: '',
}

const emptyCategoryForm: CategoryForm = {
  name: '',
  description: '',
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<Tab>('products')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [productSaving, setProductSaving] = useState(false)

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm)
  const [categorySaving, setCategorySaving] = useState(false)

  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err: unknown) {
      alert('加载商品失败: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setProductsLoading(false)
    }
  }

  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err: unknown) {
      alert('加载类别失败: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  // ── Product handlers ──────────────────────────────────────────

  const openCreateProduct = () => {
    setEditingProduct(null)
    setProductForm(emptyProductForm)
    setProductModalOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      code: product.code,
      name: product.name,
      description: product.description ?? '',
      category_id: product.category_id != null ? String(product.category_id) : '',
      unit: product.unit,
      cost_price: String(product.cost_price),
      selling_price: String(product.selling_price),
      stock_quantity: String(product.stock_quantity),
      min_stock: String(product.min_stock),
    })
    setProductModalOpen(true)
  }

  const closeProductModal = () => {
    setProductModalOpen(false)
    setEditingProduct(null)
    setProductForm(emptyProductForm)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductSaving(true)
    try {
      const payload = {
        code: productForm.code.trim(),
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        category_id: productForm.category_id ? Number(productForm.category_id) : undefined,
        unit: productForm.unit.trim(),
        cost_price: Number(productForm.cost_price),
        selling_price: Number(productForm.selling_price),
        stock_quantity: Number(productForm.stock_quantity),
        min_stock: Number(productForm.min_stock),
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
      } else {
        await createProduct(payload)
      }

      await loadProducts()
      closeProductModal()
    } catch (err: unknown) {
      alert('保存失败: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setProductSaving(false)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`确认删除商品「${product.name}」？`)) return
    try {
      await deleteProduct(product.id)
      await loadProducts()
    } catch (err: unknown) {
      alert('删除失败: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // ── Category handlers ─────────────────────────────────────────

  const openCreateCategory = () => {
    setCategoryForm(emptyCategoryForm)
    setCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setCategoryModalOpen(false)
    setCategoryForm(emptyCategoryForm)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategorySaving(true)
    try {
      await createCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
      })
      await loadCategories()
      closeCategoryModal()
    } catch (err: unknown) {
      alert('保存失败: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCategorySaving(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`确认删除类别「${category.name}」？`)) return
    try {
      await deleteCategory(category.id)
      await loadCategories()
    } catch (err: unknown) {
      alert('删除失败: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // ── Derived data ──────────────────────────────────────────────

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  })

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="text-[#2B5AED]" size={28} />
        <h1 className="text-2xl font-bold text-[#1D2129]">库存管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E6EB]">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-[#2B5AED] text-[#2B5AED]'
              : 'border-transparent text-[#86909C] hover:text-[#4E5969] hover:border-[#E5E6EB]'
          }`}
        >
          商品列表
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-[#2B5AED] text-[#2B5AED]'
              : 'border-transparent text-[#86909C] hover:text-[#4E5969] hover:border-[#E5E6EB]'
          }`}
        >
          商品类别
        </button>
      </div>

      {/* ── Products Tab ── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9CDD4]" size={16} />
              <input
                type="text"
                placeholder="搜索商品名称或编码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadProducts}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#4E5969] border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
              >
                <RefreshCw size={15} />
                刷新
              </button>
              <button
                onClick={openCreateProduct}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] transition-colors"
              >
                <Plus size={16} />
                新增商品
              </button>
            </div>
          </div>

          {/* Products table */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-16 text-[#C9CDD4]">
              <RefreshCw className="animate-spin mr-2" size={20} />
              加载中...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E5E6EB] bg-white shadow-sm">
              <table className="min-w-full divide-y divide-[#E5E6EB] text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider">编码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider">名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider">类别</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider">单位</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#86909C] uppercase tracking-wider">成本价</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#86909C] uppercase tracking-wider">售价</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#86909C] uppercase tracking-wider">库存数量</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#86909C] uppercase tracking-wider">最低库存</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#86909C] uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F3F5]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-[#C9CDD4]">
                        {searchQuery ? '未找到匹配的商品' : '暂无商品数据'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLowStock = product.stock_quantity < product.min_stock
                      return (
                        <tr key={product.id} className="hover:bg-[#F7F8FA] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#4E5969]">{product.code}</td>
                          <td className="px-4 py-3 font-medium text-[#1D2129]">{product.name}</td>
                          <td className="px-4 py-3 text-[#86909C]">
                            {product.category?.name ?? (
                              <span className="text-[#C9CDD4]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#86909C]">{product.unit}</td>
                          <td className="px-4 py-3 text-right text-[#4E5969]">
                            ¥{Number(product.cost_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[#4E5969]">
                            ¥{Number(product.selling_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 font-medium ${isLowStock ? 'text-[#FF7D00]' : 'text-[#4E5969]'}`}>
                              {isLowStock && (
                                <AlertTriangle size={14} className="text-[#FF7D00]" />
                              )}
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-[#86909C]">{product.min_stock}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditProduct(product)}
                                className="p-1.5 text-[#2B5AED] hover:bg-[#EDF1FE] rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="p-1.5 text-[#F53F3F] hover:bg-[#FEECEC] rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Categories Tab ── */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex justify-end gap-2">
            <button
              onClick={loadCategories}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#4E5969] border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              <RefreshCw size={15} />
              刷新
            </button>
            <button
              onClick={openCreateCategory}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] transition-colors"
            >
              <Plus size={16} />
              新增类别
            </button>
          </div>

          {/* Categories table */}
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-16 text-[#C9CDD4]">
              <RefreshCw className="animate-spin mr-2" size={20} />
              加载中...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E5E6EB] bg-white shadow-sm">
              <table className="min-w-full divide-y divide-[#E5E6EB] text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider">名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider">描述</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#86909C] uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F3F5]">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-[#C9CDD4]">
                        暂无类别数据
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#1D2129]">{category.name}</td>
                        <td className="px-4 py-3 text-[#86909C]">
                          {category.description ?? <span className="text-[#C9CDD4]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-1.5 text-[#F53F3F] hover:bg-[#FEECEC] rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Product Modal ── */}
      <Modal
        open={productModalOpen}
        onClose={closeProductModal}
        title={editingProduct ? '编辑商品' : '新增商品'}
        size="lg"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                编码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productForm.code}
                onChange={(e) => setProductForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="例：PRD-001"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="商品名称"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">类别</label>
              <select
                value={productForm.category_id}
                onChange={(e) => setProductForm((f) => ({ ...f, category_id: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] bg-white"
              >
                <option value="">— 请选择类别 —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                单位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productForm.unit}
                onChange={(e) => setProductForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="例：个、箱、千克"
              />
            </div>

            {/* Cost price */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                成本价 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={productForm.cost_price}
                onChange={(e) => setProductForm((f) => ({ ...f, cost_price: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="0.00"
              />
            </div>

            {/* Selling price */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                售价 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={productForm.selling_price}
                onChange={(e) => setProductForm((f) => ({ ...f, selling_price: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="0.00"
              />
            </div>

            {/* Stock quantity */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                库存数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={productForm.stock_quantity}
                onChange={(e) => setProductForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="0"
              />
            </div>

            {/* Min stock */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                最低库存 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={productForm.min_stock}
                onChange={(e) => setProductForm((f) => ({ ...f, min_stock: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Description — full width */}
          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">描述</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] resize-none"
              placeholder="商品描述（可选）"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeProductModal}
              className="px-4 py-2 text-sm text-[#4E5969] border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={productSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] disabled:opacity-60 transition-colors"
            >
              {productSaving && <RefreshCw className="animate-spin" size={14} />}
              {editingProduct ? '保存修改' : '创建商品'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Category Modal ── */}
      <Modal
        open={categoryModalOpen}
        onClose={closeCategoryModal}
        title="新增类别"
        size="sm"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              placeholder="类别名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">描述</label>
            <textarea
              rows={3}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] resize-none"
              placeholder="类别描述（可选）"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeCategoryModal}
              className="px-4 py-2 text-sm text-[#4E5969] border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={categorySaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] disabled:opacity-60 transition-colors"
            >
              {categorySaving && <RefreshCw className="animate-spin" size={14} />}
              创建类别
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
