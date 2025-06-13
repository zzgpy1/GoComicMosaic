/**
 * 示例外接数据源 - 展示如何使用通用库加载器和代理工具
 * 
 * 本示例演示如何在外接数据源中使用通用库加载器和CORS代理工具
 */

module.exports = {
  // 必要属性
  name: "综合工具示例",
  baseUrl: "https://example.com/api",
  
  // 请求头
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "zh-CN,zh;q=0.9"
  },
  
  /**
   * 初始化方法 - 可选
   * 在数据源被加载后自动调用
   * 可以用于预加载依赖库
   */
  async init() {
    console.log('初始化数据源...');
    
    // 预加载常用库
    await this.preloadLibraries();
    
    // 确认代理工具可用
    if (proxy) {
      console.log('CORS代理工具已可用');
    } else {
      console.warn('CORS代理工具不可用，将使用内置方法');
    }
  },
  
  /**
   * 预加载常用库
   */
  async preloadLibraries() {
    try {
      // 方式1：使用预定义的库名加载
      this.cryptoJs = await lib.load('crypto-js');
      
      // 方式2：直接使用便捷方法加载
      this.dayjs = await lib.loadDayjs();
      
      // 方式3：直接提供URL加载
      this.marked = await lib.load('https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js', {
        globalVar: 'marked'  // 指定全局变量名
      });
      
      console.log('依赖库预加载完成');
    } catch (e) {
      console.error('预加载库失败:', e);
    }
  },
  
  /**
   * 计算签名
   * 演示如何使用加载的CryptoJS库
   */
  async calculateSignature(text) {
    try {
      // 尝试使用预加载的CryptoJS
      if (this.cryptoJs && this.cryptoJs.MD5) {
        return this.cryptoJs.MD5(text).toString();
      }
      
      // 如果预加载失败，尝试重新加载
      // 简单方式：直接加载预定义库
      const cryptoJs = await lib.load('crypto-js');
      if (cryptoJs && cryptoJs.MD5) {
        return cryptoJs.MD5(text).toString();
      }
      
      throw new Error('无法加载CryptoJS');
    } catch (e) {
      console.error('计算签名失败:', e);
      // 返回一个固定签名作为后备
      return 'fallback_signature';
    }
  },
  
  /**
   * 格式化日期
   * 演示如何使用加载的DayJS库
   */
  async formatDate(date, format = 'YYYY-MM-DD') {
    try {
      // 尝试使用预加载的DayJS
      if (this.dayjs) {
        return this.dayjs(date).format(format);
      }
      
      // 如果预加载失败，尝试直接使用便捷方法
      const dayjs = await lib.loadDayjs();
      if (dayjs) {
        return dayjs(date).format(format);
      }
      
      throw new Error('无法加载DayJS');
    } catch (e) {
      console.error('格式化日期失败:', e);
      // 返回一个简单的日期字符串作为后备
      return new Date(date).toISOString().split('T')[0];
    }
  },
  
  /**
   * 渲染Markdown
   * 演示如何使用通过URL加载的库
   */
  async renderMarkdown(markdown) {
    try {
      // 尝试使用预加载的marked库
      if (this.marked) {
        return this.marked(markdown);
      }
      
      // 如果预加载失败，尝试直接通过URL加载
      const marked = await lib.load('https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js', {
        globalVar: 'marked'
      });
      
      if (marked) {
        return marked(markdown);
      }
      
      throw new Error('无法加载Marked');
    } catch (e) {
      console.error('渲染Markdown失败:', e);
      // 返回原始文本作为后备
      return markdown;
    }
  },
  
  /**
   * 发送请求
   * 演示如何使用CORS代理工具
   */
  async fetchData(url, options = {}) {
    try {
      // 使用全局代理工具
      if (proxy && proxy.fetchWithProxy) {
        console.log(`使用通用代理工具请求: ${url}`);
        return await proxy.fetchWithProxy(url, options);
      }
      
      // 如果代理工具不可用，使用内置方法
      console.log(`通用代理工具不可用，使用内置方法请求: ${url}`);
      
      // 添加代理前缀
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, options);
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      return await response.json();
    } catch (e) {
      console.error(`请求失败: ${url}`, e);
      throw e;
    }
  },
  
  /**
   * 发送POST请求
   * 演示如何使用CORS代理工具
   */
  async postData(url, data, headers = {}) {
    try {
      // 使用全局代理工具
      if (proxy && proxy.postWithProxy) {
        console.log(`使用通用代理工具POST请求: ${url}`);
        return await proxy.postWithProxy(url, data, headers);
      }
      
      // 如果代理工具不可用，使用内置方法
      console.log(`通用代理工具不可用，使用内置方法POST请求: ${url}`);
      
      // 添加代理前缀
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      
      const options = {
        method: 'POST',
        headers,
        body: data instanceof FormData ? data : JSON.stringify(data)
      };
      
      // 如果不是FormData，添加Content-Type头
      if (!(data instanceof FormData) && !headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(proxyUrl, options);
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      return await response.json();
    } catch (e) {
      console.error(`POST请求失败: ${url}`, e);
      throw e;
    }
  },
  
  /**
   * 必要方法：搜索电影/资源
   * @param {string} keyword - 搜索关键词
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 搜索结果
   */
  async searchMovies(keyword, page = 1, pageSize = 20) {
    try {
      console.log(`搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      
      // 计算当前时间的签名，演示使用CryptoJS
      const timestamp = Date.now();
      const signature = await this.calculateSignature(`${keyword}${timestamp}`);
      console.log(`生成的签名: ${signature}`);
      
      // 格式化当前日期，演示使用DayJS
      const today = await this.formatDate(new Date());
      console.log(`今天是: ${today}`);
      
      // 渲染描述，演示使用Marked
      const description = await this.renderMarkdown(`# 搜索结果\n搜索"${keyword}"的结果`);
      console.log(`描述: ${description}`);
      
      // 演示使用代理工具发送请求
      try {
        // 构建请求参数
        const params = {
          keyword,
          page,
          pageSize,
          timestamp,
          signature
        };
        
        // 尝试发送请求（这里使用模拟URL，实际应用中会失败）
        await this.fetchData(`${this.baseUrl}/search`, {
          method: 'GET',
          headers: this.headers
        });
      } catch (e) {
        console.log('请求失败（预期内，因为使用了模拟URL）');
      }
      
      // 模拟搜索结果
      const mockResults = [
        {
          vod_id: '1001',
          vod_name: `${keyword} - 示例影片1`,
          vod_pic: 'https://via.placeholder.com/150',
          vod_remarks: '高清',
          vod_year: '2023'
        },
        {
          vod_id: '1002',
          vod_name: `${keyword} - 示例影片2`,
          vod_pic: 'https://via.placeholder.com/150',
          vod_remarks: '超清',
          vod_year: '2022'
        }
      ];
      
      return {
        dataList: mockResults,
        total: 100,
        pagecount: 5,
        size: pageSize,
        current: parseInt(page)
      };
    } catch (e) {
      console.error("搜索内容失败:", e);
      return {
        dataList: [],
        total: 0,
        pagecount: 0,
        size: pageSize,
        current: parseInt(page)
      };
    }
  },
  
  /**
   * 必要方法：获取电影/资源详情
   * @param {string} id - 资源ID
   * @returns {Promise<Object>} 资源详情
   */
  async getMovieDetail(id) {
    try {
      console.log(`获取详情: ${id}`);
      
      // 计算签名，演示使用CryptoJS
      const timestamp = Date.now();
      const signature = await this.calculateSignature(`${id}${timestamp}`);
      console.log(`生成的签名: ${signature}`);
      
      // 演示使用代理工具发送POST请求
      try {
        // 构建请求数据
        const data = {
          id,
          timestamp,
          signature
        };
        
        // 尝试发送POST请求（这里使用模拟URL，实际应用中会失败）
        await this.postData(`${this.baseUrl}/detail`, data, this.headers);
      } catch (e) {
        console.log('POST请求失败（预期内，因为使用了模拟URL）');
      }
      
      // 模拟详情数据
      return {
        vod_id: id,
        vod_name: `示例影片 ${id}`,
        vod_pic: 'https://via.placeholder.com/300',
        vod_year: '2023',
        vod_area: '中国',
        vod_remarks: '高清',
        vod_actor: '演员A,演员B',
        vod_director: '导演X',
        vod_content: '这是一个使用库加载器和CORS代理工具的示例影片，展示了如何在外接数据源中加载和使用第三方库以及发送跨域请求。',
        type_name: '示例',
        vod_play_url: '示例线路$https://example.com/video.mp4'
      };
    } catch (e) {
      console.error("获取详情内容失败:", e);
      throw e;
    }
  }
}; 