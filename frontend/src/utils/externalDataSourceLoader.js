/**
 * 外部数据源加载器
 * 用于从远程URL加载自定义数据源JS文件
 */

// 导入库加载器
import libLoader from './libLoader';
// 导入CORS代理工具
import corsProxy from './corsProxy';

/**
 * 加载外部数据源
 * @param {string} url - 外部数据源JS文件的URL
 * @returns {Promise<Object>} - 加载的数据源对象
 */
export async function loadExternalDataSource(url) {
  try {
    console.log(`开始加载外部数据源: ${url}`);
    
    // 使用CORS代理加载外部脚本，避免跨域问题
    const proxyUrl = corsProxy.addCorsProxy(url);
    
    // 加载外部脚本
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`获取失败: ${response.statusText}`);
    }
    
    const jsContent = await response.text();
    
    // 创建一个安全的执行环境
    const dataSource = await executeExternalScript(jsContent, url);
    
    // 验证数据源格式
    validateDataSource(dataSource);
    
    // 返回数据源对象，添加额外的标识属性
    return {
      ...dataSource,
      isExternal: true,
      sourceUrl: url,
      id: generateDataSourceId(dataSource.name, url)
    };
  } catch (error) {
    console.error(`加载外部数据源失败 [${url}]:`, error);
    throw error;
  }
}

/**
 * 在安全的环境中执行外部脚本
 * @param {string} jsContent - JavaScript代码内容
 * @param {string} sourceUrl - 脚本来源URL，用于错误追踪
 * @returns {Promise<Object>} - 执行结果
 */
async function executeExternalScript(jsContent, sourceUrl) {
  try {
    // 使用Function构造器创建一个新的作用域
    // 注意：这并不能完全隔离代码，仅提供基本的隔离
    const scriptFunction = new Function('libLoader', 'corsProxy', `
      "use strict";
      // 创建模块环境
      const module = { exports: {} };
      const exports = module.exports;
      
      // 将库加载器注入到全局作用域
      const lib = libLoader;
      // 将代理工具注入到全局作用域
      const proxy = corsProxy;
      
      // 执行脚本代码
      ${jsContent}
      
      // 如果数据源有初始化方法，尝试调用
      if (typeof module.exports.init === 'function') {
        try {
          // 异步初始化
          (async () => {
            await module.exports.init();
            console.log('数据源初始化完成:', module.exports.name);
          })();
        } catch (e) {
          console.warn('数据源初始化失败:', e);
        }
      }
      
      // 返回导出的模块
      return module.exports.__esModule ? module.exports.default : module.exports;
    `);
    
    // 执行脚本并获取结果，传入libLoader和corsProxy作为参数
    return scriptFunction(libLoader, corsProxy);
  } catch (error) {
    console.error(`执行外部脚本失败:`, error);
    throw new Error(`执行脚本失败: ${error.message}`);
  }
}

/**
 * 验证数据源是否实现了必要的接口
 * @param {Object} dataSource - 数据源对象
 * @returns {boolean} - 验证是否通过
 */
function validateDataSource(dataSource) {
  if (!dataSource) {
    throw new Error('无效的数据源: 未找到导出对象');
  }
  
  // 检查必填字段
  if (!dataSource.name) {
    throw new Error('无效的数据源: 缺少name属性');
  }
  
  if (!dataSource.baseUrl) {
    throw new Error('无效的数据源: 缺少baseUrl属性');
  }
  
  // 检查必要的方法
  if (typeof dataSource.searchMovies !== 'function') {
    throw new Error('无效的数据源: 缺少searchMovies方法');
  }
  
  if (typeof dataSource.getMovieDetail !== 'function') {
    throw new Error('无效的数据源: 缺少getMovieDetail方法');
  }
  
  return true;
}

/**
 * 简单的字符串哈希函数
 * @param {string} str - 要哈希的字符串
 * @returns {string} - 哈希结果（16进制）
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16).substring(0, 8); // 取绝对值并转为16进制，截取前8位
}

/**
 * 生成数据源ID
 * @param {string} name - 数据源名称
 * @param {string} url - 数据源URL
 * @returns {string} - 生成的ID
 */
function generateDataSourceId(name, url) {
  // 从URL中提取文件名作为前缀
  const fileName = url.split('/').pop().replace('.js', '');
  
  // 使用URL的哈希值作为唯一标识符，而不是时间戳
  // 这样可以确保相同的URL每次生成相同的ID
  return `ext_${fileName}_${hashString(url)}`;
} 