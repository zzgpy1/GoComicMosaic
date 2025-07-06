/**
 * CORS代理工具
 * 提供统一的跨域请求处理功能
 */

/**
 * 添加CORS代理前缀到URL
 * @param {string} url - 要代理的URL
 * @param {Object} [headers] - 需要传递的请求头
 * @returns {string} 代理后的URL
 */
export function addCorsProxy(url, headers) {
  // 如果URL为空，直接返回
  if (!url) {
    console.warn('[CORS代理] 代理URL为空');
    return '';
  }
  
  console.log(`[CORS代理] 添加代理前缀，原始URL: ${url}...`);
  
  // 如果URL已经包含了代理前缀，则直接返回
  if (url.includes('/api/proxy?') || url.startsWith('/api/proxy?')) {
    console.log('[CORS代理] URL已包含代理前缀，无需再次添加');
    return url;
  }
  
  // 使用系统内置的CORS代理服务
  let PROXY_BASE_URL = '/api/proxy?url=';
  
  // 如果有headers，也添加到代理URL中
  if (headers && Object.keys(headers).length > 0) {
    // 确保只包含必要的头信息
    const cleanHeaders = {};
    
    // 只保留重要的头信息
    if (headers.Referer || headers.referer) {
      cleanHeaders.Referer = headers.Referer || headers.referer;
    }
    
    if (headers["User-Agent"]) {
      cleanHeaders["User-Agent"] = headers["User-Agent"];
    }
    
    // 保留Cookie头信息
    if (headers.Cookie || headers.cookie) {
      cleanHeaders.Cookie = headers.Cookie || headers.cookie;
    }
    
    // 如果有必要的头信息，添加到代理URL
    if (Object.keys(cleanHeaders).length > 0) {
      // 转换为JSON字符串并编码
      const encodedHeaders = encodeURIComponent(JSON.stringify(cleanHeaders));
      PROXY_BASE_URL = `/app/proxy?headers=${encodedHeaders}&url=`;
      console.log('[CORS代理] 添加自定义headers到代理URL');
    }
  }
  
  // 确保URL是有效的，如果不是完整URL，添加http前缀
  if (!url.match(/^https?:\/\//)) {
    url = 'http:' + url;
    console.log(`[CORS代理] URL不完整，添加http前缀: ${url}...`);
  }
  
  // 使用encodeURIComponent编码整个URL
  const encodedUrl = encodeURIComponent(url);
  const finalUrl = `${PROXY_BASE_URL}${encodedUrl}`;
  
  console.log(`[CORS代理] 最终代理URL: ${finalUrl}...`);
  return finalUrl;
}

/**
 * 通过代理发送请求并获取JSON响应
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
export async function fetchWithProxy(url, options = {}) {
  try {
    // 始终使用代理URL
    const proxyUrl = addCorsProxy(url, options.headers || {});
    
    const response = await fetch(proxyUrl, options);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    return await response.json();
  } catch (e) {
    console.error(`[CORS代理] 请求失败: ${url}, 错误: ${e.message}`);
    throw e;
  }
}

/**
 * 通过代理发送POST请求并获取JSON响应
 * @param {string} url - 请求URL
 * @param {Object|FormData} data - 请求数据
 * @param {Object} headers - 请求头
 * @returns {Promise<Object>} 响应数据
 */
export async function postWithProxy(url, data, headers = {}) {
  const options = {
    method: 'POST',
    headers,
    body: data instanceof FormData ? data : JSON.stringify(data)
  };
  
  // 如果不是FormData，添加Content-Type头
  if (!(data instanceof FormData) && !headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  return fetchWithProxy(url, options);
}

// 导出默认对象，包含所有方法
export default {
  addCorsProxy,
  fetchWithProxy,
  postWithProxy
}; 