<template>
  <div class="blog-edit-container">
    <div class="blog-header">
      <h2 class="page-title">
        <el-icon class="icon-margin"><EditPen /></el-icon>{{ isEdit ? '编辑博客' : '新增博客' }}
      </h2>
      <div class="header-actions">
        <el-button type="success" @click="saveDraft" :loading="isDraftSaving" class="mr-10">
          <el-icon><DocumentAdd /></el-icon>保存草稿
        </el-button>
        <el-button type="primary" @click="submitForm" :loading="isSubmitting">
          <el-icon><Check /></el-icon>保存发布
        </el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </div>

    <div class="blog-content-layout">
      <el-form :model="blogForm" label-position="top" :rules="rules" ref="blogFormRef" class="blog-form">
        <!-- 基础信息区域 -->
        <el-card class="mb-20 form-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="section-title">基础信息</span>
            </div>
          </template>

          <el-row :gutter="24">
            <el-col :lg="16" :md="16" :sm="24" :xs="24">
              <el-form-item label="博客标题" prop="title" class="form-item-with-tip">
                <el-input 
                  v-model="blogForm.title" 
                  placeholder="请输入博客标题"
                  maxlength="100"
                  show-word-limit
                />
                <div class="form-item-tip">好的标题能吸引更多读者</div>
              </el-form-item>

              <el-row :gutter="20">
                <el-col :md="12" :sm="24" :xs="24">
                  <el-form-item label="分类" prop="category">
                    <el-select v-model="blogForm.category" placeholder="请选择分类" style="width: 100%">
                      <el-option label="技术" value="tech" />
                      <el-option label="生活" value="life" />
                      <el-option label="随笔" value="essay" />
                      <el-option label="教程" value="tutorial" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :md="12" :sm="24" :xs="24">
                  <el-form-item label="标签" prop="tags">
                    <el-select
                      v-model="blogForm.tags"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      placeholder="请选择或输入标签"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="item in tagOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="摘要" prop="summary" class="form-item-with-tip">
                <el-input
                  v-model="blogForm.summary"
                  type="textarea"
                  :rows="4"
                  maxlength="300"
                  show-word-limit
                  placeholder="请输入博客摘要，如不填写将自动提取内容前150个字符"
                />
                <div class="form-item-tip">好的摘要能帮助读者快速了解文章的内容要点</div>
              </el-form-item>
            </el-col>

            <el-col :lg="8" :md="8" :sm="24" :xs="24" class="cover-col">
              <el-form-item label="博客封面" prop="cover" class="cover-form-item">
                <div class="cover-upload-wrapper">
                  <el-upload
                    class="cover-uploader"
                    action="/api/upload"
                    :show-file-list="false"
                    :on-success="handleCoverSuccess"
                    :before-upload="beforeCoverUpload"
                    :on-error="handleUploadError"
                    :drag="true"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                  >
                    <div v-if="!blogForm.cover && !uploadLoading" class="cover-placeholder">
                      <el-icon class="cover-uploader-icon"><Picture /></el-icon>
                      <h4>点击或拖拽上传封面</h4>
                      <p class="upload-tip">支持JPG、PNG、GIF、WEBP格式</p>
                    </div>
                    
                    <div v-if="uploadLoading" class="upload-loading">
                      <el-progress type="circle" :percentage="uploadProgress" :width="80" />
                      <p class="upload-loading-text">上传中...</p>
                    </div>
                    
                    <div v-if="blogForm.cover" class="cover-preview-container">
                      <img :src="blogForm.cover" class="cover" />
                      <div class="cover-actions">
                        <el-button 
                          type="danger" 
                          circle 
                          @click.stop="removeCover"
                          size="small"
                          class="cover-action-btn"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                        <el-button 
                          type="primary" 
                          circle 
                          @click.stop="previewCover"
                          size="small"
                          class="cover-action-btn"
                        >
                          <el-icon><ZoomIn /></el-icon>
                        </el-button>
                        <el-button 
                          type="success" 
                          circle 
                          @click.stop="() => {}"
                          size="small"
                          class="cover-action-btn"
                        >
                          <el-icon><RefreshRight /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </el-upload>
                </div>
                <div class="form-item-tip text-center">推荐尺寸: 1200 x 800 像素，大小不超过2MB</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- Markdown编辑器区域 -->
        <el-card class="form-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="section-title">文章内容</span>
              <div class="editor-actions">
                <el-button 
                  type="text" 
                  @click="toggleFullscreen" 
                  class="fullscreen-btn"
                  :title="isFullscreen ? '退出全屏' : '全屏编辑'"
                >
                  <el-icon><FullScreen v-if="!isFullscreen" /><Aim v-else /></el-icon>
                </el-button>
                <el-radio-group v-model="isPreviewMode" size="small">
                  <el-radio-button label="edit">仅编辑</el-radio-button>
                  <el-radio-button label="split">分屏模式</el-radio-button>
                  <el-radio-button label="preview">预览</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>

          <el-form-item prop="content" class="content-form-item">
            <div class="md-editor-wrapper">
              <!-- 编辑器工具栏 -->
              <div class="md-toolbar" v-show="isPreviewMode !== 'preview'">
                <div class="toolbar-left">
                  <el-tooltip content="标题" placement="top">
                    <el-dropdown trigger="click" @command="insertHeading">
                      <el-button size="small">
                        <el-icon><Menu /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="1">H1 标题</el-dropdown-item>
                          <el-dropdown-item command="2">H2 标题</el-dropdown-item>
                          <el-dropdown-item command="3">H3 标题</el-dropdown-item>
                          <el-dropdown-item command="4">H4 标题</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </el-tooltip>

                  <el-button-group class="ml-10">
                    <el-tooltip content="加粗" placement="top">
                      <el-button @click="insertMarkdown('bold')" size="small">
                        <strong>B</strong>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="斜体" placement="top">
                      <el-button @click="insertMarkdown('italic')" size="small">
                        <em>I</em>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除线" placement="top">
                      <el-button @click="insertMarkdown('strike')" size="small">
                        <del>S</del>
                      </el-button>
                    </el-tooltip>
                  </el-button-group>
                  
                  <el-button-group class="ml-10">
                    <el-tooltip content="链接" placement="top">
                      <el-button @click="insertMarkdown('link')" size="small">
                        <el-icon><Link /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="图片" placement="top">
                      <el-button @click="insertMarkdown('image')" size="small">
                        <el-icon><Picture /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="代码块" placement="top">
                      <el-button @click="insertMarkdown('code')" size="small">
                        <el-icon><Connection /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </el-button-group>
                  
                  <el-button-group class="ml-10">
                    <el-tooltip content="无序列表" placement="top">
                      <el-button @click="insertMarkdown('unorderedList')" size="small">
                        <el-icon><List /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="有序列表" placement="top">
                      <el-button @click="insertMarkdown('orderedList')" size="small">
                        <el-icon><Sort /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="引用" placement="top">
                      <el-button @click="insertMarkdown('quote')" size="small">
                        <el-icon><ChatDotRound /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </el-button-group>
                </div>
                
                <div class="toolbar-right">
                  <el-tooltip content="帮助" placement="top">
                    <el-popover
                      width="400"
                      trigger="click"
                      title="Markdown语法帮助"
                      placement="bottom"
                    >
                      <template #reference>
                        <el-button size="small" circle>
                          <el-icon><QuestionFilled /></el-icon>
                        </el-button>
                      </template>
                      <div class="markdown-help">
                        <div class="help-content">
                          <div>
                            <p><code># 标题</code> - 一级标题</p>
                            <p><code>**文本**</code> - 粗体</p>
                            <p><code>*文本*</code> - 斜体</p>
                            <p><code>[链接](URL)</code> - 超链接</p>
                            <p><code>![描述](图片URL)</code> - 图片</p>
                          </div>
                          <div>
                            <p><code>- 项目</code> - 无序列表</p>
                            <p><code>1. 项目</code> - 有序列表</p>
                            <p><code>> 引用文本</code> - 引用</p>
                            <p><code>```代码块```</code> - 代码块</p>
                            <p><code>`行内代码`</code> - 行内代码</p>
                          </div>
                        </div>
                      </div>
                    </el-popover>
                  </el-tooltip>

                  <el-dropdown class="ml-10" trigger="click">
                    <el-button size="small">
                      <el-icon><Document /></el-icon>文件操作
                      <el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-upload
                          action="#"
                          :auto-upload="false"
                          :show-file-list="false"
                          :on-change="handleMdFileUpload"
                          accept=".md,.markdown"
                        >
                          <el-dropdown-item>
                            <el-icon><Upload /></el-icon>导入Markdown
                          </el-dropdown-item>
                        </el-upload>
                        <el-dropdown-item @click="exportMdFile">
                          <el-icon><Download /></el-icon>导出Markdown
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <!-- 编辑区域 -->
              <div class="md-editor-container" :class="editorLayoutClass">
                <!-- 左侧编辑区 -->
                <div 
                  class="md-editor-content" 
                  v-show="isPreviewMode !== 'preview'" 
                  :class="{ 'full-width': isPreviewMode === 'edit' }"
                  :style="isPreviewMode === 'split' ? { width: '50%' } : {}"
                >
                  <el-input
                    ref="mdInputRef"
                    v-model="blogForm.content"
                    type="textarea"
                    :autosize="false"
                    :rows="25"
                    placeholder="开始输入Markdown内容..."
                    @input="updateMarkdownPreview"
                    @keydown="handleKeyDown"
                  />
                </div>
                
                <!-- 右侧预览区 -->
                <div 
                  v-show="isPreviewMode !== 'edit'" 
                  class="md-preview-content" 
                  :class="{ 'full-width': isPreviewMode === 'preview' }"
                  :style="isPreviewMode === 'split' ? { width: '50%' } : {}"
                >
                  <div class="markdown-preview article-content" v-html="markdownHtml"></div>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-card>

        <div class="form-actions">
          <el-button type="primary" @click="submitForm" :loading="isSubmitting" size="large">
            <el-icon><Check /></el-icon>保存博客
          </el-button>
          <el-button @click="cancel" size="large">取消</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { 
  Plus, Upload, Download, Document, EditPen, Check,
  Link, Picture, Operation, List, Sort, ChatDotRound,
  QuestionFilled, Connection, ArrowDown, Menu,
  FullScreen, Aim, Delete, ZoomIn, RefreshRight, DocumentAdd
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import Editor from '@wangeditor/editor'

const router = useRouter()
const route = useRoute()
const blogFormRef = ref(null)
const mdInputRef = ref<any>(null)
const isPreviewMode = ref('split') // 'edit', 'preview', 'split'
const markdownHtml = ref('')
const isSubmitting = ref(false)
const isFullscreen = ref(false)
const uploadLoading = ref(false)
const uploadProgress = ref(0)

const blogId = computed(() => route.query.id as string)
const isEdit = computed(() => !!blogId.value)

// 编辑器布局计算
const editorLayoutClass = computed(() => {
  return {
    'md-editor-split': isPreviewMode.value === 'split',
    'md-editor-fullscreen': isPreviewMode.value === 'edit' || isPreviewMode.value === 'preview',
    'is-fullscreen': isFullscreen.value
  }
})

// 表单数据
const blogForm = reactive({
  title: '',
  category: '',
  tags: [] as string[],
  summary: '',
  content: '',
  cover: '',
  status: 'draft' // 添加状态字段
})

const tagOptions = [
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'database', label: '数据库' },
  { value: 'backend', label: '后端' },
  { value: 'frontend', label: '前端' }
]

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 插入标题
const insertHeading = (level: string) => {
  const prefix = '#'.repeat(Number(level))
  insertMarkdown('heading', prefix)
}

// Markdown工具栏插入功能
const insertMarkdown = (type: string, customPrefix?: string) => {
  if (!mdInputRef.value || !mdInputRef.value.$el) return
  
  const textarea = mdInputRef.value.$el.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = blogForm.content
  
  let insertion = ''
  let cursorOffset = 0
  
  switch (type) {
    case 'bold':
      insertion = `**${text.substring(start, end) || '粗体文本'}**`
      cursorOffset = text.substring(start, end) ? 0 : -2
      break
    case 'italic':
      insertion = `*${text.substring(start, end) || '斜体文本'}*`
      cursorOffset = text.substring(start, end) ? 0 : -1
      break
    case 'strike':
      insertion = `~~${text.substring(start, end) || '删除线文本'}~~`
      cursorOffset = text.substring(start, end) ? 0 : -2
      break
    case 'heading':
      const prefix = customPrefix || '## '
      insertion = `\n${prefix}${text.substring(start, end) || '标题'}\n`
      cursorOffset = text.substring(start, end) ? 0 : -1
      break
    case 'link':
      insertion = `[${text.substring(start, end) || '链接文本'}](https://)`
      cursorOffset = -1
      break
    case 'image':
      insertion = `![${text.substring(start, end) || '图片描述'}](https://)`
      cursorOffset = -1
      break
    case 'code':
      insertion = `\n\`\`\`\n${text.substring(start, end) || '代码块'}\n\`\`\`\n`
      cursorOffset = text.substring(start, end) ? -4 : -5
      break
    case 'unorderedList':
      insertion = `\n- ${text.substring(start, end) || '列表项'}\n`
      cursorOffset = text.substring(start, end) ? 0 : -1
      break
    case 'orderedList':
      insertion = `\n1. ${text.substring(start, end) || '列表项'}\n`
      cursorOffset = text.substring(start, end) ? 0 : -1
      break
    case 'quote':
      insertion = `\n> ${text.substring(start, end) || '引用内容'}\n`
      cursorOffset = text.substring(start, end) ? 0 : -1
      break
  }
  
  blogForm.content = text.substring(0, start) + insertion + text.substring(end)
  updateMarkdownPreview()
  
  // 设置光标位置
  setTimeout(() => {
    const newPosition = start + insertion.length + cursorOffset
    textarea.focus()
    textarea.setSelectionRange(newPosition, newPosition)
  }, 10)
}

// 处理Tab键缩进
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    
    if (!mdInputRef.value || !mdInputRef.value.$el) return
    const textarea = mdInputRef.value.$el.querySelector('textarea')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // 插入两个空格作为缩进
    const newText = blogForm.content.substring(0, start) + '  ' + blogForm.content.substring(end)
    blogForm.content = newText
    
    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 2, start + 2)
    }, 10)
  }
}

// 读取上传的Markdown文件
const handleMdFileUpload = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e: any) => {
    const content = e.target.result
    blogForm.content = content
    
    // 尝试从文件名提取标题
    if (!blogForm.title) {
      const fileName = file.name.replace(/\.(md|markdown)$/, '')
      blogForm.title = fileName
    }
    
    // 更新预览
    updateMarkdownPreview()
    
    ElMessage.success('已成功导入Markdown文件')
  }
  reader.readAsText(file.raw)
}

// 导出为Markdown文件
const exportMdFile = () => {
  if (!blogForm.content) {
    ElMessage.warning('没有内容可导出')
    return
  }
  
  const fileName = blogForm.title || 'blog'
  const blob = new Blob([blogForm.content], { type: 'text/markdown' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.md`
  link.click()
  URL.revokeObjectURL(link.href)
  
  ElMessage.success('已导出Markdown文件')
}

// 简单的Markdown转HTML函数，实际应用中建议使用成熟的库如marked.js
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // 这是一个简单的实现，真实项目中请使用成熟的markdown解析库
  let html = markdown
    // 标题
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 删除线
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 图片
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
    // 链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // 引用
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    // 无序列表
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
  
  // 包装段落
  html = '<p>' + html + '</p>';
  
  // 清理列表
  html = html.replace(/<\/li>\s*<p>/g, '</li><p>');
  html = html.replace(/<\/p>\s*<li>/g, '</p><ul><li>');
  html = html.replace(/<\/li>\s*<\/p>/g, '</li></ul></p>');
  
  return html;
}

const updateMarkdownPreview = () => {
  markdownHtml.value = markdownToHtml(blogForm.content);
}

const handleCoverSuccess = (response: any) => {
  blogForm.cover = response.url;
}

const beforeCoverUpload = (file: any) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!');
    return false;
  }
  
  return true;
}

const handleUploadError = (error: any) => {
  ElMessage.error('上传失败，请检查网络连接');
}

const removeCover = () => {
  blogForm.cover = '';
}

const previewCover = () => {
  if (!blogForm.cover) return
  
  ElMessageBox.alert('<div class="cover-preview-dialog"><img src="' + blogForm.cover + '" /></div>', '封面预览', {
    dangerouslyUseHTMLString: true,
    center: true,
    showConfirmButton: false,
    callback: () => {}
  })
}

const submitForm = () => {
  if (!blogFormRef.value) return;
  
  isSubmitting.value = true;
  
  (blogFormRef.value as any).validate((valid: boolean) => {
    if (valid) {
      // 如果没有填写摘要，自动提取内容前150个字符作为摘要
      if (!blogForm.summary) {
        // 去除Markdown标记后的纯文本
        const plainText = blogForm.content.replace(/[#*`~\[\]()!>-]/g, '');
        blogForm.summary = plainText.substring(0, 150);
      }
      
      // 这里添加保存逻辑
      setTimeout(() => {
        console.log('保存博客：', blogForm);
        ElMessage.success('保存成功');
        isSubmitting.value = false;
        router.push('/blog/list');
      }, 800); // 模拟网络请求
    } else {
      isSubmitting.value = false;
    }
  })
}

const cancel = () => {
  ElMessage.info('已取消编辑');
  router.push('/blog/list');
}

// 切换全屏编辑
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  // 在下一个tick后重新聚焦编辑器
  setTimeout(() => {
    if (mdInputRef.value && isFullscreen.value) {
      mdInputRef.value.$el.querySelector('textarea').focus()
    }
  }, 100)
}

// 监听粘贴事件上传图片
const setupPasteUpload = () => {
  document.addEventListener('paste', handlePaste)
}

// 粘贴事件处理
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  // 查找粘贴的图片
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile()
      if (!file) continue
      
      // 验证文件
      const isValid = beforeCoverUpload(file)
      if (!isValid) return
      
      // 模拟上传过程
      uploadLoading.value = true
      uploadProgress.value = 0
      
      const reader = new FileReader()
      reader.onload = (e) => {
        // 模拟进度
        const interval = setInterval(() => {
          uploadProgress.value += 10
          if (uploadProgress.value >= 100) {
            clearInterval(interval)
            uploadLoading.value = false
            blogForm.cover = e.target?.result as string
            ElMessage.success('图片已从剪贴板添加')
          }
        }, 100)
      }
      reader.readAsDataURL(file)
      break
    }
  }
}

const isDraftSaving = ref(false)

// 保存草稿
const saveDraft = async () => {
  isDraftSaving.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('草稿已保存')
    
    if (!isEdit.value) {
      // 模拟获取新创建的博客ID
      const newId = Date.now().toString()
      router.replace(`/blog/edit?id=${newId}`)
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败，请重试')
  } finally {
    isDraftSaving.value = false
  }
}

// 加载博客数据
const loadBlogData = async () => {
  if (!blogId.value) return

  // 显示加载中消息
  const loading = ElMessage.loading('加载博客数据中...', 0)
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 这里应该是实际的API调用，获取博客详情
    // const response = await fetch(`/api/blogs/${blogId.value}`)
    // const data = await response.json()
    
    // 模拟从API获取的数据
    const mockData = {
      title: '如何有效使用Markdown编辑器',
      category: 'tech',
      tags: ['Markdown', '写作技巧'],
      summary: '本文介绍了Markdown编辑器的使用技巧和最佳实践...',
      content: '# Markdown编辑器使用指南\n\n## 什么是Markdown\n\nMarkdown是一种轻量级标记语言...',
      cover: 'https://placeholder.pics/svg/800x400/DEDEDE/555555/Markdown%20Cover',
      status: 'published'
    }
    
    // 填充表单数据
    Object.assign(blogForm, mockData)
    
    // 更新Markdown预览
    nextTick(() => {
      updateMarkdownPreview()
    })
  } catch (error) {
    console.error('获取博客详情失败:', error)
    ElMessage.error('获取博客详情失败，请重试')
  } finally {
    loading.close()
  }
}

// 在组件加载时初始化
onMounted(async () => {
  // 初始化
  console.log('编辑器已加载')
  updateMarkdownPreview()
  setupPasteUpload()
  
  // 如果有博客ID，加载博客数据
  if (isEdit.value) {
    await loadBlogData()
  }
})
</script>

<style scoped>
.blog-edit-container {
  min-height: 100vh;
  box-sizing: border-box;
  color: #333;
  background-color: #f5f7fa;
}

.blog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 24px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.icon-margin {
  margin-right: 8px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.blog-content-layout {
  padding: 0 20px 30px;
}

.blog-form {
  max-width: 1400px;
  margin: 0 auto;
}

.mb-20 {
  margin-bottom: 20px;
}

.ml-10 {
  margin-left: 10px;
}

.form-card {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.form-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.editor-actions {
  display: flex;
  align-items: center;
}

.form-item-with-tip {
  margin-bottom: 24px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.text-center {
  text-align: center;
}

/* 封面上传区域样式 */
.cover-col {
  display: flex;
  flex-direction: column;
}

.cover-form-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cover-upload-wrapper {
  flex: 1;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 220px;
  transition: all 0.3s;
}

.cover-uploader:hover {
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.05);
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #909399;
  padding: 20px;
}

.cover-placeholder h4 {
  margin: 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.cover-uploader-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.upload-loading-text {
  margin-top: 16px;
  color: #409EFF;
}

.cover-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.cover-preview-container:hover .cover {
  transform: scale(1.05);
}

.cover-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  gap: 10px;
}

.cover-preview-container:hover .cover-actions {
  opacity: 1;
}

.cover-action-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 图片预览对话框样式 */
:deep(.cover-preview-dialog) {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

:deep(.cover-preview-dialog img) {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* Markdown编辑器主要样式 */
.content-form-item :deep(.el-form-item__label) {
  display: none;
}

.md-editor-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
  width: 100%;
  min-height: 600px;
  transition: all 0.3s ease;
}

.md-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f7fa;
  padding: 8px 12px;
  border-bottom: 1px solid #dcdfe6;
  flex-wrap: wrap;
  width: 100%;
  z-index: 10;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  margin: 4px 0;
}

.md-editor-container {
  display: flex;
  min-height: 500px;
  width: 100%;
  flex: 1;
}

/* 编辑器布局类 */
.md-editor-split {
  flex-direction: row;
  min-height: 600px;
  width: 100%;
}

.md-editor-fullscreen {
  flex-direction: row;
  min-height: 600px; 
  width: 100%;
}

.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: white;
  height: 100vh !important;
  width: 100vw !important;
  border-radius: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.is-fullscreen .md-toolbar {
  padding: 12px 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.is-fullscreen .md-editor-content,
.is-fullscreen .md-preview-content {
  height: calc(100vh - 60px);
  overflow: auto;
}

.is-fullscreen .md-editor-content :deep(.el-textarea__inner) {
  min-height: calc(100vh - 60px);
  border: none;
  padding: 20px;
  font-size: 16px;
  line-height: 1.8;
}

.md-editor-content, .md-preview-content {
  flex: 1;
  overflow: auto;
  height: 100%;
}

.md-editor-content {
  border-right: 1px solid #dcdfe6;
  width: 100%;
}

.md-editor-content :deep(.el-textarea__inner) {
  min-height: 600px;
  height: 100%;
  border: none;
  border-radius: 0;
  resize: none;
  padding: 16px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  line-height: 1.6;
  font-size: 14px;
  width: 100%;
}

.full-width {
  flex: 1;
  width: 100% !important;
}

.md-preview-content {
  padding: 16px;
  background-color: #fff;
  width: 100%;
  overflow-y: auto;
}

.markdown-help {
  padding: 10px 0;
}

.help-content {
  display: flex;
  justify-content: space-between;
}

.help-content > div {
  flex: 1;
  padding: 0 10px;
}

.help-content p {
  margin: 8px 0;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px 0;
}

/* Markdown预览样式 */
.article-content {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.article-content h1 {
  font-size: 2em;
  margin-top: 1em;
  margin-bottom: 0.6em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  font-weight: 600;
}

.article-content h2 {
  font-size: 1.5em;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  font-weight: 600;
}

.article-content h3 {
  font-size: 1.25em;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  font-weight: 600;
}

.article-content p {
  margin-top: 1em;
  margin-bottom: 1em;
}

.article-content blockquote {
  margin: 1em 0;
  padding: 0.8em 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  background-color: #f6f8fa;
}

.article-content pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
  margin: 1em 0;
}

.article-content code {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
  font-size: 0.9em;
}

.article-content pre code {
  background-color: transparent;
  padding: 0;
  font-size: 0.9em;
}

.article-content img {
  max-width: 100%;
  display: block;
  margin: 1em auto;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.article-content ul, .article-content ol {
  margin: 1em 0;
  padding-left: 2em;
}

.article-content li {
  margin: 0.5em 0;
}

.article-content a {
  color: #409EFF;
  text-decoration: none;
}

.article-content a:hover {
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .blog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .md-toolbar {
    padding: 6px;
  }
  
  .toolbar-left, .toolbar-right {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
  }
  
  .toolbar-right {
    justify-content: flex-end;
  }
}

.fullscreen-btn {
  margin-right: 16px;
}

.mr-10 {
  margin-right: 10px;
}
</style> 