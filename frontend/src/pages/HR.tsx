import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users, Building2, Search } from 'lucide-react'
import type { Employee, Department } from '../types'
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getDepartments, createDepartment, deleteDepartment,
} from '../lib/db'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

type Tab = 'employees' | 'departments'

const EMPTY_EMPLOYEE: Omit<Employee, 'id' | 'created_at' | 'department'> = {
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department_id: undefined,
  position: '',
  hire_date: '',
  salary: 0,
  status: 'active',
}

const EMPTY_DEPARTMENT: Omit<Department, 'id' | 'created_at'> = {
  name: '',
  description: '',
}

export default function HR() {
  const [activeTab, setActiveTab] = useState<Tab>('employees')

  // ── Employees ──────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [empLoading, setEmpLoading] = useState(true)
  const [empSearch, setEmpSearch] = useState('')
  const [empModalOpen, setEmpModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [empForm, setEmpForm] = useState(EMPTY_EMPLOYEE)
  const [empSaving, setEmpSaving] = useState(false)
  const [empError, setEmpError] = useState('')

  // ── Departments ────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([])
  const [deptLoading, setDeptLoading] = useState(true)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [deptForm, setDeptForm] = useState(EMPTY_DEPARTMENT)
  const [deptSaving, setDeptSaving] = useState(false)
  const [deptError, setDeptError] = useState('')

  useEffect(() => {
    loadEmployees()
    loadDepartments()
  }, [])

  async function loadEmployees() {
    setEmpLoading(true)
    try {
      setEmployees(await getEmployees())
    } catch (e: unknown) {
      setEmpError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setEmpLoading(false)
    }
  }

  async function loadDepartments() {
    setDeptLoading(true)
    try {
      setDepartments(await getDepartments())
    } catch (e: unknown) {
      setDeptError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setDeptLoading(false)
    }
  }

  // ── Employee helpers ───────────────────────────────────────
  function openCreateEmployee() {
    setEditingEmployee(null)
    setEmpForm(EMPTY_EMPLOYEE)
    setEmpError('')
    setEmpModalOpen(true)
  }

  function openEditEmployee(emp: Employee) {
    setEditingEmployee(emp)
    setEmpForm({
      employee_id: emp.employee_id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      department_id: emp.department_id,
      position: emp.position ?? '',
      hire_date: emp.hire_date ?? '',
      salary: emp.salary,
      status: emp.status,
    })
    setEmpError('')
    setEmpModalOpen(true)
  }

  async function handleSaveEmployee() {
    setEmpSaving(true)
    setEmpError('')
    try {
      const payload = {
        ...empForm,
        salary: Number(empForm.salary),
        department_id: empForm.department_id ? Number(empForm.department_id) : undefined,
      }
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload)
      } else {
        await createEmployee(payload)
      }
      setEmpModalOpen(false)
      await loadEmployees()
    } catch (e: unknown) {
      setEmpError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setEmpSaving(false)
    }
  }

  async function handleDeleteEmployee(id: number) {
    if (!confirm('确定要删除该员工吗？')) return
    try {
      await deleteEmployee(id)
      await loadEmployees()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  // ── Department helpers ─────────────────────────────────────
  function openCreateDepartment() {
    setDeptForm(EMPTY_DEPARTMENT)
    setDeptError('')
    setDeptModalOpen(true)
  }

  async function handleSaveDepartment() {
    setDeptSaving(true)
    setDeptError('')
    try {
      await createDepartment(deptForm)
      setDeptModalOpen(false)
      await loadDepartments()
    } catch (e: unknown) {
      setDeptError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setDeptSaving(false)
    }
  }

  async function handleDeleteDepartment(id: number) {
    if (!confirm('确定要删除该部门吗？')) return
    try {
      await deleteDepartment(id)
      await loadDepartments()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  // ── Derived data ───────────────────────────────────────────
  const filteredEmployees = employees.filter(emp => {
    const q = empSearch.toLowerCase()
    return (
      emp.employee_id.toLowerCase().includes(q) ||
      emp.first_name.toLowerCase().includes(q) ||
      emp.last_name.toLowerCase().includes(q) ||
      (emp.email ?? '').toLowerCase().includes(q) ||
      (emp.position ?? '').toLowerCase().includes(q) ||
      (emp.department?.name ?? '').toLowerCase().includes(q)
    )
  })

  const deptEmployeeCount = (deptId: number) =>
    employees.filter(e => e.department_id === deptId).length

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Users size={28} className="text-[#2B5AED]" />
        <h1 className="text-2xl font-bold text-[#1D2129]">人力资源管理</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E6EB]">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'employees'
                ? 'border-[#2B5AED] text-[#2B5AED]'
                : 'border-transparent text-[#86909C] hover:text-[#4E5969]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users size={16} />
              员工管理
            </span>
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'departments'
                ? 'border-[#2B5AED] text-[#2B5AED]'
                : 'border-transparent text-[#86909C] hover:text-[#4E5969]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Building2 size={16} />
              部门管理
            </span>
          </button>
        </nav>
      </div>

      {/* ── EMPLOYEES TAB ─────────────────────────────────── */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9CDD4]" />
              <input
                type="text"
                placeholder="搜索员工..."
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>
            <button
              onClick={openCreateEmployee}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2B5AED] text-white text-sm font-medium rounded-lg hover:bg-[#1F4BD8] transition-colors"
            >
              <Plus size={16} />
              新增员工
            </button>
          </div>

          {empLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E5E6EB] border-t-[#2B5AED] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E6EB] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] border-b border-[#E5E6EB]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">工号</th>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">姓名</th>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">邮箱</th>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">部门</th>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">职位</th>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">入职日期</th>
                    <th className="px-4 py-3 text-right font-medium text-[#4E5969]">薪资</th>
                    <th className="px-4 py-3 text-center font-medium text-[#4E5969]">状态</th>
                    <th className="px-4 py-3 text-center font-medium text-[#4E5969]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F3F5]">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#C9CDD4]">
                        暂无员工数据
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#4E5969]">{emp.employee_id}</td>
                        <td className="px-4 py-3 font-medium text-[#1D2129]">
                          {emp.last_name}{emp.first_name}
                        </td>
                        <td className="px-4 py-3 text-[#4E5969]">{emp.email ?? '—'}</td>
                        <td className="px-4 py-3 text-[#4E5969]">{emp.department?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-[#4E5969]">{emp.position ?? '—'}</td>
                        <td className="px-4 py-3 text-[#4E5969]">{emp.hire_date ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-[#4E5969]">
                          ¥{emp.salary.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge status={emp.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditEmployee(emp)}
                              className="p-1.5 text-[#C9CDD4] hover:text-[#2B5AED] hover:bg-[#EDF1FE] rounded transition-colors"
                              title="编辑"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1.5 text-[#C9CDD4] hover:text-[#F53F3F] hover:bg-[#FEECEC] rounded transition-colors"
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

      {/* ── DEPARTMENTS TAB ───────────────────────────────── */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateDepartment}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2B5AED] text-white text-sm font-medium rounded-lg hover:bg-[#1F4BD8] transition-colors"
            >
              <Plus size={16} />
              新增部门
            </button>
          </div>

          {deptLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E5E6EB] border-t-[#2B5AED] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E6EB] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] border-b border-[#E5E6EB]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">部门名称</th>
                    <th className="px-4 py-3 text-left font-medium text-[#4E5969]">描述</th>
                    <th className="px-4 py-3 text-center font-medium text-[#4E5969]">人数</th>
                    <th className="px-4 py-3 text-center font-medium text-[#4E5969]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F3F5]">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-[#C9CDD4]">
                        暂无部门数据
                      </td>
                    </tr>
                  ) : (
                    departments.map(dept => (
                      <tr key={dept.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#1D2129]">{dept.name}</td>
                        <td className="px-4 py-3 text-[#4E5969]">{dept.description ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-[#4E5969]">
                          {deptEmployeeCount(dept.id)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleDeleteDepartment(dept.id)}
                              className="p-1.5 text-[#C9CDD4] hover:text-[#F53F3F] hover:bg-[#FEECEC] rounded transition-colors"
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

      {/* ── EMPLOYEE MODAL ────────────────────────────────── */}
      <Modal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editingEmployee ? '编辑员工' : '新增员工'}
        size="lg"
      >
        <div className="space-y-4">
          {empError && (
            <div className="p-3 bg-[#FEECEC] border border-[#FEECEC] rounded-lg text-sm text-[#F53F3F]">
              {empError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">工号</label>
              <input
                type="text"
                value={empForm.employee_id}
                onChange={e => setEmpForm(f => ({ ...f, employee_id: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED]"
                placeholder="EMP001"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">部门</label>
              <select
                value={empForm.department_id ?? ''}
                onChange={e => setEmpForm(f => ({
                  ...f,
                  department_id: e.target.value ? Number(e.target.value) : undefined,
                }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED]"
              >
                <option value="">请选择部门</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* First name */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">名</label>
              <input
                type="text"
                value={empForm.first_name}
                onChange={e => setEmpForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Last name */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">姓</label>
              <input
                type="text"
                value={empForm.last_name}
                onChange={e => setEmpForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">邮箱</label>
              <input
                type="email"
                value={empForm.email ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">电话</label>
              <input
                type="text"
                value={empForm.phone ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">职位</label>
              <input
                type="text"
                value={empForm.position ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, position: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Hire date */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">入职日期</label>
              <input
                type="date"
                value={empForm.hire_date ?? ''}
                onChange={e => setEmpForm(f => ({ ...f, hire_date: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">薪资</label>
              <input
                type="number"
                min="0"
                value={empForm.salary}
                onChange={e => setEmpForm(f => ({ ...f, salary: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">状态</label>
              <select
                value={empForm.status}
                onChange={e => setEmpForm(f => ({
                  ...f,
                  status: e.target.value as Employee['status'],
                }))}
                className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED]"
              >
                <option value="active">在职</option>
                <option value="inactive">非活跃</option>
                <option value="terminated">已离职</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEmpModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#4E5969] bg-[#F2F3F5] rounded-lg hover:bg-[#E5E6EB] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveEmployee}
              disabled={empSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] disabled:opacity-50 transition-colors"
            >
              {empSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── DEPARTMENT MODAL ──────────────────────────────── */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="新增部门"
        size="sm"
      >
        <div className="space-y-4">
          {deptError && (
            <div className="p-3 bg-[#FEECEC] border border-[#FEECEC] rounded-lg text-sm text-[#F53F3F]">
              {deptError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">部门名称</label>
            <input
              type="text"
              value={deptForm.name}
              onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED]"
              placeholder="请输入部门名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">描述</label>
            <textarea
              rows={3}
              value={deptForm.description ?? ''}
              onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] resize-none"
              placeholder="请输入部门描述（可选）"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeptModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#4E5969] bg-[#F2F3F5] rounded-lg hover:bg-[#E5E6EB] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveDepartment}
              disabled={deptSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] disabled:opacity-50 transition-colors"
            >
              {deptSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
