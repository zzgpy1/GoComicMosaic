import axios from 'axios';
import { addCorsProxy } from '../corsProxy';

const moduDataSource = {
  // 基本信息
  name: '魔都',
  description: '魔都影视API，提供电影、电视剧、动漫等内容',
  baseUrl: 'https://www.mdzyapi.com/api.php/provide/vod',
  
  // 创建axios实例
  apiClient: axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 12000,
  }),
  
  // 解析响应
  parseResponse(response) {
    if (!response || !response.data) return null;
    try {
      return response.data;
    } catch (error) {
      console.error('解析魔都API响应失败:', error);
      return null;
    }
  },
  
  // 搜索影片
  async searchMovies(keyword, page = 1, pageSize = 12) {
    try {
      // 构建请求URL - 魔都API搜索参数
      const endpoint = `?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`;
      const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
      
      console.log('魔都API请求URL:', url);
      
      // 发送请求
      const response = await this.apiClient.get(url);
      const jsonData = this.parseResponse(response);
      
      // 处理响应
      if (jsonData && jsonData.code === 1 && jsonData.list) {
        console.log('魔都API搜索结果:', jsonData);
        
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
      console.error('魔都API搜索失败:', error);
      throw new Error(`魔都搜索失败: ${error.message}`);
    }
  },
  
  // 获取影片详情
  async getMovieDetail(id) {
    try {
      if (!id || isNaN(Number(id))) {
        throw new Error('无效的影片ID');
      }
      
      // 构建请求URL
      const endpoint = `?ac=detail&ids=${id}`;
      const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
      
      console.log('魔都API详情请求URL:', url);
      
      // 发送请求
      const response = await this.apiClient.get(url);
      const jsonData = this.parseResponse(response);
      
      // 处理响应
      if (jsonData && jsonData.code === 1 && jsonData.list && jsonData.list.length > 0) {
        const movie = jsonData.list[0];
        console.log('魔都API详情结果:', movie);
        
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
          vod_director: movie.vod_director || ''
        };
      } else {
        throw new Error(jsonData?.msg || '获取详情失败');
      }
    } catch (error) {
      console.error('魔都API获取详情失败:', error);
      throw new Error(`魔都获取详情失败: ${error.message}`);
    }
  }
};

export default moduDataSource; 