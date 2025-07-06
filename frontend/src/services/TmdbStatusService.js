/**
 * TMDB 状态管理服务
 * 用于缓存 TMDB API 状态，避免重复请求
 */

// 缓存键名
const CACHE_KEY = 'tmdb_status_cache';
// 缓存有效期（毫秒），默认1小时
const CACHE_TTL = 60 * 60 * 1000;

/**
 * TMDB 状态服务
 */
export default {
  /**
   * 获取 TMDB 状态
   * 如果缓存中有有效数据，则使用缓存
   * 否则从服务器获取并缓存结果
   * @returns {Promise<Object>} TMDB 状态对象
   */
  async getTmdbStatus() {
    // 尝试从缓存获取
    const cachedStatus = this.getFromCache();
    if (cachedStatus) {
      console.log('使用缓存的 TMDB 状态');
      return cachedStatus;
    }

    // 缓存不存在或已过期，从服务器获取
    console.log('从服务器获取 TMDB 状态');
    try {
      const response = await fetch('/app/api/settings/tmdb_status');
      if (!response.ok) {
        throw new Error(`获取 TMDB 状态失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 缓存结果
      this.saveToCache(data);
      
      return data;
    } catch (error) {
      console.error('获取 TMDB 状态出错:', error);
      // 出错时返回默认值
      return { enabled: false };
    }
  },
  
  /**
   * 从缓存中获取 TMDB 状态
   * @returns {Object|null} 缓存的状态对象，如果缓存不存在或已过期则返回 null
   */
  getFromCache() {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (now - timestamp > CACHE_TTL) {
        console.log('TMDB 状态缓存已过期');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('读取 TMDB 状态缓存出错:', error);
      return null;
    }
  },
  
  /**
   * 将 TMDB 状态保存到缓存
   * @param {Object} data TMDB 状态对象
   */
  saveToCache(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('TMDB 状态已缓存');
    } catch (error) {
      console.error('缓存 TMDB 状态出错:', error);
    }
  },
  
  /**
   * 清除缓存
   */
  clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('TMDB 状态缓存已清除');
    } catch (error) {
      console.error('清除 TMDB 状态缓存出错:', error);
    }
  }
}; 