/**
 * Image hash utilities for frontend
 */

/**
 * Calculate SHA-256 hash of a file
 * @param {File} file - The file to hash
 * @returns {Promise<string>} - Promise resolving to hash string
 */
export const calculateFileHash = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      
      try {
        // Use the Web Crypto API to calculate SHA-256 hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        
        // Convert the hash to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        resolve(hashHex);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
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