<template>
  <div class="log-detail-container">
    <div class="detail-header">
      <h2>登录日志详情</h2>
      <div class="detail-actions">
        <el-button @click="handleBack" plain>
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>

    <el-card shadow="hover" class="detail-card" v-loading="loading">
      <el-descriptions title="基本信息" :column="2" border>
        <el-descriptions-item label="访问编号">{{ logDetail.infoId }}</el-descriptions-item>
        <el-descriptions-item label="用户名称">{{ logDetail.userName }}</el-descriptions-item>
        <el-descriptions-item label="登录状态">
          <el-tag v-if="logDetail.status === '0'" type="success" effect="light">成功</el-tag>
          <el-tag v-else-if="logDetail.status === '1'" type="danger" effect="light">失败</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作信息">{{ logDetail.msg }}</el-descriptions-item>
        <el-descriptions-item label="登录时间">{{ logDetail.loginTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="登录环境" :column="2" border>
        <el-descriptions-item label="登录地址">{{ logDetail.ipaddr }}</el-descriptions-item>
        <el-descriptions-item label="登录地点">{{ logDetail.loginLocation }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ logDetail.browser }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ logDetail.os }}</el-descriptions-item>
      </el-descriptions>

      <template v-if="logDetail.loginParams">
        <el-divider />
        <el-descriptions title="登录参数" :column="1" border>
          <el-descriptions-item label="登录参数">
            <pre class="param-pre">{{ formatJson(logDetail.loginParams) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <template v-if="logDetail.status === '1' && logDetail.errorStack">
        <el-divider />
        <el-descriptions title="错误详情" :column="1" border>
          <el-descriptions-item label="错误堆栈">
            <pre class="error-pre">{{ logDetail.errorStack }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

// 日志详情数据
const logDetail = ref<any>({})

// 获取日志详情
const getLogDetail = () => {
  const infoId = route.params.id
  if (!infoId) {
    ElMessage.error('参数错误')
    return
  }

  loading.value = true
  // 模拟API调用获取登录日志详情
  setTimeout(() => {
    // 这里应该是实际API调用获取日志详情
    logDetail.value = {
      infoId: infoId,
      userName: 'admin',
      ipaddr: '127.0.0.1',
      loginLocation: '内网IP',
      browser: 'Chrome 114.0.0.0',
      os: 'Windows 10 x64',
      status: '0',
      msg: '登录成功',
      loginTime: '2023-07-01 08:30:00',
      loginParams: {
        username: 'admin',
        rememberMe: true,
        loginType: 'account'
      },
      errorStack: null
    }
    loading.value = false
  }, 500)
}

// 格式化JSON
const formatJson = (jsonObj: any) => {
  try {
    return JSON.stringify(jsonObj, null, 2)
  } catch (e) {
    return jsonObj
  }
}

// 返回列表页
const handleBack = () => {
  router.push('/system/loginlog')
}

// 页面初始化
onMounted(() => {
  getLogDetail()
})
</script>

<style scoped>
.log-detail-container {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.detail-card {
  margin-bottom: 20px;
}

.param-pre, .error-pre {
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.error-pre {
  color: #f56c6c;
  background-color: #fef0f0;
}
</style> 