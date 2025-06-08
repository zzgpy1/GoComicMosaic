/**
 * 数据源模板
 * 这是一个基础模板，您可以基于此开发自己的数据源
 * 支持 JSON 和 XML 格式的 API
 */

// 辅助函数：添加CORS代理前缀
function addCorsProxy(url) {
  // 使用系统内置的CORS代理服务
  const PROXY_BASE_URL = '/proxy?url=';
  
  // 如果URL已经包含了代理前缀，则直接返回
  if (url.includes('/proxy?url=')) {
    return url;
  }
  
  // 使用encodeURIComponent编码整个URL
  const encodedUrl = encodeURIComponent(url);
  return `${PROXY_BASE_URL}${encodedUrl}`;
}

// 数据源定义
module.exports = {
  // 必要属性 - 修改为您的数据源信息
  name: "我的数据源",
  baseUrl: "https://api.example.com/api.php/provide/vod",
  
  // 可选属性
  useXml: false,  // 如果API返回XML格式，设置为true
  
  // XML解析函数 - 将XML响应转换为标准JSON格式
  parseXMLResponse(xmlString) {
    if (!xmlString) return null;
    
    try {
      // 使用DOMParser解析XML字符串
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      
      // 检查是否有解析错误
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML解析错误:', parseError.textContent);
        return null;
      }
      
      // 获取基本信息
      const list = xmlDoc.querySelector('list');
      if (!list) return null;
      
      const page = parseInt(list.getAttribute('page') || '1');
      const pagecount = parseInt(list.getAttribute('pagecount') || '1');
      const pagesize = parseInt(list.getAttribute('pagesize') || '30');
      const recordcount = parseInt(list.getAttribute('recordcount') || '0');
      
      // 解析视频列表
      const videos = [];
      const videoElements = xmlDoc.querySelectorAll('video');
      
      videoElements.forEach(video => {
        // 提取CDATA内容的辅助函数
        const getCDataContent = (element) => {
          if (!element) return '';
          // 对于CDATA内容，需要获取文本内容
          return element.textContent || '';
        };
        
        // 提取简单元素的文本内容
        const getElementText = (parent, tagName) => {
          const element = parent.querySelector(tagName);
          if (!element) return '';
          return element.textContent || '';
        };
        
        // 构建单个视频对象
        const videoObj = {
          vod_id: getElementText(video, 'id'),
          vod_name: getCDataContent(video.querySelector('name')),
          type_name: getElementText(video, 'type'),
          vod_pic: getElementText(video, 'pic'),
          vod_lang: getElementText(video, 'lang'),
          vod_area: getElementText(video, 'area'),
          vod_year: getElementText(video, 'year'),
          vod_remarks: getCDataContent(video.querySelector('note')),
          vod_actor: getCDataContent(video.querySelector('actor')),
          vod_director: getCDataContent(video.querySelector('director')),
          vod_content: getCDataContent(video.querySelector('des')),
          vod_play_url: ''
        };
        
        // 解析播放地址
        const dlElement = video.querySelector('dl');
        if (dlElement) {
          const ddElements = dlElement.querySelectorAll('dd');
          ddElements.forEach(dd => {
            const flag = dd.getAttribute('flag');
            if (flag) {
              videoObj.vod_play_url = getCDataContent(dd);
            }
          });
        }
        
        videos.push(videoObj);
      });
      
      // 返回格式化的数据
      return {
        code: 1,
        msg: '数据列表',
        page,
        pagecount,
        limit: pagesize,
        total: recordcount,
        list: videos
      };
    } catch (error) {
      console.error('解析XML数据失败:', error);
      return null;
    }
  },
  
  // 通用响应解析函数 - 自动识别JSON和XML
  parseResponse(response) {
    if (!response) return null;
    
    try {
      // 检查是否是XML格式
      const isXmlResponse = this.useXml || 
        (typeof response === 'string' && response.trim().startsWith('<?xml'));
      
      if (isXmlResponse) {
        console.log('[我的数据源] 解析XML响应');
        return this.parseXMLResponse(response);
      } else {
        // 尝试解析为JSON
        console.log('[我的数据源] 解析JSON响应');
        if (typeof response === 'string') {
          return JSON.parse(response);
        } else {
          return response;
        }
      }
    } catch (error) {
      console.error('[我的数据源] 解析响应失败:', error);
      return null;
    }
  },
  
  // 辅助函数：发送网络请求
  async makeRequest(url, options = {}) {
    // 添加CORS代理
    const proxyUrl = addCorsProxy(url);
    
    // 设置合适的请求头
    const headers = this.useXml 
      ? {
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      : {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options.headers
        };
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers,
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    // 根据响应类型获取数据
    const data = this.useXml ? await response.text() : await response.json();
    return this.parseResponse(data);
  },
  
  // 必要方法：搜索电影/资源
  async searchMovies(keyword, page = 1, pageSize = 20) {
    try {
      console.log(`[我的数据源] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      
      // 构建API URL - 使用正确的参数格式
      const endpoint = `?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`;
      const url = `${this.baseUrl}${endpoint}`;
      
      console.log('请求URL:', url);
      console.log('使用数据格式:', this.useXml ? 'XML' : 'JSON');
      
      // 发送请求
      const jsonData = await this.makeRequest(url);
      
      // 处理返回数据
      if (jsonData && jsonData.code === 1 && jsonData.list) {
        console.log('[我的数据源] API搜索结果:', jsonData);
        
        // 适配API数据结构到通用格式
        return {
          dataList: jsonData.list.map(item => ({
            vod_id: item.vod_id,
            vod_name: item.vod_name,
            vod_blurb: item.vod_blurb || item.vod_content || '',
            vod_pic: item.vod_pic || '',
            vod_remarks: item.vod_remarks || '',
            vod_year: item.vod_year || '',
            vod_area: item.vod_area || '',
            type_name: item.type_name || ''
          })),
          total: parseInt(jsonData.total) || 0,
          pagecount: parseInt(jsonData.pagecount) || 0,
          size: pageSize,
          current: page
        };
      } else {
        throw new Error(jsonData?.msg || '搜索失败');
      }
    } catch (error) {
      console.error('[我的数据源] 搜索失败:', error);
      // 返回空结果而不是抛出错误，提高用户体验
      return {
        dataList: [],
        total: 0,
        pagecount: 0,
        size: pageSize,
        current: page
      };
    }
  },
  
  // 必要方法：获取电影/资源详情
  async getMovieDetail(id) {
    try {
      console.log(`[我的数据源] 获取详情: ${id}`);
      
      // 构建API URL - 使用正确的参数格式
      const endpoint = `?ac=detail&ids=${id}`;
      const url = `${this.baseUrl}${endpoint}`;
      
      console.log('请求URL:', url);
      console.log('使用数据格式:', this.useXml ? 'XML' : 'JSON');
      
      // 发送请求
      const jsonData = await this.makeRequest(url);
      
      if (jsonData && jsonData.code === 1 && jsonData.list && jsonData.list.length > 0) {
        const movie = jsonData.list[0];
        console.log('[我的数据源] API详情结果:', movie);
        
        // 解析播放列表（如果有）
        const playList = this.parsePlayList(movie.vod_play_url);
        
        // 返回详情数据
        return {
          vod_id: movie.vod_id,
          vod_name: movie.vod_name,
          vod_pic: movie.vod_pic || '',
          vod_blurb: movie.vod_blurb || movie.vod_content || '',
          vod_content: movie.vod_content || '',
          vod_play_url: movie.vod_play_url || '',
          vod_year: movie.vod_year || '',
          vod_area: movie.vod_area || '',
          vod_remarks: movie.vod_remarks || '',
          type_name: movie.type_name || '',
          vod_actor: movie.vod_actor || '',
          vod_director: movie.vod_director || '',
          play_list: playList
        };
      } else {
        throw new Error(jsonData?.msg || '获取详情失败');
      }
    } catch (error) {
      console.error('[我的数据源] 获取详情失败:', error);
      throw error; // 详情获取失败需要抛出错误，以便UI显示错误信息
    }
  },
  
  // 辅助方法：解析播放列表
  parsePlayList(playUrl) {
    if (!playUrl) return [];
    
    try {
      // 格式通常为: "播放源1$地址1#地址2#地址3$$$播放源2$地址1#地址2"
      const sourceList = playUrl.split('$$$');
      const playList = [];
      
      sourceList.forEach(source => {
        const parts = source.split('$');
        if (parts.length >= 2) {
          const sourceName = parts[0];
          const urls = parts[1].split('#');
          
          const episodes = urls.map((url, index) => ({
            name: `第${index + 1}集`,
            url
          }));
          
          playList.push({
            source: sourceName,
            episodes
          });
        }
      });
      
      return playList;
    } catch (error) {
      console.error('解析播放列表失败:', error);
      return [];
    }
  }
}; 