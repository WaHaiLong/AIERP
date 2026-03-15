# ERP 前端测试报告

**测试日期**：2026-03-15
**测试范围**：`/home/user/AIERP/frontend`
**测试人员**：自动化静态分析

---

## 一、构建结果

**结论：构建失败（Build FAILED）**

执行 `npm run build`（即 `tsc -b && vite build`）时，TypeScript 编译阶段报错，构建未能完成。

### 错误详情

| 文件 | 行号 | 错误码 | 描述 |
|---|---|---|---|
| `src/pages/Finance.tsx` | 第 291 行，第 57 列 | TS2367 | 类型不重叠的无效比较 |

**原始错误信息：**
```
src/pages/Finance.tsx(291,57): error TS2367:
This comparison appears to be unintentional because the types
'"unpaid" | "partial" | "overdue"' and '"cancelled"' have no overlap.
```

**Bug 分析：**
`src/types/index.ts` 第 114 行，`Invoice` 接口将 `status` 字段定义为：
```ts
status: 'unpaid' | 'partial' | 'paid' | 'overdue'
```
该联合类型中**不包含** `'cancelled'` 值。而 `Finance.tsx` 第 291 行使用了如下逻辑：
```ts
const canPay = inv.status !== 'paid' && inv.status !== 'cancelled'
```
由于 `status` 的类型中永远不可能是 `'cancelled'`，TypeScript 将该比较判定为无意义，报 TS2367 错误。

**修复建议：**
二选一：
1. 在 `src/types/index.ts` 的 `Invoice.status` 联合类型中补充 `'cancelled'`：
   ```ts
   status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
   ```
2. 若业务上确实不存在"已取消"发票状态，则删除 `Finance.tsx` 第 291 行对 `'cancelled'` 的比较：
   ```ts
   const canPay = inv.status !== 'paid'
   ```

---

## 二、静态代码分析（ESLint）

**结论：Lint 检查未通过（Lint FAILED）**

执行 `npm run lint`，发现 6 个错误，全部集中在 `src/pages/HR.tsx`。

### 错误汇总

| 文件 | 行号 | 规则 | 描述 |
|---|---|---|---|
| `src/pages/HR.tsx` | 61 | `@typescript-eslint/no-explicit-any` | 使用了 `any` 类型 |
| `src/pages/HR.tsx` | 72 | `@typescript-eslint/no-explicit-any` | 使用了 `any` 类型 |
| `src/pages/HR.tsx` | 121 | `@typescript-eslint/no-explicit-any` | 使用了 `any` 类型 |
| `src/pages/HR.tsx` | 133 | `@typescript-eslint/no-explicit-any` | 使用了 `any` 类型 |
| `src/pages/HR.tsx` | 152 | `@typescript-eslint/no-explicit-any` | 使用了 `any` 类型 |
| `src/pages/HR.tsx` | 164 | `@typescript-eslint/no-explicit-any` | 使用了 `any` 类型 |

**Bug 分析：**
`HR.tsx` 中多个 `catch` 子句使用了 `catch (e: any)` 的写法，违反了 TypeScript ESLint 规则。这些 `any` 类型注解会绕过类型检查，降低代码健壮性。

**修复建议：**
将所有 `catch (e: any)` 改为使用 `unknown` 类型并做类型收窄：
```ts
// 修改前
} catch (e: any) {
  setEmpError(e.message)
}

// 修改后
} catch (e: unknown) {
  setEmpError(e instanceof Error ? e.message : '未知错误')
}
```

---

## 三、关键逻辑代码审查

### 3.1 `src/lib/db.ts` — `getDashboardStats` 函数中 `lowStockProducts` 查询

**结论：存在严重 Bug（子查询用法错误）**

**问题代码（第 285 行）：**
```ts
supabase.from('products').select('id').lt('stock_quantity', supabase.from('products').select('min_stock')),
```

**Bug 说明：**
Supabase JS 客户端的 `.lt()` 过滤方法第二个参数期望的是一个**标量值**（如数字、字符串），而当前代码传入的是另一个 Supabase 查询构造器对象（`supabase.from('products').select('min_stock')`）。这不是合法的 SQL 子查询语法，Supabase JS SDK 不支持以这种方式内嵌子查询。

实际运行时，该调用会将查询对象转成字符串（例如 `"[object Object]"`）后传入 `.lt()`，导致以下后果：
- 在强类型环境下可能直接报运行时错误
- 即使不报错，过滤条件也必然不符合预期，返回错误的低库存数量
- 最终仪表盘展示的 `lowStockProducts` 数值不可信

**修复建议：**
Supabase JS SDK 不支持列与列之间的直接比较（column-to-column）。正确的做法是改用 Supabase 的 `filter` 方法配合 PostgREST 语法，或在数据库层面创建视图/RPC 函数。推荐使用 PostgREST 的 `gte` + 原始过滤器：

```ts
// 方案一：使用 PostgREST 原生过滤器（列对列比较）
supabase
  .from('products')
  .select('id')
  .filter('stock_quantity', 'lt', 'min_stock')  // 注意：这依然是字符串值，PostgREST 不直接支持列对列

// 方案二（推荐）：创建数据库视图或 RPC 函数
// 在 Supabase 数据库中创建：
// CREATE VIEW low_stock_products AS
//   SELECT id FROM products WHERE stock_quantity < min_stock;
// 然后查询：
supabase.from('low_stock_products').select('id', { count: 'exact', head: true })

// 方案三：分两步在客户端过滤（数据量小时可用）
const { data: allProducts } = await supabase
  .from('products')
  .select('stock_quantity, min_stock')
const lowStockCount = allProducts?.filter(p => p.stock_quantity < p.min_stock).length ?? 0
```

### 3.2 `src/store/authStore.ts` — Demo 登录逻辑

**结论：逻辑基本正确，存在轻微安全隐患**

**分析：**

| 检查点 | 状态 | 说明 |
|---|---|---|
| Demo 用户信息定义 | 正常 | `DEMO_USER` 对象定义合理，包含 `id`、`email`、`full_name`、`role` |
| 触发条件 | 基本正确 | 支持 `admin@erp.com` 和 `demo@example.com` 两个账号，密码均为 `demo123456` |
| 本地存储 | 有效 | 通过 `localStorage.setItem('erp_demo_user', ...)` 持久化，页面刷新后通过 `checkAuth` 恢复 |
| 登出逻辑 | 正确 | `signOut` 时同时清除 `localStorage` 和 Supabase session |
| `checkAuth` | 正确 | 优先检查本地 demo 用户，再检查 Supabase session |

**潜在问题：**
1. **localStorage 信任问题**：`checkAuth` 中直接 `JSON.parse(stored)` 后存入状态，未做任何验证。恶意用户可手动向 `localStorage` 写入 `erp_demo_user` 键，伪造任意身份（包括 `role: 'admin'`）绕过登录。
2. **硬编码密码**：`demo123456` 明文硬编码在源代码中，若代码公开则 Demo 账号无保护可言。对于演示系统可接受，但应在生产环境中移除此逻辑。

**修复建议：**
- 生产部署前移除 Demo 登录逻辑
- 若需保留，对 `localStorage` 中的内容做基本字段校验，避免伪造

### 3.3 `src/lib/supabase.ts` — Supabase 客户端初始化

**结论：功能正常，存在安全风险**

**分析：**

```ts
const supabaseUrl = 'https://mynwocqffdrpxyxyygoz.supabase.co'
const supabaseKey = 'sb_publishable_MGsdYaWodRl8Zei7PCZuzg_7B-8CceJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

| 检查点 | 状态 | 说明 |
|---|---|---|
| 初始化方式 | 正确 | 使用 `createClient` 初始化，语法无误 |
| Key 类型 | 可接受 | 使用的是 `sb_publishable_` 前缀的 anon/publishable key，非 service_role key，前端使用符合 Supabase 规范 |
| 配置硬编码 | 存在隐患 | URL 和 Key 直接硬编码在源码中 |

**潜在问题：**
- Supabase URL 和 Key 硬编码在源码中，一旦代码提交至公开仓库，Key 即泄露。虽然 `publishable key` 的权限受 Row Level Security (RLS) 控制，风险相对可控，但仍建议通过环境变量管理。

**修复建议：**
改为从环境变量读取：
```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```
并在 `.env` 文件中配置（同时将 `.env` 加入 `.gitignore`）。

---

## 四、问题汇总

| 编号 | 严重程度 | 文件 | 问题描述 |
|---|---|---|---|
| BUG-001 | **严重** | `src/lib/db.ts` 第 285 行 | `lowStockProducts` 子查询语法错误，导致数据错误 |
| BUG-002 | **高** | `src/pages/Finance.tsx` 第 291 行 | 与不存在的 `'cancelled'` 状态比较，导致构建失败 |
| BUG-003 | **中** | `src/pages/HR.tsx` 第 61/72/121/133/152/164 行 | 使用 `any` 类型，违反 ESLint 规则，降低类型安全性 |
| BUG-004 | **中** | `src/store/authStore.ts` | localStorage Demo 用户数据未做验证，存在身份伪造风险 |
| BUG-005 | **低** | `src/lib/supabase.ts` | Supabase Key 硬编码在源码中，建议改用环境变量 |

---

## 五、修复优先级建议

1. **立即修复**：BUG-001（`lowStockProducts` 查询逻辑错误）、BUG-002（构建失败）
2. **近期修复**：BUG-003（ESLint any 类型）、BUG-004（localStorage 验证）
3. **上线前处理**：BUG-005（Supabase Key 环境变量化）

---

*本报告由自动化静态分析生成，测试覆盖：构建检查、ESLint 静态分析、关键文件代码逻辑审查。*
