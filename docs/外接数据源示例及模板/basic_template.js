/**
 * 基础外接数据源模板
 * 适合新手使用的简化版本，包含基本功能
 * 
 * 使用说明：
 * 1. 将此文件复制到assets/ext/目录下，并重命名为你的数据源名称.js
 * 2. 修改基本信息和相关方法
 * 3. 实现必要的方法：searchMovies和getMovieDetail
 * 4. 如需二次请求播放地址，请实现getPlayUrl方法
 */

module.exports = {
  // 基本信息
  id: 'basic_template',        // 唯一标识，建议使用英文和数字
  name: '基础数据源模板',      // 显示名称
  baseUrl: 'https://api.example.com',  // API基础URL
  
  /**
   * 初始化方法 - 在数据源加载时自动调用
   */
  async init() {
    console.log(`[${this.name}] 初始化...`);
    // 这里可以进行一些初始化操作
    console.log(`[${this.name}] 初始化完成`);
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
      
      // 使用跨域代理发送请求
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy?url=${encodedUrl}`;
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
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
      
      // 使用跨域代理发送请求
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy?url=${encodedUrl}`;
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
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
      
      // 使用跨域代理发送请求
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy?url=${encodedUrl}`;
      
      // 发送请求
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
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
  
  /**
   * 移除HTML标签
   * @param {string} text - 包含HTML标签的文本
   * @returns {string} 移除HTML标签后的文本
   */
  removeHtmlTags(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '');
  }
}; 