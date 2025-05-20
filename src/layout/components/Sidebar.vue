<template>
  <div class="sidebar-container">
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :unique-opened="true"
        router
      >
        <sidebar-item 
          v-for="route in filteredRoutes" 
          :key="route.path" 
          :item="route" 
          :base-path="route.path" 
        />
      </el-menu>
    </el-scrollbar>
    
    <div class="collapse-btn" @click="toggleCollapse">
      <el-icon :size="20">
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { routes } from '../../router'
import type { RouteRecordRaw } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import { Fold, Expand } from '@element-plus/icons-vue'

const route = useRoute()
const isCollapse = ref(false)

// 过滤不需要显示的路由
const filteredRoutes = computed(() => {
  return filterHiddenRoutes(routes)
})

// 过滤掉需要隐藏的路由
function filterHiddenRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.filter(route => {
    // 排除没有meta信息、重定向到首页、登录页面和隐藏的路由
    if (!route.meta || route.path === '/login' || route.meta.hidden) {
      return false
    }

    // 如果有子路由，检查是否有可显示的子路由
    if (route.children) {
      const showingChildren = filterHiddenRoutes(route.children)
      route.children = showingChildren
      return showingChildren.length > 0
    }

    return true
  })
}

// 获取当前激活的菜单
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta?.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

// 切换菜单的折叠/展开状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.sidebar-container {
  height: 100%;
  position: relative;
  background-color: #304156;
}

.el-menu-vertical {
  height: calc(100% - 50px);
  border-right: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 210px;
}

.el-menu--collapse {
  width: 64px;
}

.scrollbar-wrapper {
  overflow-x: hidden !important;
}

.collapse-btn {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bfcbd9;
  background-color: #263445;
  cursor: pointer;
  transition: background-color 0.3s;
}

.collapse-btn:hover {
  background-color: #1f2d3d;
}
</style> 