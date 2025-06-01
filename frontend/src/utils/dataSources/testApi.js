import axios from 'axios';

// 测试API数据源
const testApiDataSource = {
  // 数据源名称
  name: '测试API',
  
  // 数据源描述
  description: '测试API数据源，仅供演示',
  
  // API基础URL (实际使用时应替换为真实API地址)
  baseUrl: 'https://api.example.com/test',
  
  // 创建一个axios实例
  apiClient: axios.create({
    baseURL: '/test-api', // 使用代理
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000, // 5秒超时
  }),
  
  // 模拟的电影数据库 - 与真实API结果格式一致
  mockDatabase: {
    movies: [
      {
        vod_id: '2001',
        vod_name: '测试电影1',
        vod_blurb: '这是一个测试电影，用于演示多数据源功能',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=测试电影1',
        vod_remarks: '高清',
        vod_year: '2023',
        vod_area: '中国',
        type_name: '测试'
      },
      {
        vod_id: '2002',
        vod_name: '测试电影2',
        vod_blurb: '这是第二个测试电影，同样用于演示多数据源功能',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=测试电影2',
        vod_remarks: '蓝光',
        vod_year: '2024',
        vod_area: '美国',
        type_name: '测试'
      }
    ],
    details: {
      '2001': {
        vod_id: '2001',
        vod_name: '测试电影1',
        vod_blurb: '这是一个测试电影，用于演示多数据源功能',
        vod_content: '这是一部完全虚构的测试电影，没有实际内容，仅用于测试多数据源功能是否正常工作。通过这个测试数据源，用户可以清楚地看到当前正在使用的是哪个数据源。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=测试电影1',
        vod_remarks: '高清',
        vod_year: '2023',
        vod_area: '中国',
        type_name: '测试',
        vod_actor: '测试演员A,测试演员B',
        vod_director: '测试导演',
        vod_play_url: '1$https://test-api.example.com/videos/movie1.m3u8#2$https://test-api.example.com/videos/movie1-2.m3u8'
      },
      '2002': {
        vod_id: '2002',
        vod_name: '测试电影2',
        vod_blurb: '这是第二个测试电影，同样用于演示多数据源功能',
        vod_content: '这是另一部完全虚构的测试电影，没有实际内容，用于验证数据源切换功能的可靠性。通过在不同数据源之间切换，可以确认API抽象层工作正常。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=测试电影2',
        vod_remarks: '蓝光',
        vod_year: '2024',
        vod_area: '美国',
        type_name: '测试',
        vod_actor: '测试演员C,测试演员D',
        vod_director: '测试导演2',
        vod_play_url: '1$https://test-api.example.com/videos/movie2.m3u8'
      }
    }
  },
  
  // 搜索电影 - 模拟API行为
  async searchMovies(keyword, page = 1, pageSize = 12) {
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 使用简单的模糊匹配搜索模拟数据库中的电影
      const results = this.mockDatabase.movies.filter(movie => 
        movie.vod_name.includes(keyword) || 
        movie.vod_blurb.includes(keyword) ||
        keyword === '' // 空关键词返回所有结果
      );
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, results.length);
      const pagedResults = results.slice(startIndex, endIndex);
      
      console.log(`[测试API] 搜索"${keyword}"，找到${results.length}个结果`);
      
      return {
        dataList: pagedResults,
        total: results.length,
        size: pageSize,
        current: page
      };
    } catch (error) {
      console.error('[测试API] 搜索失败:', error);
      throw new Error(`测试API搜索失败: ${error.message}`);
    }
  },
  
  // 获取电影详情
  async getMovieDetail(id) {
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const detail = this.mockDatabase.details[id];
      
      if (!detail) {
        throw new Error(`未找到ID为${id}的影片`);
      }
      
      console.log(`[测试API] 获取ID为${id}的影片详情成功`);
      return detail;
    } catch (error) {
      console.error('[测试API] 获取详情失败:', error);
      throw new Error(`测试API获取详情失败: ${error.message}`);
    }
  }
};

export default testApiDataSource; 