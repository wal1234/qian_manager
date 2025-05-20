<template>
  <div class="comment-container">
    <div class="comment-header">
      <h2>评论管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="评论内容/用户名" 
            clearable 
            @keyup.enter="handleFilter"
          />
        </el-form-item>
        <el-form-item label="文章">
          <el-select v-model="filterForm.blogId" clearable placeholder="选择文章">
            <el-option 
              v-for="blog in blogOptions" 
              :key="blog.id" 
              :label="blog.title" 
              :value="blog.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" clearable placeholder="评论状态">
            <el-option label="已审核" value="approved" />
            <el-option label="待审核" value="pending" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评论列表 -->
    <el-card class="comment-card">
      <el-table
        v-loading="loading"
        :data="commentList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
        row-key="id"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="评论内容" min-width="250">
          <template #default="scope">
            <div class="comment-content">
              <el-avatar :size="40" :src="scope.row.avatar" />
              <div class="comment-info">
                <div class="comment-user">
                  <span class="username">{{ scope.row.username }}</span>
                  <el-tag size="small" :type="getStatusType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </div>
                <div class="comment-text">{{ scope.row.content }}</div>
                <div class="comment-meta">
                  <span>{{ formatDate(scope.row.createTime) }}</span>
                  <span>IP: {{ scope.row.ip }}</span>
                  <span v-if="scope.row.replyTo">
                    回复: @{{ scope.row.replyTo }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="文章" prop="blogTitle" min-width="180">
          <template #default="scope">
            <el-link type="primary" @click="viewBlog(scope.row.blogId)">
              {{ scope.row.blogTitle }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="评论时间" width="160" align="center">
          <template #default="scope">
            <span>{{ formatDate(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'pending'" type="success" link @click="handleApprove(scope.row)">
              <el-icon><Check /></el-icon>通过
            </el-button>
            <el-button v-if="scope.row.status === 'pending'" type="danger" link @click="handleReject(scope.row)">
              <el-icon><Close /></el-icon>拒绝
            </el-button>
            <el-button type="primary" link @click="handleReply(scope.row)">
              <el-icon><ChatLineRound /></el-icon>回复
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

    <!-- 回复评论对话框 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评论"
      width="50%"
    >
      <div class="reply-to-info" v-if="currentComment">
        <div class="reply-user">回复给: {{ currentComment.username }}</div>
        <div class="original-comment">{{ currentComment.content }}</div>
      </div>
      <el-form :model="replyForm" ref="replyFormRef" :rules="replyRules">
        <el-form-item prop="content">
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="replyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReply">确认回复</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
      center
    >
      <div class="delete-confirm">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>确定要删除选中的 {{ selectedRows.length }} 条评论吗？</p>
        <p class="warning-text">此操作不可逆，请谨慎操作！</p>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, Delete, Refresh, ChatLineRound, WarningFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

// 评论数据接口
interface Comment {
  id: number
  content: string
  username: string
  avatar: string
  createTime: string
  blogId: number
  blogTitle: string
  status: 'approved' | 'pending' | 'rejected'
  ip: string
  replyTo?: string
}

// 博客选项接口
interface BlogOption {
  id: number
  title: string
}

// 筛选表单数据
const filterForm = reactive({
  keyword: '',
  blogId: '',
  status: '',
  dateRange: [] as string[]
})

// 回复表单数据
const replyForm = reactive({
  content: ''
})

// 回复表单校验规则
const replyRules = reactive<FormRules>({
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 2, max: 500, message: '长度应为2-500个字符', trigger: 'blur' }
  ]
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 响应式数据
const loading = ref(false)
const commentList = ref<Comment[]>([])
const blogOptions = ref<BlogOption[]>([])
const selectedRows = ref<Comment[]>([])
const replyDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const currentComment = ref<Comment | null>(null)
const replyFormRef = ref<FormInstance>()

// 加载评论数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    commentList.value = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      content: `这是一条评论内容，描述了用户对博客文章的看法和感受。评论ID: ${index + 1}`,
      username: `用户${Math.floor(Math.random() * 10) + 1}`,
      avatar: `https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`,
      createTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      blogId: Math.floor(Math.random() * 5) + 1,
      blogTitle: `博客文章标题 ${Math.floor(Math.random() * 5) + 1}`,
      status: ['approved', 'pending', 'rejected'][Math.floor(Math.random() * 3)] as Comment['status'],
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      replyTo: Math.random() > 0.7 ? `用户${Math.floor(Math.random() * 10) + 1}` : undefined
    }))
    
    // 更新分页数据
    pagination.total = 89
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载博客选项
const loadBlogOptions = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    blogOptions.value = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      title: `博客文章标题 ${index + 1}`
    }))
  } catch (error) {
    console.error('加载博客选项失败:', error)
  }
}

// 获取状态类型
const getStatusType = (status: string): '' | 'success' | 'warning' | 'danger' => {
  const map: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger'
  }
  return map[status] || ''
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    approved: '已审核',
    pending: '待审核',
    rejected: '已拒绝'
  }
  return map[status] || '未知'
}

// 处理筛选
const handleFilter = () => {
  pagination.currentPage = 1
  loadData()
}

// 重置筛选
const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.blogId = ''
  filterForm.status = ''
  filterForm.dateRange = []
  handleFilter()
}

// 处理选择变化
const handleSelectionChange = (selection: Comment[]) => {
  selectedRows.value = selection
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

// 刷新评论
const handleRefresh = () => {
  loadData()
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的评论')
    return
  }
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = () => {
  ElMessage.success(`成功删除${selectedRows.value.length}条评论`)
  deleteDialogVisible.value = false
  loadData()
}

// 通过评论
const handleApprove = (row: Comment) => {
  ElMessageBox.confirm(
    `确定要通过此评论吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    ElMessage.success('评论已通过')
    row.status = 'approved'
  }).catch(() => {})
}

// 拒绝评论
const handleReject = (row: Comment) => {
  ElMessageBox.confirm(
    `确定要拒绝此评论吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('评论已拒绝')
    row.status = 'rejected'
  }).catch(() => {})
}

// 回复评论
const handleReply = (row: Comment) => {
  currentComment.value = row
  replyDialogVisible.value = true
  replyForm.content = ''
}

// 提交回复
const submitReply = async () => {
  if (!replyFormRef.value) return
  
  await replyFormRef.value.validate((valid, fields) => {
    if (valid && currentComment.value) {
      // 模拟API请求
      setTimeout(() => {
        ElMessage.success(`成功回复评论`)
        replyDialogVisible.value = false
        loadData()
      }, 500)
    } else {
      console.log('表单验证失败', fields)
    }
  })
}

// 删除单个评论
const handleDelete = (row: Comment) => {
  ElMessageBox.confirm(
    `确定要删除此评论吗？此操作不可逆!`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('评论已删除')
    loadData()
  }).catch(() => {})
}

// 查看博客
const viewBlog = (blogId: number) => {
  ElMessage.info(`查看博客ID: ${blogId}`)
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadData()
  loadBlogOptions()
})
</script>

<style scoped>
.comment-container {
  padding: 20px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.comment-card {
  margin-bottom: 20px;
}

.comment-content {
  display: flex;
  gap: 12px;
  padding: 10px 0;
}

.comment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 600;
  color: #303133;
}

.comment-text {
  line-height: 1.5;
  color: #303133;
  word-break: break-word;
}

.comment-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.reply-to-info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.reply-user {
  font-weight: 600;
  margin-bottom: 5px;
}

.original-comment {
  color: #606266;
  font-size: 14px;
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #F56C6C;
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