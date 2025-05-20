<template>
  <div class="blog-detail-container">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 博客内容 -->
    <template v-else>
      <!-- 固定顶部操作栏 -->
      <div class="detail-header" :class="{ 'header-fixed': isScrolled }">
        <div class="header-left">
          <el-button @click="goBack" :icon="ArrowLeft">返回列表</el-button>
        </div>
        <div class="header-center" v-if="isScrolled">
          <div class="header-title">{{ blog.title }}</div>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button @click="toggleLike" :type="isLiked ? 'primary' : 'default'" :icon="isLiked ? StarFilled : Star">
              {{ likeCount }}
            </el-button>
            <el-button @click="handleShare" :icon="Share"></el-button>
            <el-button type="primary" @click="handleEdit" :icon="Edit">编辑</el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="blog-main-content">
        <!-- 左侧内容区 -->
        <div class="blog-content-wrapper">
          <!-- 博客标题和基本信息 -->
          <div class="blog-title-section">
            <h1 class="blog-title">{{ blog.title }}</h1>
            <div class="blog-meta">
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(blog.createTime) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ blog.author }}</span>
              </div>
              <div class="meta-item">
                <el-icon><View /></el-icon>
                <span>{{ blog.views }} 阅读</span>
              </div>
              <div class="meta-item">
                <el-tag v-for="tag in blog.tags" :key="tag" size="small" class="tag-item" effect="light">{{ tag }}</el-tag>
              </div>
            </div>
          </div>

          <!-- 博客封面 -->
          <div v-if="blog.cover" class="blog-cover">
            <el-image :src="blog.cover" fit="cover" :preview-src-list="[blog.cover]" loading="lazy" />
          </div>

          <!-- 博客内容 -->
          <div class="blog-content">
            <div class="markdown-content" v-html="markdownHtml" ref="contentRef"></div>
          </div>

          <!-- 底部信息 -->
          <div class="blog-footer">
            <div class="blog-category">
              <el-icon><Collection /></el-icon>
              <span>分类：</span>
              <el-tag type="success">{{ getCategoryName(blog.category) }}</el-tag>
            </div>
            <div class="blog-actions">
              <el-button type="primary" :plain="!isLiked" @click="toggleLike" :icon="isLiked ? StarFilled : Star">
                {{ isLiked ? '已点赞' : '点赞' }} ({{ likeCount }})
              </el-button>
              
              <el-dropdown trigger="click" @command="handleShareOption">
                <el-button type="info" plain :icon="Share">分享</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="weixin"><el-icon><ChatDotSquare /></el-icon> 微信</el-dropdown-item>
                    <el-dropdown-item command="weibo"><el-icon><Promotion /></el-icon> 微博</el-dropdown-item>
                    <el-dropdown-item command="twitter"><i class="fab fa-twitter"></i> Twitter</el-dropdown-item>
                    <el-dropdown-item command="copy"><el-icon><DocumentCopy /></el-icon> 复制链接</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <!-- 上一篇/下一篇导航 -->
          <div class="blog-navigation">
            <div class="nav-item prev" v-if="prevBlog.id" @click="navigateToBlog(prevBlog.id)">
              <div class="nav-label"><el-icon><ArrowLeft /></el-icon> 上一篇</div>
              <div class="nav-title">{{ prevBlog.title }}</div>
            </div>
            <div class="nav-item next" v-if="nextBlog.id" @click="navigateToBlog(nextBlog.id)">
              <div class="nav-label">下一篇 <el-icon><ArrowRight /></el-icon></div>
              <div class="nav-title">{{ nextBlog.title }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧目录区 -->
        <div class="blog-toc-container" v-if="tocItems.length > 0">
          <div class="toc-title">
            <el-icon><Menu /></el-icon> 目录
          </div>
          <div class="toc-list">
            <div 
              v-for="(item, index) in tocItems" 
              :key="index" 
              class="toc-item"
              :class="{ 
                'toc-h1': item.level === 1, 
                'toc-h2': item.level === 2, 
                'toc-h3': item.level === 3,
                'toc-active': activeTocIndex === index 
              }"
              @click="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 分享链接复制提示 -->
    <el-dialog v-model="shareDialogVisible" :title="shareDialogTitle" width="300px" center>
      <div class="share-dialog-content">
        <div v-if="shareType === 'qrcode'" class="qrcode-container">
          <div ref="qrcodeRef" class="qrcode"></div>
          <p>扫描二维码分享</p>
        </div>
        <div v-else-if="shareType === 'link'" class="copy-link-container">
          <el-input v-model="shareLinkUrl" readonly>
            <template #append>
              <el-button @click="copyShareLink">复制</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>

    <!-- 返回顶部按钮 -->
    <el-backtop :right="20" :bottom="90" :visibility-height="300">
      <div class="backtop-inner">
        <el-icon><Top /></el-icon>
      </div>
    </el-backtop>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Edit, Calendar, User, View, Menu,
  Collection, Star, StarFilled, Share, ArrowRight,
  ChatDotSquare, Promotion, DocumentCopy, Top
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const isLiked = ref(false)
const likeCount = ref(0)
const isScrolled = ref(false)
const contentRef = ref<HTMLElement | null>(null)
const activeTocIndex = ref(-1)
const shareDialogVisible = ref(false)
const shareDialogTitle = ref('')
const shareType = ref('')
const shareLinkUrl = ref('')
const qrcodeRef = ref<HTMLElement | null>(null)

// 目录项类型定义
interface TocItem {
  id: string
  level: number
  text: string
  element: HTMLElement
}

// 目录数据
const tocItems = ref<TocItem[]>([])

// 博客数据
const blog = reactive({
  id: 0,
  title: '',
  content: '',
  cover: '',
  category: '',
  tags: [] as string[],
  author: '',
  createTime: '',
  updateTime: '',
  views: 0,
  comments: 0,
  status: ''
})

// 上一篇/下一篇博客
const prevBlog = reactive({ id: 0, title: '' })
const nextBlog = reactive({ id: 0, title: '' })

// 分类名称映射
const categoryMap = {
  'tech': '技术博客',
  'life': '生活随笔',
  'tutorial': '教程分享',
  'design': '产品设计',
  'frontend': '前端开发',
  'backend': '后端开发'
}

// 将Markdown转换为HTML
const markdownHtml = computed(() => {
  if (!blog.content) return ''
  
  try {
    // 使用简单的HTML转换而不是引入markdown-it
    let html = blog.content
      .replace(/^# (.*$)/gm, '<h1 id="heading-$1">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 id="heading-$1">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 id="heading-$1">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
    // 增强代码块处理，添加简单的语法高亮和语言标签
    html = html.replace(/```(javascript|js|ts|typescript)\n([\s\S]*?)```/gi, (match, lang, code) => {
      // 简单模拟语法高亮 - JS/TS语法
      let highlightedCode = code
        .replace(/\n/g, '<br>')
        // 关键字高亮
        .replace(/\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default|async|await|try|catch|new|this|super)\b/g, '<span class="keyword">$1</span>')
        // 字符串高亮
        .replace(/(['"`])(.*?)\1/g, '<span class="string">$1$2$1</span>')
        // 注释高亮
        .replace(/\/\/(.*?)(<br>|$)/g, '<span class="comment">//$1</span>$2')
        // 多行注释
        .replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>')
        // 函数高亮
        .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="function">$1</span>(')
        // 数字高亮
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')
        // 布尔值高亮
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="boolean">$1</span>')
        // 运算符高亮
        .replace(/([=+\-*/%&|^!<>]+)/g, '<span class="operator">$1</span>');
        
      const langDisplay = lang === 'js' ? 'javascript' : (lang === 'ts' ? 'typescript' : lang);
      return `<div class="code-block"><div class="code-header"><span class="code-lang">${langDisplay}</span><span class="code-copy" title="复制代码">复制</span></div><pre><code>${highlightedCode}</code></pre></div>`;
    });
    
    // 处理CSS代码块
    html = html.replace(/```(css|scss|sass|less)\n([\s\S]*?)```/gi, (match, lang, code) => {
      // CSS语法高亮
      let highlightedCode = code
        .replace(/\n/g, '<br>')
        // 选择器高亮
        .replace(/([\.\#\:\-a-zA-Z0-9_\s\[\]\*\>\+\~]+)(\s*\{)/g, '<span class="selector">$1</span>$2')
        // 属性高亮
        .replace(/(\s*)([\-a-zA-Z0-9_]+)(\s*:)/g, '$1<span class="property">$2</span>$3')
        // 值高亮
        .replace(/:\s*([^;}<br>]+)/g, ': <span class="value">$1</span>')
        // 单位高亮
        .replace(/([\d\.]+)(px|em|rem|%|vh|vw|s|ms|deg|fr|ch)/g, '<span class="number">$1</span><span class="unit">$2</span>')
        // 变量高亮
        .replace(/(var\()(--[a-zA-Z0-9_-]+)(\))/g, '<span class="variable">$1$2$3</span>')
        // 注释高亮
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
        
      return `<div class="code-block"><div class="code-header"><span class="code-lang">${lang}</span><span class="code-copy" title="复制代码">复制</span></div><pre><code>${highlightedCode}</code></pre></div>`;
    });
    
    // 处理HTML代码块
    html = html.replace(/```(html|xml)\n([\s\S]*?)```/gi, (match, lang, code) => {
      // HTML语法高亮
      let highlightedCode = code
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        // 标签高亮
        .replace(/(&lt;\/?)([a-zA-Z0-9_-]+)/g, '$1<span class="tag">$2</span>')
        // 属性名高亮
        .replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*)/g, '$1<span class="attr-name">$2</span>$3')
        // 属性值高亮
        .replace(/=\s*(["'])(.*?)\1/g, '=<span class="attr-value">$1$2$1</span>')
        // 注释高亮
        .replace(/(&lt;!--)([\s\S]*?)(--&gt;)/g, '<span class="comment">$1$2$3</span>');
      
      return `<div class="code-block"><div class="code-header"><span class="code-lang">${lang}</span><span class="code-copy" title="复制代码">复制</span></div><pre><code>${highlightedCode}</code></pre></div>`;
    });
    
    // 处理其他类型的代码块
    html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const langName = lang || 'plaintext';
      return `<div class="code-block"><div class="code-header"><span class="code-lang">${langName}</span><span class="code-copy" title="复制代码">复制</span></div><pre><code>${code.replace(/\n/g, '<br>')}</code></pre></div>`;
    });
    
    // 处理剩余的换行
    html = html.replace(/\n/g, '<br>');
    
    return html;
  } catch (error) {
    console.error('Markdown转换失败:', error)
    return blog.content
  }
})

// 获取分类名称
const getCategoryName = (category: string) => {
  return categoryMap[category as keyof typeof categoryMap] || category
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 返回列表
const goBack = () => {
  router.push('/blog/list')
}

// 编辑博客
const handleEdit = () => {
  router.push(`/blog/edit?id=${blog.id}`)
}

// 点赞功能
const toggleLike = () => {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
  
  // 实际应用中应该调用API保存点赞状态
  ElMessage.success(isLiked.value ? '感谢点赞！' : '已取消点赞')
}

// 基础分享功能
const handleShare = () => {
  ElMessageBox.alert('分享功能开发中...', '分享', {
    confirmButtonText: '确定',
    callback: () => {
      ElMessage({
        type: 'info',
        message: '即将支持多种分享方式'
      })
    }
  })
}

// 处理分享选项
const handleShareOption = (command: string) => {
  const pageUrl = window.location.href
  
  switch (command) {
    case 'weixin':
      shareDialogTitle.value = '微信分享'
      shareType.value = 'qrcode'
      shareDialogVisible.value = true
      // 此处应该使用二维码生成库，例如qrcode.js
      setTimeout(() => {
        if (qrcodeRef.value) {
          // 简化处理，实际应使用qrcode库
          qrcodeRef.value.innerHTML = '【生成二维码】'
        }
      }, 100)
      break
    case 'weibo':
      window.open(`http://service.weibo.com/share/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(blog.title)}`, '_blank')
      break
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(pageUrl)}`, '_blank')
      break
    case 'copy':
      shareLinkUrl.value = pageUrl
      shareDialogTitle.value = '复制链接'
      shareType.value = 'link'
      shareDialogVisible.value = true
      break
  }
}

// 复制分享链接
const copyShareLink = () => {
  navigator.clipboard.writeText(shareLinkUrl.value).then(() => {
    ElMessage.success('链接已复制')
    shareDialogVisible.value = false
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 导航到其他博客
const navigateToBlog = (id: number) => {
  router.push(`/blog/detail/${id}`)
}

// 解析文章目录
const parseToc = () => {
  if (!contentRef.value) return
  
  const headings = contentRef.value.querySelectorAll('h1, h2, h3')
  const items: TocItem[] = []
  
  headings.forEach((heading) => {
    const h = heading as HTMLElement
    const level = parseInt(h.tagName.charAt(1))
    const text = h.textContent || ''
    const id = h.id || `toc-${items.length}`
    
    // 确保标题有id
    if (!h.id) {
      h.id = id
    }
    
    items.push({
      id,
      level,
      text,
      element: h
    })
  })
  
  tocItems.value = items
}

// 滚动到指定标题
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 检查滚动位置并更新活动目录项
const checkScrollPosition = () => {
  // 检查顶部栏固定
  isScrolled.value = window.scrollY > 80
  
  // 检查当前可见的标题
  if (tocItems.value.length > 0) {
    const scrollPosition = window.scrollY + 100
    
    // 找到当前可见的标题
    for (let i = tocItems.value.length - 1; i >= 0; i--) {
      const element = tocItems.value[i].element
      if (element.offsetTop <= scrollPosition) {
        activeTocIndex.value = i
        break
      }
    }
  }
}

// 获取博客数据
const fetchBlogData = async () => {
  isLoading.value = true
  
  try {
    // 获取博客ID
    const blogId = route.params.id
    console.log('加载博客ID:', blogId)
    
    // 在真实应用中，这里应该调用API获取博客详情
    // const response = await fetch(`/api/blogs/${blogId}`)
    // const data = await response.json()
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟从API获取的数据
    const mockData = {
      id: Number(blogId),
      title: 'Vue3 组合式API最佳实践与代码高亮展示',
      content: `
# Vue3 组合式API最佳实践与代码高亮展示

## 引言

Vue3的组合式API（Composition API）为构建大型应用程序提供了更好的代码组织方式和可重用性。本文将深入探讨组合式API的最佳实践和性能优化技巧，并展示代码高亮效果。

## 为什么选择组合式API？

相比于Vue2的选项式API，组合式API具有以下优势：

- **更好的逻辑复用**：通过可复用的组合函数轻松提取和重用逻辑
- **更好的类型推断**：与TypeScript无缝协作
- **更小的打包体积**：支持更好的摇树优化
- **更灵活的代码组织**：按逻辑关注点组织代码，而不是选项类型

## 最佳实践

### 1. 使用 ref() 和 reactive()

\`\`\`javascript
// 推荐的方式
const count = ref(0)
const state = reactive({ foo: 1, bar: 2 })

// 应该避免的方式
const state = reactive({
  count: 0,
  foo: 1,
  bar: 2
})

// 使用ref更新值
function increment() {
  count.value++
  // 注意需要使用.value访问和修改ref值
  console.log('当前计数:', count.value)
}
\`\`\`

### 2. 使用生命周期钩子

\`\`\`javascript
import { onMounted, onUnmounted, onUpdated, onBeforeUnmount } from 'vue'

export default {
  setup() {
    // 数据初始化
    const data = ref(null)
    
    // 在组件挂载后执行
    onMounted(() => {
      console.log('组件已挂载')
      // 可以在这里进行DOM操作或初始化
      fetchData()
    })
    
    // 在组件更新后执行
    onUpdated(() => {
      console.log('组件已更新')
    })
    
    // 在组件卸载前执行清理工作
    onBeforeUnmount(() => {
      console.log('组件即将卸载')
      // 清理工作，例如移除事件监听器
    })
    
    // 组件卸载后执行
    onUnmounted(() => {
      console.log('组件已卸载')
    })
    
    // 模拟数据获取
    const fetchData = async () => {
      try {
        // 异步获取数据
        const response = await fetch('/api/data')
        data.value = await response.json()
      } catch (error) {
        console.error('获取数据失败:', error)
      }
    }
    
    return { data }
  }
}
\`\`\`

### 3. 使用计算属性和监听器

\`\`\`javascript
import { ref, computed, watch, watchEffect } from 'vue'

export default {
  setup() {
    const firstName = ref('John')
    const lastName = ref('Doe')
    
    // 计算属性
    const fullName = computed(() => {
      return firstName.value + ' ' + lastName.value
    })
    
    // 监听单个响应式引用
    watch(firstName, (newValue, oldValue) => {
      console.log('firstName 变化:', oldValue, '->', newValue)
    })
    
    // 监听多个源
    watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
      console.log('姓名变化:', oldFirst, oldLast, '->', newFirst, newLast)
    })
    
    // watchEffect会自动追踪其依赖
    watchEffect(() => {
      console.log('当前全名:', fullName.value)
    })
    
    return {
      firstName,
      lastName,
      fullName
    }
  }
}
\`\`\`

## TypeScript 集成示例

TypeScript与Vue3组合式API配合使用非常顺畅：

\`\`\`typescript
import { defineComponent, ref, computed, PropType } from 'vue'

// 定义类型
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

export default defineComponent({
  props: {
    initialUsers: {
      type: Array as PropType<User[]>,
      required: true
    }
  },
  
  setup(props) {
    // 响应式状态
    const users = ref<User[]>(props.initialUsers)
    const searchQuery = ref('')
    
    // 计算属性带有类型推断
    const filteredUsers = computed(() => {
      return users.value.filter(user => 
        user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })
    
    // 带类型的方法
    const addUser = (user: User) => {
      users.value.push(user)
    }
    
    const removeUser = (id: number) => {
      const index = users.value.findIndex(user => user.id === id)
      if (index !== -1) {
        users.value.splice(index, 1)
      }
    }
    
    return {
      users,
      searchQuery,
      filteredUsers,
      addUser,
      removeUser
    }
  }
})
\`\`\`

## CSS 样式示例

\`\`\`css
/* 基本变量定义 */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --danger-color: #e74c3c;
  --text-color: #333;
  --light-gray: #f5f5f5;
  --border-radius: 4px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: darken(var(--primary-color), 10%);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .component {
    padding: 1rem;
  }
  
  .btn {
    display: block;
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
\`\`\`

## HTML 模板示例

\`\`\`html
<template>
  <div class="user-profile">
    <header class="profile-header">
      <img :src="user.avatar" alt="User avatar" class="avatar" />
      <h1>{{ user.name }}</h1>
      <p class="user-role" :class="roleClass">{{ user.role }}</p>
    </header>
    
    <section class="profile-content">
      <div class="stats">
        <div class="stat-item">
          <strong>{{ user.followers }}</strong>
          <span>Followers</span>
        </div>
        <div class="stat-item">
          <strong>{{ user.following }}</strong>
          <span>Following</span>
        </div>
        <div class="stat-item">
          <strong>{{ user.posts }}</strong>
          <span>Posts</span>
        </div>
      </div>
      
      <p class="bio">{{ user.bio }}</p>
      
      <div class="actions">
        <button class="btn primary" @click="followUser">
          {{ isFollowing ? 'Unfollow' : 'Follow' }}
        </button>
        <button class="btn secondary" @click="sendMessage">
          Message
        </button>
      </div>
    </section>
  </div>
</template>
\`\`\`

## 性能优化技巧

1. **避免不必要的响应性**：对于不需要响应性的大型数据结构，使用 \`shallowRef\` 或 \`shallowReactive\`

\`\`\`javascript
// 只有顶层属性是响应式的
const state = shallowReactive({
  user: {
    name: 'John',
    address: {
      city: 'New York',
      country: 'USA'
    }
  }
})

// 只有.value是响应式的，不会追踪内部对象变化
const data = shallowRef({
  items: [1, 2, 3],
  config: { 
    enabled: true 
  }
})
\`\`\`

2. **使用 v-once 和 v-memo**：对于不经常更新的内容

\`\`\`html
<!-- 只渲染一次，即使数据变化也不会更新 -->
<div v-once>{{ expensiveComputation() }}</div>

<!-- 只有当id变化时才会重新渲染 -->
<div v-memo="[item.id]">
  <ExpensiveComponent :item="item" />
</div>
\`\`\`

3. **异步组件和动态导入**：减小初始加载体积

\`\`\`javascript
// 异步组件
const AsyncComponent = defineAsyncComponent(() => 
  import('./components/HeavyComponent.vue')
)

// 带加载和错误状态的异步组件
const AsyncComponentWithOptions = defineAsyncComponent({
  loader: () => import('./components/HeavyComponent.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
\`\`\`

## 结论

组合式API为Vue开发者提供了更强大、更灵活的工具，但也需要我们学习新的最佳实践。通过本文的指南，您可以更有效地使用Vue3构建高性能应用。代码高亮展示也帮助您更清晰地阅读和理解代码片段。
      `,
      cover: 'https://placeholder.pics/svg/1200x400/DEDEDE/555555/Vue3%20Cover%20Image',
      category: 'frontend',
      tags: ['Vue3', 'JavaScript', '前端开发', '性能优化', 'TypeScript'],
      author: '张三',
      createTime: '2023-05-15T08:30:00',
      updateTime: '2023-05-16T10:15:00',
      views: 1540,
      comments: 32,
      status: 'published'
    }
    
    // 填充数据
    Object.assign(blog, mockData)
    
    // 模拟上一篇/下一篇博客
    prevBlog.id = Number(blogId) - 1
    prevBlog.title = prevBlog.id > 0 ? `上一篇博客标题 #${prevBlog.id}` : ''
    
    nextBlog.id = Number(blogId) + 1
    nextBlog.title = `下一篇博客标题 #${nextBlog.id}`
    
    // 模拟点赞状态
    isLiked.value = Math.random() > 0.5
    likeCount.value = Math.floor(Math.random() * 100) + (isLiked.value ? 1 : 0)
    
  } catch (error) {
    console.error('获取博客详情失败:', error)
    ElMessage.error('获取博客详情失败，请重试')
  } finally {
    isLoading.value = false
    // 等待DOM更新后解析目录
    nextTick(() => {
      parseToc()
    })
  }
}

// 监听滚动事件
const setupScrollListener = () => {
  window.addEventListener('scroll', checkScrollPosition)
  checkScrollPosition() // 初始检查
}

// 移除滚动监听
const removeScrollListener = () => {
  window.removeEventListener('scroll', checkScrollPosition)
}

// 初始化代码复制功能
const initCodeCopyButtons = () => {
  if (!contentRef.value) return;
  
  // 获取所有代码块复制按钮
  const copyButtons = contentRef.value.querySelectorAll('.code-copy');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // 获取当前代码块内容
      const codeBlock = (e.target as HTMLElement).closest('.code-block');
      if (!codeBlock) return;
      
      const codeElement = codeBlock.querySelector('code');
      if (!codeElement) return;
      
      // 获取代码文本并清理HTML标签和<br>
      let codeText = codeElement.innerHTML
        .replace(/<span class="[^"]+">|<\/span>/g, '')
        .replace(/<br>/g, '\n')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      
      // 复制到剪贴板
      navigator.clipboard.writeText(codeText)
        .then(() => {
          const copyBtn = e.target as HTMLElement;
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '已复制!';
          copyBtn.classList.add('copied');
          
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
          }, 2000);
        })
        .catch(err => {
          console.error('无法复制代码: ', err);
          ElMessage.error('复制失败，请手动复制');
        });
    });
  });
}

// 监听博客内容变化，初始化复制功能
watch(() => markdownHtml.value, () => {
  nextTick(() => {
    initCodeCopyButtons();
    parseToc();
  });
}, { immediate: false });

onMounted(() => {
  fetchBlogData();
  setupScrollListener();
  // 添加初始化代码复制功能
  nextTick(() => {
    initCodeCopyButtons();
  });
})

onUnmounted(() => {
  removeScrollListener()
})
</script>

<style scoped>
.blog-detail-container {
  position: relative;
  margin: 0 auto;
  padding: 20px;
  color: #2c3e50;
  background-color: #f9f9f9;
  min-height: calc(100vh - 40px);
}

.loading-container {
  padding: 40px 0;
  max-width: 900px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 30px;
}

/* 代码块样式 */
.markdown-content .code-block {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  position: relative;
}

.markdown-content .code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1c1f26;
  padding: 8px 16px;
  font-family: 'SFMono-Regular', Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 12px;
  color: #abb2bf;
  border-bottom: 1px solid #343a46;
}

.markdown-content .code-lang {
  text-transform: uppercase;
  font-weight: bold;
  color: #61afef;
  padding: 2px 6px;
  background-color: rgba(97, 175, 239, 0.1);
  border-radius: 4px;
}

.markdown-content .code-copy {
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  color: #abb2bf;
  font-size: 12px;
  user-select: none;
}

.markdown-content .code-copy:hover {
  background-color: #373e4d;
  color: #fff;
}

.markdown-content .code-copy.copied {
  background-color: #98c379;
  color: #fff;
}

.markdown-content pre {
  background-color: #282c34;
  padding: 16px;
  overflow: auto;
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #abb2bf;
  border: none;
  scrollbar-width: thin;
  scrollbar-color: #4b5263 #282c34;
}

.markdown-content pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.markdown-content pre::-webkit-scrollbar-track {
  background: #282c34;
  border-radius: 0 0 8px 0;
}

.markdown-content pre::-webkit-scrollbar-thumb {
  background-color: #4b5263;
  border-radius: 4px;
}

.markdown-content pre::-webkit-scrollbar-thumb:hover {
  background-color: #5c6370;
}

.markdown-content pre::before {
  display: none;
}

.markdown-content pre::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  border-radius: 0 0 8px 8px;
  box-shadow: inset 0 -4px 6px -4px rgba(0, 0, 0, 0.2);
}

.markdown-content code {
  font-family: 'SFMono-Regular', Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 14px;
  background-color: rgba(224, 108, 117, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
  color: #e06c75;
  font-weight: 500;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-weight: normal;
}

/* 语法高亮样式 */
.markdown-content pre .keyword {
  color: #c678dd;
  font-weight: 500;
}

.markdown-content pre .string {
  color: #98c379;
}

.markdown-content pre .comment {
  color: #7f848e;
  font-style: italic;
}

.markdown-content pre .function {
  color: #61afef;
  font-weight: 500;
}

.markdown-content pre .number {
  color: #d19a66;
}

.markdown-content pre .boolean {
  color: #d19a66;
  font-weight: 500;
}

.markdown-content pre .operator {
  color: #56b6c2;
}

/* CSS 语法高亮 */
.markdown-content pre .selector {
  color: #e06c75;
}

.markdown-content pre .property {
  color: #56b6c2;
}

.markdown-content pre .value {
  color: #98c379;
}

.markdown-content pre .unit {
  color: #d19a66;
}

.markdown-content pre .variable {
  color: #c678dd;
}

/* HTML 语法高亮 */
.markdown-content pre .tag {
  color: #e06c75;
}

.markdown-content pre .attr-name {
  color: #d19a66;
}

.markdown-content pre .attr-value {
  color: #98c379;
}

.detail-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 16px 30px;
  z-index: 100;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  width: calc(100% - 40px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  border-radius: 0;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s;
  padding: 8px 30px;
  background-color: rgba(255, 255, 255, 0.95);
}

.header-center {
  flex: 1;
  text-align: center;
  overflow: hidden;
  margin: 0 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50vw;
  margin: 0 auto;
}

.blog-main-content {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.blog-content-wrapper {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 30px;
}

.blog-toc-container {
  width: 250px;
  position: sticky;
  top: 90px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  font-size: 14px;
}

.toc-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #303133;
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toc-item {
  cursor: pointer;
  line-height: 1.5;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  color: #606266;
}

.toc-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.toc-h1 {
  padding-left: 0;
  font-weight: 600;
}

.toc-h2 {
  padding-left: 16px;
}

.toc-h3 {
  padding-left: 32px;
  font-size: 0.9em;
  color: #909399;
}

.toc-active {
  background-color: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}

.blog-title-section {
  margin-bottom: 30px;
}

.blog-title {
  font-size: 32px;
  margin-bottom: 20px;
  color: #303133;
  font-weight: 600;
  line-height: 1.4;
}

.blog-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  color: #909399;
  font-size: 14px;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-item {
  margin-right: 5px;
}

.blog-cover {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.blog-cover .el-image {
  width: 100%;
  max-height: 450px;
  transition: transform 0.5s;
}

.blog-cover:hover .el-image {
  transform: scale(1.02);
}

.blog-content {
  margin-bottom: 40px;
  line-height: 1.8;
}

.markdown-content {
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.8;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 28px;
  margin-bottom: 18px;
  font-weight: 600;
  line-height: 1.4;
  position: relative;
}

.markdown-content h1 {
  padding-bottom: 0.4em;
  font-size: 2em;
  border-bottom: 1px solid #eee;
}

.markdown-content h2 {
  padding-bottom: 0.3em;
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
}

.markdown-content h3 {
  font-size: 1.25em;
}

.markdown-content p {
  margin: 16px 0;
}

.markdown-content strong {
  font-weight: 600;
  color: #333;
}

.markdown-content em {
  font-style: italic;
  color: #444;
}

.blog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #eee;
  margin-bottom: 30px;
}

.blog-category {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blog-actions {
  display: flex;
  gap: 10px;
}

.blog-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  border-top: 1px dashed #dcdfe6;
  padding-top: 20px;
  gap: 20px;
}

.nav-item {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
}

.nav-item:hover {
  background-color: #e4e7ed;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 6px;
}

.nav-title {
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prev {
  text-align: left;
}

.next {
  text-align: right;
}

.backtop-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 18px;
}

.share-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qrcode {
  width: 200px;
  height: 200px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.copy-link-container {
  width: 100%;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 响应式样式 */
@media (max-width: 992px) {
  .blog-main-content {
    flex-direction: column;
  }
  
  .blog-toc-container {
    width: 100%;
    position: static;
    margin-bottom: 20px;
    order: -1;
  }
}

@media (max-width: 768px) {
  .blog-title {
    font-size: 24px;
  }
  
  .blog-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detail-header {
    padding: 12px 16px;
  }
  
  .header-center {
    display: none;
  }
  
  .blog-footer {
    flex-direction: column;
    gap: 16px;
  }
  
  .blog-navigation {
    flex-direction: column;
    gap: 16px;
  }
  
  .nav-item {
    max-width: 100%;
  }
  
  .blog-content-wrapper {
    padding: 20px 15px;
  }
}
</style> 