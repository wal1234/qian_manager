<template>
  <div class="dashboard-container">
    <h1>欢迎使用系统管理平台</h1>
    <div class="dashboard-content">
      <el-row :gutter="20">
        <el-col :span="8" v-for="(item, index) in quickActions" :key="index">
          <el-card shadow="hover" class="quick-action-card" @click="handleAction(item.path)">
            <div class="action-icon">
              <i :class="item.icon"></i>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const quickActions = [
  {
    title: '用户管理',
    description: '管理系统用户信息',
    icon: 'el-icon-user',
    path: '/system/users'
  },
  {
    title: '系统参数',
    description: '管理系统配置参数',
    icon: 'el-icon-setting',
    path: '/system/params'
  }
]

const handleAction = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.dashboard-container {
  padding: 30px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.dashboard-content {
  margin-top: 20px;
}

.quick-action-card {
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.3s;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.quick-action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.action-icon {
  font-size: 28px;
  margin-bottom: 15px;
  color: #667eea;
}

h1 {
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
  text-align: center;
}
</style>