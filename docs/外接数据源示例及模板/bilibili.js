/**
 * 哔哩哔哩(Bilibili)外接数据源
 * 
 * 严格按照b.py的实现逻辑进行JavaScript转换
 */

module.exports = {
  // 基本信息
  id: 'bilibili',
  name: '哔哩哔哩',
  baseUrl: 'https://api.bilibili.com',
  
  // 添加缓存相关属性
  _cookiesCache: null,
  _cookiesCacheTime: 0,
  _cookiesCacheExpire: 30 * 60 * 1000, // 30分钟过期时间（从5分钟延长到30分钟）
  
  // 添加WBI密钥缓存
  _wbiKeysCache: null,
  _wbiKeysCacheTime: 0,
  _wbiKeysCacheExpire: 12 * 60 * 60 * 1000, // 12小时过期时间（从1小时延长到12小时）
  
  // 本地存储键名
  _storageKeys: {
    cookies: 'bilibili_cookies_cache',
    cookiesTime: 'bilibili_cookies_cache_time',
    wbiKeys: 'bilibili_wbi_keys_cache',
    wbiKeysTime: 'bilibili_wbi_keys_cache_time'
  },
  
  // 存储桥接相关
  _storageBridge: null,
  
  // 初始化方法
  async init() {
    console.log(`[${this.name}] 初始化...`);
    try {
      // 预加载依赖库
      this.cryptoJs = await lib.load('crypto-js');
      if (this.cryptoJs && this.cryptoJs.MD5) {
        console.log('[哔哩哔哩] CryptoJS加载成功，MD5函数可用');
      } else {
        console.warn('[哔哩哔哩] CryptoJS加载成功，但MD5函数不可用');
      }
      
      // 加载存储桥接工具
      try {
        // 首先尝试从前端项目加载
        const bridgeModule = await lib.load('storage-bridge-client');
        if (bridgeModule && bridgeModule.createStorageBridge) {
          // 创建存储桥接客户端
          this._storageBridge = bridgeModule.createStorageBridge(this.id);
          console.log('[哔哩哔哩] 存储桥接客户端创建成功 (前端模块)');
        } 
      } catch (storageError) {
        console.warn('[哔哩哔哩] 加载存储桥接工具失败:', storageError);
        this._storageBridge = null;
      }
      
      // 尝试从本地存储加载缓存
      await this._loadCachesFromStorage();
      
      // 初始化时预加载cookies
      await this.getCachedBilibiliCookies();
    } catch (error) {
      console.error('[哔哩哔哩] 初始化失败:', error);
    }
  },
  
  /**
   * 从本地存储加载缓存
   */
  async _loadCachesFromStorage() {
    try {
      // 如果没有存储桥接客户端，则跳过
      if (!this._storageBridge) {
        console.log('[哔哩哔哩] 未找到存储桥接客户端，跳过加载缓存');
        return;
      }
      
      // 加载cookies缓存
      const cookiesStr = await this._storageBridge.getItem(this._storageKeys.cookies);
      const cookiesTimeStr = await this._storageBridge.getItem(this._storageKeys.cookiesTime);
      
      if (cookiesStr && cookiesTimeStr) {
        try {
          this._cookiesCache = JSON.parse(cookiesStr);
          this._cookiesCacheTime = parseInt(cookiesTimeStr, 10);
          console.log('[哔哩哔哩] 从本地存储加载cookies缓存成功');
        } catch (e) {
          console.error('[哔哩哔哩] 解析cookies缓存失败:', e);
          this._cookiesCache = null;
          this._cookiesCacheTime = 0;
        }
      }
      
      // 加载WBI密钥缓存
      const wbiKeysStr = await this._storageBridge.getItem(this._storageKeys.wbiKeys);
      const wbiKeysTimeStr = await this._storageBridge.getItem(this._storageKeys.wbiKeysTime);
      
      if (wbiKeysStr && wbiKeysTimeStr) {
        try {
          this._wbiKeysCache = JSON.parse(wbiKeysStr);
          this._wbiKeysCacheTime = parseInt(wbiKeysTimeStr, 10);
          console.log('[哔哩哔哩] 从本地存储加载WBI密钥缓存成功');
    } catch (e) {
          console.error('[哔哩哔哩] 解析WBI密钥缓存失败:', e);
          this._wbiKeysCache = null;
          this._wbiKeysCacheTime = 0;
        }
      }
    } catch (error) {
      console.error('[哔哩哔哩] 从本地存储加载缓存失败:', error);
    }
  },
  
  /**
   * 从存储中异步获取数据
   * @param {string} key - 存储键名
   * @returns {Promise<string|null>} 存储的值
   */
  async _getFromStorage(key) {
    try {
      // 如果有存储桥接客户端，使用它
      if (this._storageBridge) {
        return await this._storageBridge.getItem(key);
      }
      
      return null;
    } catch (error) {
      console.error(`[哔哩哔哩] 从存储获取数据失败 (${key}):`, error);
      return null;
    }
  },
  
  /**
   * 将缓存保存到本地存储
   * @param {string} key - 存储键名
   * @param {any} value - 要存储的值
   */
  _saveToStorage(key, value) {
    try {
      // 如果有存储桥接客户端，使用它
      if (this._storageBridge) {
        this._storageBridge.setItem(key, value);
        console.log(`[哔哩哔哩] 数据已保存到存储 (${key})`);
      }
    } catch (error) {
      console.error(`[哔哩哔哩] 保存到本地存储失败 (${key}):`, error);
    }
  },
  
  /**
   * 获取缓存的Cookies，如果缓存过期或不存在则重新获取
   */
  async getCachedBilibiliCookies() {
    const now = Date.now();
    
    // 检查缓存是否存在且未过期
    if (this._cookiesCache && (now - this._cookiesCacheTime < this._cookiesCacheExpire)) {
      console.log('[哔哩哔哩] 使用内存中缓存的Cookies');
      return this._cookiesCache;
    }
    
    // 缓存不存在或已过期，重新获取
    console.log('[哔哩哔哩] Cookies缓存过期或不存在，重新获取');
    this._cookiesCache = await this.getBilibiliCookies();
    this._cookiesCacheTime = now;
    
    // 保存到本地存储
    this._saveToStorage(this._storageKeys.cookies, this._cookiesCache);
    this._saveToStorage(this._storageKeys.cookiesTime, this._cookiesCacheTime);
    
    return this._cookiesCache;
  },
  
  /**
   * 获取缓存的WBI密钥，如果缓存过期或不存在则重新获取
   */
  async getCachedWbiKeys() {
    const now = Date.now();
    
    // 检查缓存是否存在且未过期
    if (this._wbiKeysCache && (now - this._wbiKeysCacheTime < this._wbiKeysCacheExpire)) {
      console.log('[哔哩哔哩] 使用内存中缓存的WBI密钥');
      return this._wbiKeysCache;
    }
    
    // 缓存不存在或已过期，重新获取
    console.log('[哔哩哔哩] WBI密钥缓存过期或不存在，重新获取');
    
    // 获取基础Cookies
    const cookies = await this.getCachedBilibiliCookies();
    const cookieStr = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
      const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Cookie': cookieStr
    };
    
    const url = `${this.baseUrl}/x/web-interface/nav`;
    
    // 使用addCorsProxy添加代理
    const proxyUrl = proxy.addCorsProxy(url, headers);
    
    // 发送请求
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data) {
      const wbiImg = data.data.wbi_img;
      const imgUrl = wbiImg.img_url;
      const subUrl = wbiImg.sub_url;
      
      console.log('[哔哩哔哩] 获取到WBI图片URL:', imgUrl, subUrl);
      
      // 修改正则表达式，从URL中提取文件名（不包含扩展名）
      const extractKey = (url) => {
        const match = url.match(/\/([^/]+)\.\w+$/);
        return match ? match[1] : '';
      };

      const imgKey = extractKey(imgUrl);
      const subKey = extractKey(subUrl);
      
      console.log('[哔哩哔哩] 提取的WBI密钥:', imgKey, subKey);
      
      if (imgKey && subKey) {
        // 更新缓存
        this._wbiKeysCache = { imgKey, subKey };
        this._wbiKeysCacheTime = now;
        
        // 保存到本地存储
        this._saveToStorage(this._storageKeys.wbiKeys, this._wbiKeysCache);
        this._saveToStorage(this._storageKeys.wbiKeysTime, this._wbiKeysCacheTime);
        
        return this._wbiKeysCache;
      }
    }
    
    throw new Error('无法获取WBI密钥');
  },
  
  /**
   * 获取WBI密钥（img_key和sub_key）
   * 对应Python中的get_wbi_keys函数
   */
  async getWbiKeys() {
    try {
      // 使用缓存的WBI密钥
      return await this.getCachedWbiKeys();
    } catch (error) {
      console.error('[哔哩哔哩] 获取WBI密钥失败:', error);
      throw error;
    }
  },
  
  /**
   * 根据img_key和sub_key生成mixin_key
   * 对应Python中的get_mixin_key函数
   */
  getMixinKey(imgKey, subKey) {
    // WBI密钥混合表，与Python代码中的MIXIN_KEY_ENC_TAB完全一致
    const MIXIN_KEY_ENC_TAB = [
      46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45,
      35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38,
      41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60,
      51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
      20, 34, 44, 52
    ];
    
    const rawWbiKey = imgKey + subKey;
    let mixinKey = '';
    
    for (let i = 0; i < 32; i++) {
      const index = MIXIN_KEY_ENC_TAB[i];
      if (index < rawWbiKey.length) {
        mixinKey += rawWbiKey[index];
      }
    }
    
    return mixinKey;
  },
  
  /**
   * 计算WBI签名w_rid
   * 对应Python中的calculate_w_rid函数
   */
  async calculateWRid(params, mixinKey) {
    const paramsClone = { ...params };
    paramsClone.wts = Math.floor(Date.now() / 1000);
    
    // 编码组件函数，对应Python中的encode_component
    const encodeComponent = (s) => {
      if (typeof s === 'number') {
        s = String(s);
      }
      let encoded = encodeURIComponent(s);
      encoded = encoded.replace(/\+/g, '%20');
      encoded = encoded.replace(/%2F/gi, '%2F').replace(/%3A/gi, '%3A').replace(/%3D/gi, '%3D');
      return encoded;
    };
    
    // 按照键名排序
    const sortedParams = Object.keys(paramsClone).sort().map(key => [key, paramsClone[key]]);
    
    // 构建查询字符串
    const query = sortedParams.map(([k, v]) => `${k}=${encodeComponent(v)}`).join('&');
    const signStr = query + mixinKey;
    
    // 计算MD5
    let wRid;
    
    try {
      // 首先尝试使用预加载的CryptoJS
      if (this.cryptoJs && this.cryptoJs.MD5) {
        wRid = this.cryptoJs.MD5(signStr).toString();
        console.log('[哔哩哔哩] 使用预加载的CryptoJS计算MD5');
      } 
      // 如果预加载失败，尝试重新加载
      else if (typeof lib !== 'undefined') {
        const cryptoJs = await lib.load('crypto-js');
        if (cryptoJs && cryptoJs.MD5) {
          wRid = cryptoJs.MD5(signStr).toString();
          console.log('[哔哩哔哩] 使用动态加载的CryptoJS计算MD5');
          // 更新实例
          this.cryptoJs = cryptoJs;
        } else {
          throw new Error('CryptoJS加载成功但无法使用MD5函数');
        }
      } else {
        throw new Error('lib未定义，无法加载CryptoJS');
      }
    } catch (error) {
      console.error('[哔哩哔哩] 计算MD5失败:', error);
      throw error;
    }
    
    return { wRid, wts: paramsClone.wts };
  },
  
  /**
   * 为请求参数进行WBI签名并生成URL Query
   * 对应Python中的sign_wbi_params函数
   */
  async signWbiParams(params) {
    try {
      // 获取WBI密钥（使用缓存）
      const { imgKey, subKey } = await this.getCachedWbiKeys();
      const mixinKey = this.getMixinKey(imgKey, subKey);
      
      // 计算签名
      const { wRid, wts } = await this.calculateWRid(params, mixinKey);
      
      // 添加签名参数
      const signedParams = { ...params };
      signedParams.wts = wts;
      signedParams.w_rid = wRid;
      
      // 处理特殊字符
      for (const [key, value] of Object.entries(signedParams)) {
        if (typeof value === 'string') {
          signedParams[key] = value.replace(/[!'()*]/g, '');
        }
      }
      
      return { signedParams, imgKey, subKey };
    } catch (error) {
      console.error('[哔哩哔哩] 签名参数失败:', error);
      throw error;
    }
  },
  
  /**
   * 获取Bilibili基础Cookies（如buvid3）
   * 对应Python中的get_bilibili_cookies函数
   */
  async getBilibiliCookies() {
    try {
      console.log('[哔哩哔哩] 获取B站Cookies...');
      
      // 设置请求头
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      };
      
      // 使用跨域代理请求B站主页
      // 注意：需要在URL中添加returnCookies=true参数
      const targetUrl = 'https://www.bilibili.com/?spm_id_from=333.337.0.0';
      const encodedUrl = encodeURIComponent(targetUrl);
      const proxyUrl = `/api/proxy?returnCookies=true&url=${encodedUrl}`;
      
      console.log(`[哔哩哔哩] 使用代理URL请求B站: ${proxyUrl}`);
      console.log(`[哔哩哔哩] 获取cookies时访问www.bilibili.com的请求头: ${JSON.stringify(headers)}`);
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
          console.log('[哔哩哔哩] 从代理响应头获取到Cookies:', cookies);
          return cookies;
        } catch (parseError) {
          console.error('[哔哩哔哩] 解析Cookies JSON失败:', parseError);
          throw new Error('解析Cookies失败');
        }
      } else {
        console.warn('[哔哩哔哩] 响应头中没有找到X-Proxy-Cookies');
        throw new Error('响应头中没有找到Cookies');
      }
    } catch (error) {
      console.error('[哔哩哔哩] 获取Cookies失败:', error);
      
      // 出错时生成随机buvid3
      const timestamp = Math.floor(Date.now() / 1000);
      const randomHex = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
      const uuid = Array(32).fill(0).map(() => randomHex()).join('');
      const buvid3 = `${uuid}${timestamp}infoc`;
      
      console.log('[哔哩哔哩] 生成随机buvid3:', buvid3);
      return { 'buvid3': buvid3 };
    }
  },
  
  /**
   * 准备分类搜索请求参数
   * 对应Python中的prepare_search_params函数
   */
  prepareSearchParams(keyword, searchType = 'video', page = 1, pageSize = 20, order = 'totalrank') {
    const validSearchTypes = ['video', 'media_bangumi', 'live', 'article', 'topic', 'user'];
    if (!validSearchTypes.includes(searchType)) {
      throw new Error('无效的search_type，必须为video, media_bangumi, live, article, topic或user');
    }
    
    const params = {
      'keyword': keyword,
      'search_type': searchType,
      'page': page,
      'page_size': Math.min(pageSize, 50),
      'order': order
    };
    
    return params;
  },
  
  /**
   * 执行Bilibili分类搜索
   * 对应Python中的search函数
   */
  async searchMovies(keyword, page = 1, pageSize = 20) {
    try {
      console.log(`[${this.name}] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      
      // 获取基础Cookies
      const cookies = await this.getCachedBilibiliCookies();
      const cookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      // 准备搜索参数
      const params = this.prepareSearchParams(keyword, 'video', page, pageSize);
      console.log('[哔哩哔哩] 搜索参数:', params);
      
      // 生成签名参数
      const { signedParams } = await this.signWbiParams(params);
      
      // 构建请求URL
      const url = `${this.baseUrl}/x/web-interface/wbi/search/type`;
      
      // 构建查询字符串
      const queryString = Object.entries(signedParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      // 使用addCorsProxy添加代理
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Cookie': cookieStr
      };
      const proxyUrl = proxy.addCorsProxy(`${url}?${queryString}`, headers);
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理响应
      if (!data || data.code !== 0) {
        console.error('[哔哩哔哩] 搜索API响应:', data);
        throw new Error(`搜索失败: ${data ? data.message : '未知错误'}`);
      }
      
      // 转换为标准格式
      const results = data.data.result || [];
      const dataList = results.map(item => ({
        vod_id: item.bvid || item.aid,
        vod_name: this.removeHtmlTags(item.title),
        vod_pic: item.pic ? (item.pic.startsWith('//') ? `https:${item.pic}` : item.pic) : '',
        vod_remarks: `${item.duration || ''} ${item.play ? `播放:${this.formatNumber(item.play)}` : ''}`,
        vod_year: this.extractYear(item.pubdate),
        vod_area: '中国',
        type_name: item.typename || '视频',
        vod_content: item.description || '',
        vod_play_require_cid: true // 标记需要二次请求
      }));
      
      return {
        dataList: dataList,
        total: data.data.numResults || dataList.length,
        pagecount: data.data.numPages || Math.ceil((data.data.numResults || 0) / pageSize),
        size: pageSize,
        current: page
      };
    } catch (error) {
      console.error('[哔哩哔哩] 搜索失败:', error);
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
   * 查询视频分P列表
   * 对应Python中的get_video_parts函数
   */
  async getVideoDetails(avid = null, bvid = null) {
    try {
      if (!avid && !bvid) {
        throw new Error('必须提供avid或bvid其中之一');
      }
      
      // 获取基础Cookies
      const cookies = await this.getCachedBilibiliCookies();
      const cookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      // 准备参数
      const params = {};
      if (bvid) {
        params.bvid = bvid;
      } else {
        params.aid = avid;
      }
      
      // 生成签名参数
      const { signedParams, imgKey, subKey } = await this.signWbiParams(params);
      
      // 将WBI密钥添加到cookies中
      cookies.wbi_img_key = imgKey;
      cookies.wbi_sub_key = subKey;
      
      // 更新Cookie字符串
      const updatedCookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      // 构建请求URL
      const url = `${this.baseUrl}/x/web-interface/view`;
      
      // 构建查询字符串
      const queryString = Object.entries(signedParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      // 使用addCorsProxy添加代理
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Cookie': updatedCookieStr
      };
      const proxyUrl = proxy.addCorsProxy(`${url}?${queryString}`, headers);
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理响应
      if (!data || data.code !== 0) {
        const errorCodes = {
          '-400': '请求错误',
          '-404': '视频不存在或已删除',
          '62002': '视频不可用（未通过审核或仅限自制投稿者）',
          '62004': '视频被锁定（版权原因等）'
        };
        
        const errorMsg = errorCodes[data.code] || `未知错误: ${data.message}`;
        throw new Error(`查询视频分P失败: ${errorMsg}`);
      }
      
      const responseData = data.data;
      const pages = responseData.pages || [];
      
      // 提取分P列表和视频信息
      const videoInfo = {
        aid: responseData.aid,
        bvid: responseData.bvid,
        title: responseData.title,
        pic: responseData.pic,
        desc: responseData.desc,
        videos: responseData.videos, // 总分P数量
        parts: pages.map(part => ({
          cid: part.cid,
          page: part.page,
          part: part.part,
          duration: part.duration,
          dimension: part.dimension,
          first_frame: part.first_frame || '',
          ctime: part.ctime || 0
        }))
      };
      
      return videoInfo;
    } catch (error) {
      console.error('[哔哩哔哩] 查询视频分P失败:', error);
      return null;
    }
  },
  
  /**
   * 处理搜索结果，获取分P信息并生成vod_play_url
   * 对应Python中的process_video_parts函数
   */
  async processVideoDetails(searchResult) {
    try {
      if (!searchResult || !searchResult.data || !searchResult.data.result || !searchResult.data.result.length) {
        throw new Error('搜索结果为空或无有效视频数据');
      }
      
      // 从第一个视频中提取bvid
      const firstVideo = searchResult.data.result[0];
      const bvid = firstVideo.bvid;
      
      if (!bvid) {
        throw new Error('搜索结果中无有效的bvid');
      }
      
      // 使用bvid调用getVideoDetails获取分P信息
      const videoInfo = await this.getVideoDetails(null, bvid);
      if (!videoInfo) {
        throw new Error('无法获取分P信息');
      }
      
      // 格式化为vod_play_url
      let vod_play_url = '';
      for (const part of videoInfo.parts) {
        // 清理标题中的特殊字符
        const name = part.part.replace('#', '-').replace('$', '*');
        // 使用cid作为标识
        vod_play_url += `${name}$${part.cid}#`;
      }
      vod_play_url = vod_play_url.replace(/#$/, '');
      
      // 返回视频信息和vod_play_url
      return {
        video_info: {
          aid: videoInfo.aid,
          bvid: videoInfo.bvid,
          title: videoInfo.title,
          pic: videoInfo.pic,
          desc: videoInfo.desc,
          videos: videoInfo.videos,
          parts: videoInfo.parts
        },
        vod_play_url
      };
    } catch (error) {
      console.error('[哔哩哔哩] 处理视频分P失败:', error);
      return null;
    }
  },
  
  /**
   * 必要方法：获取视频详情
   * 对应Python中的get_video_parts函数
   */
  async getMovieDetail(id) {
    try {
      console.log(`[${this.name}] 获取详情: ${id}`);
      
      // 判断ID类型
      let avid = null;
      let bvid = null;
      
      if (id.startsWith('BV') || id.startsWith('bv')) {
        bvid = id;
      } else {
        avid = id;
      }
      
      // 获取视频详情
      const videoInfo = await this.getVideoDetails(avid, bvid);
      if (!videoInfo) {
        throw new Error('获取视频详情失败');
      }
      
      // 处理分P列表
      const pages = videoInfo.parts || [];
      let vod_play_url = '';
      
      pages.forEach(part => {
        // 清理标题中的特殊字符
        const name = part.part.replace(/[#$]/g, '-');
        // 使用cid作为标识
        vod_play_url += `${name}$cid:${part.cid}#`;
      });
      
      vod_play_url = vod_play_url.replace(/#$/, '');
      
      // 构建视频详情
      return {
        vod_id: videoInfo.bvid || videoInfo.aid,
        vod_name: videoInfo.title,
        vod_pic: videoInfo.pic || '',
        vod_blurb: videoInfo.desc || '',
        vod_content: videoInfo.desc || '',
        vod_play_url: vod_play_url,
        vod_year: this.extractYear(videoInfo.pubdate),
        vod_area: '中国',
        vod_remarks: videoInfo.duration ? this.formatDuration(videoInfo.duration) : '',
        type_name: videoInfo.tname || '视频',
        vod_actor: videoInfo.owner ? videoInfo.owner.name : '',
        vod_director: videoInfo.owner ? videoInfo.owner.name : '',
        vod_play_require_cid: true, // 标记需要二次请求
        vod_play_header: JSON.stringify({
          'Referer': 'https://www.bilibili.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
      };
    } catch (error) {
      console.error('[哔哩哔哩] 获取视频详情失败:', error);
      throw error;
    }
  },
  
  /**
   * 获取视频流地址
   * 对应Python中的get_video_stream_url函数
   */
  async getPlayUrl(cid, options = {}) {
    try {
      console.log(`[${this.name}] 获取播放URL: ${cid}`);
      
      // 从cid中提取真实cid
      const realCid = cid.replace('cid:', '');
      
      // 获取视频ID
      let bvid = '';
      if (options.movieDetail && options.movieDetail.vod_id) {
        bvid = options.movieDetail.vod_id;
      } else {
        throw new Error('缺少视频ID信息');
      }
      
      // 获取基础Cookies
      const cookies = await this.getCachedBilibiliCookies();
      const cookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      // 准备参数
      const params = {
        'bvid': bvid,
        'cid': realCid,
        'qn': 64,  // 画质，默认为720P
        'fnval': 1,  // 流格式，1为普通格式
        'fnver': 0,  // 流版本
        'fourk': 1,  // 支持4K
        'platform': 'html5',  // 平台类型
        'high_quality': 1  // 优先高质量
      };
      
      console.log('[哔哩哔哩] 播放URL请求参数:', params);
      
      // 生成签名参数
      const { signedParams, imgKey, subKey } = await this.signWbiParams(params);
      
      // 将WBI密钥添加到cookies中
      cookies.wbi_img_key = imgKey;
      cookies.wbi_sub_key = subKey;
      
      // 更新Cookie字符串
      const updatedCookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      // 构建请求URL
      const url = `${this.baseUrl}/x/player/playurl`;
      
      // 构建查询字符串
      const queryString = Object.entries(signedParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      // 使用addCorsProxy添加代理
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Cookie': updatedCookieStr
      };
      const proxyUrl = proxy.addCorsProxy(`${url}?${queryString}`, headers);
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理响应
      if (!data || data.code !== 0) {
        console.log('[哔哩哔哩] 播放URL响应:', data);
        
        const errorCodes = {
          '-400': '请求错误',
          '-404': '视频不存在或已删除',
          '-403': '无权限访问（需登录或会员）'
        };
        
        const errorMsg = errorCodes[data.code] || `未知错误: ${data.message}`;
        throw new Error(`获取视频流失败: ${errorMsg}`);
      }
      
      // 获取视频URL
      if (data.data && data.data.durl && data.data.durl.length > 0) {
        const streamInfo = {
          quality: data.data.quality,
          accept_quality: data.data.accept_quality,
          url: data.data.durl[0].url
        };
        
        console.log(`[${this.name}] 获取到播放URL:`, streamInfo.url);
        return streamInfo.url;
      } else {
        throw new Error('未找到可用的视频流地址');
      }
    } catch (error) {
      console.error('[哔哩哔哩] 获取播放URL失败:', error);
      throw error;
    }
  },
  
  // 辅助方法：移除HTML标签
  removeHtmlTags(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '');
  },
  
  // 辅助方法：从时间戳提取年份
  extractYear(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.getFullYear().toString();
  },
  
  // 辅助方法：格式化数字
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  },
  
  // 辅助方法：格式化时长
  formatDuration(seconds) {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  },
  
  /**
   * 处理桥接消息
   * @param {MessageEvent} event - 消息事件
   */
  _handleBridgeMessage(event) {
    const { data } = event;
    
    // 忽略非桥接消息
    if (!data || !data.type || !data.type.startsWith('BILIBILI_STORAGE_BRIDGE_')) {
      return;
    }
    
    console.log('[哔哩哔哩] 收到桥接消息:', data);
    
    switch (data.type) {
      case 'BILIBILI_STORAGE_BRIDGE_INIT_ACK':
        this._bridgeInitialized = true;
        console.log('[哔哩哔哩] 存储桥接初始化确认');
        break;
      case 'BILIBILI_STORAGE_BRIDGE_GET_RESPONSE':
        this._handleGetResponse(data);
        break;
      default:
        console.warn('[哔哩哔哩] 未知桥接消息类型:', data.type);
    }
  },
  
  /**
   * 处理获取响应
   * @param {Object} data - 响应数据
   */
  _handleGetResponse(data) {
    const { key, value, requestId } = data;
    
    // 查找对应的请求
    const request = this._pendingRequests.get(requestId);
    if (request) {
      // 解决Promise
      request.resolve(value);
      // 移除请求
      this._pendingRequests.delete(requestId);
      console.log(`[哔哩哔哩] 已收到存储响应 (${key}, requestId: ${requestId})`);
    } else {
      console.warn(`[哔哩哔哩] 收到未知请求ID的响应: ${requestId}`);
    }
  },
  
  /**
   * 尝试使用存储桥接器
   * 这个方法尝试与父窗口通信，建立存储桥接
   */
  _tryUseStorageBridge() {
    try {
      // 检查是否在iframe中运行
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      
      // 设置标志，表示我们正在使用桥接存储
      this._usingStorageBridge = isInIframe;
      
      console.log(`[哔哩哔哩] 存储桥接状态: ${this._usingStorageBridge ? '启用' : '禁用'}`);
      
      // 如果在iframe中，尝试向父窗口发送初始化消息
      if (this._usingStorageBridge) {
        window.parent.postMessage({
          type: 'BILIBILI_STORAGE_BRIDGE_INIT',
          source: 'bilibili_datasource'
        }, '*');
        
        console.log('[哔哩哔哩] 已向父窗口发送存储桥接初始化消息');
      }
    } catch (error) {
      console.error('[哔哩哔哩] 初始化存储桥接失败:', error);
      this._usingStorageBridge = false;
    }
  }
}; 