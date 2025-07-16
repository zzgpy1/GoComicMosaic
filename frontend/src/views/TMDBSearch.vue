<template>
  <div class="tmdb-search">
    <!-- 重新设计的横幅区域 -->
    <div class="hero-banner">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">TMDB资源一键导入</h1>
          <p class="hero-subtitle">搜索TMDB资源，预览并一键导入到资源库</p>
        </div>
        <!-- 集成搜索框到横幅中 -->
        <div class="search-box">
          <input
            type="text"
            class="custom-input"
            v-model="searchQuery"
            placeholder="输入动画名称..."
            @keyup.enter="searchTMDB"
          />
          <button @click="searchTMDB" class="search-button">
            <i class="bi bi-collection-play"></i> <span class="search-text">搜索</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>搜索中，请稍候...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-message">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ error }}</span>
    </div>

    <!-- 成功导入提示 -->
    <div v-else-if="importSuccess" class="success-message">
      <i class="bi bi-check-circle-fill"></i>
      <p>资源已成功导入！</p>
    </div>

    <!-- 搜索结果列表 -->
    <div v-else-if="searchResults && !tmdbResource" class="search-results-container">
      <h2 class="results-title">
        搜索结果 <span class="results-count">(共{{ searchResults.total_results }}项)</span>
      </h2>
      
      <!-- 无结果提示 -->
      <div v-if="searchResults.results && searchResults.results.length === 0" class="no-results">
        <i class="bi bi-search"></i>
        <p>未找到相关资源，请尝试其他关键词</p>
      </div>
      
      <!-- 结果网格 -->
      <div v-else class="results-grid">
        <div 
          v-for="item in searchResults.results" 
          :key="`${item.media_type}-${item.id}`"
          class="result-card"
          @click="viewMediaDetails(item)"
        >
          <div class="result-poster">
            <img 
              :src="item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'" 
              class="poster-image"
              :alt="item.title || item.name"
            >
            <div class="media-type-badge">
              {{ item.media_type === 'movie' ? '电影' : '电视剧' }}
            </div>
          </div>
          <div class="result-info">
            <h3 class="result-title">{{ item.title || item.name }}</h3>
            <p v-if="item.original_title && item.original_title !== item.title" class="result-original-title">
              {{ item.original_title || item.original_name }}
            </p>
            <p class="result-year" v-if="getYear(item)">{{ getYear(item) }}</p>
            <div class="result-rating" v-if="item.vote_average">
              <i class="bi bi-star-fill"></i>
              <span>{{ item.vote_average.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页控件 -->
      <div v-if="searchResults.total_pages > 1" class="pagination-container">
        <button 
          class="pagination-btn" 
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in displayedPages" 
            :key="page"
            class="page-number"
            :class="{ active: page === currentPage }"
            @click="page !== '...' && changePage(page)"
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="pagination-btn" 
          @click="changePage(currentPage + 1)"
          :disabled="currentPage >= searchResults.total_pages"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 搜索结果和预览 -->
    <div v-else-if="tmdbResource">
      <div class="resource-detail">
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="edit-form-container">
          <form @submit.prevent="saveChanges" class="edit-card">
            <div class="edit-card-header">
              <h3>编辑TMDB资源</h3>
              <button type="button" class="btn-close" @click="cancelEdit"></button>
            </div>
            
            <div class="edit-card-body">
              <div class="form-group">
                <label for="title" class="form-label">中文标题</label>
                <input type="text" class="form-control custom-input" id="title" v-model="editForm.title" required>
              </div>
              
              <div class="form-group">
                <label for="title_en" class="form-label">英文标题</label>
                <input type="text" class="form-control custom-input" id="title_en" v-model="editForm.title_en">
              </div>
              
              <div class="form-group">
                <label class="form-label">资源类型</label>
                <div class="resource-type-options">
                  <div 
                    v-for="type in resourceTypes" 
                    :key="type"
                    class="resource-type-option"
                    :class="{'selected': isTypeSelected(type)}"
                    @click="selectResourceType(type)"
                  >
                    <span class="option-text">{{ type }}</span>
                    <i v-if="isTypeSelected(type)" class="bi bi-check-circle-fill check-icon"></i>
                  </div>
                </div>
                <div class="selected-types-preview">
                  <span>已选类型：</span>
                  <span v-if="editForm.resource_type.length > 0" class="selected-type-text">{{ editForm.resource_type.join(', ') }}</span>
                  <span v-else class="text-muted">未选择</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="description" class="form-label">简介</label>
                <textarea class="form-control custom-textarea" id="description" rows="6" v-model="editForm.description" required></textarea>
              </div>
              
              <!-- 图片管理部分 -->
              <div class="form-group">
                <label class="form-label">图片管理</label>
                
                <!-- 现有图片展示和管理 -->
                <div class="image-management-section">
                  <h6 class="section-subtitle">已有图片 ({{ editForm.images.length }})</h6>
                  <div class="image-grid">
                    <div v-for="(image, index) in editForm.images" :key="index" class="image-item" :class="{'is-poster': image === editForm.poster_image}">
                      <div class="image-preview-container">
                        <img 
                          :src="image" 
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
                  </div>
                  
                  <!-- 图片链接输入区域 -->
                  <div v-else-if="imageUploadMode === 'url'" class="url-upload-container">
                    <div class="url-input-group">
                      <input 
                        type="text" 
                        class="form-control custom-input" 
                        v-model="imageUrlInput" 
                        placeholder="输入图片URL地址 (http://或https://开头)"
                      >
                      <button 
                        type="button" 
                        class="btn-custom btn-primary add-url-btn" 
                        @click="addImageByUrl"
                        :disabled="!isValidImageUrl"
                      >
                        <i class="bi bi-plus-circle me-2"></i> 添加图片
                      </button>
                    </div>
                    <div class="url-hints">
                      <p v-if="imageUrlInput && !isValidImageUrl" class="url-error">
                        <i class="bi bi-exclamation-triangle"></i> 
                        请输入有效的图片URL地址 (以http://或https://开头)
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
                </div>
              </div>
              
              <!-- 链接管理部分 -->
              <div class="form-group">
                <label class="form-label">资源链接管理</label>
                <div class="links-edit-card">
                  <p class="link-info-text">
                    您可以管理网盘链接或在线观看地址，方便用户获取资源。每种类型可添加多个链接。
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
                      
                      <!-- 已添加的链接 -->
                      <div class="links-list">
                        <div class="link-item" v-for="(link, index) in editLinks[category]" :key="index">
                          <div class="link-inputs">
                            <div class="input-group">
                              <div class="input-prefix">
                                <i class="bi bi-link-45deg"></i>
                                <span>链接</span>
                              </div>
                              <input 
                                type="text" 
                                class="form-control custom-input" 
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
                                class="form-control custom-input" 
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
                                class="form-control custom-input" 
                                v-model="link.note" 
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
                  保存
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <!-- 预览界面 -->
        <div v-else>
          <!-- 顶部横幅 -->
          <div class="preview-banner">
            <div class="banner-content">
              <!-- 左侧：标题区域 -->
              <div class="banner-title-area">
                <div class="title-text">
                  <h1 class="title">
                    <span class="title-text-content">{{ tmdbResource.title }}</span>
                    <span v-if="tmdbResource.id" class="tmdb-id-badge">
                      ID: {{ tmdbResource.id }}
                      <a 
                        :href="`https://www.themoviedb.org/tv/${tmdbResource.id}`" 
                        target="_blank" 
                        class="tmdb-link-small"
                        title="在TMDB上查看"
                      >
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                    </span>
                  </h1>
                  <h2 class="subtitle">{{ tmdbResource.title_en }}</h2>
                </div>
                <!-- 分类标签移到这里，在移动端会显示在标题右侧 -->
                <div class="mobile-badge-container">
                  <div class="resource-type-badge">
                    {{ tmdbResource.resource_type }}
                  </div>
                </div>
              </div>
              
              <!-- 右侧：分类和操作按钮 -->
              <div class="banner-action-area">
                <!-- 桌面端分类标签 -->
                <div class="desktop-badge-container">
                  <div class="resource-type-badge">
                    {{ tmdbResource.resource_type }}
                  </div>
                </div>
                <div class="action-buttons">
                  <button 
                    @click="startEdit"
                    class="btn-custom btn-outline me-2"
                  >
                    <i class="bi bi-pencil-square me-1"></i>
                    <span class="btn-text">编辑</span>
                  </button>
                  <button 
                    @click="importResource"
                    class="btn-custom btn-primary import-button"
                    :disabled="importing || resourceExists"
                  >
                    <i class="bi bi-cloud-download me-1"></i>
                    <span class="import-text">{{ importing ? '导入中...' : '一键导入' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 资源已存在提示 -->
          <div v-if="resourceExists" class="resource-exists-alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <span>该资源已存在，无法重复导入。</span>
            <a v-if="existingResource && existingResource.id" :href="`/resource/${existingResource.id}`" class="view-resource-link">
              查看已有资源
            </a>
          </div>
          
          <!-- 内容区域容器 -->
          <div class="content-container">
            <!-- 左侧：图片区域 -->
            <div class="media-section">
              <!-- 大图展示区 -->
              <div class="main-image-container" @click="previewImage(currentImage)">
                <img
                  :src="currentImage"
                  class="resource-poster"
                  :alt="tmdbResource.title || tmdbResource.title_en"
                >
              </div>
              
              <!-- 缩略图滚动区 -->
              <div class="thumbnails-container" v-if="tmdbResource.images && tmdbResource.images.length > 1">
                <div class="thumbnails-scroll">
                  <div
                    v-for="(image, index) in tmdbResource.images"
                    :key="index"
                    class="thumbnail"
                    :class="{ active: currentImage === image }"
                    @click="selectImage(image)"
                  >
                    <img
                      :src="image"
                      class="thumbnail-img"
                      :alt="`缩略图${index+1}`"
                    >
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧：信息区域 -->
            <div class="info-section">
              <!-- 简介 -->
              <div class="description-card">
                <div class="card-header">
                  <h3>简介</h3>
                </div>
                <div class="card-body">
                  <p>{{ tmdbResource.description }}</p>
                </div>
              </div>
              
              <!-- 资源链接预览 -->
              <div v-if="hasResourceLinks" class="links-preview-card">
                <div class="card-header">
                  <h3>资源链接</h3>
                </div>
                <div class="card-body">
                  <div class="links-tabs">
                    <button 
                      v-for="(links, category) in tmdbResource.links" 
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
                    <div v-for="(links, category) in tmdbResource.links" :key="`content-${category}`" 
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
                            <div class="col-link" data-label="链接">
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
                            <div class="col-password" data-label="提取码">
                              <div v-if="link.password" class="password-text">
                                {{ link.password }}
                              </div>
                              <span v-else class="no-password">-</span>
                            </div>
                            <div class="col-note" data-label="备注">
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
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="hasSearched" class="empty-result">
      <i class="bi bi-search"></i>
      <p>未找到相关资源，请尝试其他关键词</p>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="showImagePreview" class="custom-modal" @click.self="closeImagePreview">
      <div class="modal-image-container">
        <button type="button" class="btn-close image-close-btn bi bi-x-lg me-2" @click="closeImagePreview"></button>
        <img :src="previewImageUrl" class="preview-large-image" :alt="tmdbResource?.title || '图片预览'">
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { isAuthenticated } from '../utils/auth';

export default {
  name: 'TMDBSearch',
  data() {
    return {
      searchQuery: '',
      tmdbResource: null,
      currentImage: '',
      loading: false,
      error: null,
      hasSearched: false,
      importSuccess: false,
      importedResourceId: null,
      importing: false,
      // 图片预览相关
      showImagePreview: false,
      previewImageUrl: '',
      
      // 搜索结果相关
      searchResults: null,
      currentPage: 1,
      totalPages: 0,
      
      // 编辑模式相关
      isEditing: false,
      _resourceWasEdited: false, // 内部标记，用于跟踪资源是否被编辑过
      editForm: {
        title: '',
        title_en: '',
        description: '',
        resource_type: [],
        poster_image: '',
        images: []
      },
      // 链接编辑相关数据
      editLinks: {
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
      },
      editActiveCategory: "magnet",
      
      // 上传图片相关
      isDragging: false,
      uploading: false,
      uploadProgress: 0,
      currentUploadIndex: 0,
      totalUploadCount: 0,
      
      // 保存相关
      saving: false,
      saveError: null,
      
      // 资源类型选项
      resourceTypes: [
        '幽默', '讽刺', '冒险', '科幻', '动作', '奇幻', 
        '恐怖', '犯罪', '悬疑', '浪漫', '历史', '战争'
      ],
      activeCategory: null,
      
      // 图片上传相关
      imageUploadMode: 'local',
      imageUrlInput: '',
      
      // 检查资源是否已存在相关
      resourceExists: false,
      existingResource: null
    };
  },
  computed: {
    isLoggedIn() {
      return isAuthenticated();
    },
    // 判断资源是否已被编辑
    hasBeenEdited() {
      // 如果tmdbResource为空，则返回false
      if (!this.tmdbResource) return false;
      
      // 检查是否有自定义链接
      const hasCustomLinks = this.tmdbResource.links && Object.keys(this.tmdbResource.links).length > 0;
      
      // 检查是否上传了自定义图片
      // 原始TMDB资源的图片URL通常包含tmdb.org域名
      const hasCustomImages = this.tmdbResource.images && 
        this.tmdbResource.images.some(img => !img.includes('tmdb.org'));
      
      return hasCustomLinks || hasCustomImages || this._resourceWasEdited;
    },
    hasResourceLinks() {
      return this.tmdbResource && this.tmdbResource.links && Object.keys(this.tmdbResource.links).length > 0;
    },
    // 验证图片URL是否有效
    isValidImageUrl() {
      const url = this.imageUrlInput.trim();
      return url.startsWith('http://') || url.startsWith('https://');
    },
    // 计算要显示的页码
    displayedPages() {
      const pages = [];
      if (!this.totalPages) return pages;
      
      if (this.totalPages <= 5) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在前面
        if (this.currentPage <= 3) {
          pages.push(1, 2, 3, 4, 5, '...', this.totalPages);
        } 
        // 当前页在后面
        else if (this.currentPage >= this.totalPages - 2) {
          pages.push(1, '...', this.totalPages - 4, this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages);
        } 
        // 当前页在中间
        else {
          pages.push(1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', this.totalPages);
        }
      }
      return pages;
    }
  },
  methods: {
    async searchTMDB() {
      if (!this.searchQuery.trim()) {
        this.error = '请输入搜索关键词';
        return;
      }

      this.loading = true;
      
      // 只有在新搜索时重置状态，分页操作时保留tmdbResource为null
      if (this.currentPage === 1) {
        this.resetState();
      } else {
        // 分页操作时只重置部分状态
        this.tmdbResource = null;
        this.error = null;
      }
      
      try {
        // 调用TMDB Multi Search API
        const response = await axios.get(`/api/tmdb/multi_search`, {
          params: { 
            query: this.searchQuery.trim(), 
            page: this.currentPage 
          }
        });
        
        this.searchResults = response.data;
        this.totalPages = this.searchResults.total_pages;
        this.currentPage = this.searchResults.page;
        this.hasSearched = true;
      } catch (error) {
        console.error('TMDB搜索失败:', error);
        this.error = error.response?.data?.error || '搜索失败，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    
    // 获取年份显示
    getYear(item) {
      if (item.media_type === 'movie' && item.release_date) {
        return item.release_date.substring(0, 4);
      } else if (item.media_type === 'tv' && item.first_air_date) {
        return item.first_air_date.substring(0, 4);
      }
      return '';
    },

    // 媒体详情点击事件
    async viewMediaDetails(item) {
      this.loading = true;
      try {
        // 保存搜索结果中的中文数据
        const chineseData = {
          title: item.title || item.name || '',
          overview: item.overview || ''
        };
        
        // 调用详情API获取完整信息
        const response = await axios.get(`/api/tmdb/details/${item.media_type}/${item.id}`);
        const detailData = response.data;
        
        // 合并数据，优先使用中文数据
        this.tmdbResource = {
          ...detailData,
          // 使用搜索结果中的中文标题作为主标题
          title: chineseData.title,
          // 使用详情中的原始标题作为英文标题
          title_en: detailData.original_title || detailData.original_name || '',
          // 使用搜索结果中的中文简介
          description: chineseData.overview || detailData.overview || '',
          // 保留后端返回的中文分类
          resource_type: detailData.resource_type || '',
          // 保存媒体类型
          media_type: item.media_type || 'tv'
        };
        
        // 设置当前图片
        if (this.tmdbResource.images && this.tmdbResource.images.length > 0) {
          this.currentImage = this.tmdbResource.poster_path || this.tmdbResource.images[0];
        }
        
        // 设置默认的活动链接类别
        if (this.tmdbResource.links) {
          const categories = Object.keys(this.tmdbResource.links);
          for (const category of categories) {
            if (this.tmdbResource.links[category] && this.tmdbResource.links[category].length > 0) {
              this.activeCategory = category;
              break;
            }
          }
        }
        
        // 检查资源是否已存在
        if (this.tmdbResource.id) {
          try {
            const checkResponse = await axios.get(`/api/tmdb/check-exists`, {
              params: { 
                tmdb_id: this.tmdbResource.id,
                title: this.tmdbResource.title || this.tmdbResource.name
              }
            });
            
            if (checkResponse.data.exists) {
              this.resourceExists = true;
              this.existingResource = checkResponse.data.resource;
            } else {
              this.resourceExists = false;
              this.existingResource = null;
            }
          } catch (checkError) {
            console.error('检查资源是否存在失败:', checkError);
          }
        }
      } catch (error) {
        console.error('获取媒体详情失败:', error);
        this.error = error.response?.data?.error || '获取详情失败，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    
    selectImage(image) {
      this.currentImage = image;
    },
    
    previewImage(image) {
      // 打开图片预览模态框
      this.previewImageUrl = image;
      this.showImagePreview = true;
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    },
    
    previewEditImage(image) {
      this.previewImageUrl = image;
      this.showImagePreview = true;
      document.body.style.overflow = 'hidden';
    },
    
    closeImagePreview() {
      this.showImagePreview = false;
      document.body.style.overflow = ''; // 恢复滚动
    },
    
    async importResource() {
      // 如果资源已存在，阻止导入
      if (this.resourceExists) {
        this.error = `该资源已存在，标题：${this.existingResource.title}，请勿重复导入`;
        return;
      }
      
      this.importing = true;
      
      try {
        // 构建要提交的数据
        const submitData = {
          query: this.searchQuery.trim(),
          // 如果资源已被编辑，则添加自定义字段
          title: this.tmdbResource.title,
          title_en: this.tmdbResource.title_en,
          description: this.tmdbResource.description,
          resource_type: this.tmdbResource.resource_type,
          poster_image: this.tmdbResource.poster_image,
          images: this.tmdbResource.images,
          links: this.tmdbResource.links,
          // 添加TMDB ID
          id: this.tmdbResource.id,
          // 添加媒体类型
          media_type: this.tmdbResource.media_type,
          // 检查资源是否已被编辑过
          is_custom: this.hasBeenEdited
        };
        
        // 调用API创建资源
        const response = await axios.post('/api/tmdb/create', submitData);
        
        this.importSuccess = true;
        this.importedResourceId = response.data.id;
      } catch (error) {
        console.error('导入资源失败:', error);
        this.error = error.response?.data?.error || '导入失败，请稍后重试';
      } finally {
        this.importing = false;
      }
    },
    
    resetState() {
      this.tmdbResource = null;
      this.currentImage = '';
      this.error = null;
      this.hasSearched = false;
      this.importSuccess = false;
      this.importedResourceId = null;
      this.isEditing = false;
      this.activeCategory = null;
      this.resourceExists = false;
      this.existingResource = null;
      // 不重置searchResults和分页相关状态
    },
    
    resetSearch() {
      // 完全重置，包括搜索结果和分页
      this.resetState();
      this.searchQuery = '';
      this.searchResults = null;
      this.currentPage = 1;
      this.totalPages = 0;
    },
    
    // 编辑模式相关方法
    startEdit() {
      if (!this.tmdbResource) return;
      
      // 复制当前资源数据到表单
      this.editForm.title = this.tmdbResource.title || '';
      this.editForm.title_en = this.tmdbResource.title_en || '';
      this.editForm.description = this.tmdbResource.description || '';
      
      // 处理resource_type为数组
      if (this.tmdbResource.resource_type) {
        // 如果原始数据包含逗号，按逗号分割
        if (this.tmdbResource.resource_type.includes(',')) {
          this.editForm.resource_type = this.tmdbResource.resource_type.split(',');
        } else {
          // 否则作为单个元素添加到数组
          this.editForm.resource_type = [this.tmdbResource.resource_type];
        }
      } else {
        // 默认选中第一个类型
        this.editForm.resource_type = [this.resourceTypes[0]];
      }
      
      this.editForm.poster_image = this.tmdbResource.poster_image || '';
      this.editForm.images = [...(this.tmdbResource.images || [])];
      
      // 初始化编辑链接
      for (const category in this.editLinks) {
        this.editLinks[category] = [];
      }
      
      // 加载已有的链接数据
      if (this.tmdbResource.links) {
        for (const category in this.tmdbResource.links) {
          if (this.editLinks.hasOwnProperty(category) && this.tmdbResource.links[category]) {
            // 深拷贝链接数据，避免直接引用
            this.editLinks[category] = JSON.parse(JSON.stringify(this.tmdbResource.links[category]));
          }
        }
        
        // 设置默认的编辑链接类别为第一个有链接的类别
        let foundActiveCategory = false;
        for (const category in this.editLinks) {
          if (this.editLinks[category] && this.editLinks[category].length > 0) {
            this.editActiveCategory = category;
            foundActiveCategory = true;
            break;
          }
        }
        
        // 如果没有找到有链接的类别，则使用默认值
        if (!foundActiveCategory) {
          this.editActiveCategory = "magnet";
        }
      }
      
      this.isEditing = true;
    },
    
    cancelEdit() {
      this.isEditing = false;
      this.saveError = null;
    },
    
    isTypeSelected(type) {
      return this.editForm.resource_type.includes(type);
    },
    
    selectResourceType(type) {
      const index = this.editForm.resource_type.indexOf(type);
      if (index >= 0) {
        // 如果已经选中且不是最后一个选中的类型，则移除
        if (this.editForm.resource_type.length > 1) {
          this.editForm.resource_type.splice(index, 1);
        }
      } else {
        // 如果未选中，则添加
        this.editForm.resource_type.push(type);
      }
    },
    
    setPosterImage(image) {
      this.editForm.poster_image = image;
    },
    
    removeImage(index) {
      // 如果删除的是海报图片，则清空海报字段
      if (this.editForm.images[index] === this.editForm.poster_image) {
        this.editForm.poster_image = '';
      }
      this.editForm.images.splice(index, 1);
    },
    
    addEditLink(category) {
      this.editLinks[category].push({
        url: '',
        password: '',
        note: ''
      });
    },
    
    removeEditLink(category, index) {
      this.editLinks[category].splice(index, 1);
    },
    
    getCategoryDisplayName(category) {
      const displayNames = {
        "magnet": "磁力链接",
        "ed2k": "电驴链接",
        "uc": "UC网盘",
        "mobile": "移动云盘",
        "tianyi": "天翼云盘",
        "quark": "夸克网盘",
        "115": "115网盘",
        "aliyun": "阿里云盘",
        "pikpak": "PikPak",
        "baidu": "百度网盘",
        "123": "123网盘",
        "xunlei": "迅雷云盘",
        "online": "在线播放",
        "others": "其他链接"
      };
      return displayNames[category] || category;
    },
    
    // 文件上传相关方法
    handleFileDrop(event) {
      this.isDragging = false;
      const files = [...event.dataTransfer.files];
      if (files.length > 0) {
        this.uploadFiles(files);
      }
    },
    
    handleFilesSelection(event) {
      const files = [...event.target.files];
      if (files.length > 0) {
        this.uploadFiles(files);
      }
    },
    
    async uploadFiles(files) {
      // 过滤非图片文件
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) return;
      
      this.uploading = true;
      this.saveError = null;
      this.uploadProgress = 0;
      this.currentUploadIndex = 0;
      this.totalUploadCount = imageFiles.length;
      
      try {
        for (let i = 0; i < imageFiles.length; i++) {
          this.currentUploadIndex = i + 1;
          
          const file = imageFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await axios.post('/api/resources/upload-images/', formData);
          
          // 添加图片URL到已上传列表
          this.editForm.images.push(response.data.filename);
          
          // 更新进度
          this.uploadProgress = Math.round(((i + 1) / imageFiles.length) * 100);
        }
        
        // 清除选择的文件
        document.getElementById('file-upload').value = '';
      } catch (err) {
        console.error('上传图片失败:', err);
        this.saveError = '上传图片失败，请稍后重试';
      } finally {
        this.uploading = false;
      }
    },
    
    // 保存并导入资源
    async saveChanges() {
      // 移除登录检查
      this.saving = true;
      this.saveError = null;
      
      try {
        // 处理资源链接
        const linksToSubmit = {};
        let hasLinks = false;
        
        for (const category in this.editLinks) {
          // 过滤掉空链接
          const validLinks = this.editLinks[category].filter(link => link.url.trim() !== '');
          if (validLinks.length > 0) {
            linksToSubmit[category] = validLinks;
            hasLinks = true;
          }
        }
        
        // 更新本地数据，而不是提交到服务器
        this.tmdbResource = {
          ...this.tmdbResource,
          title: this.editForm.title,
          title_en: this.editForm.title_en,
          description: this.editForm.description,
          resource_type: this.editForm.resource_type.join(','),
          poster_image: this.editForm.poster_image,
          images: [...this.editForm.images],
          links: linksToSubmit,
          // 保留原来的media_type
          media_type: this.tmdbResource.media_type
        };
        
        // 标记资源已被编辑
        this._resourceWasEdited = true;
        
        // 确保当前图片设置正确
        if (this.tmdbResource.images && this.tmdbResource.images.length > 0) {
          this.currentImage = this.tmdbResource.poster_image || this.tmdbResource.images[0];
        }
        
        // 退出编辑模式
        this.isEditing = false;
      } catch (err) {
        console.error('保存资源失败:', err);
        this.saveError = err.message || '保存失败，请稍后重试';
      } finally {
        this.saving = false;
      }
    },
    formatLinkUrl(url) {
      // 格式化链接URL，使其更友好显示
      if (!url) return '';
      
      try {
        // 移除协议前缀
        let formattedUrl = url.replace(/^(https?:\/\/)?(www\.)?/i, '');
        
        // 如果链接太长，截断显示
        if (formattedUrl.length > 40) {
          formattedUrl = formattedUrl.substring(0, 37) + '...';
        }
        
        return formattedUrl;
      } catch (e) {
        return url;
      }
    },
    copyToClipboard(text) {
      if (!text) return;
      
      // 创建一个临时文本区域元素
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      
      try {
        // 选中并复制文本
        textarea.select();
        document.execCommand('copy');
        
        // 创建并显示一个临时提示元素
        const toast = document.createElement('div');
        toast.textContent = '已复制到剪贴板';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '10px 20px';
        toast.style.backgroundColor = '#28a745';
        toast.style.color = '#fff';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        
        document.body.appendChild(toast);
        
        // 显示提示
        setTimeout(() => { toast.style.opacity = '1'; }, 10);
        
        // 删除提示
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      } finally {
        // 移除临时元素
        document.body.removeChild(textarea);
      }
    },
    addImageByUrl() {
      if (!this.imageUrlInput || !this.isValidImageUrl) {
        return;
      }
      
      const imageUrl = this.imageUrlInput.trim();
      
      // 检查URL是否已经添加过
      if (this.editForm.images.includes(imageUrl)) {
        this.saveError = '该图片链接已经添加过';
        setTimeout(() => {
          this.saveError = null;
        }, 3000);
        return;
      }
      
      // 添加URL到图片列表
      this.editForm.images.push(imageUrl);
      
      // 如果是第一张图片，自动设为海报
      if (this.editForm.images.length === 1 && !this.editForm.poster_image) {
        this.editForm.poster_image = imageUrl;
      }
      
      // 清空输入框
      this.imageUrlInput = '';
    },
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.searchTMDB(); // 重新搜索以更新结果
    }
  },
  beforeDestroy() {
    // 组件销毁时确保恢复页面滚动
    if (this.showImagePreview) {
      document.body.style.overflow = '';
    }
  }
};
</script>

<style scoped src="@/styles/TMDBSearch.css"></style>