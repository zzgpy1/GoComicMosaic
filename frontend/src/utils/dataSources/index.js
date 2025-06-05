// 数据源索引文件 - 自动导入所有数据源

// 使用Vite的动态导入功能自动加载所有数据源
// 排除index.js文件本身，只导入其他JS文件
const dataSourceModules = import.meta.glob('./*.js', { eager: true });

// 数据源ID与实例的映射
const dataSources = {};

// 添加日志
console.log(`发现 ${Object.keys(dataSourceModules).length} 个可能的数据源文件`);

// 遍历所有模块，提取数据源
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
    
    console.log(`自动加载数据源: ${id} (${dataSource.name})`);
  } catch (error) {
    console.error(`加载数据源文件 ${path} 时出错:`, error);
  }
});

// 添加加载完成日志
console.log(`成功加载 ${Object.keys(dataSources).length} 个数据源`);

export default dataSources; 