<template>
  <div class="nav-container">
    <!-- Logo区域优化 -->
    <div class="logo-area">
      <img 
        src="@/assets/logo.png" 
        alt="Logo"
        class="logo-img"
      >
      <h2 class="logo-title">后台管理系统</h2>
    </div>
    
    
    
    <!-- 右侧用户操作区 -->
    <div class="right-menu">
      <el-dropdown>
        <span class="el-dropdown-link">
          <el-avatar :size="30" src="@/assets/avatar.png" />
          <span>管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'  // Add ref import here
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/store/permission'

const route = useRoute()
const permissionStore = usePermissionStore()
const isCollapse = ref(false)  // Now this will work


</script>

<style scoped>
.nav-container {
  height: 60px;
  background-color: #304156;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

/* 新增Logo样式 */
.logo-area {
  display: flex;
  align-items: center;
  width: 210px;
  padding: 0 20px;
  height: 100%;
}

.logo-img {
  width: 32px;  /* 固定宽度 */
  height: 32px; /* 固定高度 */
  object-fit: contain; /* 保持比例 */
  margin-right: 10px;
}

.logo-title {
  font-size: 16px;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}



.right-menu {
  margin-right: 20px;
}
</style>