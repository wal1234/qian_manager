<template>
  <div class="login-log-container">
    <div class="log-header">
      <h2>登录日志</h2>
      <div class="log-actions">
        <el-button @click="handleRefresh" plain>
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="danger" @click="handleCleanLog" plain :disabled="multiple" v-hasPermission="'system:loginlog:remove'">
          <el-icon><Delete /></el-icon>清空
        </el-button>
        <el-button type="primary" @click="handleExport" plain v-hasPermission="'system:loginlog:export'">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </div>
    </div>

    <el-card shadow="hover" class="log-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" class="log-search-form">
        <el-form-item label="登录地址" prop="ipaddr">
          <el-input v-model="queryParams.ipaddr" placeholder="请输入登录地址" clearable />
        </el-form-item>
        <el-form-item label="用户名称" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="登录状态" clearable>
            <el-option label="成功" value="0" />
            <el-option label="失败" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录时间" prop="loginTime">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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

      <!-- 登录日志表格 -->
      <el-table
        :data="logList"
        border
        v-loading="loading"
        @selection-change="handleSelectionChange"
        ref="logTableRef"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="infoId" label="访问编号" width="80" />
        <el-table-column prop="userName" label="用户名称" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column prop="ipaddr" label="登录地址" min-width="130" :show-overflow-tooltip="true" />
        <el-table-column prop="loginLocation" label="登录地点" min-width="130" :show-overflow-tooltip="true" />
        <el-table-column prop="browser" label="浏览器" min-width="130" :show-overflow-tooltip="true" />
        <el-table-column prop="os" label="操作系统" min-width="130" :show-overflow-tooltip="true" />
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" type="success" effect="light">成功</el-tag>
            <el-tag v-else type="danger" effect="light">失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msg" label="操作信息" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column prop="loginTime" label="登录时间" min-width="180" />
        <el-table-column label="操作" align="center" width="140">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="View"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
              v-hasPermission="'system:loginlog:remove'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Refresh, Download, View } from '@element-plus/icons-vue'
import { hasPermission } from '@/utils/permission'
import { useRouter } from 'vue-router'

const router = useRouter()

interface QueryParams {
  pageNum: number
  pageSize: number
  ipaddr: string
  userName: string
  status: string
  beginTime?: string
  endTime?: string
}

// 查询参数
const queryParams = ref<QueryParams>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: '',
  status: ''
})

// 日期范围
const dateRange = ref<string[]>([])

// 表格数据
const logList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const queryFormRef = ref()
const logTableRef = ref()

// 选中数组
const ids = ref<number[]>([])
const multiple = ref(true)

// 查询登录日志列表
const handleQuery = () => {
  loading.value = true
  
  // 处理日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.beginTime = dateRange.value[0]
    queryParams.value.endTime = dateRange.value[1]
  } else {
    queryParams.value.beginTime = undefined
    queryParams.value.endTime = undefined
  }
  
  // 模拟API调用获取登录日志列表
  setTimeout(() => {
    logList.value = [
      {
        infoId: 1,
        userName: 'admin',
        ipaddr: '127.0.0.1',
        loginLocation: '内网IP',
        browser: 'Chrome',
        os: 'Windows 10',
        status: '0',
        msg: '登录成功',
        loginTime: '2023-07-01 08:30:00'
      },
      {
        infoId: 2,
        userName: 'test',
        ipaddr: '192.168.1.2',
        loginLocation: '内网IP',
        browser: 'Firefox',
        os: 'Windows 10',
        status: '0',
        msg: '登录成功',
        loginTime: '2023-07-01 09:15:00'
      },
      {
        infoId: 3,
        userName: 'unknown',
        ipaddr: '203.156.34.12',
        loginLocation: '北京市 联通',
        browser: 'Chrome',
        os: 'Mac OS',
        status: '1',
        msg: '密码错误',
        loginTime: '2023-07-01 10:25:00'
      },
      {
        infoId: 4,
        userName: 'editor',
        ipaddr: '59.45.175.65',
        loginLocation: '上海市 电信',
        browser: 'Edge',
        os: 'Windows 11',
        status: '0',
        msg: '登录成功',
        loginTime: '2023-07-01 11:40:00'
      },
      {
        infoId: 5,
        userName: 'admin',
        ipaddr: '127.0.0.1',
        loginLocation: '内网IP',
        browser: 'Chrome',
        os: 'Windows 10',
        status: '0',
        msg: '登录成功',
        loginTime: '2023-07-02 08:15:00'
      }
    ]
    total.value = logList.value.length
    loading.value = false
  }, 500)
}

// 表格选择事件处理
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.infoId)
  multiple.value = !selection.length
}

// 重置查询
const resetQuery = () => {
  dateRange.value = []
  queryFormRef.value?.resetFields()
  queryParams.value.pageNum = 1
  handleQuery()
}

// 刷新列表
const handleRefresh = () => {
  handleQuery()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  queryParams.value.pageSize = size
  handleQuery()
}

// 分页页码改变
const handleCurrentChange = (page: number) => {
  queryParams.value.pageNum = page
  handleQuery()
}

// 删除按钮操作
const handleDelete = (row: any) => {
  const infoIds = row.infoId || ids.value
  ElMessageBox.confirm(
    `是否确认删除访问编号为"${infoIds}"的数据项?`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该是实际API调用删除登录日志
    ElMessage.success('删除成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 清空按钮操作
const handleCleanLog = () => {
  ElMessageBox.confirm(
    '是否确认清空所有登录日志数据项?',
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该是实际API调用清空登录日志
    ElMessage.success('清空成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消清空')
  })
}

// 导出按钮操作
const handleExport = () => {
  // 这里应该是实际API调用导出登录日志
  ElMessage.success('导出成功')
}

// 检查权限
const checkPermission = (permission: string) => {
  return hasPermission(permission)
}

// 查看详情
const handleViewDetail = (row: any) => {
  router.push(`/system/loginlog/detail/${row.infoId}`)
}

// 页面初始化
onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.login-log-container {
  padding: 20px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.log-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.log-actions {
  display: flex;
  gap: 10px;
}

.log-card {
  margin-bottom: 20px;
}

.log-search-form {
  margin-bottom: 20px;
  padding: 18px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 15px;
  text-align: right;
}
</style> 