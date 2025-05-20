<template>
  <div class="resource-list-container">
    <el-card>
      <template #header>
        <div class="list-header">
          <h2>资源管理</h2>
          <el-button type="primary" @click="handleUpload">上传资源</el-button>
        </div>
      </template>
      
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" class="search-form">
        <el-form-item label="资源名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入资源名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="资源分类">
          <el-cascader
            v-model="queryParams.categoryId"
            :options="categories"
            :props="{ checkStrictly: true, value: 'id', label: 'name' }"
            placeholder="请选择资源分类"
            clearable
          ></el-cascader>
        </el-form-item>
        <el-form-item label="资源状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><refresh-right /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="resourceList"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="资源名称" prop="name" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="resource-name">
              <el-icon v-if="getFileIcon(row.fileType)"><component :is="getFileIcon(row.fileType)" /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资源分类" prop="categoryName" min-width="120" align="center" />
        <el-table-column label="资源大小" prop="fileSize" min-width="100" align="center">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column label="上传时间" prop="createTime" min-width="160" align="center" />
        <el-table-column label="下载次数" prop="downloadCount" width="100" align="center" />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePreview(row)">
              <el-icon><view /></el-icon>预览
            </el-button>
            <el-button type="success" link @click="handleDownload(row)">
              <el-icon><download /></el-icon>下载
            </el-button>
            <el-dropdown>
              <el-button type="primary" link>
                <el-icon><more-filled /></el-icon>更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEdit(row)">
                    <el-icon><edit-pen /></el-icon>编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleCopyLink(row)">
                    <el-icon><link /></el-icon>复制链接
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">
                    <el-icon><delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
    
    <!-- 资源预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="资源预览"
      width="70%"
      :destroy-on-close="true"
    >
      <div class="preview-container">
        <template v-if="previewType === 'image'">
          <img :src="previewUrl" class="preview-image" alt="预览图片" />
        </template>
        <template v-else-if="previewType === 'video'">
          <video :src="previewUrl" class="preview-video" controls>
            您的浏览器不支持视频预览
          </video>
        </template>
        <template v-else-if="previewType === 'audio'">
          <audio :src="previewUrl" class="preview-audio" controls>
            您的浏览器不支持音频预览
          </audio>
        </template>
        <template v-else-if="previewType === 'pdf'">
          <iframe :src="previewUrl" class="preview-pdf" frameborder="0"></iframe>
        </template>
        <template v-else>
          <div class="preview-not-supported">
            <el-icon><warning /></el-icon>
            <p>该文件类型不支持在线预览，请下载后查看</p>
            <el-button type="primary" @click="handleDownload(currentResource)">下载文件</el-button>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="preview-footer">
          <div class="preview-info">
            <p><strong>文件名：</strong>{{ currentResource.name }}</p>
            <p><strong>文件大小：</strong>{{ formatFileSize(currentResource.fileSize) }}</p>
            <p><strong>上传时间：</strong>{{ currentResource.createTime }}</p>
          </div>
          <div>
            <el-button @click="previewVisible = false">关闭</el-button>
            <el-button type="primary" @click="handleDownload(currentResource)">下载</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, RefreshRight, View, Download, MoreFilled, 
  EditPen, Link, Delete, Warning, Document, Picture, 
  VideoCamera, Headset, Files, Folder
} from '@element-plus/icons-vue';

interface Resource {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  fileSize: number;
  fileType: string;
  downloadCount: number;
  createTime: string;
  status: number;
  url: string;
}

interface QueryParams {
  pageNum: number;
  pageSize: number;
  name: string;
  categoryId: number | null;
  status: number | null;
}

interface Category {
  id: number;
  name: string;
  children?: Category[];
}

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const resourceList = ref<Resource[]>([]);
const selectedResources = ref<Resource[]>([]);

// 预览相关
const previewVisible = ref(false);
const previewUrl = ref('');
const previewType = ref('');
const currentResource = ref<Resource>({} as Resource);

// 查询参数
const queryParams = reactive<QueryParams>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  categoryId: null,
  status: null
});

// 分类数据（模拟数据，实际应从API获取）
const categories = ref<Category[]>([
  {
    id: 1,
    name: '文档资源',
    children: [
      { id: 11, name: '技术文档' },
      { id: 12, name: '业务文档' }
    ]
  },
  {
    id: 2,
    name: '媒体资源',
    children: [
      { id: 21, name: '图片素材' },
      { id: 22, name: '视频素材' },
      { id: 23, name: '音频素材' }
    ]
  }
]);

// 获取资源列表数据
const getResourceList = async () => {
  loading.value = true;
  try {
    // 这里应该调用实际的API获取数据
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    const mockData: Resource[] = [
      {
        id: 1,
        name: '项目需求文档.docx',
        categoryId: 11,
        categoryName: '技术文档',
        fileSize: 2.5 * 1024 * 1024,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        downloadCount: 15,
        createTime: '2023-11-15 10:30:45',
        status: 1,
        url: 'https://example.com/files/doc1.docx'
      },
      {
        id: 2,
        name: '产品设计原型.pdf',
        categoryId: 12,
        categoryName: '业务文档',
        fileSize: 8.7 * 1024 * 1024,
        fileType: 'application/pdf',
        downloadCount: 32,
        createTime: '2023-11-14 14:20:33',
        status: 1,
        url: 'https://example.com/files/prototype.pdf'
      },
      {
        id: 3,
        name: '团队合照.jpg',
        categoryId: 21,
        categoryName: '图片素材',
        fileSize: 3.2 * 1024 * 1024,
        fileType: 'image/jpeg',
        downloadCount: 8,
        createTime: '2023-11-10 09:15:22',
        status: 1,
        url: 'https://example.com/files/team.jpg'
      },
      {
        id: 4,
        name: '产品演示视频.mp4',
        categoryId: 22,
        categoryName: '视频素材',
        fileSize: 45.6 * 1024 * 1024,
        fileType: 'video/mp4',
        downloadCount: 27,
        createTime: '2023-11-05 16:40:18',
        status: 1,
        url: 'https://example.com/files/demo.mp4'
      },
      {
        id: 5,
        name: '会议录音.mp3',
        categoryId: 23,
        categoryName: '音频素材',
        fileSize: 12.4 * 1024 * 1024,
        fileType: 'audio/mpeg',
        downloadCount: 5,
        createTime: '2023-11-02 11:25:36',
        status: 0,
        url: 'https://example.com/files/meeting.mp3'
      }
    ];
    
    resourceList.value = mockData;
    total.value = mockData.length;
  } catch (error) {
    console.error('获取资源列表失败:', error);
    ElMessage.error('获取资源列表失败');
  } finally {
    loading.value = false;
  }
};

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (!size) return '0 B';
  
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(2) + ' MB';
  } else {
    return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
};

// 获取文件类型对应的图标
const getFileIcon = (fileType: string) => {
  if (!fileType) return Document;
  
  if (fileType.includes('image')) {
    return Picture;
  } else if (fileType.includes('video')) {
    return VideoCamera;
  } else if (fileType.includes('audio')) {
    return Headset;
  } else if (fileType.includes('pdf')) {
    return Document;
  } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
    return Files;
  } else if (fileType.includes('folder')) {
    return Folder;
  } else {
    return Document;
  }
};

// 多选操作
const handleSelectionChange = (selection: Resource[]) => {
  selectedResources.value = selection;
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getResourceList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.categoryId = null;
  queryParams.status = null;
  handleQuery();
};

// 分页操作
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size;
  getResourceList();
};

const handleCurrentChange = (current: number) => {
  queryParams.pageNum = current;
  getResourceList();
};

// 预览资源
const handlePreview = (row: Resource) => {
  currentResource.value = row;
  previewUrl.value = row.url;
  
  // 判断预览类型
  const fileType = row.fileType || '';
  if (fileType.includes('image')) {
    previewType.value = 'image';
  } else if (fileType.includes('video')) {
    previewType.value = 'video';
  } else if (fileType.includes('audio')) {
    previewType.value = 'audio';
  } else if (fileType.includes('pdf')) {
    previewType.value = 'pdf';
  } else {
    previewType.value = 'other';
  }
  
  previewVisible.value = true;
};

// 下载资源
const handleDownload = (row: Resource) => {
  // 实际项目中应调用后端下载接口
  ElMessage.success(`开始下载: ${row.name}`);
  
  // 模拟下载
  const a = document.createElement('a');
  a.href = row.url;
  a.download = row.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 复制链接
const handleCopyLink = (row: Resource) => {
  // 使用 Clipboard API 复制链接
  navigator.clipboard.writeText(row.url)
    .then(() => {
      ElMessage.success('链接已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
};

// 编辑资源
const handleEdit = (row: Resource) => {
  ElMessage.info(`编辑资源: ${row.name} (ID: ${row.id})`);
  // 实际应跳转到编辑页面
  // router.push(`/resources/edit/${row.id}`);
};

// 删除资源
const handleDelete = (row: Resource) => {
  ElMessageBox.confirm(`确定要删除资源"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里应调用实际的删除API
    // 模拟删除操作
    setTimeout(() => {
      resourceList.value = resourceList.value.filter(item => item.id !== row.id);
      total.value--;
      ElMessage.success('删除成功');
    }, 500);
  }).catch(() => {
    // 取消删除
  });
};

// 上传资源
const handleUpload = () => {
  router.push('/resources/upload');
};

// 组件挂载时获取数据
onMounted(() => {
  getResourceList();
});
</script>

<style scoped>
.resource-list-container {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
}

.resource-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 预览样式 */
.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  max-height: 70vh;
  overflow: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-video, 
.preview-audio {
  width: 100%;
  max-height: 70vh;
}

.preview-pdf {
  width: 100%;
  height: 70vh;
  border: none;
}

.preview-not-supported {
  text-align: center;
  padding: 40px;
}

.preview-not-supported .el-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-info {
  text-align: left;
}

.preview-info p {
  margin: 5px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
  }
  
  .preview-footer {
    flex-direction: column;
    gap: 15px;
  }
}
</style> 