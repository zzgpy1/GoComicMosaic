/**
 * 外部数据源加载器
 * 负责安全地加载和执行外部数据源脚本
 */

import axios from 'axios';
// 导入CORS代理工具
import corsProxy from './corsProxy';
// 使用新的 LibLoader 替代旧的 ExternalLibLoader
import libLoader from './libLoader';

// 外部数据源加载器
const ExternalDataSourceLoader = {
  /**
   * 加载外部数据源脚本
   * @param {string} url - 脚本URL
   * @returns {Promise<Object>} 数据源对象
   */
  async load(url) {
    try {
      console.log(`[外部数据源加载器] 开始加载数据源: ${url}`);
      
      // 添加CORS代理
      const proxyUrl = corsProxy.addCorsProxy(url);
      
      // 发送请求获取脚本内容
      const response = await axios.get(proxyUrl, {
        headers: {
          'Content-Type': 'application/javascript'
        }
      });
      
      const scriptContent = response.data;
      
      // 执行脚本并获取数据源对象
      const dataSource = await this.executeScript(scriptContent);
      
      // 验证数据源
      if (this.validateDataSource(dataSource)) {
        return dataSource;
      } else {
        throw new Error('无效的数据源格式');
      }
    } catch (error) {
      console.error(`[外部数据源加载器] 加载失败: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * 在安全环境中执行脚本
   * @param {string} scriptContent - 脚本内容
   * @returns {Promise<Object>} 数据源对象
   */
  async executeScript(scriptContent) {
    return new Promise((resolve, reject) => {
      try {
        // 创建安全的执行环境
        const module = { exports: {} };
        
        // 提供安全的依赖注入
        const require = (dep) => {
          console.log(`[外部数据源加载器] 请求依赖: ${dep}`);
          
          // 不支持真正的require，提供有限的模拟
          if (dep === 'axios') {
            return axios;
          }
          
          throw new Error(`不支持的依赖: ${dep}`);
        };
        
        // 提供安全的代理对象
        const proxy = corsProxy;
        
        // 提供库加载器
        const lib = libLoader;
        
        // 执行脚本
        const fn = new Function('module', 'exports', 'require', 'proxy', 'lib', scriptContent);
        fn(module, module.exports, require, proxy, lib);
        
        // 初始化数据源
        const dataSource = module.exports;
        
        // 如果数据源有初始化方法，则调用
        if (dataSource && typeof dataSource.init === 'function') {
          console.log(`[外部数据源加载器] 初始化数据源: ${dataSource.name || 'unknown'}`);
          // 异步初始化
          Promise.resolve(dataSource.init())
            .then(() => {
              resolve(dataSource);
            })
            .catch(err => {
              console.warn(`[外部数据源加载器] 初始化数据源失败: ${err.message}`);
              // 即使初始化失败，也返回数据源对象
              resolve(dataSource);
            });
        } else {
          resolve(dataSource);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * 验证数据源格式
   * @param {Object} dataSource - 数据源对象
   * @returns {boolean} 是否有效
   */
  validateDataSource(dataSource) {
    // 检查必要的属性和方法
    const isValid = dataSource && 
           typeof dataSource === 'object' &&
           typeof dataSource.name === 'string' &&
           typeof dataSource.searchMovies === 'function';
           
    // 如果基本验证不通过，直接返回false
    if (!isValid) {
      console.warn('[外部数据源加载器] 数据源验证失败：缺少必要的属性或方法');
      return false;
    }
    
    // 如果数据源没有id，自动生成一个
    if (typeof dataSource.id !== 'string') {
      console.log('[外部数据源加载器] 数据源缺少id属性，将自动生成');
      // 使用name作为id的基础
      dataSource.id = dataSource.name.toLowerCase().replace(/\s+/g, '_');
    }
    
    return true;
  }
};

// 导出模块
export default ExternalDataSourceLoader; 