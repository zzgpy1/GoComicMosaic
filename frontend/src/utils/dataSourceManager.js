// 导入数据源索引文件
import dataSources from './dataSources';
import infoManager from './InfoManager';

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
    
    // 当前使用的数据源ID
    this.currentDataSourceId = null;
    
    // 初始化：注册内置数据源
    this.registerBuiltinDataSources();
    
    // 从localStorage加载之前选择的数据源
    this.loadSelectedDataSource();
    
    // 加载保存的外部数据源
    this.loadExternalDataSources().catch(err => {
      console.error('加载外部数据源失败:', err);
    });
  }
  
  // 注册内置的数据源
  registerBuiltinDataSources() {
    // 自动注册所有数据源
    Object.keys(dataSources).forEach(id => {
      this.register(id, dataSources[id]);
    });
    
    // 检查是否有可用的数据源
    const availableDataSources = Object.keys(this.dataSources);
    console.log(`已注册 ${availableDataSources.length} 个数据源`);
    
    // 如果没有设置当前数据源，则设置默认数据源
    if (!this.currentDataSourceId) {
      // 优先使用黑木耳数据源，如果不存在则使用第一个可用的数据源
      if (this.dataSources['heimuer']) {
        this.setCurrentDataSource('heimuer');
        console.log('已设置默认数据源: heimuer');
      } else if (availableDataSources.length > 0) {
        this.setCurrentDataSource(availableDataSources[0]);
        console.log(`已设置默认数据源: ${availableDataSources[0]}`);
      } else {
        console.warn('没有可用的数据源！');
      }
    }
    
    // 触发数据源列表更新事件
    eventBus.emit('dataSources.updated', this.getAllDataSources());
  }
  
  // 注册一个新的数据源
  register(id, dataSource) {
    if (this.dataSources[id]) {
      console.warn(`数据源 '${id}' 已存在，将被覆盖`);
    }
    this.dataSources[id] = dataSource;
    
    // 触发数据源列表更新事件
    eventBus.emit('dataSources.updated', this.getAllDataSources());
  }
  
  // 获取数据源
  getDataSource(id) {
    if (!id) {
      id = this.currentDataSourceId;
    }
    
    const dataSource = this.dataSources[id];
    if (!dataSource) {
      const availableDataSources = Object.keys(this.dataSources);
      if (availableDataSources.length > 0) {
        console.warn(`未找到数据源: ${id}，将使用第一个可用的数据源: ${availableDataSources[0]}`);
        return this.dataSources[availableDataSources[0]];
      } else {
        throw new Error(`未找到数据源: ${id}，且没有可用的数据源`);
      }
    }
    
    return dataSource;
  }
  
  // 设置当前数据源
  setCurrentDataSource(id) {
    if (!this.dataSources[id]) {
      throw new Error(`未找到数据源: ${id}`);
    }
    
    this.currentDataSourceId = id;
    
    // 保存到localStorage
    try {
      localStorage.setItem('selectedDataSource', id);
    } catch (e) {
      console.error('无法保存数据源设置:', e);
    }
    
    return this.dataSources[id];
  }
  
  // 从localStorage加载数据源设置
  loadSelectedDataSource() {
    try {
      const savedId = localStorage.getItem('selectedDataSource');
      if (savedId && this.dataSources[savedId]) {
        this.currentDataSourceId = savedId;
      }
    } catch (e) {
      console.error('无法加载数据源设置:', e);
    }
  }
  
  // 获取所有已注册的数据源
  getAllDataSources() {
    // 返回ID和名称的映射
    const sources = {};
    for (const id in this.dataSources) {
      sources[id] = this.dataSources[id].name;
    }
    return sources;
  }
  
  // 获取当前数据源ID
  getCurrentDataSourceId() {
    return this.currentDataSourceId;
  }
  
  // 搜索电影 - 使用指定或当前数据源
  async searchMovies(keyword, page = 1, pageSize = 12, dataSourceId = null) {
    const dataSource = this.getDataSource(dataSourceId);
    return await dataSource.searchMovies(keyword, page, pageSize);
  }
  
  // 获取电影详情 - 使用指定或当前数据源
  async getMovieDetail(id, dataSourceId = null) {
    const dataSource = this.getDataSource(dataSourceId);
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
      const { loadExternalDataSource } = await import('./externalDataSourceLoader');
      
      // 加载外部数据源
      const dataSource = await loadExternalDataSource(url);
      
      // 注册到数据源列表
      this.register(dataSource.id, dataSource);
      
      // 保存外部数据源配置到数据库和localStorage
      await this.saveExternalDataSources();
      
      console.log(`成功加载外部数据源: ${dataSource.name} (${url})`);
      
      // 触发数据源列表更新事件
      eventBus.emit('dataSources.updated', this.getAllDataSources());
      
      return dataSource;
    } catch (error) {
      console.error(`加载外部数据源失败:`, error);
      throw error;
    }
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
    
    // 触发数据源列表更新事件
    eventBus.emit('dataSources.updated', this.getAllDataSources());
  }
  
  /**
   * 保存外部数据源配置
   */
  async saveExternalDataSources() {
    try {
      // 提取所有外部数据源的URL
      const externalSources = Object.values(this.dataSources)
        .filter(ds => ds && ds.isExternal)
        .map(ds => ({
          id: ds.id,
          name: ds.name,
          url: ds.sourceUrl
        }));
      
      // 先保存到localStorage作为备份
      localStorage.setItem('externalDataSources', JSON.stringify(externalSources));
      
      // 获取当前网站设置
      const siteInfo = await infoManager.getInfo();
      
      // 更新外部数据源设置
      siteInfo.externalDataSources = externalSources;
      
      // 保存回数据库
      await infoManager.updateInfo(siteInfo);
      
      console.log(`已保存 ${externalSources.length} 个外部数据源配置到数据库`);
    } catch (e) {
      console.error('无法保存外部数据源配置:', e);
    }
  }
  
  /**
   * 加载所有保存的外部数据源
   */
  async loadExternalDataSources() {
    try {
      // 尝试从网站设置中读取
      const siteInfo = await infoManager.getInfo();
      let savedSources = [];
      
      if (siteInfo && siteInfo.externalDataSources && Array.isArray(siteInfo.externalDataSources)) {
        savedSources = siteInfo.externalDataSources;
        console.log(`从数据库找到 ${savedSources.length} 个外部数据源配置`);
      } else {
        // 如果数据库中没有，尝试从localStorage加载（兼容旧数据）
        const savedSourcesJson = localStorage.getItem('externalDataSources');
        if (savedSourcesJson) {
          savedSources = JSON.parse(savedSourcesJson);
          console.log(`从localStorage找到 ${savedSources.length} 个外部数据源配置`);
          
          // 将localStorage中的数据同步到数据库
          if (savedSources.length > 0 && siteInfo) {
            siteInfo.externalDataSources = savedSources;
            await infoManager.updateInfo(siteInfo);
            console.log('已将外部数据源配置从localStorage同步到数据库');
          }
        }
      }
      
      // 加载每个数据源
      if (savedSources.length > 0) {
        for (const source of savedSources) {
          try {
            // 使用外部数据源加载器
            const { loadExternalDataSource } = await import('./externalDataSourceLoader');
            const dataSource = await loadExternalDataSource(source.url);
            this.register(dataSource.id, dataSource);
            console.log(`已恢复外部数据源: ${source.name} (${source.url})`);
          } catch (error) {
            console.error(`恢复外部数据源 ${source.name} (${source.url}) 失败:`, error);
          }
        }
      }
      
      // 触发数据源列表更新事件
      eventBus.emit('dataSources.updated', this.getAllDataSources());
    } catch (e) {
      console.error('加载外部数据源配置失败:', e);
    }
  }
  
  // 添加事件监听方法
  onDataSourcesUpdated(callback) {
    return eventBus.on('dataSources.updated', callback);
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