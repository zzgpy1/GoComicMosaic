import { getSiteSettings, updateSiteSettings } from './api';

// 缓存过期时间（毫秒）- 默认5分钟
const CACHE_EXPIRATION = 5 * 60 * 1000;

// 存储在LocalStorage中的键名
const STORAGE_KEY = 'site_info_cache';
const VERSION_KEY = 'site_info_version';

class InfoManager {
  constructor() {
    // 单例模式
    if (InfoManager.instance) {
      return InfoManager.instance;
    }
    InfoManager.instance = this;
    
    // 初始化
    this.cache = null;
    this.lastFetchTime = 0;
    this.version = this.getStoredVersion() || 1;
    this.isLoading = false;
    
    // 从本地存储加载缓存
    this.loadFromStorage();
  }
  
  /**
   * 从localStorage中加载缓存的网站信息
   */
  loadFromStorage() {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = parsed.data;
        this.lastFetchTime = parsed.timestamp;
        console.log('已从本地存储加载网站信息缓存');
      }
    } catch (error) {
      console.error('加载缓存的网站信息失败:', error);
      // 清除可能损坏的缓存
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  
  /**
   * 保存数据到localStorage
   */
  saveToStorage(data) {
    try {
      const cacheObject = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObject));
      console.log('网站信息缓存已保存到本地存储');
    } catch (error) {
      console.error('保存网站信息缓存失败:', error);
    }
  }
  
  /**
   * 获取存储的版本号
   */
  getStoredVersion() {
    const version = localStorage.getItem(VERSION_KEY);
    return version ? parseInt(version, 10) : null;
  }
  
  /**
   * 保存版本号
   */
  saveVersion(version) {
    localStorage.setItem(VERSION_KEY, version.toString());
    this.version = version;
  }
  
  /**
   * 检查缓存是否过期
   */
  isCacheExpired() {
    // 如果没有缓存，视为过期
    if (!this.cache) return true;
    
    // 检查缓存是否超过指定的过期时间
    return Date.now() - this.lastFetchTime > CACHE_EXPIRATION;
  }
  
  /**
   * 获取网站信息，优先使用缓存
   */
  async getInfo() {
    // 如果有缓存且未过期，直接返回缓存
    if (this.cache && !this.isCacheExpired()) {
      console.log('使用缓存的网站信息');
      return this.cache;
    }
    
    // 防止并发请求
    if (this.isLoading) {
      console.log('正在获取网站信息，等待...');
      // 等待当前请求完成
      return new Promise(resolve => {
        const checkCache = () => {
          if (!this.isLoading) {
            resolve(this.cache);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }
    
    // 从服务器获取最新数据
    this.isLoading = true;
    
    // 添加重试机制
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`从服务器获取最新网站信息 (尝试 ${retryCount + 1}/${maxRetries})`);
        const response = await getSiteSettings('info');
        this.cache = response.setting_value;
        
        // 设置默认值（如果不存在）
        this.ensureDefaultValues();
        
        this.lastFetchTime = Date.now();
        
        // 保存到本地存储
        this.saveToStorage(this.cache);
        
        // 检查并更新favicon
        if (typeof window.checkFavicon === 'function') {
          window.checkFavicon();
        }
        
        this.isLoading = false;
        return this.cache;
      } catch (error) {
        lastError = error;
        console.error(`获取网站信息失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        
        // 如果还有重试次数，等待一段时间后重试
        if (retryCount < maxRetries) {
          const delay = 1000 * retryCount; // 递增延迟
          console.log(`将在 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试都失败了
    this.isLoading = false;
    
    // 如果有缓存，返回过期的缓存作为降级
    if (this.cache) {
      console.log('使用过期的缓存作为降级');
      return this.cache;
    }
    
    // 如果没有缓存，返回默认配置
    console.log('没有可用缓存，使用默认配置');
    this.cache = this.getDefaultSiteInfo();
    this.saveToStorage(this.cache); // 保存默认值到缓存
    return this.cache;
  }
  
  /**
   * 确保所有必要的默认值都存在
   */
  ensureDefaultValues() {
    if (!this.cache) {
      this.cache = this.getDefaultSiteInfo();
      return;
    }
    
    // 确保页脚链接存在
    if (!this.cache.links || !Array.isArray(this.cache.links) || this.cache.links.length === 0) {
      this.cache.links = this.getDefaultSiteInfo().links;
    }
    
    // 确保版权信息存在
    if (!this.cache.copyright) {
      this.cache.copyright = this.getDefaultSiteInfo().copyright;
    }
    
    // 确保基本信息字段存在
    if (!this.cache.title) this.cache.title = this.getDefaultSiteInfo().title;
    if (!this.cache.logoText) this.cache.logoText = this.getDefaultSiteInfo().logoText;
    if (!this.cache.description) this.cache.description = this.getDefaultSiteInfo().description;
    if (!this.cache.keywords) this.cache.keywords = this.getDefaultSiteInfo().keywords;
    
    // 确保About页面配置存在
    if (!this.cache.aboutPageConfig) {
      this.cache.aboutPageConfig = this.getDefaultSiteInfo().aboutPageConfig;
    } else {
      // 确保关键数组存在
      if (!this.cache.aboutPageConfig.featureItems) {
        this.cache.aboutPageConfig.featureItems = this.getDefaultSiteInfo().aboutPageConfig.featureItems;
      }
      if (!this.cache.aboutPageConfig.contactItems) {
        this.cache.aboutPageConfig.contactItems = this.getDefaultSiteInfo().aboutPageConfig.contactItems;
      }
    }
  }
  
  /**
   * 获取默认的网站信息配置
   */
  getDefaultSiteInfo() {
    return {
      title: '美漫资源共建',
      logoText: '美漫资源共建',
      description: '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
      keywords: '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建',
      links: [
        { text: "关于我们", url: "/about", type: "internal" },
        { text: "Telegram", url: "https://t.me/xueximeng", icon: "bi bi-telegram", type: "external", title: "加入Telegram群组" },
        { text: "GitHub", url: "https://github.com/fish2018/GoComicMosaic", icon: "bi bi-github", type: "external", title: "查看GitHub源码" },
        { text: "在线点播", url: "/streams", type: "internal" },
        { text: "漫迪小站", url: "https://mdsub.top/", type: "external" },
        { text: "三次元成瘾者康复中心", url: "https://www.kangfuzhongx.in/", type: "external" },
      ],
      copyright: "© 2025 美漫资源共建. 保留所有权利",
      show_visitor_count: true,
      aboutPageConfig: {
        // 本站介绍部分
        siteIntro: {
          title: '本站介绍',
          description: '欢迎来到美漫资源共建平台，我们致力于为美漫爱好者提供一个便捷、高效、安全的资源分享平台。',
          icon: 'collection-fill'
        },
        // 特性项目
        featureItems: [
          {
            id: 1,
            title: '我们的使命',
            description: '通过社区的力量，让优质资源得到更好的整理与传播，让每一位爱好者都能便捷地找到自己喜爱的内容。',
            icon: 'bullseye'
          },
          {
            id: 2,
            title: '我们的价值观',
            description: '<strong>开放共享</strong> - 鼓励用户分享优质资源<br><strong>品质保证</strong> - 筛选审核每个资源内容<br><strong>用户至上</strong> - 持续优化平台体验',
            icon: 'stars'
          },
          {
            id: 3,
            title: '我们的团队',
            description: '我们是一群热爱动漫文化的技术爱好者，希望通过技术手段让资源分享变得更加简单高效。',
            icon: 'people-fill'
          }
        ],
        // 联系我们部分
        contactSection: {
          title: '联系我们',
          description: '如有任何问题、建议或合作意向，欢迎通过以下方式联系我们。我们非常重视每一位用户的反馈。',
          icon: 'chat-text-fill'
        },
        // 联系方式列表
        contactItems: [
          {
            id: 1,
            text: 'admin@xueximeng.com',
            icon: 'envelope-fill'
          },
          {
            id: 2,
            text: 'GitHub: fish2018',
            icon: 'github'
          }
        ]
      }
    };
  }
  
  /**
   * 获取页脚信息（这是为了兼容性而保留的方法）
   */
  async getFooterInfo() {
    const info = await this.getInfo();
    return info;
  }
  
  /**
   * 获取网站基本信息（标题、meta信息等）
   */
  async getSiteBasicInfo() {
    const info = await this.getInfo();
    // 确保基本信息字段存在
    return {
      title: info.title || '美漫资源共建',
      logoText: info.logoText || '美漫资源共建',
      description: info.description || '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
      keywords: info.keywords || '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建',
      ...info
    };
  }
  
  /**
   * 更新网站信息
   */
  async updateInfo(infoData) {
    try {
      // 调用API更新信息
      const response = await updateSiteSettings('info', infoData);
      
      // 更新缓存
      this.cache = infoData;
      this.lastFetchTime = Date.now();
      
      // 更新版本号
      this.saveVersion(this.version + 1);
      
      // 保存到本地存储
      this.saveToStorage(this.cache);
      
      // 检查并更新favicon
      if (typeof window.checkFavicon === 'function') {
        window.checkFavicon();
      }
      
      return response;
    } catch (error) {
      console.error('更新网站信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 强制刷新缓存
   */
  async refreshCache() {
    // 清除现有缓存
    this.cache = null;
    this.lastFetchTime = 0;
    localStorage.removeItem(STORAGE_KEY);
    
    // 重新获取数据
    return await this.getInfo();
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = null;
    this.lastFetchTime = 0;
    localStorage.removeItem(STORAGE_KEY);
    console.log('网站信息缓存已清除');
  }
  
  /**
   * 获取About页面配置
   */
  async getAboutPageConfig() {
    const info = await this.getInfo();
    return info.aboutPageConfig || {};
  }
}

// 创建并导出单例实例
const infoManager = new InfoManager();
export default infoManager; 