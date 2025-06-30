/**
 * 通用库加载工具
 * 提供全局统一的外部JavaScript库加载功能
 */

// 导入存储桥接客户端模块
import { StorageBridgeClient, createStorageBridgeClient } from './storageBridge';

// 库配置信息
const LIBRARY_CONFIG = {
  // 加密相关
  'crypto-js': {
    name: 'CryptoJS',
    globalVar: 'CryptoJS',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
    npmPackage: 'crypto-js',
    validator: (lib) => lib && typeof lib.MD5 === 'function'
  },
  
  // UI/DOM相关
  'jquery': {
    name: 'jQuery',
    globalVar: '$',
    cdnUrl: 'https://code.jquery.com/jquery-3.6.0.min.js',
    npmPackage: 'jquery',
    validator: (lib) => lib && typeof lib.ajax === 'function'
  },
  
  // 工具库
  'lodash': {
    name: 'Lodash',
    globalVar: '_',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
    npmPackage: 'lodash',
    validator: (lib) => lib && typeof lib.map === 'function'
  },
  
  // 网络请求
  'axios': {
    name: 'Axios',
    globalVar: 'axios',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
    npmPackage: 'axios',
    validator: (lib) => lib && typeof lib.get === 'function'
  },
  
  // 日期处理
  'dayjs': {
    name: 'DayJS',
    globalVar: 'dayjs',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.7/dayjs.min.js',
    npmPackage: 'dayjs',
    validator: (lib) => lib && typeof lib().format === 'function'
  },
  
  // 存储桥接客户端
  'storage-bridge-client': {
    name: 'StorageBridgeClient',
    localModule: true, // 标记为本地模块
    module: {
      // 直接提供模块接口
      StorageBridgeClient,
      createStorageBridge: createStorageBridgeClient,
      createStorageBridgeClient
    },
    validator: (lib) => lib && typeof lib.createStorageBridge === 'function'
  }
};

/**
 * 库加载器类
 */
class LibLoader {
  constructor() {
    // 加载外部库的缓存
    this._loadedLibs = {};
    
    // 创建便捷方法
    this._createShorthandMethods();
  }
  
  /**
   * 创建便捷方法
   * 为每个预配置的库创建快捷加载方法
   */
  _createShorthandMethods() {
    for (const [key, config] of Object.entries(LIBRARY_CONFIG)) {
      // 创建驼峰式方法名，如 loadCryptoJs
      const methodName = `load${key.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('')}`;
      
      // 动态添加方法
      this[methodName] = async () => {
        return this.load(key);
      };
    }
  }
  
  /**
   * 加载库
   * @param {string} libKey - 库的键名或URL
   * @param {Object} [options] - 可选配置，用于覆盖默认配置或提供自定义库的配置
   * @returns {Promise<any>} 加载的库
   */
  async load(libKey, options = {}) {
    // 检查是否是预配置的库
    const isKnownLib = LIBRARY_CONFIG[libKey];
    
    // 如果是本地模块直接返回
    if (isKnownLib && LIBRARY_CONFIG[libKey].localModule) {
      const config = {
        ...LIBRARY_CONFIG[libKey],
        ...options
      };
      
      // 如果已经加载过，直接返回
      if (this._loadedLibs[config.name]) {
        console.log(`[LibLoader] 使用缓存的${config.name}库`);
        return this._loadedLibs[config.name];
      }
      
      // 返回本地模块
      console.log(`[LibLoader] 加载本地模块: ${config.name}`);
      this._loadedLibs[config.name] = config.module;
      return config.module;
    }
    
    // 如果是URL且不是已知库
    if (!isKnownLib && libKey.match(/^https?:\/\//)) {
      // 从URL推断库名和全局变量
      const libName = this._getLibNameFromUrl(libKey);
      
      // 创建配置
      options = {
        name: options.name || libName,
        globalVar: options.globalVar || libName,
        cdnUrl: libKey,
        ...options
      };
      
      return this._loadExternalLib(options);
    }
    
    // 使用预配置的库
    if (isKnownLib) {
      // 合并默认配置和用户配置
      const config = {
        ...LIBRARY_CONFIG[libKey],
        ...options
      };
      
      return this._loadExternalLib(config);
    }
    
    throw new Error(`未知的库: ${libKey}`);
  }
  
  /**
   * 从URL中推断库名
   * @param {string} url - 库的URL
   * @returns {string} 推断的库名
   */
  _getLibNameFromUrl(url) {
    // 从URL中提取文件名
    const fileName = url.split('/').pop();
    
    // 移除版本号和扩展名
    return fileName
      .replace(/\.min\.js$|\.js$/, '')
      .replace(/@[\d.]+$/, '')
      .replace(/[-.][\d.]+$/, '');
  }
  
  /**
   * 加载外部库
   * @param {Object} options - 加载选项
   * @returns {Promise<any>} 加载的库
   */
  async _loadExternalLib(options) {
    const { name, globalVar, cdnUrl, npmPackage, validator } = options;
    
    // 如果已经加载过，直接返回
    if (this._loadedLibs[name]) {
      console.log(`[LibLoader] 使用缓存的${name}库`);
      return this._loadedLibs[name];
    }
    
    // 检查全局变量是否存在
    if (typeof window !== 'undefined' && globalVar && window[globalVar]) {
      console.log(`[LibLoader] 检测到全局${name}库已存在`);
      const lib = window[globalVar];
      
      // 如果提供了验证函数，验证库是否有效
      if (validator && !validator(lib)) {
        console.warn(`[LibLoader] 全局${name}库验证失败`);
      } else {
        this._loadedLibs[name] = lib;
        return lib;
      }
    }
    
    // 尝试使用require（Node.js环境）
    if (typeof require === 'function' && npmPackage) {
      try {
        const lib = require(npmPackage);
        
        // 如果提供了验证函数，验证库是否有效
        if (validator && !validator(lib)) {
          console.warn(`[LibLoader] 通过require加载的${name}库验证失败`);
        } else {
          console.log(`[LibLoader] 成功通过require加载${name}库`);
          this._loadedLibs[name] = lib;
          return lib;
        }
      } catch (e) {
        console.warn(`[LibLoader] 通过require加载${name}库失败:`, e);
      }
    }
    
    // 尝试动态加载脚本（浏览器环境）
    if (typeof window !== 'undefined' && cdnUrl) {
      return new Promise((resolve, reject) => {
        // 创建script标签
        const script = document.createElement('script');
        script.src = cdnUrl;
        script.async = true;
        
        script.onload = () => {
          // 检查全局变量是否存在
          if (globalVar && window[globalVar]) {
            const lib = window[globalVar];
            
            // 如果提供了验证函数，验证库是否有效
            if (validator && !validator(lib)) {
              console.warn(`[LibLoader] 动态加载的${name}库验证失败`);
              reject(new Error(`${name}库验证失败`));
              return;
            }
            
            console.log(`[LibLoader] 成功通过动态脚本加载${name}库`);
            this._loadedLibs[name] = lib;
            resolve(lib);
          } else {
            console.warn(`[LibLoader] 加载${name}脚本成功但无法访问全局变量${globalVar}`);
            reject(new Error(`${globalVar}未定义`));
          }
        };
        
        script.onerror = (err) => {
          console.warn(`[LibLoader] 动态加载${name}库失败:`, err);
          reject(err);
        };
        
        // 添加到文档
        document.head.appendChild(script);
      }).catch(err => {
        console.warn(`[LibLoader] 动态加载${name}库出错:`, err);
        return null;
      });
    }
    
    console.warn(`[LibLoader] 无法加载${name}库，环境不支持任何加载方式`);
    return null;
  }
  
  /**
   * 预加载多个库
   * @param {Array<string>} libs - 要预加载的库的键名或URL数组
   * @returns {Promise<Object>} 加载的库的映射
   */
  async preload(libs) {
    const results = {};
    
    for (const lib of libs) {
      try {
        results[lib] = await this.load(lib);
      } catch (e) {
        console.warn(`[LibLoader] 预加载${lib}失败:`, e);
        results[lib] = null;
      }
    }
    
    return results;
  }
}

// 创建单例实例
const libLoader = new LibLoader();

// 导出为模块
export default libLoader; 