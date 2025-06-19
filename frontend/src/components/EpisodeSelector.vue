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
            @click="handlePrevPage"
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
            @click="handleNextPage"
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
            @keyup.enter="handleJumpToPage"
          />
          <button class="jump-button" @click.stop.prevent="handleJumpToPage">跳转</button>
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
import { ref, computed, defineProps, defineEmits, watch, nextTick } from 'vue';

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
    
    // 添加手动翻页标志，避免自动调整覆盖用户操作
    const isManualPageChange = ref(false);
    
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
      
      // 剧集选择后，取消手动翻页状态，允许自动调整
      isManualPageChange.value = false;
      
      emit('select-episode', props.episodes[index], index);
    };

    // 处理上一页按钮点击
    const handlePrevPage = () => {
      console.log('点击上一页按钮，当前页码:', currentPage.value);
      if (currentPage.value > 1) {
        // 标记为手动翻页，避免自动调整
        isManualPageChange.value = true;
        
        currentPage.value -= 1;
        jumpToPage.value = currentPage.value;
        console.log('页码已更新为:', currentPage.value);
      }
    };

    // 处理下一页按钮点击
    const handleNextPage = () => {
      console.log('点击下一页按钮，当前页码:', currentPage.value);
      if (currentPage.value < totalPages.value) {
        // 标记为手动翻页，避免自动调整
        isManualPageChange.value = true;
        
        currentPage.value += 1;
        jumpToPage.value = currentPage.value;
        console.log('页码已更新为:', currentPage.value);
      }
    };
    
    // 切换页码 - 保留但不直接绑定到按钮
    const changePage = (pageNum) => {
      console.log('调用changePage函数，目标页码:', pageNum);
      if (pageNum >= 1 && pageNum <= totalPages.value) {
        // 标记为手动翻页，避免自动调整
        isManualPageChange.value = true;
        
        currentPage.value = pageNum;
        jumpToPage.value = pageNum;
        console.log('页码已更新为:', currentPage.value);
      }
    };
    
    // 处理跳转到指定页
    const handleJumpToPage = (event) => {
      console.log('点击跳转按钮，目标页码:', jumpToPage.value);
      // 防止事件冒泡和默认行为
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      
      if (jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
        // 标记为手动翻页，避免自动调整
        isManualPageChange.value = true;
        
        currentPage.value = jumpToPage.value;
        console.log('页码已更新为:', currentPage.value);
      } else {
        // 输入无效页码，重置为当前页
        jumpToPage.value = currentPage.value;
        console.log('无效页码，重置为:', currentPage.value);
      }
    };
    
    // 在选集变化时，自动跳转到包含该集的页面
    const scrollToSelectedIfVisible = () => {
      // 如果是手动翻页，不执行自动调整
      if (isManualPageChange.value) {
        console.log('用户手动翻页中，跳过自动页码调整');
        return;
      }
      
      const targetPage = Math.ceil((selectedIndex.value + 1) / props.pageSize);
      if (targetPage !== currentPage.value) {
        currentPage.value = targetPage;
        jumpToPage.value = targetPage;
        console.log('自动调整页码到包含当前选中剧集的页面:', currentPage.value);
      }
    };
    
    // 监听初始选中值的变化
    watch(() => props.initialSelected, (newVal) => {
      selectedIndex.value = newVal;
      
      // 重置手动翻页标志，允许自动调整页码
      isManualPageChange.value = false;
      
      scrollToSelectedIfVisible();
    });
    
    // 监听episodes变化，在episodes变化时重置分页状态
    watch(() => props.episodes.length, () => {
      console.log('剧集列表变化，重置分页状态');
      
      // 重置手动翻页标志，允许自动调整页码
      isManualPageChange.value = false;
      
      // 计算目标页码
      const targetPage = Math.ceil((selectedIndex.value + 1) / props.pageSize);
      currentPage.value = targetPage > 0 ? targetPage : 1;
      jumpToPage.value = currentPage.value;
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
      handleJumpToPage,
      handlePrevPage,
      handleNextPage
    };
  }
}
</script>

<style scoped src="@/styles/EpisodeSelector.css"></style>