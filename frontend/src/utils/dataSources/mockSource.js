// 模拟数据源
const mockDataSource = {
  // 数据源名称
  name: '模拟数据',
  
  // 数据源描述
  description: '仅用于测试的模拟数据源，不依赖任何在线API',
  
  // 模拟的电影数据库
  mockDatabase: {
    movies: [
      {
        vod_id: '1001',
        vod_name: '火影忍者',
        vod_blurb: '这是一部讲述忍者世界的热血动漫，主角鸣人通过自己的努力逐渐成长为一名优秀的忍者。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=火影忍者',
        vod_remarks: '全720集',
        vod_year: '2002',
        vod_area: '日本',
        type_name: '动漫'
      },
      {
        vod_id: '1002',
        vod_name: '海贼王',
        vod_blurb: '路飞为了实现与因救他而失去一臂的杰克斯的约定而出海，在遥远的路途上找寻着通往伟大航路的入口，目标当上海贼王。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=海贼王',
        vod_remarks: '连载中',
        vod_year: '1999',
        vod_area: '日本',
        type_name: '动漫'
      },
      {
        vod_id: '1003',
        vod_name: '进击的巨人',
        vod_blurb: '艾伦·耶格尔生活的世界里，人类生存在由高墙围起的城市内，屏障内专门培养出一群战士为人类而战。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=进击的巨人',
        vod_remarks: '完结',
        vod_year: '2013',
        vod_area: '日本',
        type_name: '动漫'
      },
      {
        vod_id: '1004',
        vod_name: '钢之炼金术师',
        vod_blurb: '身为炼金术师的爱德华与阿尔冯斯兄弟为了恢复他们在炼金术中失去的身体而踏上的旅程。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=钢之炼金术师',
        vod_remarks: '全64集',
        vod_year: '2009',
        vod_area: '日本',
        type_name: '动漫'
      }
    ],
    
    details: {
      '1001': {
        vod_id: '1001',
        vod_name: '火影忍者',
        vod_blurb: '这是一部讲述忍者世界的热血动漫，主角鸣人通过自己的努力逐渐成长为一名优秀的忍者。',
        vod_content: '《火影忍者》是日本漫画家岸本齐史的代表作，作品于1999年开始在《周刊少年JUMP》上连载，于2014年11月完结。故事从主人公漩涡鸣人的孤儿生活开始，描绘了他成为木叶忍者村的火影之路，以及他和朋友们共同经历的冒险和成长。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=火影忍者',
        vod_remarks: '全720集',
        vod_year: '2002',
        vod_area: '日本',
        type_name: '动漫',
        vod_actor: '竹内顺子,杉山纪彰,中村千绘',
        vod_director: '伊达勇登',
        vod_play_url: '1$https://mock-url.com/naruto/ep1.m3u8#2$https://mock-url.com/naruto/ep2.m3u8#3$https://mock-url.com/naruto/ep3.m3u8'
      },
      '1002': {
        vod_id: '1002',
        vod_name: '海贼王',
        vod_blurb: '路飞为了实现与因救他而失去一臂的杰克斯的约定而出海，在遥远的路途上找寻着通往伟大航路的入口，目标当上海贼王。',
        vod_content: '《海贼王》是日本漫画家尾田荣一郎作画的少年漫画作品，在《周刊少年Jump》1997年34号开始连载至今。作品讲述了拥有橡胶身体戴草帽的路飞，以成为"海贼王"为目标和同伴在大海展开冒险的故事。',
        vod_pic: 'https://via.placeholder.com/320x180.png?text=海贼王',
        vod_remarks: '连载中',
        vod_year: '1999',
        vod_area: '日本',
        type_name: '动漫',
        vod_actor: '田中真弓,冈村明美,中井和哉',
        vod_director: '宇田钢之助',
        vod_play_url: '1$https://mock-url.com/onepiece/ep1.m3u8#2$https://mock-url.com/onepiece/ep2.m3u8#3$https://mock-url.com/onepiece/ep3.m3u8'
      }
    }
  },
  
  // 模拟API搜索
  async searchMovies(keyword, page = 1, pageSize = 12) {
    console.log(`[模拟数据源] 搜索: ${keyword}, 页码: ${page}, 每页数量: ${pageSize}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // 在模拟数据库中搜索
      const results = this.mockDatabase.movies.filter(movie => 
        movie.vod_name.includes(keyword) || 
        movie.vod_blurb.includes(keyword)
      );
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, results.length);
      const pagedResults = results.slice(startIndex, endIndex);
      
      return {
        dataList: pagedResults,
        total: results.length,
        size: pageSize,
        current: page
      };
    } catch (error) {
      console.error('[模拟数据源] 搜索失败:', error);
      throw new Error(`模拟数据源搜索失败: ${error.message}`);
    }
  },
  
  // 模拟API获取详情
  async getMovieDetail(id) {
    console.log(`[模拟数据源] 获取详情: ${id}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const detail = this.mockDatabase.details[id];
      
      if (!detail) {
        throw new Error('未找到对应的影片详情');
      }
      
      return detail;
    } catch (error) {
      console.error('[模拟数据源] 获取详情失败:', error);
      throw new Error(`模拟数据源获取详情失败: ${error.message}`);
    }
  }
};

export default mockDataSource; 