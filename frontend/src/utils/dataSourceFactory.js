/**
 * 数据源工厂 - 通过配置生成数据源实例
 * 
 * 这个工厂可以根据配置生成标准格式的数据源，
 * 避免为每个数据源创建单独的文件，支持JSON和XML格式。
 */

import axios from 'axios';
import { addCorsProxy } from './corsProxy';

/**
 * 创建数据源实例
 * @param {Object} config 数据源配置
 * @returns {Object} 数据源实例
 * 
 * 简化的配置示例:
 * {
 *   name: '黑木耳',          // 数据源显示名称（必填）
 *   baseUrl: 'https://json02.heimuer.xyz/api.php/provide/vod', // API基础URL（必填）
 *   useXml: false,          // 是否使用XML格式（可选，默认false为JSON格式）
 * }
 * 
 * 可选配置参数:
 * {
 *   id: 'heimuer',          // 数据源ID（可选，默认基于name自动生成）
 *   description: '描述',     // 数据源描述（可选，默认基于name自动生成）
 *   timeout: 10000          // 请求超时时间（可选，默认12000ms）
 * }
 */
export function createDataSource(config) {
  // 验证必要的配置
  if (!config.name) {
    throw new Error('数据源配置缺少name属性');
  }
  if (!config.baseUrl) {
    throw new Error('数据源配置缺少baseUrl属性');
  }
  
  // 设置默认值
  const sourceId = config.id || config.name.toLowerCase().replace(/\s+/g, '').replace(/[^\w\u4e00-\u9fa5]/g, '');
  const useXml = config.useXml || false;
  const timeout = config.timeout || 12000;
  
  // 从baseUrl中自动提取播放源标识
  let playSourceFlag = config.playSourceFlag; // 保留向后兼容
  
  // 如果没有指定playSourceFlag，尝试从URL中提取
  if (!playSourceFlag) {
    // 尝试从URL中提取播放源标识，例如 /from/lzm3u8/ 中提取 lzm3u8
    const fromRegex = /\/from\/([^\/]+)/i;
    const fromMatch = config.baseUrl.match(fromRegex);
    
    if (fromMatch && fromMatch[1]) {
      playSourceFlag = fromMatch[1];
    } else {
      // 默认使用数据源ID作为播放源标识
      playSourceFlag = sourceId;
    }
  }
  
  const description = config.description || `${config.name}影视API，提供电影、电视剧、动漫等内容`;
  
  // 创建数据源对象
  const dataSource = {
    // 基本信息
    id: sourceId,
    name: config.name,
    description: description,
    
    // API基础URL
    get baseUrl() {
      return config.baseUrl;
    },
    
    // 创建axios实例
    get apiClient() {
      const headers = useXml 
        ? {
            'Content-Type': 'application/xml',
            'Accept': 'application/xml',
          }
        : {
            'Content-Type': 'application/json',
          };
      
      const options = {
        headers,
        timeout
      };
      
      // 如果是XML格式，确保返回原始文本
      if (useXml) {
        options.responseType = 'text';
      }
      
      return axios.create(options);
    },
    
    // 解析XML响应为JSON对象
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
            vod_time: getElementText(video, 'last'),
            vod_play_from: playSourceFlag,
            vod_play_url: ''
          };
          
          // 解析播放地址
          const dlElement = video.querySelector('dl');
          if (dlElement) {
            const ddElements = dlElement.querySelectorAll('dd');
            ddElements.forEach(dd => {
              const flag = dd.getAttribute('flag');
              if (!flag || flag === playSourceFlag) {
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
        console.error(`解析${this.name} XML数据失败:`, error);
        return null;
      }
    },
    
    // 解析响应（支持XML和JSON）
    parseResponse(response) {
      if (!response || !response.data) return null;
      
      try {
        // 检查是否是XML响应 - 可能是配置为XML或者响应格式是XML
        const isXmlResponse = useXml || 
          (typeof response.data === 'string' && response.data.trim().startsWith('<?xml'));
        
        if (isXmlResponse) {
          console.log(`解析${this.name} XML响应`);
          return this.parseXMLResponse(response.data);
        } else {
          // 尝试解析为JSON
          console.log(`解析${this.name} JSON响应`);
          if (typeof response.data === 'string') {
            return JSON.parse(response.data);
          } else {
            return response.data;
          }
        }
      } catch (error) {
        console.error(`解析${this.name} API响应失败:`, error);
        return null;
      }
    },
    
    // 搜索影片
    async searchMovies(keyword, page = 1, pageSize = 12) {
      try {
        // 构建请求URL
        const endpoint = `?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`;
        const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
        
        console.log(`${this.name} API请求URL:`, url);
        console.log('使用数据格式:', useXml ? 'XML' : 'JSON');
        
        // 发送请求
        const response = await this.apiClient.get(url);
        const jsonData = this.parseResponse(response);
        
        // 处理响应
        if (jsonData && jsonData.list && Array.isArray(jsonData.list)) {
          console.log(`${this.name} API搜索结果:`, jsonData);
          
          return {
            dataList: jsonData.list.map(item => ({
              vod_id: item.vod_id,
              vod_name: item.vod_name,
              vod_blurb: item.vod_content || item.vod_blurb || '', 
              vod_pic: item.vod_pic || '',
              vod_remarks: item.vod_remarks || item.vod_note || '', 
              vod_year: item.vod_year || (item.vod_time ? new Date(item.vod_time).getFullYear().toString() : ''),
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
        console.error(`${this.name} API搜索失败:`, error);
        throw new Error(`${this.name}搜索失败: ${error.message}`);
      }
    },
    
    // 获取影片详情
    async getMovieDetail(id) {
      try {
        if (!id) {
          throw new Error('无效的影片ID');
        }
        
        // 构建请求URL
        const endpoint = `?ac=detail&ids=${id}`;
        const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
        
        console.log(`${this.name} API详情请求URL:`, url);
        console.log('使用数据格式:', useXml ? 'XML' : 'JSON');
        
        // 发送请求
        const response = await this.apiClient.get(url);
        const jsonData = this.parseResponse(response);
        
        // 处理响应
        if (jsonData && jsonData.list && jsonData.list.length > 0) {
          const movie = jsonData.list[0];
          console.log(`${this.name} API详情结果:`, movie);
          
          // 返回标准格式详情数据
          return {
            vod_id: movie.vod_id,
            vod_name: movie.vod_name,
            vod_pic: movie.vod_pic || '',
            vod_blurb: movie.vod_blurb || movie.vod_content || '',
            vod_content: movie.vod_content || '',
            vod_play_url: movie.vod_play_url || '',
            vod_year: movie.vod_year || (movie.vod_time ? new Date(movie.vod_time).getFullYear().toString() : ''),
            vod_area: movie.vod_area || '',
            vod_remarks: movie.vod_remarks || movie.vod_note || '',
            type_name: movie.type_name || '',
            vod_actor: movie.vod_actor || '',
            vod_director: movie.vod_director || ''
          };
        } else {
          throw new Error(jsonData?.msg || '获取详情失败');
        }
      } catch (error) {
        console.error(`${this.name} API获取详情失败:`, error);
        throw new Error(`${this.name}获取详情失败: ${error.message}`);
      }
    }
  };
  
  return dataSource;
} 