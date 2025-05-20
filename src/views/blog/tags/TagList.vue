<template>
  <div class="tag-container">
    <div class="tag-header">
      <h2>标签管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加标签
      </el-button>
    </div>

    <el-card class="tag-card">
      <!-- 标签展示区域 -->
      <div class="tag-filter">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标签"
          clearable
          @keyup.enter="handleSearch"
          prefix-icon="Search"
          class="search-input"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <div class="tag-display">
        <el-tag
          v-for="tag in tagList"
          :key="tag.id"
          :type="tag.type"
          class="tag-item"
          closable
          @close="handleDelete(tag)"
          @click="handleEdit(tag)"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">({{ tag.count }})</span>
        </el-tag>
        <div v-if="tagList.length === 0" class="empty-tags">
          暂无标签数据
        </div>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- 添加/编辑标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加标签' : '编辑标签'"
      width="30%"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="tag-form"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择标签类型" class="tag-select">
            <el-option label="普通" value="" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
            <el-option label="信息" value="info" />
          </el-select>
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
import { Plus, Search } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 标签数据接口
interface Tag {
  id: number
  name: string
  type: '' | 'success' | 'warning' | 'danger' | 'info'
  count: number
}

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 50,
  total: 0
})

// 表单数据
const form = reactive({
  id: 0,
  name: '',
  type: ''
})

// 表单校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度应为1-20个字符', trigger: 'blur' }
  ]
})

// 响应式数据
const loading = ref(false)
const tagList = ref<Tag[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const searchKeyword = ref('')

// 加载标签数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const typeOptions = ['', 'success', 'warning', 'danger', 'info']
    
    // 模拟数据
    tagList.value = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      name: `标签${index + 1}`,
      type: typeOptions[Math.floor(Math.random() * typeOptions.length)] as Tag['type'],
      count: Math.floor(Math.random() * 50)
    }))
    
    // 搜索过滤
    if (searchKeyword.value) {
      tagList.value = tagList.value.filter(tag => 
        tag.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    }
    
    // 更新分页数据
    pagination.total = 120
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  handleSearch()
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

// 添加标签
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  resetForm()
}

// 编辑标签
const handleEdit = (tag: Tag) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  
  // 填充表单数据
  form.id = tag.id
  form.name = tag.name
  form.type = tag.type
}

// 删除标签
const handleDelete = (tag: Tag) => {
  ElMessageBox.confirm(
    `确定要删除标签"${tag.name}"吗？此操作不可逆!`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success(`成功删除标签"${tag.name}"`)
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
          ElMessage.success(`成功添加标签"${form.name}"`)
        } else {
          ElMessage.success(`成功更新标签"${form.name}"`)
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
  form.type = ''
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.tag-container {
  padding: 20px;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tag-card {
  margin-bottom: 20px;
}

.tag-filter {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.tag-display {
  min-height: 400px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-name {
  margin-right: 4px;
}

.tag-count {
  font-size: 12px;
  opacity: 0.6;
}

.empty-tags {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.tag-form {
  padding: 10px 30px;
}

.tag-select {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 