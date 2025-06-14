module.exports = {
  // 必要属性
  name: "热播APP(自定义爬虫)",
  baseUrl: "http://v.rbotv.cn",
  
  // 请求头
  headers: {
    "User-Agent": "okhttp-okgo/jeasonlzy",
    "Accept-Language": "zh-CN,zh;q=0.8"
  },
  
  /**
   * 初始化方法（自动调用）
   * 预加载所需的依赖库
   */
  async init() {
    try {
      // 预加载依赖库
      this.cryptoJs = await lib.load('crypto-js');
    } catch (e) {
      console.error('[热播APP] 预加载依赖库失败:', e);
    }
  },
  
  /**
   * 获取文件请求参数
   * @param {Object} p - 参数对象
   * @returns {Promise<FormData>} FormData对象
   */
  async getfiles(p = {}) {
    // 创建一个新对象，避免修改原始对象
    const params = {...p};
    
    // 获取当前时间戳（与Python的int(time.time())相同）
    const t = Math.floor(Date.now() / 1000).toString();
    
    // 计算签名
    const signStr = `7gp0bnd2sr85ydii2j32pcypscoc4w6c7g5spl${t}`;
    
    // 使用lib加载CryptoJS并计算MD5
    let s;
    try {
      // 首先尝试使用预加载的CryptoJS
      if (this.cryptoJs && this.cryptoJs.MD5) {
        s = this.cryptoJs.MD5(signStr).toString();
        console.log('[热播APP] 使用预加载的CryptoJS计算MD5:', s);
      } 
      // 如果预加载失败，尝试重新加载
      else if (typeof lib !== 'undefined') {
        const cryptoJs = await lib.load('crypto-js');
        if (cryptoJs && cryptoJs.MD5) {
          s = cryptoJs.MD5(signStr).toString();
          console.log('[热播APP] 使用动态加载的CryptoJS计算MD5:', s);
        } else {
          throw new Error('CryptoJS加载成功但无法使用MD5函数');
        }
      } else {
        throw new Error('lib未定义，无法加载CryptoJS');
      }
    } catch (e) {
      console.error('[热播APP] 使用CryptoJS计算MD5失败:', e);
    }
    
    console.log('[热播APP] 最终签名:', s);
    
    // 添加sign和timestamp参数
    params.sign = s;
    params.timestamp = t;
    
    // 将参数转换为FormData
    const formData = new FormData();
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }
    
    return formData;
  },

  /**
   * 处理视频列表
   * @param {Array} data - 视频数据数组
   * @returns {Array} 处理后的视频对象数组
   */
  getv(data) {
    const videos = [];
    
    for (const i of data) {
      if (i.vod_id && i.vod_id !== '0') {
        videos.push({
          vod_id: i.vod_id,
          vod_name: i.vod_name || '',
          vod_pic: i.vod_pic || i.vod_pic_thumb || '',
          vod_year: i.tag || '',
          vod_remarks: i.vod_remarks || ''
        });
      }
    }
    
    return videos;
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
      console.log(`[热播APP] 搜索: ${keyword}, 页码: ${page}, 每页: ${pageSize}`);
      
      const formData = await this.getfiles({
        limit: '12',
        page: page.toString(),
        keyword: keyword
      });
      
      // 构建请求URL
      const url = `${this.baseUrl}/v3/home/search`;
      
      // 发送请求
      let data;
      
      // 使用代理工具发送POST请求
      data = await proxy.postWithProxy(url, formData, this.headers);
      
      // 处理数据
      const videos = this.getv(data.data.list);
      
      return {
        dataList: videos,
        total: videos.length || 0,
        pagecount: 99, // 假设有很多页
        size: 12,
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
      console.log(`[热播APP] 获取详情: ${id}`);
      
      const formData = await this.getfiles({vod_id: id});
      
      // 构建请求URL
      const url = `${this.baseUrl}/v3/home/vod_details`;
      
      // 使用代理工具发送POST请求
      let data;
      data = await proxy.postWithProxy(url, formData, this.headers);
      
      return this._processDetailData(data, id);
    } catch (e) {
      console.error("获取详情内容失败:", e);
      throw e;
    }
  },
  
  /**
   * 处理详情数据
   * @private
   * @param {Object} data - API返回的原始数据
   * @param {string} id - 资源ID
   * @returns {Object} 处理后的详情数据
   */
  _processDetailData(data, id) {
    const v = data.data;
    
    // 处理内容
    const content = v.vod_content || '无';
    // 简化内容处理，移除HTML标签
    const cleanContent = content.replace(/<[^>]*>/g, '');
    
    // 处理播放列表
    const playUrl = [];
    
    console.log(`[热播APP] 处理播放列表，共${v.vod_play_list.length}个来源`);
    
    //
    const item = v.vod_play_list.at(-1);
    console.log('当前线路详情：',item)
    
    // 记录referer信息
    const referer = item.referer || this.baseUrl;
    console.log(`[热播APP] ${v.name} Referer:`, referer);
    
    // 设置请求头
    const headers = {
      "Referer": referer
    };
    
    if (item.ua) {
      headers["User-Agent"] = item.ua;
    } else if (this.headers["User-Agent"]) {
      headers["User-Agent"] = this.headers["User-Agent"];
    }
    
    const episodes = [];
    
    
    // 处理每一集
    for (const j of item.urls ) {
      episodes.push(`${j.name}$${j.url}`)
    }
    
    playUrl.push(episodes.join('#'));
    
    // 构建VOD数据
    return {
      vod_id: id,
      vod_name: v.vod_name || '',
      vod_pic: v.vod_pic || '',
      vod_year: v.vod_year || '',
      vod_area: v.vod_area || '',
      vod_remarks: v.vod_remarks || '',
      vod_actor: v.vod_actor || '',
      vod_director: v.vod_director || '',
      vod_content: cleanContent,
      type_name: v.type_name || '热播APP',
      vod_play_url: playUrl.join('$$$')
    };
  }
}; 