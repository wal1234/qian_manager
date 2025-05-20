<template>
  <div class="category-container">
    <div class="category-header">
      <h2>博客分类管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加分类
      </el-button>
    </div>

    <el-card class="category-card">
      <el-table
        v-loading="loading"
        :data="categoryList"
        style="width: 100%"
        border
        stripe
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column prop="count" label="文章数量" width="100" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="180" align="center">
          <template #default="scope">
            <span>{{ formatDate(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" align="center">
          <template #default="scope">
            <span>{{ formatDate(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="primary" link @click="handleView(scope.row)">
              <el-icon><View /></el-icon>查看
            </el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加分类' : '编辑分类'"
      width="40%"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="category-form"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

// 分类数据接口
interface Category {
  id: number
  name: string
  description: string
  count: number
  sort: number
  createTime: string
  updateTime: string
}

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表单数据
const form = reactive({
  id: 0,
  name: '',
  description: '',
  sort: 0
})

// 表单校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度应为2-20个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过200个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'change' }
  ]
})

// 响应式数据
const loading = ref(false)
const categoryList = ref<Category[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

// 加载分类数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    categoryList.value = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      name: `分类${index + 1}`,
      description: `这是分类${index + 1}的描述信息，主要用于展示该分类的用途和特点`,
      count: Math.floor(Math.random() * 100),
      sort: index + 1,
      createTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString()
    }))
    
    // 更新分页数据
    pagination.total = 26
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadData()
}

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

// 添加分类
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  resetForm()
}

// 编辑分类
const handleEdit = (row: Category) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  
  // 填充表单数据
  form.id = row.id
  form.name = row.name
  form.description = row.description
  form.sort = row.sort
}

// 查看分类下的文章
const handleView = (row: Category) => {
  ElMessage.info(`查看分类"${row.name}"下的所有文章`)
}

// 删除分类
const handleDelete = (row: Category) => {
  ElMessageBox.confirm(
    `确定要删除分类"${row.name}"吗？删除后将无法恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`成功删除分类"${row.name}"`)
    loadData()
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      // 模拟API请求
      setTimeout(() => {
        if (dialogType.value === 'add') {
          ElMessage.success(`成功添加分类"${form.name}"`)
        } else {
          ElMessage.success(`成功更新分类"${form.name}"`)
        }
        dialogVisible.value = false
        loadData()
      }, 500)
    } else {
      console.log('表单验证失败', fields)
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.id = 0
  form.name = ''
  form.description = ''
  form.sort = 0
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadData()
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

.category-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.category-form {
  padding: 10px 30px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 