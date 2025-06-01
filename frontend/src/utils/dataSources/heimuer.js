import axios from 'axios';
import { addCorsProxy } from '../corsProxy';

// 黑木耳API数据源
const heimuerDataSource = {
  // 数据源名称
  name: '黑木耳影视',
  
  // 数据源描述
  description: '黑木耳影视API，提供电影、电视剧、动漫等内容',
  
  // API基础URL（原始URL，不使用代理时直接使用）
  baseUrl: 'https://json02.heimuer.xyz/api.php/provide/vod',
  
  // 创建一个专门用于黑木耳API的axios实例
  apiClient: axios.create({
    // 无需设置baseURL，将在每个请求中使用完整URL
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  }),
  
  // 处理黑木耳API响应中的JSON转义问题
  parseResponse(response) {
    if (!response || !response.data) return null;
    
    try {
      // 直接返回JSON对象（如果代理已经正确处理了响应）
      return response.data;
    } catch (error) {
      console.error('解析黑木耳API响应失败:', error);
      return null;
    }
  },
  
  // 搜索电影
  async searchMovies(keyword, page = 1, pageSize = 12) {
    try {
      const endpoint = `?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`;
      
      // 在所有环境中都使用CORS代理
      const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
      
      console.log('请求URL:', url);
      
      // 使用完整URL
      const response = await this.apiClient.get(url);
      const jsonData = this.parseResponse(response);
      
      if (jsonData && jsonData.code === 1 && jsonData.list) {
        console.log('黑木耳API搜索结果:', jsonData);
        
        // 适配黑木耳API数据结构到通用格式
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
      console.error('黑木耳API搜索失败:', error);
      throw new Error(`黑木耳搜索失败: ${error.message}`);
    }
  },
  
  // 获取电影详情
  async getMovieDetail(id) {
    try {
      const endpoint = `?ac=detail&ids=${id}`;
      
      // 在所有环境中都使用CORS代理
      const url = addCorsProxy(`${this.baseUrl}${endpoint}`);
      
      console.log('请求URL:', url);
      
      const response = await this.apiClient.get(url);
      const jsonData = this.parseResponse(response);
      
      if (jsonData && jsonData.code === 1 && jsonData.list && jsonData.list.length > 0) {
        const movie = jsonData.list[0];
        console.log('黑木耳API详情结果:', movie);
        
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
          vod_director: movie.vod_director || ''
        };
      } else {
        throw new Error(jsonData?.msg || '获取详情失败');
      }
    } catch (error) {
      console.error('黑木耳API获取详情失败:', error);
      throw new Error(`黑木耳获取详情失败: ${error.message}`);
    }
  }
};

export default heimuerDataSource; 