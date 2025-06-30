/**
 * storageBridge.js
 * 为外部数据源提供localStorage访问能力的桥接器
 */

// 存储桥接器类
class StorageBridge {
  constructor() {
    this.initialized = false;
    this.listeners = new Map();
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  /**
   * 初始化存储桥接器
   */
  init() {
    if (this.initialized) {
      return;
    }

    // 添加消息事件监听器
    window.addEventListener('message', this.handleMessage.bind(this));
    console.log('[存储桥接] 初始化完成，开始监听消息');
    this.initialized = true;
  }

  /**
   * 处理接收到的消息
   * @param {MessageEvent} event - 消息事件
   */
  handleMessage(event) {
    const { data } = event;
    
    // 忽略非桥接消息
    if (!data || !data.type) {
      return;
    }

    // 支持通用和特定数据源的消息类型
    const isBridgeMessage = data.type.startsWith('STORAGE_BRIDGE_') || 
                           data.type.startsWith('BILIBILI_STORAGE_BRIDGE_');
                           
    if (!isBridgeMessage) {
      return;
    }

    console.log('[存储桥接] 收到消息:', data);

    switch (data.type) {
      case 'STORAGE_BRIDGE_INIT':
      case 'BILIBILI_STORAGE_BRIDGE_INIT':
        this.handleInitMessage(event.source, data);
        break;
      case 'STORAGE_BRIDGE_SAVE':
      case 'BILIBILI_STORAGE_BRIDGE_SAVE':
        this.handleSaveMessage(data);
        break;
      case 'STORAGE_BRIDGE_GET':
      case 'BILIBILI_STORAGE_BRIDGE_GET':
        this.handleGetMessage(event.source, data);
        break;
      default:
        console.warn('[存储桥接] 未知消息类型:', data.type);
    }
  }

  /**
   * 处理初始化消息
   * @param {WindowProxy} source - 消息源窗口
   * @param {Object} data - 消息数据
   */
  handleInitMessage(source, data) {
    const sourceId = data.source || 'unknown_source';
    console.log(`[存储桥接] 收到初始化请求: ${sourceId}`);
    
    // 确定响应消息类型（兼容旧版bilibili消息）
    const responseType = data.type.startsWith('BILIBILI_') 
      ? 'BILIBILI_STORAGE_BRIDGE_INIT_ACK'
      : 'STORAGE_BRIDGE_INIT_ACK';
    
    // 向源窗口发送确认消息
    source.postMessage({
      type: responseType,
      source: 'storage_bridge',
      sourceId
    }, '*');
  }

  /**
   * 处理保存消息
   * @param {Object} data - 消息数据
   */
  handleSaveMessage(data) {
    const { key, value } = data;
    const source = data.source || 'unknown_source';
    
    if (!key) {
      console.error(`[存储桥接] ${source} 保存请求缺少key`);
      return;
    }

    try {
      // 保存到localStorage
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
        console.log(`[存储桥接] ${source} 已从localStorage移除: ${key}`);
      } else {
        localStorage.setItem(key, value);
        console.log(`[存储桥接] ${source} 已保存到localStorage: ${key}`);
      }
    } catch (error) {
      console.error(`[存储桥接] ${source} 保存到localStorage失败 (${key}):`, error);
    }
  }

  /**
   * 处理获取消息
   * @param {WindowProxy} source - 消息源窗口
   * @param {Object} data - 消息数据
   */
  handleGetMessage(source, data) {
    const { key, requestId } = data;
    const sourceId = data.source || 'unknown_source';
    
    if (!key) {
      console.error(`[存储桥接] ${sourceId} 获取请求缺少key`);
      return;
    }

    let value = null;
    try {
      // 从localStorage获取
      value = localStorage.getItem(key);
      console.log(`[存储桥接] ${sourceId} 从localStorage获取: ${key}`);
    } catch (error) {
      console.error(`[存储桥接] ${sourceId} 从localStorage获取失败 (${key}):`, error);
    }

    // 确定响应消息类型（兼容旧版bilibili消息）
    const responseType = data.type.startsWith('BILIBILI_') 
      ? 'BILIBILI_STORAGE_BRIDGE_GET_RESPONSE'
      : 'STORAGE_BRIDGE_GET_RESPONSE';
      
    // 发送响应
    source.postMessage({
      type: responseType,
      source: 'storage_bridge',
      key,
      value,
      requestId,
      sourceId
    }, '*');
  }
}

// 创建并导出存储桥接器实例
const storageBridge = new StorageBridge();
export default storageBridge;

// 提供一个初始化函数，可以在应用启动时调用
export function initStorageBridge() {
  storageBridge.init();
}

/**
 * StorageBridgeClient 客户端代码
 * 此部分将被打包并作为外部数据源的依赖提供
 * 通过 lib.load('storage-bridge-client') 加载
 */

/**
 * 存储桥接客户端类
 * 为外部数据源提供统一的存储访问接口
 */
export class StorageBridgeClient {
  /**
   * 创建一个存储桥接客户端
   * @param {string} sourceId - 数据源唯一标识符
   */
  constructor(sourceId) {
    this.sourceId = sourceId;
    this.pendingRequests = new Map();
    this.nextRequestId = 1;
    this.bridgeInitialized = false;
    this.usingStorageBridge = false;
    
    // 检测环境
    this.isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    
    // 添加消息监听器
    if (this.isInIframe && typeof window !== 'undefined') {
      window.addEventListener('message', this.handleBridgeMessage.bind(this));
    }
  }
  
  /**
   * 初始化存储桥接
   * @returns {boolean} 是否使用桥接
   */
  init() {
    try {
      // 设置标志，表示我们正在使用桥接存储
      this.usingStorageBridge = this.isInIframe;
      
      console.log(`[存储桥接客户端:${this.sourceId}] 桥接状态: ${this.usingStorageBridge ? '启用' : '禁用'}`);
      
      // 如果在iframe中，尝试向父窗口发送初始化消息
      if (this.usingStorageBridge) {
        window.parent.postMessage({
          type: 'STORAGE_BRIDGE_INIT',
          source: this.sourceId
        }, '*');
        
        console.log(`[存储桥接客户端:${this.sourceId}] 已向父窗口发送初始化消息`);
      }
      
      return this.usingStorageBridge;
    } catch (error) {
      console.error(`[存储桥接客户端:${this.sourceId}] 初始化失败:`, error);
      this.usingStorageBridge = false;
      return false;
    }
  }
  
  /**
   * 处理桥接消息
   * @param {MessageEvent} event - 消息事件
   */
  handleBridgeMessage(event) {
    const { data } = event;
    
    // 忽略非桥接消息
    if (!data || !data.type) {
      return;
    }
    
    // 支持通用和特定数据源的消息类型
    const isBridgeResponse = 
      data.type === 'STORAGE_BRIDGE_INIT_ACK' || 
      data.type === 'STORAGE_BRIDGE_GET_RESPONSE' ||
      data.type === 'BILIBILI_STORAGE_BRIDGE_INIT_ACK' || 
      data.type === 'BILIBILI_STORAGE_BRIDGE_GET_RESPONSE';
      
    if (!isBridgeResponse) {
      return;
    }

    // 检查是否是发给本源的消息
    if (data.sourceId && data.sourceId !== this.sourceId) {
      return;
    }
    
    console.log(`[存储桥接客户端:${this.sourceId}] 收到消息:`, data);
    
    if (data.type === 'STORAGE_BRIDGE_INIT_ACK' || data.type === 'BILIBILI_STORAGE_BRIDGE_INIT_ACK') {
      this.bridgeInitialized = true;
      console.log(`[存储桥接客户端:${this.sourceId}] 初始化确认`);
    } else if (data.type === 'STORAGE_BRIDGE_GET_RESPONSE' || data.type === 'BILIBILI_STORAGE_BRIDGE_GET_RESPONSE') {
      this.handleGetResponse(data);
    }
  }
  
  /**
   * 处理获取响应
   * @param {Object} data - 响应数据
   */
  handleGetResponse(data) {
    const { key, value, requestId } = data;
    
    // 查找对应的请求
    const request = this.pendingRequests.get(requestId);
    if (request) {
      // 解决Promise
      request.resolve(value);
      // 移除请求
      this.pendingRequests.delete(requestId);
      console.log(`[存储桥接客户端:${this.sourceId}] 收到存储响应 (${key}, requestId: ${requestId})`);
    } else {
      console.warn(`[存储桥接客户端:${this.sourceId}] 收到未知请求ID的响应: ${requestId}`);
    }
  }
  
  /**
   * 从存储中异步获取数据
   * @param {string} key - 存储键名
   * @returns {Promise<string|null>} 存储的值
   */
  async getItem(key) {
    try {
      // 如果使用桥接存储，则通过桥接获取
      if (this.usingStorageBridge) {
        // 创建一个Promise来处理异步响应
        return new Promise((resolve) => {
          // 生成请求ID
          const requestId = this.nextRequestId++;
          
          // 保存请求
          this.pendingRequests.set(requestId, { key, resolve });
          
          // 发送获取请求
          window.parent.postMessage({
            type: 'STORAGE_BRIDGE_GET',
            source: this.sourceId,
            key,
            requestId
          }, '*');
          
          console.log(`[存储桥接客户端:${this.sourceId}] 请求获取数据 (${key}, requestId: ${requestId})`);
          
          // 设置超时
          setTimeout(() => {
            if (this.pendingRequests.has(requestId)) {
              console.warn(`[存储桥接客户端:${this.sourceId}] 获取存储数据超时 (${key}, requestId: ${requestId})`);
              this.pendingRequests.delete(requestId);
              resolve(null);
            }
          }, 3000); // 3秒超时
        });
      }
      
      // 否则尝试直接使用localStorage
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      
      return null;
    } catch (error) {
      console.error(`[存储桥接客户端:${this.sourceId}] 获取数据失败 (${key}):`, error);
      return null;
    }
  }
  
  /**
   * 将数据保存到存储
   * @param {string} key - 存储键名
   * @param {any} value - 要存储的值
   */
  setItem(key, value) {
    try {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      
      // 如果使用桥接存储，则通过桥接保存
      if (this.usingStorageBridge) {
        window.parent.postMessage({
          type: 'STORAGE_BRIDGE_SAVE',
          source: this.sourceId,
          key: key,
          value: valueStr
        }, '*');
        console.log(`[存储桥接客户端:${this.sourceId}] 通过桥接保存数据 (${key})`);
        return;
      }
      
      // 否则尝试直接使用localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, valueStr);
        console.log(`[存储桥接客户端:${this.sourceId}] 直接保存到localStorage (${key})`);
      }
    } catch (error) {
      console.error(`[存储桥接客户端:${this.sourceId}] 保存失败 (${key}):`, error);
    }
  }
  
  /**
   * 从存储中移除数据
   * @param {string} key - 存储键名
   */
  removeItem(key) {
    try {
      // 如果使用桥接存储，则通过桥接移除
      if (this.usingStorageBridge) {
        window.parent.postMessage({
          type: 'STORAGE_BRIDGE_SAVE',
          source: this.sourceId,
          key: key,
          value: null
        }, '*');
        console.log(`[存储桥接客户端:${this.sourceId}] 通过桥接移除数据 (${key})`);
        return;
      }
      
      // 否则尝试直接使用localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        console.log(`[存储桥接客户端:${this.sourceId}] 直接从localStorage移除 (${key})`);
      }
    } catch (error) {
      console.error(`[存储桥接客户端:${this.sourceId}] 移除失败 (${key}):`, error);
    }
  }
}

/**
 * 创建存储桥接客户端实例
 * 用于向外部数据源提供的工厂方法
 * @param {string} sourceId - 数据源唯一标识符
 * @returns {StorageBridgeClient} 存储桥接客户端实例
 */
export function createStorageBridgeClient(sourceId) {
  const client = new StorageBridgeClient(sourceId);
  client.init();
  return client;
} 