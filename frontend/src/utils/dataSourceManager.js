import heimuerDataSource from './dataSources/heimuer';
import mockDataSource from './dataSources/mockSource';
import testApiDataSource from './dataSources/testApi';

// 数据源管理器类
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
  }
  
  // 注册内置的数据源
  registerBuiltinDataSources() {
    this.register('heimuer', heimuerDataSource);
    this.register('mock', mockDataSource);
    this.register('testapi', testApiDataSource);
    
    // 默认使用黑木耳数据源
    if (!this.currentDataSourceId) {
      this.setCurrentDataSource('heimuer');
    }
  }
  
  // 注册一个新的数据源
  register(id, dataSource) {
    if (this.dataSources[id]) {
      console.warn(`数据源 '${id}' 已存在，将被覆盖`);
    }
    this.dataSources[id] = dataSource;
  }
  
  // 获取数据源
  getDataSource(id) {
    if (!id) {
      id = this.currentDataSourceId;
    }
    
    const dataSource = this.dataSources[id];
    if (!dataSource) {
      throw new Error(`未找到数据源: ${id}`);
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
}

// 单例模式
let instance = null;

export const getDataSourceManager = () => {
  if (!instance) {
    instance = new DataSourceManager();
  }
  return instance;
}; 