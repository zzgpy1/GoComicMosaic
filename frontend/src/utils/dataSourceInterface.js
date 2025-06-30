/**
 * 数据源接口定义
 * 
 * 定义了数据源必须实现和可选实现的方法
 */
export const DataSourceInterface = {
  // 必须实现的基本方法
  search: async (keyword, page = 1) => {
    throw new Error('数据源必须实现search方法');
  },
  
  getDetail: async (id) => {
    throw new Error('数据源必须实现getDetail方法');
  },
  
  // 可选方法 - 获取实际播放URL（只有需要二次请求的数据源才实现）
  getPlayUrl: null // 默认为null，表示不需要二次请求
};

/**
 * 检查数据源是否符合接口要求
 * @param {Object} dataSource - 要检查的数据源对象
 * @returns {Object} - 包含验证结果的对象
 */
export const validateDataSource = (dataSource) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    supportsGetPlayUrl: false
  };
  
  // 首先检查数据源是否为对象
  if (!dataSource || typeof dataSource !== 'object') {
    result.valid = false;
    result.errors.push('数据源必须是一个对象');
    return result;
  }
  
  // 检查必需的searchMovies方法（优先级高于search）
  if (dataSource.searchMovies && typeof dataSource.searchMovies === 'function') {
    // 优先使用searchMovies
  } else if (dataSource.search && typeof dataSource.search === 'function') {
    // 兼容search方法
    result.warnings.push('使用search方法代替searchMovies，建议更新');
  } else {
    // 如果是外部数据源，这是一个严重错误
    result.valid = false;
    result.errors.push('缺少必需的search/searchMovies方法');
  }
  
  // 检查getMovieDetail方法（优先级高于getDetail）
  if (dataSource.getMovieDetail && typeof dataSource.getMovieDetail === 'function') {
    // 优先使用getMovieDetail
  } else if (dataSource.getDetail && typeof dataSource.getDetail === 'function') {
    // 兼容getDetail方法
    result.warnings.push('使用getDetail方法代替getMovieDetail，建议更新');
  } else {
    // 对于缺少详情方法的情况，只发出警告而不是错误
    result.warnings.push('缺少getDetail/getMovieDetail方法，某些功能可能受限');
  }
  
  // 检查可选的getPlayUrl方法
  if (dataSource.getPlayUrl && typeof dataSource.getPlayUrl === 'function') {
    result.supportsGetPlayUrl = true;
  }
  
  // 检查基本信息
  if (!dataSource.id) {
    result.warnings.push('数据源缺少id属性，将自动生成');
  }
  
  if (!dataSource.name) {
    result.warnings.push('数据源缺少name属性，将使用默认名称');
    // 如果数据源没有名称，尝试从ID生成一个
    if (dataSource.id) {
      dataSource.name = dataSource.id.charAt(0).toUpperCase() + dataSource.id.slice(1).replace(/_/g, ' ');
    } else {
      dataSource.name = '未命名数据源';
    }
  }
  
  return result;
}; 