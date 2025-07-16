<template>
  <div class="app-container">
    <header class="app-header">
      <div class="container header-inner">
        <div class="brand">
          <router-link to="/" class="brand-link">
            <i class="bi bi-collection-play brand-icon"></i>
            <span class="brand-text">{{ siteInfo.logoText }}</span>
          </router-link>
        </div>
        
        <!-- 添加全局搜索组件 -->
        <LocalSearch class="header-search" />
        
        <div class="header-actions">
          <template v-if="isLoggedIn">
            <div class="user-greeting">
              <i class="bi bi-person-circle"></i>
              <span>{{ currentUser.username }}</span>
            </div>
            <div class="button-group">
              <router-link v-if="!isAdminPage" to="/admin" class="btn-custom btn-info">
                <i class="bi bi-gear-fill me-1"></i><span class="btn-text">管理后台</span>
              </router-link>
              <button @click="handleLogout" class="btn-custom btn-outline" v-if="isAdminPage">
                <i class="bi bi-box-arrow-right me-1"></i><span class="btn-text">登出</span>
              </button>
              <router-link to="/tmdb-search" class="btn-custom btn-secondary" v-if="tmdbEnabled">
                <i class="bi bi-collection-play me-1"></i><span class="btn-text">TMDB搜索</span>
              </router-link>
              <router-link to="/submit" class="btn-custom btn-primary">
                <i class="bi bi-plus-circle me-1"></i><span class="btn-text">提交资源</span>
              </router-link>
            </div>
          </template>
          <template v-else>
            <div class="button-group">
              <router-link to="/login" class="btn-custom btn-outline" aria-label="管理员登录">
                <i class="bi bi-shield-lock me-1"></i><span class="btn-text">管理员登录</span>
              </router-link>
              <router-link to="/tmdb-search" class="btn-custom btn-secondary" v-if="tmdbEnabled">
                <i class="bi bi bi-collection-play me-1"></i><span class="btn-text">TMDB搜索</span>
              </router-link>
              <router-link to="/submit" class="btn-custom btn-primary" aria-label="提交资源">
                <i class="bi bi-plus-circle me-1"></i><span class="btn-text">提交资源</span>
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="container content-container">
        <router-view />
      </div>
    </main>
    
    <!-- 隐藏的预加载元素 -->
    <div class="prefetch-footer" aria-hidden="true">
      <div class="footer-content">
        <div class="footer-brand"></div>
        <div class="footer-links"></div>
      </div>
    </div>
    
    <footer class="app-footer">
      <div class="container footer-inner">
        <!-- 页脚布局 -->
        <div class="footer-row">
          <template v-if="footerSettings">
            <!-- 动态生成链接 -->
            <template v-for="(link, index) in footerSettings.links" :key="index">
              <!-- 内部链接 -->
              <router-link v-if="link.type === 'internal'" :to="link.url" class="footer-link" :title="link.title">
                <i v-if="link.icon" :class="link.icon"></i>
                <span>{{ link.text }}</span>
              </router-link>
              
              <!-- 外部链接 -->
              <a v-else :href="link.url" target="_blank" class="footer-link" :title="link.title">
                <i v-if="link.icon" :class="link.icon"></i>
                <span v-if="!link.icon">{{ link.text }}</span>
              </a>
            </template>
            
            <!-- 访问统计 -->
            <span class="footer-link" v-if="footerSettings.show_visitor_count">总访问量 <span id="busuanzi_value_site_pv">0</span></span>
          </template>
          
          <!-- 在设置加载前的默认链接，或加载失败时的回退链接 -->
          <template v-else>
            <router-link to="/about" class="footer-link">关于我们</router-link>
            <a href="https://t.me/xueximeng" target="_blank" class="footer-link" title="加入Telegram群组">
              <i class="bi bi-telegram"></i>
            </a>
            <a href="https://github.com/fish2018/GoComicMosaic" target="_blank" class="footer-link" title="查看GitHub源码">
              <i class="bi bi-github"></i>
            </a>
          </template>
        </div>
        
        <!-- 分隔线 -->
        <div class="footer-divider"></div>
        
        <!-- 版权信息 -->
        <div class="copyright">
          <p>{{ footerSettings?.copyright || '&copy; 2025 美漫资源共建. 保留所有权利' }}</p>
        </div>
      </div>
    </footer>

    <!-- 全局悬浮按钮 -->
    <div class="floating-buttons">
      <router-link to="/" class="floating-btn home-btn" title="返回主页">
        <i class="bi bi-house-fill"></i>
      </router-link>
      <!-- 添加返回推荐主页按钮 -->
      <button 
        v-if="showRecommendButton" 
        @click="returnToRecommendHome" 
        class="floating-btn recommend-btn" 
        title="返回推荐"
      >
        <i class="bi bi-arrow-return-left"></i>
      </button>
      <button @click="scrollToTop" class="floating-btn top-btn" title="回到顶部">
        <i class="bi bi-chevron-up"></i>
      </button>
      <button @click="scrollToBottom" class="floating-btn bottom-btn" title="回到底部">
        <i class="bi bi-chevron-down"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted, provide, watch } from 'vue'
import { isAuthenticated, getCurrentUser, logout, setupAxiosInterceptors } from './utils/auth'
import { useRoute, useRouter } from 'vue-router'
import LocalSearch from './components/LocalSearch.vue'
import axios from 'axios'
import { getSiteSettings } from './utils/api'
import TmdbStatusService from './services/TmdbStatusService'

const route = useRoute()
const router = useRouter()
const isLoggedIn = ref(false)
const currentUser = ref({})
const footerPreloaded = ref(false)
const footerSettings = ref(null)
const siteInfo = ref({
  title: '美漫资源共建',
  logoText: '美漫资源共建',
  description: '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
  keywords: '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建'
})
const tmdbEnabled = ref(false)

// 计算当前是否在管理员页面
const isAdminPage = computed(() => {
  return route.path.startsWith('/admin')
})

const checkAuthState = () => {
  isLoggedIn.value = isAuthenticated()
  if (isLoggedIn.value) {
    currentUser.value = getCurrentUser() || {}
  }
}

const handleLogout = () => {
  logout()
  checkAuthState()
}

// 获取页脚设置
const loadFooterSettings = async () => {
  try {
    // 使用InfoManager获取缓存的信息
    const infoManager = (await import('./utils/InfoManager')).default;
    footerSettings.value = await infoManager.getFooterInfo();
    console.log('页脚设置加载成功:', footerSettings.value);
  } catch (error) {
    console.error('获取页脚设置失败:', error);
    // 尝试从localStorage直接获取
    try {
      const cachedData = localStorage.getItem('site_info_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.data && parsed.data.links) {
          console.log('从localStorage直接恢复页脚设置');
          footerSettings.value = parsed.data;
          return;
        }
      }
    } catch (e) {
      console.error('从localStorage恢复页脚设置失败:', e);
    }
    
    // 使用默认设置
    footerSettings.value = {
      links: [
        { text: "关于我们", url: "/about", type: "internal" },
        { text: "Telegram", url: "https://t.me/xueximeng", icon: "bi bi-telegram", type: "external", title: "加入Telegram群组" },
        { text: "GitHub", url: "https://github.com/fish2018/GoComicMosaic", icon: "bi bi-github", type: "external", title: "查看GitHub源码" },
        { text: "在线点播", url: "/streams", type: "internal" },
        { text: "漫迪小站", url: "https://mdsub.top/", type: "external" },
        { text: "三次元成瘾者康复中心", url: "https://www.kangfuzhongx.in/", type: "external" },
      ],
      copyright: "© 2025 美漫资源共建. 保留所有权利",
      show_visitor_count: true
    };
  }
}

// 加载网站基本信息
const loadSiteInfo = async () => {
  try {
    const infoManager = (await import('./utils/InfoManager')).default;
    const info = await infoManager.getSiteBasicInfo();
    siteInfo.value = info;
    console.log('网站基本信息加载成功:', siteInfo.value);
    
    // 更新页面标题和meta信息
    updateMetaInfo(route);
  } catch (error) {
    console.error('获取网站基本信息失败:', error);
    // 默认值已在siteInfo的ref初始化中设置
  }
}

// 加载TMDB配置
const loadTMDBConfig = async () => {
  try {
    // 使用TmdbStatusService服务获取TMDB状态
    const data = await TmdbStatusService.getTmdbStatus();
    if (data && data.enabled !== undefined) {
      tmdbEnabled.value = data.enabled === true;
    }
  } catch (error) {
    console.error('加载TMDB状态失败:', error);
    // 默认不启用
    tmdbEnabled.value = false;
  }
}

// 滚动到页面顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// 滚动到页面底部
const scrollToBottom = () => {
  // 确保底部元素已预加载
  if (!footerPreloaded.value) {
    preloadFooterContent();
  }
  
  // 使用平滑滚动到底部
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
}

// 预加载页脚内容以防止渲染撕裂
const preloadFooterContent = () => {
  if (footerPreloaded.value) return;
  
  // 触发页脚资源预加载
  const footer = document.querySelector('.app-footer');
  if (footer) {
    // 强制重新计算布局
    footer.getBoundingClientRect();
    footerPreloaded.value = true;
  }
}

// 优化滚动性能的函数
const optimizeScrollPerformance = () => {
  let scrollTimeout;
  
  window.addEventListener('scroll', () => {
    // 滚动时检测是否接近底部
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 如果接近底部，预加载页脚内容
    if (documentHeight - scrollPosition < 300 && !footerPreloaded.value) {
      preloadFooterContent();
    }
    
    // 滚动节流处理
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
      }, 100);
    }
  }, { passive: true });
}

// 添加清理storage的函数
const clearPaginationStorage = () => {
  localStorage.removeItem('resourcesCurrentPage')
  localStorage.removeItem('resourcesPageSize')
  // 如果还有其他需要清理的分页相关数据，可以在这里添加
}

// 处理滚动事件，显示/隐藏回到顶部按钮
const handleScroll = () => {
  // 滚动时检测是否接近底部
  const scrollPosition = window.scrollY + window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // 如果接近底部，预加载页脚内容
  if (documentHeight - scrollPosition < 300 && !footerPreloaded.value) {
    preloadFooterContent();
  }
}

// 更新页面标题和meta信息的函数
const updateMetaInfo = (to) => {
  // 设置默认值
  const defaultTitle = siteInfo.value.title;
  const defaultDescription = siteInfo.value.description;
  const defaultKeywords = siteInfo.value.keywords;
  
  // 获取路由的meta信息
  const title = to.meta.title || defaultTitle;
  const description = to.meta.description || defaultDescription;
  const keywords = to.meta.keywords || defaultKeywords;
  const referrer = to.meta.referrer || 'no-referrer';
  
  // 更新页面标题
  document.title = title;

  // 更新img referrer
  let metaReferrer = document.querySelector('meta[name="referrer"]');
  if (metaReferrer) {
    metaReferrer.setAttribute('content', referrer);
  }

  // 更新meta描述
  let metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  
  // 更新meta关键词
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', keywords);
  }
  
  // 更新Open Graph标签
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', title);
  }
  
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', description);
  }

  // 检查并更新favicon
  if (typeof window.checkFavicon === 'function') {
    window.checkFavicon();
  }
}

// 控制返回推荐主页按钮的显示
const showRecommendButton = computed(() => {
  // 只在StreamsPage页面显示
  if (!route.path.startsWith('/streams')) {
    return false;
  }
  
  // 检查路由参数，如果有id或direct_url，说明正在播放视频
  if (route.query.id || route.query.direct_url || route.query.search) {
    return true;
  }
  
  // 获取当前页面的组件实例
  const currentInstance = router.currentRoute.value.matched[0]?.instances?.default;
  if (!currentInstance) {
    return false;
  }
  
  // 如果显示的是推荐主页，则不显示按钮
  // 检查是否满足推荐主页显示条件：没有搜索中、没有搜索错误、没有搜索结果、搜索查询为空
  if (!currentInstance.isSearching && 
      !currentInstance.searchError && 
      (!currentInstance.searchResults || currentInstance.searchResults.length === 0) && 
      (!currentInstance.searchQuery || currentInstance.searchQuery.trim() === '')) {
    // 额外检查是否正在播放视频
    if (!currentInstance.isPlaying) {
      return false;
    }
  }
  
  // 检查是否有搜索结果或正在播放视频或有搜索查询
  return Boolean(
    currentInstance.isPlaying || 
    (currentInstance.searchResults && currentInstance.searchResults.length > 0) ||
    (currentInstance.filteredStreams && currentInstance.filteredStreams.length > 0) ||
    (currentInstance.searchQuery && currentInstance.searchQuery.trim() !== '') ||
    // 检查是否在播放页面但没有显示推荐
    (currentInstance.showingSearchResults === false && 
     !currentInstance.isSearching && 
     !currentInstance.searchError)
  );
});

// 返回推荐主页的方法
const returnToRecommendHome = () => {
  // 获取当前页面的组件实例
  const currentInstance = router.currentRoute.value.matched[0]?.instances?.default;
  if (currentInstance && typeof currentInstance.returnToHome === 'function') {
    currentInstance.returnToHome();
    
    // 清除URL参数，确保状态一致
    router.replace({
      path: '/streams',
      query: {}
    }).catch(() => {});
    
    // 延迟一段时间后强制刷新按钮状态，确保组件状态已更新
    setTimeout(() => {
      // 重新检查组件状态
      const updatedInstance = router.currentRoute.value.matched[0]?.instances?.default;
      if (updatedInstance) {
        // 直接设置一些关键状态，确保按钮隐藏
        if (updatedInstance.isPlaying) {
          updatedInstance.isPlaying = false;
        }
        if (updatedInstance.searchResults && updatedInstance.searchResults.length > 0) {
          updatedInstance.searchResults = [];
        }
        if (updatedInstance.searchQuery && updatedInstance.searchQuery.trim() !== '') {
          updatedInstance.searchQuery = '';
        }
        if (updatedInstance.filteredStreams && updatedInstance.filteredStreams.length > 0) {
          // 不直接修改filteredStreams，因为它可能是计算属性
          console.log("重置搜索状态");
        }
        
        // 强制刷新按钮状态
        refreshButtonState();
      }
    }, 100);
  }
};

// 提供返回推荐主页的方法给子组件
provide('returnToRecommendHome', returnToRecommendHome);

// 强制刷新按钮状态的方法
const refreshButtonState = () => {
  nextTick(() => {
    // 获取当前页面的组件实例
    const currentInstance = router.currentRoute.value.matched[0]?.instances?.default;
    if (currentInstance) {
      // 通过访问一些属性来触发计算属性重新计算
      // 如果在StreamsPage，检查一些关键状态
      if (route.path.startsWith('/streams')) {
        const hasResults = Boolean(
          currentInstance.searchResults && currentInstance.searchResults.length > 0
        );
        const isPlaying = Boolean(currentInstance.isPlaying);
      }
    }
  });
};

// 路由监听器引用
let routeWatcher = null;

// 使用afterEach钩子监听路由变化
onMounted(() => {
  // 设置路由afterEach钩子
  router.afterEach((to) => {
    // 更新meta信息
    updateMetaInfo(to);
    
    // 回到页面顶部（可选）
    // window.scrollTo(0, 0)
  });
  
  // 添加路由变化监听，确保按钮状态更新
  routeWatcher = router.beforeEach(() => {
    // 强制重新计算showRecommendButton
    refreshButtonState();
    return true;
  });
  
  checkAuthState();
  
  // 初始加载时设置meta信息
  updateMetaInfo(route);
  
  // 设置axios拦截器
  setupAxiosInterceptors(() => {
    logout();
    isLoggedIn.value = false;
  });
  
  // 加载页脚设置和网站基本信息
  loadFooterSettings();
  loadSiteInfo();
  
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // 优化滚动性能
  optimizeScrollPerformance();
  
  // 确保初始渲染后预加载底部元素
  nextTick(() => {
    setTimeout(preloadFooterContent, 1000);
  });
  
  // 添加beforeunload事件监听器
  window.addEventListener('beforeunload', clearPaginationStorage);

  // 添加不蒜子访问统计脚本
  const bszScript = document.createElement('script');
  bszScript.async = true;
  // bszScript.src = "//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
  bszScript.src = "//events.vercount.one/js";
  document.head.appendChild(bszScript);

  // 加载TMDB配置
  loadTMDBConfig();
  
  // 初始化时强制刷新一次按钮状态
  setTimeout(refreshButtonState, 500);
})

// 设置定期检查组件状态的定时器
const stateCheckInterval = setInterval(() => {
  if (route.path.startsWith('/streams')) {
    refreshButtonState();
  }
}, 10000); // 每10秒检查一次

// 监听route.query变化
watch(() => route.query, () => {
  // 强制重新计算showRecommendButton
  refreshButtonState();
}, { deep: true });

// 监听route.path变化
watch(() => route.path, () => {
  // 强制重新计算showRecommendButton
  refreshButtonState();
});

// 页面卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('beforeunload', clearPaginationStorage);
  
  // 移除路由监听
  if (routeWatcher && typeof routeWatcher === 'function') {
    routeWatcher();
  }
  
  // 清除定时器
  clearInterval(stateCheckInterval);
});
</script>

<style src="@/styles/App.css"></style>

