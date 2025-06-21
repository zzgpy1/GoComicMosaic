<template>
  <div class="lazy-image-container" :class="{ 'is-loaded': isLoaded }">
    <!-- 加载中占位符 -->
    <div v-show="!isLoaded" class="image-placeholder">
      <div class="loading-spinner"></div>
    </div>
    <!-- 实际图片 -->
    <img
      :src="src"
      :alt="alt"
      class="lazy-image"
      @load="onImageLoaded"
      @error="onImageError"
      :style="{ opacity: isLoaded ? 1 : 0 }"
    />
    <!-- 错误占位符 -->
    <div v-if="hasError" class="image-error">
      <i class="bi bi-exclamation-triangle"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isLoaded: false,
      hasError: false
    };
  },
  methods: {
    onImageLoaded() {
      this.isLoaded = true;
      this.$emit('loaded');
    },
    onImageError() {
      this.hasError = true;
      this.$emit('error');
    }
  }
};
</script>

<style scoped src="@/styles/LazyImage.css"></style>