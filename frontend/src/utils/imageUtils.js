/**
 * Image hash utilities for frontend
 */

/**
 * 生成简单的文件指纹
 * 注意：此方法不是真正的密码学哈希，只是用于HTTP环境下的替代方案
 * @param {File} file - 文件对象
 * @returns {string} - 文件指纹字符串
 */
const generateFileFingerprint = (file) => {
  // 使用文件大小、最后修改时间和文件名生成一个指纹
  const lastModified = file.lastModified || Date.now();
  const size = file.size || 0;
  const name = file.name || '';
  const randomStr = Math.random().toString(36).substring(2, 10);
  
  // 组合成唯一字符串
  const combinedString = `${name}-${size}-${lastModified}-${randomStr}`;
  
  // 简单的字符串散列函数
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 转换为16进制字符串并确保长度一致
  const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
  return hexHash + randomStr + Date.now().toString(16).slice(-8);
};

/**
 * Calculate SHA-256 hash of a file
 * @param {File} file - The file to hash
 * @returns {Promise<string>} - Promise resolving to hash string
 */
export const calculateFileHash = async (file) => {
  return new Promise((resolve) => {
    // 检查是否在安全上下文(HTTPS)中运行并且Web Crypto API可用
    const isSecureContext = window.isSecureContext;
    const isCryptoAvailable = window.crypto && window.crypto.subtle;
    
    // 如果不在安全上下文或者Crypto API不可用，使用备用方法
    if (!isSecureContext || !isCryptoAvailable) {
      console.log('Web Crypto API不可用（可能是HTTP环境），使用备用方法');
      const fingerprint = generateFileFingerprint(file);
      return resolve(fingerprint);
    }
    
    // 在HTTPS环境下使用标准Web Crypto API
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        
        // 将哈希转换为十六进制字符串
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        resolve(hashHex);
      } catch (error) {
        console.warn('使用Web Crypto API计算哈希失败，切换到备用方法', error);
        const fingerprint = generateFileFingerprint(file);
        resolve(fingerprint);
      }
    };
    
    reader.onerror = () => {
      console.warn('读取文件失败，使用备用方法');
      const fingerprint = generateFileFingerprint(file);
      resolve(fingerprint);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extract file extension with the dot
 * @param {string} filename - The filename
 * @returns {string} - File extension with dot (e.g., ".jpg")
 */
export const getFileExtension = (filename) => {
  return filename.substring(filename.lastIndexOf('.'));
};

/**
 * 资源图片工具函数
 */

/**
 * 获取图片URL，处理资源路径
 * 确保无论后端ASSETS_PATH如何设置，前端都能正确引用资源
 * 
 * @param {string} imagePath - 图片路径
 * @param {string} defaultImage - 默认图片URL，当imagePath为空时使用
 * @returns {string} 正确的图片URL
 */
export const getImageUrl = (imagePath, defaultImage = 'https://via.placeholder.com/300x400') => {
  if (!imagePath) return defaultImage;
  
  // 如果路径已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 确保路径以/assets/开头
  if (!imagePath.startsWith('/assets/')) {
    // 如果路径不以/assets/开头，但包含assets，尝试修正
    if (imagePath.includes('assets/')) {
      const assetIndex = imagePath.indexOf('assets/');
      return '/' + imagePath.substring(assetIndex);
    }
    // 如果是相对路径，添加/assets/前缀
    return `/assets/${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}`;
  }
  
  return imagePath;
};

/**
 * 获取资源的海报图片URL
 * 
 * @param {Object} resource - 资源对象
 * @param {string} defaultImage - 默认图片URL
 * @returns {string} 海报图片URL
 */
export const getPosterImage = (resource, defaultImage = 'https://via.placeholder.com/300x400') => {
  if (!resource) return defaultImage;
  
  // 优先使用指定的海报图片
  if (resource.poster_image) {
    return getImageUrl(resource.poster_image, defaultImage);
  }
  // 如果没有指定海报，则使用第一张图片
  else if (resource.images && resource.images.length > 0) {
    return getImageUrl(resource.images[0], defaultImage);
  } 
  // 都没有则使用占位图
  else {
    return defaultImage;
  }
};

/**
 * 检查图片是否存在
 * 
 * @param {string} url - 图片URL
 * @returns {Promise<boolean>} 图片是否存在
 */
export const checkImageExists = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}; 