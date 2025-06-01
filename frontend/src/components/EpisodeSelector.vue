<template>
  <div class="episode-selector">
    <div class="episode-header">
      <h3>剧集列表</h3>
      <span class="episode-count">共{{ episodes.length }}集</span>
    </div>
    
    <!-- 当集数较少时直接显示所有剧集 -->
    <div v-if="episodes.length <= pageSize" class="episode-list">
      <button
        v-for="(episode, index) in episodes"
        :key="index"
        class="episode-item"
        :class="{ 'active': selectedIndex === index }"
        @click="selectEpisode(index)"
      >
        {{ episode.title }}
      </button>
    </div>
    
    <!-- 当集数较多时启用分页功能 -->
    <div v-else>
      <!-- 分页导航 - 顶部 -->
      <div class="pagination-controls">
        <div class="page-navigation">
          <button 
            class="page-button" 
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="page-info">
            <span class="current-page">{{ currentPage }}</span>
            <span class="total-pages">/{{ totalPages }}</span>
          </div>
          <button 
            class="page-button" 
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
        <div class="page-jump">
          <input 
            type="number" 
            v-model.number="jumpToPage" 
            min="1" 
            :max="totalPages" 
            class="jump-input"
          />
          <button class="jump-button" @click="handleJumpToPage">跳转</button>
        </div>
      </div>
      
      <!-- 当前页剧集列表 -->
      <div class="episode-list">
        <button
          v-for="episode in currentPageEpisodes"
          :key="episode.index"
          class="episode-item"
          :class="{ 'active': selectedIndex === episode.index }"
          @click="selectEpisode(episode.index)"
        >
          {{ episode.title }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, defineProps, defineEmits, watch } from 'vue';

export default {
  name: 'EpisodeSelector',
  props: {
    episodes: {
      type: Array,
      default: () => []
    },
    initialSelected: {
      type: Number,
      default: 0
    },
    pageSize: {
      type: Number,
      default: 30 // 默认每页显示30集
    }
  },
  emits: ['select-episode'],
  setup(props, { emit }) {
    // 当前选中的剧集索引
    const selectedIndex = ref(props.initialSelected);
    
    // 分页相关状态
    const currentPage = ref(1);
    const jumpToPage = ref(1);
    
    // 计算总页数
    const totalPages = computed(() => {
      return Math.ceil(props.episodes.length / props.pageSize);
    });
    
    // 计算当前页应该显示的剧集
    const currentPageEpisodes = computed(() => {
      const startIndex = (currentPage.value - 1) * props.pageSize;
      const endIndex = Math.min(startIndex + props.pageSize, props.episodes.length);
      
      return props.episodes.slice(startIndex, endIndex).map((episode, idx) => ({
        ...episode,
        index: startIndex + idx // 保存在完整列表中的真实索引
      }));
    });
    
    // 选择剧集
    const selectEpisode = (index) => {
      selectedIndex.value = index;
      emit('select-episode', props.episodes[index], index);
    };
    
    // 切换页码
    const changePage = (pageNum) => {
      if (pageNum >= 1 && pageNum <= totalPages.value) {
        currentPage.value = pageNum;
        jumpToPage.value = pageNum;
        
        // 如果选中的集数在当前页，确保视图上仍然高亮
        scrollToSelectedIfVisible();
      }
    };
    
    // 处理跳转到指定页
    const handleJumpToPage = () => {
      if (jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
        changePage(jumpToPage.value);
      } else {
        // 输入无效页码，重置为当前页
        jumpToPage.value = currentPage.value;
      }
    };
    
    // 在选集变化时，自动跳转到包含该集的页面
    const scrollToSelectedIfVisible = () => {
      const targetPage = Math.ceil((selectedIndex.value + 1) / props.pageSize);
      if (targetPage !== currentPage.value) {
        currentPage.value = targetPage;
        jumpToPage.value = targetPage;
      }
    };
    
    // 监听初始选中值的变化
    watch(() => props.initialSelected, (newVal) => {
      selectedIndex.value = newVal;
      scrollToSelectedIfVisible();
    });
    
    // 初始化时，确保显示包含初始选中集数的页面
    scrollToSelectedIfVisible();
    
    return {
      selectedIndex,
      currentPage,
      totalPages,
      jumpToPage,
      currentPageEpisodes,
      selectEpisode,
      changePage,
      handleJumpToPage
    };
  }
}
</script>

<style scoped>
.episode-selector {
  margin-top: 20px;
  background-color: var(--bg-color, #fcfbfe);
  border-radius: 8px;
  padding: 15px;
}

.episode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(var(--primary-color-rgb, 124, 58, 237), 0.1);
}

.episode-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--dark-color, #333);
}

.episode-count {
  color: var(--gray-color, #666);
  font-size: 14px;
}

.episode-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 15px 0;
}

.episode-item {
  padding: 8px 15px;
  background-color: #fff;
  border: 1px solid rgba(var(--primary-color-rgb, 124, 58, 237), 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
  color: var(--dark-color, #333);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.episode-item:hover {
  background-color: rgba(var(--primary-color-rgb, 124, 58, 237), 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.episode-item.active {
  background: var(--primary-gradient, linear-gradient(45deg, #7c3aed, #8b5cf6));
  border-color: var(--primary-color, #7c3aed);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(var(--primary-color-rgb, 124, 58, 237), 0.2);
}

/* 分页控件样式 */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.page-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-button {
  background: var(--primary-gradient, linear-gradient(45deg, #7c3aed, #8b5cf6));
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(var(--primary-color-rgb, 124, 58, 237), 0.15);
}

.page-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(var(--primary-color-rgb, 124, 58, 237), 0.25);
}

.page-button:disabled {
  background: linear-gradient(45deg, #BDBDBD, #E0E0E0);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.page-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--dark-color, #333);
}

.current-page {
  font-weight: bold;
  color: var(--primary-color, #7c3aed);
  margin-right: 2px;
}

.total-pages {
  color: var(--gray-color, #666);
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 5px;
}

.jump-input {
  width: 50px;
  padding: 5px;
  border: 1px solid rgba(var(--primary-color-rgb, 124, 58, 237), 0.2);
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.jump-input:focus {
  outline: none;
  border-color: var(--primary-color, #7c3aed);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb, 124, 58, 237), 0.1);
}

.jump-button {
  background: var(--primary-gradient, linear-gradient(45deg, #7c3aed, #8b5cf6));
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
}

.jump-button:hover {
  background: var(--primary-gradient, linear-gradient(45deg, #6c2aed, #7b4cf6));
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(var(--primary-color-rgb, 124, 58, 237), 0.2);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .episode-list {
    gap: 8px;
  }
  
  .episode-item {
    padding: 6px 10px;
    font-size: 13px;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .page-navigation {
    width: 100%;
    justify-content: space-between;
  }
  
  .page-jump {
    width: 100%;
    justify-content: center;
    margin-top: 5px;
  }
}
</style> 