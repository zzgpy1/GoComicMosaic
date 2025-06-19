<template>
  <div class="header-search-container">
    <!-- 搜索框 -->
    <div class="search-wrapper" :class="{ 'active': isSearchActive || searchText }">
      <div class="search-box">
        <i class="bi bi-search search-icon"></i>
        <input 
          type="text" 
          class="search-input" 
          placeholder="搜索资源..." 
          v-model="searchText"
          @focus="isSearchActive = true"
          @blur="handleBlur"
          @input="performSearch"
          @keydown.esc="clearSearch"
        />
        <button v-if="searchText" class="clear-btn" @click="clearSearch">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
    
    <!-- 搜索结果弹出框 -->
    <div v-if="searching" class="search-results-popup">
      <div class="results-header">
        <h3 class="results-title">
          正在搜索...
        </h3>
      </div>
      <div class="loading-container">
        <div class="loader"></div>
      </div>
    </div>
    
    <!-- 搜索结果弹出框 -->
    <div v-else-if="searchText && searchResults.length > 0" class="search-results-popup">
      <div class="results-header">
        <h3 class="results-title">
          找到 {{ searchResults.length }} 个结果
        </h3>
        <button class="close-results-btn" @click="clearSearch" title="关闭结果">
          <i class="bi bi-x"></i>
        </button>
      </div>
      
      <div class="results-list">
        <div 
          v-for="resource in searchResults.slice(0, 5)" 
          :key="resource.id" 
          class="result-item"
          @click="goToDetail(resource.id)"
        >
          <div class="result-image">
            <img 
              :src="getPosterImage(resource)" 
              :alt="resource.title || resource.title_en" 
              loading="lazy"
            />
          </div>
          <div class="result-info">
            <h4 class="result-title">
              {{ resource.title || resource.title_en }}
            </h4>
            <p v-if="resource.title && resource.title_en" class="result-subtitle">{{ resource.title_en }}</p>
            <div class="result-tags">
              <span 
                v-for="(type, index) in getResourceTypes(resource)" 
                :key="index"
                class="result-tag"
              >
                {{ type }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 显示更多结果链接 -->
        <div v-if="searchResults.length > 5" class="more-results">
          <button class="more-btn" @click="showAllResults">
            <i class="bi bi-list"></i>
            查看全部 {{ searchResults.length }} 个结果
          </button>
        </div>
      </div>
    </div>
    
    <!-- 空结果弹出框 -->
    <div v-else-if="searchText && hasSearched && searchResults.length === 0" class="search-results-popup empty-results">
      <div class="empty-results-content">
        <i class="bi bi-search"></i>
        <p>未找到"{{ searchText }}"相关资源</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { getPosterImage } from '@/utils/imageUtils'

const router = useRouter()
const searchText = ref('')
const isSearchActive = ref(false)
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)

// 搜索防抖
let debounceTimeout = null
const performSearch = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  
  if (!searchText.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  
  debounceTimeout = setTimeout(async () => {
    searching.value = true
    searchResults.value = []
    
    try {
      const response = await axios.get(`/api/resources/public?search=${encodeURIComponent(searchText.value.trim())}`)
      searchResults.value = response.data
      hasSearched.value = true
      console.log('搜索成功，找到', searchResults.value.length, '条结果')
    } catch (err) {
      console.error('搜索资源失败:', err)
    } finally {
      searching.value = false
    }
  }, 300)
}

// 跳转到资源详情
const goToDetail = (id) => {
  router.push(`/resource/${id}`)
  clearSearch()
}

// 显示全部搜索结果
const showAllResults = () => {
  // 实现方式：可以通过路由导航到一个搜索结果页面，传递当前搜索词
  router.push({
    path: '/',
    query: { search: searchText.value }
  })
  clearSearch()
}

// 显示资源的标签
const getResourceTypes = (resource) => {
  if (!resource.resource_type) return []
  return resource.resource_type.split(',').slice(0, 2) // 最多显示2个标签
}

// 清除搜索
const clearSearch = () => {
  searchText.value = ''
  searchResults.value = []
  hasSearched.value = false
}

// 处理失焦
const handleBlur = () => {
  // 延迟关闭搜索状态
  setTimeout(() => {
    if (!searchText.value) {
      isSearchActive.value = false
    }
  }, 200)
}

onMounted(() => {
  document.addEventListener('click', (event) => {
    const container = document.querySelector('.header-search-container')
    if (container && !container.contains(event.target)) {
      isSearchActive.value = false
    }
  })
})
</script>

<style scoped src="@/styles/LocalSearch.css"></style>