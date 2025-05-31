import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { isAuthenticated } from '../utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '美漫资源共建 - 动漫爱好者共同贡献的资源平台',
      description: '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
      keywords: '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建'
    }
  },
  {
    path: '/resource/:id',
    name: 'ResourceDetail',
    component: () => import('../views/ResourceDetail.vue'),
    meta: {
      title: '资源详情 - 美漫资源共建平台',
      description: '查看详细的动漫资源信息，包括简介、图片、下载链接等。在这里您可以浏览由社区贡献的美漫资源详情。',
      keywords: '美漫资源, 动漫详情, 资源下载, 美漫共建'
    }
  },
  {
    path: '/submit',
    name: 'SubmitResource',
    component: () => import('../views/SubmitResource.vue'),
    meta: {
      title: '提交资源 - 美漫资源共建平台',
      description: '在这里提交您收集的美漫资源，包括标题、简介、链接等信息，与社区共同构建完整的资源库。',
      keywords: '提交资源, 分享美漫, 资源贡献, 美漫共建'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '用户登录 - 美漫资源共建平台',
      description: '登录美漫资源共建平台，管理您的资源贡献并参与社区建设。',
      keywords: '用户登录, 账号登录, 美漫共建'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { 
      requiresAuth: true,
      title: '管理后台 - 美漫资源共建平台',
      description: '美漫资源共建平台管理后台，用于管理用户提交的资源和维护网站内容。',
      keywords: '管理后台, 资源审核, 美漫共建'
    }
  },
  {
    path: '/admin/resource-review/:id',
    name: 'ResourceReview',
    component: () => import('../views/ResourceReview.vue'),
    meta: { 
      requiresAuth: true,
      title: '资源审核 - 美漫资源共建平台',
      description: '审核用户提交的美漫资源，确保内容质量和合规性。',
      keywords: '资源审核, 内容审核, 美漫共建'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      title: '关于我们 - 美漫资源共建平台',
      description: '了解美漫资源共建平台的宗旨、团队和发展历程。我们致力于为动漫爱好者提供优质的资源共享环境。',
      keywords: '关于我们, 平台介绍, 团队介绍, 美漫共建'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫，检查是否需要登录
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router 