<template>
  <div class="main-layout">
    <el-container>
      <el-aside width="210px">
        <sidebar />
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-content">
            <h2>管理系统</h2>
            <div class="user-info">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-avatar :size="32" :src="avatarUrl">{{ userInitials }}</el-avatar>
                  <span class="username">{{ username }}</span>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToUserProfile">个人信息</el-dropdown-item>
                    <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const router = useRouter()
const username = ref(localStorage.getItem('username') || '管理员')
const avatarUrl = ref('')

const userInitials = computed(() => {
  return username.value.substring(0, 1).toUpperCase()
})

const goToUserProfile = () => {
  router.push('/profile')
}

const logout = () => {
  // 清除localStorage和sessionStorage中的所有登录信息
  localStorage.removeItem('username')
  localStorage.removeItem('password')
  sessionStorage.removeItem('username')
  
  // 跳转到登录页面
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.el-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-left: 8px;
  font-size: 14px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style> 