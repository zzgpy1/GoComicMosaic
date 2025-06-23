<template>
  <div class="posts-page">
    <div class="hero-banner">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">文章列表</h1>
          <p class="hero-subtitle">分享知识、记录思考、探索创意的空间</p>
        </div>
        <!-- 集成搜索框到横幅中 -->
        <div class="search-box">
          <input
            type="text"
            class="custom-input"
            v-model="searchQuery"
            placeholder="输入文章标题..."
            @keyup.enter="searchPosts"
          />
          <button @click="searchPosts" class="search-button">
            <i class="bi bi-search"></i> <span class="search-text">搜索</span>
          </button>
          <button v-if="isAdmin" class="create-button" @click="createNewPost">
            <i class="bi bi-plus-lg"></i> <span class="create-text">新建文章</span>
          </button>
        </div>
      </div>
    </div>

    <div class="container main-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="posts.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <p>暂无文章</p>
        <p v-if="isSearching" class="sub-text">没有找到与 "{{ searchQuery }}" 相关的文章</p>
        <button v-if="isSearching" class="btn btn-primary" @click="resetSearch">
          返回全部文章
        </button>
        <button v-if="isAdmin" class="btn btn-success" @click="createNewPost">
          创建第一篇文章
        </button>
      </div>
      
      <div v-else class="posts-layout">
        <!-- 左侧文章导航栏 -->
        <div class="posts-sidebar">
          <div class="sidebar-header">
            <h3>文章目录</h3>
          </div>
          <div class="posts-list">
            <div class="article-tree">
              <!-- 遍历分类 -->
              <div v-for="(category, categoryName) in categorizedPosts" :key="categoryName || 'root'" class="category-group">
                <!-- 分类标题，当categoryName不为空时才显示 -->
                <div 
                  v-if="categoryName" 
                  class="category-title"
                  @click="toggleCategory(categoryName)"
                >
                  <i :class="['category-icon', expandedCategories.includes(categoryName) ? 'expanded' : '']">▸</i>
                  {{ categoryName }}
                </div>
                
                <!-- 分类下的文章 -->
                <ul 
                  v-show="!categoryName || expandedCategories.includes(categoryName)"
                  class="category-articles"
                  :class="{'root-articles': !categoryName}"
                >
                  <li 
                    v-for="post in category" 
                    :key="post.id" 
                    class="article-item" 
                    :class="{ active: selectedPost && selectedPost.id === post.id }"
                    @click="selectPost(post)"
                  >
                    {{ post.title }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧文章内容 -->
        <div class="post-content-area">
          <div v-if="!selectedPost" class="select-prompt">
            <div class="arrow-icon">←</div>
            <p>请从左侧选择一篇文章</p>
          </div>
          
          <div v-else class="post-detail">
            <div class="post-header">
              
              <div class="post-meta">
                <div class="post-info">
                  <span class="post-author">
                    👤 {{ selectedPost.author || siteInfo.logoText }}
                  </span>
                  <span class="post-date">
                    📅 {{ formatDate(selectedPost.created_at) }}
                  </span>
                  <div class="post-tags">
                    <span v-for="(tag, index) in selectedPost.tags" :key="index" class="post-tag">
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div v-if="isAdmin" class="post-actions">
                  <button class="btn btn-sm btn-primary" @click="editPost(selectedPost)">
                    ✏️ 编辑
                  </button>
                  <button class="btn btn-sm btn-danger" @click="confirmDeletePost(selectedPost)">
                    🗑️ 删除
                  </button>
                </div>
              </div>
              
              <div v-if="selectedPost.description" class="post-description">
                {{ selectedPost.description }}
              </div>
            </div>
            
            <div class="post-content">
              <!-- 应用GitHub主题到Markdown内容 -->
              <div v-if="selectedPostContent" 
                  v-html="renderedContent" 
                  class="markdown-content markdown-theme-github"></div>
              <div v-else class="loading-content">
                <div class="spinner"></div>
                <p>加载文章内容...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div class="modal" v-if="showDeleteConfirm">
      <div class="modal-overlay" @click="cancelDelete"></div>
      <div class="modal-container delete-confirm-modal">
        <div class="modal-header">
          <h2>确认删除</h2>
          <button class="close-btn" @click="cancelDelete">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-confirm-content">
            <div class="warning-icon">⚠️</div>
            <p>您确定要删除文章 <strong>"{{ postToDelete?.title }}"</strong> 吗？</p>
            <p class="warning-text">此操作无法撤销。</p>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="cancelDelete">
              取消
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              :disabled="deleting"
              @click="deletePost"
            >
              <span v-if="deleting">
                删除中...
              </span>
              <span v-else>确认删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑器模态框 -->
    <div class="modal" v-if="showEditor">
      <div class="modal-overlay" @click="closeEditor"></div>
      <div class="modal-container editor-modal">
        <PostEditor 
          :postToEdit="editingPost" 
          @close="closeEditor" 
          @saved="handlePostSaved"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PostService from '../services/PostService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { isAdmin } from '../utils/auth';
import PostEditor from '../components/PostEditor.vue';
import '../styles/markdown-themes.css';
import infoManager from '../utils/InfoManager';

export default {
  name: 'Posts',
  components: {
    PostEditor,
  },
  data() {
    return {
      posts: [],
      loading: true,
      searchQuery: '',
      isSearching: false,
      selectedPost: null,
      selectedPostContent: null,
      showDeleteConfirm: false,
      postToDelete: null,
      deleting: false,
      showEditor: false,
      editingPost: null,
      expandedCategories: [], // 已展开的分类
      siteInfo: {
        logoText: '美漫资源共建' // 默认值
      }
    };
  },
  computed: {
    isAdmin() {
      return isAdmin();
    },
    renderedContent() {
      if (!this.selectedPostContent) return '';
      if (this.selectedPost.is_markdown) {
        const rawHtml = marked(this.selectedPostContent);
        return DOMPurify.sanitize(rawHtml);
      }
      return DOMPurify.sanitize(this.selectedPostContent);
    },
    // 将文章按分类组织
    categorizedPosts() {
      const categorized = {};
      
      this.posts.forEach(post => {
        // 从文章路径中提取分类
        const category = this.extractCategoryFromPath(post.path || '');
        
        if (!categorized[category]) {
          categorized[category] = [];
        }
        
        categorized[category].push(post);
      });
      
      // 对每个分类下的文章进行排序（按创建时间降序）
      Object.keys(categorized).forEach(category => {
        categorized[category].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      });
      
      return categorized;
    }
  },
  metaInfo() {
    return {
      title: '文章列表',
      meta: [
        { name: 'description', content: '浏览所有文章' },
        { name: 'keywords', content: '文章, 博客, 阅读' }
      ]
    };
  },
  created() {
    this.fetchPosts();
    this.loadSiteInfo(); // 加载站点信息
  },
  methods: {
    // 加载站点信息
    async loadSiteInfo() {
      try {
        const info = await infoManager.getSiteBasicInfo();
        this.siteInfo = info;
        console.log('站点信息加载成功:', this.siteInfo);
      } catch (error) {
        console.error('获取站点信息失败:', error);
        // 使用默认值
      }
    },
    // 从文章路径中提取分类
    extractCategoryFromPath(path) {
      if (!path) return '';  // 改为空字符串，不再使用"未分类"
      
      // 如果路径中包含目录分隔符，则提取其中的目录部分
      if (path.includes('/')) {
        const dirPath = path.split('/').slice(0, -1).join('/');
        return dirPath;
      }
      
      // 如果路径中不包含分隔符，则是根目录的文章
      return '';
    },
    
    // 切换分类的展开/折叠状态
    toggleCategory(categoryName) {
      if (this.expandedCategories.includes(categoryName)) {
        this.expandedCategories = this.expandedCategories.filter(c => c !== categoryName);
      } else {
        this.expandedCategories.push(categoryName);
      }
    },
    
    async fetchPosts() {
      this.loading = true;
      try {
        const result = await PostService.getAllPosts();
        // 确保posts始终是一个数组，即使API返回null或undefined
        this.posts = Array.isArray(result) ? result : [];
        this.isSearching = false;
        
        // 默认展开所有分类
        this.expandedCategories = Object.keys(this.categorizedPosts);
        
        // 如果有文章，默认选择第一篇
        if (this.posts.length > 0) {
          this.selectPost(this.posts[0]);
        }
      } catch (error) {
        console.error('获取文章失败:', error);
        this.posts = []; // 确保错误情况下posts也是一个空数组
      } finally {
        this.loading = false;
      }
    },
    async searchPosts() {
      if (!this.searchQuery.trim()) {
        return this.fetchPosts();
      }
      
      this.loading = true;
      try {
        const result = await PostService.searchPosts(this.searchQuery);
        // 确保posts始终是一个数组，即使API返回null或undefined
        this.posts = Array.isArray(result) ? result : [];
        this.isSearching = true;
        this.selectedPost = null;
        this.selectedPostContent = null;
        
        // 如果有搜索结果，默认选择第一篇
        if (this.posts.length > 0) {
          this.selectPost(this.posts[0]);
        }
      } catch (error) {
        console.error('搜索文章失败:', error);
        this.posts = []; // 确保错误情况下posts也是一个空数组
      } finally {
        this.loading = false;
      }
    },
    resetSearch() {
      this.searchQuery = '';
      this.fetchPosts();
    },
    async selectPost(post) {
      this.selectedPost = post;
      this.selectedPostContent = null;
      
      try {
        const fullPost = await PostService.getPostBySlug(post.slug);
        this.selectedPostContent = fullPost.content;
      } catch (error) {
        console.error('获取文章内容失败:', error);
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    createNewPost() {
      this.editingPost = null;
      this.showEditor = true;
    },
    async editPost(post) {
      try {
        // 先获取完整的文章内容
        const fullPost = await PostService.getPostBySlug(post.slug);
        // 然后打开编辑器
        this.editingPost = fullPost;
        this.showEditor = true;
      } catch (error) {
        console.error('获取文章内容失败:', error);
        alert('获取文章内容失败，无法编辑');
      }
    },
    confirmDeletePost(post) {
      this.postToDelete = post;
      this.showDeleteConfirm = true;
    },
    cancelDelete() {
      this.postToDelete = null;
      this.showDeleteConfirm = false;
    },
    async deletePost() {
      if (!this.postToDelete) return;
      
      this.deleting = true;
      try {
        await PostService.deletePost(this.postToDelete.id);
        this.cancelDelete();
        
        // 刷新文章列表
        await this.fetchPosts();
      } catch (error) {
        console.error('删除文章失败:', error);
        alert('删除文章失败，请重试');
      } finally {
        this.deleting = false;
      }
    },
    closeEditor() {
      this.showEditor = false;
      this.editingPost = null;
    },
    handlePostSaved() {
      this.closeEditor();
      this.fetchPosts();
    },
  }
};
</script>

<style scoped>
.posts-page {
  min-height: 100vh;
}

.hero-banner {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hero-banner:before {
  content: "";
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  z-index: -1;
  background: 
    radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 40%);
}

@keyframes rotateSlow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: 1100px;
  margin: 0 auto;
}

.hero-text {
  text-align: center;
}

.hero-title {
  font-size: 2.2rem;
  margin-bottom: 12px;
  color: #1f2937;
  font-weight: 600;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

.search-box {
  display: flex;
  gap: 12px;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}


/* 优化的搜索框样式 */
.custom-input {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  padding: 0 20px;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.custom-input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.15);
}

.custom-input, .custom-textarea {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  color: var(--dark-color);
  transition: all 0.3s ease;
  width: 100%;
  font-size: 1rem;
}

.custom-input:focus, .custom-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  background: rgba(255, 255, 255, 0.85);
}

.search-button {
  min-width: 100px;
  height: 48px;
  border-radius: 24px;
  background-color: #7c3aed;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
}

.search-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(124, 58, 237, 0.3);
}

.search-button:active {
  transform: translateY(0);
}

.create-button {
  min-width: 120px;
  height: 48px;
  border-radius: 24px;
  background-color: #10b981;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
}

.create-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
}

.create-button:active {
  transform: translateY(0);
}

/* 响应式调整 */
@media (min-width: 992px) {
  .hero-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .hero-text {
    text-align: left;
    flex-basis: 42%;
  }
  
  .search-box {
    flex-basis: 58%;
    margin: 0;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    padding: 30px 25px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
}

@media (max-width: 576px) {
  .hero-banner {
    padding: 25px 20px;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .search-button,
  .create-button {
    min-width: 48px;
    width: 48px;
    padding: 0;
  }
  
  .search-text,
  .create-text {
    display: none;
  }
  
  .search-box {
    gap: 8px;
  }
  
  .custom-input {
    height: 45px;
    padding: 0 15px;
  }
}

.container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-content {
  padding: 20px 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}

.spinner {
  width: 4rem;
  height: 4rem;
  border: 0.25rem solid rgba(124, 58, 237, 0.3);
  border-radius: 50%;
  border-top-color: #7c3aed;
  animation: spin 1.2s linear infinite, pulse 2s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.4));
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  color: #7c3aed;
}

.empty-state p {
  font-size: 18px;
  color: #4b5563;
  margin-bottom: 10px;
}

.sub-text {
  font-size: 14px;
  color: #6b7280;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transition: left 0.7s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(99, 102, 241, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.posts-layout {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(0, 4fr); /* 减小左侧宽度 */
  gap: 30px;
  min-height: 600px;
}

.posts-sidebar {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
  padding: 0; /* 确保没有内边距 */
}

.sidebar-header {
  display: flex;
  justify-content: center; /* 居中标题 */
  align-items: center;
  padding: 15px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
  color: #1f2937;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem; /* 减小字体大小 */
  font-weight: 600; /* 减轻字体粗细 */
}

.posts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* 移除内边距 */
}

.posts-list::-webkit-scrollbar {
  width: 6px;
}

.posts-list::-webkit-scrollbar-track {
  background: rgba(243, 244, 246, 0.5);
  border-radius: 3px;
}

.posts-list::-webkit-scrollbar-thumb {
  background: rgba(124, 58, 237, 0.3);
  border-radius: 3px;
}

.posts-list::-webkit-scrollbar-thumb:hover {
  background: rgba(124, 58, 237, 0.5);
}

/* 纯文本列表样式优化 */
.category-group {
  margin-bottom: 4px; /* 增加分类组之间的间距 */
}

.category-group .category-articles {
  margin-bottom: 10px; /* 为分类下的文章列表增加底部间距 */
}

.category-title {
  padding: 10px 15px; /* 调整内边距 */
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  user-select: none;
  display: block; /* 改为block以确保覆盖整行 */
  border-bottom: 1px solid rgba(229, 231, 235, 0.4);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background-color: rgba(249, 250, 251, 0.5);
  width: 100%; /* 确保宽度100% */
  box-sizing: border-box;
  margin: 0; /* 移除所有外边距 */
  position: relative; /* 用于定位图标 */
  padding-left: 30px; /* 为图标留出空间 */
}

.category-title:hover {
  background-color: rgba(243, 244, 246, 0.6);
  color: #6d28d9;
}

.category-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  line-height: 14px;
  text-align: center;
  transition: transform 0.2s ease;
  color: #7c3aed;
  font-size: 0.8rem;
}

.category-icon.expanded {
  transform: translateY(-50%) rotate(90deg);
}

.category-articles {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
  width: 100%; /* 保证宽度100% */
  border-left: none; /* 移除所有边框 */
  margin-left: 0; /* 移除所有边距 */
}

/* 根级文章样式 */
.root-articles {
  padding-left: 0;
  border-left: none;
  margin-left: 0;
  width: 100%;
}

/* 子目录文章添加圆点标记和缩进 */
.category-articles:not(.root-articles) .article-item {
  padding-left: 20px; /* 给子目录文章增加左侧缩进 */
  position: relative; /* 定位伪元素 */
  border-left: none; /* 移除左边框 */
}

/* 为子目录中的文章增加小圆点图标 */
.category-articles:not(.root-articles) .article-item::before {
  position: absolute;
  left: 8px; /* 圆点的位置 */
  color: #9ca3af;
}

/* 根级文章缩进 */
.root-articles .article-item {
  padding-left: 15px; /* 根级文章添加适当的缩进 */
  border-left: none; /* 移除左边框 */
}


.article-item {
  padding: 8px 12px; /* 基本内边距 */
  padding-right: 0; /* 移除右内边距 */
  transition: all 0.2s ease;
  cursor: pointer;
  display: block; 
  position: relative;
  border-left: none; /* 默认无边框 */
  width: 100%; /* 确保宽度占满整行 */
  box-sizing: border-box;
  font-size: 0.9rem;
  font-weight: 400;
  color: #6b7280;
  word-break: break-word;
  line-height: 1.3;
  margin: 0; /* 移除所有外边距 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-item:hover {
  background-color: rgba(243, 244, 246, 0.8);
  color: #4b5563;
}

.article-item.active {
  background-color: rgba(139, 92, 246, 0.08);
  color: #6d28d9;
  font-weight: 500;
  
}

.post-content-area {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
}

.post-content-area::before {
  content: "";
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  z-index: -1;
  background: 
    radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 40%);
}

.post-header {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
  width: 100%;
}

.post-info {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.post-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  min-width: 120px;
}

.post-author, .post-date {
  font-size: 0.9rem;
  color: #4b5563;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.post-tag {
  display: inline-block;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
  color: #7c3aed;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 100px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.post-description {
  font-size: 1rem;
  color: #4b5563;
  font-style: italic;
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: rgba(243, 244, 246, 0.7);
  border-radius: 8px;
  border-left: 3px solid #7c3aed;
}

.post-content {
  flex: 1;
  overflow-y: auto;
  line-height: 1.6;
  max-height: 70vh;
  padding-right: 15px;
}

.post-content::-webkit-scrollbar {
  width: 6px;
}

.post-content::-webkit-scrollbar-track {
  background: rgba(243, 244, 246, 0.5);
  border-radius: 3px;
}

.post-content::-webkit-scrollbar-thumb {
  background: rgba(124, 58, 237, 0.3);
  border-radius: 3px;
}

.post-content::-webkit-scrollbar-thumb:hover {
  background: rgba(124, 58, 237, 0.5);
}

.select-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6b7280;
}

.arrow-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  animation: pulse 1.5s infinite alternate;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .posts-layout {
    grid-template-columns: 1fr;
  }
  
  .posts-sidebar {
    margin-bottom: 20px;
    max-height: 300px;
  }
  
  .post-content-area {
    min-height: 400px;
    padding: 1.5rem;
  }
  
  .editor-modal {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .post-actions {
    margin-top: 15px;
  }
  
  .post-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .hero-banner {
    padding: 1.5rem;
    margin-top: 15px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .search-box {
    width: 100%;
    max-width: none;
  }
  
  .btn-create {
    width: 100%;
    justify-content: center;
  }
  
  .delete-confirm-modal {
    width: 90%;
  }
  
  .post-content-area {
    padding: 1rem;
  }
}

@media (max-width: 576px) {
  .post-content-area {
    padding: 1rem;
  }
  
  .post-content {
    font-size: 0.95rem;
  }
  
  .hero-banner {
    border-radius: 12px;
    padding: 1.25rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
}

/* Modal 样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 1;
  max-width: 90%;
  max-height: 90vh;
}

.delete-confirm-modal {
  width: 450px;
}

.editor-modal {
  width: 90%;
  max-width: 1400px;
}

.modal-header {
  background: linear-gradient(135deg, #4c1d95 0%, #2563eb 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
}

.warning-icon {
  font-size: 48px;
  color: #f59e0b;
  margin-bottom: 15px;
}

.delete-confirm-content {
  text-align: center;
  margin-bottom: 20px;
}

.warning-text {
  color: #ef4444;
  font-weight: 500;
  margin-top: 10px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.btn-secondary {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(107, 114, 128, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(220, 38, 38, 0.4);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.loading-content .spinner {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

/* 添加新建文章按钮样式 */
.btn-create {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.95rem;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
  white-space: nowrap;
  margin-top: 0;
}

.btn-create:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4);
}
</style> 