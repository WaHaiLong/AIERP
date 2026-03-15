# AIERP 产品需求文档

**文档版本：** v1.0
**撰写日期：** 2026-03-15
**文档状态：** 待评审
**适用团队：** 产品、前端、后端开发团队

---

## 1. 系统概述

### 1.1 产品定位

AIERP 是一款面向中小企业的轻量级 Web ERP 系统，基于 React + Supabase 构建，提供涵盖库存、销售、采购、财务、人力资源的一体化业务管理能力。

### 1.2 当前已实现功能清单

#### 认证与权限
- 用户登录（Supabase Auth）
- 角色体系定义：`admin` / `manager` / `staff`（数据模型已定义，前端路由保护已实现，**但角色权限管控尚未落地**）

#### 仪表盘（Dashboard）
- 核心业务指标汇总展示：商品总数、低库存商品数、客户总数、供应商总数、销售订单数、销售总额、采购订单数、未付款发票金额、员工总数

#### 库存管理（Inventory）
- 商品分类：创建、删除
- 商品管理：创建、编辑、删除，含编码、名称、分类、单位、成本价、售价、库存量、最低库存
- 库存变动记录：支持入库（in）、出库（out）、盘点调整（adjust）三种操作类型，写入 `stock_movements` 表

#### 销售管理（Sales）
- 客户管理：创建、编辑、删除，含编码、名称、联系方式、地址、信用额度
- 销售订单：创建、删除，含多行商品明细、折扣、税额、订单状态流转（draft → confirmed → shipped → delivered → cancelled）

#### 采购管理（Purchase）
- 供应商管理：创建、编辑、删除，含编码、名称、联系方式、地址、账期（天数）
- 采购订单：创建、删除，含多行商品明细、税额、预计到货日期、状态流转（draft → sent → received → cancelled）

#### 财务管理（Finance）
- 应收账款（AR）：创建发票、记录收款、删除发票
- 应付账款（AP）：创建发票、记录付款、删除发票
- 付款方式：现金、银行转账、支票
- 发票状态自动计算：unpaid → partial → paid

#### 人力资源（HR）
- 部门管理：创建、删除
- 员工管理：创建、编辑、删除，含工号、姓名、联系方式、部门、职位、入职日期、薪资、状态（在职/非活跃/离职）

---

## 2. 功能缺口分析

通过对比完整 ERP 系统最佳实践（参考 SAP Business One、Odoo、金蝶等成熟产品），梳理当前系统与完整能力之间的差距如下：

### 2.1 业务流程断链

| 缺口项 | 问题描述 |
|--------|----------|
| 销售出库未自动扣减库存 | 销售订单状态变更为 `shipped` / `delivered` 时，未触发库存扣减，库存数据不准确 |
| 采购入库未自动增加库存 | 采购订单状态变更为 `received` 时，未触发库存增加 |
| 发票与订单未关联 | 应收发票无法关联具体销售订单，应付发票无法关联采购订单，财务与业务割裂 |
| 销售订单不可编辑 | 已创建订单仅能删除，无法修改明细（缺少编辑功能） |
| 采购订单不可编辑 | 同上 |
| 客户信用额度未校验 | 创建销售订单时未对比客户信用额度与当前欠款总额 |

### 2.2 缺失核心模块

| 模块 | 缺失内容 |
|------|----------|
| 报表与分析 | 无任何报表、图表或数据导出能力 |
| 薪酬管理 | 员工薪资字段已有，但无薪资核算、发放记录 |
| 考勤管理 | 完全缺失 |
| 多仓库管理 | 当前库存为单仓模型，无多仓库支持 |
| 商品序列号/批次管理 | 无法追踪批次和序列号 |
| 审批流程 | 订单、发票无审批环节 |
| 系统通知/告警 | 无低库存告警推送、发票到期提醒 |
| 系统设置 | 无公司信息、币种、税率等基础配置页 |
| 操作审计日志 | 无用户操作记录 |

### 2.3 现有功能的质量缺口

| 缺口项 | 问题描述 |
|--------|----------|
| 角色权限未落地 | 数据模型定义了三种角色，但前端无任何按角色的功能限制 |
| 分类仅支持一级 | 商品分类无父子层级结构 |
| 发票编号生成存在并发风险 | 使用 `count + 1` 方式生成编号，高并发下可能重复 |
| 无数据校验反馈 | 表单提交失败时错误信息不够友好 |
| 供应商缺少信用/评级字段 | 无法对供应商进行分级管理 |
| 仪表盘低库存统计逻辑有误 | `db.ts` 第 285 行低库存查询使用了嵌套 select 作为比较值，逻辑异常 |

---

## 3. 优先级需求清单

### P0 — 必须立即实现（核心业务闭环）

| 编号 | 需求名称 | 所属模块 | 价值描述 |
|------|----------|----------|----------|
| P0-01 | 销售出库自动扣减库存 | 销售 + 库存 | 保证库存数据与实际一致，业务流程闭环 |
| P0-02 | 采购入库自动增加库存 | 采购 + 库存 | 同上 |
| P0-03 | 销售订单编辑功能 | 销售 | 已确认但未发货的订单必须支持修改 |
| P0-04 | 采购订单编辑功能 | 采购 | 已发送但未收货的订单必须支持修改 |
| P0-05 | 发票与订单关联 | 财务 | 实现业务凭证可追溯，满足基本财务规范 |
| P0-06 | 角色权限控制落地 | 系统 | staff 不能删除核心数据，manager 不能修改系统设置 |
| P0-07 | 低库存告警修复与通知 | 库存 | 修复仪表盘统计逻辑错误，并在界面上高亮告警 |
| P0-08 | 系统基础配置页 | 系统 | 公司名称、默认税率、本位币等参数，影响全系统计算 |

### P1 — 重要功能（可在 P0 完成后一个迭代内交付）

| 编号 | 需求名称 | 所属模块 | 价值描述 |
|------|----------|----------|----------|
| P1-01 | 销售报表（按时间段/客户/商品） | 报表 | 管理层决策依据 |
| P1-02 | 库存报表（库存明细、进出存汇总） | 报表 | 仓库盘点与对账 |
| P1-03 | 财务报表（收支汇总、利润概览） | 报表 | 财务核算基础 |
| P1-04 | 数据导出（Excel/CSV） | 全模块 | 与外部系统（税务、审计）对接 |
| P1-05 | 薪酬发放记录 | HR | 员工薪资发放流水，支持月度结算 |
| P1-06 | 客户信用额度校验 | 销售 | 下单时拦截超信用额度交易，降低坏账风险 |
| P1-07 | 商品分类层级支持（父子分类） | 库存 | 大量商品时的分类管理能力 |
| P1-08 | 发票到期提醒 | 财务 | 自动标记逾期发票，Dashboard 展示逾期金额 |
| P1-09 | 供应商评级/分类字段 | 采购 | 支持战略供应商管理 |
| P1-10 | 发票编号生成安全化 | 财务 | 改用数据库序列（sequence）避免并发重复 |

### P2 — 增强功能（长期迭代计划）

| 编号 | 需求名称 | 所属模块 | 价值描述 |
|------|----------|----------|----------|
| P2-01 | 多仓库管理 | 库存 | 适配多仓、多门店场景 |
| P2-02 | 商品批次/序列号追踪 | 库存 | 食品、医疗、电子等行业合规要求 |
| P2-03 | 订单审批流程 | 销售/采购 | 大额订单需 manager/admin 审批 |
| P2-04 | 考勤管理模块 | HR | 出勤记录、请假审批、加班管理 |
| P2-05 | 操作审计日志 | 系统 | 记录所有 CRUD 操作，供合规审查 |
| P2-06 | 仪表盘图表可视化 | 仪表盘 | 销售趋势折线图、库存分布饼图等 |
| P2-07 | 消息通知中心 | 系统 | 站内消息，低库存/逾期发票自动推送 |
| P2-08 | 移动端适配 | 全模块 | 响应式布局优化，支持移动设备访问 |
| P2-09 | 多语言支持 | 系统 | i18n 框架，支持中英文切换 |
| P2-10 | API 开放接口 | 系统 | 提供 REST API 供第三方系统集成 |

---

## 4. 用户故事（P0 需求）

### P0-01：销售出库自动扣减库存

> **As a** 仓库管理员，
> **I want to** 当销售订单状态变更为"已发货（shipped）"时系统自动扣减对应商品库存，
> **So that** 我无需手动操作库存变动，避免人为遗漏导致库存数据失真，保证账实相符。

**验收标准：**
- 销售订单状态从任意状态变更为 `shipped` 时，触发库存扣减
- 若订单中某商品库存不足，系统应阻止状态变更并提示具体商品名称和缺口数量
- 库存扣减同时写入 `stock_movements` 记录，`movement_type = 'out'`，`reference` 字段填入销售订单号
- 若订单取消（cancelled），已扣减的库存应自动回补

---

### P0-02：采购入库自动增加库存

> **As a** 采购专员，
> **I want to** 当采购订单状态变更为"已收货（received）"时系统自动增加对应商品库存，
> **So that** 货物到库后库存数量实时更新，无需跨系统手工录入。

**验收标准：**
- 采购订单状态变更为 `received` 时，按订单明细批量更新库存
- 同步写入 `stock_movements`，`movement_type = 'in'`，`reference` 填入采购订单号
- 若订单取消，不自动回滚已入库数量（需手动盘点）

---

### P0-03：销售订单编辑功能

> **As a** 销售内勤，
> **I want to** 能够编辑状态为"草稿（draft）"或"已确认（confirmed）"的销售订单，修改商品数量、单价或折扣，
> **So that** 客户临时变更需求时我可以快速响应，而不必删除重建整个订单。

**验收标准：**
- 仅 `draft` 和 `confirmed` 状态的订单可编辑
- `shipped` 及之后状态的订单不可编辑，编辑入口置灰并提示原因
- 编辑时支持新增/删除/修改订单行
- 保存后重新计算小计、折扣、税额、合计

---

### P0-04：采购订单编辑功能

> **As a** 采购专员，
> **I want to** 能够编辑状态为"草稿（draft）"或"已发送（sent）"的采购订单，
> **So that** 供应商报价变化或到货量调整时可及时更正，保证财务数据准确。

**验收标准：**
- 仅 `draft` 和 `sent` 状态的订单可编辑
- `received` 及 `cancelled` 状态不可编辑
- 编辑逻辑与销售订单一致

---

### P0-05：发票与订单关联

> **As a** 财务人员，
> **I want to** 在创建应收/应付发票时能够关联对应的销售/采购订单，
> **So that** 每一笔财务凭证都有业务单据可追溯，满足对账和审计需求。

**验收标准：**
- 应收发票（receivable）可选择关联一张销售订单
- 应付发票（payable）可选择关联一张采购订单
- 关联后，在订单详情页可查看该订单对应的发票状态
- 关联字段为可选，不影响独立创建发票的现有流程

---

### P0-06：角色权限控制落地

> **As a** 系统管理员，
> **I want to** 不同角色的用户只能访问和操作其权限范围内的功能，
> **So that** 防止 staff 误删核心数据，保障数据安全和业务稳定。

**验收标准：**

| 功能操作 | admin | manager | staff |
|----------|-------|---------|-------|
| 查看所有模块 | ✓ | ✓ | ✓ |
| 创建订单/发票 | ✓ | ✓ | ✓ |
| 编辑订单/客户/供应商 | ✓ | ✓ | ✗ |
| 删除任意记录 | ✓ | ✓ | ✗ |
| 访问系统设置 | ✓ | ✗ | ✗ |
| 管理用户账号 | ✓ | ✗ | ✗ |
| 查看员工薪资 | ✓ | ✓ | ✗ |

- 无权限时，按钮置灰或隐藏，并给出提示
- 权限控制在前端组件层和 Supabase RLS（Row Level Security）双层落地

---

### P0-07：低库存告警修复与通知

> **As a** 仓库管理员，
> **I want to** 在仪表盘和库存列表中准确看到低于最低库存阈值的商品，
> **So that** 能及时发起补货采购，避免缺货影响销售。

**验收标准：**
- 修复 `db.ts` 中低库存统计查询逻辑（当前嵌套 select 写法有误）
- 正确逻辑：`stock_quantity < min_stock`
- 仪表盘低库存卡片显示正确数量，点击可跳转至库存列表并自动过滤显示低库存商品
- 库存列表中，低库存商品行以醒目颜色（如红色/橙色背景）高亮显示

---

### P0-08：系统基础配置页

> **As a** 系统管理员，
> **I want to** 在系统设置页面配置公司基本信息和全局参数，
> **So that** 这些参数能统一作用于订单打印、税率计算、发票抬头等场景，无需逐单手动填写。

**验收标准：**
- 新增路由 `/settings`，仅 admin 角色可访问
- 可配置项：公司名称、公司地址、税号、默认税率（%）、本位币、Logo 上传
- 配置信息存储于 `system_settings` 表（key-value 结构）
- 销售/采购订单创建时自动读取默认税率填充

---

## 5. 数据模型扩展建议

### 5.1 新增数据表

#### `system_settings`（系统配置表）
```sql
CREATE TABLE system_settings (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) UNIQUE NOT NULL,  -- 配置键，如 'company_name'
  value       TEXT,                           -- 配置值
  description VARCHAR(255),                   -- 配置说明
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `salary_records`（薪资发放记录表）
```sql
CREATE TABLE salary_records (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER REFERENCES employees(id),
  period_year   INTEGER NOT NULL,             -- 发薪年份
  period_month  INTEGER NOT NULL,             -- 发薪月份（1-12）
  base_salary   NUMERIC(12, 2) NOT NULL,
  bonus         NUMERIC(12, 2) DEFAULT 0,
  deduction     NUMERIC(12, 2) DEFAULT 0,     -- 扣款（缺勤、社保个人等）
  net_salary    NUMERIC(12, 2) NOT NULL,      -- 实发金额
  payment_date  DATE,
  status        VARCHAR(20) DEFAULT 'pending', -- pending / paid
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_logs`（操作审计日志表，P2）
```sql
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id),
  action      VARCHAR(50) NOT NULL,           -- CREATE / UPDATE / DELETE
  table_name  VARCHAR(100) NOT NULL,
  record_id   INTEGER,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 现有表字段扩展

#### `invoices` 表新增字段
```sql
ALTER TABLE invoices
  ADD COLUMN sales_order_id   INTEGER REFERENCES sales_orders(id),    -- P0-05
  ADD COLUMN purchase_order_id INTEGER REFERENCES purchase_orders(id); -- P0-05
```

#### `products` 表新增字段
```sql
ALTER TABLE products
  ADD COLUMN barcode       VARCHAR(100),       -- 条形码/二维码
  ADD COLUMN weight        NUMERIC(10, 3),     -- 重量（kg），用于物流计算
  ADD COLUMN is_active     BOOLEAN DEFAULT TRUE; -- 商品上下架状态
```

#### `customers` 表新增字段
```sql
ALTER TABLE customers
  ADD COLUMN tax_number    VARCHAR(50),        -- 税号，用于发票抬头
  ADD COLUMN contact_person VARCHAR(100),      -- 联系人姓名
  ADD COLUMN customer_type VARCHAR(20) DEFAULT 'retail'; -- retail / wholesale / vip
```

#### `suppliers` 表新增字段
```sql
ALTER TABLE suppliers
  ADD COLUMN tax_number    VARCHAR(50),        -- 税号
  ADD COLUMN bank_account  VARCHAR(100),       -- 银行账号，用于付款
  ADD COLUMN rating        SMALLINT DEFAULT 3  -- 评级 1-5 星（P1-09）
    CHECK (rating BETWEEN 1 AND 5);
```

#### `employees` 表新增字段
```sql
ALTER TABLE employees
  ADD COLUMN id_number     VARCHAR(50),        -- 身份证号
  ADD COLUMN bank_account  VARCHAR(100),       -- 银行卡号（发薪用）
  ADD COLUMN contract_end  DATE;               -- 合同到期日
```

#### `categories` 表新增字段（P1-07）
```sql
ALTER TABLE categories
  ADD COLUMN parent_id INTEGER REFERENCES categories(id); -- 父分类，实现层级
```

### 5.3 TypeScript 类型扩展（`types/index.ts`）

```typescript
// 系统配置
export interface SystemSetting {
  id: number
  key: string
  value: string
  description?: string
  updated_at?: string
}

// 薪资记录
export interface SalaryRecord {
  id: number
  employee_id: number
  employee?: Employee
  period_year: number
  period_month: number
  base_salary: number
  bonus: number
  deduction: number
  net_salary: number
  payment_date?: string
  status: 'pending' | 'paid'
  notes?: string
  created_at?: string
}

// Invoice 类型扩展
export interface Invoice {
  // ... 现有字段 ...
  sales_order_id?: number
  purchase_order_id?: number
}

// Customer 类型扩展
export interface Customer {
  // ... 现有字段 ...
  tax_number?: string
  contact_person?: string
  customer_type?: 'retail' | 'wholesale' | 'vip'
}

// Supplier 类型扩展
export interface Supplier {
  // ... 现有字段 ...
  tax_number?: string
  bank_account?: string
  rating?: number
}
```

---

## 6. API 接口需求（Supabase 查询）

### 6.1 P0 优先级接口

#### 库存联动接口

```typescript
// 销售发货时扣减库存（P0-01）
// 在 updateSalesOrderStatus 中，当 status === 'shipped' 时触发
export const fulfillSalesOrder = async (orderId: number) => {
  // 1. 获取订单明细
  const items = await supabase
    .from('sales_order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  // 2. 逐行校验库存是否充足（不足则抛出错误）
  // 3. 批量调用 createStockMovement(productId, 'out', qty, orderNumber)
  // 4. 更新订单状态为 'shipped'
}

// 采购收货时增加库存（P0-02）
export const receivePurchaseOrder = async (orderId: number) => {
  // 1. 获取采购明细
  // 2. 批量调用 createStockMovement(productId, 'in', qty, orderNumber)
  // 3. 更新订单状态为 'received'
}
```

#### 订单编辑接口

```typescript
// 更新销售订单（P0-03）
export const updateSalesOrder = async (
  id: number,
  order: Partial<SalesOrder>,
  items: Omit<SalesOrderItem, 'id' | 'order_id' | 'product'>[]
) => {
  // 1. 更新 sales_orders 表头字段
  // 2. 删除旧 sales_order_items
  // 3. 插入新 sales_order_items
}

// 更新采购订单（P0-04）
export const updatePurchaseOrder = async (
  id: number,
  order: Partial<PurchaseOrder>,
  items: Omit<PurchaseOrderItem, 'id' | 'order_id' | 'product'>[]
) => {
  // 同上逻辑
}
```

#### 发票关联接口

```typescript
// 获取带订单关联的发票（P0-05）
export const getInvoicesWithOrders = async (type?: string) => {
  return supabase
    .from('invoices')
    .select(`
      *,
      sales_order:sales_orders(order_number, total),
      purchase_order:purchase_orders(order_number, total)
    `)
    .order('invoice_date', { ascending: false })
}

// 创建发票时支持关联订单（P0-05）
export const createInvoiceWithOrder = async (
  d: Omit<Invoice, 'id' | 'invoice_number' | 'paid_amount' | 'status' | 'created_at'>
) => {
  // 含 sales_order_id 或 purchase_order_id 字段
}
```

#### 系统配置接口

```typescript
// 读取所有系统配置（P0-08）
export const getSystemSettings = async () => {
  return supabase.from('system_settings').select('*')
}

// 批量更新系统配置（upsert）（P0-08）
export const upsertSystemSettings = async (settings: { key: string; value: string }[]) => {
  return supabase.from('system_settings').upsert(settings, { onConflict: 'key' })
}
```

#### 低库存查询修复

```typescript
// 修复后的低库存查询（P0-07）
// 替换 db.ts 第 285 行的错误写法
export const getLowStockProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .filter('stock_quantity', 'lt', supabase.rpc('get_product_min_stock'))
    // 推荐方案：使用 Supabase RPC 或在查询中直接比较同行字段
    // 正确的 PostgREST 写法（PostgreSQL 行内比较）：
    // .rpc('get_low_stock_products')  -- 推荐封装为数据库函数
  if (error) throw error
  return data as Product[]
}

// 推荐在 Supabase 创建数据库函数：
// CREATE OR REPLACE FUNCTION get_low_stock_products()
// RETURNS SETOF products AS $$
//   SELECT * FROM products WHERE stock_quantity < min_stock;
// $$ LANGUAGE sql STABLE;
```

### 6.2 P1 优先级接口

```typescript
// 销售报表：按时间段汇总（P1-01）
export const getSalesReport = async (startDate: string, endDate: string) => {
  return supabase
    .from('sales_orders')
    .select('order_date, total, status, customer:customers(name)')
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .eq('status', 'delivered')
    .order('order_date')
}

// 库存进出存报表（P1-02）
export const getStockMovementReport = async (productId?: number, startDate?: string, endDate?: string) => {
  let q = supabase
    .from('stock_movements')
    .select('*, product:products(name, code)')
    .order('created_at', { ascending: false })
  if (productId) q = q.eq('product_id', productId)
  if (startDate) q = q.gte('created_at', startDate)
  if (endDate) q = q.lte('created_at', endDate)
  return q
}

// 薪资记录（P1-05）
export const getSalaryRecords = async (year?: number, month?: number) => {
  let q = supabase
    .from('salary_records')
    .select('*, employee:employees(first_name, last_name, employee_id, department:departments(name))')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
  if (year) q = q.eq('period_year', year)
  if (month) q = q.eq('period_month', month)
  return q
}

export const createSalaryRecord = async (d: Omit<SalaryRecord, 'id' | 'created_at' | 'employee'>) => {
  return supabase.from('salary_records').insert(d).select().single()
}

// 逾期发票更新（P1-08）
// 建议通过 Supabase Edge Function 或 pg_cron 定时执行：
// UPDATE invoices
// SET status = 'overdue'
// WHERE status IN ('unpaid', 'partial')
//   AND due_date < CURRENT_DATE;
```

---

## 7. 路由结构扩展建议

基于现有 `App.tsx` 路由结构，建议新增以下路由：

```tsx
<Route path="/" element={<Layout />}>
  <Route index element={<Dashboard />} />
  <Route path="inventory" element={<Inventory />} />
  <Route path="sales" element={<Sales />} />
  <Route path="purchase" element={<Purchase />} />
  <Route path="finance" element={<Finance />} />
  <Route path="hr" element={<HR />} />

  {/* 新增路由 */}
  <Route path="reports" element={<Reports />} />           {/* P1：报表中心 */}
  <Route path="settings" element={<Settings />} />         {/* P0：系统设置（admin only）*/}
  <Route path="hr/salary" element={<Salary />} />          {/* P1：薪酬管理 */}
</Route>
```

---

## 8. 开发优先级排期建议

| 迭代 | 周期 | 主要交付内容 |
|------|------|-------------|
| Sprint 1 | 第 1-2 周 | P0-07 低库存修复、P0-01/02 库存联动、P0-08 系统设置 |
| Sprint 2 | 第 3-4 周 | P0-03/04 订单编辑、P0-05 发票关联、P0-06 权限控制 |
| Sprint 3 | 第 5-6 周 | P1-01/02/03 三大报表、P1-04 数据导出、P1-08 逾期提醒 |
| Sprint 4 | 第 7-8 周 | P1-05 薪酬管理、P1-06 信用校验、P1-07 分类层级、P1-09/10 |
| Sprint 5+ | 持续迭代 | P2 系列增强功能，按业务价值动态排序 |

---

*本文档由 AIERP 产品经理助手基于代码分析自动生成，最终需经产品负责人和技术负责人联合评审后方可作为开发依据。*
