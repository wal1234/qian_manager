import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './assets/main.css'
import { hasRoleDirective, hasPermissionDirective } from './utils/permission'

const app = createApp(App)
app.use(createPinia())

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册自定义权限指令
app.directive('hasRole', hasRoleDirective)
app.directive('hasPermission', hasPermissionDirective)

console.log('Vue app created')
app.use(router)
console.log('Router injected')
app.use(ElementPlus)
console.log('Vue app mounted!')
app.mount('#app')
