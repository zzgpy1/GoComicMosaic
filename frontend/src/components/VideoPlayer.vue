<template>
  <div class="video-player-container">
    <div class="player-wrapper">
      <video ref="videoElement" class="video-js vjs-default-skin vjs-big-play-centered"></video>
    </div>
    <div v-if="error" class="player-error-message">
      <div class="error-content">
        <span class="error-icon">❌</span>
        <p>{{ error }}</p>
        <button class="retry-button" @click="retryPlayback">重试</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// VideoJS 7+ 已通过 @videojs/http-streaming 内置了对HLS的支持，无需单独引入
import '@videojs/http-streaming';

export default {
  name: 'VideoPlayerComponent',
  props: {
    // 视频源配置
    sources: {
      type: Array,
      default: () => []
    },
    // 自动播放
    autoplay: {
      type: Boolean,
      default: false
    },
    // 封面图片URL
    poster: {
      type: String,
      default: ''
    },
    // 宽度
    width: {
      type: [Number, String],
      default: '100%'
    },
    // 高度
    height: {
      type: [Number, String],
      default: 'auto'
    }
  },
  emits: ['ready', 'play', 'pause', 'ended', 'error', 'quality-changed'],
  setup(props, { emit }) {
    const videoElement = ref(null);
    const player = ref(null);
    const error = ref('');
    const currentQuality = ref('auto');
    const isFullscreen = ref(false);
    
    // 初始化播放器
    const initializePlayer = () => {
      if (videoElement.value) {
        // 播放器配置选项
        const options = {
          autoplay: props.autoplay,
          controls: true,
          responsive: true,
          fluid: true,
          liveui: true,
          playbackRates: [0.5, 1, 1.5, 2],
          html5: {
            hls: { // 使用 http-streaming 插件的配置
              overrideNative: true,
              withCredentials: false,
              // HLS 特定配置
              enableLowInitialPlaylist: true,
              smoothQualityChange: true
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false
          },
          sources: props.sources.length > 0 ? props.sources : [],
          poster: props.poster || '',
          controlBar: {
            children: [
              'playToggle',
              'progressControl',
              'volumePanel',
              'qualitySelector', // 启用质量选择器
              'fullscreenToggle',
            ]
          },
        };
        
        // 清除之前的错误状态
        error.value = '';
        
        // 创建播放器实例
        player.value = videojs(videoElement.value, options, function() {
          // 播放器准备就绪的回调
          console.log('播放器初始化完成');
          
          // 添加错误处理
          this.on('error', function() {
            const err = this.error();
            const errorMessage = err && err.message ? err.message : '未知错误';
            console.error('视频播放错误:', errorMessage);
            error.value = `播放失败: ${errorMessage}`;
            emit('error', errorMessage);
          });
          
          // 添加事件监听
          this.on('play', () => emit('play'));
          this.on('pause', () => emit('pause'));
          this.on('ended', () => emit('ended'));
          
          // 监听全屏变化
          this.on('fullscreenchange', () => {
            isFullscreen.value = player.value.isFullscreen();
            handleFullscreenChange(isFullscreen.value);
          });
          
          // 监听质量变化
          if (this.qualityLevels && typeof this.qualityLevels === 'function') {
            const qualityLevels = this.qualityLevels();
            qualityLevels.on('change', () => {
              const activeQuality = qualityLevels.selectedIndex > -1 ? 
                `${Math.round(qualityLevels[qualityLevels.selectedIndex].bandwidth / 1000)} kbps` : 
                'auto';
              currentQuality.value = activeQuality;
              emit('quality-changed', activeQuality);
            });
          }
          
          // 优化HLS播放设置
          const isHLS = props.sources.length > 0 && 
            (props.sources[0].type === 'application/x-mpegURL' || 
             props.sources[0].src.toLowerCase().endsWith('.m3u8'));
          
          if (isHLS) {
            console.log('HLS内容被检测到，应用特殊配置');
          }
          
          emit('ready', this);
        });
      }
    };

    // 处理全屏状态变化 - 特别是移动设备横屏处理
    const handleFullscreenChange = (isFullscreen) => {
      // 检测是否为移动设备
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        if (isFullscreen) {
          // 进入全屏时，尝试锁定屏幕为横向
          lockScreenToLandscape();
        } else {
          // 退出全屏时，解除屏幕方向锁定
          unlockScreenOrientation();
        }
      }
    };
    
    // 锁定屏幕为横屏方向
    const lockScreenToLandscape = () => {
      try {
        // 使用屏幕方向API锁定横屏
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(e => {
            console.warn('无法锁定屏幕方向:', e);
          });
        } else if (screen.lockOrientation) {
          screen.lockOrientation('landscape');
        } else if (screen.mozLockOrientation) {
          screen.mozLockOrientation('landscape');
        } else if (screen.msLockOrientation) {
          screen.msLockOrientation('landscape');
        }
      } catch (e) {
        console.warn('锁定屏幕方向失败:', e);
      }
    };
    
    // 解除屏幕方向锁定
    const unlockScreenOrientation = () => {
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        } else if (screen.unlockOrientation) {
          screen.unlockOrientation();
        } else if (screen.mozUnlockOrientation) {
          screen.mozUnlockOrientation();
        } else if (screen.msUnlockOrientation) {
          screen.msUnlockOrientation();
        }
      } catch (e) {
        console.warn('解除屏幕方向锁定失败:', e);
      }
    };

    // 重试播放
    const retryPlayback = () => {
      if (player.value) {
        try {
          player.value.dispose();
          player.value = null;
        } catch(err) {
          console.error('重置播放器失败:', err);
        }
      }
      error.value = '';
      nextTick(() => {
        initializePlayer();
        if (props.sources && props.sources.length > 0) {
          setTimeout(() => {
            if (player.value) player.value.play().catch(e => console.error('重试播放失败:', e));
          }, 500);
        }
      });
    };

    // 更新播放源
    const updateSources = (sources) => {
      if (player.value && sources && sources.length > 0) {
        try {
          error.value = ''; // 清除之前的错误
          player.value.src(sources);
          
          // 对于HLS内容，确保正确加载
          if (sources[0].type === 'application/x-mpegURL' || 
              sources[0].src.toLowerCase().endsWith('.m3u8')) {
            // 短暂延迟后尝试播放，确保HLS内容加载完成
            setTimeout(() => {
              if (props.autoplay && player.value) {
                player.value.play().catch((error) => {
                  console.error('播放失败:', error);
                  // 自动播放失败时，显示友好提示
                  if (error.name === 'NotAllowedError') {
                    error.value = '浏览器阻止了自动播放，请点击播放按钮开始播放';
                  } else {
                    error.value = `播放失败: ${error.message}`;
                  }
                });
              }
            }, 500);
          }
        } catch (error) {
          console.error('设置视频源失败:', error);
          error.value = `无法加载视频: ${error.message}`;
        }
      }
    };
    
    // 监听sources变化，更新播放器源
    watch(() => props.sources, (newSources) => {
      if (newSources && newSources.length > 0) {
        if (player.value) {
          updateSources(newSources);
        }
      }
    }, { deep: true });

    // 监听poster变化
    watch(() => props.poster, (newPoster) => {
      if (player.value && newPoster) {
        player.value.poster(newPoster);
      }
    });

    // 监听autoplay变化
    watch(() => props.autoplay, (newAutoplay) => {
      if (player.value && newAutoplay) {
        player.value.autoplay(newAutoplay);
        player.value.play().catch((error) => {
          console.error('自动播放失败:', error);
          if (error.name === 'NotAllowedError') {
            error.value = '浏览器阻止了自动播放，请点击播放按钮开始播放';
          }
        });
      }
    });

    // 组件挂载后初始化播放器
    onMounted(() => {
      nextTick(() => {
        initializePlayer();
      });
    });
    
    // 组件销毁前释放播放器资源
    onBeforeUnmount(() => {
      // 确保退出全屏并解除屏幕方向锁定
      if (isFullscreen.value) {
        unlockScreenOrientation();
      }
      
      if (player.value) {
        try {
          // 安全地销毁播放器
          player.value.pause();
          player.value.dispose();
          player.value = null;
        } catch (err) {
          console.error('销毁播放器时出错:', err);
        }
      }
    });

    return {
      videoElement,
      player,
      error,
      currentQuality,
      isFullscreen,
      retryPlayback
    };
  }
}
</script>

<style scoped>
.video-player-container {
  width: 100%;
  position: relative;
}

.player-wrapper {
  width: 100%;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.video-js {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .video-js {
    min-height: 200px;
  }
  
  .vjs-big-play-button {
    transform: scale(0.8);
  }
}

/* 错误消息样式 */
.player-error-message {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 10;
  border-radius: 8px;
}

.error-content {
  max-width: 80%;
}

.error-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
}

.retry-button {
  margin-top: 15px;
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover {
  background-color: #45a049;
}
</style> 