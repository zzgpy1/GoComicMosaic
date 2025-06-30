<template>
  <div class="streams-page">
    <!-- <div style="position: relative; padding: 30% 45%;">
      <iframe style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" src="//www.bilibili.com/blackboard/html5mobileplayer.html?aid=10335022&bvid=BV1nx411m7bV&cid=17072810&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>
    </div> -->

    <!-- 播放链接输入区域 - 始终显示 -->
    <div class="url-input-section">
      <div class="url-input-box">
        <input 
          type="text" 
          v-model="customStreamUrl" 
          placeholder="输入流媒体链接（如: https://example.com/video.m3u8）..." 
          @keyup.enter="playCustomStream"
        />
        <button @click="playCustomStream" class="play-button btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>播放</span>
        </button>
      </div>
    </div>

    <!-- 搜索和筛选区域 - 始终显示 -->
    <div class="streams-filter">
      <div class="filter-options">
        <select v-model="selectedDataSource" @change="changeDataSource">
          <option v-for="(name, id) in dataSources" :key="id" :value="id">{{ name }}</option>
        </select>
      </div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索流媒体内容..." 
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="search-button btn-primary">
          <span v-if="isSearching" class="loading-spinner"></span>
          <span v-else>搜索</span>
        </button>
      </div>
    </div>

    <!-- 播放历史记录 -->
    <div v-if="playHistory.length > 0 && showingSearchResults" class="history-section">
      <div class="history-header">
        <h2>最近播放</h2>
        <button @click="clearPlayHistory" class="clear-history-btn">
          <i class="bi bi-trash"></i> 清除记录
        </button>
      </div>
      <div class="history-items">
        <div 
          v-for="(item, index) in playHistory.slice(0, 5)" 
          :key="index" 
          class="history-item" 
          @click="playHistoryItem(item)"
        >
          <div class="history-thumbnail">
            <img 
              :src="item.poster || 'https://via.placeholder.com/120x80.png?text=视频'" 
              :alt="item.title"
              referrerPolicy="no-referrer"
              class="history-image"
            />
            <div class="history-play-icon">▶</div>
            <div v-if="item.episodeIndex !== undefined" class="episode-badge">
              第{{ item.episodeIndex + 1 }}集
            </div>
          </div>
          <div class="history-info">
            <h3>{{ item.title }}</h3>
            <p>{{ formatTime(item.timestamp) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 播放器区域 -->
    <div v-if="isPlaying" class="player-section">
      <div class="player-header">
        <h2>{{ streamInfo.title }}</h2>
        <div class="stream-info">
          <span v-if="playerError" class="error-text">{{ playerError }}</span>
        </div>
      </div>
      <div class="player-container">
        <VideoPlayer 
          :sources="currentStreamSources"
          :poster="currentPoster"
          :autoplay="true"
          :key="playerKey"
          :videoId="currentVideoId"
          @ready="onPlayerReady"
          @play="onPlayerPlay"
          @pause="onPlayerPause"
          @ended="onPlayerEnded"
          @error="onPlayerError"
          @timeupdate="onPlayerTimeUpdate"
        />

        <div class="stream-info" v-if="streamInfo">
          <div class="stream-info-header">
            <h2>{{ streamInfo.title }}</h2>
          </div>

          <!-- 添加简介折叠功能，包含演职人员信息 -->
          <div class="description-content" :class="{ 'collapsed': isDescriptionCollapsed && ((streamInfo.description && streamInfo.description.length > 100) || streamInfo.actor || streamInfo.director) }">
            <!-- 简介部分 -->
            <p>{{ streamInfo.description }}</p>
            
            <!-- 演员和导演信息部分 -->
            <div class="movie-details" v-if="streamInfo.actor || streamInfo.director || streamInfo.year || streamInfo.area">
              <div class="detail-item" v-if="streamInfo.actor">
                <span class="detail-label">演员:</span>
                <span class="detail-value">{{ streamInfo.actor }}</span>
              </div>
              <div class="detail-item" v-if="streamInfo.director">
                <span class="detail-label">导演:</span>
                <span class="detail-value">{{ streamInfo.director }}</span>
              </div>
              <div class="detail-row">
                <div class="detail-item" v-if="streamInfo.area">
                  <span class="detail-label">地区:</span>
                  <span class="detail-value">{{ streamInfo.area }}</span>
                </div>
                <div class="detail-item" v-if="streamInfo.year">
                  <span class="detail-label">年份:</span>
                  <span class="detail-value">{{ streamInfo.year }}</span>
                </div>
                <div class="detail-item" v-if="streamInfo.remarks">
                  <span class="detail-label">状态:</span>
                  <span class="detail-value highlight">{{ streamInfo.remarks }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 折叠/展开按钮，当有简介内容或者演职人员信息时显示 -->
          <button v-if="(streamInfo.description && streamInfo.description.length > 100) || streamInfo.actor || streamInfo.director" 
                  class="description-toggle-btn" 
                  @click="isDescriptionCollapsed = !isDescriptionCollapsed">
            {{ isDescriptionCollapsed ? '展开全部 ▼' : '收起内容 ▲' }}
          </button>
          
          <!-- 剧集选择器 -->
          <div v-if="streamInfo.episodes && streamInfo.episodes.length > 1" class="episodes-container">
            <h3>选集播放</h3>
            <EpisodeSelector 
              :episodes="streamInfo.episodes" 
              :initialSelected="streamInfo.currentEpisode || 0"
              @select-episode="playEpisode"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 内容列表区域 -->
    <div v-if="(!isPlaying && !isChangingVideo) || showingSearchResults">
      <p class="description">在这里您可以找到各种类型的流媒体内容</p>

      <!-- 搜索状态显示 -->
      <div v-if="isSearching" class="search-loading">
        <div class="loading-spinner"></div>
        <p>正在搜索，请稍候...</p>
      </div>
      
      <!-- 搜索错误提示 -->
      <div v-if="searchError" class="search-error">
        <p>{{ searchError }}</p>
        <p class="offline-tip">提示：可能是网络问题或跨域限制。搜索"灵笼"将使用模拟数据进行测试。</p>
        <div class="error-actions">
          <button @click="performApiSearch" class="retry-button btn-primary">重试</button>
          <button @click="testWithMockData" class="mock-button btn-primary">使用测试数据</button>
        </div>
      </div>

      <!-- 推荐主页 - 当没有搜索结果时显示 -->
      <RecommendationContainer
        v-if="!isSearching && !searchError && searchResults.length === 0 && searchQuery.trim() === ''" 
        @search="handleRecommendationSearch" 
        class="recommendation-section"
      />

      <!-- 流媒体内容网格 - 当有搜索结果时显示 -->
      <div class="streams-grid" v-if="filteredStreams.length">

        <div v-for="stream in filteredStreams" :key="stream.id" class="stream-card">
          <div class="stream-thumbnail">
            <img 
              :src="stream.poster" 
              :alt="stream.title"
              referrerPolicy="no-referrer"
              class="stream-image"
            />
            <div class="play-overlay" @click="playStream(stream)">
              <i class="play-icon">▶</i>
            </div>
          </div>
          <div class="stream-info">
            <h3>{{ stream.title }}</h3>
            <!-- <p>{{ stream.description }}</p> -->
            <div class="stream-meta">
              <span class="stream-category">{{ stream.category }}</span>
              <span class="stream-duration" v-if="stream.duration">{{ formatDuration(stream.duration) }}</span>
              <span class="stream-year" v-if="stream.year">{{ stream.year }}</span>
              <span class="stream-remarks" v-if="stream.remarks">{{ stream.remarks }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页控件 -->
      <div v-if="searchResults.length > 0 && totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage <= 1" 
          @click="changePage(currentPage - 1)"
          class="page-button"
          aria-label="上一页"
        >
        <i class="bi bi-chevron-left"></i>
        </button>
        <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button 
          :disabled="currentPage >= totalPages" 
          @click="changePage(currentPage + 1)"
          class="page-button"
          aria-label="下一页"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
      
    </div>

    <!-- 加载中蒙层 -->
    <div v-if="isLoading && !isVideoLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中，请稍候...</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import VideoPlayer from '../components/VideoPlayer.vue';
import EpisodeSelector from '../components/EpisodeSelector.vue';
import { searchMovies, getMovieDetail, parseEpisodes } from '../utils/api';
import { getDataSourceManager } from '../utils/dataSourceManager';
import RecommendationHome from '../components/RecommendationHome.vue';
import RecommendationContainer from '../components/RecommendationContainer.vue';

export default {
  name: 'StreamsPage',
  components: {
    VideoPlayer,
    EpisodeSelector,
    RecommendationHome,
    RecommendationContainer
  },
  props: {
    id: String,
    direct_url: String
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    
    // StreamsPage 原有的状态
    const streams = ref([]);
    const searchQuery = ref('');
    const selectedDataSource = ref('');
    
    // 数据源列表
    const dataSources = ref({});
    
    // StreamPlayer 功能相关的状态
    const isPlaying = ref(false);
    const showingSearchResults = ref(false); // 控制是否显示搜索结果
    const streamInfo = ref(null);
    const customStreamUrl = ref('');
    const currentStreamSources = ref([]);
    const currentPoster = ref('');
    
    // 新增状态
    const isLoading = ref(false);
    const isVideoLoading = ref(false); // 新增：专门用于视频加载状态，不显示全屏遮罩
    const isChangingVideo = ref(false); // 新增：标记视频切换过程中，避免显示搜索结果
    const playHistory = ref([]);
    const playerError = ref(null);
    const searchResults = ref([]); // 存储API搜索结果
    const currentPage = ref(1);
    const totalPages = ref(1);
    const pageSize = ref(12);
    const isSearching = ref(false);
    const searchError = ref(null);
    const playerKey = ref(0); // 添加一个key来强制重新创建播放器组件
    const isDescriptionCollapsed = ref(true); // 新增：用于简介折叠功能
    const currentVideoId = ref(''); // 视频ID，用于保存播放进度

    // 模拟数据
    const mockStreams = [
      {
        id: '1',
        title: '超级英雄联盟',
        description: '超级英雄的冒险故事，精彩纷呈',
        category: '动漫',
        duration: 1800, // 30分钟
        poster: 'https://via.placeholder.com/320x180.png?text=超级英雄联盟',
        sources: [
          {
            src: 'https://example.com/streams/superhero.m3u8',
            type: 'application/x-mpegURL'
          }
        ]
      },
      {
        id: '2',
        title: '机器人历险记',
        description: '未来世界的机器人冒险',
        category: '科幻',
        duration: 2400, // 40分钟
        poster: 'https://via.placeholder.com/320x180.png?text=机器人历险记',
        sources: [
          {
            src: 'https://example.com/streams/robots.m3u8',
            type: 'application/x-mpegURL'
          }
        ]
      },
      {
        id: '3',
        title: '魔法学院',
        description: '年轻巫师的神奇冒险',
        category: '奇幻',
        duration: 3600, // 60分钟
        poster: 'https://via.placeholder.com/320x180.png?text=魔法学院',
        sources: [
          {
            src: 'https://example.com/streams/magic.m3u8',
            type: 'application/x-mpegURL'
          }
        ]
      },
      {
        id: '4',
        title: 'HLS测试视频',
        description: 'M3U8视频流播放示例',
        category: '测试',
        duration: 1500, // 25分钟
        poster: 'https://via.placeholder.com/320x180.png?text=HLS测试视频',
        sources: [
          {
            src: 'https://m3u8.hmrvideo.com/play/79a5fcdda8f84557975d1e59dd51f334.m3u8',
            type: 'application/x-mpegURL'
          }
        ]
      },
    ];
    
    const categories = computed(() => {
      const uniqueCategories = new Set(streams.value.map(stream => stream.category));
      return Array.from(uniqueCategories);
    });
    
    const filteredStreams = computed(() => {
      // 如果有API搜索结果，优先显示
      if (searchResults.value.length > 0) {
        return searchResults.value.map(convertApiResultToStream);
      }
      
      // 否则显示本地过滤的结果
      return streams.value.filter(stream => {
        const matchesSearch = searchQuery.value === '' || 
          stream.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          stream.description.toLowerCase().includes(searchQuery.value.toLowerCase());
          
        const matchesCategory = selectedDataSource.value === '' || 
          stream.category === selectedDataSource.value;
          
        return matchesSearch && matchesCategory;
      });
    });
    
    // 将API搜索结果转换为本地流媒体对象格式
    const convertApiResultToStream = (apiMovie) => {
      return {
        id: apiMovie.vod_id.toString(),
        title: apiMovie.vod_name,
        description: apiMovie.vod_blurb || apiMovie.vod_content || '',
        category: apiMovie.type_name || apiMovie.vod_area || '未分类',
        duration: 0, // API中没有具体时长，默认为0
        poster: apiMovie.vod_pic || 'https://dummyimage.com/320x180/cccccc/333333&text=影片封面',
        apiData: apiMovie, // 保存原始API数据，以便后续使用
        sources: [], // 初始为空，加载详情时会更新
        remarks: apiMovie.vod_remarks || '', // 添加备注字段（如"更新至第8集"）
        year: apiMovie.vod_year || '' // 添加年份字段
      };
    };
    
    // 执行API搜索
    const performApiSearch = async () => {
      if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
      }
      
      isSearching.value = true;
      searchError.value = null;
      
      try {
        const result = await searchMovies(searchQuery.value, currentPage.value, pageSize.value, selectedDataSource.value || null);
        searchResults.value = result.dataList || [];
        
        // 修改：使用API返回的pagecount，如果存在的话
        if (result.pagecount) {
          // 直接使用API返回的页数
          totalPages.value = result.pagecount;
        } else if (result.pagination && result.pagination.pagecount) {
          // 有些API把pagecount放在pagination对象里
          totalPages.value = result.pagination.pagecount;
        } else {
          // 兼容旧逻辑，如果没有pagecount，才通过total和pageSize计算
          totalPages.value = Math.ceil((result.total || 0) / pageSize.value);
        }
        
        console.log('API搜索结果:', searchResults.value, '总页数:', totalPages.value);
      } catch (error) {
        console.error('API搜索失败:', error);
        searchError.value = error.message || '搜索失败，请稍后重试';
        searchResults.value = [];
      } finally {
        isSearching.value = false;
      }
    };
    
    // 执行搜索 (增强原有的函数)
    const performSearch = () => {
      console.log('执行搜索:', searchQuery.value);
      
      // 重置页码为第一页
      currentPage.value = 1;
      
      // 如果有搜索内容或分类选择，显示搜索结果
      if (searchQuery.value.trim() || selectedDataSource.value) {
        // 记录当前是否有视频在播放，用于后续可能恢复
        const wasPlaying = isPlaying.value;
        const currentSource = currentStreamSources.value;
        const currentUrlParams = route.query;
        
        // 切换到搜索结果状态
        isPlaying.value = false;
        showingSearchResults.value = true;
        
        // 清除URL参数
        router.replace({
          path: '/streams',
          query: {}
        });

        // 添加一个标记到localStorage，标记搜索前的状态
        if (wasPlaying && currentSource.length > 0) {
          try {
            localStorage.setItem('wasPlaying', 'true');
            localStorage.setItem('currentUrlParams', JSON.stringify(currentUrlParams));
          } catch (e) {
            console.error('无法存储播放状态', e);
          }
        }
        
        // 执行API搜索
        if (searchQuery.value.trim()) {
          performApiSearch();
        } else {
          // 只有分类选择，不进行API搜索
          searchResults.value = [];
        }
      } else {
        // 搜索框为空，清除API搜索结果
        searchResults.value = [];
        
        // 尝试恢复之前的播放状态
        try {
          const wasPlaying = localStorage.getItem('wasPlaying') === 'true';
          if (wasPlaying && currentStreamSources.value.length > 0) {
            isPlaying.value = true;
            showingSearchResults.value = false;
            
            // 尝试恢复URL参数
            const savedParams = localStorage.getItem('currentUrlParams');
            if (savedParams) {
              const params = JSON.parse(savedParams);
              router.replace({
                path: '/streams',
                query: params
              });
            }
            
            // 清除恢复状态标记
            localStorage.removeItem('wasPlaying');
            localStorage.removeItem('currentUrlParams');
          } else {
            // 没有播放历史，默认显示所有结果
            isPlaying.value = false;
            showingSearchResults.value = true;
          }
        } catch (e) {
          console.error('尝试恢复播放状态失败', e);
          isPlaying.value = false;
          showingSearchResults.value = true;
        }
      }
    };
    
    // 加载播放历史记录
    const loadPlayHistory = () => {
      try {
        const savedHistory = localStorage.getItem('playHistory');
        if (savedHistory) {
          playHistory.value = JSON.parse(savedHistory);
        }
      } catch (e) {
        console.error('无法加载播放历史:', e);
      }
    };
    
    // 添加到播放历史
    const addToPlayHistory = (item) => {
      // 获取当前标题，用于识别同一部影视
      const currentTitle = item.title || '自定义流媒体';
      
      // 首先检查是否已存在相同影视剧（基于标题匹配）
      const existingItemIndex = playHistory.value.findIndex(
        h => (h.title && h.title === currentTitle) || 
        (h.id && h.id === item.id) || 
        (h.src && item.src && h.src === item.src)
      );
      
      // 如果存在，先删除旧的
      if (existingItemIndex !== -1) {
        playHistory.value.splice(existingItemIndex, 1);
      }
      
      // 获取当前数据源ID
      const currentDataSourceId = selectedDataSource.value || '';
      
      // 添加到开头 - 增加集数信息记录
      playHistory.value.unshift({
        id: item.id,
        title: currentTitle,
        src: item.src,
        poster: item.poster || '',
        timestamp: new Date().getTime(),
        dataSourceId: currentDataSourceId, // 保存数据源ID
        episodeIndex: item.episodeIndex !== undefined ? item.episodeIndex : (streamInfo.value?.currentEpisode || 0) // 记录当前播放的集数
      });
      
      // 限制历史记录数量
      if (playHistory.value.length > 20) {
        playHistory.value = playHistory.value.slice(0, 20);
      }
      
      // 保存到localStorage
      try {
        localStorage.setItem('playHistory', JSON.stringify(playHistory.value));
      } catch (e) {
        console.error('无法保存播放历史:', e);
      }
    };
    
    // 播放历史记录中的项目
    const playHistoryItem = async (item) => {
      // 先检查并切换到记录对应的数据源
      if (item.dataSourceId && item.dataSourceId !== selectedDataSource.value) {
        try {
          isLoading.value = true; // 显示加载状态
          
          const dataSourceManager = getDataSourceManager();
          // 获取数据源列表（不加载所有外部数据源）
          const sources = await dataSourceManager.getAllDataSources(false);
          
          if (sources[item.dataSourceId]) {
            console.log(`切换到历史记录对应的数据源: ${item.dataSourceId}`);
            selectedDataSource.value = item.dataSourceId;
            await dataSourceManager.setCurrentDataSource(item.dataSourceId);
          }
          
          isLoading.value = false; // 隐藏加载状态
        } catch (error) {
          console.error('切换数据源失败:', error);
          isLoading.value = false; // 确保错误时也隐藏加载状态
        }
      }

      if (item.id) {
        // 这是预设的视频 - 传递集数信息
        loadStreamById(item.id, item.episodeIndex);
      } else if (item.src) {
        // 这是自定义URL
        customStreamUrl.value = item.src;
        playCustomStream();
      }
    };
    
    const loadStreams = () => {
      // 使用模拟数据
      streams.value = mockStreams;
    };
    
    // 从API加载流媒体详情
    const loadStreamFromApi = async (streamId, targetEpisodeIndex = 0) => {
      isLoading.value = true; // API请求加载，显示全屏遮罩
      playerError.value = null;
      
      try {
        // 从API获取影片详情，使用当前选择的数据源
        const movieDetail = await getMovieDetail(streamId, selectedDataSource.value || null);
        console.log('获取到影片详情:', movieDetail);
        
        // API请求完成后，切换为视频加载模式
        isLoading.value = false;
        if (movieDetail) {
          // 检查是否需要二次请求获取播放URL
          const requireCid = movieDetail.vod_play_require_cid === true;
          console.log('是否需要二次请求播放URL:', requireCid);
          
          // 解析剧集列表
          const episodesList = parseEpisodes(movieDetail.vod_play_url, requireCid);
          if (episodesList.length === 0) {
            throw new Error('没有可用的播放链接');
          }
          
          // 确保目标集数在有效范围内
          const episodeIndex = targetEpisodeIndex >= 0 && targetEpisodeIndex < episodesList.length 
            ? targetEpisodeIndex 
            : 0;
          
          // 获取要播放的集数
          const targetEpisode = episodesList[episodeIndex];
          
          // 准备流媒体信息
          const mediaInfo = {
            title: movieDetail.vod_name,
            description: movieDetail.vod_blurb || movieDetail.vod_content || '',
            episodes: episodesList,
            currentEpisode: episodeIndex, // 使用目标集数
            apiData: movieDetail,
            // 增加更多详情信息
            actor: movieDetail.vod_actor || '',
            director: movieDetail.vod_director || '',
            remarks: movieDetail.vod_remarks || '',
            area: movieDetail.vod_area || '',
            year: movieDetail.vod_year || ''
          };
          
          const posterUrl = movieDetail.vod_pic || '';
          
          // 开始视频加载过程，不显示全屏遮罩
          isVideoLoading.value = true;
          isChangingVideo.value = true; // 标记正在切换视频，避免显示搜索结果
          
          // 增加playerKey以强制重新创建播放器组件
          playerKey.value += 1;
          
          // 检查是否有自定义header信息
          let customHeaders = null;
          if (movieDetail.vod_play_header) {
            try {
              // 尝试解析header信息
              customHeaders = JSON.parse(movieDetail.vod_play_header);
              console.log('检测到自定义播放header:', customHeaders);
            } catch(e) {
              console.error('解析vod_play_header失败:', e);
            }
          }
          
          // 设置媒体信息
          streamInfo.value = mediaInfo;
          
          // 准备视频源 - 处理需要二次请求的情况
          let playUrl = targetEpisode.url;
          
          // 如果需要二次请求获取真实URL
          if (targetEpisode.requireCid && targetEpisode.cid) {
            try {
              console.log('初始播放检测到需要二次请求获取真实URL，cid:', targetEpisode.cid);
              
              // 获取数据源管理器
              const dataSourceManager = getDataSourceManager();
              const currentDataSourceId = selectedDataSource.value || null;
              
              // 先检查数据源是否支持getPlayUrl
              if (!dataSourceManager.supportsGetPlayUrl(currentDataSourceId)) {
                throw new Error(`当前数据源不支持二次请求获取播放URL`);
              }
              
              // 调用数据源的getPlayUrl方法
              const playUrlResult = await dataSourceManager.getPlayUrl(
                targetEpisode.cid, 
                currentDataSourceId,
                { movieDetail: movieDetail }
              );
              
              // 检查返回结果是否为DASH格式
              if (typeof playUrlResult === 'object' && playUrlResult.type === 'dash') {
                console.log('检测到DASH格式视频:', playUrlResult);
                playUrl = playUrlResult;
              } else {
                // 普通URL格式
                playUrl = playUrlResult;
                console.log('获取到普通播放URL:', playUrl);
              }
              
              if (!playUrl) {
                throw new Error('无法获取真实播放链接');
              }
            } catch (error) {
              console.error('获取真实播放URL失败:', error);
              playerError.value = `获取播放链接失败: ${error.message}`;
              isVideoLoading.value = false;
              isChangingVideo.value = false;
              return;
            }
          }
          
          // 准备视频源
          let videoSource;
          
          // 处理DASH格式
          if (typeof playUrl === 'object' && playUrl.type === 'dash') {
            videoSource = playUrl;
          } else {
            // 普通URL格式
            videoSource = {
              src: playUrl, // 使用目标集数的URL（可能是经过二次请求的）
              type: getMediaTypeFromUrl(playUrl) // 根据URL判断媒体类型
            };
            
            // 如果有自定义header，添加到视频源
            if (customHeaders) {
              videoSource.headers = customHeaders;
            }
          }
          
          // 设置视频源
          currentStreamSources.value = [videoSource];
          currentPoster.value = posterUrl;
          
          // 设置视频ID，用于保存播放进度
          currentVideoId.value = `${streamId}_${episodeIndex}`;
          
          // 确保播放器始终显示
          isPlaying.value = true;
          showingSearchResults.value = false;
          
          // 添加到播放历史，包括集数信息
          addToPlayHistory({
            id: streamId,
            title: movieDetail.vod_name,
            poster: posterUrl,
            episodeIndex: episodeIndex // 保存当前播放的集数
          });
          
          // 延迟结束加载状态
          setTimeout(() => {
            console.log('API内容加载完成');
            isVideoLoading.value = false;
            isChangingVideo.value = false; // 视频切换完成
          }, 2000);
        } else {
          throw new Error('无法加载影片详情');
        }
      } catch (error) {
        console.error('加载影片详情失败:', error);
        playerError.value = error.message || '加载失败';
        isPlaying.value = false;
        showingSearchResults.value = true;
        isLoading.value = false;
        isChangingVideo.value = false; // 视频切换出错
      }
    };
    
    // 播放特定剧集
    const playEpisode = async (episode, index) => {
      if (!episode) return;
      
      console.log('切换剧集开始:', index, episode.title);
      isVideoLoading.value = true; // 使用视频加载状态而非全局加载状态
      isChangingVideo.value = true; // 标记正在切换视频，避免显示搜索结果
      
      try {
        // 增加playerKey以强制重新创建播放器组件
        playerKey.value += 1;
        
        let playUrl = episode.url;
        
        // 如果需要二次请求获取真实URL
        if (episode.requireCid && episode.cid) {
          try {
            console.log('检测到需要二次请求获取真实URL，cid:', episode.cid);
            
            // 获取数据源管理器
            const dataSourceManager = getDataSourceManager();
            const currentDataSourceId = selectedDataSource.value || null;
            
            // 先检查数据源是否支持getPlayUrl
            if (!dataSourceManager.supportsGetPlayUrl(currentDataSourceId)) {
              throw new Error(`当前数据源不支持二次请求获取播放URL`);
            }
            
            // 调用数据源的getPlayUrl方法
            const playUrlResult = await dataSourceManager.getPlayUrl(
              episode.cid, 
              currentDataSourceId,
              { movieDetail: streamInfo.value?.apiData }
            );
            
            // 检查返回结果是否为DASH格式
            if (typeof playUrlResult === 'object' && playUrlResult.type === 'dash') {
              console.log('检测到DASH格式视频:', playUrlResult);
              playUrl = playUrlResult;
            } else {
              // 普通URL格式
              playUrl = playUrlResult;
              console.log('获取到普通播放URL:', playUrl);
            }
            
            if (!playUrl) {
              throw new Error('无法获取真实播放链接');
            }
          } catch (error) {
            console.error('获取真实播放URL失败:', error);
            playerError.value = `获取播放链接失败: ${error.message}`;
            isVideoLoading.value = false;
            isChangingVideo.value = false;
            return;
          }
        }
        
        // 准备视频源
        let videoSource;
        
        // 处理DASH格式
        if (typeof playUrl === 'object' && playUrl.type === 'dash') {
          videoSource = playUrl;
        } else {
          // 普通URL格式
          videoSource = {
            src: playUrl,
            type: getMediaTypeFromUrl(playUrl)
          };
          
          // 检查是否有自定义header
          if (streamInfo.value?.apiData?.vod_play_header) {
            try {
              const customHeaders = JSON.parse(streamInfo.value.apiData.vod_play_header);
              videoSource.headers = customHeaders;
            } catch(e) {
              console.error('解析vod_play_header失败:', e);
            }
          }
        }
        
        // 设置视频源
        currentStreamSources.value = [videoSource];
        
        // 更新当前播放集数
        if (streamInfo.value) {
          streamInfo.value.currentEpisode = index;
        }
        
        // 设置视频ID，用于保存播放进度
        const streamId = streamInfo.value?.apiData?.vod_id || 'unknown';
        currentVideoId.value = `${streamId}_${index}`;
        
        // 确保播放器始终显示
        isPlaying.value = true;
        
        // 添加播放进度更新处理函数
        const onPlayerTimeUpdate = (currentTime) => {
          // 可以在这里添加额外的播放进度处理逻辑
          // console.log('播放进度更新:', currentTime);
        };
        
        // 6. 充分延迟后结束加载状态
        setTimeout(() => {
          console.log('剧集切换完成');
          isVideoLoading.value = false; // 使用视频加载状态而非全局加载状态
          isChangingVideo.value = false; // 视频切换完成
        }, 2000);
      } catch (error) {
        console.error('切换剧集失败:', error);
        isVideoLoading.value = false; // 使用视频加载状态而非全局加载状态
        isChangingVideo.value = false; // 视频切换完成
      }
    };
    
    // 修改从URL参数中加载流媒体的方法
    const loadStreamById = async (streamId, targetEpisodeIndex = 0) => {
      isLoading.value = true;
      
      try {
        // 先看本地数据中是否有匹配
        const localStream = mockStreams.find(s => s.id === streamId);
        
        if (localStream) {
          // 使用本地数据
          playStream(localStream);
          isLoading.value = false; // 本地数据加载完成后关闭加载状态
        } else {
          // 使用API加载
          await loadStreamFromApi(streamId, targetEpisodeIndex);
        }
      } catch (error) {
        console.error('加载流媒体信息失败:', error);
        playerError.value = `加载媒体信息失败: ${error.message}`;
        isPlaying.value = false;
        showingSearchResults.value = true;
        isLoading.value = false; // 出错时关闭加载状态
      }
    };
    
    // 播放自定义链接
    const playCustomStream = () => {
      if (!customStreamUrl.value) return;
      
      console.log('开始播放自定义链接:', customStreamUrl.value);
      isVideoLoading.value = true; // 使用视频加载状态而非全局加载状态
      isChangingVideo.value = true; // 标记正在切换视频，避免显示搜索结果
      
      // 智能判断流媒体类型，默认为HLS
      let mediaType = 'application/x-mpegURL';
      const url = customStreamUrl.value.toLowerCase();
      
      if (url.endsWith('.mp4')) {
        mediaType = 'video/mp4';
      } else if (url.endsWith('.mp3')) {
        mediaType = 'audio/mp3';
      } else if (url.endsWith('.mpd')) {
        mediaType = 'application/dash+xml';
      } else if (url.startsWith('rtmp://')) {
        mediaType = 'application/x-rtmp';
      } else if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
        // 不直接支持YouTube链接，需要提示用户
        alert('不支持直接播放YouTube链接，请使用HLS或MP4格式的直接媒体链接');
        isVideoLoading.value = false; // 使用视频加载状态而非全局加载状态
        isChangingVideo.value = false; // 视频切换完成
        return;
      }
      
      // 准备新的视频源
      const newSource = {
        src: customStreamUrl.value,
        type: mediaType
      };
      
      // 设置默认封面图片
      if (!currentPoster.value) {
        currentPoster.value = 'https://via.placeholder.com/640x360.png?text=视频播放';
      }
      
      // 增加playerKey以强制重新创建播放器组件
      playerKey.value += 1;
      
      // 设置视频源和信息
      currentStreamSources.value = [newSource];
      streamInfo.value = {
        title: '自定义流媒体',
        description: `正在播放您提供的流媒体链接: ${customStreamUrl.value}`
      };
      
      // 确保播放器始终显示
      isPlaying.value = true;
      showingSearchResults.value = false; // 播放时隐藏搜索结果
      
      // 更新URL，不刷新页面
      router.replace({
        path: '/streams',
        query: { direct_url: customStreamUrl.value }
      });
      
      // 添加到播放历史
      addToPlayHistory({
        src: customStreamUrl.value,
        title: '自定义流媒体'
      });
      
      // 延迟结束加载状态
      setTimeout(() => {
        console.log('自定义链接播放准备完成');
        isVideoLoading.value = false; // 使用视频加载状态而非全局加载状态
        isChangingVideo.value = false; // 视频切换完成
      }, 2000);
    };
    
    // 加载数据源列表
    const loadDataSources = async () => {
      try {
        console.log('开始加载数据源列表...');
        const dataSourceManager = getDataSourceManager();
        console.log('获取到数据源管理器实例:', dataSourceManager);
        
        // 初始化数据源管理器，但不加载所有外部数据源（恢复懒加载模式）
        await dataSourceManager.initialize(false);
        
        // 获取数据源列表（不加载所有外部数据源，只显示其信息）
        const sourcesPromise = dataSourceManager.getAllDataSources(false);
        const sources = await sourcesPromise; // 确保Promise已解析
        
        console.log('数据源列表原始数据类型:', typeof sources, sources instanceof Promise ? 'Promise' : 'Object');
        console.log('数据源列表原始数据:', sources);
        
        // 确保sources是一个有效的对象
        if (sources && typeof sources === 'object') {
          // 使用解构创建新对象，确保响应式更新
          dataSources.value = { ...sources };
          
          // 设置当前选择的数据源
          const currentId = dataSourceManager.getCurrentDataSourceId() || '';
          if (currentId && sources[currentId]) {
            selectedDataSource.value = currentId;
            console.log('当前选择的数据源ID:', selectedDataSource.value);
            
            // 如果当前选择的是外部数据源，但未加载，则加载它
            if (sources[currentId].toString().includes('未加载')) {
              console.log('当前选择的是未加载的外部数据源，尝试加载:', currentId);
              try {
                await dataSourceManager.setCurrentDataSource(currentId);
                // 重新获取数据源列表以更新状态
                const updatedSources = await dataSourceManager.getAllDataSources(false);
                dataSources.value = { ...updatedSources };
              } catch (err) {
                console.error('加载当前外部数据源失败:', err);
              }
            }
          } else if (Object.keys(sources).length > 0) {
            // 如果当前ID无效但有可用数据源，选择第一个
            selectedDataSource.value = Object.keys(sources)[0];
            console.log('设置默认数据源ID:', selectedDataSource.value);
          }
          
          console.log('已加载数据源列表:', Object.keys(dataSources.value).length, '个数据源');
          Object.entries(dataSources.value).forEach(([id, name]) => {
            console.log(`- 数据源: ${name} (${id})`);
          });
        } else {
          console.error('获取到的数据源列表格式无效:', sources);
        }
      } catch (error) {
        console.error('加载数据源列表失败:', error);
      }
    };
    
    // 刷新数据源列表 - 提供给其他组件调用
    const refreshDataSources = () => {
      console.log('刷新数据源列表...');
      loadDataSources();
    };
    
    // 在组件挂载后设置
    onMounted(() => {
      // 先定义生命周期钩子，然后再执行异步操作
      let unsubscribe = null;
      
      // 在组件卸载时取消订阅
      onUnmounted(() => {
        if (unsubscribe) unsubscribe();
      });
      
      // 订阅数据源更新事件
      const dataSourceManager = getDataSourceManager();
      const debouncedUpdateSources = debounce(async (updatedSources) => {
        console.log('数据源列表已更新，重新加载...', updatedSources);
        
        // 处理Promise或直接对象
        try {
          // 如果是Promise，等待它解析
          const sources = updatedSources instanceof Promise ? await updatedSources : updatedSources;
          
          if (sources && typeof sources === 'object') {
            dataSources.value = { ...sources };
            console.log('更新后的数据源列表:', Object.keys(dataSources.value).length, '个数据源');
            console.log('数据源列表详情:', dataSources.value);
          } else {
            console.error('更新的数据源列表格式无效:', sources);
          }
        } catch (error) {
          console.error('处理数据源更新时出错:', error);
        }
      }, 300); // 300ms 的防抖延迟
      
      // 订阅数据源更新事件
      unsubscribe = dataSourceManager.onDataSourcesUpdated(debouncedUpdateSources);
      
      // 异步加载数据
      const initializeApp = async () => {
        try {
          // 加载数据源是最优先的
          await loadDataSources();
          
          // 加载其他数据
          loadStreams();
          loadPlayHistory();
          
          // 处理路由参数
          if (props.id) {
            loadStreamById(props.id);
          } else if (props.direct_url) {
            customStreamUrl.value = props.direct_url;
            playCustomStream();
          } else if (route.query.search) {
            // 如果URL中包含search参数，自动执行搜索
            searchQuery.value = route.query.search;
            console.log("自动搜索:", searchQuery.value);
            performApiSearch();
            showingSearchResults.value = true;
          } else {
            // 默认显示搜索结果
            showingSearchResults.value = true;
          }
        } catch (error) {
          console.error('初始化应用时出错:', error);
        }
      };
      
      // 启动初始化过程
      initializeApp();
    });
    
    // 监听路由变化，确保刷新页面或从其他页面返回时正确加载内容
    watch(() => route.query, (newQuery) => {
      if (newQuery.id && newQuery.id !== props.id) {
        loadStreamById(newQuery.id);
      } else if (newQuery.direct_url && newQuery.direct_url !== props.direct_url) {
        customStreamUrl.value = newQuery.direct_url;
        playCustomStream();
      } else if (newQuery.search) {
        // 处理搜索参数变化
        if (searchQuery.value !== newQuery.search) {
          searchQuery.value = newQuery.search;
          console.log("路由变化，自动搜索:", searchQuery.value);
          performApiSearch();
          showingSearchResults.value = true;
        }
      }
    }, { deep: true });
    
    // 切换数据源
    const changeDataSource = async () => {
      console.log('切换数据源开始:', selectedDataSource.value);
      
      try {
        if (selectedDataSource.value) {
          isLoading.value = true; // 显示加载状态
          
          const dataSourceManager = getDataSourceManager();
          await dataSourceManager.setCurrentDataSource(selectedDataSource.value);
          console.log('数据源切换成功:', selectedDataSource.value);
          
          // 更新数据源列表，移除"未加载"标记
          const updatedSources = await dataSourceManager.getAllDataSources(false);
          dataSources.value = { ...updatedSources };
          
          // 仅在搜索结果界面且有搜索关键词时，才使用新数据源重新搜索
          if (searchQuery.value.trim() && (!isPlaying.value || showingSearchResults.value)) {
            await performApiSearch();
          }
          
          isLoading.value = false; // 隐藏加载状态
        }
        
        // 仅在非播放状态时清除URL参数
        if (!isPlaying.value) {
          // 更新URL参数，清除播放相关参数
          router.replace({
            path: '/streams',
            query: {}
          });
        }
      } catch (error) {
        console.error('切换数据源失败:', error);
        alert(`切换数据源失败: ${error.message}`);
        
        // 恢复原来的数据源
        const dataSourceManager = getDataSourceManager();
        selectedDataSource.value = dataSourceManager.getCurrentDataSourceId() || '';
        
        isLoading.value = false; // 隐藏加载状态
      }
    };
    
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    // 格式化时间戳
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return '刚刚';
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 30) {
        return `${diffDays}天前`;
      } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
    };
    
    // 播放器事件处理
    const onPlayerReady = () => {
      console.log('播放器准备就绪');
    };
    
    const onPlayerPlay = () => {
      console.log('开始播放');
      playerError.value = null;
    };
    
    const onPlayerPause = () => {
      console.log('播放暂停');
    };
    
    const onPlayerEnded = () => {
      console.log('播放结束');
    };
    
    const onPlayerError = (error) => {
      console.error('播放器错误:', error);
      playerError.value = error;
    };
    
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      
      currentPage.value = page;
      performApiSearch();
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // 使用模拟数据进行测试
    const testWithMockData = () => {
      // 设置搜索关键词为"灵笼"，这样可以触发模拟数据
      searchQuery.value = "灵笼";
      searchError.value = null; // 清除错误
      
      // 直接使用模拟数据
      searchResults.value = mockStreams;
      
      // 更新UI状态
      isSearching.value = false;
      showingSearchResults.value = true;
    };
    
    // 处理推荐项点击，自动搜索剧名
    const handleRecommendationSearch = (title) => {
      if (title) {
        searchQuery.value = title;
        handleSearch();
      }
    };
    
    // 防抖函数：等待一段时间后执行函数，如果在等待期间再次调用则重新计时
    const debounce = (fn, delay) => {
      let timer = null;
      return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          fn(...args);
          timer = null;
        }, delay);
      };
    };
    
    // 处理搜索按钮点击或回车键
    const handleSearch = () => {
      // 只有当搜索词不为空时才执行搜索
      if (searchQuery.value.trim()) {
        performSearch();
      }
    };
    
    // 覆盖原有的playStream方法，适配API数据
    const playStream = (stream) => {
      // 如果是API结果，需要先加载详情，显示全屏加载
      if (stream.apiData || (stream.id && !stream.sources.length)) {
        isLoading.value = true; // API加载，显示全屏遮罩
        
        // 更新URL，不刷新页面
        router.replace({
          path: '/streams',
          query: { id: stream.id }
        });
        
        // 加载详情并播放
        loadStreamFromApi(stream.id);
      } else {
        // 本地数据直接播放，使用视频加载状态，不显示全屏遮罩
        isVideoLoading.value = true;
        isChangingVideo.value = true; // 标记正在切换视频，避免显示搜索结果
        
        // 增加playerKey以强制重新创建播放器组件
        playerKey.value += 1;
        
        // 本地数据设置
        streamInfo.value = {
          title: stream.title,
          description: stream.description
        };
        currentStreamSources.value = stream.sources;
        currentPoster.value = stream.poster || '';
        
        // 确保播放器始终显示
        isPlaying.value = true;
        showingSearchResults.value = false;
        
        // 更新URL，不刷新页面
        router.replace({
          path: '/streams',
          query: { id: stream.id }
        });
        
        // 添加到播放历史
        addToPlayHistory({
          id: stream.id,
          title: stream.title,
          poster: stream.poster
        });
        
        // 延迟结束加载状态
        setTimeout(() => {
          isVideoLoading.value = false;
          isChangingVideo.value = false; // 视频切换完成
        }, 2000);
      }
    };
    
    const clearPlayHistory = () => {
      playHistory.value = [];
      localStorage.removeItem('playHistory');
    };
    
    // 根据URL判断媒体类型
    const getMediaTypeFromUrl = (url) => {
      if (!url) return 'application/x-mpegURL'; // 默认为HLS格式
      
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.endsWith('.mp4')) {
        return 'video/mp4';
      } else if (lowerUrl.endsWith('.m3u8')) {
        return 'application/x-mpegURL';
      } else if (lowerUrl.endsWith('.mp3')) {
        return 'audio/mp3';
      } else if (lowerUrl.endsWith('.mpd')) {
        return 'application/dash+xml';
      } else if (lowerUrl.startsWith('rtmp://')) {
        return 'application/x-rtmp';
      }
      
      // 根据路径中的关键字判断
      if (lowerUrl.includes('.m3u8')) {
        return 'application/x-mpegURL';
      } else if (lowerUrl.includes('.mp4')) {
        return 'video/mp4';
      }
      
      // 默认值
      return 'application/x-mpegURL';
    };
    
    // 返回推荐主页
    const returnToHome = () => {
      searchQuery.value = '';
      searchResults.value = [];
      isPlaying.value = false;
      streamInfo.value = null;
      showingSearchResults.value = false;
      isChangingVideo.value = false;
      
      // 确保所有可能影响按钮显示的状态都被重置
      playerError.value = null;
      currentPage.value = 1;
      isSearching.value = false;
      searchError.value = null;
      
      // 清除URL参数
      router.replace({
        path: '/streams',
        query: {}
      }).catch(() => {});
      
      // 通知父组件状态已更改
      nextTick(() => {
        console.log("已返回推荐主页，所有状态已重置");
      });
    };
    
    // 处理播放进度更新
    const onPlayerTimeUpdate = (currentTime) => {
      // 可以在这里添加播放进度处理逻辑
      // console.log('播放进度更新:', currentTime);
      
      // 如果需要，可以在这里保存播放进度
      if (currentVideoId.value && currentTime) {
        try {
          localStorage.setItem(`progress_${currentVideoId.value}`, currentTime.toString());
        } catch (e) {
          console.error('保存播放进度失败', e);
        }
      }
    };
    
    return {
      streams,
      filteredStreams,
      searchQuery,
      selectedDataSource,
      dataSources,
      isPlaying,
      showingSearchResults,
      streamInfo,
      customStreamUrl,
      currentStreamSources,
      currentPoster,
      isLoading,
      isVideoLoading,
      isChangingVideo,
      playHistory,
      playerError,
      searchResults,
      currentPage,
      totalPages,
      isSearching,
      searchError,
      playerKey,
      playStream,
      performSearch,
      playCustomStream,
      changeDataSource,
      formatDuration,
      formatTime,
      playHistoryItem,
      changePage,
      playEpisode,
      onPlayerReady,
      onPlayerPlay,
      onPlayerPause,
      onPlayerEnded,
      onPlayerError,
      onPlayerTimeUpdate,
      currentVideoId,
      testWithMockData,
      handleSearch,
      clearPlayHistory,
      isDescriptionCollapsed,
      getMediaTypeFromUrl,
      handleRecommendationSearch,
      returnToHome
    };
  }
}
</script>

<style scoped src="@/styles/StreamsPage.css"></style>