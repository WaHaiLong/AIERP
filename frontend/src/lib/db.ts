import { supabase } from './supabase'
import type {
  Category, Product, Customer, SalesOrder, SalesOrderItem,
  Supplier, PurchaseOrder, PurchaseOrderItem, Invoice, Payment,
  Department, Employee, DashboardStats
} from '../types'

// ─── Categories ───────────────────────────────────────────────
export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data as Category[]
}

export const createCategory = async (d: Omit<Category, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('categories').insert(d).select().single()
  if (error) throw error
  return data as Category
}

export const deleteCategory = async (id: number) => {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── Products ─────────────────────────────────────────────────
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products').select('*, category:categories(name)').order('name')
  if (error) throw error
  return data as Product[]
}

export const createProduct = async (d: Omit<Product, 'id' | 'created_at' | 'category'>) => {
  const { data, error } = await supabase.from('products').insert(d).select().single()
  if (error) throw error
  return data as Product
}

export const updateProduct = async (id: number, d: Partial<Product>) => {
  const { data, error } = await supabase.from('products').update(d).eq('id', id).select().single()
  if (error) throw error
  return data as Product
}

export const deleteProduct = async (id: number) => {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export const createStockMovement = async (productId: number, type: string, qty: number, ref?: string, notes?: string) => {
  const { error: mvErr } = await supabase.from('stock_movements').insert({
    product_id: productId, movement_type: type, quantity: qty, reference: ref, notes
  })
  if (mvErr) throw mvErr

  const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', productId).single()
  let newQty = prod?.stock_quantity ?? 0
  if (type === 'in') newQty += qty
  else if (type === 'out') newQty -= qty
  else newQty = qty

  const { error: updErr } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', productId)
  if (updErr) throw updErr
}

// ─── Customers ────────────────────────────────────────────────
export const getCustomers = async () => {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) throw error
  return data as Customer[]
}

export const createCustomer = async (d: Omit<Customer, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('customers').insert(d).select().single()
  if (error) throw error
  return data as Customer
}

export const updateCustomer = async (id: number, d: Partial<Customer>) => {
  const { data, error } = await supabase.from('customers').update(d).eq('id', id).select().single()
  if (error) throw error
  return data as Customer
}

export const deleteCustomer = async (id: number) => {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ─── Sales Orders ─────────────────────────────────────────────
export const getSalesOrders = async () => {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, customer:customers(name, code), items:sales_order_items(*, product:products(name, code))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as SalesOrder[]
}

export const createSalesOrder = async (
  order: Omit<SalesOrder, 'id' | 'order_number' | 'created_at' | 'customer' | 'items'>,
  items: Omit<SalesOrderItem, 'id' | 'order_id' | 'product'>[]
) => {
  const { count } = await supabase.from('sales_orders').select('*', { count: 'exact', head: true })
  const order_number = `SO-${String((count ?? 0) + 1).padStart(6, '0')}`

  const { data: ord, error: ordErr } = await supabase
    .from('sales_orders').insert({ ...order, order_number }).select().single()
  if (ordErr) throw ordErr

  const orderItems = items.map(i => ({ ...i, order_id: ord.id }))
  const { error: itemErr } = await supabase.from('sales_order_items').insert(orderItems)
  if (itemErr) throw itemErr
  return ord as SalesOrder
}

export const updateSalesOrderStatus = async (id: number, status: SalesOrder['status']) => {
  const { error } = await supabase.from('sales_orders').update({ status }).eq('id', id)
  if (error) throw error
}

export const deleteSalesOrder = async (id: number) => {
  const { error: itemErr } = await supabase.from('sales_order_items').delete().eq('order_id', id)
  if (itemErr) throw itemErr
  const { error } = await supabase.from('sales_orders').delete().eq('id', id)
  if (error) throw error
}

// ─── Suppliers ────────────────────────────────────────────────
export const getSuppliers = async () => {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data as Supplier[]
}

export const createSupplier = async (d: Omit<Supplier, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('suppliers').insert(d).select().single()
  if (error) throw error
  return data as Supplier
}

export const updateSupplier = async (id: number, d: Partial<Supplier>) => {
  const { data, error } = await supabase.from('suppliers').update(d).eq('id', id).select().single()
  if (error) throw error
  return data as Supplier
}

export const deleteSupplier = async (id: number) => {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw error
}

// ─── Purchase Orders ──────────────────────────────────────────
export const getPurchaseOrders = async () => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(name, code), items:purchase_order_items(*, product:products(name, code))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as PurchaseOrder[]
}

export const createPurchaseOrder = async (
  order: Omit<PurchaseOrder, 'id' | 'order_number' | 'created_at' | 'supplier' | 'items'>,
  items: Omit<PurchaseOrderItem, 'id' | 'order_id' | 'product'>[]
) => {
  const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
  const order_number = `PO-${String((count ?? 0) + 1).padStart(6, '0')}`

  const { data: ord, error: ordErr } = await supabase
    .from('purchase_orders').insert({ ...order, order_number }).select().single()
  if (ordErr) throw ordErr

  const orderItems = items.map(i => ({ ...i, order_id: ord.id }))
  const { error: itemErr } = await supabase.from('purchase_order_items').insert(orderItems)
  if (itemErr) throw itemErr
  return ord as PurchaseOrder
}

export const updatePurchaseOrderStatus = async (id: number, status: string) => {
  const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id)
  if (error) throw error
}

export const deletePurchaseOrder = async (id: number) => {
  const { error: itemErr } = await supabase.from('purchase_order_items').delete().eq('order_id', id)
  if (itemErr) throw itemErr
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
  if (error) throw error
}

// ─── Invoices ─────────────────────────────────────────────────
export const getInvoices = async (type?: string) => {
  let q = supabase.from('invoices').select('*').order('invoice_date', { ascending: false })
  if (type) q = q.eq('invoice_type', type)
  const { data, error } = await q
  if (error) throw error
  return data as Invoice[]
}

export const createInvoice = async (d: Omit<Invoice, 'id' | 'invoice_number' | 'paid_amount' | 'status' | 'created_at'>) => {
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
    .eq('invoice_type', d.invoice_type)
  const prefix = d.invoice_type === 'receivable' ? 'AR' : 'AP'
  const invoice_number = `${prefix}-${String((count ?? 0) + 1).padStart(6, '0')}`

  const { data, error } = await supabase
    .from('invoices').insert({ ...d, invoice_number, paid_amount: 0, status: 'unpaid' }).select().single()
  if (error) throw error
  return data as Invoice
}

export const deleteInvoice = async (id: number) => {
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}

export const createPayment = async (d: Omit<Payment, 'id' | 'created_at'>) => {
  const { data: payment, error: payErr } = await supabase.from('payments').insert(d).select().single()
  if (payErr) throw payErr

  const { data: inv } = await supabase.from('invoices').select('amount, paid_amount').eq('id', d.invoice_id).single()
  if (inv) {
    const newPaid = inv.paid_amount + d.amount
    const status = newPaid >= inv.amount ? 'paid' : 'partial'
    const { error: updErr } = await supabase.from('invoices').update({ paid_amount: newPaid, status }).eq('id', d.invoice_id)
    if (updErr) throw updErr
  }
  return payment as Payment
}

// ─── Departments ──────────────────────────────────────────────
export const getDepartments = async () => {
  const { data, error } = await supabase.from('departments').select('*').order('name')
  if (error) throw error
  return data as Department[]
}

export const createDepartment = async (d: Omit<Department, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('departments').insert(d).select().single()
  if (error) throw error
  return data as Department
}

export const deleteDepartment = async (id: number) => {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
}

// ─── Employees ────────────────────────────────────────────────
export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees').select('*, department:departments(name)').order('first_name')
  if (error) throw error
  return data as Employee[]
}

export const createEmployee = async (d: Omit<Employee, 'id' | 'created_at' | 'department'>) => {
  const { data, error } = await supabase.from('employees').insert(d).select().single()
  if (error) throw error
  return data as Employee
}

export const updateEmployee = async (id: number, d: Partial<Employee>) => {
  const { data, error } = await supabase.from('employees').update(d).eq('id', id).select().single()
  if (error) throw error
  return data as Employee
}

export const deleteEmployee = async (id: number) => {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}

// ─── Dashboard ────────────────────────────────────────────────
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [
    { count: totalProducts },
    { data: allProductsData },
    { count: totalCustomers },
    { count: totalSuppliers },
    { data: salesOrders },
    { data: purchaseOrders },
    { data: invoices },
    { count: totalEmployees },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('id, stock_quantity, min_stock'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('sales_orders').select('total, status'),
    supabase.from('purchase_orders').select('total, status'),
    supabase.from('invoices').select('amount, paid_amount, status'),
    supabase.from('employees').select('*', { count: 'exact', head: true }),
  ])

  const lowStockProducts = allProductsData?.filter(p => p.stock_quantity < p.min_stock).length ?? 0
  const salesTotalAmount = salesOrders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0
  const unpaidInvoices = invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paid_amount), 0) ?? 0

  return {
    totalProducts: totalProducts ?? 0,
    lowStockProducts,
    totalCustomers: totalCustomers ?? 0,
    totalSuppliers: totalSuppliers ?? 0,
    salesOrdersCount: salesOrders?.length ?? 0,
    salesTotalAmount,
    purchaseOrdersCount: purchaseOrders?.length ?? 0,
    unpaidInvoices,
    totalEmployees: totalEmployees ?? 0,
  }
}
