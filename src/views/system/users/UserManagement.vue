<template>
  <div class="user-management">
    <el-card class="user-card">
      <template #header>
        <div class="card-header">
          <h2>用户管理</h2>
          <el-button type="primary" @click="handleAddUser" v-hasPermission="'system:user:add'">
            <el-icon><plus /></el-icon>添加用户
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="queryParams.role" placeholder="选择角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="选择状态" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><refresh-right /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 用户列表 -->
      <el-table 
        v-loading="loading" 
        :data="userList" 
        border 
        stripe 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="role" label="角色" min-width="100" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column prop="lastLoginTime" label="最后登录" min-width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
              {{ row.status === 'normal' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)" v-hasPermission="'system:user:edit'">
              <el-icon><edit /></el-icon>编辑
            </el-button>
            <el-button type="primary" link @click="handleReset(row)" v-hasPermission="'system:user:resetPwd'">
              <el-icon><key /></el-icon>重置密码
            </el-button>
            <el-button 
              :type="row.status === 'normal' ? 'danger' : 'success'" 
              link 
              @click="handleToggleStatus(row)"
              v-hasPermission="'system:user:edit'"
            >
              <el-icon v-if="row.status === 'normal'"><circle-close /></el-icon>
              <el-icon v-else><circle-check /></el-icon>
              {{ row.status === 'normal' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog 
      v-model="dialog.visible" 
      :title="dialog.title" 
      width="500px" 
      :close-on-click-modal="false"
    >
      <el-form 
        ref="userFormRef" 
        :model="userForm" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="dialog.type === 'edit'" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="userForm.roles" multiple placeholder="请选择角色" style="width: 100%">
            <el-option 
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            >
              <div class="role-option">
                <span>{{ role.label }}</span>
                <el-popover
                  placement="right"
                  :width="280"
                  trigger="hover"
                >
                  <template #reference>
                    <el-icon class="role-info-icon"><InfoFilled /></el-icon>
                  </template>
                  <div class="role-info-content">
                    <div class="role-info-item">
                      <span class="role-info-label">权限标识：</span>
                      <span class="role-info-value">{{ role.key }}</span>
                    </div>
                    <div class="role-info-item">
                      <span class="role-info-label">数据范围：</span>
                      <span class="role-info-value">{{ getRoleScopeText(role.scope) }}</span>
                    </div>
                    <div class="role-info-item" v-if="role.menus && role.menus.length > 0">
                      <span class="role-info-label">菜单权限：</span>
                      <div class="role-info-menus">
                        <el-tag v-for="menu in role.menus.slice(0, 3)" :key="menu" type="info" size="small" class="role-menu-tag">
                          {{ menu }}
                        </el-tag>
                        <span v-if="role.menus.length > 3" class="role-more-tag">+{{ role.menus.length - 3 }}</span>
                      </div>
                    </div>
                  </div>
                </el-popover>
              </div>
            </el-option>
          </el-select>
          <div class="form-item-tips" v-if="userForm.roles.length > 0">
            <el-button type="primary" link size="small" @click="handleViewRoles">
              <el-icon><View /></el-icon>查看所选角色权限
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialog.type === 'add'">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="dialog.type === 'add'">
          <el-input v-model="userForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="normal">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="userForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog 
      v-model="resetDialog.visible" 
      title="重置密码" 
      width="400px"
    >
      <el-form 
        ref="resetFormRef" 
        :model="resetForm" 
        :rules="resetRules" 
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetForm.password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" type="password" placeholder="请确认新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitResetForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, RefreshRight, Edit, Key, 
  CircleCheck, CircleClose, InfoFilled, View
} from '@element-plus/icons-vue'
import { hasPermission, hasRole } from '@/utils/permission'

interface User {
  id: number
  username: string
  nickname: string
  role: string
  email: string
  createTime: string
  lastLoginTime: string
  status: string
  remark?: string
}

interface QueryParams {
  pageNum: number
  pageSize: number
  username: string
  role: string
  status: string
}

// 查询参数
const queryParams = reactive<QueryParams>({
  pageNum: 1,
  pageSize: 10,
  username: '',
  role: '',
  status: ''
})

// 表格数据
const loading = ref(false)
const userList = ref<User[]>([])
const total = ref(0)
const selectedRows = ref<User[]>([])

// 获取用户列表
const getUserList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: User[] = [
      {
        id: 1,
        username: 'admin',
        nickname: '系统管理员',
        role: '管理员',
        email: 'admin@example.com',
        createTime: '2023-01-15 10:30:00',
        lastLoginTime: '2023-11-28 15:20:35',
        status: 'normal',
        remark: '超级管理员账号'
      },
      {
        id: 2,
        username: 'operator',
        nickname: '运营人员',
        role: '操作员',
        email: 'operator@example.com',
        createTime: '2023-03-22 14:45:00',
        lastLoginTime: '2023-11-25 09:15:22',
        status: 'normal',
        remark: '内容运营'
      },
      {
        id: 3,
        username: 'test',
        nickname: '测试账号',
        role: '普通用户',
        email: 'test@example.com',
        createTime: '2023-05-18 09:20:00',
        lastLoginTime: '2023-10-10 11:30:45',
        status: 'disabled',
        remark: '测试专用账号'
      }
    ]
    
    userList.value = mockData
    total.value = mockData.length
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1
  getUserList()
}

// 重置查询
const resetQuery = () => {
  queryParams.username = ''
  queryParams.role = ''
  queryParams.status = ''
  handleQuery()
}

// 多选操作
const handleSelectionChange = (selection: User[]) => {
  selectedRows.value = selection
}

// 分页操作
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  getUserList()
}

const handleCurrentChange = (current: number) => {
  queryParams.pageNum = current
  getUserList()
}

// 用户表单对话框
const dialog = reactive({
  visible: false,
  title: '',
  type: 'add' // add 或 edit
})

// 表单对象
const userForm = reactive({
  id: 0,
  username: '',
  nickname: '',
  role: '',
  roles: [] as string[],
  email: '',
  password: '',
  confirmPassword: '',
  status: 'normal',
  remark: ''
})

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const userFormRef = ref()

// 重置表单
const resetUserForm = () => {
  userForm.id = 0
  userForm.username = ''
  userForm.nickname = ''
  userForm.role = ''
  userForm.roles = []
  userForm.email = ''
  userForm.password = ''
  userForm.confirmPassword = ''
  userForm.status = 'normal'
  userForm.remark = ''
  
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

// 添加用户
const handleAddUser = () => {
  dialog.visible = true
  dialog.title = '添加用户'
  dialog.type = 'add'
  resetUserForm()
}

// 编辑用户
const handleEdit = (row: User) => {
  dialog.visible = true
  dialog.title = '编辑用户'
  dialog.type = 'edit'
  resetUserForm()
  
  // 填充表单数据
  userForm.id = row.id
  userForm.username = row.username
  userForm.nickname = row.nickname
  userForm.role = row.role
  userForm.email = row.email
  userForm.status = row.status
  userForm.remark = row.remark || ''
}

// 提交表单
const submitForm = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (dialog.type === 'add') {
          ElMessage.success('添加成功')
        } else {
          ElMessage.success('更新成功')
        }
        
        dialog.visible = false
        getUserList()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

// 重置密码对话框
const resetDialog = reactive({
  visible: false,
  userId: 0,
  username: ''
})

const resetForm = reactive({
  password: '',
  confirmPassword: ''
})

const resetRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== resetForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const resetFormRef = ref()

// 重置密码
const handleReset = (row: User) => {
  resetDialog.visible = true
  resetDialog.userId = row.id
  resetDialog.username = row.username
  resetForm.password = ''
  resetForm.confirmPassword = ''
  
  if (resetFormRef.value) {
    resetFormRef.value.resetFields()
  }
}

// 提交重置密码
const submitResetForm = async () => {
  if (!resetFormRef.value) return
  
  await resetFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success(`用户"${resetDialog.username}"密码重置成功`)
        resetDialog.visible = false
      } catch (error) {
        console.error('重置密码失败:', error)
        ElMessage.error('重置密码失败')
      }
    }
  })
}

// 启用/禁用用户
const handleToggleStatus = (row: User) => {
  const statusText = row.status === 'normal' ? '禁用' : '启用'
  const newStatus = row.status === 'normal' ? 'disabled' : 'normal'
  
  ElMessageBox.confirm(
    `确定要${statusText}用户"${row.username}"吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 直接修改状态（实际应该调用API）
      row.status = newStatus
      
      ElMessage.success(`${statusText}成功`)
    } catch (error) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 角色选项
const roleOptions = ref([
  { 
    label: '超级管理员', 
    value: 'admin',
    key: 'admin',
    scope: '1',
    menus: ['系统管理', '用户管理', '角色管理', '菜单管理', '博客管理', '文章管理', '分类管理']
  },
  { 
    label: '普通角色', 
    value: 'common',
    key: 'common',
    scope: '2',
    menus: ['博客管理', '文章管理', '分类管理']
  },
  { 
    label: '系统维护人员', 
    value: 'maintenance',
    key: 'maintenance',
    scope: '1',
    menus: ['系统管理', '菜单管理', '字典管理']
  }
])

// 获取角色数据范围文本
const getRoleScopeText = (scope: string): string => {
  const scopeMap: Record<string, string> = {
    '1': '全部数据权限',
    '2': '自定数据权限',
    '3': '本部门数据权限',
    '4': '本部门及以下数据权限',
    '5': '仅本人数据权限'
  }
  return scopeMap[scope] || '未知权限范围'
}

// 查看所选角色权限
const handleViewRoles = () => {
  const selectedRoles = roleOptions.value.filter(role => userForm.roles.includes(role.value))
  
  // 构建权限信息
  const roleDetails = selectedRoles.map(role => {
    return `角色：${role.label}\n权限标识：${role.key}\n数据范围：${getRoleScopeText(role.scope)}\n菜单权限：${role.menus.join(', ')}`
  }).join('\n\n')
  
  ElMessageBox.alert(roleDetails, '所选角色权限详情', {
    confirmButtonText: '确定',
    dangerouslyUseHTMLString: false
  })
}

// 组件挂载时获取数据
onMounted(() => {
  getUserList()
})

// 在组件中添加权限检查方法
const checkPermission = (permission: string) => {
  return hasPermission(permission)
}

const checkRole = (role: string) => {
  return hasRole(role)
}
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.user-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-form .el-form-item {
    margin-right: 0;
    width: 100%;
  }
}

.role-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.role-info-icon {
  color: #909399;
  cursor: pointer;
  margin-left: 5px;
}

.role-info-content {
  padding: 5px;
}

.role-info-item {
  margin-bottom: 8px;
}

.role-info-label {
  font-weight: bold;
  margin-right: 5px;
}

.role-info-menus {
  margin-top: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.role-menu-tag {
  margin-right: 5px;
}

.role-more-tag {
  color: #909399;
  font-size: 12px;
}

.form-item-tips {
  margin-top: 5px;
  display: flex;
  justify-content: flex-end;
}
</style>