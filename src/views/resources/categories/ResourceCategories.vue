<template>
  <div class="category-container">
    <div class="category-header">
      <h2>资源分类管理</h2>
      <el-button type="primary" @click="handleAddCategory">
        <el-icon><Plus /></el-icon>添加分类
      </el-button>
    </div>

    <div class="category-content">
      <el-row :gutter="20">
        <!-- 分类树结构 -->
        <el-col :span="8">
          <el-card class="tree-card">
            <template #header>
              <div class="card-header">
                <span>分类层级</span>
                <div class="header-actions">
                  <el-tooltip content="刷新" placement="top">
                    <el-button link @click="loadCategories">
                      <el-icon><Refresh /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="展开全部" placement="top">
                    <el-button link @click="expandAll">
                      <el-icon><Expand /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="收起全部" placement="top">
                    <el-button link @click="collapseAll">
                      <el-icon><Fold /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </template>
            <div v-loading="loading" class="tree-wrapper">
              <el-tree
                ref="treeRef"
                :data="categoryTree"
                node-key="id"
                :props="defaultProps"
                :expand-on-click-node="false"
                highlight-current
                @node-click="handleNodeClick"
                draggable
                @node-drop="handleDrop"
              >
                <template #default="{ node, data }">
                  <div class="custom-tree-node">
                    <div class="node-label">
                      <el-icon v-if="data.children && data.children.length">
                        <Folder />
                      </el-icon>
                      <el-icon v-else>
                        <Document />
                      </el-icon>
                      <span class="label-text">{{ node.label }}</span>
                      <el-tag v-if="data.count" size="small" type="info" class="count-tag">
                        {{ data.count }}
                      </el-tag>
                    </div>
                    <div class="node-actions">
                      <el-tooltip content="添加子分类" placement="top">
                        <el-button link @click.stop="handleAddSubCategory(data)">
                          <el-icon><CirclePlus /></el-icon>
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="编辑" placement="top">
                        <el-button link @click.stop="handleEditCategory(data)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="删除" placement="top">
                        <el-button link @click.stop="handleDeleteCategory(data)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </template>
              </el-tree>
              <div v-if="categoryTree.length === 0" class="empty-tree">
                <el-empty description="暂无分类数据" />
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 分类详情/编辑区域 -->
        <el-col :span="16">
          <el-card class="detail-card" v-loading="detailLoading">
            <template #header>
              <div class="card-header">
                <span>{{ currentCategory ? '分类详情' : '分类信息' }}</span>
                <div class="header-actions">
                  <el-button v-if="currentCategory && !isEditing" type="primary" @click="startEditing">
                    <el-icon><Edit /></el-icon>编辑
                  </el-button>
                </div>
              </div>
            </template>

            <div v-if="!currentCategory && !isEditing" class="empty-detail">
              <el-empty description="请从左侧选择一个分类或点击添加分类按钮" />
            </div>

            <el-form
              v-else
              ref="formRef"
              :model="categoryForm"
              :rules="categoryRules"
              label-width="100px"
              class="category-form"
              :disabled="!isEditing && currentCategory"
            >
              <el-form-item label="分类名称" prop="name">
                <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
              </el-form-item>
              <el-form-item label="上级分类" prop="parentId">
                <el-cascader
                  v-model="categoryForm.parentId"
                  :options="categoryOptions"
                  :props="cascaderProps"
                  placeholder="请选择上级分类"
                  clearable
                  filterable
                  :disabled="isAddingSub"
                />
              </el-form-item>
              <el-form-item label="分类描述" prop="description">
                <el-input
                  v-model="categoryForm.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入分类描述"
                />
              </el-form-item>
              <el-form-item label="排序" prop="sort">
                <el-input-number v-model="categoryForm.sort" :min="0" :max="999" />
              </el-form-item>
              <el-form-item label="图标" prop="icon">
                <el-select v-model="categoryForm.icon" placeholder="请选择图标" clearable>
                  <el-option label="文件夹" value="Folder" />
                  <el-option label="文档" value="Document" />
                  <el-option label="图片" value="Picture" />
                  <el-option label="视频" value="VideoCamera" />
                  <el-option label="音频" value="Headset" />
                  <el-option label="压缩包" value="Files" />
                  <el-option label="代码" value="Connection" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="categoryForm.status">
                  <el-radio :label="1">启用</el-radio>
                  <el-radio :label="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="isEditing || !currentCategory">
                <el-button type="primary" @click="submitForm">保存</el-button>
                <el-button @click="cancelEdit">取消</el-button>
              </el-form-item>
            </el-form>

            <div v-if="currentCategory && !isEditing" class="category-stats">
              <h3>资源统计</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-label">资源总数</div>
                  <div class="stat-value">{{ currentCategory.count || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">图片</div>
                  <div class="stat-value">{{ currentCategory.imageCount || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">文档</div>
                  <div class="stat-value">{{ currentCategory.documentCount || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">视频</div>
                  <div class="stat-value">{{ currentCategory.videoCount || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">音频</div>
                  <div class="stat-value">{{ currentCategory.audioCount || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">其他</div>
                  <div class="stat-value">{{ currentCategory.otherCount || 0 }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
      center
    >
      <div class="delete-confirm">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>确定要删除分类"{{ categoryToDelete?.name }}"吗？</p>
        <p v-if="categoryToDelete?.children?.length > 0" class="warning-text">该分类包含子分类，删除后子分类将一并删除！</p>
        <p v-if="categoryToDelete?.count > 0" class="warning-text">该分类包含{{ categoryToDelete.count }}个资源，删除后这些资源将被移至默认分类！</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Edit, Delete, Refresh, Document, Folder, 
  CirclePlus, Expand, Fold, Picture, VideoCamera, 
  Headset, Files, Connection, WarningFilled 
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 分类数据接口
interface Category {
  id: number
  name: string
  parentId: number | null
  path?: string
  level?: number
  description?: string
  icon?: string
  sort: number
  status: 0 | 1
  count?: number
  imageCount?: number
  documentCount?: number
  videoCount?: number
  audioCount?: number
  otherCount?: number
  children?: Category[]
}

// 表单数据
const categoryForm = reactive<Omit<Category, 'id' | 'children'>>({
  name: '',
  parentId: null,
  description: '',
  icon: '',
  sort: 0,
  status: 1
})

// 表单校验规则
const categoryRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
})

// 树组件属性
const defaultProps = {
  children: 'children',
  label: 'name'
}

// 级联选择器属性
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false
}

// 响应式数据
const loading = ref(false)
const detailLoading = ref(false)
const isEditing = ref(false)
const isAddingSub = ref(false)
const deleteDialogVisible = ref(false)
const categoryTree = ref<Category[]>([])
const currentCategory = ref<Category | null>(null)
const categoryToDelete = ref<Category | null>(null)
const formRef = ref<FormInstance>()
const treeRef = ref<any>()

// 级联选择器选项
const categoryOptions = computed(() => {
  // 创建一个深拷贝避免修改原始数据
  const copyTree = JSON.parse(JSON.stringify(categoryTree.value))
  
  // 如果是编辑状态且当前选中了分类，需要过滤掉不能选择的节点
  if (currentCategory.value && isEditing.value) {
    // 移除当前节点及其子节点，避免选择自己作为父节点
    return filterCategories(copyTree, currentCategory.value.id)
  }
  
  return copyTree
})

// 过滤掉指定ID及其子节点
const filterCategories = (categories: Category[], excludeId: number): Category[] => {
  return categories.filter(category => {
    if (category.id === excludeId) return false
    
    if (category.children && category.children.length > 0) {
      category.children = filterCategories(category.children, excludeId)
    }
    
    return true
  })
}

// 加载分类数据
const loadCategories = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    const mockCategories: Category[] = [
      {
        id: 1,
        name: '图片资源',
        parentId: null,
        description: '包含各种图片素材',
        icon: 'Picture',
        sort: 1,
        status: 1,
        count: 128,
        imageCount: 128,
        children: [
          {
            id: 4,
            name: '背景图片',
            parentId: 1,
            description: '各种背景图片素材',
            icon: 'Picture',
            sort: 1,
            status: 1,
            count: 56,
            imageCount: 56
          },
          {
            id: 5,
            name: '图标素材',
            parentId: 1,
            description: '各种图标素材',
            icon: 'Picture',
            sort: 2,
            status: 1,
            count: 72,
            imageCount: 72,
            children: [
              {
                id: 9,
                name: '彩色图标',
                parentId: 5,
                description: '彩色图标素材',
                icon: 'Picture',
                sort: 1,
                status: 1,
                count: 32,
                imageCount: 32
              },
              {
                id: 10,
                name: '线性图标',
                parentId: 5,
                description: '线性图标素材',
                icon: 'Picture',
                sort: 2,
                status: 1,
                count: 40,
                imageCount: 40
              }
            ]
          }
        ]
      },
      {
        id: 2,
        name: '文档资源',
        parentId: null,
        description: '包含各种文档资源',
        icon: 'Document',
        sort: 2,
        status: 1,
        count: 85,
        documentCount: 85,
        children: [
          {
            id: 6,
            name: '技术文档',
            parentId: 2,
            description: '技术相关文档',
            icon: 'Document',
            sort: 1,
            status: 1,
            count: 45,
            documentCount: 45
          },
          {
            id: 7,
            name: '设计文档',
            parentId: 2,
            description: '设计相关文档',
            icon: 'Document',
            sort: 2,
            status: 1,
            count: 40,
            documentCount: 40
          }
        ]
      },
      {
        id: 3,
        name: '视频资源',
        parentId: null,
        description: '包含各种视频资源',
        icon: 'VideoCamera',
        sort: 3,
        status: 1,
        count: 36,
        videoCount: 36,
        children: [
          {
            id: 8,
            name: '教学视频',
            parentId: 3,
            description: '教学相关视频',
            icon: 'VideoCamera',
            sort: 1,
            status: 1,
            count: 36,
            videoCount: 36
          }
        ]
      }
    ]
    
    categoryTree.value = mockCategories
  } catch (error) {
    console.error('加载分类数据失败:', error)
    ElMessage.error('加载分类数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 展开全部节点
const expandAll = () => {
  treeRef.value?.expandAll()
}

// 收起全部节点
const collapseAll = () => {
  treeRef.value?.collapseAll()
}

// 点击节点
const handleNodeClick = (data: Category) => {
  if (isEditing.value) {
    ElMessageBox.confirm(
      '正在编辑中，是否放弃当前编辑?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      isEditing.value = false
      isAddingSub.value = false
      showCategoryDetail(data)
    }).catch(() => {})
    return
  }
  
  showCategoryDetail(data)
}

// 显示分类详情
const showCategoryDetail = async (data: Category) => {
  detailLoading.value = true
  currentCategory.value = null
  
  try {
    // 模拟API请求获取详情
    await new Promise(resolve => setTimeout(resolve, 500))
    currentCategory.value = data
    
    // 重置表单
    categoryForm.name = data.name
    categoryForm.parentId = data.parentId
    categoryForm.description = data.description || ''
    categoryForm.icon = data.icon || ''
    categoryForm.sort = data.sort
    categoryForm.status = data.status
  } catch (error) {
    console.error('获取分类详情失败:', error)
    ElMessage.error('获取分类详情失败，请稍后重试')
  } finally {
    detailLoading.value = false
  }
}

// 开始编辑
const startEditing = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  if (currentCategory.value) {
    // 恢复原始数据
    categoryForm.name = currentCategory.value.name
    categoryForm.parentId = currentCategory.value.parentId
    categoryForm.description = currentCategory.value.description || ''
    categoryForm.icon = currentCategory.value.icon || ''
    categoryForm.sort = currentCategory.value.sort
    categoryForm.status = currentCategory.value.status
  } else {
    // 重置表单
    resetForm()
  }
  
  isEditing.value = false
  isAddingSub.value = false
  
  if (!currentCategory.value) {
    currentCategory.value = null
  }
}

// 重置表单
const resetForm = () => {
  categoryForm.name = ''
  categoryForm.parentId = null
  categoryForm.description = ''
  categoryForm.icon = ''
  categoryForm.sort = 0
  categoryForm.status = 1
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 添加分类
const handleAddCategory = () => {
  if (isEditing.value) {
    ElMessageBox.confirm(
      '正在编辑中，是否放弃当前编辑?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      resetForm()
      currentCategory.value = null
      isEditing.value = true
      isAddingSub.value = false
    }).catch(() => {})
    return
  }
  
  resetForm()
  currentCategory.value = null
  isEditing.value = true
  isAddingSub.value = false
}

// 添加子分类
const handleAddSubCategory = (data: Category) => {
  if (isEditing.value) {
    ElMessageBox.confirm(
      '正在编辑中，是否放弃当前编辑?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      resetForm()
      currentCategory.value = null
      categoryForm.parentId = data.id
      isEditing.value = true
      isAddingSub.value = true
    }).catch(() => {})
    return
  }
  
  resetForm()
  currentCategory.value = null
  categoryForm.parentId = data.id
  isEditing.value = true
  isAddingSub.value = true
}

// 编辑分类
const handleEditCategory = (data: Category) => {
  if (isEditing.value && currentCategory.value?.id !== data.id) {
    ElMessageBox.confirm(
      '正在编辑中，是否放弃当前编辑?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      showCategoryDetail(data).then(() => {
        isEditing.value = true
        isAddingSub.value = false
      })
    }).catch(() => {})
    return
  }
  
  showCategoryDetail(data).then(() => {
    isEditing.value = true
    isAddingSub.value = false
  })
}

// 删除分类
const handleDeleteCategory = (data: Category) => {
  categoryToDelete.value = data
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!categoryToDelete.value) return
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(`成功删除分类"${categoryToDelete.value.name}"`)
    
    // 重新加载数据
    loadCategories()
    
    // 如果当前正在查看的是被删除的分类，则清空
    if (currentCategory.value?.id === categoryToDelete.value.id) {
      currentCategory.value = null
      resetForm()
    }
  } catch (error) {
    console.error('删除分类失败:', error)
    ElMessage.error('删除分类失败，请稍后重试')
  } finally {
    deleteDialogVisible.value = false
    categoryToDelete.value = null
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (currentCategory.value) {
          // 更新
          ElMessage.success(`成功更新分类"${categoryForm.name}"`)
        } else {
          // 新增
          ElMessage.success(`成功添加分类"${categoryForm.name}"`)
        }
        
        // 重新加载数据
        await loadCategories()
        
        // 重置状态
        isEditing.value = false
        isAddingSub.value = false
        currentCategory.value = null
        resetForm()
      } catch (error) {
        console.error('保存分类失败:', error)
        ElMessage.error('保存分类失败，请稍后重试')
      }
    } else {
      console.log('表单验证失败', fields)
    }
  })
}

// 节点拖拽处理
const handleDrop = async (draggingNode: any, dropNode: any, dropType: string) => {
  const draggingData = draggingNode.data
  const dropData = dropNode.data
  
  console.log('拖拽处理:', draggingData, dropData, dropType)
  
  // 模拟API请求
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('分类顺序更新成功')
  } catch (error) {
    console.error('更新分类顺序失败:', error)
    ElMessage.error('更新分类顺序失败，请稍后重试')
    // 重新加载数据恢复原状
    await loadCategories()
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-container {
  padding: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.category-content {
  margin-bottom: 20px;
}

.tree-card, .detail-card {
  height: 100%;
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 5px;
}

.tree-wrapper {
  height: calc(100% - 20px);
  overflow-y: auto;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.label-text {
  margin-left: 4px;
}

.count-tag {
  margin-left: 5px;
}

.node-actions {
  display: none;
  gap: 2px;
}

.el-tree-node:hover .node-actions {
  display: flex;
}

.empty-tree, .empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.category-form {
  padding: 20px 0;
}

.category-stats {
  padding: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #E6A23C;
  margin-bottom: 15px;
}

.warning-text {
  color: #F56C6C;
  font-size: 14px;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style> 