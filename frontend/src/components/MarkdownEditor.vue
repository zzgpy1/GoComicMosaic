<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <button type="button" @click="insertText('# ')" title="标题1">
        <i class="fas fa-heading"></i>1
      </button>
      <button type="button" @click="insertText('## ')" title="标题2">
        <i class="fas fa-heading"></i>2
      </button>
      <button type="button" @click="insertText('### ')" title="标题3">
        <i class="fas fa-heading"></i>3
      </button>
      <span class="toolbar-divider"></span>
      <button type="button" @click="insertText('**', '**')" title="粗体">
        <i class="fas fa-bold"></i>
      </button>
      <button type="button" @click="insertText('*', '*')" title="斜体">
        <i class="fas fa-italic"></i>
      </button>
      <button type="button" @click="insertText('~~', '~~')" title="删除线">
        <i class="fas fa-strikethrough"></i>
      </button>
      <span class="toolbar-divider"></span>
      <button type="button" @click="insertText('[链接文本](https://example.com)')" title="链接">
        <i class="fas fa-link"></i>
      </button>
      <button type="button" @click="insertText('![图片描述](https://example.com/image.jpg)')" title="图片">
        <i class="fas fa-image"></i>
      </button>
      <span class="toolbar-divider"></span>
      <button type="button" @click="insertText('- ')" title="无序列表">
        <i class="fas fa-list-ul"></i>
      </button>
      <button type="button" @click="insertText('1. ')" title="有序列表">
        <i class="fas fa-list-ol"></i>
      </button>
      <span class="toolbar-divider"></span>
      <button type="button" @click="insertText('> ')" title="引用">
        <i class="fas fa-quote-right"></i>
      </button>
      <button type="button" @click="insertText('```\n', '\n```')" title="代码块">
        <i class="fas fa-code"></i>
      </button>
      <button type="button" @click="insertText('---\n')" title="分隔线">
        <i class="fas fa-minus"></i>
      </button>
      <button type="button" @click="insertText('| 表头1 | 表头2 |\n| ------ | ------ |\n| 单元格1 | 单元格2 |')" title="表格">
        <i class="fas fa-table"></i>
      </button>
    </div>
    
    <div class="editor-container">
      <div class="editor-wrapper">
        <textarea
          ref="textarea"
          :value="modelValue"
          @input="updateValue"
          class="markdown-textarea"
          :placeholder="placeholder"
        ></textarea>
      </div>
      
      <div v-if="showPreview" class="preview-wrapper">
        <div class="preview-header">预览</div>
        <div class="markdown-preview" v-html="renderedContent"></div>
      </div>
    </div>
    
    <div class="editor-footer">
      <button type="button" class="toggle-preview-btn" @click="togglePreview">
        <i :class="showPreview ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        {{ showPreview ? '隐藏预览' : '显示预览' }}
      </button>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default {
  name: 'MarkdownEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '使用 Markdown 编写内容...'
    }
  },
  data() {
    return {
      showPreview: true
    };
  },
  computed: {
    renderedContent() {
      if (!this.modelValue) return '';
      const rawHtml = marked(this.modelValue);
      return DOMPurify.sanitize(rawHtml);
    }
  },
  methods: {
    updateValue(e) {
      this.$emit('update:modelValue', e.target.value);
    },
    insertText(before, after = '') {
      const textarea = this.$refs.textarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);
      
      const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
      
      // 更新值
      this.$emit('update:modelValue', newText);
      
      // 重新设置光标位置
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      });
    },
    togglePreview() {
      this.showPreview = !this.showPreview;
    }
  }
};
</script>

<style scoped src="@/styles/MarkdownEditor.css"></style>