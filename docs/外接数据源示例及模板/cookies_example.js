/**
 * 跨域代理Cookies示例
 * 演示如何使用returnCookies=true参数获取目标网站的Cookies
 */

module.exports = {
  // 基本信息
  id: 'cookies_example',
  name: 'Cookies示例',
  baseUrl: 'https://example.com',
  
  // 缓存的Cookies
  _cookies: null,
  
  /**
   * 初始化方法
   */
  async init() {
    console.log(`[${this.name}] 初始化...`);
    
    try {
      // 获取网站Cookies
      await this.getCachedCookies();
      console.log(`[${this.name}] 初始化完成`);
    } catch (error) {
      console.error(`[${this.name}] 初始化失败:`, error);
    }
  },
  
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
   * 使用获取到的Cookies发送请求
   * @param {string} url - 目标URL
   */
  async sendRequestWithCookies(url) {
    try {
      // 获取缓存的Cookies
      const cookies = await this.getCachedCookies();
      
      // 构建Cookie字符串
      const cookieStr = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      // 设置请求头
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Cookie': cookieStr
      };
      
      // 使用跨域代理发送请求
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy?url=${encodedUrl}`;
      
      console.log(`[${this.name}] 使用Cookies发送请求: ${proxyUrl}`);
      console.log(`[${this.name}] Cookie: ${cookieStr}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[${this.name}] 发送请求失败:`, error);
      throw error;
    }
  },
  
  /**
   * 同时获取新Cookies并发送请求
   * @param {string} url - 目标URL
   */
  async sendRequestAndUpdateCookies(url) {
    try {
      // 设置请求头
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
      };
      
      // 如果有缓存的Cookies，添加到请求头
      if (this._cookies) {
        const cookieStr = Object.entries(this._cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ');
        headers['Cookie'] = cookieStr;
      }
      
      // 使用跨域代理发送请求，并获取新的Cookies
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy?returnCookies=true&url=${encodedUrl}`;
      
      console.log(`[${this.name}] 发送请求并更新Cookies: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      // 从响应头中获取新的cookies
      const cookiesJSON = response.headers.get('X-Proxy-Cookies');
      if (cookiesJSON) {
        try {
          const newCookies = JSON.parse(cookiesJSON);
          console.log(`[${this.name}] 获取到新的Cookies:`, newCookies);
          
          // 更新缓存的Cookies
          this._cookies = {
            ...this._cookies,
            ...newCookies
          };
        } catch (parseError) {
          console.error(`[${this.name}] 解析新Cookies失败:`, parseError);
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[${this.name}] 发送请求并更新Cookies失败:`, error);
      throw error;
    }
  },
  
  /**
   * 搜索影片
   * @param {string} keyword - 搜索关键词
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   */
  async searchMovies(keyword, page = 1, pageSize = 20) {
    console.log(`[${this.name}] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
    
    try {
      // 构建API请求URL
      const url = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`;
      
      // 发送请求并更新Cookies
      const data = await this.sendRequestAndUpdateCookies(url);
      
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
        vod_content: item.description || ''
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
      
      // 使用缓存的Cookies发送请求
      const data = await this.sendRequestWithCookies(url);
      
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
        vod_director: data.detail.directors || ''
      };
      
      return detail;
    } catch (error) {
      console.error(`[${this.name}] 获取详情失败:`, error);
      // 返回空结果
      return null;
    }
  }
}; 