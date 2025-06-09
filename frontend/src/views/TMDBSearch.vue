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

    <!-- 搜索结果和预览 -->
    <div v-else-if="tmdbResource" class="preview-container">
      <div class="resource-detail">
        <!-- 预览界面，重新组织结构 -->
        <div class="resource-content">
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
            <!-- 右上：标题区域 -->
            <div class="resource-header">
              <div class="header-content">
                <!-- 标题区域重新组织 -->
                <div class="title-area">
                  <!-- 标题和分类/导入按钮 -->
                  <div class="title-main">
                    <h1 class="title">{{ tmdbResource.title }}</h1>
                    <h2 class="subtitle">{{ tmdbResource.title_en }}</h2>
                  </div>
                  <!-- 右侧操作区：分类和导入按钮 -->
                  <div class="action-area">
                    <div class="resource-type-badge">
                      {{ tmdbResource.resource_type }}
                    </div>
                    <button 
                      @click="importResource"
                      class="btn-custom btn-primary import-button-top"
                      :disabled="importing"
                    >
                      <i class="bi bi-cloud-download me-1"></i>
                      <span class="import-text">{{ importing ? '导入中...' : '一键导入' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右中：简介 -->
            <div class="description-card">
              <div class="card-header">
                <h3>简介</h3>
              </div>
              <div class="card-body">
                <p>{{ tmdbResource.description }}</p>
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
        <button type="button" class="btn-close image-close-btn" @click="closeImagePreview"></button>
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
      previewImageUrl: ''
    };
  },
  computed: {
    isLoggedIn() {
      return isAuthenticated();
    }
  },
  methods: {
    async searchTMDB() {
      if (!this.searchQuery.trim()) {
        this.error = '请输入搜索关键词';
        return;
      }

      this.resetState();
      this.loading = true;
      
      try {
        // 调用TMDB搜索API
        const response = await axios.get(`/api/tmdb/search`, {
          params: { query: this.searchQuery.trim() }
        });
        
        this.tmdbResource = response.data;
        if (this.tmdbResource && this.tmdbResource.images && this.tmdbResource.images.length > 0) {
          this.currentImage = this.tmdbResource.poster_image || this.tmdbResource.images[0];
        }
        this.hasSearched = true;
      } catch (error) {
        console.error('TMDB搜索失败:', error);
        this.error = error.response?.data?.error || '搜索失败，请稍后重试';
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
    
    closeImagePreview() {
      this.showImagePreview = false;
      document.body.style.overflow = ''; // 恢复滚动
    },
    
    async importResource() {
      if (!this.isLoggedIn) {
        this.$router.push('/login?redirect=/tmdb-search');
        return;
      }
      
      this.importing = true;
      
      try {
        const response = await axios.post('/api/tmdb/create', {
          query: this.searchQuery.trim()
        });
        
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
    },
    
    resetSearch() {
      this.resetState();
      this.searchQuery = '';
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