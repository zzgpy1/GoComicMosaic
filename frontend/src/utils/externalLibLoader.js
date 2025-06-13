/**
 * 外部依赖加载器
 * 提供通用的外部JavaScript库加载功能
 */

const ExternalLibLoader = {
  // 加载外部库的缓存
  _loadedLibs: {},
  
  /**
   * 通用的外部依赖加载接口
   * @param {Object} options - 加载选项
   * @param {string} options.name - 库名称，用于日志和缓存键
   * @param {string} options.globalVar - 全局变量名，用于检查库是否已存在
   * @param {string} options.cdnUrl - CDN URL，用于动态加载
   * @param {string} options.npmPackage - npm包名，用于Node.js环境
   * @param {Function} options.validator - 验证函数，用于验证加载的库是否有效
   * @returns {Promise<any>} 加载的库
   */
  async loadExternalLib(options) {
    const { name, globalVar, cdnUrl, npmPackage, validator } = options;
    
    // 如果已经加载过，直接返回
    if (this._loadedLibs[name]) {
      console.log(`[ExternalLibLoader] 使用缓存的${name}库`);
      return this._loadedLibs[name];
    }
    
    // 检查全局变量是否存在
    if (typeof window !== 'undefined' && globalVar && window[globalVar]) {
      console.log(`[ExternalLibLoader] 检测到全局${name}库已存在`);
      const lib = window[globalVar];
      
      // 如果提供了验证函数，验证库是否有效
      if (validator && !validator(lib)) {
        console.warn(`[ExternalLibLoader] 全局${name}库验证失败`);
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
          console.warn(`[ExternalLibLoader] 通过require加载的${name}库验证失败`);
        } else {
          console.log(`[ExternalLibLoader] 成功通过require加载${name}库`);
          this._loadedLibs[name] = lib;
          return lib;
        }
      } catch (e) {
        console.warn(`[ExternalLibLoader] 通过require加载${name}库失败:`, e);
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
              console.warn(`[ExternalLibLoader] 动态加载的${name}库验证失败`);
              reject(new Error(`${name}库验证失败`));
              return;
            }
            
            console.log(`[ExternalLibLoader] 成功通过动态脚本加载${name}库`);
            this._loadedLibs[name] = lib;
            resolve(lib);
          } else {
            console.warn(`[ExternalLibLoader] 加载${name}脚本成功但无法访问全局变量${globalVar}`);
            reject(new Error(`${globalVar}未定义`));
          }
        };
        
        script.onerror = (err) => {
          console.warn(`[ExternalLibLoader] 动态加载${name}库失败:`, err);
          reject(err);
        };
        
        // 添加到文档
        document.head.appendChild(script);
      }).catch(err => {
        console.warn(`[ExternalLibLoader] 动态加载${name}库出错:`, err);
        return null;
      });
    }
    
    console.warn(`[ExternalLibLoader] 无法加载${name}库，环境不支持任何加载方式`);
    return null;
  },
  
  /**
   * 加载常用库的便捷方法
   */
  
  // 加载CryptoJS库
  async loadCryptoJS() {
    return this.loadExternalLib({
      name: 'CryptoJS',
      globalVar: 'CryptoJS',
      cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
      npmPackage: 'crypto-js',
      validator: (lib) => lib && typeof lib.MD5 === 'function'
    });
  },
  
  // 加载jQuery库
  async loadJQuery() {
    return this.loadExternalLib({
      name: 'jQuery',
      globalVar: '$',
      cdnUrl: 'https://code.jquery.com/jquery-3.6.0.min.js',
      npmPackage: 'jquery',
      validator: (lib) => lib && typeof lib.ajax === 'function'
    });
  },
  
  // 加载Lodash库
  async loadLodash() {
    return this.loadExternalLib({
      name: 'Lodash',
      globalVar: '_',
      cdnUrl: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
      npmPackage: 'lodash',
      validator: (lib) => lib && typeof lib.map === 'function'
    });
  },
  
  // 加载Axios库
  async loadAxios() {
    return this.loadExternalLib({
      name: 'Axios',
      globalVar: 'axios',
      cdnUrl: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
      npmPackage: 'axios',
      validator: (lib) => lib && typeof lib.get === 'function'
    });
  },
  
  // 加载DayJS库
  async loadDayJS() {
    return this.loadExternalLib({
      name: 'DayJS',
      globalVar: 'dayjs',
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.7/dayjs.min.js',
      npmPackage: 'dayjs',
      validator: (lib) => lib && typeof lib().format === 'function'
    });
  }
};

// 导出为模块
export default ExternalLibLoader; 