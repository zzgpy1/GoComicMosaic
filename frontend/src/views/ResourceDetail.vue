<template>
  <div class="resource-detail">
    <!-- 删除返回按钮区域代码 -->

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else-if="resource" class="row">
      <!-- 编辑模式 -->
      <div v-if="isEditing" class="col-12">
        <div class="edit-form-container">
          <div class="edit-card">
            <div class="edit-card-header">
              <h3>编辑资源</h3>
              <button @click="cancelEdit" class="btn-custom btn-outline">
                <i class="bi bi-x-lg me-2"></i><span class="btn-text">取消</span>
              </button>
            </div>
            <div class="edit-card-body">
              <form @submit.prevent="saveChanges">
                <div class="form-group">
                  <label for="title" class="form-label">中文标题</label>
                  <input type="text" class="form-control custom-input" id="title" v-model="editForm.title">
                </div>
                
                <div class="form-group">
                  <label for="titleEn" class="form-label">英文标题</label>
                  <input type="text" class="form-control custom-input" id="titleEn" v-model="editForm.title_en">
                </div>
                
                <!-- 资源类型改为多选框 -->
                <div class="form-group">
                  <label class="form-label">资源类型</label>
                  <div class="resource-type-options">
                    <div 
                      v-for="(type, index) in resourceTypeOptions" 
                      :key="index" 
                      class="resource-type-option"
                      :class="{ 'selected': isTypeSelected(type) }"
                      @click="toggleResourceType(type)"
                    >
                      <span class="option-text">{{ type }}</span>
                      <i v-if="isTypeSelected(type)" class="bi bi-check-circle-fill check-icon"></i>
                    </div>
                  </div>
                  <div class="selected-types-preview">
                    <span>已选类型：</span>
                    <span v-if="editForm.resource_type" class="selected-type-text">{{ editForm.resource_type }}</span>
                    <span v-else class="text-muted">未选择</span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="description" class="form-label">简介</label>
                  <textarea class="form-control custom-textarea" id="description" rows="6" v-model="editForm.description" required></textarea>
                </div>
                
                <!-- 图片管理部分的改进 -->
                <div class="form-group">
                  <label class="form-label">图片管理</label>
                  
                  <!-- 现有图片展示和管理 -->
                  <div class="image-management-section">
                    <h6 class="section-subtitle">已有图片 ({{ editForm.images.length }})</h6>
                    <div class="image-grid">
                      <div v-for="(image, index) in editForm.images" :key="index" class="image-item" :class="{'is-poster': image === editForm.poster_image}">
                        <div class="image-preview-container">
                          <img 
                            :src="getImageUrl(image)" 
                            class="image-preview" 
                            alt="资源图片" 
                            @click="previewEditImage(image)"
                          >
                          <div class="image-overlay">
                            <button 
                              type="button" 
                              class="image-action-btn set-poster-btn" 
                              @click.stop="setPosterImage(image)"
                              :disabled="image === editForm.poster_image"
                            >
                              <i class="bi bi-star-fill me-1"></i>
                              {{ image === editForm.poster_image ? '当前海报' : '设为海报' }}
                            </button>
                            <button 
                              type="button" 
                              class="image-action-btn remove-btn" 
                              @click.stop="removeImage(index)"
                              :disabled="editForm.images.length <= 1"
                            >
                              <i class="bi bi-trash me-1"></i>删除
                            </button>
                          </div>
                        </div>
                        <div class="poster-badge" v-if="image === editForm.poster_image">
                          <i class="bi bi-star-fill"></i> 海报图片
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 添加新图片 -->
                  <div class="upload-section">
                    <h6 class="section-subtitle">添加新图片</h6>
                    <div 
                      class="dropzone-container" 
                      :class="{'active-dropzone': isDragging}"
                      @dragenter.prevent="isDragging = true"
                      @dragover.prevent="isDragging = true"
                      @dragleave.prevent="isDragging = false"
                      @drop.prevent="handleFileDrop"
                    >
                      <div class="dropzone-content">
                        <i class="bi bi-cloud-arrow-up-fill dropzone-icon"></i>
                        <p>拖拽图片文件到此处，或</p>
                        <label for="file-upload" class="btn-custom btn-outline file-upload-btn">
                          <i class="bi bi-image me-2"></i><span class="file-btn-text">选择文件</span>
                        </label>
                        <input 
                          type="file" 
                          id="file-upload" 
                          @change="handleFilesSelection" 
                          multiple 
                          accept="image/*" 
                          class="d-none"
                        >
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
                  </div>
                </div>
                
                <!-- 链接管理部分 -->
                <div class="form-group">
                  <label class="form-label">资源链接管理</label>
                  <div class="links-edit-card">
                    <p class="link-info-text">
                      您可以管理网盘链接或在线观看地址，方便用户获取资源。每种类型可添加多个链接。
                      <span class="drag-tip"><i class="bi bi-arrows-move"></i> 提示：可拖拽链接项进行排序</span>
                    </p>
                    
                    <!-- 链接类型选项卡 -->
                    <div class="links-tabs">
                      <button 
                        v-for="(category, categoryIndex) in Object.keys(editLinks)" 
                        :key="categoryIndex"
                        class="tab-btn"
                        :class="{ active: editActiveCategory === category }"
                        @click.prevent="editActiveCategory = category"
                      >
                        {{ getCategoryDisplayName(category) }}
                        <span v-if="editLinks[category].length > 0" class="tab-badge">{{ editLinks[category].length }}</span>
                      </button>
                    </div>
                    
                    <!-- 链接输入区域 -->
                    <div class="links-content">
                      <div v-for="(category, categoryIndex) in Object.keys(editLinks)" :key="categoryIndex" 
                           v-show="editActiveCategory === category"
                           class="link-category-content">
                        <div v-if="editLinks[category].length === 0" class="empty-links">
                          <i class="bi bi-link-45deg empty-icon"></i>
                          <p>暂无{{ getCategoryDisplayName(category) }}链接，点击下方按钮添加</p>
                        </div>
                        
                        <!-- 已添加的链接 - 使用 vuedraggable 实现拖拽排序 -->
                        <div class="links-list">
                          <draggable 
                            v-model="editLinks[category]" 
                            item-key="tempId"
                            handle=".drag-handle"
                            ghost-class="link-ghost"
                            animation="300"
                          >
                            <template #item="{ element, index }">
                              <div class="link-item">
                                <div class="drag-handle">
                                  <i class="bi bi-grip-vertical"></i>
                                </div>
                                <div class="link-inputs">
                                  <div class="input-group">
                                    <div class="input-prefix">
                                      <i class="bi bi-link-45deg"></i>
                                      <span>链接</span>
                                    </div>
                                    <input 
                                      type="text" 
                                      class="form-control custom-input" 
                                      v-model="element.url" 
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
                                      class="form-control custom-input" 
                                      v-model="element.password" 
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
                                      class="form-control custom-input" 
                                      v-model="element.note" 
                                      placeholder="如:第1季"
                                    >
                                  </div>
                                </div>
                                
                                <button 
                                  type="button" 
                                  class="remove-link-btn"
                                  @click="removeEditLink(category, index)"
                                  title="删除链接"
                                >
                                  <i class="bi bi-trash"></i>
                                </button>
                              </div>
                            </template>
                          </draggable>
                        </div>
                        
                        <!-- 添加链接按钮 -->
                        <div class="add-link-container">
                          <button 
                            type="button" 
                            class="btn-custom btn-outline add-link-btn"
                            @click="addEditLink(category)"
                          >
                            <i class="bi bi-plus-circle me-2"></i> 添加{{ getCategoryDisplayName(category) }}链接
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="saveError" class="save-error">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  {{ saveError }}
                </div>
                
                <div class="form-actions">
                  <button type="submit" class="btn-custom btn-primary save-btn" :disabled="saving">
                    <span v-if="saving" class="spinner small-spinner me-1"></span>
                    <i v-else class="bi bi-check-circle me-2"></i>
                    保存更改
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 查看模式 -->
      <template v-else>
        <div class="resource-header">
          <div class="header-content">
            <div class="titles">
              <!-- 标题区域包装 -->
              <div class="title-wrapper">
                <!-- 中文标题 -->
                <h1 class="title">{{ resource.title }}</h1>
                <!-- 类型标签 - 移到标题右侧 -->
                <div class="resource-type-badge">
                  {{ resource.resource_type }}
                </div>
              </div>
              <!-- 英文标题 -->
              <h2 class="subtitle">{{ resource.title_en }}</h2>
            </div>
            <div class="action-buttons">
              <button 
                @click="toggleLike" 
                class="btn-custom btn-like"
                :class="{'liked': isLiked}"
              >
                <i :class="isLiked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i><span class="btn-text">{{isLiked ? '已喜欢' : '喜欢'}}</span>
                <span class="like-count" v-if="resource.likes_count > 0">{{resource.likes_count}}</span>
              </button>
              <button class="btn-custom btn-share" @click="handleShare">
                <i class="bi bi-share"></i><span class="btn-text">分享</span>
              </button>
              <button 
                @click="goToSupplementResource" 
                class="btn-custom btn-secondary"
                v-if="resource.status && resource.status.toLowerCase() === 'approved'"
              >
                <i class="bi bi-plus-circle"></i><span class="btn-text">补充资源</span>
              </button>
              <button @click="startEdit" class="btn-custom btn-primary" v-if="isUserAdmin">
                <i class="bi bi-pencil-square"></i><span class="btn-text">编辑</span>
              </button>
              <button @click="confirmDelete" class="btn-custom btn-danger" v-if="isUserAdmin">
                <i class="bi bi-trash"></i><span class="btn-text">删除</span>
              </button>
            </div>
          </div>
        </div>

        <div class="resource-content">
          <div class="media-section">
            <!-- 大图展示区 -->
            <div class="main-image-container" @click="previewEditImage(currentImage)">
              <img 
                :src="getImageUrl(currentImage)" 
                class="resource-poster" 
                :alt="resource.title || resource.title_en"
              >
            </div>
            
            <!-- 缩略图滚动区 -->
            <div class="thumbnails-container" v-if="resource.images && resource.images.length > 1">
              <div class="thumbnails-scroll">
                <div 
                  v-for="(image, index) in resource.images.filter(img => img !== resource.poster_image)" 
                  :key="index" 
                  class="thumbnail" 
                  :class="{ active: currentImage === image }"
                  @click="selectImage(image)"
                >
                  <img 
                    :src="getImageUrl(image)" 
                    class="thumbnail-img" 
                    :alt="`缩略图${index+1}`"
                  >
                </div>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="description-card">
              <div class="card-header">
                <h3>简介</h3>
              </div>
              <div class="card-body">
                <p>{{ resource.description }}</p>
              </div>
            </div>
            
            <!-- 资源链接部分 -->
            <!-- <div class="links-card" v-if="hasLinks"> -->
            <div class="links-card" >
              <div class="card-header">
                <h3>资源链接</h3>
                <!-- 添加点播图标按钮 -->
                <button 
                  class="stream-button" 
                  title="点播此资源" 
                  @click="goToStreamPage"
                >
                  <i class="bi bi-play-circle"></i>
                  <span>点播</span>
                </button>
              </div>
              <div class="card-body">
                <div class="links-tabs">
                  <button 
                    v-for="(links, category) in resource.links" 
                    :key="category" 
                    class="tab-btn" 
                    :class="{ active: activeCategory === category }" 
                    @click.prevent="activeCategory = category"
                    v-show="links.length > 0"
                  >
                    {{ getCategoryDisplayName(category) }}
                    <span class="tab-badge">{{ links.length }}</span>
                  </button>
                </div>
                
                <div class="links-content">
                  <div v-for="(links, category) in resource.links" :key="`content-${category}`" 
                       class="tab-pane" 
                       :class="{ active: activeCategory === category }"
                       v-show="links.length > 0 && activeCategory === category">
                    
                    <div class="links-table">
                      <div class="table-header">
                        <div class="col-link">链接</div>
                        <div class="col-password">提取码</div>
                        <div class="col-note">备注</div>
                      </div>
                      <div class="table-body">
                        <div class="table-row" v-for="(link, index) in links" :key="index">
                          <div class="col-link">
                            <a 
                              :href="link.url" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              class="link-url"
                            >
                              <i class="bi bi-link-45deg"></i>
                              <span class="url-text">{{ link.url }}</span>
                              <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                          </div>
                          <div class="col-password">
                            <div v-if="link.password" 
                                  class="password-container" 
                                  @click="copyToClipboard(link.password)" 
                                  role="button" 
                                  tabindex="0">
                              <span ref="passwordText">{{ link.password }}</span>
                              <i class="bi bi-clipboard"></i>
                            </div>
                            <span v-else class="no-password">-</span>
                          </div>
                          <div class="col-note">
                            <span class="note-text">{{ link.note || '-' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <div v-else class="text-center my-5">
      <p>资源不存在或已被删除</p>
      <router-link to="/" class="btn btn-primary">返回首页</router-link>
    </div>
    
    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="custom-modal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">确认删除</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>您确定要删除 <strong>{{ resource?.title || resource?.title_en }}</strong> 吗？此操作不可恢复。</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="showDeleteModal = false">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteResource" :disabled="deleting">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <div v-if="previewImageUrl" class="custom-modal" @click.self="closePreviewImage">
      <div class="modal-image-container">
        <button type="button" class="btn-close image-close-btn bi bi-x-lg me-2" @click="closePreviewImage"></button>
        <img :src="getImageUrl(previewImageUrl)" class="preview-large-image" :alt="resource?.title || '图片预览'">
      </div>
    </div>
    
    <!-- 添加ShareResource组件，使用ref来引用 -->
    <ShareResource 
      ref="shareResourceRef" 
      :resource="resource" 
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { isAdmin } from '../utils/auth'
import { getImageUrl } from '@/utils/imageUtils'
import ShareResource from '@/components/ShareResource.vue'
import draggable from 'vuedraggable'  // 导入 vuedraggable 组件

const route = useRoute()
const router = useRouter()
const resource = ref(null)
const loading = ref(true)
const error = ref(null)
const isEditing = ref(false)
const saving = ref(false)
const saveError = ref(null)
const showDeleteModal = ref(false)
const deleting = ref(false)
const currentImage = ref(null)  // 当前选中的大图

// 创建ShareResource组件的引用
const shareResourceRef = ref(null)

// 处理分享按钮点击
const handleShare = () => {
  if (shareResourceRef.value) {
    shareResourceRef.value.openShareModal()
  }
}

// 喜欢功能相关状态
const isLiked = ref(false)
const likeInProgress = ref(false)

const editForm = reactive({
  title: '',
  title_en: '',
  description: '',
  resource_type: '',
  poster_image: '',
  images: [] // 添加images数组存储所有图片
})

// 链接编辑相关数据
const editLinks = reactive({
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

// 编辑模式下当前激活的链接类型
const editActiveCategory = ref("magnet")

const selectedImage = ref(null)

// 计算属性检查是否为管理员
const isUserAdmin = computed(() => isAdmin())

// 选择图片展示在大图区域
const selectImage = (image) => {
  currentImage.value = image;
}

// 检查本地存储中是否已喜欢该资源
const checkIfLiked = (resourceId) => {
  const likedResources = JSON.parse(localStorage.getItem('likedResources') || '{}')
  return !!likedResources[resourceId]
}

// 喜欢/取消喜欢资源
const toggleLike = async () => {
  if (likeInProgress.value) return
  
  likeInProgress.value = true
  try {
    const action = isLiked.value ? 'unlike' : 'like'
    const response = await axios.post(`/api/resources/${resource.value.id}/${action}`)
    
    // 更新资源的喜欢数量
    resource.value.likes_count = response.data.likes_count
    
    // 更新本地存储的喜欢状态
    const likedResources = JSON.parse(localStorage.getItem('likedResources') || '{}')
    if (action === 'like') {
      likedResources[resource.value.id] = true
      isLiked.value = true
    } else {
      delete likedResources[resource.value.id]
      isLiked.value = false
    }
    localStorage.setItem('likedResources', JSON.stringify(likedResources))
    
  } catch (err) {
    console.error('操作喜欢状态失败:', err)
  } finally {
    likeInProgress.value = false
  }
}

const fetchResource = async () => {
  const id = route.params.id
  if (!id) {
    router.push('/')
    return
  }

  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(`/api/resources/${id}`)
    resource.value = response.data
    
    // 检查是否已喜欢该资源
    isLiked.value = checkIfLiked(resource.value.id)
    
    // 初始化当前图片
    if (resource.value.images && resource.value.images.length > 0) {
      if (resource.value.images.length > 1) {
        // 选择非海报图片作为当前图片
        const nonPosterImages = resource.value.images.filter(img => img !== resource.value.poster_image);
        if (nonPosterImages.length > 0) {
          currentImage.value = nonPosterImages[0];
        } else {
          currentImage.value = resource.value.images[0];
        }
      } else {
        currentImage.value = resource.value.images[0]; // 只有1张图片，显示第1张
      } 
    } 
  } catch (err) {
    console.error('获取资源详情失败:', err)
    error.value = '获取资源详情失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 新增变量
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const currentUploadIndex = ref(0)
const totalUploadCount = ref(0)

// 开始编辑
const startEdit = () => {
  if (!resource.value) return
  
  // 复制当前资源数据到表单
  editForm.title = resource.value.title || ''
  editForm.title_en = resource.value.title_en || ''
  editForm.description = resource.value.description || ''
  editForm.resource_type = resource.value.resource_type || ''
  editForm.poster_image = resource.value.poster_image || ''
  editForm.images = [...(resource.value.images || [])] // 复制所有图片
  
  // 初始化编辑链接
  for (const category in editLinks) {
    editLinks[category] = []
  }
  
  // 复制当前资源的链接到编辑表单
  if (resource.value.links) {
    for (const category in resource.value.links) {
      if (editLinks[category] && resource.value.links[category]) {
        // 确保链接格式一致，处理字符串和对象两种格式，并添加唯一的tempId
        editLinks[category] = resource.value.links[category].map(link => {
          if (typeof link === 'string') {
            return { 
              url: link, 
              password: '', 
              note: '',
              tempId: Date.now() + Math.random().toString(36).substr(2, 9) // 添加唯一的tempId
            }
          } else {
            return { 
              ...link,
              tempId: Date.now() + Math.random().toString(36).substr(2, 9) // 添加唯一的tempId
            }
          }
        })
      }
    }
  }
  
  // 设置第一个有链接的分类为激活状态
  for (const category in editLinks) {
    if (editLinks[category].length > 0) {
      editActiveCategory.value = category
      break
    }
  }
  
  isEditing.value = true
}

// 添加链接
const addEditLink = (category) => {
  editLinks[category].push({
    url: '',
    password: '',
    note: '',
    tempId: Date.now() + Math.random().toString(36).substr(2, 9) // 添加唯一的tempId
  })
}

// 删除链接
const removeEditLink = (category, index) => {
  editLinks[category].splice(index, 1)
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  selectedImage.value = null
  saveError.value = null
}

// 设置海报图片
const setPosterImage = (image) => {
  editForm.poster_image = image
}

// 移除图片
const removeImage = (index) => {
  // 如果删除的是海报图片，则清空海报字段
  if (editForm.images[index] === editForm.poster_image) {
    editForm.poster_image = ''
  }
  editForm.images.splice(index, 1)
}

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
  
  if (imageFiles.length === 0) return
  
  uploading.value = true
  saveError.value = null
  uploadProgress.value = 0
  currentUploadIndex.value = 0
  totalUploadCount.value = imageFiles.length
  
  try {
    for (let i = 0; i < imageFiles.length; i++) {
      currentUploadIndex.value = i + 1
      
      const file = imageFiles[i]
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post('/api/resources/upload-images/', formData)
      
      // 添加图片URL到已上传列表
      editForm.images.push(response.data.filename)
      
      // 更新进度
      uploadProgress.value = Math.round(((i + 1) / imageFiles.length) * 100)
    }
    
    // 清除选择的文件
    document.getElementById('file-upload').value = ''
  } catch (err) {
    console.error('上传图片失败:', err)
    saveError.value = '上传图片失败，请稍后重试'
  } finally {
    uploading.value = false
  }
}

// 保存变更
const saveChanges = async () => {
  if (!resource.value) return
  
  saving.value = true
  saveError.value = null
  
  try {
    // 处理资源链接
    const linksToSubmit = {}
    let hasLinks = false
    
    for (const category in editLinks) {
      // 过滤掉空链接
      const validLinks = editLinks[category].filter(link => link.url.trim() !== '')
      if (validLinks.length > 0) {
        // 移除tempId属性，不需要保存到后端
        linksToSubmit[category] = validLinks.map(link => {
          const { tempId, ...linkWithoutTempId } = link;
          return linkWithoutTempId;
        });
        hasLinks = true
      }
    }
    
    // 更新资源
    const response = await axios.put(`/api/resources/${resource.value.id}`, {
      title: editForm.title,
      title_en: editForm.title_en,
      description: editForm.description,
      resource_type: editForm.resource_type,
      poster_image: editForm.poster_image,
      images: editForm.images, // 提交所有图片
      links: hasLinks ? linksToSubmit : undefined // 提交链接数据
    })
    
    // 更新本地资源数据
    resource.value = response.data
    
    // 更新当前显示的图片
    if (resource.value.poster_image) {
      currentImage.value = resource.value.poster_image
    } else if (resource.value.images && resource.value.images.length > 0) {
      currentImage.value = resource.value.images[0]
    }
    
    // 退出编辑模式
    isEditing.value = false
  } catch (err) {
    console.error('保存资源失败:', err)
    saveError.value = '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

// 确认删除
const confirmDelete = () => {
  showDeleteModal.value = true
}

// 删除资源
const deleteResource = async () => {
  if (!resource.value) return
  
  deleting.value = true
  
  try {
    await axios.delete(`/api/resources/${resource.value.id}`)
    
    // 删除成功后返回首页
    router.push({
      path: '/',
      query: { deleted: 'success' }
    })
  } catch (err) {
    console.error('删除资源失败:', err)
    error.value = '删除资源失败，请稍后重试'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// 图片预览相关
const previewImageUrl = ref(null)

// 预览编辑模式下的图片
const previewEditImage = (image) => {
  previewImageUrl.value = image
  document.body.style.overflow = 'hidden'
}

// 关闭预览图片
const closePreviewImage = () => {
  previewImageUrl.value = null
  document.body.style.overflow = 'auto'
}

// 跳转到资源补充页面
const goToSupplementResource = () => {
  if (!resource.value) return

  // 使用查询参数跳转到提交页面，带上该资源ID和预选状态
  router.push({
    path: '/submit',
    query: {
      supplementId: resource.value.id,
      supplementMode: 'true'
    }
  })
}

// 跳转到播放页面并搜索当前资源
const goToStreamPage = () => {
  if (!resource.value?.title) return
  
  // 如果标题包含斜杠，只取斜杠前的部分
  let searchTitle = resource.value.title
  if (searchTitle.includes('/')) {
    searchTitle = searchTitle.split('/')[0].trim()
  }
  
  // 跳转到播放页面并带上搜索参数
  router.push({
    path: '/streams',
    query: {
      search: searchTitle
    }
  })
}

// 资源链接相关变量
const activeCategory = ref('magnet') // 默认显示的链接类型

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

// 获取类型显示名称
const getCategoryDisplayName = (category) => {
  return categoryDisplayNames[category] || category
}

// 检查资源是否有链接
const hasLinks = computed(() => {
  if (!resource.value || !resource.value.links) return false;
  
  // 检查是否有任何非空链接分类
  for (const category in resource.value.links) {
    if (resource.value.links[category] && resource.value.links[category].length > 0) {
      // 设置第一个有效的类别为活动类别
      if (!activeCategory.value || !resource.value.links[activeCategory.value] || 
          resource.value.links[activeCategory.value].length === 0) {
        activeCategory.value = category;
      }
      return true;
    }
  }
  
  return false;
});

// 复制到剪贴板的函数
const copyToClipboard = (text) => {
  const passwordContainer = event.currentTarget;
  const passwordText = passwordContainer.querySelector('span');
  const originalText = passwordText.textContent;
  
  // 复制文本到剪贴板（直接使用传入的text参数，不再需要选择文本）
  navigator.clipboard.writeText(text)
    .then(() => {
      // 在密码容器上添加复制成功的样式
      passwordContainer.classList.add('copied');
      
      // 直接在原位置显示"已复制"
      passwordText.textContent = '已复制';
      passwordText.style.color = 'var(--success-color)';
      passwordText.style.fontWeight = '700';
      
      // 1.5秒后恢复原来的密码文本和样式
      setTimeout(() => {
        passwordText.textContent = originalText;
        passwordText.style.color = '';
        passwordText.style.fontWeight = '';
        passwordContainer.classList.remove('copied');
      }, 1500);
    })
    .catch(err => {
      console.error('无法复制文本: ', err);
      alert('复制失败，请手动复制');
    });
};

// 资源类型选项 - 更改为适合美漫网站的选项
const resourceTypeOptions = [
  '幽默', '讽刺', '冒险', '科幻', '动作', '奇幻', 
  '恐怖', '犯罪', '悬疑', '浪漫', '历史', '战争'
];

// 检查类型是否被选中
const isTypeSelected = (type) => {
  if (!editForm.resource_type) return false;
  return editForm.resource_type.split(',').includes(type);
};

// 切换资源类型选择
const toggleResourceType = (type) => {
  let types = editForm.resource_type ? editForm.resource_type.split(',') : [];
  
  if (isTypeSelected(type)) {
    // 如果已选中，则移除
    types = types.filter(t => t !== type);
  } else {
    // 如果未选中，则添加
    types.push(type);
  }
  
  // 更新资源类型字段
  editForm.resource_type = types.join(',');
};

onMounted(() => {
  fetchResource()
})
</script>

<style scoped src="@/styles/ResourceDetail.css"></style>

<style scoped>
/* 添加分享按钮样式 */
.btn-share {
  background-color: #3a86ff;
  color: white;
  border: none;
  box-shadow: 0 2px 5px rgba(58, 134, 255, 0.3);
}

.btn-share:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.4);
}

/* 拖拽相关样式 */
.drag-handle {
  cursor: move;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: var(--text-muted);
}

.drag-handle i {
  font-size: 1.2rem;
}

.drag-tip {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-left: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: var(--card-bg);
  transition: all 0.2s ease;
}

.link-ghost {
  opacity: 0.5;
  background: var(--highlight-bg);
  border: 1px dashed var(--primary-color);
}

.link-inputs {
  flex: 1;
  padding: 12px;
}
</style>