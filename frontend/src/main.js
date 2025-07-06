import { createApp } from 'vue'
import App from './App.vue'
import router, { getDynamicRouter } from './router'
import axios from 'axios'
import { setupAxiosInterceptors } from './utils/auth'
import { initStorageBridge } from './utils/storageBridge'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 配置axios基础URL
axios.defaults.baseURL = '/app'

// 设置请求拦截器
setupAxiosInterceptors()

// 创建Vue应用但暂不挂载
const app = createApp(App)

// 初始化存储桥接器
initStorageBridge()

// 异步初始化应用
async function initApp() {
  try {
    // 获取动态配置的路由
    const dynamicRouter = await getDynamicRouter();
    
    // 使用动态路由而不是默认路由
    app.use(dynamicRouter);
    console.log('已应用动态路由配置');
    
    // 挂载应用
    app.use(ElementPlus)
    app.mount('#app');
  } catch (error) {
    console.error('初始化动态路由失败，使用默认路由:', error);
    // 出错时使用默认路由
    app.use(router);
    app.use(ElementPlus)
    app.mount('#app');
  }
}

// 执行初始化
initApp(); 