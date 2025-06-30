import { getDataSourceManager } from './dataSourceManager';
import axios from 'axios';

// 是否启用离线模式（当API不可用时）
const OFFLINE_MODE = false; // 设置为false使用在线API

// 模拟搜索结果数据
const mockSearchResults = {
  dataList: [
    {
      vod_id: 23156,
      vod_name: "灵笼",
      vod_blurb: "不久的未来，人类的世界早已拥挤不堪，迈向星河、寻找新家园的行动迫在眉捷。正当一切有条不紊的推进之时，月相异动，脚下的大地爆发了长达数十年、剧烈的地质变化，人类在这场浩劫中所剩无几。当天地逐渐恢复平静，人们从废墟和深渊中重新踏上了这片熟悉而又陌生的大地。习惯了主宰一切的我们是否还是这个世界的主人？",
      vod_pic: "https://assets.heimuer.tv/imgs/2025/05/26/1f22dabe03ca45c288b3da71ead699d7.jpg",
      vod_remarks: "更新至【8】",
      vod_year: "2019",
      vod_area: "大陆",
      type_name: "国产动漫"
    },
    {
      vod_id: 47380,
      vod_name: "灵笼 第二季",
      vod_blurb: "数百年前，欲望催生了几乎灭绝人类的玛娜生态。人类瞬间沦为猎物，文明毁灭殆尽，末日中猜忌和恐惧拉开了人与人之间的距离。灾难当前，人们逐渐意识到：情感——这个被灯塔视为禁忌的存在，如今成为突破一切障碍、构建命运共同体的最强纽带。已被逼至绝境的幸存者们能否重夺未来?",
      vod_pic: "https://assets.heimuer.tv/imgs/2025/05/23/13ef405be7004293a939a4d379c7ceca.jpg",
      vod_remarks: "更新至【3】",
      vod_year: "2025",
      vod_area: "大陆",
      type_name: "国产动漫"
    }
  ],
  total: 2
};

// 模拟电影详情数据
const mockMovieDetails = {
  23156: {
    vod_id: 23156,
    vod_name: "灵笼",
    vod_blurb: "不久的未来，人类的世界早已拥挤不堪，迈向星河、寻找新家园的行动迫在眉捷。正当一切有条不紊的推进之时，月相异动，脚下的大地爆发了长达数十年、剧烈的地质变化，人类在这场浩劫中所剩无几。当天地逐渐恢复平静，人们从废墟和深渊中重新踏上了这片熟悉而又陌生的大地。习惯了主宰一切的我们是否还是这个世界的主人？",
    vod_pic: "https://assets.heimuer.tv/imgs/2025/05/26/1f22dabe03ca45c288b3da71ead699d7.jpg",
    vod_play_url: "1$https://m3u8.hmrvideo.com/play/79a5fcdda8f84557975d1e59dd51f334.m3u8#2$https://m3u8.hmrvideo.com/play/71584e1b87c34eb28fa67b52f64bf53f.m3u8#3$https://m3u8.hmrvideo.com/play/d743cfe0d803455582e9210365ceb5f9.m3u8#4$https://m3u8.hmrvideo.com/play/2697bce3a34c4fe8a04010e06e2d1895.m3u8#5$https://m3u8.hmrvideo.com/play/7d9be7d74d62408bb32b9a05122d4cea.m3u8#6$https://m3u8.hmrvideo.com/play/215f3b5ecd8a49e89b74167db2247f49.m3u8#7$https://m3u8.hmrvideo.com/play/1f0c961fc54b4a0fa8ba1659c37e18a6.m3u8#8$https://m3u8.hmrvideo.com/play/7899b21cf9304471a7d48752d14e6199.m3u8"
  },
  47380: {
    vod_id: 47380,
    vod_name: "灵笼 第二季",
    vod_blurb: "数百年前，欲望催生了几乎灭绝人类的玛娜生态。人类瞬间沦为猎物，文明毁灭殆尽，末日中猜忌和恐惧拉开了人与人之间的距离。灾难当前，人们逐渐意识到：情感——这个被灯塔视为禁忌的存在，如今成为突破一切障碍、构建命运共同体的最强纽带。已被逼至绝境的幸存者们能否重夺未来?",
    vod_pic: "https://assets.heimuer.tv/imgs/2025/05/23/13ef405be7004293a939a4d379c7ceca.jpg",
    vod_play_url: "前瞻篇：长夜将至$https://m3u8.hmrvideo.com/play/bd1731c8a0fe459aa79e37fe32bffd0a.m3u8#1$https://m3u8.hmrvideo.com/play/86ca806761a04601b890194af7f7ae58.m3u8#2$https://m3u8.hmrvideo.com/play/2fee0b0ce34e48f78c830176005cbcd3.m3u8#3$https://m3u8.hmrvideo.com/play/14e0c026bab643629e279adb21f13d8f.m3u8"
  }
};

// 获取影片列表
export const searchMovies = async (searchWord, pageNo = 1, pageSize = 12, dataSourceId = null) => {
  try {
    // 离线模式或关键词是"灵笼"时返回模拟数据
    if (OFFLINE_MODE || searchWord === "灵笼") {
      console.log('使用模拟搜索数据');
      return {
        dataList: mockSearchResults.dataList,
        total: mockSearchResults.total,
        size: pageSize,
        current: pageNo
      };
    }
    
    // 获取数据源管理器实例
    const dataSourceManager = getDataSourceManager();
    
    // 使用当前数据源或指定数据源搜索
    const result = await dataSourceManager.searchMovies(searchWord, pageNo, pageSize, dataSourceId);
    return result;
    
  } catch (error) {
    console.error('搜索电影出错:', error);
    
    // 在API请求失败时，如果搜索关键词是"灵笼"，返回模拟数据
    if (searchWord === "灵笼") {
      console.log('API请求失败，使用模拟数据');
      return {
        dataList: mockSearchResults.dataList,
        total: mockSearchResults.total,
        size: pageSize,
        current: pageNo
      };
    }
    
    throw error;
  }
};

// 获取影片详情
export const getMovieDetail = async (vodId, dataSourceId = null) => {
  try {
    // 离线模式或ID匹配时返回模拟数据
    const vodIdStr = vodId.toString();
    if (OFFLINE_MODE || mockMovieDetails[vodIdStr]) {
      console.log('使用模拟详情数据');
      return mockMovieDetails[vodIdStr] || null;
    }
    
    // 获取数据源管理器实例
    const dataSourceManager = getDataSourceManager();
    
    // 使用当前数据源或指定数据源获取详情
    const result = await dataSourceManager.getMovieDetail(vodId, dataSourceId);
    return result;
    
  } catch (error) {
    console.error('获取电影详情出错:', error);
    
    // 在API请求失败时，如果ID匹配，返回模拟数据
    const vodIdStr = vodId.toString();
    if (mockMovieDetails[vodIdStr]) {
      console.log('API请求失败，使用模拟数据');
      return mockMovieDetails[vodIdStr];
    }
    
    throw error;
  }
};

// 解析剧集列表 - 适配通用格式
export const parseEpisodes = (playUrl, requireCid = false) => {
  if (!playUrl) return [];
  
  const episodesArray = [];
  
  try {
    // 通用格式: 播放源名称$URL#播放源名称2$URL2
    // 首先按#分割不同播放源
    const sources = playUrl.split('#');
    
    // 处理每个播放源
    sources.forEach(source => {
      // 根据$分割剧集号和URL
      const parts = source.split('$');
      if (parts.length >= 2) {
        const title = parts[0];
        const url = parts[1];
        
        const episodeData = {
          title, // 剧集标题
          url,   // 剧集URL
        };
        
        // 如果需要二次请求，添加相关标记和cid
        if (requireCid) {
          episodeData.requireCid = true;
          episodeData.cid = url; // 使用URL作为cid
        }
        
        episodesArray.push(episodeData);
      }
    });
    
  } catch (error) {
    console.error('解析剧集失败:', error);
  }
  
  return episodesArray;
};

// 获取指定key的网站设置 (key可以是'info'等)
export const getSiteSettings = async (key) => {
  try {
    const response = await axios.get(`/api/settings/${key}`);
    return response.data;
  } catch (error) {
    console.error(`获取网站设置 [${key}] 失败:`, error);
    throw error;
  }
};

// 获取所有网站设置
export const getAllSiteSettings = async () => {
  try {
    const response = await axios.get('/api/settings/');
    return response.data;
  } catch (error) {
    console.error('获取所有网站设置失败:', error);
    throw error;
  }
};

// 更新网站设置 (需要管理员权限，key可以是'info'等)
export const updateSiteSettings = async (key, settingValue) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('未登录或认证令牌已过期');
    }
    
    // 详细打印调试信息
    console.log(`准备更新设置 [${key}], 提交的数据:`, JSON.stringify(settingValue, null, 2));
    console.log(`认证令牌前10位: ${token.substring(0, 10)}...`);
    
    // 构造请求数据
    const requestData = { setting_value: settingValue };
    console.log(`完整请求数据对象:`, requestData);
    
    // 使用单/api前缀
    const response = await axios.put(`/api/settings/${key}`, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`设置更新成功: 状态码=${response.status}, 响应数据:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`更新网站设置 [${key}] 失败:`, error);
    
    // 打印详细错误信息
    if (error.response) {
      console.error(`错误状态码: ${error.response.status}`);
      console.error(`错误响应数据:`, error.response.data);
      console.error(`请求URL: ${error.config.url}`);
      console.error(`请求头:`, error.config.headers);
      console.error(`请求数据:`, error.config.data);
    }
    
    throw error;
  }
}; 