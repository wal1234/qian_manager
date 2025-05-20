<template>
  <div class="role-list-container">
    <div class="role-header">
      <h2>角色管理</h2>
      <div class="role-actions">
        <el-button type="primary" @click="handleAdd" plain v-hasPermission="'system:role:add'">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button @click="handleRefresh" plain>
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <el-card shadow="hover" class="role-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" class="role-search-form">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="角色状态" clearable>
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 角色列表 -->
      <el-table
        :data="roleList"
        border
        ref="roleTableRef"
        v-loading="loading"
        highlight-current-row
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="roleId" label="角色编号" width="80" />
        <el-table-column prop="roleName" label="角色名称" :show-overflow-tooltip="true" />
        <el-table-column prop="roleKey" label="权限字符" :show-overflow-tooltip="true" />
        <el-table-column prop="roleSort" label="显示顺序" width="80" align="center" />
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" type="success" effect="light">正常</el-tag>
            <el-tag v-else type="danger" effect="light">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="380">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Edit"
              @click="handleUpdate(row)"
              v-hasPermission="'system:role:edit'"
            >
              修改
            </el-button>
            <el-button
              type="warning"
              link
              :icon="Menu"
              @click="handleMenuPermission(row)"
              v-hasPermission="'system:role:edit'"
            >
              菜单权限
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Setting"
              @click="handleDataScope(row)"
              v-hasPermission="'system:role:edit'"
            >
              数据权限
            </el-button>
            <el-button
              type="primary"
              link
              :icon="User"
              @click="handleAuthUser(row)"
              v-hasPermission="'system:role:edit'"
            >
              分配用户
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
              v-hasPermission="'system:role:remove'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
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

    <!-- 添加或修改角色对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="roleFormRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="角色顺序" prop="roleSort">
          <el-input-number v-model="form.roleSort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配角色菜单权限对话框 -->
    <el-dialog
      title="分配菜单权限"
      v-model="menuPermDialog.visible"
      width="680px"
      append-to-body
    >
      <div class="menu-perm-header">
        <div class="menu-perm-role-info">
          <div class="menu-perm-role-name">角色：{{ menuPermDialog.roleName }}</div>
          <div class="menu-perm-role-key">权限字符：{{ menuPermDialog.roleKey }}</div>
        </div>
        <div class="menu-perm-actions">
          <el-button type="primary" link @click="handleExpandAll">
            <el-icon><FullScreen /></el-icon>展开/折叠
          </el-button>
          <el-button type="primary" link @click="handleSelectParentMenus">
            <el-icon><Check /></el-icon>选择上级菜单
          </el-button>
          <el-button type="primary" link @click="toggleMenuCheckAll">
            <el-icon><CircleCheck /></el-icon>{{ checkAllMenus ? '取消全选' : '全选' }}
          </el-button>
        </div>
      </div>
      <div class="menu-tree-container">
        <el-tree
          ref="menuTreeRef"
          :data="menuOptions"
          :props="{ label: 'menuName', children: 'children' }"
          show-checkbox
          node-key="menuId"
          empty-text="加载中，请稍候"
          :highlight-current="true"
          :default-expand-all="isExpandAll"
          @check="handleMenuCheck"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <span class="menu-label">
                <el-icon v-if="data.icon" class="menu-icon">
                  <component :is="data.icon" />
                </el-icon>
                <span>{{ node.label }}</span>
              </span>
              <span class="menu-type-tag">
                <el-tag v-if="data.menuType === 'M'" type="success" size="small" effect="plain">目录</el-tag>
                <el-tag v-else-if="data.menuType === 'C'" type="primary" size="small" effect="plain">菜单</el-tag>
                <el-tag v-else-if="data.menuType === 'F'" type="warning" size="small" effect="plain">按钮</el-tag>
              </span>
            </div>
          </template>
        </el-tree>
        <div class="menu-tree-tips">
          <p>提示：勾选菜单时，会自动选择关联的接口权限</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="menuPermDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitMenuPermission">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配角色数据权限对话框 -->
    <el-dialog
      title="分配数据权限"
      v-model="dataScopeDialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="dataScopeFormRef"
        :model="dataScopeForm"
        label-width="100px"
      >
        <el-form-item label="角色名称">
          <el-input v-model="dataScopeForm.roleName" disabled />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input v-model="dataScopeForm.roleKey" disabled />
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScope">
          <el-select v-model="dataScopeForm.dataScope" placeholder="请选择数据范围" style="width: 100%">
            <el-option label="全部数据权限" value="1" />
            <el-option label="自定数据权限" value="2" />
            <el-option label="本部门数据权限" value="3" />
            <el-option label="本部门及以下数据权限" value="4" />
            <el-option label="仅本人数据权限" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据权限" v-if="dataScopeForm.dataScope === '2'">
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            :props="{ label: 'deptName', children: 'children' }"
            show-checkbox
            node-key="deptId"
            empty-text="加载中，请稍候"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dataScopeDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitDataScope">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配角色用户对话框 -->
    <el-dialog
      title="分配用户"
      v-model="authUserDialog.visible"
      width="800px"
      append-to-body
    >
      <!-- 搜索表单 -->
      <el-form :model="authUserQueryParams" ref="authUserQueryRef" :inline="true">
        <el-form-item label="用户名称" prop="username">
          <el-input v-model="authUserQueryParams.username" placeholder="请输入用户名称" clearable />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="authUserQueryParams.phone" placeholder="请输入手机号码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAuthUserQuery">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetAuthUserQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-tabs v-model="authUserActiveTab">
        <el-tab-pane label="已分配用户" name="assigned">
          <el-table :data="assignedUserList" border v-loading="authUserLoading">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="用户名称" prop="username" :show-overflow-tooltip="true" />
            <el-table-column label="用户昵称" prop="nickname" :show-overflow-tooltip="true" />
            <el-table-column label="邮箱" prop="email" :show-overflow-tooltip="true" />
            <el-table-column label="手机" prop="phone" :show-overflow-tooltip="true" />
            <el-table-column label="状态" align="center" prop="status">
              <template #default="{ row }">
                <el-tag v-if="row.status === '0'" type="success">正常</el-tag>
                <el-tag v-else type="danger">停用</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  link
                  :icon="CircleClose"
                  @click="cancelAuthUser(row)"
                >
                  取消授权
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <Pagination
            v-model:page="authUserQueryParams.pageNum"
            v-model:limit="authUserQueryParams.pageSize"
            :total="authUserTotal"
            @pagination="getAssignedUserList"
          />
        </el-tab-pane>
        
        <el-tab-pane label="未分配用户" name="unassigned">
          <el-table :data="unassignedUserList" border v-loading="authUserLoading">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="用户名称" prop="username" :show-overflow-tooltip="true" />
            <el-table-column label="用户昵称" prop="nickname" :show-overflow-tooltip="true" />
            <el-table-column label="邮箱" prop="email" :show-overflow-tooltip="true" />
            <el-table-column label="手机" prop="phone" :show-overflow-tooltip="true" />
            <el-table-column label="状态" align="center" prop="status">
              <template #default="{ row }">
                <el-tag v-if="row.status === '0'" type="success">正常</el-tag>
                <el-tag v-else type="danger">停用</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  :icon="CircleCheck"
                  @click="selectAuthUser(row)"
                >
                  授权
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <Pagination
            v-model:page="authUserQueryParams.pageNum"
            v-model:limit="authUserQueryParams.pageSize"
            :total="authUserTotal"
            @pagination="getUnassignedUserList"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElTree, ElForm } from 'element-plus'
import { Search, Plus, Edit, Delete, Refresh, Setting, User, CircleCheck, CircleClose, FullScreen, Check, Menu } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import { hasPermission, hasRole } from '@/utils/permission'

interface PaginationData {
  pageNum: number
  pageSize: number
}

interface QueryParams extends PaginationData {
  roleName: string
  roleKey: string
  status: string
}

interface RoleForm {
  roleId?: number
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  remark: string
  menuIds: number[]
}

interface DataScopeForm {
  roleId?: number
  roleName: string
  roleKey: string
  dataScope: string
  deptIds: number[]
}

interface AuthUserQueryParams extends PaginationData {
  roleId?: number
  username: string
  phone: string
}

interface TreeNode {
  id: number
  label: string
  children?: TreeNode[]
}

// 查询参数
const queryParams = ref<QueryParams>({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: ''
})

// 表格数据
const roleList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const roleTableRef = ref()
const queryFormRef = ref()
const roleFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const dataScopeFormRef = ref()
const menuTreeRef = ref<InstanceType<typeof ElTree> | null>(null)
const deptTreeRef = ref<InstanceType<typeof ElTree> | null>(null)

// 选中数组
const ids = ref<number[]>([])
const single = ref(true)
const multiple = ref(true)

// 菜单树选项
const menuOptions = ref<any[]>([])
// 部门树选项
const deptOptions = ref<any[]>([])

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

// 数据权限对话框
const dataScopeDialog = reactive({
  visible: false
})

// 表单对象
const form = ref<RoleForm>({
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: '0',
  remark: '',
  menuIds: []
})

// 数据权限表单
const dataScopeForm = ref<DataScopeForm>({
  roleName: '',
  roleKey: '',
  dataScope: '1',
  deptIds: []
})

// 表单校验规则
const rules = {
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
}

// 授权用户对话框
const authUserDialog = reactive({
  visible: false
})

// 授权用户查询参数
const authUserQueryParams = ref<AuthUserQueryParams>({
  pageNum: 1,
  pageSize: 10,
  roleId: undefined,
  username: '',
  phone: ''
})
const authUserLoading = ref(false)
const authUserTotal = ref(0)
const authUserActiveTab = ref('assigned')
const assignedUserList = ref<any[]>([])
const unassignedUserList = ref<any[]>([])
const authUserQueryRef = ref()

// 树展开状态
const isExpandAll = ref(true)
const checkAllMenus = ref(false)

// 菜单权限对话框
const menuPermDialog = reactive({
  visible: false,
  roleId: 0,
  roleName: '',
  roleKey: ''
})

// 查询角色列表
const handleQuery = () => {
  loading.value = true
  setTimeout(() => {
    // 这里应该是实际API调用获取角色列表
    roleList.value = [
      {
        roleId: 1,
        roleName: '超级管理员',
        roleKey: 'admin',
        roleSort: 1,
        dataScope: '1',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        remark: '超级管理员'
      },
      {
        roleId: 2,
        roleName: '普通角色',
        roleKey: 'common',
        roleSort: 2,
        dataScope: '2',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        remark: '普通角色'
      },
      {
        roleId: 3,
        roleName: '系统维护人员',
        roleKey: 'maintenance',
        roleSort: 3,
        dataScope: '1',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        remark: '系统维护人员'
      }
    ]
    total.value = roleList.value.length
    loading.value = false
  }, 500)
}

// 表格选择事件处理
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.roleId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 重置查询
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.value.pageNum = 1
  handleQuery()
}

// 刷新列表
const handleRefresh = () => {
  handleQuery()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  queryParams.value.pageSize = size
  handleQuery()
}

// 分页页码改变
const handleCurrentChange = (page: number) => {
  queryParams.value.pageNum = page
  handleQuery()
}

// 获取菜单树
const getMenuTree = () => {
  // 这里应该是实际API调用获取菜单树
  menuOptions.value = [
    {
      menuId: 1,
      menuName: '系统管理',
      menuType: 'M',
      icon: 'Setting',
      orderNum: 1,
      perms: '',
      path: '/system',
      component: null,
      children: [
        {
          menuId: 2,
          menuName: '用户管理',
          menuType: 'C',
          icon: 'User',
          orderNum: 1,
          perms: 'system:user:list',
          path: 'users',
          component: 'system/users/UserManagement',
          children: [
            {
              menuId: 6,
              menuName: '用户查询',
              menuType: 'F',
              icon: '',
              orderNum: 1,
              perms: 'system:user:query'
            },
            {
              menuId: 7,
              menuName: '用户新增',
              menuType: 'F',
              icon: '',
              orderNum: 2,
              perms: 'system:user:add'
            }
          ]
        },
        {
          menuId: 3,
          menuName: '角色管理',
          menuType: 'C',
          icon: 'UserFilled',
          orderNum: 2,
          perms: 'system:role:list',
          path: 'roles',
          component: 'system/role/RoleList'
        },
        {
          menuId: 4,
          menuName: '菜单管理',
          menuType: 'C',
          icon: 'Menu',
          orderNum: 3,
          perms: 'system:menu:list',
          path: 'menu',
          component: 'system/menu/MenuList'
        }
      ]
    },
    {
      menuId: 5,
      menuName: '博客管理',
      menuType: 'M',
      icon: 'Document',
      orderNum: 2,
      perms: '',
      path: '/blog',
      component: null,
      children: [
        {
          menuId: 8,
          menuName: '文章管理',
          menuType: 'C',
          icon: 'Document',
          orderNum: 1,
          perms: 'blog:article:list',
          path: 'articles',
          component: 'blog/articles/ArticleList'
        },
        {
          menuId: 9,
          menuName: '分类管理',
          menuType: 'C',
          icon: 'Folder',
          orderNum: 2,
          perms: 'blog:category:list',
          path: 'categories',
          component: 'blog/categories/CategoryList'
        }
      ]
    }
  ]
}

// 获取部门树
const getDeptTree = () => {
  // 这里应该是实际API调用获取部门树
  deptOptions.value = [
    {
      deptId: 1,
      deptName: '总公司',
      children: [
        {
          deptId: 2,
          deptName: '研发部'
        },
        {
          deptId: 3,
          deptName: '市场部'
        },
        {
          deptId: 4,
          deptName: '财务部'
        }
      ]
    }
  ]
}

// 新增按钮操作
const handleAdd = () => {
  dialog.visible = true
  dialog.title = '添加角色'
  form.value = {
    roleName: '',
    roleKey: '',
    roleSort: 0,
    status: '0',
    remark: '',
    menuIds: []
  }
  nextTick(() => {
    roleFormRef.value?.resetFields()
    getMenuTree()
  })
}

// 修改按钮操作
const handleUpdate = (row: any) => {
  dialog.visible = true
  dialog.title = '修改角色'
  form.value = {
    roleId: row.roleId,
    roleName: row.roleName,
    roleKey: row.roleKey,
    roleSort: row.roleSort,
    status: row.status,
    remark: row.remark,
    menuIds: []
  }
  nextTick(() => {
    roleFormRef.value?.resetFields()
    getMenuTree()
    // 这里应该是实际API调用获取角色菜单权限并设置选中状态
    // 模拟选中菜单
    menuTreeRef.value?.setCheckedKeys([2, 3, 6])
  })
}

// 删除按钮操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `是否确认删除角色名称为"${row.roleName}"的数据项?`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该是实际API调用删除角色
    ElMessage.success('删除成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 数据权限按钮操作
const handleDataScope = (row: any) => {
  dataScopeDialog.visible = true
  dataScopeForm.value = {
    roleId: row.roleId,
    roleName: row.roleName,
    roleKey: row.roleKey,
    dataScope: row.dataScope || '1',
    deptIds: []
  }
  nextTick(() => {
    getDeptTree()
    // 这里应该是实际API调用获取角色部门权限并设置选中状态
    // 模拟选中部门
    if (dataScopeForm.value.dataScope === '2') {
      deptTreeRef.value?.setCheckedKeys([2, 3])
    }
  })
}

// 提交表单
const submitForm = () => {
  roleFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 获取选中的菜单ID
      const checkedKeys = menuTreeRef.value?.getCheckedKeys(false) || []
      const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || []
      form.value.menuIds = [...checkedKeys, ...halfCheckedKeys] as number[]

      // 这里应该是实际API调用保存角色
      ElMessage.success(form.value.roleId ? '修改成功' : '新增成功')
      dialog.visible = false
      handleQuery()
    }
  })
}

// 提交数据权限
const submitDataScope = () => {
  if (dataScopeForm.value.dataScope === '2') {
    // 获取选中的部门ID
    const checkedKeys = deptTreeRef.value?.getCheckedKeys(false) || []
    const halfCheckedKeys = deptTreeRef.value?.getHalfCheckedKeys() || []
    dataScopeForm.value.deptIds = [...checkedKeys, ...halfCheckedKeys] as number[]
  } else {
    dataScopeForm.value.deptIds = []
  }

  // 这里应该是实际API调用保存数据权限
  ElMessage.success('设置成功')
  dataScopeDialog.visible = false
}

// 分配用户按钮操作
const handleAuthUser = (row: any) => {
  authUserDialog.visible = true
  authUserQueryParams.value.roleId = row.roleId
  authUserActiveTab.value = 'assigned'
  getAssignedUserList()
}

// 获取已分配用户列表
const getAssignedUserList = () => {
  authUserLoading.value = true
  // 这里应该是实际API调用获取已分配用户列表
  setTimeout(() => {
    assignedUserList.value = [
      {
        userId: 1,
        username: 'admin',
        nickname: '超级管理员',
        email: 'admin@example.com',
        phone: '13800000000',
        status: '0',
        createTime: '2023-01-01 00:00:00'
      },
      {
        userId: 2,
        username: 'test',
        nickname: '测试用户',
        email: 'test@example.com',
        phone: '13900000000',
        status: '0',
        createTime: '2023-01-02 00:00:00'
      }
    ]
    authUserTotal.value = assignedUserList.value.length
    authUserLoading.value = false
  }, 500)
}

// 获取未分配用户列表
const getUnassignedUserList = () => {
  authUserLoading.value = true
  // 这里应该是实际API调用获取未分配用户列表
  setTimeout(() => {
    unassignedUserList.value = [
      {
        userId: 3,
        username: 'editor',
        nickname: '编辑人员',
        email: 'editor@example.com',
        phone: '13700000000',
        status: '0',
        createTime: '2023-01-03 00:00:00'
      },
      {
        userId: 4,
        username: 'visitor',
        nickname: '访客',
        email: 'visitor@example.com',
        phone: '13600000000',
        status: '0',
        createTime: '2023-01-04 00:00:00'
      }
    ]
    authUserTotal.value = unassignedUserList.value.length
    authUserLoading.value = false
  }, 500)
}

// 搜索授权用户
const handleAuthUserQuery = () => {
  if (authUserActiveTab.value === 'assigned') {
    getAssignedUserList()
  } else {
    getUnassignedUserList()
  }
}

// 重置授权用户搜索
const resetAuthUserQuery = () => {
  authUserQueryRef.value?.resetFields()
  handleAuthUserQuery()
}

// 取消授权用户
const cancelAuthUser = (row: any) => {
  // 这里应该是实际API调用取消授权
  ElMessage.success(`取消授权成功: ${row.username}`)
  getAssignedUserList()
}

// 选择授权用户
const selectAuthUser = (row: any) => {
  // 这里应该是实际API调用授权用户
  ElMessage.success(`授权成功: ${row.username}`)
  getUnassignedUserList()
  getAssignedUserList()
}

// 展开/折叠全部
const handleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value
}

// 全选/全不选
const handleCheckAllMenusChange = (val: boolean) => {
  if (val) {
    const allKeys = getAllMenuIds(menuOptions.value)
    menuTreeRef.value?.setCheckedKeys(allKeys)
  } else {
    menuTreeRef.value?.setCheckedKeys([])
  }
}

// 获取所有菜单ID
const getAllMenuIds = (menus: any[]): number[] => {
  let ids: number[] = []
  menus.forEach(menu => {
    ids.push(menu.menuId)
    if (menu.children && menu.children.length > 0) {
      ids = ids.concat(getAllMenuIds(menu.children))
    }
  })
  return ids
}

// 选择上级菜单
const handleSelectParentMenus = () => {
  // 获取当前选中的菜单ID
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() || []
  
  // 找到所有选中菜单的父级菜单
  const parentKeys = getParentMenuIds(menuOptions.value, checkedKeys)
  
  // 设置选中状态，合并已选ID和父级ID
  const allKeys = [...new Set([...checkedKeys, ...parentKeys])]
  menuTreeRef.value?.setCheckedKeys(allKeys)
}

// 获取父级菜单ID
const getParentMenuIds = (menus: any[], checkedKeys: number[]): number[] => {
  const parentIds: number[] = []
  
  const findParents = (items: any[], parentId?: number) => {
    items.forEach(item => {
      if (parentId) {
        // 如果子节点被选中，则添加父节点ID
        if (item.children && item.children.some((child: any) => checkedKeys.includes(child.menuId))) {
          parentIds.push(item.menuId)
        }
      }
      if (item.children && item.children.length > 0) {
        findParents(item.children, item.menuId)
      }
    })
  }
  
  findParents(menus)
  return parentIds
}

// 菜单选择处理
const handleMenuCheck = (node: any, checkedStatus: any) => {
  const { checkedKeys, checkedNodes } = checkedStatus
  
  // 如果选中了所有菜单，则更新全选状态
  const allMenuCount = getAllMenuIds(menuOptions.value).length
  checkAllMenus.value = (checkedKeys as number[]).length === allMenuCount
}

// 添加权限检查方法
const checkPermission = (permission: string) => {
  return hasPermission(permission)
}

// 处理菜单权限
const handleMenuPermission = (row: any) => {
  menuPermDialog.visible = true
  menuPermDialog.roleId = row.roleId
  menuPermDialog.roleName = row.roleName
  menuPermDialog.roleKey = row.roleKey
  
  getMenuTree()
  
  // 延迟设置选中的菜单，确保树已经渲染
  nextTick(() => {
    // 这里应该是实际API调用获取角色已有的菜单权限
    // 模拟获取角色菜单权限
    let checkedKeys: number[] = []
    
    switch(row.roleKey) {
      case 'admin':
        // 超级管理员有全部权限
        checkedKeys = getAllMenuIds(menuOptions.value)
        break
      case 'common':
        // 普通角色只有博客管理权限
        checkedKeys = [5, 8, 9]
        break
      case 'maintenance':
        // 系统维护人员有系统和菜单管理权限
        checkedKeys = [1, 4]
        break
      default:
        checkedKeys = []
    }
    
    menuTreeRef.value?.setCheckedKeys(checkedKeys)
    
    // 更新全选状态
    const allMenuCount = getAllMenuIds(menuOptions.value).length
    checkAllMenus.value = checkedKeys.length === allMenuCount
  })
}

// 提交菜单权限
const submitMenuPermission = () => {
  // 获取选中的菜单ID
  const checkedKeys = menuTreeRef.value?.getCheckedKeys(false) || []
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || []
  const menuIds = [...checkedKeys, ...halfCheckedKeys] as number[]

  // 这里应该是实际API调用保存角色菜单权限
  ElMessage.success('菜单权限设置成功')
  menuPermDialog.visible = false
  
  // 更新本地数据（实际应该从后端获取）
  const role = roleList.value.find(r => r.roleId === menuPermDialog.roleId)
  if (role) {
    role.menuIds = menuIds
  }
}

// 全选/取消全选菜单
const toggleMenuCheckAll = () => {
  if (checkAllMenus.value) {
    // 取消全选
    menuTreeRef.value?.setCheckedKeys([])
    checkAllMenus.value = false
  } else {
    // 全选
    const allMenuIds = getAllMenuIds(menuOptions.value)
    menuTreeRef.value?.setCheckedKeys(allMenuIds)
    checkAllMenus.value = true
  }
}

// 页面初始化
onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.role-list-container {
  padding: 20px;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.role-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.role-actions {
  display: flex;
  gap: 10px;
}

.role-card {
  margin-bottom: 20px;
}

.role-search-form {
  margin-bottom: 20px;
  padding: 18px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 15px;
  text-align: right;
}

.menu-perm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.menu-perm-role-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-perm-role-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.menu-perm-role-key {
  font-size: 14px;
  color: #606266;
}

.menu-perm-actions {
  display: flex;
  gap: 15px;
}

.menu-tree-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.menu-tree-tips {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  color: #909399;
  font-size: 12px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.menu-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.menu-icon {
  font-size: 16px;
  color: #409EFF;
}

.menu-type-tag {
  margin-left: 8px;
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
}
</style> 