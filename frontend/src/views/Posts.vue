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
          <button @click="searchPosts" class="btn btn-primary">
            <i class="bi bi-search"></i> <span class="search-text">搜索</span>
          </button>
          <button v-if="isAdmin" class="btn btn-success" @click="createNewPost">
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
      
      <div v-else class="posts-layout" :class="{'sidebar-collapsed': !sidebarExpanded}">
        <!-- 添加鼠标悬停触发区域 -->
        <div class="sidebar-hover-area"></div>
        
        <!-- 左侧文章导航栏 -->
        <div class="posts-sidebar" :class="{'collapsed': !sidebarExpanded}">
          <div class="sidebar-header">
            <h3>文章目录</h3>
            <button class="toggle-sidebar-btn" @click="toggleSidebar">
              <i :class="['bi', sidebarExpanded ? (isMobileView ? 'bi-chevron-up' : 'bi-chevron-left') : (isMobileView ? 'bi-chevron-down' : 'bi-chevron-right')]"></i>
            </button>
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
              <h2 class="post-title">
                {{ selectedPost.title }}
              </h2>
              
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
                <div v-if="isAdmin" class="post-actions admin-actions">
                  <button class="btn btn-sm btn-primary" @click="editPost(selectedPost)">
                    <i class="bi bi-pencil"></i> 编辑
                  </button>
                  <button class="btn btn-sm btn-danger" @click="confirmDeletePost(selectedPost)">
                    <i class="bi bi-trash"></i> 删除
                  </button>
                  <button class="btn btn-sm btn-info" @click="sharePost" title="分享文章">
                    <i class="bi bi-share"></i> 分享
                  </button>
                </div>
                <div v-else class="post-actions single-action">
                  <button class="btn btn-sm btn-info" @click="sharePost" title="分享文章">
                    <i class="bi bi-share"></i> 分享
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

    <!-- 分享对话框 -->
    <div class="modal" v-if="showShareDialog">
      <div class="modal-overlay" @click="closeShareDialog"></div>
      <div class="modal-container share-dialog">
        <div class="share-header">
          <h2><i class="bi bi-share" style="opacity: 0.9; margin-right: 6px;"></i> 分享文章</h2>
          <button class="close-btn" @click="closeShareDialog">
            ×
          </button>
        </div>
        <div class="share-body">
          <div class="share-content">
            <p>您可以通过以下链接分享这篇文章：</p>
            <input 
              type="text" 
              v-model="shareLink"
              readonly
              @click="$event.target.select()"
            >
            <button class="copy-btn" @click="copyShareLink">
              <i class="bi bi-clipboard"></i> 复制链接
            </button>
          </div>
          <div v-if="shareSuccess" class="share-success">
            <p>链接已成功复制到剪贴板！</p>
          </div>
        </div>
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
  props: {
    // 添加 slug 属性，用于从 URL 参数接收文章 slug
    slug: {
      type: String,
      default: null
    }
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
      },
      sidebarExpanded: true, // 默认展开侧边栏
      isMobileView: false, // 是否是移动端视图
      showShareDialog: false, // 分享对话框显示状态
      shareLink: '', // 分享链接
      shareSuccess: false, // 分享成功状态
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
    this.checkMobileView(); // 检查是否为移动端视图
    window.addEventListener('resize', this.checkMobileView);
  },
  mounted() {
    // 确保初始渲染后应用正确的侧边栏状态
    this.$nextTick(() => {
      // 根据屏幕大小决定默认的侧边栏状态
      this.checkMobileView(); // 先检查设备类型
      
      // 重置并应用合适的样式
      this.resetSidebarStyles();
    });
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobileView);
  },
  methods: {
    // 重置侧边栏样式
    resetSidebarStyles() {
      const sidebar = document.querySelector('.posts-sidebar');
      if (sidebar) {
        // 完全移除所有内联样式
        sidebar.removeAttribute('style');
        
        // 根据当前视图类型重新设置样式
        if (this.isMobileView) {
          requestAnimationFrame(() => {
            if (this.sidebarExpanded) {
              sidebar.style.maxHeight = '300px';
              sidebar.style.minHeight = '50px';
            } else {
              sidebar.style.maxHeight = '50px';
              sidebar.style.minHeight = '50px';
            }
          });
        }
      }
    },
    
    // 检查是否为移动端视图
    checkMobileView() {
      const wasMobile = this.isMobileView;
      this.isMobileView = window.innerWidth <= 992;
      
      // 如果视图类型发生变化（从PC到移动或从移动到PC），重新设置侧边栏状态
      if (wasMobile !== this.isMobileView) {
        if (this.isMobileView) {
          // 切换到移动端时，折叠侧边栏
          this.sidebarExpanded = false;
        } else {
          // 切换到PC端时，展开侧边栏
          this.sidebarExpanded = true;
        }
        
        // 完全重置样式，确保干净的状态
        this.resetSidebarStyles();
      }
    },
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
        
        // 如果有 URL 参数指定的 slug，则加载对应文章
        if (this.slug) {
          await this.loadPostBySlug(this.slug);
        } else if (this.posts.length > 0) {
          // 否则如果有文章，默认选择第一篇
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
    toggleSidebar() {
      this.sidebarExpanded = !this.sidebarExpanded;
      
      // 使用公共方法重置和应用正确的样式
      this.resetSidebarStyles();
    },
    // 通过 slug 加载文章
    async loadPostBySlug(slug) {
      try {
        const post = await PostService.getPostBySlug(slug);
        this.selectedPost = post;
        this.selectedPostContent = post.content;
        
        // 更新浏览器标题
        document.title = `${post.title} - 文章详情`;
        
        // 如果在移动设备上，折叠侧边栏
        if (this.isMobileView) {
          this.sidebarExpanded = false;
          this.resetSidebarStyles();
        }
      } catch (error) {
        console.error('通过 slug 加载文章失败:', error);
        // 如果加载失败，重定向到文章列表页面
        if (this.$route.name === 'PostDetail') {
          this.$router.replace('/posts');
        }
      }
    },
    // 分享当前文章
    sharePost() {
      if (!this.selectedPost) return;
      
      const shareUrl = `${window.location.origin}/posts/${this.selectedPost.slug}`;
      this.shareLink = shareUrl;
      this.showShareDialog = true;
      this.shareSuccess = false;
    },
    
    // 复制分享链接到剪贴板
    copyShareLink() {
      navigator.clipboard.writeText(this.shareLink)
        .then(() => {
          this.shareSuccess = true;
          setTimeout(() => {
            this.showShareDialog = false;
            this.shareSuccess = false;
          }, 2000);
        })
        .catch(err => {
          console.error('复制链接失败:', err);
          alert('复制链接失败，请手动复制');
        });
    },
    
    // 关闭分享对话框
    closeShareDialog() {
      this.showShareDialog = false;
    },
  },
  watch: {
    // 监听 slug 变化，加载对应文章
    slug(newSlug) {
      if (newSlug) {
        this.loadPostBySlug(newSlug);
      }
    },
    // 监听路由变化，更新 URL
    '$route'(to) {
      // 如果是从文章详情页面切换到文章列表页面，且有选中文章，则更新 URL
      if (to.name === 'Posts' && this.selectedPost) {
        document.title = '文章列表';
      }
    },
    // 监听选中文章变化，更新 URL
    selectedPost(newPost) {
      if (newPost && this.$route.name === 'Posts') {
        // 如果在文章列表页面选择了文章，更新 URL 但不触发路由变化
        window.history.replaceState(
          null, 
          null, 
          `/posts/${newPost.slug}`
        );
        // 更新浏览器标题
        document.title = `${newPost.title} - 文章详情`;
      }
    }
  },
};
</script>

<style scoped src="@/styles/Posts.css"></style>