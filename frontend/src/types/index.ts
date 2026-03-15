export interface User {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'manager' | 'staff'
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at?: string
}

export interface Product {
  id: number
  code: string
  name: string
  description?: string
  category_id?: number
  category?: Category
  unit: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  created_at?: string
}

export interface Customer {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  credit_limit: number
  created_at?: string
}

export interface SalesOrderItem {
  id?: number
  order_id?: number
  product_id: number
  product?: Product
  quantity: number
  unit_price: number
  discount: number
  total: number
}

export interface SalesOrder {
  id: number
  order_number: string
  customer_id: number
  customer?: Customer
  order_date: string
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  discount: number
  tax: number
  total: number
  notes?: string
  items?: SalesOrderItem[]
  created_at?: string
}

export interface Supplier {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  payment_terms: number
  created_at?: string
}

export interface PurchaseOrderItem {
  id?: number
  order_id?: number
  product_id: number
  product?: Product
  quantity: number
  unit_price: number
  total: number
}

export interface PurchaseOrder {
  id: number
  order_number: string
  supplier_id: number
  supplier?: Supplier
  order_date: string
  expected_date?: string
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  subtotal: number
  tax: number
  total: number
  notes?: string
  items?: PurchaseOrderItem[]
  created_at?: string
}

export interface Invoice {
  id: number
  invoice_number: string
  invoice_type: 'receivable' | 'payable'
  party_name: string
  invoice_date: string
  due_date?: string
  amount: number
  paid_amount: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue'
  notes?: string
  created_at?: string
}

export interface Payment {
  id: number
  invoice_id: number
  payment_date: string
  amount: number
  method: 'cash' | 'bank_transfer' | 'check'
  reference?: string
  notes?: string
  created_at?: string
}

export interface Department {
  id: number
  name: string
  description?: string
  created_at?: string
}

export interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  department_id?: number
  department?: Department
  position?: string
  hire_date?: string
  salary: number
  status: 'active' | 'inactive' | 'terminated'
  created_at?: string
}

export interface DashboardStats {
  totalProducts: number
  lowStockProducts: number
  totalCustomers: number
  totalSuppliers: number
  salesOrdersCount: number
  salesTotalAmount: number
  purchaseOrdersCount: number
  unpaidInvoices: number
  totalEmployees: number
}
