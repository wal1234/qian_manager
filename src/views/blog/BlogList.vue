<template>
  <div class="blog-list-container">
    <!-- 搜索和筛选区域 -->
    <div class="search-bar">
      <div class="search-header">
        <div class="search-title">
          <el-icon><Search /></el-icon>
          <span>高级搜索</span>
        </div>
        <div class="search-actions">
          <el-button link type="primary" @click="expandSearch = !expandSearch">
            {{ expandSearch ? '收起筛选' : '展开筛选' }}
            <el-icon>
              <component :is="expandSearch ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </el-button>
        </div>
      </div>

      <el-divider style="margin: 10px 0" />

      <el-collapse-transition>
        <div v-show="expandSearch">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="标题/内容/标签" 
                clearable 
                @keyup.enter="handleSearch"
                prefix-icon="Search"
                class="search-input"
              />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="searchForm.category" placeholder="选择分类" clearable class="search-select">
                <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="发布状态" clearable class="search-select">
                <el-option label="已发布" value="published" />
                <el-option label="草稿" value="draft" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="search-date-picker"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-transition>

      <div class="search-buttons">
        <el-button type="primary" @click="handleSearch" :icon="Search" class="search-btn">
          搜索
        </el-button>
        <el-button @click="resetSearch" :icon="RefreshRight">
          重置
        </el-button>
        <el-tooltip content="保存筛选条件" placement="top" effect="light">
          <el-button :icon="StarFilled" circle></el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="table-operations">
      <div class="left-operations">
        <el-button type="success" @click="navigateToCreate">
          <el-icon><Plus /></el-icon>新建博客
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-button :disabled="selectedRows.length === 0" @click="handleBatchPublish">
          <el-icon><Upload /></el-icon>批量发布
        </el-button>
      </div>
      <div class="right-operations">
        <el-tooltip content="刷新数据" placement="top">
          <el-button circle @click="loadData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="密度" placement="top">
          <el-dropdown @command="handleSizeChange">
            <el-button circle>
              <el-icon><Grid /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="large">宽松</el-dropdown-item>
                <el-dropdown-item command="default">默认</el-dropdown-item>
                <el-dropdown-item command="small">紧凑</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>
        <el-tooltip content="列设置" placement="top">
          <el-popover placement="bottom" :width="200" trigger="click">
            <template #reference>
              <el-button circle>
                <el-icon><Setting /></el-icon>
              </el-button>
            </template>
            <div class="column-setting">
              <div v-for="item in columns" :key="item.prop" class="column-setting-item">
                <el-checkbox v-model="item.visible">{{ item.label }}</el-checkbox>
              </div>
            </div>
          </el-popover>
        </el-tooltip>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="data-summary">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-header">
                <span>博客总数</span>
                <el-icon class="icon-total"><Document /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ statisticsData.total }}</div>
            <div class="card-text">较前日 <span class="text-up">+{{ statisticsData.dailyIncrease }}</span></div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-header">
                <span>已发布</span>
                <el-icon class="icon-published"><Check /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ statisticsData.published }}</div>
            <div class="card-text">总占比 <span>{{ Math.round((statisticsData.published / statisticsData.total) * 100) }}%</span></div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-header">
                <span>浏览量</span>
                <el-icon class="icon-views"><View /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ statisticsData.totalViews }}</div>
            <div class="card-text">本周增长 <span class="text-up">+{{ statisticsData.weeklyViews }}</span></div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-header">
                <span>评论数</span>
                <el-icon class="icon-comments"><ChatLineRound /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ statisticsData.totalComments }}</div>
            <div class="card-text">待审核 <span class="text-warning">{{ statisticsData.pendingComments }}</span></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="blogList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      :size="tableSize"
      border
      row-key="id"
      class="blog-table"
    >
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column type="index" label="#" width="60" align="center" fixed="left" />
      
      <el-table-column v-for="col in visibleColumns" :key="col.prop" v-bind="col">
        <template #default="scope" v-if="col.prop === 'title'">
          <div class="blog-title">
            <el-image 
              v-if="scope.row.cover" 
              :src="scope.row.cover" 
              class="blog-cover-thumb"
              fit="cover"
              :preview-src-list="[scope.row.cover]"
            />
            <div class="title-content">
              <div class="blog-title-text">{{ scope.row.title }}</div>
              <div class="blog-tags">
                <el-tag v-for="tag in scope.row.tags" :key="tag" size="small" class="blog-tag">{{ tag }}</el-tag>
              </div>
            </div>
          </div>
        </template>
        
        <template #default="scope" v-else-if="col.prop === 'createTime'">
          <div>{{ formatDate(scope.row.createTime) }}</div>
          <div class="text-secondary">{{ formatDateFromNow(scope.row.createTime) }}</div>
        </template>
        
        <template #default="scope" v-else-if="col.prop === 'status'">
          <el-tag :type="getStatusTag(scope.row.status).type" effect="light">
            {{ getStatusTag(scope.row.status).text }}
          </el-tag>
        </template>
        
        <template #default="scope" v-else-if="col.prop === 'operation'">
          <div class="operation-buttons">
            <el-tooltip content="查看" placement="top">
              <el-button circle size="small" type="primary" plain @click="handleView(scope.row)">
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button circle size="small" type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <el-dropdown>
              <el-button circle size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handlePublish(scope.row)">
                    <el-icon><Upload /></el-icon>发布
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleTop(scope.row)">
                    <el-icon><Top /></el-icon>置顶
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport(scope.row)">
                    <el-icon><Download /></el-icon>导出
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(scope.row)" style="color: #F56C6C">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页区域 -->
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

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%" center>
      <div class="dialog-content">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>确定要删除选中的{{ selectedRows.length }}项吗？此操作不可逆!</p>
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, RefreshRight, Plus, Delete, Upload, Refresh, Grid, Setting, 
  Document, Check, View, ChatLineRound, Edit, Top, Download, MoreFilled, WarningFilled,
  ArrowDown, ArrowUp, StarFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// 初始化dayjs相对时间插件
dayjs.extend(relativeTime)

// 定义博客类型
interface BlogItem {
  id: number
  title: string
  content: string
  cover: string
  category: string
  createTime: string
  updateTime: string
  author: string
  views: number
  comments: number
  status: string
  tags: string[]
}

// 定义搜索表单类型
interface SearchFormType {
  keyword: string
  category: string
  status: string
  dateRange: string[]
}

// 定义统计数据类型
interface StatisticsDataType {
  total: number
  published: number
  totalViews: number
  weeklyViews: number
  totalComments: number
  pendingComments: number
  dailyIncrease: number
}

// 定义分页数据类型
interface PaginationType {
  currentPage: number
  pageSize: number
  total: number
}

// 定义列定义类型
interface ColumnType {
  prop: string
  label: string
  width?: number
  minWidth?: number
  align?: string
  fixed?: string
  visible: boolean
}

const router = useRouter()
const loading = ref(false)
const tableSize = ref<'large' | 'default' | 'small'>('default')
const deleteDialogVisible = ref(false)
const selectedRows = ref<BlogItem[]>([])
const expandSearch = ref(true)

// 列定义
const columns = reactive<ColumnType[]>([
  { prop: 'title', label: '标题', minWidth: 300, visible: true },
  { prop: 'category', label: '分类', width: 100, visible: true },
  { prop: 'createTime', label: '创建时间', width: 160, visible: true },
  { prop: 'updateTime', label: '更新时间', width: 160, visible: false },
  { prop: 'author', label: '作者', width: 100, visible: true },
  { prop: 'views', label: '浏览量', width: 100, align: 'center', visible: true },
  { prop: 'comments', label: '评论数', width: 100, align: 'center', visible: true },
  { prop: 'status', label: '状态', width: 100, align: 'center', visible: true },
  { prop: 'operation', label: '操作', width: 180, fixed: 'right', align: 'center', visible: true }
])

// 可见列
const visibleColumns = computed(() => {
  return columns.filter(col => col.visible)
})

// 搜索表单
const searchForm = reactive<SearchFormType>({
  keyword: '',
  category: '',
  status: '',
  dateRange: []
})

// 分类选项
const categoryOptions = ref([
  { label: '技术博客', value: 'tech' },
  { label: '生活随笔', value: 'life' },
  { label: '教程分享', value: 'tutorial' },
  { label: '产品设计', value: 'design' },
  { label: '前端开发', value: 'frontend' },
  { label: '后端开发', value: 'backend' }
])

// 分页数据
const pagination = reactive<PaginationType>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 统计数据
const statisticsData = reactive<StatisticsDataType>({
  total: 56,
  published: 42,
  totalViews: 18721,
  weeklyViews: 1254,
  totalComments: 328,
  pendingComments: 15,
  dailyIncrease: 3
})

// 博客列表数据
const blogList = ref<BlogItem[]>([
  {
    id: 1,
    title: 'Vue3 组合式API最佳实践与性能优化指南',
    content: '本文详细介绍了Vue3组合式API的使用方法和性能优化技巧...',
    cover: 'https://placeholder.pics/svg/200x120/DEDEDE/555555/Vue3',
    category: 'frontend',
    createTime: '2023-05-15T08:30:00',
    updateTime: '2023-05-16T10:15:00',
    author: '张三',
    views: 1540,
    comments: 32,
    status: 'published',
    tags: ['Vue3', 'JavaScript', '前端开发']
  },
  {
    id: 2,
    title: 'TypeScript高级类型系统全解析',
    content: 'TypeScript的类型系统非常强大，本文将深入探讨TS的高级类型用法...',
    cover: 'https://placeholder.pics/svg/200x120/DEDEDE/555555/TypeScript',
    category: 'frontend',
    createTime: '2023-05-10T14:20:00',
    updateTime: '2023-05-10T16:45:00',
    author: '李四',
    views: 2310,
    comments: 45,
    status: 'published',
    tags: ['TypeScript', '前端开发']
  },
  {
    id: 3,
    title: 'Spring Boot与MongoDB整合实战',
    content: '本文将详细讲解如何在Spring Boot项目中集成MongoDB数据库...',
    cover: 'https://placeholder.pics/svg/200x120/DEDEDE/555555/Spring',
    category: 'backend',
    createTime: '2023-05-08T09:15:00',
    updateTime: '2023-05-09T11:30:00',
    author: '王五',
    views: 1280,
    comments: 28,
    status: 'published',
    tags: ['Spring Boot', 'MongoDB', '后端开发']
  },
  {
    id: 4,
    title: 'Docker容器化部署微服务架构',
    content: '微服务架构与Docker的结合是现代应用部署的主流选择...',
    cover: 'https://placeholder.pics/svg/200x120/DEDEDE/555555/Docker',
    category: 'backend',
    createTime: '2023-05-05T16:40:00',
    updateTime: '2023-05-06T10:20:00',
    author: '赵六',
    views: 1870,
    comments: 56,
    status: 'published',
    tags: ['Docker', '微服务', 'DevOps']
  },
  {
    id: 5,
    title: 'UI设计中的色彩心理学应用',
    content: '色彩心理学在UI设计中扮演着至关重要的角色...',
    cover: 'https://placeholder.pics/svg/200x120/DEDEDE/555555/Design',
    category: 'design',
    createTime: '2023-05-03T13:25:00',
    updateTime: '2023-05-03T15:10:00',
    author: '钱七',
    views: 2150,
    comments: 39,
    status: 'draft',
    tags: ['UI设计', '色彩心理学', '用户体验']
  },
  {
    id: 6,
    title: 'React性能优化实战案例分析',
    content: '如何优化React应用性能？本文将通过实际案例进行详细分析...',
    cover: 'https://placeholder.pics/svg/200x120/DEDEDE/555555/React',
    category: 'frontend',
    createTime: '2023-05-01T09:50:00',
    updateTime: '2023-05-02T14:30:00',
    author: '孙八',
    views: 3120,
    comments: 67,
    status: 'draft',
    tags: ['React', 'JavaScript', '性能优化']
  }
])

// 获取状态标签配置
const getStatusTag = (status: string) => {
  const statusMap: Record<string, { type: string, text: string }> = {
    published: { type: 'success', text: '已发布' },
    draft: { type: 'info', text: '草稿' },
    archived: { type: 'warning', text: '已归档' }
  }
  return statusMap[status] || { type: 'info', text: '未知状态' }
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 格式化相对时间
const formatDateFromNow = (date: string) => {
  return dayjs(date).fromNow()
}

// 处理表格选择变化
const handleSelectionChange = (rows: BlogItem[]) => {
  selectedRows.value = rows
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

// 重置搜索条件
const resetSearch = () => {
  Object.keys(searchForm).forEach((key: string) => {
    if (key === 'dateRange') {
      (searchForm[key as keyof SearchFormType] as string[]) = []
    } else {
      (searchForm[key as keyof SearchFormType] as string) = ''
    }
  })
  handleSearch()
}

// 加载数据
const loadData = () => {
  loading.value = true
  // 这里模拟API调用
  setTimeout(() => {
    // 实际项目中应该调用真实API
    pagination.total = 56 // 总条数应该从API响应中获取
    loading.value = false
    
    // 根据搜索条件过滤数据
    if (searchForm.keyword) {
      ElMessage.success(`已查询关键词: ${searchForm.keyword}`)
    }
  }, 800)
}

// 处理分页大小变化
const handleSizeChange = (val: number | string) => {
  if (typeof val === 'string' && ['large', 'default', 'small'].includes(val)) {
    tableSize.value = val as 'large' | 'default' | 'small'
    return
  }
  pagination.pageSize = val as number
  loadData()
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadData()
}

// 导航到创建页面
const navigateToCreate = () => {
  router.push('/blog/edit')
}

// 处理查看操作
const handleView = (row: BlogItem) => {
  router.push(`/blog/detail/${row.id}`)
}

// 处理编辑操作
const handleEdit = (row: BlogItem) => {
  router.push(`/blog/edit?id=${row.id}`)
}

// 处理发布操作
const handlePublish = (row: BlogItem) => {
  ElMessage.success(`已发布: ${row.title}`)
}

// 处理置顶操作
const handleTop = (row: BlogItem) => {
  ElMessage.success(`已置顶: ${row.title}`)
}

// 处理导出操作
const handleExport = (row: BlogItem) => {
  ElMessage.success(`已导出: ${row.title}`)
}

// 处理删除操作
const handleDelete = (row: BlogItem) => {
  ElMessageBox.confirm(
    `确定要删除博客 "${row.title}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      ElMessage.success(`已删除: ${row.title}`)
      // 实际应用中应该调用API删除数据
      loadData()
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的项')
    return
  }
  deleteDialogVisible.value = true
}

// 确认批量删除
const confirmDelete = () => {
  ElMessage.success(`已删除${selectedRows.value.length}项`)
  deleteDialogVisible.value = false
  // 实际应用中应该调用API批量删除数据
  loadData()
}

// 处理批量发布
const handleBatchPublish = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要发布的项')
    return
  }
  ElMessage.success(`已发布${selectedRows.value.length}项`)
  // 实际应用中应该调用API批量发布
  loadData()
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.blog-list-container {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
  padding: 18px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-title .el-icon {
  color: #409EFF;
  font-size: 18px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 10px;
}

.search-form .el-form-item {
  margin-bottom: 15px;
  margin-right: 0;
}

.search-form .el-form-item__label {
  font-weight: 500;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 180px;
}

.search-date-picker {
  width: 360px;
}

.search-buttons {
  display: flex;
  gap: 10px;
  padding-top: 5px;
  border-top: 1px dashed #ebeef5;
  margin-top: 5px;
}

.search-btn {
  min-width: 90px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  align-items: center;
}

.left-operations {
  display: flex;
  gap: 10px;
}

.right-operations {
  display: flex;
  gap: 10px;
}

.data-summary {
  margin-bottom: 20px;
}

.summary-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-number {
  font-size: 28px;
  font-weight: bold;
  margin: 10px 0;
  color: #303133;
}

.card-text {
  font-size: 14px;
  color: #909399;
}

.text-up {
  color: #67C23A;
}

.text-down {
  color: #F56C6C;
}

.text-warning {
  color: #E6A23C;
}

.blog-table {
  margin-bottom: 20px;
  border-radius: 4px;
  overflow: hidden;
}

.blog-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.blog-cover-thumb {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #ebeef5;
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.blog-title-text {
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.blog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.blog-tag {
  margin-right: 0 !important;
}

.text-secondary {
  font-size: 12px;
  color: #909399;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.warning-icon {
  font-size: 32px;
  color: #E6A23C;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.column-setting {
  padding: 10px;
}

.column-setting-item {
  margin-bottom: 10px;
}

.icon-total {
  color: #409EFF;
}

.icon-published {
  color: #67C23A;
}

.icon-views {
  color: #E6A23C;
}

.icon-comments {
  color: #F56C6C;
}
</style> 