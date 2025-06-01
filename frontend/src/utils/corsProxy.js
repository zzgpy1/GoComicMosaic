// CORS代理服务 - 使用Go后端API
const PROXY_BASE_URL = '/proxy?url=';

/**
 * 为URL添加CORS代理前缀
 * @param {string} url 需要请求的原始URL
 * @returns {string} 添加代理前缀后的URL
 */
export const addCorsProxy = (url) => {
  // 只针对localhost和127.0.0.1的URL不使用代理
  // if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
  //   return url;
  // }
  
  // 如果URL已经包含了代理前缀，则直接返回
  if (url.includes('/proxy?url=')) {
    return url;
  }

  // 使用encodeURIComponent编码整个URL
  const encodedUrl = encodeURIComponent(url);
  return `${PROXY_BASE_URL}${encodedUrl}`;
};

/**
 * 检查URL是否需要添加CORS代理
 * @param {string} url 需要检查的URL
 * @returns {boolean} 是否需要添加CORS代理
 */
export const needsCorsProxy = (url) => {
  // 检查URL是否是外部资源
  return !url.startsWith('http://localhost') && 
         !url.startsWith('http://127.0.0.1') &&
         !url.includes(window.location.hostname);
};

/**
 * 从包含代理的URL中提取原始URL
 * @param {string} proxiedUrl 包含代理前缀的URL
 * @returns {string} 原始URL
 */
export const getOriginalUrl = (proxiedUrl) => {
  if (proxiedUrl.startsWith(PROXY_BASE_URL)) {
    return decodeURIComponent(proxiedUrl.substring(PROXY_BASE_URL.length));
  }
  return proxiedUrl;
};

export default {
  addCorsProxy,
  needsCorsProxy,
  getOriginalUrl
}; 