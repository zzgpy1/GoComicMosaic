<template>
  <div class="episode-overview-container">
    <div v-if="loading" class="loading-section">
      <div class="loader"></div>
      <p>加载数据中，请稍候...</p>
    </div>
    
    <div v-else-if="error" class="error-section">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <p>{{ error }}</p>
    </div>
    
    <div v-else class="episode-overview">
      <div class="overview-layout">
        <!-- 左侧区域：图片区 -->
        <div class="left-column">
          <!-- 主图显示区域 - 可直接滑动切换 -->
          <div class="main-image-container">
            <div v-if="currentEpisodeImages && currentEpisodeImages.length > 0" class="image-slider">
              <button @click="prevImage" class="image-nav-button left" :disabled="currentImageIndex === 0">
                <i class="bi bi-chevron-left"></i>
              </button>
              
              <img
                :src="currentImage" 
                class="main-image" 
                alt="剧集剧照" 
                @click="previewImage(currentImage)"
                style="cursor: zoom-in;"
              />
              
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
              <p>暂无剧照</p>
            </div>
          </div>
        </div>
        
        <!-- 右侧区域：季切换、选集、简介、演职人员 -->
        <div class="right-column">
          <!-- 1. 季切换标签 - 去掉箭头 -->
          <div class="season-tabs-wrapper">
            <div class="season-tabs">
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
          </div>
          
          <!-- 2. 图文滑动的集选择器 - 更紧凑的设计 -->
          <div class="episodes-carousel-container">
            <!-- <button @click="scrollEpisodes('left')" class="episode-nav-button">
              <i class="bi bi-chevron-left"></i>
            </button> -->
            
            <div class="episodes-carousel" ref="episodesCarousel">
              <div 
                v-for="episode in episodes" 
                :key="episode.id"
                class="episode-card"
                :class="{ active: currentEpisodeNumber === episode.episode_number }"
                @click="selectEpisode(episode.episode_number)"
              >
                <div class="episode-thumb">
                  <img v-if="episode.still_path" :src="getImageUrl(episode.still_path)" :alt="episode.name" />
                  <div v-else class="episode-thumb-placeholder">
                    <span>{{ episode.episode_number }}</span>
                  </div>
                </div>
                <div class="episode-card-info">
                  <div class="episode-title">{{ episode.episode_number }}. {{ episode.name }}</div>
                </div>
              </div>
            </div>
            
            <!-- <button @click="scrollEpisodes('right')" class="episode-nav-button">
              <i class="bi bi-chevron-right"></i>
            </button> -->
          </div>
          
          <!-- 3. 合并简介区域 -->
          <div class="synopsis-section">
            <h3 class="section-title">剧情概要</h3>
            <div class="synopsis-content">
              <!-- 季概述 -->
              <!-- <div class="season-synopsis">
                <h4 class="synopsis-subtitle">第{{ currentSeasonNumber }}季</h4>
                <p>{{ currentSeasonOverview || '暂无季简介' }}</p>
              </div> -->
              
              <!-- 单集概述 -->
              <div v-if="currentEpisode" class="episode-synopsis">
                <h4 class="synopsis-subtitle">第{{ currentEpisodeNumber }}集：{{ currentEpisode.name }}</h4>
                <div class="episode-meta">
                  <span v-if="currentEpisode.air_date">放送日期：{{ currentEpisode.air_date }}</span>
                  <span v-if="currentEpisode.runtime">时长：{{ currentEpisode.runtime }}分钟</span>
                  <span v-if="currentEpisode.vote_average">评分：{{ currentEpisode.vote_average }}/10</span>
                </div>
                <p>{{ currentEpisode.overview || '暂无集简介' }}</p>
              </div>
            </div>
          </div>

          <!-- 4. 演职人员区域 -->
          <div class="actors-section" @click="activeActor && (activeActor = null)">
            <h3 class="section-title">演职人员</h3>
            
            <!-- 主要演员滑动区 -->
            <div class="actors-container">
              <!-- <h4 class="actors-subtitle">主演</h4> -->
              <div v-if="currentEpisodeCast && currentEpisodeCast.length > 0" class="actors-carousel">
                <div class="actor-circle" v-for="actor in currentEpisodeCast" :key="actor.id">
                  <div class="actor-avatar" @click.stop="toggleActorDetails(actor)">
                    <img 
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
                    <img 
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
                      <img 
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
              
              <div v-if="(!currentEpisodeCast || currentEpisodeCast.length === 0) && 
                        (!currentEpisodeGuestStars || currentEpisodeGuestStars.length === 0)" 
                class="no-actors">
                <i class="bi bi-people"></i>
                <p>暂无演职人员信息</p>
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
        <img :src="previewImageUrl" class="preview-large-image" alt="剧集剧照预览">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EpisodeOverview',
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
      actualTmdbId: null // 存储实际使用的TMDB ID
    }
  },
  computed: {
    currentImage() {
      if (!this.currentEpisodeImages || this.currentEpisodeImages.length === 0) {
        return null;
      }
      return this.currentEpisodeImages[this.currentImageIndex];
    }
  },
  mounted() {
    try {
      this.loading = true;
      this.initializeComponent();
    } catch (error) {
      console.error('加载失败:', error);
      this.error = '加载数据失败，请重试';
    } finally {
      this.loading = false;
    }
    
    // 添加键盘事件监听器
    document.addEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    async initializeComponent() {
      // 如果有tmdbId直接使用，否则尝试通过title_en搜索获取
      if (this.tmdbId) {
        this.actualTmdbId = this.tmdbId;
        await this.fetchSeasons();
      } else if (this.title_en) {
        // 通过英文标题搜索TMDB ID
        await this.searchByTitle();
      } else {
        this.error = '未提供TMDB ID或英文标题，无法获取剧集信息';
      }
    },
    
    async searchByTitle() {
      try {
        this.loading = true;
        console.log(`正在通过英文标题搜索: ${this.title_en}`);
        
        // 调用后端搜索接口
        const response = await fetch(`/api/api/tmdb/search?query=${encodeURIComponent(this.title_en)}`);
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
              const updateResponse = await fetch(`/api/api/tmdb/update-resource-id/${resourceId}/${this.actualTmdbId}`, {
                method: 'PUT'
              });
              
              if (updateResponse.ok) {
                console.log(`成功更新资源的TMDB ID`);
              } else {
                console.error(`更新TMDB ID失败: ${updateResponse.status}`);
              }
            } catch (updateError) {
              console.error('更新资源TMDB ID时出错:', updateError);
            }
          }
          
          await this.fetchSeasons();
        } else {
          this.error = `未能通过标题 "${this.title_en}" 找到匹配的TMDB资源`;
        }
      } catch (error) {
        console.error('通过标题搜索失败:', error);
        this.error = '搜索TMDB资源失败';
      } finally {
        this.loading = false;
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
        const response = await fetch(`/api/api/tmdb/seasons/${this.actualTmdbId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.seasons = data.seasons.filter(season => season.season_number > 0);
        
        if (this.seasons.length > 0) {
          this.currentSeasonNumber = this.seasons[0].season_number;
          await this.fetchEpisodes();
        } else {
          this.error = '未找到季信息';
        }
      } catch (error) {
        console.error('获取季信息失败:', error);
        this.error = '获取季信息失败';
        throw error;
      }
    },
    
    async fetchEpisodes() {
      try {
        const response = await fetch(`/api/api/tmdb/seasons/${this.actualTmdbId}/${this.currentSeasonNumber}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        this.episodes = data.episodes;
        this.currentSeasonName = data.name;
        this.currentSeasonOverview = data.overview;
        
        if (this.episodes.length > 0) {
          this.currentEpisodeNumber = this.episodes[0].episode_number;
          await this.fetchEpisodeDetails();
        }
      } catch (error) {
        console.error('获取剧集列表失败:', error);
        this.error = '获取剧集列表失败';
      }
    },
    
    async fetchEpisodeDetails() {
      try {
        const response = await fetch(`/api/api/tmdb/episode/${this.actualTmdbId}/${this.currentSeasonNumber}/${this.currentEpisodeNumber}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        this.currentEpisode = data.episode;
        this.currentEpisodeImages = data.images || [];
        this.currentEpisodeCast = data.cast || [];
        this.currentEpisodeGuestStars = data.guest_stars || [];
        this.currentImageIndex = 0;
      } catch (error) {
        console.error('获取剧集详情失败:', error);
        this.currentEpisode = null;
        this.currentEpisodeImages = [];
        this.currentEpisodeCast = [];
        this.currentEpisodeGuestStars = [];
      }
    },
    
    selectSeason(seasonNumber) {
      if (this.currentSeasonNumber !== seasonNumber) {
        this.currentSeasonNumber = seasonNumber;
        this.fetchEpisodes();
      }
    },
    
    async selectEpisode(episodeNumber) {
      if (this.currentEpisodeNumber !== episodeNumber) {
        this.currentEpisodeNumber = episodeNumber;
        await this.fetchEpisodeDetails();
      }
    },
    
    getImageUrl(path) {
      if (!path) return null;
      return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w500${path}`;
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
      this.currentImageIndex = index;
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
    }
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