<template>
  <div class="sidebar-container">
    <el-menu
      :default-active="activeMenu"
      mode="vertical"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      :router="true"
      :collapse="isCollapse"
    >
      <!-- Dashboard -->
      <el-menu-item index="/dashboard">
        <el-icon><HomeFilled /></el-icon>
        <span>仪表盘</span>
      </el-menu-item>

      <!-- 系统管理 -->
      <el-sub-menu index="/system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </template>
        <el-menu-item index="/system/params">
          <el-icon><Edit /></el-icon>
          <span>系统参数管理</span>
        </el-menu-item>
        <el-menu-item index="/system/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-sub-menu>

      <!-- 博客管理 -->
      <el-sub-menu index="/blog">
        <template #title>
          <el-icon><Notebook /></el-icon>
          <span>博客管理</span>
        </template>
        <el-menu-item index="/blog/edit">
          <el-icon><EditPen /></el-icon>
          <span>新增博客</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { 
  HomeFilled, 
  Setting, 
  Edit, 
  User, 
  Notebook, 
  EditPen 
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapse = ref(false)
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar-container {
  height: 100%;
  background-color: #304156;
  transition: all 0.3s;
}

.el-menu {
  border-right: none;
}

.el-menu-item {
  margin: 6px 8px;
  padding: 12px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.el-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.15) !important;
  transform: translateX(2px);
}

.el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.25) !important;
  font-weight: 500;
}

.el-sub-menu .el-menu-item {
  padding-left: 16px !important;
}

.el-icon {
  margin-right: 8px;
  font-size: 18px;
}
</style>