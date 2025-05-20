<template>
  <!-- 单层菜单 -->
  <el-menu-item v-if="!hasChildren" :index="basePath">
    <el-icon v-if="icon">
      <component :is="icon" />
    </el-icon>
    <span>{{ title }}</span>
  </el-menu-item>
  
  <!-- 多层菜单 -->
  <el-sub-menu v-else :index="basePath" popper-append-to-body>
    <template #title>
      <el-icon v-if="icon">
        <component :is="icon" />
      </el-icon>
      <span>{{ title }}</span>
    </template>
    
    <!-- 递归渲染子菜单 -->
    <sidebar-item 
      v-for="child in item.children" 
      :key="child.path" 
      :item="child" 
      :base-path="resolvePath(child.path)" 
    />
  </el-sub-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import {
  House,
  Setting,
  Notebook,
  Document,
  Edit,
  User,
  Menu,
  Location,
  Folder,
  Files,
  FolderOpened,
  Picture,
  Upload,
  Collection,
  CollectionTag,
  ChatDotRound,
  PriceTag,
  DataAnalysis
} from '@element-plus/icons-vue'

// 定义属性
const props = defineProps({
  item: {
    type: Object as () => RouteRecordRaw,
    required: true
  },
  basePath: {
    type: String,
    required: true
  }
})

// 所有可用的图标映射
const iconMap: Record<string, any> = {
  'el-icon-s-home': House,
  'el-icon-s-tools': Setting,
  'el-icon-s-order': Notebook,
  'el-icon-document': Document,
  'el-icon-edit': Edit,
  'el-icon-user': User,
  'el-icon-location': Location,
  'el-icon-folder': Folder,
  'el-icon-files': Files,
  'el-icon-folder-opened': FolderOpened,
  'el-icon-picture': Picture,
  'el-icon-upload': Upload,
  'el-icon-collection': Collection,
  'el-icon-collection-tag': CollectionTag,
  'el-icon-chat-dot-round': ChatDotRound,
  'el-icon-price-tag': PriceTag,
  'el-icon-data-analysis': DataAnalysis
}

// 检查是否有子菜单
const hasChildren = computed(() => {
  return props.item.children && props.item.children.length > 0
})

// 获取图标组件
const icon = computed(() => {
  const { meta } = props.item
  if (meta && meta.icon) {
    return iconMap[meta.icon as string] || Menu
  }
  return null
})

// 获取菜单标题
const title = computed(() => {
  const { meta } = props.item
  return meta?.title || '未命名菜单'
})

// 生成完整路径
const resolvePath = (routePath: string) => {
  if (/^(https?:|mailto:|tel:)/.test(routePath)) {
    return routePath
  }
  return props.basePath === '/' 
    ? '/' + routePath 
    : props.basePath + '/' + routePath
}
</script> 