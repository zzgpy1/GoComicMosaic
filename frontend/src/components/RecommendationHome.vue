<template>
  <div class="recommendation-home">
    <h2 class="section-title">{{ title }}</h2>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载{{ title }}内容...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchRecommendations" class="retry-button">重试</button>
    </div>
    
    <!-- 推荐内容展示 -->
    <transition name="fade">
      <div v-if="!isLoading && !error && recommendations.length > 0" class="recommendations-grid">
        <div 
          v-for="item in recommendations" 
          :key="item.vod_id" 
          class="recommendation-card"
          @click="handleItemClick(item)"
        >
          <div class="recommendation-thumbnail">
            <img 
              :src="item.vod_pic || defaultPoster" 
              :alt="item.vod_name"
              referrerPolicy="no-referrer"
              class="recommendation-image"
            />
            <div class="recommendation-overlay">
              <div class="recommendation-play-icon">▶</div>
            </div>
            <div v-if="item.vod_remarks" class="recommendation-badge">
              {{ item.vod_remarks }}
            </div>
          </div>
          <div class="recommendation-info">
            <h3 class="recommendation-title">{{ item.vod_name }}</h3>
            <div class="recommendation-meta">
              <span v-if="item.vod_year" class="recommendation-year">{{ item.vod_year }}</span>
              <span v-if="item.vod_area" class="recommendation-area">{{ item.vod_area }}</span>
              <span v-if="item.type_name" class="recommendation-type">{{ item.type_name }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 无内容提示 -->
    <div v-if="!isLoading && !error && recommendations.length === 0" class="no-content">
      <p>暂无{{ title }}内容</p>
    </div>
    
    <!-- 分页控件 - 移除pagecount > 1条件，只要有内容就显示分页 -->
    <div v-if="!isLoading && !error && recommendations.length > 0" class="pagination">
      <button 
        :disabled="current <= 1" 
        @click="changePage(current - 1)"
        class="page-button"
        aria-label="上一页"
      >
        <i class="bi bi-chevron-left"></i>
      </button>
      <span class="page-info">第 {{ current }} 页 / 共 {{ pagecount }} 页</span>
      <button 
        :disabled="current >= pagecount" 
        @click="changePage(current + 1)"
        class="page-button"
        aria-label="下一页"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { addCorsProxy, fetchWithProxy } from '../utils/corsProxy';

export default {
  name: 'RecommendationHome',
  props: {
    title: {
      type: String,
      default: '今日推荐'
    },
    category: {
      type: String,
      default: 'subject_real_time_hotest' // 默认使用实时热门
    },
    dataSourceId: {
      type: String,
      default: ''
    },
    fallbackCategory: {
      type: String,
      default: ''
    }
  },
  emits: ['search'],
  setup(props, { emit }) {
    const recommendations = ref([]);
    const isLoading = ref(false);
    const error = ref('');
    const current = ref(1);
    const pagecount = ref(1);
    const total = ref(0);
    
    // 根据屏幕宽度动态计算每页显示数量和列数
    const screenWidth = ref(window.innerWidth);
    const columnsCount = computed(() => {
      if (screenWidth.value >= 1200) return 5;
      if (screenWidth.value >= 992) return 4;
      if (screenWidth.value >= 768) return 3;
      return 2;
    });
    
    // 固定每页显示20条数据
    const size = computed(() => 20);
    
    const defaultPoster = 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2671657187.jpg';
    
    // 监听窗口大小变化
    const handleResize = () => {
      screenWidth.value = window.innerWidth;
    };
    
    // 豆瓣API配置
    const doubanApiConfig = {
      baseUrl: 'https://frodo.douban.com/api/v2',
      apiKey: '0ac44ae016490db2204ce0a042db2916',
      headers: {
        "Host": "frodo.douban.com",
        "Connection": "Keep-Alive",
        "Referer": "https://servicewechat.com/wx2f9b06c1de1ccfca/84/page-frame.html",
        "content-type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat"
      },
      // 热门动漫API配置
      animeConfig: {
        baseUrl: 'https://m.douban.com/rexxar/api/v2/tv/recommend',
        headers: {
          "Referer": "https://m.douban.com"
        }
      }
    };
    
    // 计算API URL
    const apiUrl = computed(() => {
      // 如果是动漫分类，使用专门的动漫API
      if (props.category === 'animation_hot') {
        return `${doubanApiConfig.animeConfig.baseUrl}?refresh=0&start=${(current.value - 1) * size.value}&count=${size.value}&selected_categories={"类型":"动画","形式":"电视剧"}&uncollect=false&tags=动画,欧美&sort=R`;
      }
      // 否则使用常规API
      return `${doubanApiConfig.baseUrl}/subject_collection/${props.category}/items?apikey=${doubanApiConfig.apiKey}&start=${(current.value - 1) * size.value}`;
    });
    
    // 获取推荐内容
    const fetchRecommendations = async () => {
      // 如果分类发生变化，重置页码
      if (lastCategory !== props.category) {
        current.value = 1;
        lastCategory = props.category;
      }
      
      isLoading.value = true;
      error.value = '';
      
      try {
        console.log(`[推荐主页] 获取${props.title}数据，URL: ${apiUrl.value}`);
        
        // 根据不同API选择不同的headers
        const headers = props.category === 'animation_hot' ? 
          doubanApiConfig.animeConfig.headers : 
          doubanApiConfig.headers;
        
        // 使用CORS代理发送请求
        const response = await fetchWithProxy(apiUrl.value, { headers });
        
        // 处理响应数据
        if (response) {
          if (props.category === 'animation_hot') {
            // 处理动漫API返回的数据格式
            if (response.items && Array.isArray(response.items)) {
              recommendations.value = response.items.map(item => ({
                vod_id: `msearch:tv__${item.id}`,
                vod_name: item.title,
                vod_pic: item.pic?.normal || '',
                vod_remarks: item.rating?.value ? `评分: ${item.rating.value}` : '',
                vod_year: item.year || '',
                vod_area: (item.card_subtitle || '').split(' / ')[1] || '',
                type_name: '动画'
              }));
              
              // 设置分页信息
              total.value = response.total || response.count || 0;
              pagecount.value = Math.ceil(total.value / size.value) || 1;
              
              console.log(`[推荐主页] ${props.title}数据获取成功，共${recommendations.value.length}条，总数${total.value}条`);
            } else {
              throw new Error('返回数据格式不正确');
            }
          } else if (response.subject_collection_items) {
            // 处理常规API返回的数据格式
            recommendations.value = response.subject_collection_items.map(item => ({
              vod_id: `msearch:${item.type}__${item.id}`,
              vod_name: item.title,
              // 优先使用cover.url获取海报图片
              vod_pic: item.cover?.url || item.pic?.normal || '',
              vod_remarks: item.rating?.value ? `评分: ${item.rating.value}` : '',
              vod_year: item.card_subtitle?.split(' / ')[0] || '',
              vod_area: item.card_subtitle?.split(' / ')[1] || '',
              type_name: item.type || ''
            }));
            
            // 设置分页信息
            total.value = response.total || response.count || 0;
            pagecount.value = Math.ceil(total.value / size.value) || 1;
            
            console.log(`[推荐主页] ${props.title}数据获取成功，共${recommendations.value.length}条，总数${total.value}条`);
          } else {
            throw new Error('返回数据格式不正确');
          }
        } else {
          throw new Error('返回数据格式不正确');
        }
      } catch (err) {
        console.error(`[推荐主页] ${props.title}数据获取失败:`, err);
        error.value = `获取${props.title}失败: ${err.message}`;
        
        // 尝试使用备用分类
        if (props.fallbackCategory && props.fallbackCategory !== props.category) {
          console.log(`[推荐主页] 尝试使用备用分类: ${props.fallbackCategory}`);
          try {
            const fallbackUrl = `${doubanApiConfig.baseUrl}/subject_collection/${props.fallbackCategory}/items?apikey=${doubanApiConfig.apiKey}&start=${(current.value - 1) * size.value}`;
            
            const fallbackResponse = await fetchWithProxy(fallbackUrl, {
              headers: doubanApiConfig.headers
            });
            
            if (fallbackResponse && fallbackResponse.subject_collection_items) {
              recommendations.value = fallbackResponse.subject_collection_items.map(item => ({
                vod_id: `msearch:${item.type}__${item.id}`,
                vod_name: item.title,
                // 优先使用cover.url获取海报图片
                vod_pic: item.cover?.url || item.pic?.normal || '',
                vod_remarks: item.rating?.value ? `评分: ${item.rating.value}` : '',
                vod_year: item.card_subtitle?.split(' / ')[0] || '',
                vod_area: item.card_subtitle?.split(' / ')[1] || '',
                type_name: item.type || ''
              }));
              
              total.value = fallbackResponse.total || fallbackResponse.count || 0;
              pagecount.value = Math.ceil(total.value / size.value) || 1;
              
              error.value = ''; // 清除错误
              console.log(`[推荐主页] 备用分类数据获取成功，共${recommendations.value.length}条，总数${total.value}条`);
            }
          } catch (fallbackErr) {
            console.error(`[推荐主页] 备用分类数据获取失败:`, fallbackErr);
            // 保留原始错误信息
          }
        }
      } finally {
        isLoading.value = false;
      }
    };
    
    // 切换页码
    const changePage = (newPage) => {
      if (newPage >= 1 && newPage <= pagecount.value) {
        current.value = newPage;
      }
    };
    
    // 处理项目点击
    const handleItemClick = (item) => {
      // 提取剧名，用于搜索
      const title = item.vod_name;
      if (title) {
        emit('search', title);
      }
    };
    
    // 记录上一次的分类，用于检测分类变化
    let lastCategory = props.category;
    
    // 监听分类变化，重新获取数据
    watch(() => props.category, (newCategory, oldCategory) => {
      if (newCategory !== oldCategory) {
        // 重置页码并清空当前结果，以便显示加载状态
        current.value = 1;
        recommendations.value = [];
        fetchRecommendations();
      }
    });
    
    // 监听页码变化
    watch(current, () => {
      fetchRecommendations();
    });
    
    // 组件挂载时获取数据并添加窗口大小监听
    onMounted(() => {
      fetchRecommendations();
      window.addEventListener('resize', handleResize);
    });
    
    // 组件卸载时移除监听器
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });
    
    return {
      recommendations,
      isLoading,
      error,
      current,
      pagecount,
      total,
      size,
      defaultPoster,
      changePage,
      fetchRecommendations,
      handleItemClick
    };
  }
};
</script>

<style scoped src="@/styles/RecommendationHome.css"></style>