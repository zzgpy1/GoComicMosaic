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
      
      // 如果是编辑现有文章，提取文件名作为自定义文件名
      if (this.post.slug) {
        // 检查是否是日期格式开头
        const datePattern = /^\d{4}-\d{2}-\d{2}-/;
        if (datePattern.test(this.post.slug)) {
          // 如果是日期格式，提取标题部分
          const titlePart = this.post.slug.replace(datePattern, '');
          this.useCustomFileName = false;
          this.customFileName = titlePart;
        } else {
          // 不是日期格式，可能是自定义文件名
          this.useCustomFileName = true;
          this.customFileName = this.post.slug;
        }
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
      
      // 如果使用自定义文件名，则设置slug为自定义文件名
      if (this.useCustomFileName && this.customFileName && this.customFileName.trim() !== '') {
        this.post.slug = this.customFileName;
      } else {
        // 默认使用标题作为slug（不包含日期）
        this.post.slug = this.generateSlug(this.post.title);
      }
      
      // 最后确保slug不为空，如果依然为空，则使用随机字符串
      if (!this.post.slug || this.post.slug.trim() === '') {
        this.post.slug = `post-${Date.now().toString(36)}`;
      }
      
      this.saving = true;
      try {
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

<style scoped>
.post-editor {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px; 
  background: linear-gradient(to right, rgba(99, 102, 241, 0.03), rgba(124, 58, 237, 0.08));
}

.editor-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}


.editor-body {
  padding: 25px;
  display: flex;
  flex-direction: row;
  gap: 25px;
}

.editor-form {
  flex: 1;
  min-width: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group.half {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1f2937;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
}

.form-control:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

textarea.form-control {
  resize: vertical;
}

.content-editor {
  font-family: monospace;
  min-height: 300px;
  line-height: 1.6;
  height: calc(80vh - 300px);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  padding: 12px 15px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  position: sticky;
  top: 0;
  z-index: 5;
  backdrop-filter: blur(4px);
}

.editor-toolbar button, .editor-toolbar label {
  background: white;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 6px;
  padding: 10px 14px;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s ease;
  min-width: 40px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.editor-toolbar button:hover, .editor-toolbar label:hover {
  background-color: #f3f4f6;
  border-color: #7c3aed;
  color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.15);
}

.editor-toolbar .upload-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid rgba(124, 58, 237, 0.3);
  border-radius: 50%;
  border-top-color: #7c3aed;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.editor-toolbar button.uploading, .editor-toolbar label.uploading {
  color: transparent;
  pointer-events: none;
}

.file-input {
  display: none;
}

.toolbar-btn {
  font-family: Arial, sans-serif;
  font-size: 15px;
}

.status-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.toggle-label input {
  display: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background-color: #ccc;
  border-radius: 12px;
  margin-right: 10px;
  transition: background-color 0.3s;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-label input:checked + .toggle-switch {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
}

.toggle-label input:checked + .toggle-switch::after {
  transform: translateX(26px);
}

.toggle-text {
  font-weight: 600;
  color: #4b5563;
}

.preview-section {
  flex: 1;
  min-width: 0;
  max-height: 80vh;
  overflow-y: auto;
  position: sticky;
  top: 25px;
  padding: 0;
  border: none;
  border-radius: 12px;
}

.preview-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1f2937;
  font-weight: 700;
  position: sticky;
  top: 0;
  background: white;
  padding: 10px 0;
  z-index: 10;
  border-bottom: 2px solid rgba(124, 58, 237, 0.1);
}

.markdown-preview {
  padding: 20px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  background-color: rgba(249, 250, 251, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 400px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: #1f2937;
}

.markdown-preview :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-preview :deep(a) {
  color: #7c3aed;
  text-decoration: none;
  border-bottom: 1px dashed #7c3aed;
  transition: all 0.3s ease;
}

.markdown-preview :deep(a:hover) {
  color: #6d28d9;
  border-bottom: 1px solid #6d28d9;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #7c3aed;
  padding-left: 15px;
  margin-left: 0;
  color: #4b5563;
  font-style: italic;
}

.markdown-preview :deep(code) {
  background-color: #f3f4f6;
  padding: 2px 5px;
  border-radius: 4px;
  font-family: monospace;
}

.markdown-preview :deep(pre) {
  background-color: #f3f4f6;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 15px 0;
}

.markdown-preview :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
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

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 992px) {
  .editor-body {
    flex-direction: column;
  }
  
  .preview-section {
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid rgba(124, 58, 237, 0.2);
    max-height: none;
    position: static;
  }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .editor-body {
    padding: 15px;
  }
  
  .editor-toolbar {
    padding: 5px;
  }
  
  .editor-toolbar button {
    padding: 6px 10px;
    min-width: 30px;
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .form-actions {
    flex-direction: column-reverse;
    gap: 10px;
  }
  
  .btn {
    width: 100%;
  }
}

.file-name-settings {
  margin-bottom: 15px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
}

.custom-file-name {
  margin-top: 15px;
  animation: fadeIn 0.3s ease;
}

.auto-file-name {
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  font-style: italic;
}

.form-text {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 5px;
}

.text-muted {
  color: #6b7280;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 