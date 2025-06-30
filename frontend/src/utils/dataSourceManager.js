// 导入数据源索引文件
import dataSources from './dataSources';
import infoManager from './InfoManager';
import { validateDataSource } from './dataSourceInterface';

// 简单的事件发布订阅系统
const eventBus = {
  listeners: {},
  
  // 添加事件监听器
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback); // 返回取消订阅函数
  },
  
  // 移除事件监听器
  off(event, callback) {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(callback);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }
  },
  
  // 触发事件
  emit(event, ...args) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }
};

/**
 * 数据源管理器类
 * 
 * 提供数据源的统一管理功能，包括注册、获取、切换等操作
 * 现在支持简化的数据源配置，只需要配置name、baseUrl和useXml三个核心参数
 * 增加了外部数据源支持，可以通过URL加载自定义数据源
 */
class DataSourceManager {
  constructor() {
    // 注册的数据源列表
    this.dataSources = {};
    
    // 数据源信息，包括是否支持getPlayUrl等
    this.dataSourcesInfo = {};
    
    // 当前使用的数据源ID
    this.currentDataSourceId = null;
    
    // 批量更新相关变量
    this.updatePending = false;
    this.batchUpdateTimeout = null;
    
    // 初始化状态标志
    this._initialized = false;
    this._initializing = false;
    this._loadingPromise = null;
    
    // 从localStorage加载之前选择的数据源ID（但不加载数据源内容）
    this._loadSelectedDataSourceId();
  }
  
  // 是否已初始化
  isInitialized() {
    return this._initialized;
  }
  
  // 异步初始化方法，用于按需加载数据源
  async initialize(loadAllSources = false) {
    // 如果已经初始化或正在初始化，则直接返回
    if (this._initialized || this._initializing) {
      return this._loadingPromise;
    }
    
    // 设置初始化标志
    this._initializing = true;
    
    // 创建加载Promise
    this._loadingPromise = (async () => {
      try {
        console.log('[数据源管理器] 开始初始化...');
        
        // 注册内置数据源
    this.registerBuiltinDataSources();
        
        // 如果需要加载所有外部数据源
        if (loadAllSources) {
          await this.loadExternalDataSources();
        } else if (this.currentDataSourceId) {
          // 否则只加载当前选择的数据源（如果是外部数据源）
          await this._loadCurrentDataSource();
        }
        
        // 设置初始化完成标志
        this._initialized = true;
        console.log('[数据源管理器] 初始化完成');
      } catch (error) {
        console.error('[数据源管理器] 初始化失败:', error);
      } finally {
        this._initializing = false;
      }
    })();
    
    return this._loadingPromise;
  }
  
  // 加载当前选择的数据源（如果是外部数据源）
  async _loadCurrentDataSource() {
    if (!this.currentDataSourceId) {
      return;
    }
    
    // 如果当前数据源已加载，则无需再次加载
    if (this.dataSources[this.currentDataSourceId]) {
      return;
    }
    
    try {
      // 首先尝试从site_info_cache中获取外部数据源信息
      try {
        const siteInfo = await infoManager.getInfo();
        if (siteInfo && siteInfo.externalDataSources && Array.isArray(siteInfo.externalDataSources)) {
          const currentSource = siteInfo.externalDataSources.find(source => source.id === this.currentDataSourceId);
          if (currentSource) {
            console.log(`[数据源管理器] 从site_info_cache加载当前选择的外部数据源: ${currentSource.name} (${currentSource.id})`);
            await this.loadExternalDataSource(currentSource.url);
            return;
          }
        }
      } catch (dbError) {
        console.warn(`[数据源管理器] 从site_info_cache加载当前数据源失败: ${dbError.message}`);
      }
      
      // 如果site_info_cache中没有，尝试从localStorage中获取外部数据源信息
      const savedSourcesJson = localStorage.getItem('externalDataSources');
      if (savedSourcesJson) {
        const savedSources = JSON.parse(savedSourcesJson);
        
        // 查找当前数据源ID对应的外部数据源
        const currentSource = savedSources.find(source => source.id === this.currentDataSourceId);
        if (currentSource) {
          console.log(`[数据源管理器] 从localStorage加载当前选择的外部数据源: ${currentSource.name} (${currentSource.id})`);
          await this.loadExternalDataSource(currentSource.url);
        }
      }
    } catch (error) {
      console.error('[数据源管理器] 加载当前数据源失败:', error);
      throw error; // 将错误向上传递，以便调用者知道加载失败
    }
  }
  
  // 从localStorage加载数据源ID设置（不加载数据源内容）
  _loadSelectedDataSourceId() {
    try {
      const savedId = localStorage.getItem('selectedDataSource');
      if (savedId) {
        this.currentDataSourceId = savedId;
        console.log(`[数据源管理器] 从localStorage加载数据源ID: ${savedId}`);
      }
    } catch (e) {
      console.error('[数据源管理器] 无法加载数据源ID设置:', e);
    }
  }
  
  // 批量触发数据源更新事件，避免频繁触发
  triggerDataSourcesUpdated() {
    if (this.updatePending) {
      return; // 如果已经有待处理的更新，不再重复设置
    }
    
    this.updatePending = true;
    
    // 清除可能存在的旧定时器
    if (this.batchUpdateTimeout) {
      clearTimeout(this.batchUpdateTimeout);
    }
    
    // 设置新的定时器，延迟触发更新事件
    this.batchUpdateTimeout = setTimeout(() => {
      const allSources = this.getAllDataSources();
      console.log('触发数据源更新事件，当前所有数据源:', allSources);
      eventBus.emit('dataSources.updated', allSources);
      this.updatePending = false;
      this.batchUpdateTimeout = null;
    }, 100); // 100ms 的延迟，可以根据需要调整
  }
  
  // 注册内置的数据源
  registerBuiltinDataSources() {
    console.log('[数据源管理器] 开始注册内置数据源...');
    
    // 尝试从site_info_cache获取内置数据源列表
    infoManager.getInfo().then(siteInfo => {
      const internalSources = siteInfo?.internalDataSources || [];
      console.log(`[数据源管理器] 从site_info_cache获取到 ${internalSources.length} 个内置数据源配置`);
      
      if (internalSources.length > 0) {
        // 只注册site_info_cache中指定的内置数据源
        internalSources.forEach(sourceId => {
          if (dataSources[sourceId]) {
            console.log(`[数据源管理器] 尝试注册site_info_cache中的内置数据源: ${sourceId}`);
            this.register(sourceId, dataSources[sourceId], false);
          } else {
            console.warn(`[数据源管理器] site_info_cache中指定的数据源 ${sourceId} 不存在`);
          }
        });
      } else {
        // 如果site_info_cache中没有内置数据源信息，则注册所有可用的内置数据源
        console.log('[数据源管理器] site_info_cache中无内置数据源配置，注册所有可用数据源');
    Object.keys(dataSources).forEach(id => {
          console.log(`[数据源管理器] 尝试注册内置数据源: ${id}`);
          this.register(id, dataSources[id], false);
    });
      }
    
    // 检查是否有可用的数据源
    const availableDataSources = Object.keys(this.dataSources);
      console.log(`[数据源管理器] 已注册 ${availableDataSources.length} 个内置数据源:`, availableDataSources);
    
    // 如果没有设置当前数据源，则设置默认数据源
      if (!this.currentDataSourceId || !this.dataSources[this.currentDataSourceId]) {
      // 优先使用黑木耳数据源，如果不存在则使用第一个可用的数据源
      if (this.dataSources['heimuer']) {
          this.currentDataSourceId = 'heimuer';
          console.log('[数据源管理器] 已设置默认数据源: heimuer');
      } else if (availableDataSources.length > 0) {
          this.currentDataSourceId = availableDataSources[0];
          console.log(`[数据源管理器] 已设置默认数据源: ${availableDataSources[0]}`);
      } else {
          console.warn('[数据源管理器] 没有可用的数据源！');
        }
        
        // 保存默认数据源到localStorage
        try {
          if (this.currentDataSourceId) {
            localStorage.setItem('selectedDataSource', this.currentDataSourceId);
          }
        } catch (e) {
          console.error('[数据源管理器] 无法保存默认数据源设置:', e);
        }
      }
      
      // 批量触发一次数据源更新事件
      this.triggerDataSourcesUpdated();
    }).catch(error => {
      console.error('[数据源管理器] 获取site_info_cache失败，使用所有内置数据源:', error);
      
      // 如果获取site_info_cache失败，则注册所有可用的内置数据源
      Object.keys(dataSources).forEach(id => {
        console.log(`[数据源管理器] 尝试注册内置数据源: ${id}`);
        this.register(id, dataSources[id], false);
      });
      
      // 检查是否有可用的数据源
      const availableDataSources = Object.keys(this.dataSources);
      console.log(`[数据源管理器] 已注册 ${availableDataSources.length} 个内置数据源:`, availableDataSources);
      
      // 设置默认数据源
      if (!this.currentDataSourceId || !this.dataSources[this.currentDataSourceId]) {
        if (availableDataSources.length > 0) {
          this.currentDataSourceId = availableDataSources[0];
          try {
            localStorage.setItem('selectedDataSource', this.currentDataSourceId);
          } catch (e) {
            console.error('[数据源管理器] 无法保存默认数据源设置:', e);
          }
        }
      }
      
      // 批量触发一次数据源更新事件
      this.triggerDataSourcesUpdated();
    });
  }
  
  // 注册一个新的数据源
  register(id, dataSource, triggerUpdate = true) {
    console.log(`[数据源管理器] 尝试注册数据源 ${id}...`);
    
    // 检查是否已经存在相同ID的数据源
    if (this.dataSources[id]) {
      // 如果已经存在，并且是同一个数据源（通过名称判断），则不重复注册
      if (this.dataSources[id].name === dataSource.name) {
        console.log(`[数据源管理器] 数据源 '${id}' (${dataSource.name}) 已存在，跳过注册`);
        return true;
      }
      console.warn(`[数据源管理器] 数据源 '${id}' 已存在，将被覆盖`);
    }
    
    try {
      // 验证数据源是否符合接口要求
      const validationResult = validateDataSource(dataSource);
      console.log(`[数据源管理器] 数据源 ${id} 验证结果:`, validationResult);
      
      // 如果验证失败但数据源是外部数据源，尝试修复常见问题
      if (!validationResult.valid && dataSource.isExternal) {
        console.warn(`[数据源管理器] 外部数据源 '${id}' 验证失败，尝试修复常见问题`);
        
        // 确保数据源有必要的方法
        if (typeof dataSource.searchMovies !== 'function') {
          console.warn(`[数据源管理器] 数据源 ${id} 缺少searchMovies方法，无法修复`);
          return false;
        }
        
        if (typeof dataSource.getMovieDetail !== 'function') {
          console.warn(`[数据源管理器] 数据源 ${id} 缺少getMovieDetail方法，添加兼容实现`);
          dataSource.getMovieDetail = async (movieId) => {
            return { id: movieId, title: `无法获取详情: ${movieId}`, description: '此数据源不支持获取详情功能' };
          };
        }
        
        // 强制通过验证
        validationResult.valid = true;
        validationResult.warnings.push('已应用兼容性修复');
      }
      
      if (!validationResult.valid) {
        console.error(`[数据源管理器] 数据源 '${id}' 验证失败:`, validationResult.errors);
        return false;
      }
      
      if (validationResult.warnings.length > 0) {
        console.warn(`[数据源管理器] 数据源 '${id}' 有警告:`, validationResult.warnings);
      }
      
      // 存储数据源
    this.dataSources[id] = dataSource;
    
      // 存储数据源信息，包括是否支持getPlayUrl
      this.dataSourcesInfo[id] = {
        name: dataSource.name || id,
        supportsGetPlayUrl: validationResult.supportsGetPlayUrl
      };
      
      console.log(`[数据源管理器] 数据源 ${dataSource.name || id}(${id}) 已注册, ${validationResult.supportsGetPlayUrl ? '支持' : '不支持'}二次请求播放URL`);
      
      // 根据参数决定是否触发更新事件
      if (triggerUpdate) {
        this.triggerDataSourcesUpdated();
      }
      
      return true;
    } catch (error) {
      console.error(`[数据源管理器] 注册数据源 ${id} 时发生错误:`, error);
      return false;
    }
  }
  
  // 获取数据源
  async getDataSource(id) {
    // 确保已初始化基本数据源
    if (!this._initialized && !this._initializing) {
      await this.initialize(false);
    }
    
    if (!id) {
      id = this.currentDataSourceId;
    }
    
    // 如果请求的是当前数据源，但尚未加载，则尝试加载
    if (id === this.currentDataSourceId && !this.dataSources[id]) {
      await this._loadCurrentDataSource();
    }
    
    const dataSource = this.dataSources[id];
    if (!dataSource) {
      const availableDataSources = Object.keys(this.dataSources);
      if (availableDataSources.length > 0) {
        console.warn(`[数据源管理器] 未找到数据源: ${id}，将使用第一个可用的数据源: ${availableDataSources[0]}`);
        return this.dataSources[availableDataSources[0]];
      } else {
        throw new Error(`[数据源管理器] 未找到数据源: ${id}，且没有可用的数据源`);
      }
    }
    
    return dataSource;
  }
  
  // 设置当前数据源
  async setCurrentDataSource(id) {
    // 保存到localStorage
    try {
      localStorage.setItem('selectedDataSource', id);
    } catch (e) {
      console.error('[数据源管理器] 无法保存数据源设置:', e);
    }
    
    // 更新当前数据源ID
    this.currentDataSourceId = id;
    
    // 如果数据源尚未加载，则尝试加载
    if (!this.dataSources[id]) {
      console.log(`[数据源管理器] 切换到新数据源: ${id}，开始加载...`);
      
      // 检查是否是外部数据源
      try {
        // 首先尝试从site_info_cache中获取外部数据源信息
        const siteInfo = await infoManager.getInfo();
        if (siteInfo && siteInfo.externalDataSources) {
          const externalSource = siteInfo.externalDataSources.find(source => source.id === id);
          if (externalSource) {
            console.log(`[数据源管理器] 从site_info_cache中找到外部数据源: ${externalSource.name} (${id})`);
            const loadedSource = await this.loadExternalDataSource(externalSource.url);
            
            // 确保使用正确的ID
            if (loadedSource.id !== id) {
              console.log(`[数据源管理器] 加载的数据源ID (${loadedSource.id}) 与请求的ID (${id}) 不匹配，进行修正`);
              
              // 删除错误ID的数据源
              delete this.dataSources[loadedSource.id];
              
              // 使用正确的ID重新注册
              loadedSource.id = id;
              this.register(id, loadedSource, false);
            }
            
            console.log(`[数据源管理器] 当前数据源已设置为: ${id}`);
            return this.dataSources[id];
          }
        }
        
        // 如果site_info_cache中没有，尝试从localStorage中获取
        const savedSourcesJson = localStorage.getItem('externalDataSources');
        if (savedSourcesJson) {
          const savedSources = JSON.parse(savedSourcesJson);
          const externalSource = savedSources.find(source => source.id === id);
          if (externalSource) {
            console.log(`[数据源管理器] 从localStorage中找到外部数据源: ${externalSource.name} (${id})`);
            const loadedSource = await this.loadExternalDataSource(externalSource.url);
            
            // 确保使用正确的ID
            if (loadedSource.id !== id) {
              console.log(`[数据源管理器] 加载的数据源ID (${loadedSource.id}) 与请求的ID (${id}) 不匹配，进行修正`);
              
              // 删除错误ID的数据源
              delete this.dataSources[loadedSource.id];
              
              // 使用正确的ID重新注册
              loadedSource.id = id;
              this.register(id, loadedSource, false);
            }
            
            console.log(`[数据源管理器] 当前数据源已设置为: ${id}`);
    return this.dataSources[id];
          }
        }
      } catch (error) {
        console.error(`[数据源管理器] 尝试加载外部数据源失败: ${error.message}`);
      }
      
      // 尝试加载当前数据源
      try {
        await this._loadCurrentDataSource();
      } catch (error) {
        console.error(`[数据源管理器] 加载当前数据源失败: ${error.message}`);
      }
      
      // 如果仍然无法加载，则检查是否是内置数据源
      if (!this.dataSources[id]) {
        // 确保已初始化内置数据源
        if (!this._initialized) {
          await this.initialize(false);
        }
        
        // 再次检查数据源是否存在
        if (!this.dataSources[id]) {
          throw new Error(`[数据源管理器] 无法加载数据源: ${id}`);
        }
      }
    } else {
      console.log(`[数据源管理器] 切换到已加载的数据源: ${id}`);
    }
    
    console.log(`[数据源管理器] 当前数据源已设置为: ${id}`);
    
    // 触发一次更新事件，确保UI更新
    this.triggerDataSourcesUpdated();
    
    return this.dataSources[id];
  }
  
  // 获取所有已注册的数据源
  async getAllDataSources(loadExternal = false) {
    // 确保已初始化基本数据源
    if (!this._initialized && !this._initializing) {
      await this.initialize(false);
    }
    
    // 如果需要加载所有外部数据源
    if (loadExternal && !this._allExternalLoaded) {
      await this.loadExternalDataSources();
      this._allExternalLoaded = true;
    }
    
    // 返回ID和名称的映射
    const sources = {};
    
    // 添加已加载的数据源
    for (const id in this.dataSources) {
      sources[id] = this.dataSources[id].name;
    }
    
    // 如果不加载外部数据源，但需要显示它们的信息，则从localStorage获取
    if (!loadExternal) {
      try {
        // 首先尝试从site_info_cache获取
        const siteInfo = await infoManager.getInfo();
        let externalSources = [];
        
        if (siteInfo && siteInfo.externalDataSources && Array.isArray(siteInfo.externalDataSources)) {
          externalSources = siteInfo.externalDataSources;
          console.log(`[数据源管理器] 从site_info_cache获取到 ${externalSources.length} 个外部数据源配置`);
        } else {
          // 如果site_info_cache中没有，则从localStorage获取
          const savedSourcesJson = localStorage.getItem('externalDataSources');
          if (savedSourcesJson) {
            externalSources = JSON.parse(savedSourcesJson);
            console.log(`[数据源管理器] 从localStorage获取到 ${externalSources.length} 个外部数据源配置`);
          }
        }
        
        // 添加未加载的外部数据源信息（仅ID和名称）
        for (const source of externalSources) {
          if (source && source.id && !sources[source.id]) {
            sources[source.id] = source.name; // 移除"(未加载)"字样
            console.log(`[数据源管理器] 添加外部数据源: ${source.name} (${source.id})`);
          }
        }
      } catch (error) {
        console.warn('[数据源管理器] 获取外部数据源信息失败:', error);
      }
    }
    
    console.log('[数据源管理器] 获取所有数据源:', sources);
    return sources;
  }
  
  // 获取当前数据源ID
  getCurrentDataSourceId() {
    return this.currentDataSourceId;
  }
  
  // 搜索电影 - 使用指定或当前数据源
  async searchMovies(keyword, page = 1, pageSize = 12, dataSourceId = null) {
    const dataSource = await this.getDataSource(dataSourceId);
    return await dataSource.searchMovies(keyword, page, pageSize);
  }
  
  // 获取电影详情 - 使用指定或当前数据源
  async getMovieDetail(id, dataSourceId = null) {
    const dataSource = await this.getDataSource(dataSourceId);
    return await dataSource.getMovieDetail(id);
  }
  
  /**
   * 加载外部数据源
   * @param {string} url - 数据源JS文件的URL
   * @returns {Promise<Object>} - 加载的数据源对象
   */
  async loadExternalDataSource(url) {
    try {
      // 导入外部数据源加载器
      const externalDataSourceLoader = await import('./externalDataSourceLoader');
      
      // 检查是否已经有预定义的ID（从site_info_cache中）
      let predefinedId = null;
      let predefinedSource = null;
      try {
        const siteInfo = await infoManager.getInfo();
        if (siteInfo && siteInfo.externalDataSources) {
          predefinedSource = siteInfo.externalDataSources.find(s => s.url === url);
          if (predefinedSource && predefinedSource.id) {
            predefinedId = predefinedSource.id;
            console.log(`[数据源管理器] 找到预定义ID: ${predefinedId} 用于 ${url}`);
            
            // 如果已经加载了这个ID的数据源，直接返回
            if (this.dataSources[predefinedId]) {
              console.log(`[数据源管理器] 数据源 ${predefinedId} 已加载，直接返回`);
              return this.dataSources[predefinedId];
            }
          }
        }
      } catch (error) {
        console.warn('[数据源管理器] 获取预定义ID失败:', error);
      }
      
      // 加载外部数据源
      const dataSource = await externalDataSourceLoader.default.load(url);
      
      // 添加外部数据源标识属性
      const sourceId = dataSource.id || predefinedId || this._generateDataSourceId(dataSource.name, url);
      
      // 如果已经加载了这个ID的数据源，直接返回
      if (this.dataSources[sourceId]) {
        console.log(`[数据源管理器] 数据源 ${sourceId} 已加载，直接返回`);
        return this.dataSources[sourceId];
      }
      
      const enhancedDataSource = {
        ...dataSource,
        isExternal: true,
        sourceUrl: url,
        id: sourceId
      };
      
      console.log(`[数据源管理器] 加载外部数据源: ${enhancedDataSource.name} (${enhancedDataSource.id})`);
      
      // 确保数据源有必要的方法
      if (typeof enhancedDataSource.getMovieDetail !== 'function') {
        console.warn(`[数据源管理器] 数据源 ${enhancedDataSource.name} 缺少getMovieDetail方法，将使用兼容实现`);
        // 提供一个兼容的getMovieDetail方法
        enhancedDataSource.getMovieDetail = async (id) => {
          console.warn(`[数据源管理器] 使用兼容的getMovieDetail方法处理ID: ${id}`);
          return { id, title: `无法获取详情: ${id}`, description: '此数据源不支持获取详情功能' };
        };
      }
      
      // 注册到数据源列表，不立即触发更新事件
      this.register(enhancedDataSource.id, enhancedDataSource, false);
      
      try {
      // 保存外部数据源配置到数据库和localStorage
      await this.saveExternalDataSources();
      } catch (saveError) {
        // 如果保存失败，只记录错误但不中断流程
        console.warn(`[数据源管理器] 保存外部数据源配置失败，但数据源已加载: ${saveError.message}`);
      }
      
      console.log(`[数据源管理器] 成功加载外部数据源: ${enhancedDataSource.name} (${url})`);
      
      return enhancedDataSource;
    } catch (error) {
      console.error(`[数据源管理器] 加载外部数据源失败:`, error);
      throw error;
    }
  }
  
  /**
   * 生成数据源ID
   * @param {string} name - 数据源名称
   * @param {string} url - 数据源URL
   * @returns {string} - 生成的ID
   * @private
   */
  _generateDataSourceId(name, url) {
    // 从URL中提取文件名作为前缀
    const fileName = url.split('/').pop().replace('.js', '');
    
    // 使用URL的哈希值作为唯一标识符
    return `ext_${fileName}_${this._hashString(url)}`;
  }
  
  /**
   * 简单的字符串哈希函数
   * @param {string} str - 要哈希的字符串
   * @returns {string} - 哈希结果（16进制）
   * @private
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16).substring(0, 8); // 取绝对值并转为16进制，截取前8位
  }
  
  /**
   * 删除外部数据源
   * @param {string} id - 数据源ID
   */
  removeExternalDataSource(id) {
    if (!this.dataSources[id]) {
      throw new Error(`未找到数据源: ${id}`);
    }
    
    // 检查是否是外部数据源
    if (!this.dataSources[id].isExternal) {
      throw new Error(`数据源 ${id} 不是外部数据源，无法删除`);
    }
    
    // 如果当前正在使用这个数据源，切换到默认数据源
    if (this.currentDataSourceId === id) {
      const availableDataSources = Object.keys(this.dataSources).filter(sid => sid !== id);
      if (availableDataSources.length > 0) {
        this.setCurrentDataSource(availableDataSources[0]);
      }
    }
    
    // 从列表中删除
    delete this.dataSources[id];
    
    // 保存外部数据源配置
    this.saveExternalDataSources();
    
    console.log(`已删除外部数据源: ${id}`);
    
    // 批量触发数据源更新事件
    this.triggerDataSourcesUpdated();
  }
  
  /**
   * 加载所有保存的外部数据源
   */
  async loadExternalDataSources() {
    let savedSources = [];
    let loadedFromDb = false;
    let anyNewSourceLoaded = false; // 标记是否有新的数据源被加载
    
    try {
      // 尝试从网站设置中读取
      try {
      const siteInfo = await infoManager.getInfo();
      if (siteInfo && siteInfo.externalDataSources && Array.isArray(siteInfo.externalDataSources)) {
        savedSources = siteInfo.externalDataSources;
          console.log(`[数据源管理器] 从数据库找到 ${savedSources.length} 个外部数据源配置`);
          loadedFromDb = true;
          
          // 如果从数据库成功加载了，确保localStorage也使用相同的配置
          try {
            localStorage.setItem('externalDataSources', JSON.stringify(savedSources));
            console.log('[数据源管理器] 已将数据库中的外部数据源配置同步到localStorage');
          } catch (localStorageError) {
            console.warn('[数据源管理器] 无法同步到localStorage:', localStorageError);
          }
        }
      } catch (dbError) {
        console.warn(`[数据源管理器] 从数据库加载外部数据源配置失败: ${dbError.message}`);
      }
      
      // 如果数据库中没有或加载失败，尝试从localStorage加载
      if (!loadedFromDb || savedSources.length === 0) {
        try {
        const savedSourcesJson = localStorage.getItem('externalDataSources');
        if (savedSourcesJson) {
          savedSources = JSON.parse(savedSourcesJson);
            console.log(`[数据源管理器] 从localStorage找到 ${savedSources.length} 个外部数据源配置`);
            
            // 如果从数据库加载失败但localStorage有数据，且用户已登录，尝试同步到数据库
            const authToken = localStorage.getItem('token');
            if (!loadedFromDb && savedSources.length > 0 && authToken) {
              try {
                const siteInfo = await infoManager.getInfo();
                if (siteInfo) {
                  // 合并而不是覆盖
                  const existingSources = siteInfo.externalDataSources || [];
                  const mergedSources = this._mergeExternalDataSources(existingSources, savedSources);
                  siteInfo.externalDataSources = mergedSources;
                  
            await infoManager.updateInfo(siteInfo);
                  console.log('[数据源管理器] 已将外部数据源配置从localStorage同步到数据库');
                }
              } catch (syncError) {
                console.warn(`[数据源管理器] 同步到数据库失败: ${syncError.message}`);
              }
            }
          }
        } catch (localError) {
          console.warn(`[数据源管理器] 从localStorage加载外部数据源配置失败: ${localError.message}`);
        }
      }
      
      // 加载每个数据源
      if (savedSources.length > 0) {
        let loadedCount = 0;
        let failedCount = 0;
        
        for (const source of savedSources) {
          try {
            // 如果已经加载过这个数据源，跳过
            const sourceId = source.id || this._generateDataSourceId(source.name, source.url);
            if (this.dataSources[sourceId]) {
              console.log(`[数据源管理器] 数据源 ${source.name} (${sourceId}) 已加载，跳过`);
              loadedCount++;
              continue;
            }
            
            // 直接使用本类的加载方法
            await this.loadExternalDataSource(source.url);
            console.log(`[数据源管理器] 已恢复外部数据源: ${source.name} (${source.url})`);
            loadedCount++;
            anyNewSourceLoaded = true; // 标记有新数据源被加载
          } catch (error) {
            console.error(`[数据源管理器] 恢复外部数据源 ${source.name} (${source.url}) 失败:`, error);
            failedCount++;
          }
        }
        
        console.log(`[数据源管理器] 外部数据源加载完成: 成功=${loadedCount}, 失败=${failedCount}`);
      } else {
        console.log('[数据源管理器] 未找到任何外部数据源配置');
      }
      
      // 只有在有新数据源被加载时才触发更新事件
      if (anyNewSourceLoaded) {
        this.triggerDataSourcesUpdated();
      }
    } catch (e) {
      console.error('[数据源管理器] 加载外部数据源配置失败:', e);
    }
  }
  
  /**
   * 合并外部数据源列表，保留所有唯一数据源
   * @param {Array} sources1 - 第一个数据源列表
   * @param {Array} sources2 - 第二个数据源列表
   * @returns {Array} - 合并后的数据源列表
   * @private
   */
  _mergeExternalDataSources(sources1, sources2) {
    // 创建一个Map，以ID为键，如果没有ID则使用URL为键
    const sourceMap = new Map();
    
    // 添加第一个列表中的所有数据源
    sources1.forEach(source => {
      if (source) {
        // 使用ID作为键，如果没有ID则使用URL
        const key = source.id || (source.url ? source.url : null);
        if (key) {
          sourceMap.set(key, source);
        }
      }
    });
    
    // 添加第二个列表中的所有数据源
    sources2.forEach(source => {
      if (source) {
        // 使用ID作为键，如果没有ID则使用URL
        const key = source.id || (source.url ? source.url : null);
        if (key) {
          // 如果已存在相同ID的数据源，保留ID但更新其他信息
          if (sourceMap.has(key) && source.id) {
            const existingSource = sourceMap.get(key);
            sourceMap.set(key, { 
              ...source,
              // 保留原始ID
              id: existingSource.id || source.id
            });
          } else {
            sourceMap.set(key, source);
          }
        }
      }
    });
    
    // 将Map转换回数组
    return Array.from(sourceMap.values());
  }
  
  /**
   * 保存外部数据源配置
   * @param {boolean} forceUpdate - 是否强制更新到数据库（即使可能未登录）
   */
  async saveExternalDataSources(forceUpdate = false) {
    try {
      // 提取所有外部数据源的URL
      const currentExternalSources = Object.values(this.dataSources)
        .filter(ds => ds && ds.isExternal)
        .map(ds => ({
          id: ds.id,
          name: ds.name,
          url: ds.sourceUrl
        }));
      
      // 获取现有的外部数据源配置
      let existingSources = [];
      try {
        const savedSourcesJson = localStorage.getItem('externalDataSources');
        if (savedSourcesJson) {
          existingSources = JSON.parse(savedSourcesJson);
        }
      } catch (e) {
        console.warn('[数据源管理器] 无法获取现有外部数据源配置:', e);
      }
      
      // 合并现有配置和当前加载的配置
      const mergedSources = this._mergeExternalDataSources(existingSources, currentExternalSources);
      
      // 保存到localStorage
      localStorage.setItem('externalDataSources', JSON.stringify(mergedSources));
      console.log(`[数据源管理器] 已保存 ${mergedSources.length} 个外部数据源配置到localStorage`);
      
      // 检查是否有认证令牌
      const authToken = localStorage.getItem('token');
      if (!authToken && !forceUpdate) {
        console.log('[数据源管理器] 未检测到认证令牌，跳过保存到数据库');
        return;
      }
      
      try {
        // 获取当前网站设置
        const siteInfo = await infoManager.getInfo();
        
        // 合并数据库中的配置和当前配置
        const dbSources = siteInfo.externalDataSources || [];
        const finalSources = this._mergeExternalDataSources(dbSources, currentExternalSources);
        
        // 更新外部数据源设置
        siteInfo.externalDataSources = finalSources;
        
        // 保存回数据库
        await infoManager.updateInfo(siteInfo);
        
        console.log(`[数据源管理器] 已保存 ${finalSources.length} 个外部数据源配置到数据库`);
      } catch (dbError) {
        // 如果数据库保存失败，只记录警告，不抛出异常
        console.warn(`[数据源管理器] 保存到数据库失败: ${dbError.message}`);
        // 如果是认证错误，清除可能过期的令牌
        if (dbError.message.includes('未登录') || dbError.message.includes('令牌已过期')) {
          console.warn('[数据源管理器] 检测到认证问题，后续将只使用localStorage存储');
        }
      }
    } catch (e) {
      console.error('[数据源管理器] 无法保存外部数据源配置:', e);
    }
  }
  
  // 添加事件监听方法
  onDataSourcesUpdated(callback) {
    return eventBus.on('dataSources.updated', callback);
  }
  
  // 检查数据源是否支持getPlayUrl
  async supportsGetPlayUrl(dataSourceId = null) {
    // 确保已初始化基本数据源
    if (!this._initialized && !this._initializing) {
      await this.initialize(false);
    }
    
    const id = dataSourceId || this.currentDataSourceId;
    if (!id) {
      return false;
    }
    
    // 如果数据源已加载，直接检查
    if (this.dataSourcesInfo[id]) {
      return this.dataSourcesInfo[id].supportsGetPlayUrl === true;
    }
    
    // 如果数据源未加载，尝试加载
    if (id === this.currentDataSourceId) {
      await this._loadCurrentDataSource();
      
      if (this.dataSourcesInfo[id]) {
        return this.dataSourcesInfo[id].supportsGetPlayUrl === true;
      }
    }
    
    return false;
  }
  
  // 获取实际播放URL
  async getPlayUrl(cid, dataSourceId = null, options = {}) {
    const id = dataSourceId || this.currentDataSourceId;
    if (!id) {
      throw new Error(`[数据源管理器] 未指定数据源ID`);
    }
    
    // 获取数据源（会自动加载如果未加载）
    const dataSource = await this.getDataSource(id);
    if (!dataSource) {
      throw new Error(`[数据源管理器] 数据源 ${id} 不存在或未注册`);
    }
    
    // 检查数据源是否支持getPlayUrl
    const supports = await this.supportsGetPlayUrl(id);
    if (!supports) {
      throw new Error(`[数据源管理器] 数据源 ${id} 不支持二次请求获取播放URL`);
    }
    
    try {
      return await dataSource.getPlayUrl(cid, options);
    } catch (error) {
      console.error(`[数据源管理器] 获取播放URL失败:`, error);
      throw error;
    }
  }
}

// 单例模式
let instance = null;

export const getDataSourceManager = () => {
  if (!instance) {
    instance = new DataSourceManager();
  }
  return instance;
}; 