<template>
  <div class="post-editor">
    <div class="editor-header">
      <h2>{{ isNewPost ? '创建新文章' : '编辑文章' }}</h2>
    </div>
    
    <div class="editor-body">
      <form @submit.prevent="savePost" class="editor-form">
        <div class="form-group">
          <label for="title">标题</label>
          <input 
            type="text" 
            id="title" 
            v-model="post.title" 
            class="form-control" 
            required
          />
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label for="author">作者</label>
            <input 
              type="text" 
              id="author" 
              v-model="post.author" 
              class="form-control"
            />
          </div>
          
          <div class="form-group half">
            <label for="tags">标签 (用逗号分隔)</label>
            <input 
              type="text" 
              id="tags" 
              v-model="tagsInput" 
              class="form-control"
              placeholder="标签1, 标签2, 标签3"
            />
          </div>
        </div>
        
        <div class="form-group">
          <div class="file-name-settings">
            <label class="toggle-label">
              <input type="checkbox" v-model="useCustomFileName" />
              <span class="toggle-switch"></span>
              <span class="toggle-text">自定义文件名</span>
            </label>
            
            <div v-if="useCustomFileName" class="custom-file-name">
              <input 
                type="text" 
                v-model="customFileName" 
                class="form-control" 
                placeholder="输入自定义文件名（不含扩展名）"
              />
              <small class="form-text text-muted">文件将保存为 "{{ customFileName }}.md"</small>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="content">内容 (Markdown格式)</label>
          <div class="editor-toolbar">
            <button type="button" @click="insertMarkdown('bold')" title="粗体" class="toolbar-btn">
              B
            </button>
            <button type="button" @click="insertMarkdown('italic')" title="斜体" class="toolbar-btn">
              I
            </button>
            <button type="button" @click="insertMarkdown('heading')" title="标题" class="toolbar-btn">
              H
            </button>
            <button type="button" @click="insertMarkdown('link')" title="链接" class="toolbar-btn">
              🔗
            </button>
            <button type="button" @click="insertMarkdown('image')" title="图片" class="toolbar-btn">
              🖼️
            </button>
            <button type="button" @click="insertMarkdown('list')" title="列表" class="toolbar-btn">
              • • •
            </button>
            <button type="button" @click="insertMarkdown('quote')" title="引用" class="toolbar-btn">
              ""
            </button>
            <button type="button" @click="insertMarkdown('code')" title="代码" class="toolbar-btn">
              &lt;/&gt;
            </button>
            <label for="image-upload" title="上传图片" class="toolbar-btn" :class="{uploading: uploading && uploadType === 'image'}">
              📷
              <div class="upload-spinner" v-if="uploading && uploadType === 'image'"></div>
              <input 
                type="file" 
                id="image-upload" 
                class="file-input" 
                accept="image/*"
                @change="uploadImage"
              />
            </label>
            <label for="file-upload" title="上传附件" class="toolbar-btn" :class="{uploading: uploading && uploadType === 'file'}">
              📎
              <div class="upload-spinner" v-if="uploading && uploadType === 'file'"></div>
              <input 
                type="file" 
                id="file-upload" 
                class="file-input" 
                @change="uploadFile"
              />
            </label>
          </div>
          <textarea 
            id="content" 
            v-model="post.content" 
            class="form-control content-editor" 
            rows="15"
            required
            ref="contentEditor"
          ></textarea>
        </div>
        
        <div class="form-group status-toggle">
          <label class="toggle-label">
            <input type="checkbox" v-model="post.is_published" />
            <span class="toggle-switch"></span>
            <span class="toggle-text">{{ post.is_published ? '发布' : '草稿' }}</span>
          </label>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="togglePreview">
            {{ showPreview ? '隐藏预览' : '显示预览' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving">保存中...</span>
            <span v-else>保存文章</span>
          </button>
        </div>
      </form>
      
      <div class="preview-section" v-if="showPreview">
        <h3>预览</h3>
        <div class="markdown-preview" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import PostService from '../services/PostService';

export default {
  name: 'PostEditor',
  props: {
    postToEdit: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      post: {
        id: '',
        title: '',
        content: '',
        author: '',
        is_markdown: true,
        tags: [],
        is_published: true
      },
      tagsInput: '',
      saving: false,
      showPreview: false,
      useCustomFileName: false,
      customFileName: '',
      uploading: false,
      uploadType: '' // 'image' 或 'file'
    };
  },
  computed: {
    isNewPost() {
      return !this.post.id;
    },
    renderedContent() {
      if (!this.post.content) return '';
      const rawHtml = marked(this.post.content);
      return DOMPurify.sanitize(rawHtml);
    }
  },
  created() {
    if (this.postToEdit) {
      this.post = { ...this.postToEdit };
      this.tagsInput = this.post.tags.join(', ');
      
      // 如果是编辑现有文章，检查路径是否为自定义
      if (this.post.path) {
        console.log('编辑文章, 文件路径:', this.post.path);
        // 使用路径作为自定义文件名
        this.customFileName = this.post.path;
        
        // 检查是否使用自定义文件名
        if (this.post.path !== `${this.post.slug}.md`) {
          console.log('检测到自定义文件名');
          this.useCustomFileName = true;
        } else {
          console.log('使用默认文件名');
          this.useCustomFileName = false;
        }
      } else if (this.post.slug) {
        // 没有path但有slug时的处理
        console.log('文章没有path属性，使用slug:', this.post.slug);
        this.customFileName = `${this.post.slug}.md`;
        this.useCustomFileName = false;
      }
    } else {
      // 创建新文章时设置默认标题
      const currentDate = new Date().toLocaleDateString('zh-CN');
      this.post.title = `默认标题`; // 设置默认标题
      // 生成slug，使用默认标题
      this.post.slug = this.generateSlug(this.post.title);
    }
  },
  methods: {
    // 生成slug的辅助函数
    generateSlug(title) {
      if (!title || title.trim() === '') {
        // 如果标题为空，生成一个带时间戳的默认slug
        return `post-${Date.now().toString(36)}`;
      }
      
      try {
        // 对于中文标题，直接返回原标题作为slug
        // 如果包含中文字符
        if (/[\u4e00-\u9fa5]/.test(title)) {
          // 移除不能作为文件名的字符
          let slug = title.replace(/[\\/:*?"<>|]/g, '-');
          // 删除开头和结尾的连字符或空格
          slug = slug.replace(/^-+|-+$|\s+$|\s+^/g, '');
          return slug || `post-${Date.now().toString(36)}`;
        }
        
        // 非中文标题使用原来的转换逻辑
        // 将标题转换为小写
        let slug = title.toLowerCase();
        // 替换非字母数字字符为连字符
        slug = slug.replace(/[^a-z0-9]+/g, '-');
        // 删除开头和结尾的连字符
        slug = slug.replace(/^-+|-+$/g, '');
        
        // 确保结果不为空
        if (!slug || slug === '-') {
          return `post-${Date.now().toString(36)}`;
        }
        
        return slug;
      } catch (e) {
        console.error('生成slug时出错:', e);
        return `post-${Date.now().toString(36)}`;
      }
    },
    // 格式化日期为YYYY-MM-DD格式
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    async savePost() {
      // 处理标签
      this.post.tags = this.tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      // 确保标题不为空
      if (!this.post.title.trim()) {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        this.post.title = `默认标题`;
      }
      
      // 确保有slug
      if (!this.post.slug || this.post.slug.trim() === '') {
        this.post.slug = this.generateSlug(this.post.title);
      }
      
      // 设置文件路径
      if (this.useCustomFileName && this.customFileName && this.customFileName.trim() !== '') {
        // 使用自定义文件名，确保添加扩展名
        let fileName = this.customFileName.trim();
        if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
          fileName = `${fileName}.md`;
        }
        // 设置为自定义文件路径
        this.post.path = fileName;
        console.log('使用自定义文件名:', fileName);
      } else {
        // 默认使用slug作为文件名
        const fileName = `${this.post.slug}.md`;
        this.post.path = fileName;
        console.log('使用默认文件名:', fileName);
      }
      
      this.saving = true;
      try {
        console.log('准备保存文章:', this.post);
        if (this.post.id) {
          // 更新现有文章
          await PostService.updatePost(this.post.id, this.post);
        } else {
          // 创建新文章
          await PostService.createPost(this.post);
        }
        
        // 通知父组件保存成功
        this.$emit('saved');
      } catch (error) {
        console.error('保存文章失败:', error);
        alert('保存文章失败，请重试');
      } finally {
        this.saving = false;
      }
    },
    togglePreview() {
      this.showPreview = !this.showPreview;
    },
    insertMarkdown(type) {
      const textarea = this.$refs.contentEditor;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = this.post.content;
      const selectedText = text.substring(start, end);
      
      let insertion = '';
      
      switch (type) {
        case 'bold':
          insertion = `**${selectedText || '粗体文本'}**`;
          break;
        case 'italic':
          insertion = `*${selectedText || '斜体文本'}*`;
          break;
        case 'heading':
          insertion = `\n## ${selectedText || '标题'}\n`;
          break;
        case 'link':
          insertion = `[${selectedText || '链接文本'}](https://example.com)`;
          break;
        case 'image':
          insertion = `![${selectedText || '图片描述'}](https://example.com/image.jpg)`;
          break;
        case 'list':
          insertion = `\n- ${selectedText || '列表项'}\n- 列表项\n- 列表项\n`;
          break;
        case 'quote':
          insertion = `\n> ${selectedText || '引用文本'}\n`;
          break;
        case 'code':
          insertion = `\n\`\`\`\n${selectedText || '代码块'}\n\`\`\`\n`;
          break;
      }
      
      // 插入markdown标记
      this.post.content = text.substring(0, start) + insertion + text.substring(end);
      
      // 更新光标位置
      this.$nextTick(() => {
        textarea.focus();
        const newPosition = start + insertion.length;
        textarea.setSelectionRange(newPosition, newPosition);
      });
    },
    uploadImage(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 设置上传状态
      this.uploading = true;
      this.uploadType = 'image';
      
      // 创建FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', this.post.title || 'default'); // 使用文章标题作为子目录
      
      // 调用API上传图片
      PostService.uploadImage(file, this.post.title)
        .then(response => {
          // 获取上传后的URL
          const imageUrl = response.url;
          
          // 在光标位置插入图片Markdown
          this.insertMarkdownAtCursor(`![${file.name}](${imageUrl})`);
        })
        .catch(error => {
          console.error('上传图片失败:', error);
          alert('上传图片失败，请重试');
        })
        .finally(() => {
          this.uploading = false;
          this.uploadType = '';
          // 清空文件输入框，允许重复上传相同文件
          document.getElementById('image-upload').value = "";
        });
    },
    uploadFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 设置上传状态
      this.uploading = true;
      this.uploadType = 'file';
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', this.post.title || 'default'); // 使用文章标题作为子目录
      
      // 调用API上传附件
      PostService.uploadFile(file, this.post.title)
        .then(response => {
          // 获取上传后的URL和原始文件名
          const fileUrl = response.url;
          const fileName = response.name;
          
          // 在光标位置插入附件链接Markdown
          this.insertMarkdownAtCursor(`[${fileName}](${fileUrl})`);
        })
        .catch(error => {
          console.error('上传附件失败:', error);
          alert('上传附件失败，请重试');
        })
        .finally(() => {
          this.uploading = false;
          this.uploadType = '';
          // 清空文件输入框，允许重复上传相同文件
          document.getElementById('file-upload').value = "";
        });
    },
    insertMarkdownAtCursor(markdown) {
      const textarea = this.$refs.contentEditor;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = this.post.content;
      
      // 插入markdown
      this.post.content = text.substring(0, start) + markdown + text.substring(end);
      
      // 更新光标位置
      this.$nextTick(() => {
        textarea.focus();
        const newPosition = start + markdown.length;
        textarea.setSelectionRange(newPosition, newPosition);
      });
    }
  }
};
</script>

<style scoped src="@/styles/PostEditor.css"></style>