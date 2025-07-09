<template>
  <div class="sticker-manager">
    
    <!-- 贴纸上传区域 -->
    <div class="sticker-upload-area">
      <div 
        class="sticker-dropzone" 
        :class="{'active-dropzone': isDragging}"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="dropzone-content">
          <i class="bi bi-cloud-arrow-up-fill dropzone-icon"></i>
          <p>拖拽贴纸图片到此处，或</p>
          <label for="sticker-upload" class="btn-custom btn-outline file-upload-btn">
            <i class="bi bi-image me-2"></i><span class="file-btn-text">选择文件</span>
          </label>
          <input 
            type="file" 
            id="sticker-upload" 
            @change="handleFileChange" 
            multiple 
            accept="image/*" 
            class="d-none"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue'
import axios from 'axios'
import { getImageUrl } from '@/utils/imageUtils'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// 本地贴纸数组
const stickers = ref([])

// 拖放相关状态
const isDragging = ref(false)

// 上传相关状态
const uploading = ref(false)

// 初始化组件
onMounted(() => {
  // 从props复制贴纸数组
  if (props.modelValue && Array.isArray(props.modelValue)) {
    stickers.value = [...props.modelValue]
  }
})

// 处理文件拖放
const handleDrop = (event) => {
  isDragging.value = false
  const files = [...event.dataTransfer.files].filter(
    file => /image\/(png|jpeg|jpg|gif|webp)/.test(file.type)
  )
  
  if (files.length > 0) {
    uploadStickerFiles(files)
  }
}

// 处理文件选择
const handleFileChange = (event) => {
  const files = [...event.target.files].filter(
    file => /image\/(png|jpeg|jpg|gif|webp)/.test(file.type)
  )
  
  if (files.length > 0) {
    uploadStickerFiles(files)
  }
}

// 上传贴纸图片
const uploadStickerFiles = async (files) => {
  if (uploading.value) return
  
  uploading.value = true
  
  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      
      // 使用和资源图片相同的上传接口
      const response = await axios.post('/api/resources/upload-images/', formData)
      
      // 添加新贴纸
      const newSticker = {
        id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: response.data.filename, // 这个路径是临时路径，将在资源保存时移动到正确的位置
        position: { x: 50, y: 50 }, // 默认位置在中心
        rotation: 0, // 默认不旋转
        scale: 1 // 默认缩放比例
      }
      
      stickers.value.push(newSticker)
      
      // 更新父组件的值
      emit('update:modelValue', stickers.value)
    }
    
    // 清除选择的文件
    document.getElementById('sticker-upload').value = ''
  } catch (error) {
    console.error('上传贴纸失败:', error)
    alert('贴纸上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

// 获取贴纸URL
const getStickerUrl = (url) => {
  return getImageUrl(url)
}

// 移除贴纸
const removeSticker = (index) => {
  stickers.value.splice(index, 1)
  emit('update:modelValue', stickers.value)
}
</script>

<style scoped src="@/styles/StickerManager.css"></style>