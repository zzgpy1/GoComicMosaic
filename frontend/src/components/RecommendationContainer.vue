<template>
  <div class="recommendation-container">
    <h1 class="main-title">精选推荐</h1>
    
    <!-- 标签导航 -->
    <div class="category-tabs">
      <div 
        v-for="(category, index) in categories" 
        :key="index"
        :class="['category-tab', { active: selectedCategory === category.value }]"
        @click="selectedCategory = category.value"
      >
        {{ category.name }}
      </div>
    </div>
    
    <!-- 推荐内容 - 根据选择的标签动态显示 -->
    <RecommendationHome 
      :title="getCategoryTitle()" 
      :category="selectedCategory" 
      :fallbackCategory="getCategoryFallback()"
      @search="handleSearch"
    />
  </div>
</template>

<script>
import { ref } from 'vue';
import RecommendationHome from './RecommendationHome.vue';

export default {
  name: 'RecommendationContainer',
  components: {
    RecommendationHome
  },
  emits: ['search'],
  setup(props, { emit }) {
    // 定义分类列表
    const categories = [
      { name: '实时热门', value: 'subject_real_time_hotest', fallback: 'movie_showing' },
      { name: '欧美动漫', value: 'animation_hot', fallback: 'tv_animation' },
      { name: '国产剧集', value: 'tv_domestic', fallback: 'tv_hot' },
      { name: '热门电影', value: 'movie_showing', fallback: 'movie_hot_gaia' },
      { name: '热播综艺', value: 'show_hot', fallback: 'show_domestic' },
      // { name: '欧美剧集', value: 'tv_american', fallback: 'tv_hot' },
      // { name: '日剧', value: 'tv_japanese', fallback: 'tv_korean' },
      // { name: '韩剧', value: 'tv_korean', fallback: 'tv_japanese' }
    ];
    
    // 当前选中的分类，默认为热门动漫
    const selectedCategory = ref('animation_hot');
    
    // 获取当前分类标题
    const getCategoryTitle = () => {
      const category = categories.find(c => c.value === selectedCategory.value);
      return category ? category.name : '推荐内容';
    };
    
    // 获取当前分类的备用分类
    const getCategoryFallback = () => {
      const category = categories.find(c => c.value === selectedCategory.value);
      return category ? category.fallback : '';
    };
    
    // 处理搜索事件
    const handleSearch = (title) => {
      emit('search', title);
    };
    
    return {
      categories,
      selectedCategory,
      handleSearch,
      getCategoryTitle,
      getCategoryFallback
    };
  }
};
</script>

<style scoped src="@/styles/RecommendationContainer.css"></style>