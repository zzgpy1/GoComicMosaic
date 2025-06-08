<template>
  <div class="home-container">
    <div class="hero-section">
      <!-- <h1 class="hero-title">精选美漫资源库</h1> -->
      <!-- <p class="hero-subtitle">资源共建，共享精彩</p> -->
      
      <!-- 搜索结果标题 -->
      <h2 v-if="route.query.search" class="search-results-title">
        <i class="bi bi-search me-2"></i>
        "{{ route.query.search }}" 的搜索结果
      </h2>
      
      <!-- 添加排序选项 -->
      <div class="sort-options">
        <button 
          @click="setSort('created_at')" 
          class="sort-btn" 
          :class="{ active: sortBy === 'created_at' }"
        >
          <i class="bi bi-calendar"></i>最新发布
        </button>
        <button 
          @click="setSort('likes_count')" 
          class="sort-btn" 
          :class="{ active: sortBy === 'likes_count' }"
        >
          <i class="bi bi-heart"></i>最多喜欢
        </button>
      </div>
    </div>
    
    <!-- 删除成功消息 -->
    <div v-if="deleteSuccess" class="alert-custom fade-in">
      <div class="alert-content">
        <i class="bi bi-check-circle-fill me-2"></i>资源已成功删除
        <button type="button" class="alert-close" @click="deleteSuccess = false">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>正在加载精彩内容</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error-message">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>
    
    <!-- 资源展示区 -->
    <div v-else class="resource-gallery">
      <div v-for="resource in resources" :key="resource.id" class="resource-card">
        <div class="card-inner" @click="goToDetail(resource.id)">
          <div class="card-front">
            <div class="image-wrapper">
              <img 
                :src="getPosterImage(resource)" 
                class="poster-image" 
                :alt="resource.title || resource.title_en"
                loading="lazy"
              >
              <div class="tag-container">
                <span 
                  v-for="(type, index) in getResourceTypes(resource)" 
                  :key="index"
                  class="resource-tag"
                >
                  {{ type }}
                </span>
              </div>
            </div>
            <div class="card-content">
              <div class="resource-title">
                <span v-if="resource.title" class="title-cn">{{ resource.title }}</span>
                <span v-else-if="resource.title_en" class="title-cn">{{ resource.title_en }}</span>
                <span v-if="resource.title && resource.title_en" class="title-en">{{ resource.title_en }}</span>
              </div>
            </div>
          </div>
          <div class="card-back">
            <div class="back-content">
              <div class="resource-title">
                <span v-if="resource.title" class="title-cn">{{ resource.title }}</span>
                <span v-else-if="resource.title_en" class="title-cn">{{ resource.title_en }}</span>
                <span v-if="resource.title && resource.title_en" class="title-en">{{ resource.title_en }}</span>
              </div>
              <p class="resource-description">{{ truncateDescription(resource.description) }}</p>
              <button class="view-details-btn">
                <span>查看详情</span>
                <i class="bi bi-arrow-right-short"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && !error && resources.length === 0" class="empty-state">
      <i class="bi bi-inbox-fill empty-icon"></i>
      <h3>暂无资源</h3>
      <p>成为第一个提交资源的用户</p>
      <router-link to="/submit" class="submit-resource-btn">
        提交资源
        <i class="bi bi-plus-circle ms-2"></i>
      </router-link>
    </div>
    
    <!-- 分页控件 - 修改条件：只要不是加载中、没有错误且有资源，就显示分页 -->
    <div v-if="!loading && !error && resources.length > 0" class="pagination-container">
      <div class="pagination-wrapper">
        <div class="pagination-controls">
          <button 
            aria-label="上一页"
            @click="goToPage(currentPage - 1)" 
            class="pagination-btn"
            :disabled="currentPage === 1"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          
          <div class="page-numbers">
            <!-- 如果只有一页，就只显示第1页 -->
            <button v-if="totalPages <= 1" class="page-btn active">1</button>
            <!-- 如果有多页，则显示计算出的页码 -->
            <button 
              v-else
              v-for="page in visiblePageNumbers" 
              :key="page"
              @click="goToPage(page)"
              class="page-btn"
              :class="{ active: page === currentPage }"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            aria-label="下一页"
            @click="goToPage(currentPage + 1)" 
            class="pagination-btn"
            :disabled="currentPage === totalPages || totalPages <= 1"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
        
        <div class="page-size-control">
          <span class="page-size-label">每页显示</span>
          <div class="page-size-input-group">
            <div @click="toggleCustomPageSize" class="page-size-value">
              {{ pageSize }}
            </div>
            <div v-if="showCustomPageSize" class="custom-page-size-input">
              <input 
                type="number" 
                v-model="customPageSize" 
                min="1"
                max="100"
                @keydown.enter="applyCustomPageSize"
                @blur="applyCustomPageSize"
                placeholder="1-100"
              >
            </div>
          </div>
          <span class="page-size-suffix">条</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { getPosterImage } from '@/utils/imageUtils'

const router = useRouter()
const route = useRoute()
const resources = ref([])
const loading = ref(true)
const error = ref(null)
const deleteSuccess = ref(false)
const sortBy = ref('created_at') // 默认按创建时间排序
const currentPage = ref(1)
const pageSize = ref(12) // 默认每页12条
const totalItems = ref(0)
const initialLoadDone = ref(false) // 使用ref管理初始加载状态

// 添加用于自定义每页显示数量的变量
const showCustomPageSize = ref(false)
const customPageSize = ref(12)

// 检测是否为移动设备
const isMobile = computed(() => {
  return window.innerWidth < 768
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value)
})

// 计算要显示的页码
const visiblePageNumbers = computed(() => {
  const pages = []
  // 移动端只显示3个页码，桌面端显示5个页码
  const maxVisiblePages = isMobile.value ? 3 : 5
  
  if (totalPages.value <= maxVisiblePages) {
    // 如果总页数小于等于最大可见页数，显示所有页码
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // 显示当前页附近的页码
    let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)
    
    // 确保始终显示maxVisiblePages个页码（如果有足够的页数）
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    // 添加页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // 添加省略号和首/末页（仅在桌面端显示）
    if (!isMobile.value) {
      if (startPage > 1) {
        pages.unshift(1)
        if (startPage > 2) {
          pages.splice(1, 0, '...')
        }
      }
      
      if (endPage < totalPages.value) {
        if (endPage < totalPages.value - 1) {
          pages.push('...')
        }
        pages.push(totalPages.value)
      }
    }
  }
  
  return pages
})

const fetchResources = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 计算跳过的条目数
    const skip = (currentPage.value - 1) * pageSize.value
    
    // 构建查询参数对象
    const params = {
      skip: skip,
      limit: pageSize.value,
      sort_by: sortBy.value,
      sort_order: 'desc'
    }
    
    // 如果URL中有搜索参数，添加到请求中
    if (route.query.search) {
      params.search = route.query.search
    }
    
    console.log(`Fetching resources with params:`, params);
    
    // 使用公共API获取已审批的资源，添加分页和排序参数
    const response = await axios.get('/api/resources/public', { params })
    
    resources.value = response.data
    
    // 从第一个资源的total_count字段获取总数
    if (resources.value.length > 0 && resources.value[0].total_count !== undefined) {
      totalItems.value = resources.value[0].total_count
      console.log(`总资源数: ${totalItems.value}`)
    } else if (currentPage.value === 1) {
      // 如果后端未返回总数且是第一页，使用当前结果长度作为总数
      totalItems.value = resources.value.length
    }
    
    console.log(`Fetched resources: ${resources.value.length} items, page ${currentPage.value}/${totalPages.value}`)
    initialLoadDone.value = true // 标记已完成初始加载
  } catch (err) {
    console.error('获取资源失败:', err)
    error.value = '获取资源列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/resource/${id}`)
}

// 截断描述文本
const truncateDescription = (text) => {
  if (!text) return '';
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
}

// 处理资源类型标签
const getResourceTypes = (resource) => {
  if (!resource.resource_type) return [];
  return resource.resource_type.split(',').slice(0, 3); // 最多显示3个标签
}

// 设置排序方式
const setSort = (sort) => {
  if (sortBy.value !== sort) {
    sortBy.value = sort
    currentPage.value = 1 // 重置到第一页
    fetchResources() // 重新获取资源
    
    // 保存用户排序偏好到localStorage
    localStorage.setItem('resourcesSortBy', sort)
  }
}

// 切换页码
const goToPage = (page) => {
  if (typeof page === 'number' && page !== currentPage.value && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchResources()
    
    // 保存当前页码到localStorage
    localStorage.setItem('resourcesCurrentPage', page)
    
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 修改每页显示数量
const changePageSize = () => {
  // 计算当前页面第一个资源的索引（从0开始）
  const currentFirstItemIndex = (currentPage.value - 1) * pageSize.value;
  
  // 根据新的每页显示数量，计算新的页码
  const newPage = Math.floor(currentFirstItemIndex / pageSize.value) + 1;
  
  // 计算新的总页数
  const newTotalPages = Math.ceil(totalItems.value / pageSize.value);
  
  // 确保新页码不超过总页数
  currentPage.value = Math.min(newPage, newTotalPages || 1);
  
  // 保存用户当前页码到localStorage
  localStorage.setItem('resourcesCurrentPage', currentPage.value);
  
  // 保存用户首选项到localStorage
  localStorage.setItem('resourcesPageSize', pageSize.value);
  
  // 重新获取资源
  fetchResources();
  
  console.log(`Changed page size to ${pageSize.value}, adjusted to page ${currentPage.value} of ${newTotalPages}`);
}

// 切换显示自定义每页显示数量输入框
const toggleCustomPageSize = () => {
  showCustomPageSize.value = true
  customPageSize.value = pageSize.value
  // 聚焦到输入框
  nextTick(() => {
    const input = document.querySelector('.custom-page-size-input input')
    if (input) {
      input.focus()
      input.select() // 选中所有文本，方便用户直接输入
    }
  })
}

// 应用自定义每页显示数量
const applyCustomPageSize = () => {
  // 确保输入值在合理范围内
  const value = parseInt(customPageSize.value);
  if (value && value > 0 && value <= 100) {
    // 保存当前每页显示数量
    const oldPageSize = pageSize.value;
    
    // 应用新的每页显示数量
    pageSize.value = value;
    
    // 调用changePageSize来调整页码并重新获取资源
    changePageSize();
  }
  showCustomPageSize.value = false;
}

// 监听URL参数中的搜索词
watch(() => route.query.search, (newSearch, oldSearch) => {
  // 只有当搜索条件变化时才触发请求，避免初始化时重复调用
  if (newSearch !== oldSearch) {
    if (newSearch) {
      // 有搜索参数时，重置到第一页并获取资源
      currentPage.value = 1 // 重置到第一页
      fetchResources()
    } else if (route.fullPath === '/') {
      // 当回到主页且没有搜索参数时，重新获取资源（清除搜索）
      currentPage.value = 1
      fetchResources()
    }
  }
})

onMounted(() => {
  // 根据设备类型确定初始的每页显示数量
  // 仅在首次加载且没有用户保存的偏好时设置默认值
  const savedPageSize = localStorage.getItem('resourcesPageSize')
  if (savedPageSize) {
    pageSize.value = parseInt(savedPageSize, 10)
  } else if (isMobile.value) {
    // 移动端默认每页显示6条
    pageSize.value = 6
    // 保存到localStorage
    localStorage.setItem('resourcesPageSize', '6')
  }
  
  // 从localStorage获取用户首选的排序方式
  const savedSortBy = localStorage.getItem('resourcesSortBy')
  if (savedSortBy) {
    sortBy.value = savedSortBy
  }
  
  // 从localStorage获取用户上次浏览的页码
  const savedCurrentPage = localStorage.getItem('resourcesCurrentPage')
  if (savedCurrentPage) {
    currentPage.value = parseInt(savedCurrentPage, 10)
  }
  
  // 只在组件首次挂载且未加载数据时获取资源
  if (!initialLoadDone.value) {
    fetchResources()
  }
  
  // 检查URL查询参数，显示删除成功提示
  if (route.query.deleted === 'success') {
    deleteSuccess.value = true
    // 清除查询参数
    router.replace({ path: route.path })
    
    // 3秒后自动隐藏提示
    setTimeout(() => {
      deleteSuccess.value = false
    }, 3000)
  }
  
  // 监听窗口大小变化，更新页码显示
  window.addEventListener('resize', handleResize)
  
  // 添加路由事件监听，确保在页面重新激活时不会重复加载资源
  const removeRouterListener = router.afterEach((to, from) => {
    // 如果是从详情页回到首页，且已经加载过资源，则不重新加载
    if (to.path === '/' && from.name === 'ResourceDetail' && initialLoadDone.value) {
      console.log('从详情页返回主页，保持当前资源列表状态');
    }
  });
})

// 处理窗口大小变化，更新页码显示
const handleResize = () => {
  // 当窗口大小变化时，visiblePageNumbers计算属性会自动重新计算
  // 不需要额外操作
}

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (typeof removeRouterListener === 'function') {
    removeRouterListener()
  }
})
</script>

<style scoped src="@/styles/Home.css"></style>