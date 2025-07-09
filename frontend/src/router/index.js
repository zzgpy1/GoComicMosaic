import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../utils/auth'
import infoManager from '../utils/InfoManager'
import Home from '../views/Home.vue'
import Posts from '../views/Posts.vue'

// 基础路由配置
const baseRoutes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'home_title', // 使用键名，后续会被替换为实际内容
      description: 'home_description',
      keywords: 'home_keywords'
    }
  },
  {
    path: '/resource/:id',
    name: 'ResourceDetail',
    component: () => import('../views/ResourceDetail.vue'),
    meta: {
      title: 'resource_detail_title',
      description: 'resource_detail_description',
      keywords: 'resource_detail_keywords'
    }
  },
  {
    path: '/submit',
    name: 'SubmitResource',
    component: () => import('../views/SubmitResource.vue'),
    meta: {
      title: 'submit_resource_title',
      description: 'submit_resource_description',
      keywords: 'submit_resource_keywords'
    }
  },
  {
    path: '/tmdb-search',
    name: 'TMDBSearch',
    component: () => import('../views/TMDBSearch.vue'),
    meta: {
      title: 'tmdb_search_title',
      description: 'tmdb_search_description',
      keywords: 'tmdb_search_keywords'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: 'login_title',
      description: 'login_description',
      keywords: 'login_keywords'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { 
      requiresAuth: true,
      title: 'admin_title',
      description: 'admin_description',
      keywords: 'admin_keywords'
    }
  },
  {
    path: '/admin/resource-review/:id',
    name: 'ResourceReview',
    component: () => import('../views/ResourceReview.vue'),
    meta: { 
      requiresAuth: true,
      title: 'resource_review_title',
      description: 'resource_review_description',
      keywords: 'resource_review_keywords'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      title: 'about_title',
      description: 'about_description',
      keywords: 'about_keywords'
    }
  },
  {
    path: '/streams',
    name: 'StreamsPage',
    component: () => import('../views/StreamsPage.vue'),
    props: route => ({ 
      id: route.query.id,
      direct_url: route.query.direct_url 
    }),
    meta: {
      title: 'streams_title',
      description: 'streams_description',
      keywords: 'streams_keywords',
      referrer: 'no-referrer'
    }
  },
  // 文章相关路由
  {
    path: '/posts',
    name: 'Posts',
    component: Posts,
    meta: {
      title: 'posts_title',
      description: 'posts_description',
      keywords: 'posts_keywords'
    }
  },
  {
    path: '/posts/:slug',
    name: 'PostDetail',
    component: Posts,
    props: true,
    meta: {
      title: 'post_detail_title',
      description: 'post_detail_description',
      keywords: 'post_detail_keywords'
    }
  },
  // 图像处理测试页面
  {
    path: '/image_tools',
    name: 'ImageTools',
    component: () => import('../views/ImageTools.vue'),
    meta: {
      title: 'image_processing_test_title',
      description: 'image_processing_test_description',
      keywords: 'image_processing_test_keywords'
    }
  }
]

// 默认的路由元信息，当配置中没有对应值时使用
const defaultMetaInfo = {
  // 首页
  home_title: '美漫资源共建 - 动漫爱好者共同贡献的资源平台',
  home_description: '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
  home_keywords: '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建',
  
  // 剧集测试页
  episode_test_title: '剧集概览测试 - 美漫资源共建平台',
  episode_test_description: '测试TMDB剧集概览功能，包括季节信息、剧集列表、剧照和演员信息的展示。',
  episode_test_keywords: '剧集概览, TMDB数据, 季节信息, 演员列表',
  
  // 资源详情页
  resource_detail_title: '资源详情 - 美漫资源共建平台',
  resource_detail_description: '查看详细的动漫资源信息，包括简介、图片、下载链接等。在这里您可以浏览由社区贡献的美漫资源详情。',
  resource_detail_keywords: '美漫资源, 动漫详情, 资源下载, 美漫共建',
  
  // 提交资源页
  submit_resource_title: '提交资源 - 美漫资源共建平台',
  submit_resource_description: '在这里提交您收集的美漫资源，包括标题、简介、链接等信息，与社区共同构建完整的资源库。',
  submit_resource_keywords: '提交资源, 分享美漫, 资源贡献, 美漫共建',
  
  // TMDB搜索页
  tmdb_search_title: 'TMDB资源搜索导入 - 美漫资源共建平台',
  tmdb_search_description: '搜索TMDB动画资源，预览并一键导入到资源库中。快速便捷地添加优质内容。',
  tmdb_search_keywords: 'TMDB搜索, 资源导入, 动漫搜索, 美漫共建',
  
  // 登录页
  login_title: '用户登录 - 美漫资源共建平台',
  login_description: '登录美漫资源共建平台，管理您的资源贡献并参与社区建设。',
  login_keywords: '用户登录, 账号登录, 美漫共建',
  
  // 管理后台页
  admin_title: '管理后台 - 美漫资源共建平台',
  admin_description: '美漫资源共建平台管理后台，用于管理用户提交的资源和维护网站内容。',
  admin_keywords: '管理后台, 资源审核, 美漫共建',
  
  // 资源审核页
  resource_review_title: '资源审核 - 美漫资源共建平台',
  resource_review_description: '审核用户提交的美漫资源，确保内容质量和合规性。',
  resource_review_keywords: '资源审核, 内容审核, 美漫共建',
  
  // 关于我们页
  about_title: '关于我们 - 美漫资源共建平台',
  about_description: '了解美漫资源共建平台的宗旨、团队和发展历程。我们致力于为动漫爱好者提供优质的资源共享环境。',
  about_keywords: '关于我们, 平台介绍, 团队介绍, 美漫共建',
  
  // 流媒体内容页
  streams_title: '流媒体内容 - 美漫资源共建平台',
  streams_description: '浏览和观看各种高质量的动漫流媒体内容，包括动画、电影和连续剧。',
  streams_keywords: '流媒体内容, 动漫视频, 在线观看, 美漫共建',
  
  // 文章列表页
  posts_title: '文章列表 - 美漫资源共建平台',
  posts_description: '浏览所有文章，包括动漫评测、资源推荐、行业动态等内容。',
  posts_keywords: '文章, 博客, 动漫评测, 资源推荐, 美漫共建',
  
  // 文章详情页
  post_detail_title: '文章详情 - 美漫资源共建平台',
  post_detail_description: '阅读文章详细内容，包括动漫评测、资源推荐、行业动态等。',
  post_detail_keywords: '文章详情, 博客, 动漫评测, 资源推荐',
  
  // 文章管理页
  post_admin_title: '文章管理 - 美漫资源共建平台',
  post_admin_description: '管理网站文章，包括创建、编辑和删除文章。',
  post_admin_keywords: '文章管理, 编辑, 发布, 管理后台',
  
  // 图片工具页
  image_processing_test_title: '图片工具 - 美漫资源共建平台',
  image_processing_test_description: 'AI图片工具。',
  image_processing_test_keywords: '图片工具',
  
  // 用户管理页
  user_management_title: '用户管理 - 美漫资源共建平台',
  user_management_description: '管理平台用户账号，包括创建、编辑和删除用户。',
  user_management_keywords: '用户管理, 账号管理, 管理后台, 美漫共建'
}

// 异步函数，创建路由并应用动态配置
async function createDynamicRouter() {
  // 尝试获取动态配置
  let routeMetaInfo = { ...defaultMetaInfo };
  
  try {
    console.log('开始获取网站配置信息...');
    // 获取网站信息配置
    const siteInfo = await infoManager.getSiteBasicInfo();
    console.log('成功获取网站基本信息:', siteInfo.title);
    
    // 获取路由meta配置，如果存在的话
    if (siteInfo.routeMeta) {
      console.log('找到路由Meta配置');
      routeMetaInfo = { ...defaultMetaInfo, ...siteInfo.routeMeta };
    } else {
      console.log('未找到路由Meta配置，使用默认配置');
    }
    
    // 如果没有特定页面的配置，使用基本网站标题生成
    const siteName = siteInfo.title || '美漫资源共建平台';
    console.log('使用网站名称:', siteName);
    
    // 为所有没有具体配置的页面设置默认值
    Object.keys(defaultMetaInfo).forEach(key => {
      if (!routeMetaInfo[key] && key.endsWith('_title')) {
        const pageName = key.replace('_title', '');
        let pageTitle = '';
        
        // 根据页面标识生成合理的标题
        switch(pageName) {
          case 'home': 
            pageTitle = siteName;
            break;
          case 'resource_detail': 
            pageTitle = `资源详情 - ${siteName}`;
            break;
          case 'submit_resource': 
            pageTitle = `提交资源 - ${siteName}`;
            break;
          case 'login': 
            pageTitle = `用户登录 - ${siteName}`;
            break;
          case 'admin': 
            pageTitle = `管理后台 - ${siteName}`;
            break;
          case 'resource_review': 
            pageTitle = `资源审核 - ${siteName}`;
            break;
          case 'about': 
            pageTitle = `关于我们 - ${siteName}`;
            break;
          case 'streams': 
            pageTitle = `流媒体内容 - ${siteName}`;
            break;
          case 'user_management':
            pageTitle = `用户管理 - ${siteName}`;
            break;
          default:
            pageTitle = siteName;
        }
        
        routeMetaInfo[key] = pageTitle;
      }
    });
    
    console.log('动态路由配置已加载');
  } catch (error) {
    console.error('加载动态路由配置失败，使用默认值:', error);
  }
  
  // 应用配置到路由
  console.log('开始应用配置到路由...');
  const routes = baseRoutes.map(route => {
    const newRoute = { ...route };
    
    // 替换meta信息中的占位符为实际内容
    if (newRoute.meta) {
      const meta = { ...newRoute.meta };
      
      if (meta.title && routeMetaInfo[meta.title]) {
        console.log(`替换路由[${newRoute.name}]标题: ${meta.title} => ${routeMetaInfo[meta.title]}`);
        meta.title = routeMetaInfo[meta.title];
      } else if (meta.title) {
        console.log(`警告: 未找到路由[${newRoute.name}]的标题配置: ${meta.title}`);
      }
      
      if (meta.description && routeMetaInfo[meta.description]) {
        meta.description = routeMetaInfo[meta.description];
      }
      
      if (meta.keywords && routeMetaInfo[meta.keywords]) {
        meta.keywords = routeMetaInfo[meta.keywords];
      }
      
      newRoute.meta = meta;
    }
    
    return newRoute;
  });
  
  console.log('创建带有动态配置的路由器');
  const router = createRouter({
    history: createWebHistory(),
    routes
  });
  
  // 导航守卫，检查是否需要登录
  router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!isAuthenticated()) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
      } else {
        next();
      }
    } else {
      next();
    }
  });
  
  return router;
}

// 创建一个简单的路由器作为默认导出
// 实际应用中会被替换为动态配置的路由器
const router = createRouter({
  history: createWebHistory(),
  routes: baseRoutes
});

// 初始化动态路由Promise
let dynamicRouterPromise = null;

// 导出获取动态路由器的函数
export const getDynamicRouter = async () => {
  // 如果已经有Promise，直接返回
  if (dynamicRouterPromise) {
    return dynamicRouterPromise;
  }
  
  // 否则创建新的Promise并返回
  dynamicRouterPromise = createDynamicRouter();
  
  try {
    // 等待路由创建完成并返回
    const dynamicRouter = await dynamicRouterPromise;
    console.log('动态路由器创建成功');
    return dynamicRouter;
  } catch (error) {
    console.error('动态路由器创建失败:', error);
    // 出错时返回默认路由
    return router;
  }
};

// 导出默认路由器
export default router; 