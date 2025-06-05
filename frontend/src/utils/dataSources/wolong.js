/**
 * 卧龙API数据源
 * 支持JSON和XML格式数据，可通过配置参数灵活切换
 */

import axios from 'axios';
import { addCorsProxy } from '../corsProxy';

// 数据源配置 - 可以根据需要修改这里的配置
const CONFIG = {
  // 基础URL - 直接设置为完整的API地址
  baseUrl: 'https://collect.wolongzy.cc/api.php/provide/vod/', // JSON格式
  //baseUrl: 'https://collect.wolongzy.cc/api.php/provide/vod/at/xml/', // XML格式
  
  // 是否使用XML格式 (true: XML格式, false: JSON格式)
  useXml: false
};

const wolongDataSource = {
  // 基本信息
  name: '卧龙',
  description: '卧龙影视API，提供电影、电视剧、动漫、综艺等内容',
  
  // 直接使用配置的baseUrl
  get baseUrl() {
    return CONFIG.baseUrl;
  },
  
  // 创建axios实例 - 根据配置动态生成
  get apiClient() {
    const headers = CONFIG.useXml 
      ? {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
        }
      : {
          'Content-Type': 'application/json',
        };
    
    const options = {
      headers,
      timeout: 12000
    };
    
    // 如果是XML格式，确保返回原始文本
    if (CONFIG.useXml) {
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
          vod_time: getElementText(video, 'last'),
          vod_play_from: 'wolong',
          vod_play_url: ''
        };
        
        // 解析播放地址
        const dlElement = video.querySelector('dl');
        if (dlElement) {
          const ddElements = dlElement.querySelectorAll('dd');
          ddElements.forEach(dd => {
            const flag = dd.getAttribute('flag');
            if (flag === 'wolong') {
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
  
  // 解析响应（支持XML和JSON）
  parseResponse(response) {
    if (!response || !response.data) return null;
    
    try {
      // 检查是否是XML响应 - 可能是配置为XML或者响应格式是XML
      const isXmlResponse = CONFIG.useXml || 
        (typeof response.data === 'string' && response.data.trim().startsWith('<?xml'));
      
      if (isXmlResponse) {
        console.log('解析XML响应');
        return this.parseXMLResponse(response.data);
      } else {
        // 尝试解析为JSON
        console.log('解析JSON响应');
        if (typeof response.data === 'string') {
          return JSON.parse(response.data);
        } else {
          return response.data;
        }
      }
    } catch (error) {
      console.error('解析卧龙API响应失败:', error);
      return null;
    }
  },
  
  // 搜索影片
  async searchMovies(keyword, page = 1, pageSize = 12) {
    try {
      // 构建请求URL - 卧龙API搜索参数
      const endpoint = `?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`;
      const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
      
      console.log('卧龙API请求URL:', url);
      console.log('使用数据格式:', CONFIG.useXml ? 'XML' : 'JSON');
      
      // 发送请求
      const response = await this.apiClient.get(url);
      const jsonData = this.parseResponse(response);
      
      // 处理响应
      if (jsonData && jsonData.list && Array.isArray(jsonData.list)) {
        console.log('卧龙API搜索结果:', jsonData);
        
        return {
          dataList: jsonData.list.map(item => ({
            vod_id: item.vod_id,
            vod_name: item.vod_name,
            vod_blurb: item.vod_content || '', // 可能是des字段在XML中
            vod_pic: item.vod_pic || '',
            vod_remarks: item.vod_remarks || item.vod_note || '', // 备注信息，XML中是note字段
            vod_year: item.vod_year || (item.vod_time ? new Date(item.vod_time).getFullYear().toString() : ''),
            vod_area: item.vod_area || '',
            type_name: item.type_name || '' // 分类名称
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
      console.error('卧龙API搜索失败:', error);
      throw new Error(`卧龙搜索失败: ${error.message}`);
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
      
      console.log('卧龙API详情请求URL:', url);
      console.log('使用数据格式:', CONFIG.useXml ? 'XML' : 'JSON');
      
      // 发送请求
      const response = await this.apiClient.get(url);
      const jsonData = this.parseResponse(response);
      
      // 处理响应
      if (jsonData && jsonData.list && jsonData.list.length > 0) {
        const movie = jsonData.list[0];
        console.log('卧龙API详情结果:', movie);
        
        // 解析播放地址
        const playUrl = movie.vod_play_url || '';
        
        return {
          vod_id: movie.vod_id,
          vod_name: movie.vod_name,
          vod_pic: movie.vod_pic || '',
          vod_blurb: movie.vod_content || '',
          vod_content: movie.vod_content || '',
          vod_play_url: playUrl,
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
      console.error('卧龙API获取详情失败:', error);
      throw new Error(`卧龙获取详情失败: ${error.message}`);
    }
  }
};

export default wolongDataSource; 