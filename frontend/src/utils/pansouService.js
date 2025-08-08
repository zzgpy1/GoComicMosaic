import axios from 'axios';

// 创建一个专用于网盘搜索的axios实例，避免全局配置影响
const pansouAxios = axios.create({
  baseURL: '', // 显式设置为空，避免继承全局baseURL
  timeout: 10000 // 10秒超时
});

/**
 * 搜索网盘资源
 * @param {string} keyword - 搜索关键词
 * @param {boolean} refresh - 是否刷新结果
 * @param {Function} onUpdate - 结果更新时的回调函数
 * @param {Function} onComplete - 异步更新完成后的回调函数
 * @param {Object} ext - 扩展参数，包含referer和英文标题等
 * @returns {Promise<Object>} 搜索结果
 */
export const searchPanResources = async (keyword, refresh = false, onUpdate = null, onComplete = null, ext = null) => {
  console.log('pansouService: 开始搜索关键词:', keyword);
  
  if (!keyword || keyword.trim() === '') {
    console.error('搜索关键词为空');
    return {};
  }
  
  try {
    // 构建请求参数
    const params = {
      kw: keyword,
      refresh: refresh,
      res: 'merge',
      src: 'all'
    };
    
    // 如果有扩展参数，添加到请求中
    if (ext && typeof ext === 'object') {
      params.ext = JSON.stringify(ext);
      console.log('pansouService: 添加扩展参数:', ext);
    }
    
    // 确保直接调用/pansou/api/search而不是通过/app前缀
    const requestUrl = `/pansou/api/search?kw=${encodeURIComponent(keyword)}&refresh=${refresh}&res=merge&src=all`;
    console.log('pansouService: 发送API请求到:', requestUrl);
    console.log('pansouService: 完整URL应为:', window.location.origin + requestUrl);
    console.log('pansouService: 请求参数:', params);
    
    const response = await pansouAxios.get(`/pansou/api/search`, {
      params: params
    });
    
    console.log('pansouService: API响应:', response);
    
    if (response.data.code === 0 && response.data.message === 'success') {
      const results = response.data.data.merged_by_type || {};
      console.log('pansouService: 搜索成功, 返回结果:', results);
      
      // 如果是首次搜索且有回调函数，则异步再次请求更新结果
      if (!refresh && typeof onUpdate === 'function') {
        console.log('pansouService: 将在4秒后异步更新搜索结果');
        setTimeout(async () => {
          try {
            console.log('pansouService: 开始异步更新搜索结果');
            const updatedResults = await searchPanResources(keyword, false, null, null, ext);
            console.log('pansouService: 异步更新完成，新结果:', updatedResults);
            onUpdate(updatedResults);
            
            // 调用完成回调
            if (typeof onComplete === 'function') {
              onComplete();
            }
          } catch (error) {
            console.error('pansouService: 异步更新失败:', error);
            // 即使失败也调用完成回调
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }
        }, 4000); // 4秒后再次请求
      }
      
      return results;
    }
    
    console.warn('pansouService: API返回错误码:', response.data);
    return {};
  } catch (error) {
    console.error('搜索网盘资源失败:', error);
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送，但没有收到响应
      console.error('请求已发送，但没有收到响应:', error.request);
    } else {
      // 在设置请求时发生了错误
      console.error('请求设置错误:', error.message);
    }
    return {};
  }
};

// 将API返回的资源转换为与系统兼容的格式
export const convertToResourceLinks = (panResources) => {
  console.log('pansouService: 开始转换资源格式, 输入:', panResources);
  
  if (!panResources || typeof panResources !== 'object') {
    console.warn('pansouService: 无效的资源数据');
    return {};
  }
  
  const result = {};
  
  try {
    // 处理每种网盘类型 - 无需映射，直接使用
    Object.keys(panResources).forEach(type => {
      if (Array.isArray(panResources[type])) {
        // 转换每个链接
        result[type] = panResources[type].map(item => ({
          url: item.url || '',
          password: item.password || '',
          note: item.note || '',
        }));
      }
    });
    
    console.log('pansouService: 转换完成, 输出:', result);
    return result;
  } catch (error) {
    console.error('pansouService: 转换资源格式失败:', error);
    return {};
  }
};