<template>
  <div class="register-container">
    <div class="register-box">
      <h2>用户注册</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            required
            placeholder="请输入用户名（4-20个字符）"
            :disabled="loading"
          />
          <div class="form-tip" v-if="formErrors.username">{{ formErrors.username }}</div>
        </div>
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            required
            placeholder="请输入有效的邮箱地址"
            :disabled="loading"
          />
          <div class="form-tip" v-if="formErrors.email">{{ formErrors.email }}</div>
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required
            placeholder="请输入密码（至少6位字符）"
            :disabled="loading"
          />
          <div class="form-tip" v-if="formErrors.password">{{ formErrors.password }}</div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="form.confirmPassword" 
            required
            placeholder="请再次输入密码"
            :disabled="loading"
          />
          <div class="form-tip" v-if="formErrors.confirmPassword">{{ formErrors.confirmPassword }}</div>
        </div>
        <div class="form-agreement">
          <label class="agreement-label">
            <input 
              type="checkbox" 
              v-model="form.agreement"
              :disabled="loading"
            />
            我已阅读并同意 <a href="#" @click.prevent="showTerms">服务条款</a> 和 <a href="#" @click.prevent="showPrivacy">隐私政策</a>
          </label>
          <div class="form-tip" v-if="formErrors.agreement">{{ formErrors.agreement }}</div>
        </div>
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        <button 
          type="submit" 
          class="register-btn"
          :disabled="loading || !form.agreement"
          :class="{ 'loading': loading }"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="login-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

const formErrors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: ''
})

// 清除所有错误信息
const clearErrors = () => {
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = ''
  })
  errorMessage.value = ''
}

// 表单验证
const validateForm = () => {
  clearErrors()
  let isValid = true

  // 用户名验证
  if (!form.username.trim()) {
    formErrors.username = '请输入用户名'
    isValid = false
  } else if (form.username.length < 4 || form.username.length > 20) {
    formErrors.username = '用户名长度必须在4-20个字符之间'
    isValid = false
  }

  // 邮箱验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    formErrors.email = '请输入邮箱地址'
    isValid = false
  } else if (!emailRegex.test(form.email)) {
    formErrors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 密码验证
  if (!form.password) {
    formErrors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    formErrors.password = '密码长度不能少于6位'
    isValid = false
  }

  // 确认密码验证
  if (!form.confirmPassword) {
    formErrors.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    formErrors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  // 协议同意验证
  if (!form.agreement) {
    formErrors.agreement = '注册前请同意服务条款和隐私政策'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 这里添加实际的注册API调用逻辑
    console.log('注册表单:', form)
    
    // 注册成功提示
    ElMessage.success('注册成功！请登录您的账号')
    
    // 注册成功后跳转到登录页
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    errorMessage.value = '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 显示服务条款
const showTerms = () => {
  ElMessageBox.alert('这里是服务条款内容...', '服务条款', {
    confirmButtonText: '我已阅读'
  })
}

// 显示隐私政策
const showPrivacy = () => {
  ElMessageBox.alert('这里是隐私政策内容...', '隐私政策', {
    confirmButtonText: '我已阅读'
  })
}
</script>

<style scoped>
.register-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
}

.register-box {
  width: 100%;
  max-width: 450px;
  margin: 20px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background-color: #fff;
}

h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
  font-size: 24px;
}

.form-group {
  margin-bottom: 16px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 14px;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus {
  border-color: #667eea;
  outline: none;
}

.form-tip {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
  min-height: 16px;
}

.form-agreement {
  margin-bottom: 20px;
}

.agreement-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: normal;
  line-height: 1.4;
}

.agreement-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.agreement-label a {
  color: #667eea;
  text-decoration: none;
}

.agreement-label a:hover {
  text-decoration: underline;
}

.error-message {
  color: #ff4d4f;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.register-btn {
  width: 100%;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s;
  margin-bottom: 16px;
}

.register-btn:hover:not(:disabled) {
  background-color: #5a6fd6;
}

.register-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.register-btn.loading {
  position: relative;
  color: transparent;
}

.register-btn.loading::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style> 