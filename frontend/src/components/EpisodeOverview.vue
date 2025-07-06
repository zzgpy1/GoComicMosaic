<template>
  <div class="episode-overview-container">
    <div v-if="error" class="error-section">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <p>{{ error }}</p>
    </div>
    
    <div class="episode-overview">
      <div class="overview-layout">
        <!-- 左侧区域：图片区 -->
        <div class="left-column">
          <!-- 主图显示区域 - 可直接滑动切换 -->
          <div class="main-image-container">
            <!-- 调试信息切换按钮 -->
            <!-- <button class="debug-toggle" @click="showDebugInfo = !showDebugInfo" style="position: absolute; top: 5px; right: 5px; z-index: 100; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 3px; padding: 5px; font-size: 12px;">
              {{ showDebugInfo ? '隐藏调试' : '显示调试' }}
            </button> -->
            
            <!-- 调试信息 -->
            <div v-if="showDebugInfo" class="debug-info" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.5); color: white; padding: 5px; font-size: 12px; z-index: 100;">
              <div>图片数: {{ currentEpisodeImages ? currentEpisodeImages.length : 0 }}</div>
              <div>当前索引: {{ currentImageIndex }}</div>
              <div>图片URL: {{ currentImage ? '有值' : '无值' }}</div>
              <div>初始加载: {{ initialImagesLoading ? '加载中' : '已完成' }}</div>
              <button @click="resetImageLoading" style="margin-top: 5px; padding: 2px 5px; font-size: 10px; background: #007bff; color: white; border: none; border-radius: 3px;">
                强制刷新
              </button>
            </div>
            
            <!-- 图片区域加载状态 - 仅在首次加载时显示 -->
            <div v-if="initialImagesLoading" class="area-loading" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.8); z-index: 50;">
              <div class="loader" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <p style="margin-top: 10px;">加载图片中...</p>
            </div>
            
            <div v-else-if="currentEpisodeImages && currentEpisodeImages.length > 0" class="image-slider"
                 @touchstart="handleTouchStart" 
                 @touchmove="handleTouchMove" 
                 @touchend="handleTouchEnd"
                 @mousedown="handleMouseDown"
                 @mousemove="handleMouseMove"
                 @mouseup="handleMouseUp"
                 @mouseleave="handleMouseUp">
              <button @click="prevImage" class="image-nav-button left" :disabled="currentImageIndex === 0">
                <i class="bi bi-chevron-left"></i>
              </button>
              
              <div class="image-display-container" ref="imageContainer">
              <img
                  :key="currentImageIndex"
                :src="currentImage" 
                class="main-image" 
                alt="剧集剧照" 
                @click="previewImage(currentImage)"
                  @load="onMainImageLoaded"
                  @error="onMainImageError"
                  :style="imageTransformStyle"
                style="cursor: zoom-in; transition: transform 0.3s ease;"
              />
              </div>
              
              <button @click="nextImage" class="image-nav-button right" :disabled="currentImageIndex === currentEpisodeImages.length - 1">
                <i class="bi bi-chevron-right"></i>
              </button>
              
              <div class="image-indicators">
                <span 
                  v-for="(_, index) in currentEpisodeImages" 
                  :key="index" 
                  :class="{ active: index === currentImageIndex }"
                  @click="setCurrentImage(index)"
                ></span>
              </div>
            </div>
            <div v-else class="no-image-placeholder">
              <i class="bi bi-image"></i>
              <p>{{ loadingStates.episodeDetails ? '加载剧照中...' : '暂无剧照' }}</p>
            </div>
          </div>
        </div>
        
        <!-- 右侧区域：季切换、选集、简介、演职人员 -->
        <div class="right-column">
          <!-- 1. 季切换标签 - 去掉箭头 -->
          <div class="season-tabs-wrapper">
            <!-- 季加载状态 -->
            <div v-if="loadingStates.seasons" class="area-loading small" style="padding: 10px; display: flex; align-items: center; justify-content: center;">
              <div class="loader small" style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
              <span>加载季信息...</span>
            </div>
            <div v-else-if="seasons.length > 0" class="season-tabs">
              <div 
                v-for="season in seasons" 
                :key="season.id"
                class="season-tab"
                :class="{ active: currentSeasonNumber === season.season_number }"
                @click="selectSeason(season.season_number)"
              >
                第{{ season.season_number }}季
                <div class="tab-indicator" v-if="currentSeasonNumber === season.season_number"></div>
              </div>
            </div>
            <div v-else class="season-tabs-placeholder" style="height: 40px; display: flex; align-items: center; padding: 0 15px;">
              <div class="skeleton-tab" style="width: 80px; height: 30px; background: #f0f0f0; border-radius: 15px; margin-right: 10px;"></div>
              <div class="skeleton-tab" style="width: 80px; height: 30px; background: #f0f0f0; border-radius: 15px; margin-right: 10px;"></div>
              <div class="skeleton-tab" style="width: 80px; height: 30px; background: #f0f0f0; border-radius: 15px;"></div>
            </div>
          </div>
          
          <!-- 2. 图文滑动的集选择器 - 更紧凑的设计 -->
          <div class="episodes-carousel-container">
            <!-- 剧集加载状态 -->
            <div v-if="loadingStates.episodes" class="area-loading small" style="padding: 10px; display: flex; align-items: center; justify-content: center;">
              <div class="loader small" style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
              <span>加载剧集信息...</span>
            </div>
            <div v-else-if="episodes && episodes.length > 0" class="episodes-carousel" ref="episodesCarousel">
              <div 
                v-for="episode in episodes" 
                :key="episode.id"
                class="episode-card"
                :class="{ active: currentEpisodeNumber === episode.episode_number }"
                @click="selectEpisode(episode.episode_number)"
              >
                <div class="episode-thumb">
                  <LazyImage 
                    v-if="episode.still_path" 
                    :src="getImageUrl(episode.still_path)" 
                    :alt="episode.name" 
                  />
                  <div v-else class="episode-thumb-placeholder">
                    <span>{{ episode.episode_number }}</span>
                  </div>
                </div>
                <div class="episode-card-info">
                  <div class="episode-title">{{ episode.episode_number }}. {{ episode.name }}</div>
                </div>
              </div>
            </div>
            <!-- 添加剧集骨架屏 -->
            <div v-else class="episodes-carousel-skeleton" style="display: flex; overflow-x: auto; padding: 10px 0;">
              <div v-for="i in 5" :key="i" class="episode-card-skeleton" style="min-width: 150px; height: 100px; background: #f0f0f0; margin-right: 10px; border-radius: 8px;"></div>
            </div>
          </div>
          
          <!-- 3. 合并简介区域 -->
          <div class="synopsis-section">
            <h3 class="section-title">剧情概要</h3>
            
            <!-- 详情加载状态 -->
            <div v-if="loadingStates.episodeDetails" class="area-loading small" style="padding: 10px; display: flex; align-items: center; justify-content: center;">
              <div class="loader small" style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
              <span>加载详细信息...</span>
            </div>
            <div v-else-if="currentEpisode" class="synopsis-content">
              <!-- 单集概述 -->
              <div class="episode-synopsis">
                <!-- <h4 class="synopsis-subtitle">第{{ currentEpisodeNumber }}集：{{ currentEpisode.name }}</h4> -->
                <h4 class="synopsis-subtitle">第{{ currentEpisodeNumber }}集：{{ cleanedEpisodeName }}</h4>
                <div class="episode-meta">
                  <span v-if="currentEpisode.air_date">放送日期：{{ currentEpisode.air_date }}</span>
                  <span v-if="currentEpisode.runtime">时长：{{ currentEpisode.runtime }}分钟</span>
                  <span v-if="currentEpisode.vote_average">评分：{{ currentEpisode.vote_average }}/10</span>
                </div>
                <p>{{ currentEpisode.overview || '暂无集简介' }}</p>
              </div>
            </div>
            <!-- 添加剧情概要骨架屏 -->
            <div v-else class="synopsis-skeleton" style="padding: 15px; border-radius: 8px;">
              <div class="skeleton-title" style="width: 60%; height: 24px; background: #f0f0f0; margin-bottom: 15px;"></div>
              <div class="skeleton-meta" style="display: flex; margin-bottom: 15px;">
                <div style="width: 100px; height: 16px; background: #f0f0f0; margin-right: 10px;"></div>
                <div style="width: 80px; height: 16px; background: #f0f0f0;"></div>
              </div>
              <div class="skeleton-text" style="width: 100%; height: 16px; background: #f0f0f0; margin-bottom: 10px;"></div>
              <div class="skeleton-text" style="width: 95%; height: 16px; background: #f0f0f0; margin-bottom: 10px;"></div>
              <div class="skeleton-text" style="width: 90%; height: 16px; background: #f0f0f0;"></div>
            </div>
          </div>

          <!-- 4. 演职人员区域 -->
          <div class="actors-section" @click="activeActor && (activeActor = null)">
            <h3 class="section-title">演职人员</h3>
            
            <!-- 演员加载状态 -->
            <div v-if="loadingStates.episodeDetails" class="area-loading small" style="padding: 10px; display: flex; align-items: center; justify-content: center;">
              <div class="loader small" style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
              <span>加载演职人员...</span>
            </div>
            
            <!-- 主要演员滑动区 -->
            <div v-else-if="currentEpisodeCast && currentEpisodeCast.length > 0" class="actors-container">
              <div class="actors-carousel">
                <div class="actor-circle" v-for="actor in currentEpisodeCast" :key="actor.id">
                  <div class="actor-avatar" @click.stop="toggleActorDetails(actor)">
                    <LazyImage 
                      v-if="actor.profile_path" 
                      :src="getActorImageUrl(actor.profile_path)" 
                      :alt="actor.name" 
                    />
                    <i v-else class="bi bi-person-fill"></i>
                  </div>
                  <p class="actor-name">{{ actor.name }}</p>
                </div>
              </div>
              
              <!-- 客串演员滑动区 -->
              <h4 v-if="currentEpisodeGuestStars && currentEpisodeGuestStars.length > 0" class="actors-subtitle">客串</h4>
              <div v-if="currentEpisodeGuestStars && currentEpisodeGuestStars.length > 0" class="actors-carousel">
                <div class="actor-circle guest" v-for="actor in currentEpisodeGuestStars" :key="actor.id">
                  <div class="actor-avatar" @click.stop="toggleActorDetails(actor)">
                    <LazyImage 
                      v-if="actor.profile_path" 
                      :src="getActorImageUrl(actor.profile_path)" 
                      :alt="actor.name" 
                    />
                    <i v-else class="bi bi-person-fill"></i>
                  </div>
                  <p class="actor-name">{{ actor.name }}</p>
                  <span class="guest-badge">客串</span>
                </div>
              </div>
              
              <!-- 演员详细信息弹窗 - 放在外层容器中 -->
              <div v-if="activeActor" class="actor-details-overlay" @click="activeActor = null">
                <div class="actor-details-modal" @click.stop>
                  <div class="actor-details-close" @click="activeActor = null">&times;</div>
                  <div class="actor-details-content">
                    <div class="actor-details-image">
                      <LazyImage 
                        v-if="activeActor.profile_path" 
                        :src="getActorImageUrl(activeActor.profile_path)" 
                        :alt="activeActor.name" 
                      />
                      <div v-else class="actor-details-no-image">
                        <i class="bi bi-person-fill"></i>
                      </div>
                    </div>
                    <div class="actor-details-info">
                      <h4 class="actor-fullname">{{ activeActor.name }}</h4>
                      <p v-if="activeActor.original_name && activeActor.original_name !== activeActor.name" class="actor-original-name">{{ activeActor.original_name }}</p>
                      <p v-if="activeActor.character" class="actor-character">饰演: {{ activeActor.character }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 添加演员骨架屏 -->
            <div v-else class="actors-carousel-skeleton" style="display: flex; overflow-x: auto; padding: 10px 0;">
              <div v-for="i in 5" :key="i" class="actor-circle-skeleton" style="display: flex; flex-direction: column; align-items: center; margin-right: 15px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: #f0f0f0;"></div>
                <div style="width: 50px; height: 12px; background: #f0f0f0; margin-top: 8px; border-radius: 3px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <div v-if="previewImageUrl" class="custom-modal" @click.self="closePreviewImage">
      <div class="modal-image-container">
        <button type="button" class="btn-close image-close-btn bi bi-x-lg" @click="closePreviewImage"></button>
        <LazyImage :src="previewImageUrl" class="preview-large-image" alt="剧集剧照预览" />
      </div>
    </div>
  </div>
</template>

<script>
import LazyImage from './LazyImage.vue';

export default {
  name: 'EpisodeOverview',
  components: {
    LazyImage
  },
  props: {
    tmdbId: {
      type: [Number, String],
      default: null
    },
    title_en: {
      type: String,
      default: ''
    },
    resourceId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      initialLoading: true, // 添加初始加载状态
      showDebugInfo: false, // 添加调试信息显示状态
      initialImagesLoading: false, // 添加图片初始加载状态
      imageRefreshKey: 0, // 图片刷新key
      loading: true,
      error: null,
      seasons: [],
      episodes: [],
      currentSeasonNumber: 1,
      currentEpisodeNumber: 1,
      currentSeasonName: '',
      currentSeasonOverview: '',
      currentEpisodeImages: [],
      currentEpisodeCast: [],
      currentEpisodeGuestStars: [],
      currentImageIndex: 0,
      currentEpisode: null,
      activeActor: null,
      previewImageUrl: null, // 用于存储预览图片的URL
      actualTmdbId: null, // 存储实际使用的TMDB ID
      // 添加缓存对象
      seasonsCache: {},
      episodesCache: {},
      episodeDetailsCache: {},
      imageCache: {}, // 添加图片缓存对象
      // 添加加载状态对象
      loadingStates: {
        seasons: false,
        episodes: false,
        episodeDetails: false
      },
      // 最小加载显示时间（毫秒）
      minLoadingTime: 300,
      // 添加一个标志，表示我们正在初始化组件
      isInitializing: false,
      // 添加滑动控制相关变量
      touchStartX: 0,
      touchEndX: 0,
      mouseStartX: 0,
      mouseEndX: 0,
      isDragging: false,
      dragOffset: 0,
      swipeThreshold: 50, // 触发滑动的阈值（像素）
    }
  },
  computed: {
    currentImage() {
      if (!this.currentEpisodeImages || this.currentEpisodeImages.length === 0) {
        return null;
      }
      // 优化：直接使用currentEpisodeImages中的路径，不再重新请求
      const imagePath = this.currentEpisodeImages[this.currentImageIndex];
      // 优化图片URL处理，避免不必要的处理
      return this.getImageUrl(imagePath);
    },
    cleanedEpisodeName() {
      if (!this.currentEpisode || !this.currentEpisode.name) return '';
      return this.currentEpisode.name.replace(/^第\s*[\d一二三四五六七八九十百千]+(\s*集)?\s*/, '');
    },
    imageTransformStyle() {
      // 实现图片拖动效果
      if (this.isDragging) {
        return { transform: `translateX(${this.dragOffset}px)` };
      }
      return {};
    }
  },
  mounted() {
    // 立即初始化组件，不等待数据加载
    this.initializeComponent();
    
    // 添加键盘事件监听器
    document.addEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    initializeComponent() {
      try {
        // 设置各区域的加载状态
        this.loadingStates.seasons = true;
        this.loadingStates.episodes = true;
        this.loadingStates.episodeDetails = true;
        this.initialImagesLoading = true;
        
        // 如果有tmdbId直接使用，否则尝试通过title_en搜索获取
        if (this.tmdbId) {
          this.actualTmdbId = this.tmdbId;
          
          // 设置默认值
          this.currentSeasonNumber = 1;
          this.currentEpisodeNumber = 1;
          
          // 标记正在初始化
          this.isInitializing = true;
          
          // 异步加载数据，不使用await阻塞UI
          this.fetchSeasons().then(() => {
            // 确保episodes已经加载完成
            if (this.episodes && this.episodes.length > 0) {
              this.currentSeasonNumber = 1;
              this.currentEpisodeNumber = this.episodes[0].episode_number;
              return this.fetchEpisodeDetails();
            } else {
              // 如果没有剧集，确保重置加载状态
              this.loadingStates.episodeDetails = false;
              this.initialImagesLoading = false;
            }
          }).catch(error => {
            console.error('加载数据失败:', error);
            this.resetLoadingStates();
          }).finally(() => {
            this.isInitializing = false;
          });
        } else if (this.title_en) {
          // 异步搜索TMDB ID
          this.searchByTitle();
        } else {
          this.error = '未提供TMDB ID或英文标题，无法获取剧集信息';
          this.resetLoadingStates();
        }
      } catch (error) {
        console.error('初始化组件失败:', error);
        this.error = '加载数据失败，请重试';
        this.resetLoadingStates();
      }
    },
    
    // 添加重置所有加载状态的辅助方法
    resetLoadingStates() {
      this.loadingStates.seasons = false;
      this.loadingStates.episodes = false;
      this.loadingStates.episodeDetails = false;
      this.initialImagesLoading = false;
      this.initialLoading = false;
      this.isInitializing = false;
    },
    
    async searchByTitle() {
      try {
        this.loadingStates.seasons = true;
        this.loadingStates.episodes = true; // 确保设置剧集加载状态
        console.log(`正在通过英文标题搜索: ${this.title_en}`);
        
        // 调用搜索接口
        const response = await fetch(`/app/api/tmdb/search_id?query=${encodeURIComponent(this.title_en)}`);
        if (!response.ok) {
          throw new Error(`搜索API调用失败: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.id) {
          console.log(`搜索成功，获取到TMDB ID: ${data.id}`);
          this.actualTmdbId = data.id;
          
          // 获取资源ID (优先使用props中的resourceId)
          const resourceId = this.resourceId || this.getResourceIdFromUrl();
          
          // 如果能够获取到资源ID，则更新资源的TMDB ID
          if (resourceId) {
            try {
              console.log(`正在更新资源ID ${resourceId} 的TMDB ID为 ${this.actualTmdbId}`);
              fetch(`/app/api/tmdb/update-resource-id/${resourceId}/${this.actualTmdbId}`, {
                method: 'PUT'
              }).then(updateResponse => {
                if (updateResponse.ok) {
                  console.log(`成功更新资源的TMDB ID`);
                } else {
                  console.error(`更新TMDB ID失败: ${updateResponse.status}`);
                }
              }).catch(updateError => {
                console.error('更新资源TMDB ID时出错:', updateError);
              });
            } catch (updateError) {
              console.error('更新资源TMDB ID时出错:', updateError);
            }
          }
          
          // 设置初始化标志
          this.isInitializing = true;
          
          // 设置默认值
          this.currentSeasonNumber = 1;
          this.currentEpisodeNumber = 1;
          
          // 异步加载季节信息
          this.fetchSeasons().then(() => {
            if (this.episodes && this.episodes.length > 0) {
              this.currentSeasonNumber = 1;
              this.currentEpisodeNumber = this.episodes[0].episode_number;
              return this.fetchEpisodeDetails();
            } else {
              // 如果没有剧集，确保重置加载状态
              this.loadingStates.episodeDetails = false;
              this.initialImagesLoading = false;
            }
          }).catch(error => {
            console.error('加载数据失败:', error);
            this.resetLoadingStates();
          }).finally(() => {
            this.isInitializing = false;
          });
        } else {
          this.error = `未能通过标题 "${this.title_en}" 找到匹配的TMDB资源`;
          this.resetLoadingStates();
        }
      } catch (error) {
        console.error('通过标题搜索失败:', error);
        this.error = '搜索TMDB资源失败';
        this.resetLoadingStates();
      }
    },
    
    // 从URL获取资源ID
    getResourceIdFromUrl() {
      // 尝试从URL中提取资源ID
      const pathParts = window.location.pathname.split('/');
      // 假设URL格式为 /resource/123 或 /resources/123
      for (let i = 0; i < pathParts.length; i++) {
        if (
          (pathParts[i] === 'resource' || pathParts[i] === 'resources') &&
          i + 1 < pathParts.length &&
          !isNaN(parseInt(pathParts[i + 1]))
        ) {
          return parseInt(pathParts[i + 1]);
        }
      }
      return null;
    },
    
    async fetchSeasons() {
      try {
        this.loadingStates.seasons = true; // 设置季节加载状态
        const response = await fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.seasons = data.seasons.filter(season => season.season_number > 0);
        
        if (this.seasons.length > 0) {
          // 确保当前季节号有效
          let validSeasonNumber = this.currentSeasonNumber;
          if (!this.seasons.some(s => s.season_number === this.currentSeasonNumber)) {
            validSeasonNumber = this.seasons[0].season_number;
            this.currentSeasonNumber = validSeasonNumber;
          }
          
          // 在初始化阶段，我们需要获取第一季的剧集列表
          if (this.initialLoading || this.isInitializing) {
            // 获取第一季的剧集列表
            console.log(`初始化阶段：获取第${validSeasonNumber}季剧集列表`);
            this.loadingStates.episodes = true; // 确保设置剧集加载状态
            const episodesResponse = await fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${validSeasonNumber}`);
            if (episodesResponse.ok) {
              const episodesData = await episodesResponse.json();
              this.episodes = episodesData.episodes || [];
              this.currentSeasonName = episodesData.name || '';
              this.currentSeasonOverview = episodesData.overview || '';
              
              // 保存到缓存中
              const episodesKey = `${this.actualTmdbId}_${validSeasonNumber}`;
              this.episodesCache[episodesKey] = {
                episodes: this.episodes,
                name: this.currentSeasonName,
                overview: this.currentSeasonOverview
              };
              console.log(`已缓存第${validSeasonNumber}季剧集列表，共${this.episodes.length}集`);
            } else {
              console.error(`获取第${validSeasonNumber}季剧集列表失败: ${episodesResponse.status}`);
            }
            this.loadingStates.episodes = false; // 重要：更新剧集加载状态
          }
          
          // 如果不是初始化阶段（比如用户手动切换季），则需要调用fetchEpisodes
          if (!this.initialLoading && !this.isInitializing) {
            await this.fetchEpisodes();
          }
        } else {
          this.error = '未找到季信息';
        }
      } catch (error) {
        console.error('获取季信息失败:', error);
        this.error = '获取季信息失败';
        this.loadingStates.episodes = false; // 确保在错误情况下也重置加载状态
        throw error;
      } finally {
        this.loadingStates.seasons = false; // 重置季节加载状态
      }
    },
    
    async fetchEpisodes() {
      try {
        this.loadingStates.episodes = true; // 设置剧集加载状态
        const response = await fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${this.currentSeasonNumber}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        this.episodes = data.episodes || [];
        this.currentSeasonName = data.name || '';
        this.currentSeasonOverview = data.overview || '';
        
        // 保存到缓存中，避免getEpisodeFromSeasonDetails方法重复请求
        const episodesKey = `${this.actualTmdbId}_${this.currentSeasonNumber}`;
        this.episodesCache[episodesKey] = {
          episodes: this.episodes,
          name: this.currentSeasonName,
          overview: this.currentSeasonOverview
        };
        console.log(`已缓存第${this.currentSeasonNumber}季剧集列表，共${this.episodes.length}集`);
        
        if (this.episodes.length > 0) {
          this.currentEpisodeNumber = this.episodes[0].episode_number;
          await this.fetchEpisodeDetails();
        } else {
          // 当剧集为空时，清空相关数据并结束加载状态
          console.log(`第${this.currentSeasonNumber}季没有任何剧集`);
          this.currentEpisode = null;
          this.currentEpisodeImages = [];
          this.currentEpisodeCast = [];
          this.currentEpisodeGuestStars = [];
          this.initialImagesLoading = false; // 确保图片加载状态结束
          this.loadingStates.episodeDetails = false; // 确保详情加载状态结束
        }
      } catch (error) {
        console.error('获取剧集列表失败:', error);
        this.error = '获取剧集列表失败';
        // 发生错误时，确保重置所有加载状态
        this.initialImagesLoading = false;
        this.loadingStates.episodeDetails = false;
      } finally {
        this.loadingStates.episodes = false; // 重置剧集加载状态
      }
    },
    
    async fetchEpisodeDetails() {
      try {
        this.loadingStates.episodeDetails = true; // 设置详情加载状态
        this.initialImagesLoading = true; // 设置图片加载状态
        
        const cacheKey = `${this.actualTmdbId}_${this.currentSeasonNumber}_${this.currentEpisodeNumber}`;
        
        // 检查缓存
        if (this.episodeDetailsCache[cacheKey]) {
          console.log(`缓存命中：第${this.currentSeasonNumber}季第${this.currentEpisodeNumber}集详情`);
          const cachedData = this.episodeDetailsCache[cacheKey];
          this.currentEpisode = cachedData.episode;
          this.currentEpisodeImages = cachedData.images || [];
          this.currentEpisodeCast = cachedData.cast || [];
          this.currentEpisodeGuestStars = cachedData.guest_stars || [];
          this.currentImageIndex = 0;
          
          console.log(`缓存中图片数量: ${this.currentEpisodeImages.length}`);
          
          // 如果已经有缓存，延迟一点关闭加载状态，增加体验流畅感
          setTimeout(() => {
            this.initialImagesLoading = false;
          }, 100);
          
          this.loadingStates.episodeDetails = false;
          
          // 即使从缓存加载，也预加载下一集和其他季，但在初始化阶段跳过预加载
          if (!this.initialLoading && !this.isInitializing) {
            setTimeout(() => {
              this.preloadNextEpisodesBatch(); // 使用批量API预加载多集
              this.preloadOtherSeasons();
            }, 500);
          }
          
          return;
        }
        
        console.log(`缓存未命中：开始获取第${this.currentSeasonNumber}季第${this.currentEpisodeNumber}集的详情、图片和演员信息`);
        
        // 1. 准备三个并发请求
        // 从季节详情中获取当前集信息 - 重用已有的seasonDetails缓存
        const episodeDetailsPromise = this.getEpisodeFromSeasonDetails();
        
        // 获取剧照
        const imagesPromise = fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${this.currentSeasonNumber}/${this.currentEpisodeNumber}/images`)
          .then(response => {
            if (!response.ok) throw new Error(`获取剧照失败: ${response.status}`);
            return response.json();
          })
          .then(data => data.images || [])
          .catch(err => {
            console.error('获取剧照失败:', err);
            return [];
          });
        
        // 获取演员信息
        const creditsPromise = fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${this.currentSeasonNumber}/${this.currentEpisodeNumber}/credits`)
          .then(response => {
            if (!response.ok) throw new Error(`获取演员信息失败: ${response.status}`);
            return response.json();
          })
          .catch(err => {
            console.error('获取演员信息失败:', err);
            return { cast: [], guest_stars: [] };
          });
        
        // 2. 并发执行所有请求
        const [episodeDetails, images, credits] = await Promise.all([
          episodeDetailsPromise,
          imagesPromise,
          creditsPromise
        ]);
        
        // 3. 处理获取到的数据
        this.currentEpisode = episodeDetails;
        
        // 处理图片数据，增强健壮性
        let processedImages = [];
        
        if (images && Array.isArray(images)) {
          processedImages = images.filter(img => img !== null && img !== undefined);
        }
        
        this.currentEpisodeImages = processedImages;
        
        // 处理演员数据
        this.currentEpisodeCast = credits.cast || [];
        this.currentEpisodeGuestStars = credits.guest_stars || [];
        
        this.currentImageIndex = 0;
        console.log(`成功获取第${this.currentSeasonNumber}季第${this.currentEpisodeNumber}集数据，图片数量:`, this.currentEpisodeImages.length);
        
        // 添加到缓存
        this.episodeDetailsCache[cacheKey] = {
          episode: this.currentEpisode,
          images: this.currentEpisodeImages,
          cast: this.currentEpisodeCast,
          guest_stars: this.currentEpisodeGuestStars
        };
        console.log(`已缓存第${this.currentSeasonNumber}季第${this.currentEpisodeNumber}集详情`);
        
        // 预加载所有图片
        if (this.currentEpisodeImages.length > 0) {
          this.preloadImages(this.currentEpisodeImages);
        }
        
        // 数据加载完成后，预加载下一集和其他季，但在初始化阶段跳过预加载
        if (!this.initialLoading && !this.isInitializing) {
          setTimeout(() => {
            this.preloadNextEpisodesBatch(); // 使用批量API预加载多集
            this.preloadOtherSeasons();
          }, 500);
        }
        
      } catch (error) {
        console.error('获取剧集详情失败:', error);
        this.currentEpisode = null;
        this.currentEpisodeImages = [];
        this.currentEpisodeCast = [];
        this.currentEpisodeGuestStars = [];
      } finally {
        this.loadingStates.episodeDetails = false; // 重置详情加载状态
        setTimeout(() => {
          this.initialImagesLoading = false; // 延迟一点设置图片加载完成
        }, 300);
      }
    },
    
    // 从季节详情中获取当前集信息
    async getEpisodeFromSeasonDetails() {
      try {
        // 获取季节详情中的剧集列表
        const episodesKey = `${this.actualTmdbId}_${this.currentSeasonNumber}`;
        let episodes = [];
        
        if (this.episodesCache[episodesKey]) {
          // 从缓存中获取
          console.log(`从缓存获取第${this.currentSeasonNumber}季剧集列表`);
          episodes = this.episodesCache[episodesKey].episodes || [];
        } else {
          // 这种情况在并发请求时可能会发生，因为fetchSeasons的结果还没有保存到缓存中
          console.warn(`缓存中未找到第${this.currentSeasonNumber}季数据，这可能是因为季信息请求尚未完成`);
          
          // 在初始化阶段，不再重复请求季信息，而是返回一个默认的剧集对象
          // 等fetchSeasons完成后，会自动更新UI
          return {
            name: `第${this.currentEpisodeNumber}集`,
            episode_number: this.currentEpisodeNumber,
            overview: '加载中...'
          };
        }
        
        // 找到当前集
        const episode = episodes.find(ep => ep.episode_number === this.currentEpisodeNumber);
        
        if (!episode) {
          throw new Error(`未找到第${this.currentSeasonNumber}季第${this.currentEpisodeNumber}集`);
        }
        
        return episode;
      } catch (error) {
        console.error('获取剧集信息失败:', error);
        return {
          name: `第${this.currentEpisodeNumber}集`,
          episode_number: this.currentEpisodeNumber,
          overview: '暂无简介'
        };
      }
    },
    
    async selectSeason(seasonNumber) {
      if (this.currentSeasonNumber !== seasonNumber) {
        this.currentSeasonNumber = seasonNumber;
        this.initialImagesLoading = true; // 切换季时显示加载状态
        this.loadingStates.episodes = true; // 标记剧集加载中
        this.loadingStates.episodeDetails = true; // 标记详情加载中
        
        try {
          // 先清空现有数据，避免显示上一季的数据
          this.episodes = [];
          this.currentEpisode = null;
          this.currentEpisodeImages = [];
          this.currentEpisodeCast = [];
          this.currentEpisodeGuestStars = [];
          
          // 重置图片索引
          this.currentImageIndex = 0;
          
          // 然后再获取新季的数据
          await this.fetchEpisodes();
        } catch (error) {
          console.error('切换季节失败:', error);
          this.loadingStates.episodes = false;
          this.loadingStates.episodeDetails = false;
          this.initialImagesLoading = false;
        }
      }
    },
    
    async selectEpisode(episodeNumber) {
      if (this.currentEpisodeNumber !== episodeNumber) {
        this.currentEpisodeNumber = episodeNumber;
        this.initialImagesLoading = true; // 切换剧集时显示图片加载状态
        this.loadingStates.episodeDetails = true; // 标记详情加载中
        
        try {
        await this.fetchEpisodeDetails();
        } catch (error) {
          console.error('切换剧集失败:', error);
          this.initialImagesLoading = false;
          this.loadingStates.episodeDetails = false;
        }
      }
    },
    
    getImageUrl(path) {
      if (!path) return null;
      
      // 如果已经是完整URL，直接返回
      if (typeof path === 'string' && path.startsWith('http')) {
        return path;
      }
      
      // 否则添加TMDB前缀
      return `https://image.tmdb.org/t/p/w500${path}`;
    },
    
    getActorImageUrl(path) {
      if (!path) return null;
      return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w185${path}`;
    },
    
    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
    
    nextImage() {
      if (this.currentImageIndex < this.currentEpisodeImages.length - 1) {
        this.currentImageIndex++;
      }
    },
    
    setCurrentImage(index) {
      if (this.currentImageIndex !== index) {
        this.currentImageIndex = index;
      }
    },

    // 标签滑动方法
    scrollTabs(direction) {
      const tabsElement = document.querySelector('.season-tabs');
      if (!tabsElement) return;
      
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsElement.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    },
    
    // 剧集滑动方法
    scrollEpisodes(direction) {
      if (!this.$refs.episodesCarousel) return;
      
      const carousel = this.$refs.episodesCarousel;
      const scrollAmount = direction === 'left' ? -300 : 300;
      carousel.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    },

    // 预览图片
    previewImage(imageUrl) {
      if (!imageUrl) return;
      this.previewImageUrl = imageUrl;
      // 阻止滚动
      document.body.style.overflow = 'hidden';
    },
    
    // 关闭预览图片
    closePreviewImage() {
      this.previewImageUrl = null;
      // 恢复滚动
      document.body.style.overflow = '';
    },

    // 显示/隐藏演员详情
    toggleActorDetails(actor) {
      if (this.activeActor && this.activeActor.id === actor.id) {
        this.activeActor = null; // 如果已经显示，则关闭
      } else {
        this.activeActor = actor; // 否则显示新的演员详情
      }
    },
    
    // 处理键盘事件关闭模态框
    handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (this.previewImageUrl) {
          this.closePreviewImage();
        } else if (this.activeActor) {
          this.activeActor = null;
        }
      }
    },
    
    async preloadNextEpisode() {
      if (!this.episodes || this.episodes.length === 0) return;
      
      // 找到当前集的索引
      const currentIndex = this.episodes.findIndex(ep => ep.episode_number === this.currentEpisodeNumber);
      if (currentIndex === -1 || currentIndex === this.episodes.length - 1) return; // 已是最后一集
      
      // 获取下一集
      const nextEpisode = this.episodes[currentIndex + 1];
      if (!nextEpisode) return;
      
      // 检查缓存是否已存在
      const cacheKey = `${this.actualTmdbId}_${this.currentSeasonNumber}_${nextEpisode.episode_number}`;
      if (this.episodeDetailsCache[cacheKey]) return; // 已缓存，无需预加载
      
      console.log(`预加载下一集：第${this.currentSeasonNumber}季第${nextEpisode.episode_number}集`);
      
      // 延迟预加载，避免与当前请求竞争资源
      setTimeout(async () => {
        try {
          // 准备并发请求
          // 由于nextEpisode已经从季节详情中获取，直接使用
          const episodeDetails = nextEpisode;
          
          // 获取剧照
          const imagesPromise = fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${this.currentSeasonNumber}/${nextEpisode.episode_number}/images`)
            .then(response => {
              if (!response.ok) throw new Error(`获取剧照失败: ${response.status}`);
              return response.json();
            })
            .then(data => data.images || [])
            .catch(err => {
              console.error('预加载下一集剧照失败:', err);
              return [];
            });
          
          // 获取演员信息
          const creditsPromise = fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${this.currentSeasonNumber}/${nextEpisode.episode_number}/credits`)
            .then(response => {
              if (!response.ok) throw new Error(`获取演员信息失败: ${response.status}`);
              return response.json();
            })
            .catch(err => {
              console.error('预加载下一集演员信息失败:', err);
              return { cast: [], guest_stars: [] };
            });
          
          // 并发执行请求
          const [images, credits] = await Promise.all([imagesPromise, creditsPromise]);
          
          // 处理并保存到缓存
          const processedImages = Array.isArray(images) ? images.filter(img => img !== null && img !== undefined) : [];
          
          // 缓存详情
          this.episodeDetailsCache[cacheKey] = {
            episode: episodeDetails,
            images: processedImages,
            cast: credits.cast || [],
            guest_stars: credits.guest_stars || []
          };
          
          console.log(`预加载完成：第${this.currentSeasonNumber}季第${nextEpisode.episode_number}集，图片数量: ${processedImages.length}`);
          
          // 预加载图片
          if (processedImages.length > 0) {
            this.preloadImages(processedImages);
          }
        } catch (error) {
          console.error('预加载下一集失败:', error);
        }
      }, 1000);
    },
    
    // 预加载其他季数据
    preloadOtherSeasons() {
      if (!this.seasons || this.seasons.length <= 1) return;
      
      // 特别查找第2季进行预加载
      const secondSeason = this.seasons.find(s => s.season_number === 2);
      if (secondSeason) {
        console.log('开始预加载第2季数据');
        
        // 检查是否已缓存季节数据
        const episodesCacheKey = `${this.actualTmdbId}_${secondSeason.season_number}`;
        if (this.episodesCache[episodesCacheKey]) {
          console.log('第2季剧集列表已缓存，直接预加载第1集详情');
          this.preloadSeasonFirstEpisode(secondSeason.season_number);
          return;
        }
        
        // 延迟预加载，避免与当前请求竞争资源
        setTimeout(() => {
          // 获取第2季剧集列表
          fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${secondSeason.season_number}`)
            .then(response => {
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              return response.json();
            })
            .then(data => {
              console.log('预加载第2季数据成功');
              
              if (data.episodes && data.episodes.length > 0) {
                // 首先缓存剧集列表
                this.episodesCache[episodesCacheKey] = {
                  episodes: data.episodes,
                  name: data.name || '',
                  overview: data.overview || ''
                };
                
                console.log('已缓存第2季剧集列表');
                
                // 预加载第2季第1集
                this.preloadSeasonFirstEpisode(secondSeason.season_number);
              }
            })
            .catch(error => {
              console.error('预加载第2季数据失败:', error);
            });
        }, 1500); // 延迟预加载，避免与当前请求竞争资源
      }
    },
    
    // 预加载指定季的第1集详情
    async preloadSeasonFirstEpisode(seasonNumber) {
      // 检查缓存
      const episodeDetailsCacheKey = `${this.actualTmdbId}_${seasonNumber}_1`;
      if (this.episodeDetailsCache[episodeDetailsCacheKey]) {
        console.log(`第${seasonNumber}季第1集已缓存，无需预加载`);
        return;
      }
      
      setTimeout(async () => {
        try {
          console.log(`开始预加载第${seasonNumber}季第1集详情`);
          
          // 获取第1集信息
          let firstEpisode = null;
          const episodesKey = `${this.actualTmdbId}_${seasonNumber}`;
          if (this.episodesCache[episodesKey] && this.episodesCache[episodesKey].episodes) {
            // 从缓存获取
            firstEpisode = this.episodesCache[episodesKey].episodes.find(ep => ep.episode_number === 1);
          }
          
          if (!firstEpisode) {
            console.error(`无法找到第${seasonNumber}季第1集信息`);
            return;
          }
          
          // 并发请求图片和演员信息
          const imagesPromise = fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${seasonNumber}/1/images`)
            .then(response => {
              if (!response.ok) throw new Error(`获取剧照失败: ${response.status}`);
              return response.json();
            })
            .then(data => data.images || [])
            .catch(err => {
              console.error(`预加载第${seasonNumber}季第1集剧照失败:`, err);
              return [];
            });
          
          const creditsPromise = fetch(`/app/api/tmdb/seasons/${this.actualTmdbId}/${seasonNumber}/1/credits`)
            .then(response => {
              if (!response.ok) throw new Error(`获取演员信息失败: ${response.status}`);
              return response.json();
            })
            .catch(err => {
              console.error(`预加载第${seasonNumber}季第1集演员信息失败:`, err);
              return { cast: [], guest_stars: [] };
            });
          
          // 并发执行请求
          const [images, credits] = await Promise.all([imagesPromise, creditsPromise]);
          
          // 处理图片
          const processedImages = Array.isArray(images) ? images.filter(img => img !== null && img !== undefined) : [];
          
          // 缓存详情
          this.episodeDetailsCache[episodeDetailsCacheKey] = {
            episode: firstEpisode,
            images: processedImages,
            cast: credits.cast || [],
            guest_stars: credits.guest_stars || []
          };
          
          console.log(`预加载第${seasonNumber}季第1集完成，图片数量:`, processedImages.length);
          
          // 预加载图片
          if (processedImages.length > 0) {
            this.preloadImages(processedImages);
          }
        } catch (error) {
          console.error(`预加载第${seasonNumber}季第1集详情失败:`, error);
        }
      }, 500);
    },
    
    // 完全优化预加载图片方法
    preloadImages(images) {
      if (!images || !Array.isArray(images) || images.length === 0) {
        console.log('没有图片需要预加载');
        return;
      }
      
      console.log(`开始预加载${images.length}张图片`);
      
      // 使用Promise.all预加载所有图片
      const preloadPromises = images.map((imgData, index) => {
        return new Promise((resolve, reject) => {
          let imgUrl;
          
          // 处理不同的图片数据格式
          if (typeof imgData === 'string') {
            imgUrl = this.getImageUrl(imgData);
          } else if (imgData && imgData.file_path) {
            imgUrl = this.getImageUrl(imgData.file_path);
          } else {
            resolve(); // 无效图片数据，直接解析
            return;
          }
          
          if (!imgUrl) {
            resolve(); // 无效URL，直接解析
            return;
          }
          
          const img = new Image();
          img.onload = () => {
            // 图片加载成功，将URL保存到缓存中
            this.imageCache[imgUrl] = true;
            resolve(imgUrl);
          };
          
          img.onerror = () => {
            console.error(`图片预加载失败: ${imgUrl}`);
            resolve(); // 即使失败也解析，不中断其他图片加载
          };
          
          img.src = imgUrl;
        });
      });
      
      // 异步处理所有预加载任务
      Promise.all(preloadPromises)
        .then(results => {
          const loadedCount = results.filter(url => url).length;
          console.log(`预加载完成，成功加载 ${loadedCount}/${images.length} 张图片`);
        })
        .catch(error => {
          console.error('图片预加载过程出错:', error);
        });
    },
    
    // 处理主图片加载完成事件
    onMainImageLoaded() {
      console.log('主图片加载完成');
      // 不需要设置任何状态，图片加载完成后浏览器会自动显示
    },
    
    // 修改图片加载失败处理
    onMainImageError() {
      console.error('图片加载失败:', this.currentImage);
      
      // 尝试使用缓存清除参数重新加载
      setTimeout(() => {
        this.imageRefreshKey++;
      }, 300);
    },
    
    // 简化强制刷新图片的方法
    resetImageLoading() {
      console.log('强制刷新图片');
      
      if (this.currentEpisodeImages && this.currentEpisodeImages.length > 0) {
        this.imageRefreshKey++;
      }
    },
    
    // 从localStorage加载缓存
    loadCacheFromStorage() {
      // 实现从localStorage加载缓存逻辑
      // 这里可以留空，或者实现简单的localStorage缓存
    },
    
    /**
     * 使用批量API预加载多个剧集信息
     * @param {Array} episodeRequests - 要预加载的剧集请求数组
     * @example 
     * fetchBatchEpisodes([
     *   { seriesId: 12345, seasonNumber: 1, episodeNumber: 2 },
     *   { seriesId: 12345, seasonNumber: 1, episodeNumber: 3 }
     * ])
     */
    fetchBatchEpisodes(episodeRequests) {
      if (!episodeRequests || episodeRequests.length === 0) return;
      
      console.log(`开始批量预加载${episodeRequests.length}个剧集`);
      
      // 检查是否所有剧集都已缓存
      const needToFetch = episodeRequests.filter(req => {
        const cacheKey = `${req.seriesId}_${req.seasonNumber}_${req.episodeNumber}`;
        return !this.episodeDetailsCache[cacheKey];
      });
      
      if (needToFetch.length === 0) {
        console.log('所有请求的剧集均已缓存，无需请求');
        return;
      }
      
      console.log(`需要请求${needToFetch.length}个剧集信息`);
      
      // 格式化请求体
      const batchRequest = {
        episodes: needToFetch.map(req => ({
          series_id: req.seriesId,
          season_number: req.seasonNumber,
          episode_number: req.episodeNumber
        }))
      };
      
      // 发送批量请求
      fetch('/api/tmdb/episodes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchRequest)
      })
        .then(response => {
          if (!response.ok) throw new Error(`批量请求失败: ${response.status}`);
          return response.json();
        })
        .then(data => {
          console.log('批量请求成功:', data);
          
          // 处理返回结果
          if (data.results) {
            // 将结果存入缓存
            Object.keys(data.results).forEach(key => {
              const result = data.results[key];
              const [seriesId, seasonNumber, episodeNumber] = key.split('_');
              const cacheKey = `${seriesId}_${seasonNumber}_${episodeNumber}`;
              
              this.episodeDetailsCache[cacheKey] = {
                episode: result.episode,
                images: result.images || [],
                cast: result.cast || [],
                guest_stars: result.guest_stars || []
              };
              
              // 预加载图片
              if (result.images && result.images.length > 0) {
                this.preloadImages(result.images);
              }
            });
            
            console.log(`成功缓存${Object.keys(data.results).length}个剧集数据`);
          }
          
          // 处理错误
          if (data.errors && data.errors.length > 0) {
            console.error('批量请求部分失败:', data.errors);
          }
        })
        .catch(error => {
          console.error('批量请求剧集信息失败:', error);
        });
    },
    
    /**
     * 预加载连续多集，例如当前集和接下来的2集
     */
    preloadNextEpisodesBatch() {
      if (!this.episodes || this.episodes.length === 0) return;
      
      // 找到当前集的索引
      const currentIndex = this.episodes.findIndex(ep => ep.episode_number === this.currentEpisodeNumber);
      if (currentIndex === -1) return;
      
      // 准备要预加载的剧集列表
      const episodesToPreload = [];
      
      // 最多预加载3集，但不超出总集数
      for (let i = 1; i <= 3; i++) {
        if (currentIndex + i < this.episodes.length) {
          const nextEp = this.episodes[currentIndex + i];
          episodesToPreload.push({
            seriesId: this.actualTmdbId,
            seasonNumber: this.currentSeasonNumber,
            episodeNumber: nextEp.episode_number
          });
        }
      }
      
      if (episodesToPreload.length > 0) {
        // 延迟执行，避免与当前请求竞争资源
        setTimeout(() => {
          this.fetchBatchEpisodes(episodesToPreload);
        }, 2000);
      }
    },

    // 新增：处理触摸开始事件
    handleTouchStart(event) {
      if (this.currentEpisodeImages.length <= 1) return;
      this.touchStartX = event.touches[0].clientX;
      this.touchEndX = this.touchStartX;
      this.isDragging = true;
      this.dragOffset = 0;
    },
    
    // 新增：处理触摸移动事件
    handleTouchMove(event) {
      if (!this.isDragging || this.currentEpisodeImages.length <= 1) return;
      this.touchEndX = event.touches[0].clientX;
      this.dragOffset = this.touchEndX - this.touchStartX;
      
      // 添加边界限制，第一张图片不能向右滑，最后一张图片不能向左滑
      if ((this.currentImageIndex === 0 && this.dragOffset > 0) || 
          (this.currentImageIndex === this.currentEpisodeImages.length - 1 && this.dragOffset < 0)) {
        this.dragOffset = this.dragOffset * 0.3; // 增加阻力效果
      }
      
      // 防止事件冒泡和默认行为
      event.preventDefault();
    },
    
    // 新增：处理触摸结束事件
    handleTouchEnd() {
      if (!this.isDragging || this.currentEpisodeImages.length <= 1) return;
      
      const swipeDistance = this.touchEndX - this.touchStartX;
      this.processSwipe(swipeDistance);
      
      this.isDragging = false;
      this.dragOffset = 0;
    },
    
    // 新增：处理鼠标按下事件
    handleMouseDown(event) {
      if (this.currentEpisodeImages.length <= 1) return;
      this.mouseStartX = event.clientX;
      this.mouseEndX = this.mouseStartX;
      this.isDragging = true;
      this.dragOffset = 0;
      
      // 防止鼠标拖动时选中文本
      event.preventDefault();
    },
    
    // 新增：处理鼠标移动事件
    handleMouseMove(event) {
      if (!this.isDragging || this.currentEpisodeImages.length <= 1) return;
      this.mouseEndX = event.clientX;
      this.dragOffset = this.mouseEndX - this.mouseStartX;
      
      // 添加边界限制，第一张图片不能向右滑，最后一张图片不能向左滑
      if ((this.currentImageIndex === 0 && this.dragOffset > 0) || 
          (this.currentImageIndex === this.currentEpisodeImages.length - 1 && this.dragOffset < 0)) {
        this.dragOffset = this.dragOffset * 0.3; // 增加阻力效果
      }
      
      // 防止事件冒泡和默认行为
      event.preventDefault();
    },
    
    // 新增：处理鼠标松开事件
    handleMouseUp() {
      if (!this.isDragging || this.currentEpisodeImages.length <= 1) return;
      
      const swipeDistance = this.mouseEndX - this.mouseStartX;
      this.processSwipe(swipeDistance);
      
      this.isDragging = false;
      this.dragOffset = 0;
    },
    
    // 新增：处理滑动逻辑
    processSwipe(swipeDistance) {
      // 判断滑动方向和距离是否达到阈值
      if (Math.abs(swipeDistance) > this.swipeThreshold) {
        if (swipeDistance > 0) {
          // 向右滑动，显示上一张
          this.prevImage();
        } else {
          // 向左滑动，显示下一张
          this.nextImage();
        }
      }
    },
  },
  
  beforeDestroy() {
    // 移除键盘事件监听器
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // 确保在组件销毁时恢复滚动
    document.body.style.overflow = '';
  }
}
</script>

<style scoped src="@/styles/EpisodeOverview.css"></style>