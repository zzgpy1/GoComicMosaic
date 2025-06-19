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

<style scoped src="@/styles/VideoPlayer.css"></style>