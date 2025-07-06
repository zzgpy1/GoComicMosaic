<template>
  <div class="image-processing-container">
    <div class="intro-section">
      <h1>AI一键图片变清晰</h1>
      <p class="intro-text">提升暗淡、模糊和噪点图片至 4K。增强亮度，提高清晰度，优化细节，让图片变清晰。</p>
      <div class="intro-features">
        <div class="intro-feature-item">
          <!-- <i class="fas fa-bolt" style="color: var(--primary-color);"></i> -->
          <span>消除模糊</span>
        </div>
        <div class="intro-feature-item">
          <!-- <i class="fas fa-check-circle" style="color: var(--primary-color);"></i> -->
          <span>增强画质</span>
        </div>
        <div class="intro-feature-item">
          <!-- <i class="fas fa-magic" style="color: var(--primary-color);"></i> -->
          <span>图像超分</span>
        </div>
      </div>
    </div>
    
    <div class="layout-container">
      <!-- 左侧区域 - 默认显示演示视频，上传后显示图片 -->
      <div class="left-column">
        <!-- 默认演示视频 -->
        <div v-if="!selectedFile && !currentOriginalUrl" class="demo-video-container">
          <video 
            autoplay 
            loop 
            muted 
            playsinline 
            class="demo-video"
            @loadedmetadata="onVideoLoaded"
            preload="auto"
            poster="https://pg-public-media.s3.us-west-2.amazonaws.com/v1/web/www/assets/upscaler/banner/image_enhancer_poster.jpg"
            src="https://pg-public-media.s3.us-west-2.amazonaws.com/v1/web/www/assets/upscaler/banner/image_enhancer_web.mp4">
            您的浏览器不支持视频播放
          </video>
          <div class="video-overlay">
            <div class="video-caption">AI 图像增强演示</div>
          </div>
        </div>
        
        <!-- 预览图（上传后但处理前） -->
        <div v-if="selectedFile && !currentProcessedUrl" class="result-view">
          <div class="image-comparison-slider">
            <div class="comparison-container">
              <!-- 只显示原图 -->
              <img :src="currentOriginalUrl || previewUrl" class="enhanced-image" alt="预览图" />
              
              <!-- 处理中提示 -->
              <div v-if="isProcessing" class="processing-overlay">
                <div class="processing-text">正在处理中...</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 处理结果显示区域 -->
        <div v-if="currentOriginalUrl && currentProcessedUrl" class="result-view">
          <!-- 对比滑块（处理后） -->
          <div class="image-comparison-slider">
            <div class="comparison-container" 
                 ref="comparisonContainer" 
                 :style="{ '--slider-pos': sliderPosition + '%' }">
              <!-- 底层是处理后的图片 -->
              <img :src="currentProcessedUrl" class="enhanced-image" alt="处理后图片" ref="enhancedImage" @load="getEnhancedImageDimensions" />
              
              <!-- 上层是原图（完全覆盖，通过clip-path控制可见部分） -->
              <img :src="currentOriginalUrl" class="original-image" alt="原始图片" ref="originalImage" @load="getOriginalImageDimensions" />
              
              <!-- 滑块 -->
              <div class="slider-handle" 
                   @mousedown="startDrag"
                   @touchstart="startDrag">
                <div class="slider-line"></div>
                <div class="slider-button">
                  <img src="data:image/svg+xml,%3csvg%20width='26'%20height='16'%20viewBox='0%200%2026%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M17.451%201.37891L24.0507%207.97857L17.451%2014.5782'%20stroke='%23999999'%20stroke-width='2.33333'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M8.11768%201.37891L1.51801%207.97857L8.11768%2014.5782'%20stroke='%23999999'%20stroke-width='2.33333'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e" width="18">
                </div>
              </div>
              
              <!-- 标签 -->
              <div class="comparison-labels">
                <div class="original-label">原图 {{ originalDimensions }}</div>
                <div class="enhanced-label">增强后 {{ enhancedDimensions }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧区域 - 默认显示上传区域，处理时显示进度 -->
      <div class="right-column">
        <!-- 默认上传区域 -->
        <div v-if="!isProcessing && !currentProcessedUrl" 
             class="upload-empty-state standalone-upload"
             @click="triggerFileInput"
             @dragover.prevent="onDragOver" 
             @dragleave.prevent="onDragLeave" 
             @drop.prevent="onDrop"
             :class="{ 'drag-over': isDragging }">
          <input type="file" ref="fileInput" @change="onFileSelected" accept="image/*" multiple style="display: none" />
          
          <div class="upload-icon-container bi bi-upload">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <div class="upload-text-container">
            <h3 class="upload-title">点击上传，拖放图片</h3>
          </div>
          
          <!-- 上传区域特点说明 -->
          <div class="upload-features">
            <div class="feature-item">
              <i class="fas fa-images"></i>
              <span>4K高清</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-tachometer-alt"></i>
              <span>无水印</span>
            </div>
          </div>
        </div>
        
        <!-- 处理进度组件 - 仅在处理时显示 -->
        <div v-if="isProcessing || currentProcessedUrl" class="processing-progress-container">
          <h2>处理进度</h2>
          
          <!-- Element Plus 垂直步骤条 -->
          <div class="progress-stages-container">
            <el-steps direction="vertical" :active="activeStep" finish-status="success" process-status="process">
              <el-step v-for="(stage, index) in processingStages" :key="index" :title="stage.name">
                <template #icon>
                  <el-icon v-if="progress >= stage.rangeEnd"><Check /></el-icon>
                  <el-icon v-else-if="progress >= stage.rangeStart && progress < stage.rangeEnd"><Loading class="is-rotating" /></el-icon>
                </template>
              </el-step>
            </el-steps>
          </div>
          
          <!-- 队列状态 -->
          <div class="queue-status" v-if="queueStatus.isVisible">
            <div class="queue-icon">
              <i class="fas fa-images"></i>
            </div>
            <div class="queue-text">
              已处理 {{ queueStatus.completedImages }} / {{ queueStatus.totalImages }} 张图片
            </div>
          </div>
          
          <!-- 按钮区域 - 只在需要时显示 -->
          <div class="actions" v-if="!isProcessing && (selectedFile || imageQueue.length > 0 || (currentOriginalUrl && currentProcessedUrl))">
            <div v-if="imageQueue.length > 0 && !currentOriginalUrl && !currentProcessedUrl">
              <button @click="processNextImage" class="primary-button">处理图片 ({{ imageQueue.length }})</button>
              <button @click="clearQueue" class="tertiary-button">清空队列</button>
            </div>
            <div v-else-if="selectedFile && !currentOriginalUrl && !currentProcessedUrl">
              <button @click="processImage" class="primary-button">处理图片</button>
              <button @click="resetUpload" class="tertiary-button">重置</button>
            </div>
            <div v-if="currentOriginalUrl && currentProcessedUrl">
              <button @click="processNextImage" v-if="imageQueue.length > 0" class="primary-button">处理下一张 ({{ imageQueue.length }})</button>
              <button @click="resetUpload" class="primary-button" v-else>重新上传</button>
              <button @click="downloadEnhancedImage" class="tertiary-button">下载图片</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 处理日志 -->
    <div class="processing-logs" v-if="logs.length > 0">
      <h2>处理日志</h2>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
    
    <div class="error-message" v-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { Check, Loading } from '@element-plus/icons-vue'

export default {
  name: 'ImageProcessingTest',
  components: {
    Check,
    Loading
  },
  data() {
    return {
      selectedFile: null,
      previewUrl: '',
      isProcessing: false,
      isDragging: false, // 用于文件拖放
      isSliderDragging: false, // 用于滑块拖动
      currentOriginalUrl: '',
      currentProcessedUrl: '',
      errorMessage: '',
      progress: 0, // 进度值，0-100
      progressPercent: 0, // 旧版进度条使用
      processingStatus: '准备处理...', // 旧版进度文本
      showProgressBar: false,
      logs: [],
      sliderPosition: 50, // 滑块初始位置，50%
      enhancedImagePath: '',
      imagesLoaded: false, // 标记图片是否加载完成
      imageQueue: [], // 图片队列
      originalDimensions: '', // 原图尺寸
      enhancedDimensions: '', // 增强后图片尺寸
      brightness: 100, // 默认亮度值
      contrast: 100, // 默认对比度值
      keepSettings: false, // 是否保存设置
      processingStages: [
        { name: '上传准备', rangeStart: 0, rangeEnd: 20, status: '图片处理中...' },
        { name: '消除模糊', rangeStart: 20, rangeEnd: 30, status: '消除模糊...' },
        { name: '增强画质', rangeStart: 30, rangeEnd: 40, status: '增强画质...' },
        { name: '图像超分', rangeStart: 40, rangeEnd: 50, status: '图像超分...' },
        { name: '优化结果', rangeStart: 50, rangeEnd: 100, status: '优化结果...' }
      ],
      queueStatus: {
        totalImages: 0,
        completedImages: 0,
        isVisible: false
      }
    }
  },
  computed: {
    // 计算当前激活的步骤索引
    activeStep() {
      if (this.progress >= 100) {
        return this.processingStages.length; // 全部完成
      }
      
      for (let i = 0; i < this.processingStages.length; i++) {
        const stage = this.processingStages[i];
        if (this.progress >= stage.rangeStart && this.progress < stage.rangeEnd) {
          return i + 1; // Element Plus的步骤是从1开始计数的
        }
      }
      return 0; // 默认第一步
    }
  },
  mounted() {
    // 添加全局鼠标和触摸事件监听器
    window.addEventListener('mousemove', this.onDrag)
    window.addEventListener('mouseup', this.stopDrag)
    window.addEventListener('touchmove', this.onDrag)
    window.addEventListener('touchend', this.stopDrag)
    
    // 从localStorage加载保存的设置
    this.loadSavedSettings();
  },
  beforeUnmount() {
    // 清理预览URL和事件监听器
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
    window.removeEventListener('mousemove', this.onDrag)
    window.removeEventListener('mouseup', this.stopDrag)
    window.removeEventListener('touchmove', this.onDrag)
    window.removeEventListener('touchend', this.stopDrag)
  },
  methods: {
    // 视频加载完成后的处理
    onVideoLoaded(event) {
      // 记录视频加载完成
      console.log('视频元数据加载完成', event.target.videoWidth, 'x', event.target.videoHeight);
      
      // 如果是移动端，可以在这里进行额外处理
      if (window.innerWidth <= 768) {
        // 获取视频元素
        const video = event.target;
        // 获取视频容器
        const container = video.parentElement;
        
        // 确保视频比例正确
        if (video.videoWidth && video.videoHeight) {
          const aspectRatio = video.videoWidth / video.videoHeight;
          console.log('视频宽高比:', aspectRatio);
          
          // 可以在这里根据视频实际比例调整容器样式
          // 但由于我们已经在CSS中设置了aspect-ratio，这里不需要额外处理
        }
      }
    },
    
    // 加载保存的设置
    loadSavedSettings() {
      try {
        // 检查是否有保存的设置
        const keepSettings = localStorage.getItem('imageProcessingKeepSettings');
        if (keepSettings === 'true') {
          this.keepSettings = true;
          
          // 获取亮度设置
          const savedBrightness = localStorage.getItem('imageProcessingBrightness');
          if (savedBrightness !== null) {
            this.brightness = Number(savedBrightness);
          }
          
          // 获取对比度设置
          const savedContrast = localStorage.getItem('imageProcessingContrast');
          if (savedContrast !== null) {
            this.contrast = Number(savedContrast);
          }
          
          console.log('已加载保存的设置:', {
            brightness: this.brightness,
            contrast: this.contrast
          });
        }
      } catch (error) {
        console.error('加载设置出错:', error);
      }
    },
    // 获取原图尺寸
    getOriginalImageDimensions() {
      if (this.$refs.originalImage) {
        const img = this.$refs.originalImage
        this.originalDimensions = `${img.naturalWidth}×${img.naturalHeight}`
      }
    },
    
    // 获取增强图尺寸
    getEnhancedImageDimensions() {
      if (this.$refs.enhancedImage) {
        const img = this.$refs.enhancedImage
        this.enhancedDimensions = `${img.naturalWidth}×${img.naturalHeight}`
      }
    },
    
    // 清空队列
    clearQueue() {
      this.imageQueue = []
      this.addLog(`已清空处理队列`)
    },
    
    // 处理下一张图片
    processNextImage() {
      if (this.imageQueue.length > 0) {
        this.resetCurrentImage()
        this.selectedFile = this.imageQueue.shift()
        this.previewUrl = URL.createObjectURL(this.selectedFile)
        this.addLog(`准备处理下一张图片: ${this.selectedFile.name}`)
        this.processImage()
      }
    },
    
    // 重置当前图片，但保留队列
    resetCurrentImage() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.selectedFile = null
      this.previewUrl = ''
      this.currentOriginalUrl = ''
      this.currentProcessedUrl = ''
      this.enhancedImagePath = ''
      this.originalDimensions = ''
      this.enhancedDimensions = ''
    },
    
    // 添加日志
    addLog(message) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString()
      this.logs.unshift({
        time: timeStr,
        message: message
      })
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    onFileSelected(event) {
      const files = event.target.files
      if (files.length > 0) {
        // 更新队列状态
        this.queueStatus.totalImages = files.length;
        this.queueStatus.completedImages = 0;
        this.queueStatus.isVisible = files.length > 1;
        
        // 第一个文件作为当前选中文件
        this.selectedFile = files[0]
        this.previewUrl = URL.createObjectURL(this.selectedFile)
        this.addLog(`已选择文件: ${this.selectedFile.name} (${Math.round(this.selectedFile.size / 1024)} KB)`)
        
        // 其余文件加入队列
        if (files.length > 1) {
          for (let i = 1; i < files.length; i++) {
            this.imageQueue.push(files[i])
            this.addLog(`已添加到队列: ${files[i].name} (${Math.round(files[i].size / 1024)} KB)`)
          }
        }
        
        // 自动开始处理图片
        this.processImage();
      }
    },
    
    onDragOver(event) {
      this.isDragging = true
    },
    
    onDragLeave(event) {
      this.isDragging = false
    },
    
    onDrop(event) {
      this.isDragging = false
      const files = event.dataTransfer.files
      
      // 过滤出图片文件
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      
      if (imageFiles.length > 0) {
        // 更新队列状态
        this.queueStatus.totalImages = imageFiles.length;
        this.queueStatus.completedImages = 0;
        this.queueStatus.isVisible = imageFiles.length > 1;
        
        // 第一个文件作为当前选中文件
        this.selectedFile = imageFiles[0]
        this.previewUrl = URL.createObjectURL(this.selectedFile)
        this.addLog(`已拖放文件: ${this.selectedFile.name} (${Math.round(this.selectedFile.size / 1024)} KB)`)
        
        // 其余文件加入队列
        if (imageFiles.length > 1) {
          for (let i = 1; i < imageFiles.length; i++) {
            this.imageQueue.push(imageFiles[i])
            this.addLog(`已添加到队列: ${imageFiles[i].name} (${Math.round(imageFiles[i].size / 1024)} KB)`)
          }
        }
        
        // 自动开始处理图片
        this.processImage();
      } else {
        this.errorMessage = '请上传有效的图片文件'
      }
    },
    
    resetUpload() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.selectedFile = null
      this.previewUrl = ''
      this.errorMessage = ''
      this.currentOriginalUrl = ''
      this.currentProcessedUrl = ''
      this.enhancedImagePath = ''
      this.logs = []
      this.progress = 0
      this.progressPercent = 0
      this.showProgressBar = false
      this.sliderPosition = 50
      this.imageQueue = []
      this.originalDimensions = ''
      this.enhancedDimensions = ''
      this.queueStatus = {
        totalImages: 0,
        completedImages: 0,
        isVisible: false
      }
    },
    
    // 检查图片加载状态
    checkImagesLoaded() {
      return new Promise((resolve) => {
        let originalImg = new Image();
        let enhancedImg = new Image();
        let loadedCount = 0;
        
        const onLoad = () => {
          loadedCount++;
          if (loadedCount === 2) {
            this.imagesLoaded = true;
            resolve();
          }
        };
        
        originalImg.onload = onLoad;
        enhancedImg.onload = onLoad;
        
        originalImg.src = this.currentOriginalUrl;
        enhancedImg.src = this.currentProcessedUrl;
      });
    },
    
    // 开始拖动滑块
    startDrag(event) {
      this.isSliderDragging = true
      event.preventDefault()
    },
    
    // 拖动过程
    onDrag(event) {
      if (!this.isSliderDragging || !this.$refs.comparisonContainer) return
      
      let clientX
      if (event.type === 'touchmove') {
        clientX = event.touches[0].clientX
      } else {
        clientX = event.clientX
      }
      
      const container = this.$refs.comparisonContainer
      const rect = container.getBoundingClientRect()
      const containerWidth = rect.width
      const offsetX = clientX - rect.left
      
      // 计算百分比位置，并限制在0-100之间
      let position = (offsetX / containerWidth) * 100
      position = Math.max(0, Math.min(100, position))
      
      this.sliderPosition = position
    },
    
    // 停止拖动
    stopDrag() {
      this.isSliderDragging = false
    },
    
    // 下载处理后的图片
    downloadEnhancedImage() {
      if (!this.currentProcessedUrl) return
      
      this.addLog('开始下载处理后图片...')
      
      // 提取文件名，如果URL中没有文件名，则使用默认名称
      const fileName = this.enhancedImagePath.split('/').pop() || 'enhanced-image.png'
      
      // 使用fetch获取图片数据
      fetch(this.currentProcessedUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('下载图片失败')
          }
          return response.blob()
        })
        .then(blob => {
          // 创建一个临时链接来下载图片
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = fileName
          
          // 模拟点击下载
          document.body.appendChild(link)
          link.click()
          
          // 清理
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)
          
          this.addLog(`已下载处理后图片: ${fileName}`)
        })
        .catch(error => {
          console.error('下载图片时出错:', error)
          this.errorMessage = '下载图片时出错'
          this.addLog(`下载出错: ${error.message || '未知错误'}`)
        })
    },
    
    // 图片处理流程
    async processImage() {
      if (!this.selectedFile) {
        this.errorMessage = '请先选择图片';
        return;
      }
      
      try {
        // 准备处理状态
        this.isProcessing = true;
        this.errorMessage = '';
        this.currentProcessedUrl = '';
        this.progress = 0;
        this.showProgressBar = true;
        
        this.addLog('开始处理图片');
        console.log('开始处理图片', this.selectedFile.name); // 调试日志
        
        // 首先读取文件并显示预览
        const dataUrl = await this.readFileAsDataURL(this.selectedFile);
        this.currentOriginalUrl = dataUrl;
        
        // 获取原始图片尺寸
        const dimensions = await this.getImageDimensions(dataUrl);
        this.originalDimensions = `${dimensions.width}×${dimensions.height}`;
        
        this.addLog('上传图片并开始处理');
        
        // 检查并处理透明背景
        let processedFile = this.selectedFile;
        if (this.selectedFile.type === 'image/png' || this.selectedFile.type === 'image/webp') {
          this.addLog(`检测到${this.selectedFile.type === 'image/webp' ? 'WebP' : 'PNG'}图片，检查是否有透明背景`);
          
          // 先检查是否有透明背景
          const hasTransparency = await this.checkImageTransparency(this.selectedFile);
          
          if (hasTransparency) {
            this.addLog(`图片包含透明背景，进行处理`);
            processedFile = await this.replaceTransparentBackground(this.selectedFile);
          } else {
            this.addLog(`图片不包含透明背景，无需处理`);
          }
        }
        
        // 构建FormData
        const formData = new FormData();
        formData.append('image', processedFile);
        formData.append('save_result', 'true');
        
        // 使用更安全的方式添加参数
        if (typeof this.brightness === 'number' && this.brightness !== 100) {
          formData.append('brightness', String(this.brightness));
        }
        
        if (typeof this.contrast === 'number' && this.contrast !== 100) {
          formData.append('contrast', String(this.contrast));
        }
        
        // 开始模拟阶段进度
        let currentStageIndex = 0;
        // 设置第一个阶段的进度
        this.progress = this.processingStages[0].rangeStart;
        
        // 创建一个定时器，每1.5秒切换到下一个阶段
        const progressInterval = setInterval(() => {
          currentStageIndex++;
          
          // 如果已经到达最后一个阶段前，停止定时器
          if (currentStageIndex >= this.processingStages.length - 1) {
            clearInterval(progressInterval);
            // 设置到倒数第二个阶段的开始
            this.progress = this.processingStages[this.processingStages.length - 2].rangeEnd;
          } else {
            // 设置到当前阶段的中间值
            const stage = this.processingStages[currentStageIndex];
            this.progress = stage.rangeStart + 1; // 设置为阶段开始后一点点，确保激活该阶段
            this.addLog(stage.status);
          }
        }, 1500);
        
        // 执行API调用
        this.addLog('正在调用图像处理API...');
        console.log('开始API调用', '/app/api/imgtools/enhance');
        
        const response = await fetch('/app/api/imgtools/enhance', {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });
        
        // API调用完成后，清除定时器（如果还在运行）
        clearInterval(progressInterval);
        
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
          throw new Error('API请求失败: ' + response.status);
        }
        
        const result = await response.json();
        console.log('API响应数据:', result);
        
        this.addLog('收到API响应，正在处理结果...');
        
        // API成功后，设置进度为100%
        this.progress = 100;
        
        if (result.success) {
          // 设置处理后图片的URL
          this.currentProcessedUrl = result.enhanced_url;
          this.enhancedImagePath = result.enhanced_path;
          
          // 添加处理信息到日志
          this.addLog(`处理用时: ${result.processing_time || '未知'}`);
          this.addLog(`原始图片路径: ${result.original_path || '未知'}`);
          this.addLog(`处理后图片路径: ${result.enhanced_path || '未知'}`);
          
          // 获取处理后图像的分辨率
          try {
            const enhancedDims = await this.getImageDimensions(result.enhanced_url);
            this.enhancedDimensions = `${enhancedDims.width}×${enhancedDims.height}`;
          } catch (error) {
            console.error('获取处理后图像尺寸失败:', error);
          }
          
          // 保存用户设置
          if (this.keepSettings) {
            localStorage.setItem('imageProcessingBrightness', String(this.brightness || 100));
            localStorage.setItem('imageProcessingContrast', String(this.contrast || 100));
            localStorage.setItem('imageProcessingKeepSettings', 'true');
          }
          
          this.addLog('图片处理成功');
          
          // 更新队列状态
          this.queueStatus.completedImages++;
        } else {
          this.errorMessage = result.message || '处理图片失败';
          this.addLog(`处理失败: ${result.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('处理图片时出错:', error);
        this.errorMessage = '处理图片时出错: ' + error.message;
        this.addLog(`处理出错: ${error.message || '未知错误'}`);
      } finally {
        // 无论成功失败，延迟一会再将处理状态设为false
        setTimeout(() => {
          this.isProcessing = false;
        }, 500);
      }
    },
    
    // 辅助方法：读取文件为DataURL
    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('读取文件失败'));
        reader.readAsDataURL(file);
      });
    },
    
    // 辅助方法：获取图片尺寸
    getImageDimensions(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('加载图片失败'));
        img.src = src;
      });
    },
    
    // 处理透明背景，替换为白色
    replaceTransparentBackground(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          
          img.onload = () => {
            // 创建canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸与图片相同
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 先填充白色背景
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 然后绘制图片
            ctx.drawImage(img, 0, 0);
            
            // 记录原始文件类型
            const originalType = file.type;
            this.addLog(`处理透明背景：原始格式为 ${originalType}`);
            
            // 转换为Blob，始终输出为PNG格式以确保透明度处理正确
            canvas.toBlob((blob) => {
              if (blob) {
                // 创建新的File对象
                const newFile = new File([blob], file.name, {
                  type: 'image/png',  // 统一转为PNG格式
                  lastModified: new Date().getTime()
                });
                
                this.addLog(`透明背景已替换为白色，转换为PNG格式`);
                resolve(newFile);
              } else {
                reject(new Error('转换图片失败'));
              }
            }, 'image/png');
          };
          
          img.onerror = (error) => {
            console.error('加载图片失败:', error);
            this.addLog(`加载图片失败: ${file.type} 格式可能不受支持`);
            reject(new Error('加载图片失败'));
          };
          
          img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
          console.error('读取文件失败:', error);
          reject(new Error('读取文件失败'));
        };
        
        reader.readAsDataURL(file);
      });
    },
    
    // 检查图片是否有透明背景
    async checkImageTransparency(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          
          img.onload = () => {
            // 创建canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸与图片相同
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制图片
            ctx.drawImage(img, 0, 0);
            
            // 获取图片数据
            try {
              // 检查图片边缘和一些随机点
              const checkPoints = [
                // 四个角落
                {x: 0, y: 0},
                {x: canvas.width - 1, y: 0},
                {x: 0, y: canvas.height - 1},
                {x: canvas.width - 1, y: canvas.height - 1},
                // 中心点
                {x: Math.floor(canvas.width / 2), y: Math.floor(canvas.height / 2)},
                // 随机点
                {x: Math.floor(canvas.width / 4), y: Math.floor(canvas.height / 4)},
                {x: Math.floor(canvas.width * 3 / 4), y: Math.floor(canvas.height / 4)},
                {x: Math.floor(canvas.width / 4), y: Math.floor(canvas.height * 3 / 4)},
                {x: Math.floor(canvas.width * 3 / 4), y: Math.floor(canvas.height * 3 / 4)}
              ];
              
              // 检查这些点是否有透明像素
              for (const point of checkPoints) {
                const pixelData = ctx.getImageData(point.x, point.y, 1, 1).data;
                // 如果alpha通道小于255，则认为有透明度
                if (pixelData[3] < 255) {
                  console.log(`检测到透明像素，位置: (${point.x}, ${point.y}), Alpha值: ${pixelData[3]}`);
                  resolve(true);
                  return;
                }
              }
              
              // 如果没有在抽样点找到透明像素，进行更详细的扫描
              // 每10个像素抽样一次，以提高效率
              const step = 10;
              for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                  const pixelData = ctx.getImageData(x, y, 1, 1).data;
                  if (pixelData[3] < 255) {
                    console.log(`详细扫描检测到透明像素，位置: (${x}, ${y}), Alpha值: ${pixelData[3]}`);
                    resolve(true);
                    return;
                  }
                }
              }
              
              // 没有找到透明像素
              resolve(false);
            } catch (error) {
              console.error('检查图片透明度时出错:', error);
              // 出错时保守处理，假设有透明背景
              resolve(true);
            }
          };
          
          img.onerror = (error) => {
            console.error('加载图片失败:', error);
            // 出错时保守处理，假设有透明背景
            resolve(true);
          };
          
          img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
          console.error('读取文件失败:', error);
          // 出错时保守处理，假设有透明背景
          resolve(true);
        };
        
        reader.readAsDataURL(file);
      });
    },
  }
}
</script>

<style src="@/styles/ImageTools.css"></style>

