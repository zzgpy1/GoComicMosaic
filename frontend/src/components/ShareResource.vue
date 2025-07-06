<template>
  <!-- 模态框 - 使用teleport确保模态框直接挂载到body -->
  <teleport to="body">
    <div v-if="showModal" class="share-modal custom-modal" @click="handleModalClick">
      <div class="modal-dialog" @click.stop>
        <div class="modal-content">
          <!-- 移除了关闭按钮 -->
          
          <div class="share-modal-body">
            <div class="share-preview-container">
              <div v-if="isGeneratingImage" class="loading-container">
                <div class="spinner"></div>
                <p>生成分享图片中...</p>
              </div>
              <div v-else class="share-image-container">
                <img :src="shareImageUrl" alt="分享预览图" class="share-image" v-if="shareImageUrl" />
                <div v-else class="error-container">
                  <p>生成图片失败</p>
                </div>
              </div>
            </div>
            
            <div class="share-options">              
              <div class="share-actions">
                <button class="btn-custom btn-primary" @click="copyShareLink" :disabled="isGeneratingImage">
                  <i class="bi bi-link"></i> 复制链接
                </button>
                <button class="btn-custom btn-outline" @click="downloadShareImage" :disabled="isGeneratingImage || !shareImageUrl">
                  <i class="bi bi-download"></i> 保存图片
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 复制成功提示 -->
  <transition name="fade">
    <div v-if="showToast" class="copy-success-toast">
      <i class="bi bi-check-circle"></i> 链接已复制到剪贴板
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, defineExpose, onMounted } from 'vue'
import QRCode from 'qrcode'
import { getImageUrl } from '@/utils/imageUtils'
import infoManager from '@/utils/InfoManager'

// 添加处理跨域图片URL的工具函数
const getProxiedImageUrl = (url) => {
  if (!url) return url

  // 已经是相对路径或数据URL，无需处理
  if (!url.startsWith('http') || url.startsWith('data:')) {
    return url
  }
  
  // 检查是否是本站域名，如果是则不需要代理
  if (url.includes(window.location.hostname)) {
    return url
  }
  
  // 所有外部域名图片使用通用代理格式
  return `/app/proxy?url=${encodeURIComponent(url)}`
}

const props = defineProps({
  resource: {
    type: Object,
    required: true,
    default: () => ({}) // 添加默认空对象，避免null值
  }
})

const showModal = ref(false)
const shareImageUrl = ref(null)
const isGeneratingImage = ref(false)
const copySuccess = ref(false)
const showToast = ref(false)
const siteInfo = ref({
  logoText: '美漫资源共建' // 默认值
})

// 加载站点信息
const loadSiteInfo = async () => {
  try {
    const info = await infoManager.getSiteBasicInfo()
    siteInfo.value = info
    console.log('站点信息加载成功:', siteInfo.value)
  } catch (error) {
    console.error('获取站点信息失败:', error)
    // 使用默认值
  }
}

// 在组件挂载时加载信息
onMounted(() => {
  loadSiteInfo()
})

// 显示一个临时的Toast提示
const showTemporaryToast = () => {
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 显示分享模态框 - 对外暴露此方法
const openShareModal = async () => {
  showModal.value = true
  document.body.style.overflow = 'hidden'
  
  // 确保站点信息已加载
  if (!siteInfo.value.logoText || siteInfo.value.logoText === '美漫资源共建') {
    await loadSiteInfo()
  }
  
  if (!shareImageUrl.value) {
    await generateShareImage()
  }
}

// 隐藏模态框
const closeShareModal = () => {
  showModal.value = false
  document.body.style.overflow = 'auto'
  copySuccess.value = false
}

// 处理模态框点击事件 - 点击背景关闭
const handleModalClick = (e) => {
  // 点击的是模态框背景，关闭模态框
  closeShareModal()
}

// 生成二维码
const generateQRCode = async (url) => {
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('生成二维码失败：', err)
    return null
  }
}

// 生成分享图片
const generateShareImage = async () => {
  isGeneratingImage.value = true
  shareImageUrl.value = null
  
  try {
    // 如果资源不存在或缺少必要信息，则终止
    if (!props.resource || !props.resource.title) {
      throw new Error('资源信息不完整')
    }
    
    // 创建用于绘制的canvas元素
    const canvas = document.createElement('canvas')
    // 调整画布尺寸，确保有足够空间显示所有内容，但不要过多留白
    canvas.width = 600
    canvas.height = 960 // 减小高度，减少底部留白
    const ctx = canvas.getContext('2d')

    // 绘制背景 - 使用白色背景
    ctx.fillStyle = '#ffffff' // 纯白色背景
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 定义统一的间距
    const STANDARD_SPACING = 42 // 所有元素间的标准间距
    const LINE_SPACING = 28 // 行内间距
    
    // 加载海报图片
    let posterImage = null
    if (props.resource.poster_image || (props.resource.images && props.resource.images.length > 0)) {
      // 使用项目的getImageUrl函数处理图片路径
      const posterUrl = props.resource.poster_image || props.resource.images[0]
      let fullPosterUrl = getImageUrl(posterUrl)
      
      // 使用跨域代理处理URL
      fullPosterUrl = getProxiedImageUrl(fullPosterUrl)
      
      try {
        const imgElement = new Image()
        await new Promise((resolve, reject) => {
          imgElement.onload = () => resolve()
          imgElement.onerror = (e) => {
            console.error('图片加载失败:', e)
            reject(new Error('海报图片加载失败'))
          }
          imgElement.crossOrigin = 'Anonymous'
          imgElement.src = fullPosterUrl
        })
        posterImage = imgElement
      } catch (imgError) {
        console.error('加载海报图片失败，使用默认图片', imgError)
        
        // 尝试使用备用图片加载方法
        try {
          const defaultImg = new Image()
          await new Promise((resolve) => {
            defaultImg.onload = resolve
            defaultImg.crossOrigin = 'Anonymous'
            // 尝试使用本地项目中的默认图片
            defaultImg.src = '/images/default-poster.png'
          })
          posterImage = defaultImg
        } catch (fallbackError) {
          console.error('默认图片加载失败，使用内联图片', fallbackError)
          
          // 使用内联的base64简单图片作为最终备选，避免所有跨域问题
          const fallbackImg = new Image()
          await new Promise((resolve) => {
            fallbackImg.onload = resolve
            // 简单的灰色背景图片（base64编码）
            fallbackImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0AQMAAAD2S0g5AAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAJklEQVR4nO3BAQ0AAADCoPdP7ewBFAAAAAAAAAAAAAAAAAAAAK8GRMoAAZJ1AOkAAAAASUVORK5CYII='
          })
          posterImage = fallbackImg
        }
      }
    }
    
    // 海报区域参数 - 海报铺满顶部和两边
    const posterWidth = canvas.width // 满宽
    const posterHeight = Math.min(Math.floor(canvas.width * 1.2), 700) // 限制海报高度，确保下方内容有足够空间
    const posterX = 0 // 从左侧边缘开始
    const posterY = 0 // 从顶部开始
    
    // 绘制海报图片
    if (posterImage) {
      // 绘制图片，铺满
      ctx.drawImage(posterImage, posterX, posterY, posterWidth, posterHeight)
      
      // 生成当前页面的二维码 - 放在海报右下角
      const resourceUrl = `${window.location.origin}/resource/${props.resource.id}`
      const qrCodeDataUrl = await generateQRCode(resourceUrl)
      
      if (qrCodeDataUrl) {
        // 加载二维码图片 - 不需要代理，因为QRCode.js生成的是data:image/png;base64格式的数据URL
        const qrImage = new Image()
        await new Promise((resolve) => {
          qrImage.onload = resolve
          qrImage.src = qrCodeDataUrl
        })
        
        // 绘制二维码（右下角覆盖海报）
        const qrSize = 150
        const qrX = canvas.width - qrSize - 15
        const qrY = posterHeight - qrSize - 15
        
        // 二维码背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
        ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
        
        // 绘制二维码
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
        
        // 在二维码上方添加扫码提示
        ctx.font = '14px Arial'
        ctx.fillStyle = '#3a86ff' // 使用蓝色主题色
        ctx.textAlign = 'center'
        // ctx.fillText('扫码查看', qrX + qrSize/2, qrY - 10)
      }
    } else {
      // 如果图片加载失败，绘制一个占位区域
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(posterX, posterY, posterWidth, posterHeight)
      
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'center'
      ctx.fillText('图片加载失败', canvas.width / 2, posterY + posterHeight / 2)
    }
    
    // 计算内容开始的Y坐标 - 与海报保持标准间距
    let currentY = posterHeight + STANDARD_SPACING
    
    // 1. 绘制中文标题
    ctx.font = 'bold 26px Arial'
    ctx.fillStyle = '#111827' // 深色文字，与浅色背景形成对比
    ctx.textAlign = 'center'
    
    // 中文标题 - 计算换行
    const titleMaxWidth = canvas.width - 60
    let titleText = props.resource.title || '无标题'
    let titleLines = []
    
    if (ctx.measureText(titleText).width > titleMaxWidth) {
      // 单字符换行处理中文标题
      let currentLine = ''
      for (let i = 0; i < titleText.length; i++) {
        const testLine = currentLine + titleText[i]
        if (ctx.measureText(testLine).width > titleMaxWidth) {
          titleLines.push(currentLine)
          currentLine = titleText[i]
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) titleLines.push(currentLine)
    } else {
      titleLines = [titleText]
    }
    
    // 绘制中文标题
    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], canvas.width / 2, currentY, titleMaxWidth)
      if (i < titleLines.length - 1) {
        currentY += LINE_SPACING  // 标题内部的行间距
      }
    }
    
    // 2. 绘制英文标题（如果有）
    if (props.resource.title_en) {
      // 添加标准间距
      currentY += STANDARD_SPACING
      
      ctx.font = '18px Arial'
      ctx.fillStyle = '#4b5563'  // 使用稍浅色显示英文标题
      
      // 处理英文标题换行
      const enTitleMaxWidth = titleMaxWidth
      let enTitleText = props.resource.title_en
      let enTitleLine = ''
      let enTitleLines = []
      
      // 单词拆分处理
      const words = enTitleText.split(' ')
      for (let i = 0; i < words.length; i++) {
        const testLine = enTitleLine + (i > 0 ? ' ' : '') + words[i]
        if (ctx.measureText(testLine).width > enTitleMaxWidth) {
          enTitleLines.push(enTitleLine)
          enTitleLine = words[i]
        } else {
          enTitleLine = testLine
        }
      }
      if (enTitleLine) enTitleLines.push(enTitleLine)
      
      // 绘制英文标题，最多显示2行
      for (let i = 0; i < Math.min(enTitleLines.length, 2); i++) {
        ctx.fillText(enTitleLines[i], canvas.width / 2, currentY, enTitleMaxWidth)
        if (i < Math.min(enTitleLines.length, 2) - 1) {
          currentY += 26 // 英文标题行间距
        }
      }
      
      // 如果超过2行，显示省略号
      if (enTitleLines.length > 2) {
        ctx.fillText('...', canvas.width / 2, currentY + 26, enTitleMaxWidth)
      }
    }
    
    // 3. 绘制描述摘要 - 确保最多显示2行
    if (props.resource.description) {
      // 添加标准间距
      currentY += STANDARD_SPACING
      
      // 截取描述的前100个字符，后续会进行换行处理
      const shortDesc = props.resource.description.substring(0, 100)
      
      // 绘制描述文字
      ctx.font = '16px Arial'
      ctx.fillStyle = '#334155'  // 深灰色，易于阅读
      ctx.textAlign = 'center'
      
      // 分段绘制描述
      const descMaxWidth = canvas.width - 80
      let descLines = []
      let descLine = ''
      
      // 逐字符处理，确保正确换行
      for (let i = 0; i < shortDesc.length; i++) {
        const testLine = descLine + shortDesc[i]
        
        if (ctx.measureText(testLine).width > descMaxWidth) {
          descLines.push(descLine)
          descLine = shortDesc[i]
          
          // 如果已经有1行，并且开始添加第2行
          if (descLines.length >= 1) {
            // 继续添加字符直到达到第2行末尾
            while (i + 1 < shortDesc.length && ctx.measureText(descLine + shortDesc[i + 1]).width <= descMaxWidth) {
              i++;
              descLine += shortDesc[i];
            }
            
            // 如果第2行末尾还有更多内容，添加省略号
            if (i + 1 < shortDesc.length || props.resource.description.length > 100) {
              descLine += '...';
            }
            
            descLines.push(descLine);
            break; // 最多2行，跳出循环
          }
        } else {
          descLine = testLine;
        }
      }
      
      // 如果只有一行并且没装满
      if (descLines.length === 0 && descLine) {
        descLines.push(descLine);
      } else if (descLines.length === 1 && descLine) { 
        // 如果已经有一行并且有剩余内容
        if (props.resource.description.length > 100 || ctx.measureText(descLine).width > descMaxWidth) {
          // 如果总内容超过100字符或当前行将超出宽度，添加省略号
          if (ctx.measureText(descLine + '...').width > descMaxWidth) {
            // 需要截断当前行以容纳省略号
            while (ctx.measureText(descLine + '...').width > descMaxWidth && descLine.length > 0) {
              descLine = descLine.slice(0, -1);
            }
            descLine += '...';
          } else if (props.resource.description.length > 100) {
            descLine += '...';
          }
        }
        descLines.push(descLine);
      }
      
      // 绘制最多2行描述
      for (let i = 0; i < Math.min(descLines.length, 2); i++) {
        ctx.fillText(descLines[i], canvas.width / 2, currentY, descMaxWidth);
        if (i < descLines.length - 1) {
          currentY += LINE_SPACING - 4; // 描述行间距略小
        }
      }
    }
    
    // 4. 绘制URL
    // 添加标准间距
    currentY += STANDARD_SPACING
    
    const resourceUrl = `${window.location.origin}/resource/${props.resource.id}`
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = '#3a86ff' // 使用主题蓝色
    
    // 确保URL完整显示
    const urlWidth = ctx.measureText(resourceUrl).width
    if (urlWidth > titleMaxWidth) {
      // URL太长，缩小字体
      ctx.font = 'bold 14px Arial'
    }
    
    // 绘制URL
    ctx.fillText(resourceUrl, canvas.width / 2, currentY, titleMaxWidth)
    
    // 5. 绘制分享标语
    // 添加标准间距
    currentY += STANDARD_SPACING
    
    const slogan = '多种网盘下载，在线点播，免费无广纯净体验！'
    ctx.font = 'bold 18px Arial'
    ctx.fillStyle = '#1e293b' // 深色文字
    
    // 检查标语长度，自动拆分
    if (ctx.measureText(slogan).width > titleMaxWidth) {
      // 尝试在逗号处拆分
      const commaPos = slogan.indexOf('，')
      if (commaPos > 0) {
        const firstPart = slogan.substring(0, commaPos + 1)
        const secondPart = slogan.substring(commaPos + 1)
        
        ctx.fillText(firstPart, canvas.width / 2, currentY, titleMaxWidth)
        currentY += LINE_SPACING // 标语行间距
        ctx.fillText(secondPart, canvas.width / 2, currentY, titleMaxWidth)
      } else {
        // 找不到逗号，在中间拆分
        const half = Math.floor(slogan.length / 2)
        const firstPart = slogan.substring(0, half)
        const secondPart = slogan.substring(half)
        
        ctx.fillText(firstPart, canvas.width / 2, currentY, titleMaxWidth)
        currentY += LINE_SPACING // 标语行间距
        ctx.fillText(secondPart, canvas.width / 2, currentY, titleMaxWidth)
      }
    } else {
      ctx.fillText(slogan, canvas.width / 2, currentY, titleMaxWidth)
    }
    
    // 添加一行的留白即可，不需要太多
    currentY += LINE_SPACING * 1.2
    
    // 转换为图片URL
    shareImageUrl.value = canvas.toDataURL('image/png')
  } catch (error) {
    console.error('生成分享图片失败：', error)
    alert('生成分享图片失败，请重试')
  } finally {
    isGeneratingImage.value = false
  }
}

// 复制分享链接
const copyShareLink = async () => {
  if (!shareImageUrl.value || !props.resource) return
  
  const resourceUrl = `${window.location.origin}/resource/${props.resource.id}`
  
  // 使用siteInfo中的logoText
  const siteName = siteInfo.value.logoText || '美漫资源共建'
  
  // 更新后的分享文本格式
  const shareText = `我正在${siteName}看【${props.resource.title}】\n${props.resource.description?.substring(0, 50)}${props.resource.description?.length > 50 ? '...' : ''}\n「${siteName}」免费无广告，提供多种网盘下载，还能在线点播，等你哦！ ${resourceUrl}\n\n`
  
  try {
    // 尝试直接复制文本
    await navigator.clipboard.writeText(shareText)
    copySuccess.value = true
    
    // 显示复制成功的提示信息
    showTemporaryToast()
    
    // 3秒后重置复制状态
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('复制失败：', err)
    alert('复制失败，请手动复制分享链接')
  }
}

// 下载分享图片
const downloadShareImage = () => {
  if (!shareImageUrl.value) return
  
  const a = document.createElement('a')
  a.href = shareImageUrl.value
  a.download = `分享-${props.resource.title || '资源'}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 监听资源变化，重新生成分享图片
watch(
  () => props.resource,
  () => {
    if (showModal.value) {
      generateShareImage()
    } else {
      // 清空之前的分享图片，在下次显示模态框时重新生成
      shareImageUrl.value = null
    }
  },
  { deep: true }
)

// 对外暴露方法，供父组件调用
defineExpose({
  openShareModal
})
</script>

<!-- 移除内联style标签，改为引入外部CSS文件 -->
<style src="@/styles/ShareResourceGlobal.css"></style>
<style src="@/styles/ShareResource.css" scoped></style> 