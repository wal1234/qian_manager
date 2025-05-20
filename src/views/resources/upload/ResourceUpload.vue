<template>
  <div class="resource-upload-container">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <h2>资源上传</h2>
          <el-button type="primary" @click="goToResourceList">返回资源列表</el-button>
        </div>
      </template>
      
      <el-form ref="formRef" :model="resourceForm" :rules="rules" label-width="100px">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资源名称" prop="name">
              <el-input v-model="resourceForm.name" placeholder="请输入资源名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源分类" prop="categoryId">
              <el-cascader
                v-model="resourceForm.categoryId"
                :options="categories"
                :props="{ checkStrictly: true, value: 'id', label: 'name' }"
                placeholder="请选择资源分类"
                clearable
              ></el-cascader>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资源标签" prop="tags">
              <el-select
                v-model="resourceForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请输入标签，回车确认"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tagOptions"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源状态" prop="status">
              <el-radio-group v-model="resourceForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="资源描述" prop="description">
          <el-input
            v-model="resourceForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资源描述"
          ></el-input>
        </el-form-item>
        
        <!-- 上传区域 -->
        <el-divider content-position="left">资源上传</el-divider>
        <div class="upload-section">
          <el-upload
            ref="uploadRef"
            drag
            action="#"
            :http-request="customUpload"
            :before-upload="beforeUpload"
            :on-remove="handleRemove"
            :file-list="fileList"
            :limit="1"
            :auto-upload="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持各种类型的文件，单个文件大小不超过500MB
              </div>
            </template>
          </el-upload>
          
          <div class="file-info" v-if="fileList.length > 0">
            <h3>文件信息</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="文件名称">{{ fileList[0].name }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatFileSize(fileList[0].size) }}</el-descriptions-item>
              <el-descriptions-item label="文件类型">{{ fileList[0].type || '未知' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="resetForm">重置表单</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">上传资源</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';

interface Category {
  id: number;
  name: string;
  children?: Category[];
}

interface UploadFile {
  name: string;
  size: number;
  type?: string;
  [key: string]: any;
}

interface ResourceForm {
  name: string;
  categoryId: number | null;
  tags: string[];
  status: number;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

const router = useRouter();
const formRef = ref();
const uploadRef = ref();
const fileList = ref<UploadFile[]>([]);
const uploading = ref(false);

// 资源表单数据
const resourceForm = reactive<ResourceForm>({
  name: '',
  categoryId: null,
  tags: [],
  status: 1,
  description: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  fileType: ''
});

// 标签选项
const tagOptions = ref(['文档', '图片', '视频', '音频', '压缩包', '其他']);

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

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择资源分类', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ]
};

// 上传前检查
const beforeUpload = (file: File) => {
  // 检查文件大小（500MB）
  const isLt500M = file.size / 1024 / 1024 < 500;
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB!');
    return false;
  }
  return true;
};

interface UploadOptions {
  file: File;
  [key: string]: any;
}

// 自定义上传处理
const customUpload = async (options: UploadOptions) => {
  const { file } = options;
  try {
    uploading.value = true;
    // 这里应该调用实际的上传API
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟成功响应
    const response = {
      code: 200,
      data: {
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type
      }
    };
    
    // 更新表单数据
    resourceForm.fileUrl = response.data.url;
    resourceForm.fileName = response.data.name;
    resourceForm.fileSize = response.data.size;
    resourceForm.fileType = response.data.type;
    
    ElMessage.success('文件上传成功');
  } catch (error) {
    ElMessage.error('文件上传失败');
    console.error('上传错误:', error);
  } finally {
    uploading.value = false;
  }
};

// 移除文件
const handleRemove = () => {
  resourceForm.fileUrl = '';
  resourceForm.fileName = '';
  resourceForm.fileSize = 0;
  resourceForm.fileType = '';
};

// 格式化文件大小
const formatFileSize = (size: number) => {
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

// 提交上传
const submitUpload = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    if (fileList.value.length === 0) {
      ElMessage.warning('请选择要上传的文件');
      return;
    }
    
    // 手动触发文件上传
    uploadRef.value.submit();
    
    // 模拟保存资源信息到服务器
    uploading.value = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success('资源上传成功');
    router.push('/resources/list');
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    uploading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  if (!formRef.value) return;
  formRef.value.resetFields();
  fileList.value = [];
  handleRemove();
};

// 返回资源列表
const goToResourceList = () => {
  router.push('/resources/list');
};

// 初始化时获取分类数据
onMounted(() => {
  // 这里应该调用API获取实际的分类数据
  console.log('组件已挂载，可以加载实际分类数据');
});
</script>

<style scoped>
.resource-upload-container {
  padding: 20px;
}

.upload-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-section {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.file-info {
  margin-top: 20px;
  flex: 1;
  min-width: 300px;
}

.form-actions {
  margin-top: 30px;
  text-align: right;
}

.el-upload {
  width: 100%;
  max-width: 400px;
}

.el-upload-dragger {
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .upload-section {
    flex-direction: column;
  }
  
  .file-info {
    width: 100%;
  }
}
</style> 