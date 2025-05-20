<template>
  <div class="login-container">
    <div class="login-box">
      <h2>系统登录</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            required
            placeholder="请输入用户名"
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required
            placeholder="请输入密码"
            :disabled="loading"
          />
        </div>
        <div class="form-options">
          <label class="remember-me">
            <input 
              type="checkbox" 
              v-model="form.remember"
              :disabled="loading"
            />
            记住密码
          </label>
        </div>
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        <button 
          type="submit" 
          class="login-btn"
          :disabled="loading"
          :class="{ 'loading': loading }"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="register-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const form = ref({
  username: '',
  password: '',
  remember: false
})

// 表单验证
const validateForm = () => {
  if (!form.value.username.trim()) {
    errorMessage.value = '请输入用户名'
    return false
  }
  if (!form.value.password) {
    errorMessage.value = '请输入密码'
    return false
  }
  if (form.value.password.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return false
  }
  return true
}

// 检查本地存储的登录信息
onMounted(() => {
  const savedUsername = localStorage.getItem('username')
  const savedPassword = localStorage.getItem('password')
  if (savedUsername && savedPassword) {
    form.value.username = savedUsername
    form.value.password = savedPassword
    form.value.remember = true
  }
})

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里添加实际的登录API调用逻辑
    console.log('登录表单:', form.value)
    
    // 如果选择记住密码，保存到本地存储
    if (form.value.remember) {
      localStorage.setItem('username', form.value.username)
      localStorage.setItem('password', form.value.password)
    } else {
      localStorage.removeItem('password')
    }
    
    // 设置登录状态
    localStorage.setItem('username', form.value.username)
    // 设置登录状态到sessionStorage（关闭浏览器后会自动清除）
    sessionStorage.setItem('username', form.value.username)
    
    // 记录登录日志
    recordLoginLog({
      userName: form.value.username,
      status: '0', // 成功
      msg: '登录成功',
      loginTime: new Date().toISOString(),
      ipaddr: '127.0.0.1', // 实际应由后端获取
      loginLocation: '内网IP',
      browser: getBrowserInfo(),
      os: getOSInfo(),
      loginParams: {
        username: form.value.username,
        rememberMe: form.value.remember,
        loginType: 'account'
      }
    })
    
    // 登录成功后跳转
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = '登录失败，请检查用户名和密码'
    
    // 记录登录失败日志
    recordLoginLog({
      userName: form.value.username,
      status: '1', // 失败
      msg: '用户名或密码错误',
      loginTime: new Date().toISOString(),
      ipaddr: '127.0.0.1', // 实际应由后端获取
      loginLocation: '内网IP',
      browser: getBrowserInfo(),
      os: getOSInfo(),
      loginParams: {
        username: form.value.username,
        rememberMe: form.value.remember,
        loginType: 'account'
      },
      errorStack: error instanceof Error ? error.message : String(error)
    })
  } finally {
    loading.value = false
  }
}

// 记录登录日志
const recordLoginLog = (logData: any) => {
  // 这里应该是实际API调用记录登录日志
  console.log('记录登录日志:', logData)
  // 实际项目中，这里应该调用后端API保存登录日志
}

// 获取浏览器信息
const getBrowserInfo = () => {
  const ua = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = ''

  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox'
    browserVersion = ua.match(/Firefox\/([\d.]+)/)![1]
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edge') === -1 && ua.indexOf('Edg') === -1) {
    browserName = 'Chrome'
    browserVersion = ua.match(/Chrome\/([\d.]+)/)![1]
  } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
    browserName = 'Edge'
    browserVersion = ua.indexOf('Edge') > -1 
      ? ua.match(/Edge\/([\d.]+)/)![1] 
      : ua.match(/Edg\/([\d.]+)/)![1]
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'Safari'
    browserVersion = ua.match(/Version\/([\d.]+)/)![1]
  } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
    browserName = 'IE'
    browserVersion = ua.indexOf('MSIE') > -1 
      ? ua.match(/MSIE ([\d.]+)/)![1] 
      : '11.0'
  }

  return `${browserName} ${browserVersion}`
}

// 获取操作系统信息
const getOSInfo = () => {
  const ua = navigator.userAgent
  let osName = 'Unknown'
  let osVersion = ''

  if (ua.indexOf('Windows') > -1) {
    osName = 'Windows'
    if (ua.indexOf('Windows NT 10.0') > -1) osVersion = '10'
    else if (ua.indexOf('Windows NT 6.3') > -1) osVersion = '8.1'
    else if (ua.indexOf('Windows NT 6.2') > -1) osVersion = '8'
    else if (ua.indexOf('Windows NT 6.1') > -1) osVersion = '7'
    else if (ua.indexOf('Windows NT 6.0') > -1) osVersion = 'Vista'
    else if (ua.indexOf('Windows NT 5.1') > -1) osVersion = 'XP'
  } else if (ua.indexOf('Mac') > -1) {
    osName = 'Mac OS'
    osVersion = ua.match(/Mac OS X ([\d_.]+)/)
      ? ua.match(/Mac OS X ([\d_.]+)/)![1].replace(/_/g, '.')
      : ''
  } else if (ua.indexOf('Linux') > -1) {
    osName = 'Linux'
  } else if (ua.indexOf('Android') > -1) {
    osName = 'Android'
    osVersion = ua.match(/Android ([\d.]+)/)![1]
  } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    osName = 'iOS'
    osVersion = ua.match(/OS ([\d_]+)/)
      ? ua.match(/OS ([\d_]+)/)![1].replace(/_/g, '.')
      : ''
  }

  return osVersion ? `${osName} ${osVersion}` : osName
}
</script>

<style scoped>
.login-container {
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

.login-box {
  width: 100%;
  max-width: 400px;
  margin: 20px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background-color: #fff;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

input[type="text"],
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
input[type="password"]:focus {
  border-color: #667eea;
  outline: none;
}

.form-options {
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.error-message {
  color: #ff4d4f;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.login-btn {
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

.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 16px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.login-btn:hover:not(:disabled) {
  background-color: #5a6fd6;
}

.login-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.login-btn.loading {
  position: relative;
  color: transparent;
}

.login-btn.loading::after {
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

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>