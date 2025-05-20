<template>
  <div class="resources-list-container">
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
                placeholder="资源名称/描述/标签" 
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
            <el-form-item label="类型">
              <el-select v-model="searchForm.type" placeholder="资源类型" clearable class="search-select">
                <el-option label="图片" value="image" />
                <el-option label="文档" value="document" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="上传时间">
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
        <el-button type="success" @click="handleUpload">
          <el-icon><Upload /></el-icon>上传资源
        </el-button>
        <el-button type="primary" @click="handleCreateFolder">
          <el-icon><FolderAdd /></el-icon>新建文件夹
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
      <div class="right-operations">
        <el-tooltip content="刷新数据" placement="top">
          <el-button circle @click="loadData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="视图模式" placement="top">
          <el-dropdown @command="handleViewModeChange">
            <el-button circle>
              <el-icon><Grid /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="table">表格视图</el-dropdown-item>
                <el-dropdown-item command="grid">网格视图</el-dropdown-item>
                <el-dropdown-item command="list">列表视图</el-dropdown-item>
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
                <span>资源总数</span>
                <el-icon class="icon-total"><Folder /></el-icon>
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
                <span>图片资源</span>
                <el-icon class="icon-image"><Picture /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ statisticsData.images }}</div>
            <div class="card-text">总占比 <span>{{ Math.round((statisticsData.images / statisticsData.total) * 100) }}%</span></div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-header">
                <span>文档资源</span>
                <el-icon class="icon-document"><Document /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ statisticsData.documents }}</div>
            <div class="card-text">总占比 <span>{{ Math.round((statisticsData.documents / statisticsData.total) * 100) }}%</span></div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="card-header">
                <span>存储空间</span>
                <el-icon class="icon-storage"><DataLine /></el-icon>
              </div>
            </template>
            <div class="card-number">{{ formatFileSize(statisticsData.totalSize) }}</div>
            <div class="card-text">已用 <span>{{ Math.round((statisticsData.usedSize / statisticsData.totalSize) * 100) }}%</span></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="resourceList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      :size="tableSize"
      border
      row-key="id"
      class="resource-table"
    >
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column type="index" label="#" width="60" align="center" fixed="left" />
      
      <el-table-column v-for="col in visibleColumns" :key="col.prop" v-bind="col">
        <template #default="scope" v-if="col.prop === 'name'">
          <div class="resource-name">
            <el-icon v-if="scope.row.type === 'folder'" class="folder-icon"><Folder /></el-icon>
            <el-icon v-else-if="scope.row.type === 'image'" class="image-icon"><Picture /></el-icon>
            <el-icon v-else-if="scope.row.type === 'document'" class="document-icon"><Document /></el-icon>
            <el-icon v-else-if="scope.row.type === 'video'" class="video-icon"><VideoCamera /></el-icon>
            <el-icon v-else-if="scope.row.type === 'audio'" class="audio-icon"><Headset /></el-icon>
            <el-icon v-else class="file-icon"><Files /></el-icon>
            <span>{{ scope.row.name }}</span>
          </div>
        </template>
        
        <template #default="scope" v-else-if="col.prop === 'uploadTime'">
          <div>{{ formatDate(scope.row.uploadTime) }}</div>
          <div class="text-secondary">{{ formatDateFromNow(scope.row.uploadTime) }}</div>
        </template>
        
        <template #default="scope" v-else-if="col.prop === 'size'">
          <div>{{ formatFileSize(scope.row.size) }}</div>
        </template>
        
        <template #default="scope" v-else-if="col.prop === 'operation'">
          <div class="operation-buttons">
            <el-tooltip content="预览" placement="top">
              <el-button circle size="small" type="primary" plain @click="handlePreview(scope.row)">
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="下载" placement="top">
              <el-button circle size="small" type="primary" @click="handleDownload(scope.row)">
                <el-icon><Download /></el-icon>
              </el-button>
            </el-tooltip>
            <el-dropdown>
              <el-button circle size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleRename(scope.row)">
                    <el-icon><Edit /></el-icon>重命名
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleMove(scope.row)">
                    <el-icon><Position /></el-icon>移动
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleShare(scope.row)">
                    <el-icon><Share /></el-icon>分享
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

    <!-- 上传资源对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传资源" width="50%" center>
      <el-upload
        class="upload-dragger"
        drag
        action="/api/resources/upload"
        multiple
        :on-preview="handleUploadPreview"
        :on-remove="handleUploadRemove"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持任意类型文件，单个文件不超过100MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmUpload">开始上传</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, RefreshRight, Upload, Delete, Refresh, Grid, Setting, 
  Folder, Picture, Document, DataLine, View, Download, Edit, MoreFilled, WarningFilled,
  ArrowDown, ArrowUp, StarFilled, FolderAdd, VideoCamera, Headset, Files, Position, Share
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// 初始化dayjs相对时间插件
dayjs.extend(relativeTime)

// 定义资源类型
interface ResourceItem {
  id: number
  name: string
  type: string
  size: number
  category: string
  uploadTime: string
  updateTime: string
  uploader: string
  path: string
  tags: string[]
}

// 定义搜索表单类型
interface SearchFormType {
  keyword: string
  category: string
  type: string
  dateRange: string[]
}

// 定义统计数据类型
interface StatisticsDataType {
  total: number
  images: number
  documents: number
  totalSize: number
  usedSize: number
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
const uploadDialogVisible = ref(false)
const selectedRows = ref<ResourceItem[]>([])
const expandSearch = ref(true)
const viewMode = ref<'table' | 'grid' | 'list'>('table')

// 列定义
const columns = reactive<ColumnType[]>([
  { prop: 'name', label: '名称', minWidth: 250, visible: true },
  { prop: 'type', label: '类型', width: 100, visible: true },
  { prop: 'category', label: '分类', width: 120, visible: true },
  { prop: 'size', label: '大小', width: 120, align: 'right', visible: true },
  { prop: 'uploadTime', label: '上传时间', width: 160, visible: true },
  { prop: 'updateTime', label: '更新时间', width: 160, visible: false },
  { prop: 'uploader', label: '上传者', width: 120, visible: true },
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
  type: '',
  dateRange: []
})

// 分类选项
const categoryOptions = ref([
  { label: '图片资源', value: 'image' },
  { label: '文档资源', value: 'document' },
  { label: '视频资源', value: 'video' },
  { label: '音频资源', value: 'audio' },
  { label: '其他资源', value: 'other' }
])

// 统计数据
const statisticsData = reactive<StatisticsDataType>({
  total: 0,
  images: 0,
  documents: 0,
  totalSize: 0,
  usedSize: 0,
  dailyIncrease: 0
})

// 分页数据
const pagination = reactive<PaginationType>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 资源列表数据
const resourceList = ref<ResourceItem[]>([])

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    resourceList.value = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      name: `资源${index + 1}`,
      type: ['folder', 'image', 'document', 'video', 'audio'][Math.floor(Math.random() * 5)],
      size: Math.floor(Math.random() * 10000000),
      category: categoryOptions.value[Math.floor(Math.random() * categoryOptions.value.length)].value,
      uploadTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      uploader: `用户${Math.floor(Math.random() * 5) + 1}`,
      path: `/resources/${index + 1}`,
      tags: ['标签1', '标签2', '标签3'].slice(0, Math.floor(Math.random() * 3) + 1)
    }))
    
    // 更新统计数据
    statisticsData.total = 156
    statisticsData.images = 78
    statisticsData.documents = 45
    statisticsData.totalSize = 1024 * 1024 * 1024 * 10 // 10GB
    statisticsData.usedSize = 1024 * 1024 * 1024 * 3.5 // 3.5GB
    statisticsData.dailyIncrease = 12
    
    // 更新分页数据
    pagination.total = 156
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
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.type = ''
  searchForm.dateRange = []
  handleSearch()
}

// 处理表格选择变化
const handleSelectionChange = (selection: ResourceItem[]) => {
  selectedRows.value = selection
}

// 处理表格大小变化
const handleTableSizeChange = (size: 'large' | 'default' | 'small') => {
  tableSize.value = size
}

// 处理视图模式变化
const handleViewModeChange = (mode: 'table' | 'grid' | 'list') => {
  viewMode.value = mode
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

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的资源')
    return
  }
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = () => {
  ElMessage.success(`成功删除${selectedRows.value.length}个资源`)
  deleteDialogVisible.value = false
  loadData()
}

// 处理单个删除
const handleDelete = (row: ResourceItem) => {
  ElMessageBox.confirm(
    `确定要删除资源"${row.name}"吗？此操作不可逆!`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success(`成功删除资源"${row.name}"`)
    loadData()
  }).catch(() => {})
}

// 处理上传
const handleUpload = () => {
  uploadDialogVisible.value = true
}

// 处理创建文件夹
const handleCreateFolder = () => {
  ElMessageBox.prompt('请输入文件夹名称', '新建文件夹', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[a-zA-Z0-9\u4e00-\u9fa5_\-\s]+$/,
    inputErrorMessage: '文件夹名称不能包含特殊字符'
  }).then(({ value }) => {
    ElMessage.success(`成功创建文件夹"${value}"`)
    loadData()
  }).catch(() => {})
}

// 处理预览
const handlePreview = (row: ResourceItem) => {
  if (row.type === 'folder') {
    // 进入文件夹
    ElMessage.info(`进入文件夹"${row.name}"`)
  } else {
    // 预览文件
    ElMessage.info(`预览文件"${row.name}"`)
  }
}

// 处理下载
const handleDownload = (row: ResourceItem) => {
  ElMessage.success(`开始下载"${row.name}"`)
}

// 处理重命名
const handleRename = (row: ResourceItem) => {
  ElMessageBox.prompt('请输入新名称', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.name,
    inputPattern: /^[a-zA-Z0-9\u4e00-\u9fa5_\-\s\.]+$/,
    inputErrorMessage: '名称不能包含特殊字符'
  }).then(({ value }) => {
    ElMessage.success(`成功将"${row.name}"重命名为"${value}"`)
    loadData()
  }).catch(() => {})
}

// 处理移动
const handleMove = (row: ResourceItem) => {
  ElMessage.info(`移动"${row.name}"到其他文件夹`)
}

// 处理分享
const handleShare = (row: ResourceItem) => {
  ElMessage.info(`分享"${row.name}"`)
}

// 处理上传预览
const handleUploadPreview = (file: any) => {
  console.log(file)
}

// 处理上传移除
const handleUploadRemove = (file: any) => {
  console.log(file)
}

// 处理上传成功
const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success(`文件"${file.name}"上传成功`)
}

// 处理上传失败
const handleUploadError = (error: any, file: any) => {
  ElMessage.error(`文件"${file.name}"上传失败`)
}

// 上传前检查
const beforeUpload = (file: File) => {
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过100MB!')
    return false
  }
  return true
}

// 确认上传
const confirmUpload = () => {
  uploadDialogVisible.value = false
  loadData()
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化相对时间
const formatDateFromNow = (date: string) => {
  return dayjs(date).fromNow()
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
}

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap: Record<string, { type: string, text: string }> = {
    'published': { type: 'success', text: '已发布' },
    'draft': { type: 'info', text: '草稿' },
    'archived': { type: 'warning', text: '已归档' }
  }
  return statusMap[status] || { type: 'info', text: '未知' }
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.resources-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.search-bar {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-title .el-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #409EFF;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 180px;
}

.search-date-picker {
  width: 320px;
}

.search-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  gap: 10px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.left-operations, .right-operations {
  display: flex;
  gap: 10px;
}

.data-summary {
  margin-bottom: 20px;
}

.summary-card {
  height: 100%;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 10px 0;
}

.card-text {
  font-size: 14px;
  color: #909399;
}

.text-up {
  color: #67C23A;
}

.text-warning {
  color: #E6A23C;
}

.resource-table {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.resource-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-icon {
  color: #E6A23C;
}

.image-icon {
  color: #409EFF;
}

.document-icon {
  color: #67C23A;
}

.video-icon {
  color: #F56C6C;
}

.audio-icon {
  color: #909399;
}

.file-icon {
  color: #909399;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #E6A23C;
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.el-upload__tip {
  margin-top: 10px;
  color: #909399;
}

.column-setting {
  max-height: 300px;
  overflow-y: auto;
}

.column-setting-item {
  margin-bottom: 10px;
}

.text-secondary {
  font-size: 12px;
  color: #909399;
}
</style> 