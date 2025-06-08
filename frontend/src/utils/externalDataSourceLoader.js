/**
 * 外部数据源加载器
 * 用于从远程URL加载自定义数据源JS文件
 */

import { addCorsProxy } from './corsProxy';

/**
 * 加载外部数据源
 * @param {string} url - 外部数据源JS文件的URL
 * @returns {Promise<Object>} - 加载的数据源对象
 */
export async function loadExternalDataSource(url) {
  try {
    console.log(`开始加载外部数据源: ${url}`);
    
    // 使用CORS代理加载外部脚本，避免跨域问题
    const proxyUrl = addCorsProxy(url);
    
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
    const scriptFunction = new Function(`
      "use strict";
      // 创建模块环境
      const module = { exports: {} };
      const exports = module.exports;
      
      // 执行脚本代码
      ${jsContent}
      
      // 返回导出的模块
      return module.exports.__esModule ? module.exports.default : module.exports;
    `);
    
    // 执行脚本并获取结果
    return scriptFunction();
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
 * 生成数据源ID
 * @param {string} name - 数据源名称
 * @param {string} url - 数据源URL
 * @returns {string} - 生成的ID
 */
function generateDataSourceId(name, url) {
  // 从URL中提取文件名作为前缀
  const fileName = url.split('/').pop().replace('.js', '');
  // 组合ID: ext_{文件名}_{时间戳}
  return `ext_${fileName}_${Date.now()}`;
} 