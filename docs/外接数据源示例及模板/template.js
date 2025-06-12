/**
 * 外接数据源通用模板 (基于蓝莓短剧实现模式)
 * 专注于JSON格式API交互，不涉及XML处理
 * 
 * 使用说明:
 * 1. 复制此文件并重命名，例如 myDataSource.js
 * 2. 修改基本配置（名称、URL等）
 * 3. 根据目标API调整请求和解析逻辑
 */

class BaseProvider {
  constructor() {
    // 基本信息配置
    this.name = "数据源名称"; // 显示在界面上的名称
    this.baseUrl = "https://api.example.com"; // API基础URL
    this.apiBaseUrl = "https://api.example.com/api"; // API接口URL，可以与baseUrl相同
    
    // 默认请求头
    this.headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9",
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    };
    
    // Token缓存
    this.tokenCache = null;
    this.tokenExpiry = null;
  }
  
  /**
   * 获取授权令牌
   * 如果API需要认证，实现此方法
   * @returns {Promise<string|null>} 返回token或null
   */
  async getToken() {
    try {
      // 如果token有效，直接返回
      if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.tokenCache;
      }
      
      // 实现获取token的逻辑，根据实际API调整
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          username: "username", // 替换为实际用户名
          password: "password"  // 替换为实际密码
        })
      });
      
      if (!response.ok) {
        throw new Error(`登录失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 根据实际API调整响应解析逻辑
      if (data.code === 0 && data.data && data.data.token) {
        // 缓存token并设置过期时间（例如23小时）
        this.tokenCache = data.data.token;
        this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
        return this.tokenCache;
      }
      
      console.error("获取token失败:", data);
      return null;
    } catch (e) {
      console.error("获取token出错:", e);
      return null;
    }
  }
  
  /**
   * 添加CORS代理前缀
   * @param {string} url - 要代理的URL
   * @param {Object} [headers] - 需要传递的请求头
   * @returns {string} 代理后的URL
   */
  addCorsProxy(url, headers) {
    // 如果URL为空，直接返回
    if (!url) {
      return '';
    }
    
    // 使用系统内置的CORS代理服务
    let PROXY_BASE_URL = '/proxy?url=';
    
    // 将headers转换为JSON字符串并进行编码
    if (headers && Object.keys(headers).length > 0) {
      // 确保headers是一个包含所有必要信息的干净对象
      const cleanHeaders = {};
      
      // 只保留重要的头信息
      if (headers.Referer || headers.referer) {
        cleanHeaders.Referer = headers.Referer || headers.referer;
      }
      
      if (headers["User-Agent"]) {
        cleanHeaders["User-Agent"] = headers["User-Agent"];
      }
      
      // 转换为JSON字符串并编码
      const encodedHeaders = encodeURIComponent(JSON.stringify(cleanHeaders));
      PROXY_BASE_URL = `/proxy?headers=${encodedHeaders}&url=`;
    }
    
    // 使用encodeURIComponent编码整个URL
    const encodedUrl = encodeURIComponent(url);
    return `${PROXY_BASE_URL}${encodedUrl}`;
  }
  
  /**
   * 带token的网络请求
   * 注意：此方法主要用于API请求，不使用代理
   * 视频URL应该通过addCorsProxy方法单独处理
   * @param {string} url - 请求URL
   * @param {Object} [options] - 请求选项
   * @returns {Promise<Object|null>} 返回响应数据或null
   */
  async fetchWithToken(url, options = {}) {
    const token = await this.getToken();
    if (!token) {
      console.log("无法获取token");
      return null;
    }
    
    const headers = {...this.headers, "authorization": token};
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    try {
      // API请求通常不需要代理，直接使用原始URL
      // 只有在options.forceProxy=true时才使用代理（用于特殊情况）
      const needsProxy = options.forceProxy === true;
      const requestUrl = needsProxy ? this.addCorsProxy(url, headers) : url;
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: headers
      };
      
      if (options.body) {
        requestOptions.body = options.body;
      }
      
      const response = await fetch(requestUrl, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      return await response.json();
    } catch (e) {
      console.error(`请求失败: ${url}, 错误: ${e.message}`);
      return null;
    }
  }
  
  /**
   * 搜索电影/资源
   * 这是外接数据源必须实现的核心方法
   * @param {string} keyword - 搜索关键词
   * @param {number} [page=1] - 页码
   * @param {number} [pageSize=20] - 每页数量
   * @returns {Promise<Object>} 搜索结果，包含dataList数组
   */
  async searchMovies(keyword, page = 1, pageSize = 20) {
    try {
      console.log(`[${this.name}] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      
      // 根据实际API调整搜索请求
      // 示例1: GET请求带查询参数
      // const url = `${this.apiBaseUrl}/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`;
      // const jsonData = await this.fetchWithToken(url);
      
      // 示例2: POST请求带请求体
      const url = `${this.apiBaseUrl}/search`;
      const body = `text=${encodeURIComponent(keyword)}`;
      const jsonData = await this.fetchWithToken(url, {
        method: 'POST',
        body: body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      
      if (!jsonData) {
        console.log(`[${this.name}] 搜索请求失败或返回为空`);
        return { dataList: [], total: 0, pagecount: 0, size: pageSize, current: page };
      }
      
      // 检查API返回状态，根据实际API调整
      if (!(jsonData.code === 0 || jsonData.code === "ok" || jsonData.status === 0)) {
        console.log(`[${this.name}] 搜索数据失败:`, jsonData);
        return { dataList: [], total: 0, pagecount: 0, size: pageSize, current: page };
      }
      
      // 解析搜索结果，根据实际API调整
      // 这里假设返回格式为 { data: { search_data: [...] } }
      const searchData = jsonData.data?.search_data || [];
      console.log(`[${this.name}] 搜索结果数量: ${searchData.length}`);
      
      // 转换为标准格式，根据实际API调整字段映射
      const videos = searchData.map(item => {
        return {
          vod_id: item.id.toString(),
          vod_name: item.title || item.name || "未知标题",
          vod_pic: item.cover_url || item.cover || item.pic || "",
          vod_remarks: item.remarks || item.score_str || "",
          vod_year: item.year || "",
          vod_area: item.area || "",
          type_name: item.type || ""
        };
      });
      
      // 返回标准格式的搜索结果
      return {
        dataList: videos,
        total: videos.length || 0,
        pagecount: 1, // 根据实际API调整
        size: pageSize,
        current: parseInt(page)
      };
    } catch (e) {
      console.error(`[${this.name}] 搜索内容异常:`, e);
      return { dataList: [], total: 0, pagecount: 0, size: pageSize, current: page };
    }
  }
  
  /**
   * 获取电影/资源详情
   * 这是外接数据源必须实现的第二个核心方法
   * @param {string} id - 资源ID
   * @returns {Promise<Object>} 资源详情
   */
  async getMovieDetail(id) {
    try {
      console.log(`[${this.name}] 获取详情: ${id}`);
      
      // 构建详情页请求URL，根据实际API调整
      const url = `${this.apiBaseUrl}/detail?id=${id}`;
      const jsonData = await this.fetchWithToken(url);
      
      if (!jsonData) {
        throw new Error("获取详情数据失败");
      }
      
      // 检查API返回状态，根据实际API调整
      if (!(jsonData.code === 0 || jsonData.code === "ok" || jsonData.status === 0)) {
        console.error(`[${this.name}] 获取详情数据失败:`, jsonData);
        throw new Error(`获取详情数据失败: ${jsonData.msg || '未知错误'}`);
      }
      
      // 解析详情数据，根据实际API调整
      const data = jsonData.data || {};
      
      // 视频播放需要的请求头，根据实际需要调整
      const playHeaders = {
        "Referer": this.baseUrl, 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      };
      
      // 构建播放列表，根据实际API调整
      let playUrl = "";
      const episodes = data.episodes || data.theaters || [];
      
      if (episodes.length > 0) {
        // 统一处理：所有视频URL都通过代理处理
        playUrl = episodes.map((episode, index) => {
          // 根据实际API调整字段名
          const episodeNum = episode.num || episode.number || (index + 1);
          const videoUrl = episode.son_video_url || episode.url || '';
          
          // 对所有URL都使用代理，确保一致性
          const proxyUrl = this.addCorsProxy(videoUrl, playHeaders);
          return `${episodeNum}$${proxyUrl}`;
        }).join('#');
      }
      
      // 构建VOD数据，根据实际API调整字段映射
      return {
        vod_id: id,
        vod_name: data.title || data.name || "",
        vod_pic: data.cover_url || data.cover || "",
        vod_remarks: data.episode_status || data.remarks || "",
        vod_content: data.introduction || data.description || "",
        vod_year: data.year || "",
        vod_area: data.area || "",
        vod_actor: data.actor || data.actors || "",
        vod_director: data.director || "",
        type_name: data.type || "",
        vod_play_from: this.name,
        vod_play_url: playUrl,
        vod_play_header: JSON.stringify(playHeaders)
      };
    } catch (e) {
      console.error(`[${this.name}] 获取详情内容异常:`, e);
      throw e; // 重新抛出异常，以便外部处理
    }
  }
  
  /**
   * 解析播放列表格式
   * 辅助方法，用于处理不同格式的播放列表
   * @param {Array} episodes - 剧集数组
   * @returns {Array} 标准格式的剧集数组
   */
  parseEpisodes(episodes) {
    if (!episodes || !Array.isArray(episodes) || episodes.length === 0) {
      return [];
    }
    
    return episodes.map((episode, index) => {
      // 根据实际数据结构调整字段映射
      return {
        name: episode.name || `第${episode.num || (index + 1)}集`,
        url: episode.url || episode.son_video_url || ''
      };
    });
  }
}

// 创建实例并导出
module.exports = new BaseProvider(); 