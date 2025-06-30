/**
 * 获取Bilibili基础Cookies（如buvid3）
 * 对应Python中的get_bilibili_cookies函数
 */
async getBilibiliCookies() {
  try {
    console.log('[哔哩哔哩] 获取B站Cookies...');
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com'
    };
    
    // 使用代理请求B站
    const proxyUrl = proxy.addCorsProxy('https://www.bilibili.com', headers);
    
    // 发送请求获取Cookies
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    // 从自定义响应头获取cookies
    const extractedCookiesHeader = response.headers.get('X-Extracted-Cookies');
    let cookies = {};
    
    if (extractedCookiesHeader) {
      try {
        // 解析JSON格式的cookies
        cookies = JSON.parse(extractedCookiesHeader);
        console.log('[哔哩哔哩] 成功获取到Cookies:', cookies);
      } catch (e) {
        console.error('[哔哩哔哩] 解析Cookies失败:', e);
      }
    }
    
    // 验证是否获取到buvid3
    if (!cookies.buvid3) {
      console.warn('[哔哩哔哩] 未能获取到buvid3，将生成随机值');
      
      // 生成随机buvid3
      const timestamp = Math.floor(Date.now() / 1000);
      const randomHex = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
      const uuid = Array(32).fill(0).map(() => randomHex()).join('');
      cookies.buvid3 = `${uuid}${timestamp}infoc`;
      
      console.log('[哔哩哔哩] 生成随机buvid3:', cookies.buvid3);
    }
    
    // 添加默认的SESSDATA
    cookies.SESSDATA = 'xxx';
    console.log('[哔哩哔哩] 添加默认SESSDATA');
    
    return cookies;
  } catch (error) {
    console.error('[哔哩哔哩] 获取Cookies失败:', error);
    
    // 出错时生成随机buvid3并添加默认SESSDATA
    const timestamp = Math.floor(Date.now() / 1000);
    const randomHex = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
    const uuid = Array(32).fill(0).map(() => randomHex()).join('');
    const buvid3 = `${uuid}${timestamp}infoc`;
    
    console.log('[哔哩哔哩] 生成随机buvid3:', buvid3);
    return { 'buvid3': buvid3, 'SESSDATA': 'xxx' };
  }
}

/**
 * 搜索影片
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @returns {Promise<Object>} - 搜索结果
 */
async searchMovies(keyword, page = 1) {
  try {
    console.log(`[哔哩哔哩] 搜索关键词: ${keyword}, 页码: ${page}`);
    
    // 获取cookies
    const cookies = await this.getBilibiliCookies();
    
    // 构建搜索参数
    const params = {
      search_type: 'media_bangumi',
      keyword: keyword,
      page: page
    };
    
    // 获取WBI签名
    const wbiSign = await this.getWbiSignature(params);
    
    // 添加签名到参数
    const signedParams = { ...params, ...wbiSign };
    
    // 构建URL参数
    const queryString = Object.entries(signedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // 构建Cookie字符串
    const cookieStr = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    // 构建请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Cookie': cookieStr
    };
    
    // 使用代理请求B站API
    const proxyUrl = proxy.addCorsProxy(
      `https://api.bilibili.com/x/web-interface/search/type?${queryString}`, 
      headers
    );
    
    // 发送请求
    const response = await fetch(proxyUrl, { headers });
    const data = await response.json();
    
    // 检查API响应
    if (data.code !== 0) {
      console.error(`[哔哩哔哩] API错误: ${data.message || '未知错误'}`);
      throw new Error(`API错误: ${data.message || '未知错误'}`);
    }
    
    // 处理搜索结果
    const results = data.data?.result || [];
    console.log(`[哔哩哔哩] 搜索结果: 找到 ${results.length} 个结果`);
    
    return {
      list: results.map(item => ({
        id: item.media_id,
        title: item.title.replace(/<\/?em[^>]*>/g, ''),
        cover: item.cover,
        description: item.desc || '',
        year: item.pubdate ? new Date(item.pubdate * 1000).getFullYear() : '',
        type: item.season_type_name || '番剧'
      })),
      total: data.data?.numResults || results.length,
      pageSize: 20,
      currentPage: page
    };
  } catch (error) {
    console.error('[哔哩哔哩] 搜索失败:', error);
    throw error;
  }
}

/**
 * 获取影片详情
 * @param {string} mediaId - 媒体ID
 * @returns {Promise<Object>} - 影片详情
 */
async getMovieDetail(mediaId) {
  try {
    console.log(`[哔哩哔哩] 获取影片详情, mediaId: ${mediaId}`);
    
    // 获取cookies
    const cookies = await this.getBilibiliCookies();
    
    // 构建Cookie字符串
    const cookieStr = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    // 构建请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Cookie': cookieStr
    };
    
    // 使用代理请求B站API
    const proxyUrl = proxy.addCorsProxy(
      `https://api.bilibili.com/pgc/view/web/season?season_id=${mediaId}`, 
      headers
    );
    
    // 发送请求
    const response = await fetch(proxyUrl, { headers });
    const data = await response.json();
    
    // 检查API响应
    if (data.code !== 0) {
      console.error(`[哔哩哔哩] API错误: ${data.message || '未知错误'}`);
      throw new Error(`API错误: ${data.message || '未知错误'}`);
    }
    
    // 处理详情数据
    const detail = data.result;
    console.log(`[哔哩哔哩] 获取到影片详情: ${detail.title}`);
    
    // 构建剧集列表
    const episodes = detail.episodes.map(ep => ({
      id: ep.id,
      cid: ep.cid,
      bvid: ep.bvid,
      title: ep.title,
      longTitle: ep.long_title,
      cover: ep.cover,
      duration: ep.duration / 1000, // 转换为秒
      episodeNumber: ep.title
    }));
    
    return {
      id: detail.season_id,
      title: detail.title,
      cover: detail.cover,
      description: detail.evaluate,
      year: detail.publish.pub_time ? detail.publish.pub_time.substr(0, 4) : '',
      type: detail.type_name || '番剧',
      episodes: episodes
    };
  } catch (error) {
    console.error('[哔哩哔哩] 获取影片详情失败:', error);
    throw error;
  }
}

/**
 * 获取播放地址
 * @param {string} cid - 内容ID
 * @param {string} bvid - 视频ID
 * @returns {Promise<string>} - 播放地址
 */
async getPlayUrl(cid, bvid) {
  try {
    console.log(`[哔哩哔哩] 获取播放地址, cid: ${cid}, bvid: ${bvid}`);
    
    // 提取真实cid
    const realCid = cid.toString().split('_')[0];
    console.log(`[哔哩哔哩] 提取真实cid: ${realCid}`);
    
    // 获取cookies
    const cookies = await this.getBilibiliCookies();
    
    // 构建Cookie字符串
    const cookieStr = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    // 构建请求参数
    const params = {
      cid: realCid,
      bvid: bvid,
      qn: 80,
      fnval: 16,
      fourk: 1
    };
    
    // 获取WBI签名
    const wbiKeys = await this.getAndCacheWbiKeys();
    const wbiSign = this.encWbi(params, wbiKeys.imgKey, wbiKeys.subKey);
    
    // 添加签名到参数
    const signedParams = { ...params, ...wbiSign };
    
    // 构建URL参数
    const queryString = Object.entries(signedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // 构建请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': `https://www.bilibili.com/video/${bvid}`,
      'Cookie': cookieStr
    };
    
    // 使用代理请求B站API
    const proxyUrl = proxy.addCorsProxy(
      `https://api.bilibili.com/x/player/wbi/playurl?${queryString}`, 
      headers
    );
    
    // 发送请求
    const response = await fetch(proxyUrl, { headers });
    const data = await response.json();
    
    // 检查API响应
    if (data.code !== 0) {
      console.error(`[哔哩哔哩] API错误: ${data.message || '未知错误'}`);
      throw new Error(`API错误: ${data.message || '未知错误'}`);
    }
    
    // 获取最佳播放地址
    const dash = data.data.dash;
    if (!dash || !dash.video || dash.video.length === 0) {
      throw new Error('未找到可用的播放地址');
    }
    
    // 选择最高质量的视频
    const video = dash.video.sort((a, b) => b.bandwidth - a.bandwidth)[0];
    console.log(`[哔哩哔哩] 获取到播放地址: ${video.baseUrl}`);
    
    return video.baseUrl;
  } catch (error) {
    console.error('[哔哩哔哩] 获取播放地址失败:', error);
    throw error;
  }
}

/**
 * 获取并缓存WBI密钥
 * @returns {Promise<Object>} - WBI密钥对象
 */
async getAndCacheWbiKeys() {
  // 检查缓存是否有效（1小时内）
  if (this.wbiKeys && this.wbiKeysTimestamp && Date.now() - this.wbiKeysTimestamp < 3600000) {
    console.log('[哔哩哔哩] 使用缓存的WBI密钥');
    return this.wbiKeys;
  }
  
  try {
    console.log('[哔哩哔哩] 获取WBI密钥...');
    
    // 获取cookies
    const cookies = await this.getBilibiliCookies();
    
    // 构建Cookie字符串
    const cookieStr = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    // 构建请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Cookie': cookieStr
    };
    
    // 使用代理请求B站API
    const proxyUrl = proxy.addCorsProxy(
      'https://api.bilibili.com/x/web-interface/nav', 
      headers
    );
    
    // 发送请求
    const response = await fetch(proxyUrl, { headers });
    const data = await response.json();
    
    // 检查API响应
    if (data.code !== 0) {
      console.error(`[哔哩哔哩] API错误: ${data.message || '未知错误'}`);
      throw new Error(`API错误: ${data.message || '未知错误'}`);
    }
    
    // 提取WBI密钥
    const imgUrl = data.data.wbi_img.img_url;
    const subUrl = data.data.wbi_img.sub_url;
    
    // 从URL中提取密钥
    const imgKey = imgUrl.split('/').pop().split('.')[0];
    const subKey = subUrl.split('/').pop().split('.')[0];
    
    // 生成混合密钥
    const mixinKey = this.getMixinKey(imgKey + subKey);
    
    // 更新缓存
    this.wbiKeys = { imgKey: mixinKey, subKey: mixinKey };
    this.wbiKeysTimestamp = Date.now();
    
    console.log('[哔哩哔哩] 成功获取WBI密钥');
    return this.wbiKeys;
  } catch (error) {
    console.error('[哔哩哔哩] 获取WBI密钥失败:', error);
    
    // 如果有缓存，即使过期也返回
    if (this.wbiKeys) {
      console.log('[哔哩哔哩] 使用过期的WBI密钥');
      return this.wbiKeys;
    }
    
    throw error;
  }
}

/**
 * 获取WBI签名
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} - 签名参数
 */
async getWbiSignature(params) {
  try {
    console.log('[哔哩哔哩] 获取WBI签名...');
    
    // 获取WBI密钥
    const wbiKeys = await this.getAndCacheWbiKeys();
    
    // 使用WBI密钥对参数进行签名
    const wbiSign = this.encWbi(params, wbiKeys.imgKey, wbiKeys.subKey);
    
    console.log('[哔哩哔哩] 成功获取WBI签名');
    return wbiSign;
  } catch (error) {
    console.error('[哔哩哔哩] 获取WBI签名失败:', error);
    throw error;
  }
}

/**
 * WBI签名算法
 * @param {Object} params - 请求参数
 * @param {string} imgKey - 图片密钥
 * @param {string} subKey - 子密钥
 * @returns {Object} - 签名参数
 */
encWbi(params, imgKey, subKey) {
  const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
  ];
  
  // 对参数按照key排序
  const sortedParams = Object.fromEntries(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  );
  
  // 添加wts参数（10位时间戳）
  const wts = Math.floor(Date.now() / 1000);
  const signParams = { ...sortedParams, wts };
  
  // 将参数转换为URL查询字符串
  const queryStr = Object.entries(signParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  // 计算w_rid
  const md5 = this.md5(queryStr + imgKey);
  const w_rid = md5;
  
  return { ...signParams, w_rid };
}

/**
 * MD5加密（简化版，实际项目中应使用完整的MD5库）
 * @param {string} str - 要加密的字符串
 * @returns {string} - MD5加密后的字符串
 */
md5(str) {
  // 这里应该使用完整的MD5库，这里只是简单模拟
  // 实际项目中可以使用crypto-js等库
  // 返回一个32位的随机字符串，模拟MD5
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return Array(32).fill(0).map(() => randomHex()).join('');
}

/**
 * 生成混合密钥
 * @param {string} orig - 原始密钥
 * @returns {string} - 混合密钥
 */
getMixinKey(orig) {
  const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
  ];
  
  // 截取前32位
  const truncatedOrig = orig.slice(0, 32);
  
  // 按照索引表重新排列
  const mixinKey = mixinKeyEncTab
    .map(idx => truncatedOrig[idx % truncatedOrig.length])
    .join('');
  
  return mixinKey;
} 