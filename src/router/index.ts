import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import EditBlog from '../views/blog/EditBlog.vue'
import Dashboard from '../views/Dashboard.vue'
import MainLayout from '../layout/MainLayout.vue'
import BlogList from '../views/blog/BlogList.vue'
import BlogDetail from '../views/blog/BlogDetail.vue'
import ResourceList from '../views/resources/list/ResourceList.vue'
import ResourceUpload from '../views/resources/upload/ResourceUpload.vue'
import ResourceCategories from '../views/resources/categories/ResourceCategories.vue'

// 抽离出来的routes数组
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
    meta: { hidden: true }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { 
      requiresAuth: false,
      hidden: true
    }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { 
      requiresAuth: false,
      hidden: true
    }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: {
          title: '仪表盘',
          icon: 'el-icon-s-home',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/system',
    component: MainLayout,
    redirect: '/system/params',
    meta: {
      title: '系统管理',
      icon: 'el-icon-s-tools',
      requiresAuth: true
    },
    children: [
      {
        path: 'params',
        name: 'system-params',
        component: () => import('../views/system/params/SystemParams.vue'),
        meta: {
          title: '系统参数管理',
          icon: 'el-icon-edit',
          keepAlive: true,
          requiresAuth: true
        }
      },
      {
        path: 'users',
        name: 'system-users',
        component: () => import('../views/system/users/UserManagement.vue'),
        meta: {
          title: '用户管理',
          icon: 'el-icon-user',
          requiresAuth: true
        }
      },
      {
        path: 'menu',
        name: 'system-menu',
        component: () => import('../views/system/menu/MenuList.vue'),
        meta: {
          title: '菜单管理',
          icon: 'el-icon-menu',
          requiresAuth: true
        }
      },
      {
        path: 'dict',
        name: 'system-dict',
        component: () => import('../views/system/dict/DictList.vue'),
        meta: {
          title: '字典管理',
          icon: 'el-icon-collection',
          requiresAuth: true
        }
      },
      {
        path: 'role',
        name: 'system-role',
        component: () => import('../views/system/role/RoleList.vue'),
        meta: {
          title: '角色管理',
          icon: 'el-icon-s-custom',
          requiresAuth: true
        }
      },
      {
        path: 'loginlog',
        name: 'system-loginlog',
        component: () => import('../views/system/loginlog/LoginLogList.vue'),
        meta: {
          title: '登录日志',
          icon: 'el-icon-notebook-1',
          requiresAuth: true
        }
      },
      {
        path: 'loginlog/detail/:id',
        name: 'system-loginlog-detail',
        component: () => import('../views/system/loginlog/LoginLogDetail.vue'),
        meta: {
          title: '登录日志详情',
          icon: 'el-icon-view',
          hidden: true,
          requiresAuth: true
        }
      }
    ]
  },
  // 博客管理路由
  {
    path: '/blog',
    component: MainLayout,
    redirect: '/blog/list',
    meta: {
      title: '博客管理',
      icon: 'el-icon-s-order',
      requiresAuth: true
    },
    children: [
      {
        path: 'list',
        name: 'blog-list',
        component: BlogList,
        meta: {
          title: '博客列表',
          icon: 'el-icon-document',
          requiresAuth: true
        }
      },
      {
        path: 'categories',
        name: 'blog-categories',
        component: () => import('../views/blog/categories/CategoryList.vue'),
        meta: {
          title: '博客分类',
          icon: 'el-icon-collection-tag',
          requiresAuth: true
        }
      },
      {
        path: 'tags',
        name: 'blog-tags',
        component: () => import('../views/blog/tags/TagList.vue'),
        meta: {
          title: '标签管理',
          icon: 'el-icon-price-tag',
          requiresAuth: true
        }
      },
      {
        path: 'comments',
        name: 'blog-comments',
        component: () => import('../views/blog/comments/CommentList.vue'),
        meta: {
          title: '评论管理',
          icon: 'el-icon-chat-dot-round',
          requiresAuth: true
        }
      },
      {
        path: 'stats',
        name: 'blog-stats',
        component: () => import('../views/blog/stats/BlogStats.vue'),
        meta: {
          title: '访问统计',
          icon: 'el-icon-data-analysis',
          requiresAuth: true
        }
      },
      {
        path: 'edit',
        name: 'blog-edit',
        component: EditBlog,
        meta: {
          title: '编辑博客',
          icon: 'el-icon-edit',
          hidden: true,
          requiresAuth: true
        }
      },
      {
        path: 'detail/:id',
        name: 'blog-detail',
        component: BlogDetail,
        meta: {
          title: '博客详情',
          icon: 'el-icon-document',
          hidden: true,
          requiresAuth: true
        }
      }
    ]
  },
  // 资源管理路由
  {
    path: '/resources',
    component: MainLayout,
    redirect: '/resources/list',
    meta: {
      title: '资源管理',
      icon: 'el-icon-folder-opened',
      requiresAuth: true
    },
    children: [
      {
        path: 'list',
        name: 'resources-list',
        component: () => import('../views/resources/ResourcesList.vue'),
        meta: {
          title: '资源列表',
          icon: 'el-icon-files',
          requiresAuth: true
        }
      },
      {
        path: 'categories',
        name: 'resources-categories',
        component: ResourceCategories,
        meta: {
          title: '资源分类',
          icon: 'el-icon-collection-tag',
          requiresAuth: true
        }
      },
      {
        path: 'upload',
        name: 'resources-upload',
        component: ResourceUpload,
        meta: {
          title: '资源上传',
          icon: 'el-icon-upload',
          requiresAuth: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 如果是登录页面，直接放行
  if (to.path === '/login') {
    // 如果已经登录，重定向到首页
    if (localStorage.getItem('username')) {
      next({ path: '/dashboard' });
    } else {
      next();
    }
    return;
  }

  // 检查是否需要登录权限
  if (to.meta.requiresAuth) {
    // 检查用户是否已登录
    if (localStorage.getItem('username')) {
      next();
    } else {
      // 未登录，重定向到登录页面，并保存原始访问路径
      next({ path: '/login', query: { redirect: to.fullPath } });
    }
  } else {
    next();
  }
})

export default router