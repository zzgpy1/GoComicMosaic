/**
 * storageBridgeExport.js
 * 这个文件专门用于导出给外部数据源使用的存储桥接客户端
 * 会被打包成独立模块，通过外部数据源加载器提供给外部数据源
 */

import { StorageBridgeClient } from './storageBridge';

// 导出给 CommonJS 使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    /**
     * 创建存储桥接客户端
     * @param {string} sourceId - 数据源唯一标识符
     * @returns {StorageBridgeClient} 存储桥接客户端实例
     */
    createStorageBridge(sourceId) {
      const client = new StorageBridgeClient(sourceId);
      client.init();
      return client;
    }
  };
}

// 导出给全局使用
if (typeof window !== 'undefined') {
  window.StorageBridgeExport = {
    /**
     * 创建存储桥接客户端
     * @param {string} sourceId - 数据源唯一标识符
     * @returns {StorageBridgeClient} 存储桥接客户端实例
     */
    createStorageBridge(sourceId) {
      const client = new StorageBridgeClient(sourceId);
      client.init();
      return client;
    }
  };
}

/**
 * 创建存储桥接客户端
 * @param {string} sourceId - 数据源唯一标识符
 * @returns {StorageBridgeClient} 存储桥接客户端实例
 */
export function createStorageBridge(sourceId) {
  const client = new StorageBridgeClient(sourceId);
  client.init();
  return client;
} 