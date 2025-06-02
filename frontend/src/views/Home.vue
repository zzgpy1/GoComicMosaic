<template>
  <div class="home-container">
    <div class="hero-section">
      <!-- <h1 class="hero-title">精选美漫资源库</h1> -->
      <!-- <p class="hero-subtitle">资源共建，共享精彩</p> -->
      
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
    
    // 使用公共API获取已审批的资源，添加分页和排序参数
    const response = await axios.get('/api/resources/public', {
      params: {
        skip: skip,
        limit: pageSize.value,
        sort_by: sortBy.value,
        sort_order: 'desc'
      }
    })
    
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

// 获取海报图片
const getPosterImage = (resource) => {
  // 优先使用指定的海报图片
  if (resource.poster_image) {
    return resource.poster_image
  }
  // 如果没有指定海报，则使用第一张图片
  else if (resource.images && resource.images.length > 0) {
    return resource.images[0]
  } 
  // 都没有则使用占位图
  else {
    return 'https://via.placeholder.com/300x400'
  }
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
watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    // 实现搜索功能
    // 这里可以增加搜索相关代码
    currentPage.value = 1 // 重置到第一页
    fetchResources()
  }
}, { immediate: true })

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
  
  fetchResources()
  
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
})

// 处理窗口大小变化，更新页码显示
const handleResize = () => {
  // 当窗口大小变化时，visiblePageNumbers计算属性会自动重新计算
  // 不需要额外操作
}

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 全局容器样式 */
.home-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 英雄区域样式 */
.hero-section {
  text-align: center;
  padding: 4rem 0;
  margin-bottom: 3rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: var(--card-radius);
  box-shadow: 
    0 25px 45px rgba(0, 0, 0, 0.1),
    inset 0 -2px 6px rgba(255, 255, 255, 0.7),
    inset 2px 2px 6px rgba(255, 255, 255, 1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.hero-section:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.15),
    inset 0 -2px 6px rgba(255, 255, 255, 0.7),
    inset 2px 2px 6px rgba(255, 255, 255, 1);
}

/* 添加炫彩背景元素 */
.hero-section::before {
  content: "";
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  z-index: -1;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 105, 180, 0.15) 0%, transparent 30%),
    radial-gradient(circle at 70% 40%, rgba(64, 224, 208, 0.15) 0%, transparent 30%),
    radial-gradient(circle at 40% 80%, rgba(255, 215, 0, 0.15) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(123, 104, 238, 0.15) 0%, transparent 30%);
  /* 移除旋转动画和固定旋转角度，保持水平状态 */
}

/* 添加水滴效果装饰 */
.hero-section::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 40px;
  bottom: 0;
  left: 0;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.3));
  border-radius: 0 0 var(--card-radius) var(--card-radius);
  z-index: -1;
}

/* 修改标题样式，移除渐变效果，增加3D质感 */
.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: var(--primary-color);
  letter-spacing: -1px;
  position: relative;
  z-index: 2;
  text-shadow: 
    3px 3px 0 rgba(99, 102, 241, 0.2),
    6px 6px 10px rgba(0, 0, 0, 0.1);
  transform-style: preserve-3d;
  transform: perspective(500px) translateZ(10px);
}

.hero-subtitle {
  font-size: 1.35rem;
  color: var(--gray-color);
  max-width: 600px;
  margin: 0 auto;
  font-weight: 500;
  letter-spacing: -0.2px;
  position: relative;
  z-index: 2;
}

/* 自定义提示框样式 */
.alert-custom {
  margin: 2rem 0;
  animation: slideInDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.alert-content {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-color);
  padding: 1.5rem 2rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.08),
    0 5px 15px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(16, 185, 129, 0.3),
    inset 1px 1px 1px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--success-color);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition);
}

.alert-close:hover {
  background-color: rgba(16, 185, 129, 0.1);
  transform: rotate(90deg);
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}

.loader {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15);
}

/* 错误提示样式 */
.error-message {
  padding: 2rem;
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  border-radius: var(--card-radius);
  text-align: center;
  margin: 2.5rem 0;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.1);
}

/* 资源画廊样式 */
.resource-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.5rem;
  width: 100%;
  margin-top: 2rem;
}

.resource-card {
  height: 400px;
  perspective: 2000px;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
}

.resource-card:hover {
  transform: translateY(-10px);
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
  cursor: pointer;
  border-radius: var(--card-radius);
  box-shadow: 
    0 20px 35px rgba(0, 0, 0, 0.1),
    0 10px 20px rgba(0, 0, 0, 0.08);
}

.resource-card:hover .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: var(--card-radius);
  overflow: hidden;
}

.card-front {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    inset 1px 1px 1px rgba(255, 255, 255, 1),
    inset -1px -1px 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.card-back {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transform: rotateY(180deg);
  box-shadow: 
    0 25px 40px rgba(0, 0, 0, 0.25),
    0 15px 15px rgba(0, 0, 0, 0.15),
    inset 1px 1px 1px rgba(255, 255, 255, 0.3),
    inset -1px -1px 1px rgba(0, 0, 0, 0.1);
}

.image-wrapper {
  height: 320px;
  overflow: hidden;
  position: relative;
  background-color: rgba(0, 0, 0, 0.03);
  flex-grow: 1;
  width: 100%;
}

.image-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0.3) 100%);
  z-index: 1;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
  filter: brightness(1.05) contrast(1.05);
}

.resource-card:hover .poster-image {
  transform: scale(1.12) rotate(1deg);
}

.card-content {
  padding: 0.6rem 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 var(--card-radius) var(--card-radius);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 -5px 15px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.resource-title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow: hidden;
  color: var(--dark-color);
  height: 100%;
  justify-content: center;
}

.title-cn {
  font-size: 1.15rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: -0.3px;
  line-height: 1.3;
}

.title-en {
  font-size: 0.9rem;
  color: var(--gray-color);
  font-style: italic;
  font-weight: 400;
  opacity: 0.9;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  line-height: 1.2;
  display: block;
  margin-top: 0.1rem;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem 1rem;
  z-index: 2;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), transparent);
}

.resource-tag {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.85);
  color: var(--primary-color);
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
  font-weight: 600;
  letter-spacing: -0.2px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
}

.resource-tag:hover {
  background: rgba(99, 102, 241, 0.2);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.25);
}

.back-content {
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
}

.back-content::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
  filter: blur(5px);
}

.back-content .resource-title {
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 1;
  height: auto;
}

.back-content .title-cn {
  color: white;
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  white-space: normal;
}

.back-content .title-en {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin-top: 0.35rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  white-space: normal;
}

.resource-description {
  font-size: 0.95rem;
  line-height: 1.7;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.9);
}

.view-details-btn {
  background: rgba(255, 255, 255, 0.95);
  color: #7a5cf0;
  border: none;
  padding: 0.95rem 2rem;
  border-radius: 100px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  align-self: center;
  margin-top: auto;
  box-shadow: 
    0 15px 25px rgba(0, 0, 0, 0.25),
    0 5px 10px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 1);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.view-details-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
  z-index: -1;
}

.view-details-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 
    0 20px 30px rgba(0, 0, 0, 0.3),
    0 10px 15px rgba(0, 0, 0, 0.2);
  color: #5c41e0;
}

.view-details-btn:hover::before {
  transform: translateX(100%);
}

.view-details-btn:active {
  transform: translateY(0) scale(0.95);
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  text-align: center;
  color: var(--gray-color);
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--card-radius);
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.08),
    0 5px 15px rgba(0, 0, 0, 0.05),
    inset 1px 1px 1px rgba(255, 255, 255, 1),
    inset -1px -1px 1px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
  opacity: 0.5;
  color: var(--primary-color);
  animation: float 6s infinite ease-in-out;
  filter: drop-shadow(0 10px 10px rgba(99, 102, 241, 0.2));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--dark-color);
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 500px;
}

.submit-resource-btn {
  display: inline-flex;
  align-items: center;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 100px;
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 15px 30px rgba(99, 102, 241, 0.3),
    0 5px 15px rgba(99, 102, 241, 0.2),
    inset 1px 1px 1px rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.submit-resource-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.submit-resource-btn:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 20px 40px rgba(99, 102, 241, 0.4),
    0 10px 20px rgba(99, 102, 241, 0.25);
}

.submit-resource-btn:hover::before {
  transform: translateX(100%);
}

/* 动画定义 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideInDown {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .resource-gallery {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 1200px) {
  .resource-gallery {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .image-wrapper {
    height: 280px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2.5rem 1rem;
    margin-bottom: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
    padding: 0 1rem;
  }
  
  .resource-gallery {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.25rem;
  }
  
  .resource-card {
    height: 380px;
  }
  
  .image-wrapper {
    height: 300px;
  }
  
  .card-content {
    padding: 0.5rem 1rem;
  }
  
  .resource-title {
    font-size: 1rem;
  }
}

@media (max-width: 1200px) {
  .resource-gallery {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .resource-card {
    height: 340px;
  }
  
  .image-wrapper {
    height: 260px;
  }
  
  .card-content {
    padding: 0.5rem 0.75rem;
  }
  
  .resource-title {
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .tag-container {
    padding: 0.75rem 0.75rem 0.35rem;
  }
  
  .resource-tag {
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
  }
  
  .back-content {
    padding: 1.5rem;
  }
  
  .view-details-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.85rem;
  }
}

/* 排序选项样式 */
.sort-options {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.sort-btn {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.15);
  color: var(--dark-color);
  padding: 0.5rem 1.25rem;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.sort-btn:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 15px rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.3);
}

.sort-btn.active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
}

.sort-btn i {
  font-size: 1rem;
}

/* 移动端样式优化 */
@media (max-width: 768px) {
  .sort-options {
    flex-wrap: wrap;
  }
  
  .sort-btn {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }
}

/* 分页容器样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  padding: 1rem;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.pagination-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(124, 58, 237, 0.2);
  background: rgba(255, 255, 255, 0.7);
  color: var(--primary-color);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(124, 58, 237, 0.15);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-btn {
  min-width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(124, 58, 237, 0.2);
  background: rgba(255, 255, 255, 0.7);
  color: var(--dark-color);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.page-btn:hover:not(.active) {
  background: rgba(124, 58, 237, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(124, 58, 237, 0.15);
}

.page-btn.active {
  background: var(--primary-gradient);
  color: white;
  border: none;
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
}

.page-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.page-size-label {
  font-size: 0.95rem;
  color: var(--dark-color);
  font-weight: 500;
}

.page-size-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.page-size-value {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 100px;
  padding: 0.35rem 0.75rem;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 45px;
  text-align: center;
  user-select: none;
}

.page-size-value:hover {
  background: rgba(124, 58, 237, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(124, 58, 237, 0.1);
}

.page-size-suffix {
  font-size: 0.95rem;
  color: var(--dark-color);
}

.custom-page-size-input {
  position: absolute;
  left: 0;
  top: -45px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  z-index: 10;
  animation: fadeIn 0.2s ease;
}

.custom-page-size-input input {
  width: 70px;
  padding: 0.35rem 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 100px;
  text-align: center;
  font-weight: 600;
  color: var(--primary-color);
}

.custom-page-size-input input:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* 媒体查询 */
@media (max-width: 768px) {
  .pagination-wrapper {
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }
  
  .pagination-controls {
    width: 100%;
  }
  
  .page-size-control {
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .pagination-btn, .page-btn {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .page-size-value {
    padding: 0.3rem 0.5rem;
    font-size: 0.9rem;
    width: 35px;
  }
  
  .page-size-label, .page-size-suffix {
    font-size: 0.9rem;
  }
  
  .custom-page-size-input {
    top: -40px;
  }
  
  .custom-page-size-input input {
    width: 60px;
  }
}
</style> 