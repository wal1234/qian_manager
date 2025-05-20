<template>
  <div class="menu-list-container">
    <div class="menu-header">
      <h2>菜单管理</h2>
      <div class="menu-actions">
        <el-button type="primary" @click="handleAdd" plain>
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button type="success" @click="handleExpandAll" plain>
          <el-icon><FullScreen /></el-icon>展开/折叠
        </el-button>
        <el-button @click="handleRefresh" plain>
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <el-card shadow="hover" class="menu-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" class="menu-search-form">
        <el-form-item label="菜单名称" prop="menuName">
          <el-input 
            v-model="queryParams.menuName" 
            placeholder="请输入菜单名称" 
            clearable
            prefix-icon="Search"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="菜单状态" clearable>
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

      <!-- 菜单表格 -->
      <el-table
        :data="menuList"
        row-key="menuId"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children' }"
        border
        ref="menuTableRef"
        v-loading="loading"
        highlight-current-row
        class="menu-table"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="180">
          <template #default="{ row }">
            <span class="menu-name" :style="{ 'padding-left': row.level ? `${row.level * 16}px` : '0' }">
              <el-tag v-if="row.menuType === 'M'" type="success" effect="plain" class="menu-type-tag">目录</el-tag>
              <el-tag v-else-if="row.menuType === 'C'" type="primary" effect="plain" class="menu-type-tag">菜单</el-tag>
              <el-tag v-else-if="row.menuType === 'F'" type="warning" effect="plain" class="menu-type-tag">按钮</el-tag>
              <el-icon v-if="row.icon" class="menu-icon">
                <component :is="row.icon" />
              </el-icon>
              <span class="menu-text" :class="{ 'is-bold': row.menuType === 'M' }">{{ row.menuName }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" align="center" width="80">
          <template #default="{ row }">
            <el-popover
              v-if="row.icon"
              placement="right"
              trigger="hover"
              width="200"
            >
              <template #reference>
                <el-icon class="menu-icon-large">
                  <component :is="row.icon" />
                </el-icon>
              </template>
              <div class="icon-preview">
                <el-icon class="icon-preview-item">
                  <component :is="row.icon" />
                </el-icon>
                <div class="icon-name">{{ row.icon }}</div>
              </div>
            </el-popover>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="80" align="center" />
        <el-table-column prop="perms" label="权限标识" min-width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <el-tag v-if="row.perms" type="info" effect="plain" class="perm-tag">{{ row.perms }}</el-tag>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由地址" min-width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <el-popover
              v-if="row.path"
              placement="top"
              trigger="hover"
              :content="row.path"
              width="auto"
            >
              <template #reference>
                <el-tag type="success" effect="plain" class="path-tag">{{ row.path }}</el-tag>
              </template>
            </el-popover>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" min-width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <el-popover
              v-if="row.component"
              placement="top"
              trigger="hover"
              :content="row.component"
              width="auto"
            >
              <template #reference>
                <el-tag type="warning" effect="plain" class="component-tag">{{ row.component }}</el-tag>
              </template>
            </el-popover>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="menuType" label="类型" align="center" width="100">
          <template #default="{ row }">
            <div class="menu-type-wrapper">
              <el-tag v-if="row.menuType === 'M'" type="success" effect="dark" round>目录</el-tag>
              <el-tag v-else-if="row.menuType === 'C'" type="primary" effect="dark" round>菜单</el-tag>
              <el-tag v-else-if="row.menuType === 'F'" type="warning" effect="dark" round>按钮</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="{ row }">
            <div class="status-wrapper">
              <el-switch
                v-model="row.statusBool"
                :active-value="true"
                :inactive-value="false"
                @change="handleStatusChange(row)"
                :disabled="!checkPermission('system:menu:edit')"
              />
              <el-tag 
                :type="row.status === '0' ? 'success' : 'danger'" 
                effect="light" 
                size="small"
                class="status-tag"
              >
                {{ row.status === '0' ? '正常' : '停用' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" align="center" width="320" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Edit"
              @click="handleUpdate(row)"
              v-if="row.menuType !== 'F'"
              v-hasPermission="'system:menu:edit'"
            >
              修改
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Plus"
              @click="handleAdd(row)"
              v-if="row.menuType !== 'F'"
              v-hasPermission="'system:menu:add'"
            >
              新增
            </el-button>
            <el-popover
              placement="left"
              :width="300"
              trigger="hover"
              v-if="roleUsingMenus.get(row.menuId) && roleUsingMenus.get(row.menuId)!.length > 0"
            >
              <template #reference>
                <el-button type="info" link :icon="InfoFilled">权限信息</el-button>
              </template>
              <div class="menu-roles-info">
                <div class="menu-roles-title">使用此菜单的角色：</div>
                <div class="menu-roles-list">
                  <el-tag 
                    v-for="role in roleUsingMenus.get(row.menuId)" 
                    :key="role" 
                    size="small" 
                    class="menu-role-tag"
                    effect="plain"
                  >
                    {{ role }}
                  </el-tag>
                </div>
              </div>
            </el-popover>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
              v-hasPermission="'system:menu:remove'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加或修改菜单对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="680px"
      append-to-body
    >
      <el-form
        ref="menuFormRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ label: 'menuName', value: 'menuId' }"
            placeholder="选择上级菜单"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio label="M">目录</el-radio>
            <el-radio label="C">菜单</el-radio>
            <el-radio label="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="form.menuType !== 'F'"
          label="菜单图标"
          prop="icon"
        >
          <el-input v-model="form.icon" placeholder="请输入菜单图标" />
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item
          v-if="form.menuType !== 'F'"
          label="路由地址"
          prop="path"
        >
          <el-input v-model="form.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item
          v-if="form.menuType === 'C'"
          label="组件路径"
          prop="component"
        >
          <el-input v-model="form.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item
          v-if="form.menuType === 'C'"
          label="路由参数"
          prop="query"
        >
          <el-input v-model="form.query" placeholder="请输入路由参数" />
        </el-form-item>
        <el-form-item
          v-if="form.menuType !== 'M'"
          label="权限标识"
          prop="perms"
        >
          <el-input v-model="form.perms" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item
          v-if="form.menuType !== 'F'"
          label="菜单状态"
        >
          <el-radio-group v-model="form.status">
            <el-radio label="0">显示</el-radio>
            <el-radio label="1">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, toRefs } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Refresh, FullScreen, InfoFilled } from '@element-plus/icons-vue'
import { hasPermission, hasRole } from '@/utils/permission'

// 查询参数
const queryParams = ref({
  menuName: '',
  status: ''
})

// 表格数据
const menuList = ref<any[]>([])
const loading = ref(false)
const isExpandAll = ref(true)
const menuTableRef = ref()
const queryFormRef = ref()
const menuFormRef = ref()

// 菜单选项
const menuOptions = ref<any[]>([])

// 角色使用菜单标识
const roleUsingMenus = ref<Map<number, string[]>>(new Map())

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单对象
const form = ref<any>({
  menuId: undefined,
  parentId: 0,
  menuName: '',
  icon: '',
  menuType: 'M',
  orderNum: 0,
  path: '',
  component: '',
  query: '',
  perms: '',
  status: '0',
  visible: '0',
  isCache: '0',
  isFrame: '1'
})

// 表单校验规则
const rules = {
  menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  orderNum: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }]
}

// 菜单树选项
const handleQuery = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    // 这里应该是实际API调用获取菜单列表
    const rawMenuList = [
      {
        menuId: 1,
        menuName: '系统管理',
        icon: 'Setting',
        orderNum: 1,
        perms: '',
        path: '/system',
        component: null,
        menuType: 'M',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        children: [
          {
            menuId: 2,
            menuName: '用户管理',
            icon: 'User',
            orderNum: 1,
            perms: 'system:user:list',
            path: 'users',
            component: 'system/users/UserManagement',
            menuType: 'C',
            status: '0',
            createTime: '2023-01-01 00:00:00',
            children: [
              {
                menuId: 6,
                menuName: '用户查询',
                icon: '',
                orderNum: 1,
                perms: 'system:user:query',
                path: '',
                component: '',
                menuType: 'F',
                status: '0',
                createTime: '2023-01-01 00:00:00'
              },
              {
                menuId: 7,
                menuName: '用户新增',
                icon: '',
                orderNum: 2,
                perms: 'system:user:add',
                path: '',
                component: '',
                menuType: 'F',
                status: '0',
                createTime: '2023-01-01 00:00:00'
              }
            ]
          },
          {
            menuId: 3,
            menuName: '菜单管理',
            icon: 'Menu',
            orderNum: 2,
            perms: 'system:menu:list',
            path: 'menu',
            component: 'system/menu/MenuList',
            menuType: 'C',
            status: '0',
            createTime: '2023-01-01 00:00:00'
          }
        ]
      }
    ]
    
    // 处理菜单列表，添加层级标记
    const processMenus = (menus: any[], level = 0) => {
      return menus.map(menu => {
        menu.level = level
        menu.statusBool = menu.status === '0'
        if (menu.children && menu.children.length > 0) {
          menu.children = processMenus(menu.children, level + 1)
        }
        return menu
      })
    }
    
    menuList.value = processMenus(rawMenuList)
    loading.value = false
  }, 500)
}

// 重置查询
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

// 展开/折叠操作
const handleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value
}

// 刷新列表
const handleRefresh = () => {
  handleQuery()
}

// 新增按钮操作
const handleAdd = (row?: any) => {
  dialog.visible = true
  dialog.title = '添加菜单'
  form.value = {
    menuId: undefined,
    parentId: row?.menuId || 0,
    menuName: '',
    icon: '',
    menuType: 'M',
    orderNum: 0,
    path: '',
    component: '',
    query: '',
    perms: '',
    status: '0',
    visible: '0',
    isCache: '0',
    isFrame: '1'
  }
  // 获取菜单下拉树列表
  getMenuTreeselect()
}

// 修改按钮操作
const handleUpdate = (row: any) => {
  dialog.visible = true
  dialog.title = '修改菜单'
  form.value = JSON.parse(JSON.stringify(row))
  // 获取菜单下拉树列表
  getMenuTreeselect()
}

// 删除按钮操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `是否确认删除菜单名称为"${row.menuName}"的数据项?`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该是实际API调用删除菜单
    ElMessage.success('删除成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 获取菜单下拉树列表
const getMenuTreeselect = () => {
  // 这里应该是实际API调用获取菜单树
  menuOptions.value = JSON.parse(JSON.stringify(menuList.value))
}

// 提交表单
const submitForm = () => {
  menuFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 这里应该是实际API调用保存菜单
      ElMessage.success(form.value.menuId ? '修改成功' : '新增成功')
      dialog.visible = false
      handleQuery()
    }
  })
}

// 查询角色使用菜单
const getRoleUsingMenus = () => {
  // 模拟API调用，获取哪些角色使用了菜单
  setTimeout(() => {
    const roleMenuMap = new Map<number, string[]>()
    roleMenuMap.set(1, ['超级管理员'])
    roleMenuMap.set(2, ['超级管理员', '普通角色'])
    roleMenuMap.set(3, ['超级管理员', '系统维护人员'])
    roleMenuMap.set(4, ['超级管理员', '普通角色'])
    roleMenuMap.set(5, ['超级管理员'])
    roleMenuMap.set(6, ['超级管理员', '普通角色'])
    roleMenuMap.set(7, ['超级管理员', '系统维护人员'])
    roleUsingMenus.value = roleMenuMap
  }, 500)
}

// 获取菜单类型文本
const getMenuTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'M': '目录',
    'C': '菜单',
    'F': '按钮'
  }
  return typeMap[type] || '未知类型'
}

// 添加权限检查方法
const checkPermission = (permission: string) => {
  return hasPermission(permission)
}

// 切换菜单状态
const handleStatusChange = (row: any) => {
  // 状态值更新
  row.status = row.statusBool ? '0' : '1'
  
  // 这里应该是实际API调用更新菜单状态
  ElMessage.success(`菜单【${row.menuName}】状态修改成功`)
}

// 页面初始化
onMounted(() => {
  handleQuery()
  getRoleUsingMenus()
})
</script>

<style scoped>
.menu-list-container {
  padding: 20px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.menu-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.menu-actions {
  display: flex;
  gap: 10px;
}

.menu-card {
  margin-bottom: 20px;
}

.menu-search-form {
  margin-bottom: 20px;
  padding: 18px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.menu-table {
  margin-top: 15px;
}

.menu-name {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  position: relative;
}

.menu-type-tag {
  min-width: 42px;
  text-align: center;
  margin-right: 4px;
}

.menu-icon {
  font-size: 16px;
  color: #409EFF;
}

.menu-text {
  font-size: 14px;
  color: #606266;
}

.menu-text.is-bold {
  font-weight: bold;
  color: #303133;
}

.menu-icon-large {
  font-size: 20px;
  color: #409EFF;
  cursor: pointer;
}

.menu-roles-info {
  padding: 10px;
}

.menu-roles-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.menu-roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.menu-role-tag {
  margin: 0;
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
}

.icon-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.icon-preview-item {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 10px;
}

.icon-name {
  font-size: 14px;
  color: #606266;
  word-break: break-all;
  text-align: center;
}

.perm-tag, .path-tag, .component-tag {
  cursor: pointer;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-data {
  color: #c0c4cc;
  font-style: italic;
}

.menu-type-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.status-tag {
  margin-top: 3px;
}
</style> 