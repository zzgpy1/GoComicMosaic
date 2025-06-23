<template>
  <div class="markdown-theme-selector">
    <div class="theme-selector-container">
      <span class="theme-selector-title">选择主题风格：</span>
      <div class="theme-options">
        <div 
          v-for="theme in themes" 
          :key="theme.value"
          class="theme-option"
          :class="{ active: modelValue === theme.value }"
          @click="selectTheme(theme.value)"
        >
          {{ theme.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MarkdownThemeSelector',
  props: {
    modelValue: {
      type: String,
      default: 'github'
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      themes: [
        { label: 'GitHub', value: 'github' },
        { label: 'VSCode', value: 'vscode' },
        { label: '暗黑', value: 'dark' }
      ]
    };
  },
  methods: {
    selectTheme(theme) {
      this.$emit('update:modelValue', theme);
    }
  }
};
</script>

<style scoped>
.markdown-theme-selector {
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.theme-selector-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.theme-selector-title {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.theme-option {
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #fff;
  border: 1px solid #ddd;
  transition: all 0.2s ease;
}

.theme-option:hover {
  background-color: #f0f0f0;
  transform: translateY(-1px);
}

.theme-option.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

@media (max-width: 576px) {
  .theme-selector-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .theme-options {
    width: 100%;
  }
}
</style> 