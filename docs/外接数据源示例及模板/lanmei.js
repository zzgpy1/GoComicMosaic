/**
 * 蓝莓短剧外接数据源
 * 基于Python爬虫代码转换
 */

module.exports = {
    // 必要属性
    name: "蓝莓短剧(自定义爬虫)",
    baseUrl: "https://app.whjzjx.cn",
       
    // 请求头
    headers: {
      "Connection": "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "user-agent": "okhttp/4.10.0",
      "user_agent": "Mozilla/5.0 (Linux; Android 9; ASUS_I003DD Build/PI; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.70 Mobile Safari/537.36",
      "Host": "app.whjzjx.cn",
      "Accept-Encoding": "gzip"
    },
    
    // token缓存
    tokenExpireTime: 0,
    
    /**
     * 初始化方法
     * 预加载依赖库并获取初始token
     */
    async init() {
      try {
        console.log('[蓝莓短剧] 初始化中...');
        // 初始化时获取token
        await this.ensureValidToken();
      } catch (e) {
        console.error(`[蓝莓短剧] 初始化失败: ${e.message}`);
      }
    },
    
    /**
     * 确保token有效，如果无效则重新获取
     * @returns {boolean} token是否有效
     */
    async ensureValidToken() {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // 如果token仍然有效，直接返回true
      if (this.headers.authorization && currentTime < this.tokenExpireTime) {
        return true;
      }
      
      // 否则重新获取token
      try {
        const tkurl = 'https://app.whjzjx.cn/v1/account/login';
        const body = "device=20caaae96b3443174bf4ebdbdcc253776";
        
        // 登录请求直接使用原始URL，无需代理
        const response = await fetch(tkurl, {
          method: 'POST',
          headers: this.headers,
          body: body
        });
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        if (jsonData.code === 0 || jsonData.code === "ok" || jsonData.status === 0) {
          // 直接将token设置到headers中
          this.headers.authorization = jsonData.data.token;
          
          // 设置token过期时间为1小时
          this.tokenExpireTime = currentTime + 3600;
          return true;
        }
        
        console.log(`[蓝莓短剧] 获取token失败: ${JSON.stringify(jsonData)}`);
        return false;
      } catch (e) {
        console.error(`[蓝莓短剧] 获取token异常: ${e.message}`);
        return false;
      }
    },
    
    /**
     * 发送API请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    async request(url, options = {}) {
      try {
        // 确保token有效
        const tokenValid = await this.ensureValidToken();
        if (!tokenValid) {
          console.log("[蓝莓短剧] 无法获取有效token");
          return null;
        }
        
        // 合并自定义headers
        const requestHeaders = {...this.headers};
        if (options.headers) {
          Object.assign(requestHeaders, options.headers);
        }
        
        // 构建请求选项
        const requestOptions = {
          method: options.method || 'GET',
          headers: requestHeaders
        };
        
        if (options.body) {
          requestOptions.body = options.body;
        }
        
        // 判断是否需要使用代理
        const needsProxy = options.useProxy === true;
        
        let response;
        if (needsProxy) {
          // 使用代理
          response = await proxy.fetchWithProxy(url, requestOptions);
        } else {
          // 直接请求
          const rawResponse = await fetch(url, requestOptions);
          
          if (!rawResponse.ok) {
            throw new Error(`HTTP错误: ${rawResponse.status}`);
          }
          
          response = await rawResponse.json();
        }
        
        return response;
      } catch (e) {
        console.error(`[蓝莓短剧] 请求失败: ${url}, 错误: ${e.message}`);
        return null;
      }
    },
    
    /**
     * 必要方法：搜索电影/资源
     * 这是外接数据源必须实现的方法
     */
    async searchMovies(keyword, page = 1, pageSize = 20) {
      console.log(`[蓝莓短剧] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      
      try {
        // 构建搜索请求
        const url = `${this.baseUrl}/v2/search`;
        const body = `text=${encodeURIComponent(keyword)}`;
        
        const jsonData = await this.request(url, {
          method: 'POST',
          body: body
        });
        
        if (!jsonData) {
          console.log('[蓝莓短剧] 搜索请求失败或返回为空');
          return { dataList: [], total: 0, pagecount: 0, size: pageSize, current: page };
        }
        
        // 检查API返回状态
        if (!(jsonData.code === 0 || jsonData.code === "ok" || jsonData.status === 0)) {
          console.log(`[蓝莓短剧] 搜索数据失败: ${JSON.stringify(jsonData)}`);
          return { dataList: [], total: 0, pagecount: 0, size: pageSize, current: page };
        }
        
        // 解析搜索结果
        const searchData = jsonData.data?.search_data || [];
        console.log(`[蓝莓短剧] 搜索结果数量: ${searchData.length}`);
        
        // 转换为标准格式
        const videos = searchData.map(item => {
          return {
            vod_id: item.id,
            vod_name: item.title,
            vod_pic: item.cover_url,
            vod_remarks: `${item.score_str || ''}|${item.total || ''}集`,
            vod_year: '',
            vod_area: '',
            type_name: '短剧'
          };
        });
        
        // 返回标准格式的搜索结果
        return {
          dataList: videos,
          total: videos.length || 0,
          pagecount: 1, // 假设只有一页
          size: pageSize,
          current: parseInt(page)
        };
      } catch (e) {
        console.error(`[蓝莓短剧] 搜索内容异常: ${e.message}`);
        return { dataList: [], total: 0, pagecount: 0, size: pageSize, current: page };
      }
    },
    
    /**
     * 必要方法：获取电影/资源详情
     * 这是外接数据源必须实现的第二个核心方法
     */
    async getMovieDetail(id) {
      console.log(`[蓝莓短剧] 获取详情: ${id}`);
      
      try {
        // 构建详情页请求URL
        const url = `${this.baseUrl}/v2/theater_parent/detail?theater_parent_id=${id}`;
        const jsonData = await this.request(url);
        
        if (!jsonData) {
          throw new Error("获取详情数据失败");
        }
        
        // 检查API返回状态
        if (!(jsonData.code === 0 || jsonData.code === "ok" || jsonData.status === 0)) {
          console.error(`[蓝莓短剧] 获取详情数据失败: ${JSON.stringify(jsonData)}`);
          throw new Error(`获取详情数据失败: ${jsonData.msg || '未知错误'}`);
        }
        
        // 解析详情数据
        const data = jsonData.data || {};
        const title = data.title || '';
        const cover = data.cover_url || '';
        const total = data.total || '';
        const introduction = data.introduction || '';
        
        // 提取剧集列表
        const theaters = data.theaters || [];
        const playList = [];
        
        // 设置播放所需的headers，特别是Referer头
        const playHeaders = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "http://qcapp.xingya.com.cn/"
        };
        
        // 构建正确格式的播放列表字符串 - 格式: "1$url1#2$url2#3$url3"
        let playUrl = '';
        
        if (theaters.length > 0) {
          // 统一处理：所有视频URL都通过代理处理
          playUrl = theaters.map((theater, index) => {
            const episodeNum = theater.num || (index + 1);
            const videoUrl = theater.son_video_url || '';
            
            // 使用新的proxy接口
            const proxyUrl = proxy.addCorsProxy(videoUrl, playHeaders);
            return `${episodeNum}$${proxyUrl}`;
          }).join('#');
          
          // 构建剧集列表 (保留原来的逻辑用于兼容)
          const episodes = theaters.map((theater, index) => {
            const epName = `第${theater.num || (index+1)}集`;
            const epUrl = theater.son_video_url || '';
            
            // 使用新的proxy接口
            const proxyUrl = proxy.addCorsProxy(epUrl, playHeaders);
            
            return {
              name: epName,
              url: proxyUrl
            };
          });
          
          // 添加播放源
          if (episodes.length > 0) {
            playList.push({
              source: "蓝莓短剧",
              episodes: episodes
            });
          }
        }
        
        console.log(`[蓝莓短剧] 解析到 ${theaters.length} 集剧集`);
        // 构建VOD数据
        return {
          vod_id: id,
          vod_name: title,
          vod_pic: cover,
          vod_remarks: `${total}集`,
          vod_content: introduction,
          vod_year: '',
          vod_area: '',
          vod_actor: '',
          vod_director: '',
          type_name: '蓝莓短剧',
          vod_play_from: "蓝莓短剧",
          vod_play_url: playUrl, // 使用构建好的播放URL字符串
          // 添加必要的头信息，这将被前端使用（虽然使用代理后不再需要，但保留以防万一）
          vod_play_header: JSON.stringify({
            "Referer": "http://qcapp.xingya.com.cn/", 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          }),
          playList: playList // 保留旧格式，兼容现有代码
        };
      } catch (e) {
        console.error(`[蓝莓短剧] 获取详情内容异常: ${e.message}`);
        throw e; // 重新抛出异常，以便外部处理
      }
    }
  };