/**
 * 高级外接数据源模板
 * 包含以下功能：
 * 1. 跨域代理请求可以通过参数returnCookies=true开启headers中返回cookies
 * 2. 支持桥接存储 - 允许外接数据源使用localStorage
 * 3. 支持getPlayUrl - 通过vod_play_require_cid: true开启二次请求获取播放地址
 * 
 * 使用说明：
 * 1. 将此文件复制到assets/ext/目录下，并重命名为你的数据源名称.js
 * 2. 修改基本信息和相关方法
 * 3. 实现必要的方法：searchMovies和getMovieDetail
 * 4. 如需二次请求播放地址，请实现getPlayUrl方法
 */

module.exports = {
  // =====================================================================
  // 基本信息 - 请修改为你的数据源信息
  // =====================================================================
  id: 'advanced_template',                 // 唯一标识，建议使用英文和数字
  name: '高级数据源模板',                   // 显示名称
  baseUrl: 'https://api.example.com',      // API基础URL
  
  // =====================================================================
  // 存储相关配置 - 用于桥接localStorage
  // =====================================================================
  _storageBridge: null,                    // 存储桥接客户端实例
  _cacheKeys: {                            // 缓存键名
    userData: 'template_user_data',
    searchHistory: 'template_search_history',
    cookies: 'template_cookies',
    favorites: 'template_favorites'
  },
  _userData: null,                         // 用户数据
  _searchHistory: [],                      // 搜索历史
  _cookies: null,                          // Cookies缓存
  _favorites: [],                          // 收藏列表
  
  /**
   * 初始化方法 - 在数据源加载时自动调用
   */
  async init() {
    console.log(`[${this.name}] 初始化...`);
    
    try {
      // 加载存储桥接客户端
      try {
        // 首先尝试从前端项目加载
        const bridgeModule = await lib.load('storage-bridge-client');
        if (bridgeModule && bridgeModule.createStorageBridge) {
          this._storageBridge = bridgeModule.createStorageBridge(this.id);
          console.log(`[${this.name}] 存储桥接客户端加载成功 (前端模块)`);
        } 
        else {
          console.warn(`[${this.name}] 无法从前端模块创建存储桥接客户端`);
        }
      } catch (error) {
        console.warn(`[${this.name}] 从前端加载存储桥接客户端失败: ${error.message}`);
        
        // 备用方案：尝试从工具模块加载
        try {
          const externalStorageHelper = await lib.load('utils/externalStorageHelper');
          if (externalStorageHelper && externalStorageHelper.createStorageBridge) {
            this._storageBridge = externalStorageHelper.createStorageBridge(this.id);
            console.log(`[${this.name}] 存储桥接客户端加载成功 (外部模块)`);
          } else {
            console.warn(`[${this.name}] 无法从外部模块创建存储桥接客户端`);
          }
        } catch (fallbackError) {
          console.warn(`[${this.name}] 从外部模块加载存储桥接客户端也失败: ${fallbackError.message}`);
        }
      }
      
      // 如果存储桥接客户端成功加载，从存储加载数据
      if (this._storageBridge) {
        await this._loadFromStorage();
      } else {
        console.warn(`[${this.name}] 存储桥接客户端未加载，将使用内存缓存`);
      }
      
      console.log(`[${this.name}] 初始化完成`);
    } catch (error) {
      console.error(`[${this.name}] 初始化失败:`, error);
    }
  },
  
  // =====================================================================
  // 存储桥接相关方法
  // =====================================================================
  
  /**
   * 从存储加载数据
   */
  async _loadFromStorage() {
    if (!this._storageBridge) return;
    
    try {
      // 加载用户数据
      const userDataStr = await this._storageBridge.getItem(this._cacheKeys.userData);
      if (userDataStr) {
        this._userData = JSON.parse(userDataStr);
        console.log(`[${this.name}] 已从存储加载用户数据`);
      }
      
      // 加载搜索历史
      const searchHistoryStr = await this._storageBridge.getItem(this._cacheKeys.searchHistory);
      if (searchHistoryStr) {
        this._searchHistory = JSON.parse(searchHistoryStr);
        console.log(`[${this.name}] 已从存储加载搜索历史: ${this._searchHistory.length} 条记录`);
      }
      
      // 加载Cookies
      const cookiesStr = await this._storageBridge.getItem(this._cacheKeys.cookies);
      if (cookiesStr) {
        this._cookies = JSON.parse(cookiesStr);
        console.log(`[${this.name}] 已从存储加载Cookies`);
      }
      
      // 加载收藏
      const favoritesStr = await this._storageBridge.getItem(this._cacheKeys.favorites);
      if (favoritesStr) {
        this._favorites = JSON.parse(favoritesStr);
        console.log(`[${this.name}] 已从存储加载收藏: ${this._favorites.length} 条记录`);
      }
    } catch (error) {
      console.error(`[${this.name}] 从存储加载数据失败:`, error);
    }
  },
  
  /**
   * 保存数据到存储
   * @param {string} key - 缓存键名
   * @param {any} value - 要保存的数据
   */
  async _saveToStorage(key, value) {
    if (!this._storageBridge) return;
    
    try {
      await this._storageBridge.setItem(key, JSON.stringify(value));
      console.log(`[${this.name}] 数据已保存到存储: ${key}`);
    } catch (error) {
      console.error(`[${this.name}] 保存数据失败: ${key}`, error);
    }
  },
  
  /**
   * 添加搜索关键词到历史记录
   * @param {string} keyword - 搜索关键词
   */
  addSearchHistory(keyword) {
    if (!keyword || typeof keyword !== 'string') return;
    
    // 如果已存在，则移除旧的
    const index = this._searchHistory.indexOf(keyword);
    if (index !== -1) {
      this._searchHistory.splice(index, 1);
    }
    
    // 添加到开头
    this._searchHistory.unshift(keyword);
    
    // 限制最多保存50条
    if (this._searchHistory.length > 50) {
      this._searchHistory.pop();
    }
    
    // 保存到存储
    this._saveToStorage(this._cacheKeys.searchHistory, this._searchHistory);
  },
  
  /**
   * 获取搜索历史记录
   * @returns {Array<string>} 搜索历史记录
   */
  getSearchHistory() {
    return [...this._searchHistory];
  },
  
  /**
   * 添加收藏
   * @param {Object} item - 收藏项
   */
  addFavorite(item) {
    if (!item || !item.id) return;
    
    // 检查是否已经收藏
    const existingIndex = this._favorites.findIndex(f => f.id === item.id);
    if (existingIndex !== -1) {
      return false; // 已经收藏过
    }
    
    // 添加收藏时间
    const favoriteItem = {
      ...item,
      favoriteTime: Date.now()
    };
    
    // 添加到收藏列表
    this._favorites.push(favoriteItem);
    
    // 保存到存储
    this._saveToStorage(this._cacheKeys.favorites, this._favorites);
    
    return true; // 收藏成功
  },
  
  /**
   * 移除收藏
   * @param {string} id - 收藏项ID
   */
  removeFavorite(id) {
    if (!id) return false;
    
    // 查找并移除
    const index = this._favorites.findIndex(f => f.id === id);
    if (index !== -1) {
      this._favorites.splice(index, 1);
      
      // 保存到存储
      this._saveToStorage(this._cacheKeys.favorites, this._favorites);
      
      return true; // 移除成功
    }
    
    return false; // 未找到收藏项
  },
  
  /**
   * 获取收藏列表
   * @returns {Array<Object>} 收藏列表
   */
  getFavorites() {
    return [...this._favorites];
  },
  
  // =====================================================================
  // Cookie管理相关方法 - 使用跨域代理的returnCookies功能
  // =====================================================================
  
  /**
   * 获取缓存的Cookies
   * 如果缓存中没有，则从网站获取
   */
  async getCachedCookies() {
    if (this._cookies) {
      console.log(`[${this.name}] 使用缓存的Cookies`);
      return this._cookies;
    }
    
    try {
      // 从网站获取新的Cookies
      const cookies = await this.getCookiesFromWebsite();
      
      // 缓存Cookies
      this._cookies = cookies;
      
      // 保存到存储
      this._saveToStorage(this._cacheKeys.cookies, cookies);
      
      return cookies;
    } catch (error) {
      console.error(`[${this.name}] 获取Cookies失败:`, error);
      return {}; // 返回空对象
    }
  },
  
  /**
   * 从网站获取Cookies
   * 使用跨域代理的returnCookies功能
   */
  async getCookiesFromWebsite() {
    try {
      console.log(`[${this.name}] 获取网站Cookies...`);
      
      // 设置请求头
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      };
      
      // 使用跨域代理请求网站主页
      // 注意：需要在URL中添加returnCookies=true参数
      const targetUrl = this.baseUrl;
      const encodedUrl = encodeURIComponent(targetUrl);
      const proxyUrl = `/api/proxy?returnCookies=true&url=${encodedUrl}`;
      
      console.log(`[${this.name}] 使用代理URL请求网站: ${proxyUrl}`);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      // 从响应头中获取cookies
      const cookiesJSON = response.headers.get('X-Proxy-Cookies');
      if (cookiesJSON) {
        try {
          const cookies = JSON.parse(cookiesJSON);
          console.log(`[${this.name}] 从代理响应头获取到Cookies:`, cookies);
          return cookies;
        } catch (parseError) {
          console.error(`[${this.name}] 解析Cookies JSON失败:`, parseError);
          throw new Error('解析Cookies失败');
        }
      } else {
        console.warn(`[${this.name}] 响应头中没有找到X-Proxy-Cookies`);
        throw new Error('响应头中没有找到Cookies');
      }
    } catch (error) {
      console.error(`[${this.name}] 获取Cookies失败:`, error);
      return {}; // 返回空对象
    }
  },
  
  /**
   * 使用代理发送请求并处理Cookies
   * @param {string} url - 目标URL
   * @param {Object} options - 请求选项
   * @param {boolean} returnCookies - 是否返回Cookies
   */
  async sendProxyRequest(url, options = {}, returnCookies = false) {
    try {
      // 默认请求头
      const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      };
      
      // 合并请求头
      const headers = {
        ...defaultHeaders,
        ...(options.headers || {})
      };
      
      // 如果有缓存的Cookies，添加到请求头
      const cookies = await this.getCachedCookies();
      if (cookies && Object.keys(cookies).length > 0) {
        const cookieStr = Object.entries(cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ');
        headers['Cookie'] = cookieStr;
      }
      
      // 编码URL并构建代理URL
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy${returnCookies ? '?returnCookies=true' : ''}${returnCookies ? '&' : '?'}url=${encodedUrl}`;
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      // 如果需要返回Cookies，从响应头中获取
      if (returnCookies) {
        const cookiesJSON = response.headers.get('X-Proxy-Cookies');
        if (cookiesJSON) {
          try {
            const newCookies = JSON.parse(cookiesJSON);
            
            // 更新缓存的Cookies
            this._cookies = {
              ...this._cookies,
              ...newCookies
            };
            
            // 保存到存储
            this._saveToStorage(this._cacheKeys.cookies, this._cookies);
          } catch (error) {
            console.error(`[${this.name}] 解析新Cookies失败:`, error);
          }
        }
      }
      
      // 返回响应
      return response;
    } catch (error) {
      console.error(`[${this.name}] 代理请求失败:`, error);
      throw error;
    }
  },
  
  // =====================================================================
  // 必要实现的数据源方法
  // =====================================================================
  
  /**
   * 搜索影片
   * @param {string} keyword - 搜索关键词
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   */
  async searchMovies(keyword, page = 1, pageSize = 20) {
    console.log(`[${this.name}] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
    
    // 添加到搜索历史
    this.addSearchHistory(keyword);
    
    try {
      // 构建API请求URL
      const url = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`;
      
      // 发送请求
      const response = await this.sendProxyRequest(url);
      const data = await response.json();
      
      // 处理响应数据
      if (!data || !data.results) {
        throw new Error('无效的API响应');
      }
      
      // 转换为标准格式
      const dataList = data.results.map(item => ({
        vod_id: item.id,
        vod_name: item.title,
        vod_pic: item.cover,
        vod_remarks: item.remarks || '',
        vod_year: item.year || '',
        vod_area: item.area || '',
        type_name: item.category || '',
        vod_content: item.description || '',
        vod_play_require_cid: true // 标记需要二次请求播放地址
      }));
      
      return {
        dataList: dataList,
        total: data.total || dataList.length,
        pagecount: data.pageCount || Math.ceil((data.total || 0) / pageSize),
        size: pageSize,
        current: page
      };
    } catch (error) {
      console.error(`[${this.name}] 搜索失败:`, error);
      // 返回空结果
      return {
        dataList: [],
        total: 0,
        pagecount: 0,
        size: pageSize,
        current: page
      };
    }
  },
  
  /**
   * 获取影片详情
   * @param {string} id - 影片ID
   */
  async getMovieDetail(id) {
    console.log(`[${this.name}] 获取详情: ${id}`);
    
    try {
      // 构建API请求URL
      const url = `${this.baseUrl}/detail/${id}`;
      
      // 发送请求
      const response = await this.sendProxyRequest(url);
      const data = await response.json();
      
      // 处理响应数据
      if (!data || !data.detail) {
        throw new Error('无效的API响应');
      }
      
      // 转换为标准格式
      const detail = {
        vod_id: data.detail.id,
        vod_name: data.detail.title,
        vod_pic: data.detail.cover,
        vod_blurb: data.detail.summary || '',
        vod_content: data.detail.description || '',
        vod_play_url: data.detail.playList.map(item => `${item.name}$${item.id}`).join('#'),
        vod_year: data.detail.year || '',
        vod_area: data.detail.area || '',
        vod_remarks: data.detail.remarks || '',
        type_name: data.detail.category || '',
        vod_actor: data.detail.actors || '',
        vod_director: data.detail.directors || '',
        vod_play_require_cid: true // 标记需要二次请求播放地址
      };
      
      return detail;
    } catch (error) {
      console.error(`[${this.name}] 获取详情失败:`, error);
      // 返回空结果
      return null;
    }
  },
  
  /**
   * 获取播放地址
   * @param {string} cid - 内容ID
   * @param {Object} options - 可选参数
   */
  async getPlayUrl(cid, options = {}) {
    console.log(`[${this.name}] 获取播放URL: ${cid}`);
    
    try {
      // 构建API请求URL
      const url = `${this.baseUrl}/play/${cid}`;
      
      // 发送请求
      const response = await this.sendProxyRequest(url);
      const data = await response.json();
      
      // 处理响应数据
      if (!data || !data.url) {
        throw new Error('无效的API响应');
      }
      
      // 返回播放地址
      return data.url;
    } catch (error) {
      console.error(`[${this.name}] 获取播放URL失败:`, error);
      throw error;
    }
  },
  
  // =====================================================================
  // 辅助方法
  // =====================================================================
  
  /**
   * 移除HTML标签
   * @param {string} text - 包含HTML标签的文本
   * @returns {string} 移除HTML标签后的文本
   */
  removeHtmlTags(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '');
  },
  
  /**
   * 格式化数字
   * @param {number} num - 数字
   * @returns {string} 格式化后的字符串
   */
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  }
}; 