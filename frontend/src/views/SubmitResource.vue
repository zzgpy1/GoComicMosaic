<template>
  <div class="submit-resource">
    <div class="hero-section">
      <h1 class="hero-title">{{ isSupplementMode ? '补充资源' : '提交资源' }}</h1>
      <p class="hero-subtitle">{{ isSupplementMode ? '为现有资源添加新图片和链接' : '分享您喜爱的优质资源，让更多人受益' }}</p>
    </div>
    
    <div v-if="submitting" class="loading-container">
      <div class="loader"></div>
      <p>正在提交资源，请稍候...</p>
    </div>
    
    <div v-else-if="submitSuccess" class="success-card fade-in">
      <div class="success-icon">
        <i class="bi bi-check-circle-fill"></i>
      </div>
      <h3>提交成功!</h3>
      <p>您的资源已成功提交到平台，正在等待管理员审批。</p>
      <p>审批通过后，资源将出现在首页列表中。</p>
      <div class="success-actions">
        <router-link to="/" class="btn-custom btn-outline">
          <i class="bi bi-house"></i> <span class="btn-text-keep">返回首页</span>
        </router-link>
        <button @click="resetForm" class="btn-custom btn-primary">
          <i class="bi bi-plus-circle"></i> <span class="btn-text-keep">继续提交</span>
        </button>
      </div>
    </div>
    
    <form v-else @submit.prevent="submitResource" class="form-card">
      <!-- 提交说明 -->
      <div class="info-banner">
        <i class="bi bi-info-circle"></i>
        <span>{{ isSupplementMode ? '您正在进行资源补充，审核通过后将添加到已有资源。' : '您正在提交新资源，审核通过后将显示在首页。' }}</span>
      </div>
      
      <!-- 资源标题搜索区域 -->
      <div class="search-card" v-if="!isSupplementMode">
        <div class="card-header">
          <h3>检查资源是否存在</h3>
        </div>
        <div class="card-body">
          <p class="text-note">请先搜索资源标题，检查是否已存在以避免重复提交：</p>
          <div v-if="isFromDetailPage && isSupplementMode" class="success-message">
            <i class="bi bi-check-circle-fill"></i>
            <span>您正在补充<strong>{{ selectedResource.title || selectedResource.title_en }}</strong>的资源，请直接上传新图片。</span>
          </div>
          <div v-else>
            <div class="search-box">
                <input 
                  type="text" 
                class="custom-input" 
                  placeholder="输入资源标题关键词..." 
                  v-model="searchQuery"
                  @input="searchResources"
                  :disabled="isSupplementMode"
                >
            </div>
            
            <!-- 搜索状态和结果 -->
            <div v-if="searching" class="loading-inline">
              <div class="spinner small-spinner"></div>
              <span>搜索中...</span>
            </div>
            <div v-else-if="searchResults.length > 0" class="search-results">
              <h5>找到以下相似资源: <span class="result-count">({{ searchResults.length }}个结果)</span></h5>
              <div class="results-list">
                <div 
                  v-for="result in searchResults" 
                  :key="result.id"
                  class="result-item"
                  :class="{'active': selectedResource && selectedResource.id === result.id}"
                  @click="selectResource(result)"
                >
                  <div class="result-info">
                    <strong>{{ result.title || '无中文标题' }}</strong>
                    <small class="result-subtitle">{{ result.title_en || '无英文标题' }}</small>
                  </div>
                  <span class="result-type">{{ result.resource_type }}</span>
                </div>
              </div>
              <div class="results-actions">
                <button type="button" class="btn-custom btn-outline" @click="clearSearch">
                  <i class="bi bi-arrow-repeat"></i>
                  <span class="btn-text">重新搜索</span>
                </button>
                <button 
                  type="button" 
                  class="btn-custom btn-primary" 
                  :disabled="!selectedResource" 
                  @click="confirmSupplement"
                >
                  确认补充此资源
                </button>
              </div>
            </div>
            <div v-else-if="hasSearched && searchResults.length === 0" class="empty-results">
              <i class="bi bi-check-circle-fill"></i>
              <span>没有找到相似资源，您可以提交新资源!</span>
              <button type="button" class="btn-custom btn-outline small" @click="clearSearch">
                <i class="bi bi-arrow-repeat"></i>
                <span class="btn-text">重新搜索</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 表单标题 -->
      <div class="form-header">
        <h3>{{ isSupplementMode ? '补充资源信息' : '新增资源信息' }}</h3>
        <div v-if="isSupplementMode" class="mode-badge">补充模式</div>
      </div>
      
      <!-- 已选资源信息（补充模式） -->
      <div v-if="isSupplementMode" class="selected-resource-card">
        <h4>您正在补充以下资源:</h4>
        <div class="resource-info">
          <div class="info-row">
            <span class="info-label">中文标题:</span>
            <span class="info-value">{{ selectedResource.title || '无' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">英文标题:</span>
            <span class="info-value">{{ selectedResource.title_en || '无' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">类型:</span>
            <span class="info-value">{{ selectedResource.resource_type }}</span>
          </div>
        </div>
      </div>
      
      <!-- 中文名称 -->
      <div class="form-group" v-if="!isSupplementMode">
        <label for="title" class="form-label">中文名称</label>
        <input 
          type="text" 
          class="custom-input" 
          id="title" 
          v-model="form.title" 
          placeholder="输入资源的中文名称"
        >
        <div class="form-hint">中文名称或英文名称至少填写一项</div>
      </div>
      
      <!-- 英文名称 -->
      <div class="form-group" v-if="!isSupplementMode">
        <label for="title_en" class="form-label">英文名称</label>
        <input 
          type="text" 
          class="custom-input" 
          id="title_en" 
          v-model="form.title_en" 
          placeholder="输入资源的英文名称"
        >
      </div>
      
      <!-- 资源类型（优化后的多选） -->
      <div class="form-group" v-if="!isSupplementMode">
        <label for="resource_types" class="form-label">资源类型</label>
        <div class="resource-type-options">
          <div 
            v-for="(type, index) in resourceTypes" 
            :key="index" 
            class="resource-type-option"
            :class="{ 'selected': isTypeSelected(type) }"
                @click="toggleType(type)"
              >
            <span class="option-text">{{ type }}</span>
            <i v-if="isTypeSelected(type)" class="bi bi-check-circle-fill check-icon"></i>
              </div>
            </div>
        <div class="selected-types-preview">
          <span>已选类型：</span>
          <span v-if="selectedTypes.length > 0" class="selected-type-text">{{ selectedTypes.join(', ') }}</span>
          <span v-else class="text-muted">未选择</span>
          </div>
      </div>
      
      <!-- 简介 -->
      <div class="form-group" v-if="!isSupplementMode">
        <label for="description" class="form-label">简介</label>
        <textarea 
          class="custom-textarea" 
          id="description" 
          rows="4" 
          v-model="form.description" 
          placeholder="请描述资源的背景、内容、特点等信息..."
          required
        ></textarea>
      </div>
      
      <!-- 资源链接 -->
      <div class="form-group">
        <label class="form-label">
          资源链接
          <span class="optional-badge">可选</span>
        </label>
        <div class="links-card">
          <p class="link-info-text">
              您可以提供网盘链接或在线观看地址，方便其他用户获取资源。每种类型可添加多个链接。
            </p>
            
            <!-- 链接类型选项卡 -->
          <div class="links-tabs">
                <button 
              v-for="(urls, category) in resourceLinks" 
              :key="category"
              class="tab-btn" 
                  :class="{ active: activeCategory === category }"
                  @click.prevent="activeCategory = category"
                >
                  {{ getCategoryDisplayName(category) }}
              <span v-if="urls.length > 0" class="tab-badge">{{ urls.length }}</span>
                </button>
          </div>
            
            <!-- 链接输入区域 -->
          <div class="links-content">
            <div v-for="(category, categoryIndex) in Object.keys(resourceLinks)" :key="categoryIndex" 
                  v-show="activeCategory === category"
                  class="link-category-content">
              <div v-if="resourceLinks[category].length === 0" class="empty-links">
                <i class="bi bi-link-45deg empty-icon"></i>
                <p>暂无{{ getCategoryDisplayName(category) }}链接，点击下方按钮添加</p>
              </div>
              
              <!-- 已添加的链接 -->
              <div class="results-list">
                <div class="link-item" v-for="(link, index) in resourceLinks[category]" :key="index">
                  <div class="link-inputs">
                    <div class="input-group">
                      <div class="input-prefix">
                        <i class="bi bi-link-45deg"></i>
                        <span>链接</span>
                      </div>
                      <input 
                        type="text" 
                        class="custom-input" 
                        v-model="link.url" 
                        placeholder="输入链接地址"
                      >
                    </div>
                    
                    <div class="input-group">
                      <div class="input-prefix">
                        <i class="bi bi-key"></i>
                        <span>密码</span>
                      </div>
                      <input 
                        type="text" 
                        class="custom-input" 
                        v-model="link.password" 
                        placeholder="提取码(可选)"
                      >
                    </div>
                    
                    <div class="input-group">
                      <div class="input-prefix">
                        <i class="bi bi-info-circle"></i>
                        <span>备注</span>
                      </div>
                      <input 
                        type="text" 
                        class="custom-input" 
                        v-model="link.note" 
                        placeholder="如:第1季"
                      >
                    </div>
                  </div>
                  
                    <button 
                      type="button" 
                    class="remove-link-btn"
                      @click="removeLink(category, index)"
                      title="删除链接"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                </div>
              </div>
              
              <!-- 添加链接按钮 -->
              <div class="add-link-container">
                <button 
                  type="button" 
                  class="btn-custom btn-outline add-link-btn"
                  @click="addLink(category)"
                >
                  <i class="bi bi-plus-circle"></i> 添加{{ getCategoryDisplayName(category) }}链接
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图片上传 -->
      <div class="form-group">
        <label class="form-label">
          {{ isSupplementMode ? '补充资源图片' : '图片上传' }}
          <span class="image-count-badge">最多10张</span>
        </label>
        
        <!-- 上传方式切换 -->
        <div class="upload-method-tabs">
          <button 
            type="button" 
            class="method-tab" 
            :class="{'active': imageUploadMode === 'local'}"
            @click="imageUploadMode = 'local'"
          >
            <i class="bi bi-upload"></i> 本地上传
          </button>
          <button 
            type="button" 
            class="method-tab" 
            :class="{'active': imageUploadMode === 'url'}"
            @click="imageUploadMode = 'url'"
          >
            <i class="bi bi-link-45deg"></i> 图片链接
          </button>
        </div>
        
        <!-- 本地上传区域 -->
        <div v-if="imageUploadMode === 'local'">
          <div 
            class="dropzone-container" 
            :class="{'active-dropzone': isDragging}"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
          >
            <div class="dropzone-content">
              <div v-if="uploadedImages.length < 10">
                <i class="bi bi-cloud-arrow-up-fill dropzone-icon"></i>
                <p>拖拽图片文件到此处，或</p>
                <label for="file-upload" class="btn-custom btn-outline file-upload-btn">
                  <i class="bi bi-image"></i> <span class="file-btn-text">选择文件</span>
                </label>
                <input 
                  type="file" 
                  id="file-upload" 
                  @change="handleFilesSelection" 
                  multiple 
                  accept="image/*" 
                  class="d-none"
                >
                <p class="upload-hint">支持同时上传多个文件</p>
              </div>
              <div v-else class="upload-limit-reached">
                <i class="bi bi-exclamation-circle"></i>
                <p>已达到最大上传数量（10张）</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图片链接输入区域 -->
        <div v-else-if="imageUploadMode === 'url'" class="url-upload-container">
          <div class="url-input-group">
            <input 
              type="text" 
              class="custom-input" 
              v-model="imageUrlInput" 
              placeholder="输入图片URL地址 (http://或https://开头)"
              :disabled="uploadedImages.length >= 10"
            >
            <button 
              type="button" 
              class="btn-custom btn-primary add-url-btn" 
              @click="addImageByUrl"
              :disabled="!isValidImageUrl || uploadedImages.length >= 10"
            >
              <i class="bi bi-plus-circle"></i> 添加图片
            </button>
          </div>
          <div class="url-hints">
            <p v-if="imageUrlInput && !isValidImageUrl" class="url-error">
              <i class="bi bi-exclamation-triangle"></i> 
              请输入有效的图片URL地址 (以http://或https://开头)
            </p>
            <p v-else-if="uploadedImages.length >= 10" class="url-error">
              <i class="bi bi-exclamation-circle"></i>
              已达到最大上传数量（10张）
            </p>
            <p v-else class="url-tip">
              <i class="bi bi-info-circle"></i>
              支持JPG、JPEG、PNG、GIF、WebP格式的图片链接
            </p>
          </div>
        </div>
        
        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-info">
            <div class="spinner"></div>
            <div>正在上传图片 {{ currentUploadIndex }}/{{ totalUploadCount }}，请稍等...</div>
          </div>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-inner" 
              :style="{width: `${uploadProgress}%`}" 
            >{{ uploadProgress }}%</div>
          </div>
        </div>
        
        <!-- 已上传图片预览 -->
        <div v-if="uploadedImages.length > 0" class="image-preview-section">
          <div class="preview-header">
            <h5>已上传 {{ uploadedImages.length }}/10 张图片</h5>
            <button 
              type="button" 
              class="btn-custom btn-outline btn-sm" 
              @click="clearAllImages"
              v-if="uploadedImages.length > 0"
            >
              <i class="bi bi-trash"></i> <span class="btn-text">清空所有</span>
            </button>
          </div>
          <div class="image-grid">
            <div class="image-item" v-for="(image, index) in uploadedImages" :key="index">
              <div class="image-preview-container">
                <img :src="image" class="image-preview" alt="预览">
                <div class="image-overlay">
                <button 
                  type="button" 
                    class="image-action-btn remove-btn"
                  @click="removeImage(index)"
                >
                    <i class="bi bi-trash"></i> 删除
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ error }}
      </div>
      
      <div class="form-actions">
        <router-link to="/" class="btn-custom btn-outline">取消</router-link>
        <button 
          type="submit" 
          class="btn-custom btn-primary" 
          :disabled="submitting || (!isSupplementMode && uploadedImages.length === 0)"
        >
          <i class="bi bi-cloud-upload"></i> {{ isSupplementMode ? '提交资源补充' : '提交新资源' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { calculateFileHash, getFileExtension } from '../utils/imageUtils'

const router = useRouter()
const route = useRoute()
const submitting = ref(false)
const submitSuccess = ref(false)
const error = ref(null)
const uploading = ref(false)
const uploadedImages = ref([])
const selectedTypes = ref([])
const isDragging = ref(false)
const uploadProgress = ref(0)
const currentUploadIndex = ref(0)
const totalUploadCount = ref(0)
const showTypeDropdown = ref(false)

// 图片上传相关
const imageUploadMode = ref('local') // 'local' 或 'url'
const imageUrlInput = ref('')
const isValidImageUrl = computed(() => {
  const url = imageUrlInput.value.trim()
  return url.startsWith('http://') || url.startsWith('https://')
})

// 资源搜索相关
const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref([])
const hasSearched = ref(false)
const selectedResource = ref(null)
const isSupplementMode = ref(false)
const isFromDetailPage = ref(false)

// 防抖定时器
let searchTimeout = null

// 资源类型选项
const resourceTypes = [
  '幽默', '讽刺', '冒险', '科幻', '动作', '奇幻', 
  '恐怖', '犯罪', '悬疑', '浪漫', '历史', '战争'
]

// 计算可选的类型（排除已选中的）
const availableTypes = computed(() => {
  return resourceTypes
})

const form = reactive({
  title: '',
  title_en: '',
  description: '',
  resource_type: '',
  images: []
})

// 计算得到的resource_type字段，将选中的类型转换为逗号分隔的字符串
const formattedResourceType = computed(() => {
  return selectedTypes.value.join(',')
})

// 搜索资源
const searchResources = () => {
  // 防抖处理
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  
  searchTimeout = setTimeout(async () => {
    searching.value = true
    searchResults.value = []
    
    try {
      const response = await axios.get(`/api/resources/public?search=${encodeURIComponent(searchQuery.value)}`)
      searchResults.value = response.data
      hasSearched.value = true
    } catch (err) {
      console.error('搜索资源失败:', err)
      error.value = '搜索资源失败，请稍后重试'
    } finally {
      searching.value = false
    }
  }, 300)
}

// 选择已有资源进行补充
const selectResource = (resource) => {
  selectedResource.value = resource
}

// 确认补充模式
const confirmSupplement = () => {
  if (!selectedResource.value) return
  
  isSupplementMode.value = true
  // 清除搜索结果，保留选定的资源
  searchResults.value = []
  hasSearched.value = true
}

// 取消补充模式
const cancelSupplement = () => {
  isSupplementMode.value = false
  selectedResource.value = null
  isFromDetailPage.value = false
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  selectedResource.value = null
  isSupplementMode.value = false
  isFromDetailPage.value = false
}

// 类型选择相关方法
const toggleTypeDropdown = () => {
  showTypeDropdown.value = !showTypeDropdown.value
}

const toggleType = (type) => {
  const index = selectedTypes.value.indexOf(type)
  if (index === -1) {
    selectedTypes.value.push(type)
  } else {
    selectedTypes.value.splice(index, 1)
  }
}

const removeType = (type) => {
  const index = selectedTypes.value.indexOf(type)
  if (index !== -1) {
    selectedTypes.value.splice(index, 1)
  }
}

const isTypeSelected = (type) => {
  return selectedTypes.value.includes(type)
}

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  const container = document.querySelector('.type-select-container')
  if (container && !container.contains(event.target)) {
    showTypeDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // 检查URL参数是否包含补充资源的指示
  const supplementId = route.query.supplementId
  const supplementMode = route.query.supplementMode === 'true'
  
  // 如果有指定要补充的资源ID，自动获取该资源并进入补充模式
  if (supplementId && supplementMode) {
    fetchResourceForSupplement(supplementId)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 处理文件拖放
const handleFileDrop = (event) => {
  isDragging.value = false
  const files = [...event.dataTransfer.files]
  if (files.length > 0) {
    uploadFiles(files)
  }
}

// 处理文件选择
const handleFilesSelection = (event) => {
  const files = [...event.target.files]
  if (files.length > 0) {
    uploadFiles(files)
  }
}

// 上传多个文件
const uploadFiles = async (files) => {
  // 过滤非图片文件
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  // 计算可以上传的数量
  const remainingSlots = 10 - uploadedImages.value.length
  const filesToUpload = imageFiles.slice(0, remainingSlots)
  
  if (filesToUpload.length === 0) return
  
  uploading.value = true
  error.value = null
  uploadProgress.value = 0
  currentUploadIndex.value = 0
  totalUploadCount.value = filesToUpload.length
  
  try {
    for (let i = 0; i < filesToUpload.length; i++) {
      currentUploadIndex.value = i + 1
      
      // 先计算文件的哈希值
      const file = filesToUpload[i]
      const fileHash = await calculateFileHash(file)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post('/api/resources/upload-images/', formData)
      
      // 添加图片URL到已上传列表
      uploadedImages.value.push(response.data.filename)
      
      // 更新进度
      uploadProgress.value = Math.round(((i + 1) / filesToUpload.length) * 100)
    }
    
    // 清除选择的文件
    document.getElementById('file-upload').value = ''
  } catch (err) {
    console.error('上传图片失败:', err)
    error.value = '上传图片失败，请稍后重试'
  } finally {
    uploading.value = false
  }
}

// 移除单张图片
const removeImage = (index) => {
  uploadedImages.value.splice(index, 1)
}

// 清空所有图片
const clearAllImages = () => {
  if (confirm('确定要清空所有已上传的图片吗？')) {
    uploadedImages.value = []
  }
}

// 获取要补充的资源信息
const fetchResourceForSupplement = async (resourceId) => {
  searching.value = true
  
  try {
    // 获取资源详情
    const response = await axios.get(`/api/resources/${resourceId}`)
    const resourceData = response.data
    
    // 设置为已选资源
    selectedResource.value = resourceData
    
    // 进入补充模式，并标记是从详情页直接进入的
    isSupplementMode.value = true
    isFromDetailPage.value = true
    hasSearched.value = true
    
    // 更新页面标题，显示正在补充的资源
    searchQuery.value = resourceData.title || resourceData.title_en
  } catch (err) {
    console.error('获取资源详情失败:', err)
    error.value = '获取资源详情失败，请稍后重试'
  } finally {
    searching.value = false
  }
}

// 资源链接相关数据
const resourceLinks = reactive({
  "magnet": [],
  "ed2k": [],
  "uc": [],
  "mobile": [],
  "tianyi": [],
  "quark": [],
  "115": [],
  "aliyun": [],
  "pikpak": [],
  "baidu": [],
  "123": [],
  "xunlei": [],
  "online": [],
  "others": []
})

// 网盘类型显示名称映射
const categoryDisplayNames = {
  "magnet": "磁力链接",
  "ed2k": "电驴(ed2k)",
  "uc": "UC网盘",
  "mobile": "移动云盘",
  "tianyi": "天翼云盘",
  "quark": "夸克网盘",
  "115": "115网盘",
  "aliyun": "阿里云盘",
  "pikpak": "PikPak",
  "baidu": "百度网盘",
  "123": "123网盘",
  "xunlei": "迅雷网盘",
  "online": "在线观看",
  "others": "其他链接"
}

// 当前激活的链接类型
const activeCategory = ref("magnet")

// 获取类型显示名称
const getCategoryDisplayName = (category) => {
  return categoryDisplayNames[category] || category
}

// 添加链接
const addLink = (category) => {
  resourceLinks[category].push({
    url: '',
    password: '',
    note: ''
  })
}

// 删除链接
const removeLink = (category, index) => {
  resourceLinks[category].splice(index, 1)
}

// 通过URL添加图片
const addImageByUrl = () => {
  if (!isValidImageUrl.value || uploadedImages.value.length >= 10) {
    return
  }
  
  const imageUrl = imageUrlInput.value.trim()
  
  // 检查URL是否已经添加过
  if (uploadedImages.value.includes(imageUrl)) {
    error.value = '该图片链接已经添加过'
    setTimeout(() => {
      error.value = null
    }, 3000)
    return
  }
  
  // 添加URL到图片列表
  uploadedImages.value.push(imageUrl)
  
  // 清空输入框
  imageUrlInput.value = ''
}

// 提交资源
const submitResource = async () => {
  // 非补充模式下验证必填字段
  if (!isSupplementMode.value) {
    // 验证中英文名称至少填写一个
    if (!form.title && !form.title_en) {
      error.value = '中文名称和英文名称至少填写一项'
      return
    }
    
    // 确保至少选择了一个类型
    if (selectedTypes.value.length === 0) {
      error.value = '请至少选择一个资源类型'
      return
    }
    
    // 新增资源模式下必须有图片
    if (uploadedImages.value.length === 0) {
      error.value = '请至少上传一张图片'
      return
    }
  }
  
  // 处理资源链接
  const linksToSubmit = {}
  let hasLinks = false
  
  for (const category in resourceLinks) {
    // 过滤掉空链接
    const validLinks = resourceLinks[category].filter(link => link.url.trim() !== '')
    if (validLinks.length > 0) {
      linksToSubmit[category] = validLinks
      hasLinks = true
    }
  }
  
  submitting.value = true
  error.value = null
  
  try {
    if (isSupplementMode.value) {
      // 补充资源模式 - 添加图片和/或链接到已有资源
      await axios.put(`/api/resources/${selectedResource.value.id}/supplement`, {
        images: uploadedImages.value,
        links: hasLinks ? linksToSubmit : undefined
      })
    } else {
      // 新增资源模式
      await axios.post('/api/resources/', {
        title: form.title,
        title_en: form.title_en,
        description: form.description,
        resource_type: formattedResourceType.value,
        images: uploadedImages.value,
        links: hasLinks ? linksToSubmit : undefined
      })
    }
    
    submitSuccess.value = true
  } catch (err) {
    console.error('提交资源失败:', err)
    error.value = '提交资源失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.title = ''
  form.title_en = ''
  form.description = ''
  selectedTypes.value = []
  uploadedImages.value = []
  submitSuccess.value = false
  error.value = null
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  selectedResource.value = null
  isSupplementMode.value = false
  isFromDetailPage.value = false
  imageUrlInput.value = ''
  imageUploadMode.value = 'local'
  
  // 清空资源链接
  for (const category in resourceLinks) {
    resourceLinks[category] = []
  }
  
  // 重置当前激活的链接类型
  activeCategory.value = "magnet"
}
</script>

<style scoped src="@/styles/SubmitResource.css"></style>