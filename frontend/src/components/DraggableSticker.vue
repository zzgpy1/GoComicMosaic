<template>
  <div 
    class="draggable-sticker" 
    :style="stickerStyle"
    ref="stickerRef"
  >
    <div class="sticker-wrapper" :style="wrapperStyle">
      <img 
        :src="imageUrl" 
        :alt="alt" 
        class="sticker-image" 
        @mousedown.stop="startDrag"
        @touchstart.stop="startDrag"
      >
      <!-- 旋转控制点 -->
      <div 
        class="rotate-handle"
        @mousedown.stop="startRotate"
        @touchstart.stop="startRotate"
      >
        <i class="bi bi-arrow-clockwise"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
import { getImageUrl } from '@/utils/imageUtils'

const props = defineProps({
  sticker: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:sticker', 'mounted'])

const stickerRef = ref(null)
const isDragging = ref(false)
const isRotating = ref(false)
const startX = ref(0)
const startY = ref(0)
const startAngle = ref(0)

// 组件挂载时触发 mounted 事件
onMounted(() => {
  console.log('贴纸组件已挂载:', props.sticker)
  emit('mounted')
})

// 贴纸样式
const stickerStyle = computed(() => {
  return {
    left: `${props.sticker.position.x}%`,
    top: `${props.sticker.position.y}%`,
    transform: `translate(-50%, -50%)`,
    zIndex: props.editable ? 1000 : 10
  }
})

// 包装器样式
const wrapperStyle = computed(() => {
  return {
    transform: `rotate(${props.sticker.rotation}deg) scale(${props.sticker.scale})`,
    cursor: 'move'
  }
})

// 处理贴纸图片URL
const imageUrl = computed(() => {
  return getImageUrl(props.sticker.url)
})

// 贴纸替代文本
const alt = computed(() => `贴纸 ${props.sticker.id}`)

// 开始拖动
const startDrag = (event) => {
  // 移除对 editable 属性的判断，允许在任何模式下都可以拖拽
  // if (!props.editable) return
  
  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()
  
  isDragging.value = true
  
  // 记录起始位置
  if (event.type === 'mousedown') {
    startX.value = event.clientX
    startY.value = event.clientY
  } else if (event.type === 'touchstart') {
    startX.value = event.touches[0].clientX
    startY.value = event.touches[0].clientY
  }
  
  // 添加事件监听器
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchend', endDrag)
}

// 处理拖动
const handleDrag = (event) => {
  if (!isDragging.value) return
  
  event.preventDefault()
  
  let currentX, currentY
  
  if (event.type === 'mousemove') {
    currentX = event.clientX
    currentY = event.clientY
  } else if (event.type === 'touchmove') {
    currentX = event.touches[0].clientX
    currentY = event.touches[0].clientY
  }
  
  // 获取页面的实际内容区域
  const contentArea = document.querySelector('.resource-detail')
  if (!contentArea) return
  
  const contentRect = contentArea.getBoundingClientRect()
  
  // 计算页面的实际尺寸（包括滚动部分）
  const contentWidth = contentArea.scrollWidth || contentRect.width
  const contentHeight = contentArea.scrollHeight || contentRect.height
  
  // 计算鼠标/触摸点相对于页面的位置（考虑滚动）
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  
  // 计算移动的百分比（相对于页面尺寸）
  const deltaXPercent = ((currentX - startX.value) / contentWidth) * 100
  const deltaYPercent = ((currentY - startY.value) / contentHeight) * 100
  
  // 更新贴纸位置
  const newX = props.sticker.position.x + deltaXPercent
  const newY = props.sticker.position.y + deltaYPercent
  
  // 更新状态
  updateStickerPosition(newX, newY)
  
  // 更新起始位置
  startX.value = currentX
  startY.value = currentY
}

// 结束拖动
const endDrag = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 移除事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchend', endDrag)
}

// 开始旋转
const startRotate = (event) => {
  // 移除对 editable 属性的判断，允许在任何模式下都可以旋转
  // if (!props.editable) return
  
  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()
  
  isRotating.value = true
  
  // 获取贴纸元素的中心点
  const stickerRect = stickerRef.value.getBoundingClientRect()
  const centerX = stickerRect.left + stickerRect.width / 2
  const centerY = stickerRect.top + stickerRect.height / 2
  
  // 获取鼠标或触摸点相对于中心点的角度
  let clientX, clientY
  
  if (event.type === 'mousedown') {
    clientX = event.clientX
    clientY = event.clientY
  } else if (event.type === 'touchstart') {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  }
  
  startAngle.value = getAngle(centerX, centerY, clientX, clientY) - props.sticker.rotation
  
  // 添加事件监听器
  document.addEventListener('mousemove', handleRotate)
  document.addEventListener('touchmove', handleRotate, { passive: false })
  document.addEventListener('mouseup', endRotate)
  document.addEventListener('touchend', endRotate)
}

// 处理旋转
const handleRotate = (event) => {
  if (!isRotating.value) return
  
  event.preventDefault()
  
  // 获取贴纸元素的中心点
  const stickerRect = stickerRef.value.getBoundingClientRect()
  const centerX = stickerRect.left + stickerRect.width / 2
  const centerY = stickerRect.top + stickerRect.height / 2
  
  // 获取鼠标或触摸点相对于中心点的角度
  let clientX, clientY
  
  if (event.type === 'mousemove') {
    clientX = event.clientX
    clientY = event.clientY
  } else if (event.type === 'touchmove') {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  }
  
  // 计算新的旋转角度
  const angle = getAngle(centerX, centerY, clientX, clientY)
  const newRotation = angle - startAngle.value
  
  // 更新旋转角度
  updateStickerRotation(newRotation)
}

// 结束旋转
const endRotate = () => {
  if (!isRotating.value) return
  
  isRotating.value = false
  
  // 移除事件监听器
  document.removeEventListener('mousemove', handleRotate)
  document.removeEventListener('touchmove', handleRotate)
  document.removeEventListener('mouseup', endRotate)
  document.removeEventListener('touchend', endRotate)
}

// 计算两点之间的角度
const getAngle = (centerX, centerY, pointX, pointY) => {
  const dx = pointX - centerX
  const dy = pointY - centerY
  
  // 计算角度（弧度）
  let rad = Math.atan2(dy, dx)
  
  // 转换为角度
  let deg = rad * (180 / Math.PI)
  
  // 调整为0-360度
  deg = (deg + 360) % 360
  
  return deg
}

// 更新贴纸位置
const updateStickerPosition = (x, y) => {
  const updatedSticker = {
    ...props.sticker,
    position: { x, y }
  }
  
  // 发出更新事件
  emit('update:sticker', updatedSticker)
}

// 更新贴纸旋转角度
const updateStickerRotation = (rotation) => {
  const updatedSticker = {
    ...props.sticker,
    rotation
  }
  
  // 发出更新事件
  emit('update:sticker', updatedSticker)
}

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchend', endDrag)
  document.removeEventListener('mousemove', handleRotate)
  document.removeEventListener('touchmove', handleRotate)
  document.removeEventListener('mouseup', endRotate)
  document.removeEventListener('touchend', endRotate)
})
</script>

<style scoped src="@/styles/DraggableSticker.css"></style>