/**
 * 数据源索引文件 - 支持配置驱动模式和文件导入模式
 * 
 * 配置驱动模式（推荐）：
 * 在dataSourcesConfig.js中添加简化配置即可，只需三个核心参数：
 * - name: 数据源名称（必填）
 * - baseUrl: API基础URL（必填）
 * - useXml: 是否使用XML格式（可选，默认false）
 * 
 * 文件导入模式（兼容旧版本）：
 * 在dataSources目录中创建独立的数据源文件
 */

// 导入数据源配置和工厂
import dataSourcesConfig from '../dataSourcesConfig';
import { createDataSource } from '../dataSourceFactory';
// 移除直接导入InfoManager，避免循环依赖
// import infoManager from '../InfoManager';

// 移除特殊数据源示例的导入
// import specialSource from './specialSource';

// 使用Vite的动态导入功能自动加载所有数据源文件（传统模式）
const dataSourceModules = import.meta.glob('./*.js', { eager: true });

// 数据源ID与实例的映射
const dataSources = {};

// 添加日志
console.log('开始加载数据源');
// 移除特殊数据源信息日志
// console.log('特殊数据源信息:', specialSource.id, specialSource.name);

// 从localStorage获取网站设置
const getSavedSiteInfo = () => {
  try {
    const cachedData = localStorage.getItem('site_info_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      console.log('已从本地存储加载网站设置缓存');
      return parsed.data;
    }
  } catch (error) {
    console.error('加载缓存的网站设置失败:', error);
  }
  return null;
};

// 创建加载数据源的异步函数
const initDataSources = async () => {
  try {
    console.log('开始初始化数据源...');
    
    // 移除手动注册特殊数据源示例的代码
    /*
    try {
      dataSources[specialSource.id] = specialSource;
      console.log(`手动注册特殊数据源: ${specialSource.id} (${specialSource.name})`);
    } catch (error) {
      console.error('注册特殊数据源失败:', error);
    }
    */
    
    // 尝试从localStorage获取数据源配置，避免循环依赖
    const siteInfo = getSavedSiteInfo();
    let configDataSources = [];
    
    if (siteInfo && siteInfo.dataSources && Array.isArray(siteInfo.dataSources)) {
      console.log('从本地缓存加载数据源配置');
      configDataSources = siteInfo.dataSources;
    } else {
      console.log('本地缓存中没有数据源配置，使用默认配置');
      configDataSources = dataSourcesConfig;
    }
    
    console.log('默认数据源配置:', dataSourcesConfig);
    
    // 加载配置的数据源
    console.log(`从配置加载 ${configDataSources.length} 个数据源`);
    configDataSources.forEach(config => {
      try {
        // 移除特殊数据源冲突检查
        /*
        if (config.id === specialSource.id) {
          console.log(`跳过配置数据源 ${config.id}，与特殊数据源冲突`);
          return;
        }
        */
        
        // 创建数据源实例
        const dataSource = createDataSource(config);
        const id = config.id || config.name.toLowerCase().replace(/\s+/g, '').replace(/[^\w\u4e00-\u9fa5]/g, '');
        
        // 注册到映射表
        dataSources[id] = dataSource;
        console.log(`通过配置加载数据源: ${id} (${dataSource.name})`);
      } catch (error) {
        console.error(`通过配置加载数据源 ${config.id || config.name} 时出错:`, error);
      }
    });
    
    // 兼容模式处理
    loadLegacyDataSources();
    
    console.log(`成功加载 ${Object.keys(dataSources).length} 个数据源:`, Object.keys(dataSources));
  } catch (error) {
    console.error('加载数据源配置失败，使用默认配置:', error);
    
    // 移除手动注册特殊数据源示例的代码
    /*
    try {
      dataSources[specialSource.id] = specialSource;
      console.log(`手动注册特殊数据源: ${specialSource.id} (${specialSource.name})`);
    } catch (error) {
      console.error('注册特殊数据源失败:', error);
    }
    */
    
    // 从默认配置加载
    loadDefaultDataSources();
    
    // 兼容模式处理
    loadLegacyDataSources();
    
    console.log(`最终加载了 ${Object.keys(dataSources).length} 个数据源:`, Object.keys(dataSources));
  }
};

// 从默认配置加载数据源
const loadDefaultDataSources = () => {
  console.log(`从默认配置加载 ${dataSourcesConfig.length} 个数据源`);
  dataSourcesConfig.forEach(config => {
    try {
      // 创建数据源实例
      const dataSource = createDataSource(config);
      const id = config.id || config.name.toLowerCase().replace(/\s+/g, '').replace(/[^\w\u4e00-\u9fa5]/g, '');
      
      // 注册到映射表
      dataSources[id] = dataSource;
      console.log(`通过默认配置加载数据源: ${id} (${dataSource.name})`);
    } catch (error) {
      console.error(`通过默认配置加载数据源 ${config.id || config.name} 时出错:`, error);
    }
  });
};

// 从文件加载数据源（兼容模式）
const loadLegacyDataSources = () => {
  console.log(`发现 ${Object.keys(dataSourceModules).length} 个可能的数据源文件`);
  Object.keys(dataSourceModules).forEach(path => {
    try {
      // 排除索引文件自身和模板示例文件
      if (path === './index.js' || path.endsWith('.example') || path.endsWith('.test.js')) {
        console.log(`跳过非数据源文件: ${path}`);
        return;
      }
      
      // 从文件路径提取ID
      // 例如: './heimuer.js' => 'heimuer'
      const id = path.replace(/^\.\/(.*?)\.js$/, '$1').toLowerCase();
      
      // 如果通过配置已经加载了该数据源，则跳过
      if (dataSources[id]) {
        console.log(`跳过文件加载数据源 ${id}，已通过配置加载`);
        return;
      }
      
      // 获取数据源对象
      const dataSource = dataSourceModules[path].default;
      
      // 检查数据源对象是否存在
      if (!dataSource) {
        console.error(`数据源文件 ${path} 没有使用 export default 导出数据源对象`);
        return;
      }
      
      // 检查必要的属性和方法
      if (!dataSource.name) {
        console.error(`数据源 ${path} 缺少 name 属性`);
        return;
      }
      
      if (!dataSource.baseUrl) {
        console.error(`数据源 ${path} 缺少 baseUrl 属性`);
        return;
      }
      
      if (typeof dataSource.searchMovies !== 'function') {
        console.error(`数据源 ${path} 缺少 searchMovies 方法`);
        return;
      }
      
      if (typeof dataSource.getMovieDetail !== 'function') {
        console.error(`数据源 ${path} 缺少 getMovieDetail 方法`);
        return;
      }
      
      // 添加ID属性到数据源对象
      dataSource.id = id;
      
      // 注册到映射表
      dataSources[id] = dataSource;
      
      console.log(`通过文件加载数据源: ${id} (${dataSource.name})`);
    } catch (error) {
      console.error(`加载数据源文件 ${path} 时出错:`, error);
    }
  });
};

// 立即初始化数据源
initDataSources();

export default dataSources; 