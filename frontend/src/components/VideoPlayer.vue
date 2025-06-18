<template>
  <div class="video-player-container">
    <div class="player-wrapper">
      <video ref="videoElement" class="video-js vjs-default-skin vjs-big-play-centered" crossorigin="anonymous"></video>
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
  emits: ['ready', 'play', 'pause', 'ended', 'error'],
  setup(props, { emit }) {
    const videoElement = ref(null);
    const player = ref(null);
    const error = ref('');
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
              'playbackRateMenuButton',
              'fullscreenToggle',
            ],
            volumePanel: {
              inline: false,
              vertical: true
            }
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

          // 自定义小喇叭点击行为
          const muteButton = this.el().querySelector('.vjs-mute-control');
          if (muteButton) {
            // 移除原有的点击事件
            muteButton.onclick = null;
            
            // 添加新的点击事件处理
            muteButton.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              
              // 只显示音量控制条，不触发静音
              showVolumeControl();
            });
            
            // 添加双击事件用于静音/取消静音
            muteButton.addEventListener('dblclick', (event) => {
              event.preventDefault();
              event.stopPropagation();
              
              // 双击时切换静音状态
              const isMuted = !player.value.muted();
              player.value.muted(isMuted);
              updateVolumeBar(isMuted ? 0 : player.value.volume());
            });
          }
          
          // 优化倍速控制按钮
          const playbackRateButton = this.el().querySelector('.vjs-playback-rate');
          if (playbackRateButton) {
            // 监听倍速变化
            this.on('ratechange', () => {
              const currentRate = player.value.playbackRate();
              // 显示当前倍速提示
              showTip(`播放速度: ${currentRate}x`);
            });
            
            // 添加双击事件用于快速恢复1x倍速
            playbackRateButton.addEventListener('dblclick', (event) => {
              event.preventDefault();
              event.stopPropagation();
              
              // 双击时恢复正常速度
              player.value.playbackRate(1);
              showTip('播放速度: 1x');
            });
          }
          
          // 修复音量控制条初始值
          setTimeout(() => {
            const volumeLevel = this.el().querySelector('.vjs-volume-level');
            if (volumeLevel) {
              const currentVolume = player.value.muted() ? 0 : player.value.volume();
              volumeLevel.style.height = `${currentVolume * 100}%`;
            }
          }, 100);
          
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

    // 更新音量条位置
    const updateVolumeBar = (volume) => {
      if (!player.value) return;
      
      const playerEl = player.value.el();
      if (!playerEl) return;
      
      const volumeLevel = playerEl.querySelector('.vjs-volume-level');
      if (volumeLevel) {
        // 直接设置音量条高度
        volumeLevel.style.height = `${volume * 100}%`;
      }
    };
    
    // 临时显示音量控制条
    let volumeControlTimeout = null;
    const showVolumeControl = () => {
      if (!player.value) return;
      
      const playerEl = player.value.el();
      if (!playerEl) return;
      
      // 确保控制栏显示
      player.value.userActive(true);
      
      // 添加临时活动类
      const volumePanel = playerEl.querySelector('.vjs-volume-panel');
      if (volumePanel) {
        volumePanel.classList.add('vjs-hover');
        volumePanel.classList.add('vjs-volume-panel-active');
        
        // 确保音量控制条可见
        const volumeControl = playerEl.querySelector('.vjs-volume-control');
        if (volumeControl) {
          // 获取当前音量
          const currentVolume = player.value.muted() ? 0 : player.value.volume();
          
          // 先设置音量条位置，再显示音量控制条
          updateVolumeBar(currentVolume);
          
          // 确保音量控制条可见
          volumeControl.style.visibility = 'visible';
          volumeControl.style.opacity = '1';
          volumeControl.style.pointerEvents = 'auto';
        }
        
        // 清除之前的定时器
        if (volumeControlTimeout) {
          clearTimeout(volumeControlTimeout);
        }
        
        // 设置新的定时器，3秒后隐藏音量控制条
        volumeControlTimeout = setTimeout(() => {
          volumePanel.classList.remove('vjs-hover');
          volumePanel.classList.remove('vjs-volume-panel-active');
        }, 3000);
      }
    };
    
    // 显示提示信息
    let tipTimeout = null;
    const showTip = (message) => {
      if (!player.value) return;
      
      const playerEl = player.value.el();
      if (!playerEl) return;
      
      let tipElement = playerEl.querySelector('.vjs-tip-message');
      if (!tipElement) {
        tipElement = document.createElement('div');
        tipElement.className = 'vjs-tip-message';
        playerEl.appendChild(tipElement);
      }
      
      tipElement.textContent = message;
      tipElement.style.display = 'block';
      
      // 清除之前的定时器
      if (tipTimeout) {
        clearTimeout(tipTimeout);
      }
      
      // 设置新的定时器，4秒后隐藏提示
      tipTimeout = setTimeout(() => {
        tipElement.style.display = 'none';
      }, 4000);
    };

    // 处理键盘事件
    const handleKeyboardEvents = (event) => {
      if (!player.value) return;
      
      // 当输入框获取焦点时，不处理键盘事件
      if (document.activeElement && 
          (document.activeElement.tagName === 'INPUT' || 
           document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      const playerEl = document.querySelector('.video-player-container');
      // 检查播放器是否可见或在视口内
      if (!playerEl || !isElementVisible(playerEl)) return;
      
      switch (event.key) {
        case 'ArrowLeft': // 左箭头 - 快退
          event.preventDefault();
          player.value.currentTime(Math.max(0, player.value.currentTime() - 10));
          break;
        case 'ArrowRight': // 右箭头 - 快进
          event.preventDefault();
          player.value.currentTime(Math.min(player.value.duration(), player.value.currentTime() + 10));
          break;
        case ' ': // 空格键 - 播放/暂停
          event.preventDefault();
          if (player.value.paused()) {
            player.value.play();
          } else {
            player.value.pause();
          }
          break;
        case 'f': // F键 - 全屏
        case 'F':
          event.preventDefault();
          if (player.value.isFullscreen()) {
            player.value.exitFullscreen();
          } else {
            player.value.requestFullscreen();
          }
          break;
        case 'm': // M键 - 静音
        case 'M':
          event.preventDefault();
          const isMuted = !player.value.muted();
          player.value.muted(isMuted);
          updateVolumeBar(isMuted ? 0 : player.value.volume());
          showVolumeControl();
          break;
        case 'ArrowUp': // 上箭头 - 增加音量
          event.preventDefault();
          try {
            const vol = player.value.volume();
            const newVolume = Math.min(1, vol + 0.1);
            player.value.volume(newVolume);
            updateVolumeBar(newVolume);
            showVolumeControl();
          } catch (e) {
            console.error('调整音量失败:', e);
          }
          break;
        case 'ArrowDown': // 下箭头 - 减小音量
          event.preventDefault();
          try {
            const vol = player.value.volume();
            const newVolume = Math.max(0, vol - 0.1);
            player.value.volume(newVolume);
            updateVolumeBar(newVolume);
            showVolumeControl();
          } catch (e) {
            console.error('调整音量失败:', e);
          }
          break;
        case '+': // + 键 - 增加播放速度
        case '=': // = 键 (通常与 + 在同一个键)
          event.preventDefault();
          try {
            const rates = player.value.playbackRates();
            const currentRate = player.value.playbackRate();
            const currentIndex = rates.indexOf(currentRate);
            if (currentIndex < rates.length - 1) {
              const newRate = rates[currentIndex + 1];
              player.value.playbackRate(newRate);
              showTip(`播放速度: ${newRate}x`);
            }
          } catch (e) {
            console.error('调整播放速度失败:', e);
          }
          break;
        case '-': // - 键 - 减小播放速度
          event.preventDefault();
          try {
            const rates = player.value.playbackRates();
            const currentRate = player.value.playbackRate();
            const currentIndex = rates.indexOf(currentRate);
            if (currentIndex > 0) {
              const newRate = rates[currentIndex - 1];
              player.value.playbackRate(newRate);
              showTip(`播放速度: ${newRate}x`);
            }
          } catch (e) {
            console.error('调整播放速度失败:', e);
          }
          break;
        case '0': // 0 键 - 重置播放速度为 1x
        case '1': // 1 键 - 设置播放速度为 1x
          event.preventDefault();
          try {
            player.value.playbackRate(1);
            showTip('播放速度: 1x');
          } catch (e) {
            console.error('重置播放速度失败:', e);
          }
          break;
        case '2': // 2 键 - 设置播放速度为 2x
          event.preventDefault();
          try {
            player.value.playbackRate(2);
            showTip('播放速度: 2x');
          } catch (e) {
            console.error('设置播放速度失败:', e);
          }
          break;
        case '5': // 5 键 - 设置播放速度为 0.5x
          event.preventDefault();
          try {
            player.value.playbackRate(0.5);
            showTip('播放速度: 0.5x');
          } catch (e) {
            console.error('设置播放速度失败:', e);
          }
          break;
      }
    };
    
    // 检查元素是否在视口内
    const isElementVisible = (el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    // 组件挂载后初始化播放器
    onMounted(() => {
      nextTick(() => {
        initializePlayer();
        
        // 添加全局键盘事件监听
        document.addEventListener('keydown', handleKeyboardEvents);
      });
    });
    
    // 组件销毁前释放播放器资源
    onBeforeUnmount(() => {
      // 确保退出全屏并解除屏幕方向锁定
      if (isFullscreen.value) {
        unlockScreenOrientation();
      }
      
      // 移除键盘事件监听
      document.removeEventListener('keydown', handleKeyboardEvents);
      
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

/* 音量控制样式优化 */
:deep(.video-js .vjs-volume-panel) {
  transition: none !important;
  margin-right: 0.8em;
  width: 3em;
}

:deep(.video-js .vjs-volume-panel.vjs-hover) {
  width: 3em !important;
}

:deep(.video-js .vjs-volume-panel .vjs-mute-control) {
  width: 3em;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

/* 默认隐藏音量控制条 */
:deep(.video-js .vjs-volume-panel .vjs-volume-control.vjs-volume-vertical) {
  visibility: hidden !important;
  opacity: 0 !important;
  width: 3em !important;
  height: 10em !important;
  margin: 0 !important;
  position: absolute !important;
  bottom: 40px !important;
  left: 0 !important;
  transform: none !important;
  z-index: 10 !important;
  background-color: rgba(43, 51, 63, 0.9) !important;
  border-radius: 5px !important;
  padding: 5px !important;
  pointer-events: none !important;
  display: block !important;
  transition: none !important;
}

/* 悬停或活动状态时显示音量控制条 */
:deep(.video-js .vjs-volume-panel:hover .vjs-volume-control.vjs-volume-vertical),
:deep(.video-js .vjs-volume-panel:active .vjs-volume-control.vjs-volume-vertical),
:deep(.video-js .vjs-volume-panel:focus .vjs-volume-control.vjs-volume-vertical),
:deep(.video-js .vjs-volume-panel.vjs-volume-panel-active .vjs-volume-control.vjs-volume-vertical) {
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  transition: none !important;
}

/* 音量滑块样式 */
:deep(.video-js .vjs-volume-panel .vjs-volume-bar.vjs-slider-vertical) {
  margin: 1.35em auto 0;
  width: 0.4em;
  height: 7em;
  transition: none !important;
}

:deep(.video-js .vjs-volume-panel .vjs-volume-level) {
  background-color: #4CAF50;
  width: 0.4em;
  transition: none !important;
}

/* 禁用所有音量相关元素的过渡效果 */
:deep(.video-js .vjs-volume-panel *),
:deep(.video-js .vjs-volume-control *),
:deep(.video-js .vjs-volume-bar *),
:deep(.video-js .vjs-volume-level) {
  transition: none !important;
}

/* 提示信息样式 */
:deep(.video-js .vjs-tip-message) {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(43, 51, 63, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 100;
  display: none;
  font-family: Arial, sans-serif;
  text-align: center;
  max-width: 80%;
  white-space: nowrap;
}

/* 倍速菜单样式优化 */
:deep(.video-js .vjs-playback-rate) {
  width: 4em !important;
  font-size: 1em;
  order: 3;
  margin-right: 0.8em;
}

:deep(.video-js .vjs-playback-rate .vjs-playback-rate-value) {
  font-size: 1.2em;
  line-height: 2.4;
  font-weight: bold;
  color: #ffffff;
  width: 100%;
  text-align: center;
  padding: 0 0.2em;
}

:deep(.video-js .vjs-menu-button-popup .vjs-menu) {
  left: -1em;
}

:deep(.video-js .vjs-playback-rate .vjs-menu) {
  width: 6em;
  left: -1.5em;
}

:deep(.video-js .vjs-menu-content) {
  padding: 0.4em 0;
}

:deep(.video-js .vjs-menu li) {
  padding: 0.3em 0.5em;
  font-size: 1.1em;
  text-align: center;
}

:deep(.video-js .vjs-menu li.vjs-selected) {
  background-color: rgba(216, 231, 216, 0.8);
}

:deep(.video-js .vjs-menu li:hover) {
  background-color: rgba(172, 181, 173, 0.5);
}

/* 控制栏元素间距优化 */
:deep(.video-js .vjs-control) {
  width: 3em;
}

:deep(.video-js .vjs-fullscreen-control) {
  width: 3.2em;
}

/* 确保控制栏有足够的空间 */
:deep(.video-js .vjs-control-bar) {
  padding: 0 0.5em;
  display: flex;
  justify-content: space-between;
}

/* 进度条与其他控制元素的间距 */
:deep(.video-js .vjs-progress-control) {
  margin-right: 0.5em;
}

/* 优化控制栏整体布局 */
:deep(.video-js .vjs-control-bar .vjs-control) {
  margin: 0 0.1em;
}
</style> 