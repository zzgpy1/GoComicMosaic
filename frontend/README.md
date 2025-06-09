# 动漫资源共享平台 - 前端

这是使用Vue.js实现的动漫资源共享平台前端

## 功能特点

- **资源浏览**：浏览、搜索、筛选平台上的资源
- **资源详情**：查看资源详细信息，包括标题、描述、链接、创建日期等
- **资源交互**：点赞、评论功能
- **资源上传**：提交资源功能，支持上传配图
- **资源补充**：为已有资源添加补充内容
- **用户认证**：登录、注册功能
- **管理系统**：管理员审批、管理资源、管理用户
- **响应式设计**：支持桌面端和移动端访问
- **外部数据源系统**：支持集成多个外部数据源、自定义数据源，快速搜索和获取详情
- **CORS代理服务**：内置代理功能，解决跨域问题
- **主题切换**：支持浅色/深色主题
- **网站配置**：支持自定义网站信息、图标等

## 外部数据源系统

本项目支持集成多种外部数据源，使用统一的接口规范，便于扩展和自定义：

### 主要特性：

- **统一接口**：所有数据源遵循相同的接口规范，提供一致的使用体验
- **多格式支持**：支持JSON和XML两种常见的数据格式
- **CORS代理**：内置跨域代理功能，自动处理所有外部请求
- **动态加载**：支持在管理界面动态添加、编辑和删除数据源
- **自定义支持**：用户可以添加自定义数据源，无需修改代码
- **数据源管理**：提供完整的数据源管理界面
- **持久化存储**：数据源配置保存在数据库中，跨会话保持

### 内置数据源：

平台预置了多个常用的动漫数据源，包括：
- 黑木影视
- 卧龙影视
- 两仔影视
- 更多数据源持续添加中...

### 自定义数据源：

用户可以在管理页面轻松添加自定义数据源，只需提供：
- 数据源名称
- 基础URL
- 搜索和详情API接口
- 数据格式选项（JSON/XML）

所有数据源都会自动应用CORS代理，无需额外处理跨域问题。

## CORS代理功能

为支持外部数据源访问，系统集成了CORS代理服务：

### 主要特点：

- **透明调用**：自动处理所有外部请求的跨域问题
- **统一格式**：简单的API格式 `/proxy?url=原始URL`
- **自动编码**：自动处理URL编码/解码
- **智能判断**：只对需要跨域处理的URL应用代理
- **安全处理**：隐藏客户端信息，防止敏感信息泄露

### 使用方法：

```javascript
// 数据源中使用代理的示例
function addCorsProxy(url) {
  const PROXY_BASE_URL = '/proxy?url=';
  if (url.includes(PROXY_BASE_URL) || !url.startsWith('http')) {
    return url;
  }
  return `${PROXY_BASE_URL}${encodeURIComponent(url)}`;
}

// 在请求中应用
const response = await fetch(addCorsProxy('https://external-api.com/data'));
```

## 技术栈

- Vue 3
- Element Plus
- Vue Router
- Pinia
- Axios
- Tailwind CSS
- ESBuild (打包)
- FastGlob (资源管理)

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── assets/          # 资源文件
│   ├── components/      # Vue组件
│   │   ├── EpisodeSelector.vue    # 剧集选择
│   │   ├── LocalSearch.vue        # 搜索引擎
│   │   └── VideoPlayer.vue        # 播放器
│   ├── extDS/           # 外部数据源
│   │   ├── heimuer.js         # 黑木影视数据源
│   │   ├── wolong.js          # 卧龙影视数据源
│   │   ├── template.js        # 数据源模板
│   │   └── 外接数据源开发文档.md # 开发文档
│   ├── router/          # 路由配置
│   ├── styles/          # 样式文件
│   ├── utils/           # 工具函数
│   │   ├── dataSources/            # 数据源定义
│   │   │   ├── index.js            # 数据源索引文件   
│   │   │   └── template.js.example # 数据源模板文件
│   │   ├── api.js                  # 点播api
│   │   ├── auth.js                 # 认证工具
│   │   ├── corsProxy.js            # CORS代理工具
│   │   ├── dataSourceFactory.js    # 数据源工厂
│   │   ├── dataSourceManager.js    # 数据源管理器
│   │   ├── dataSourcesConfig.js    # 数据源配置
│   │   ├── externalDataSourceLoader.js # 外部数据源加载器
│   │   ├── icons.js                    # 字体图标
│   │   ├── InfoManager.js              # 网站信息管理
│   │   └── imageUtils.js               # 图片工具
│   ├── views/                  # 页面视图
│   │   ├── About.vue           # 关于页面
│   │   ├── Admin.vue           # 管理后台页面
│   │   ├── Home.vue            # 首页
│   │   ├── Login.vue           # 登录页面
│   │   ├── ResourceDetail.vue  # 资源详情页面
│   │   ├── ResourceReview.vue  # 资源审核页面
│   │   ├── StreamsPage.vue     # 在线点播页面
│   │   ├── TMDBSearch.vue      # TMDB搜索页面
│   │   └── SubmitResource.vue  # 资源提交页面
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── index.html           # HTML入口文件
├── .env.production      # 环境配置
├── package.json         # 项目依赖
└── vite.config.js       # Vite配置
```

## 安装与运行

1. 安装依赖：

```bash
npm install
```

2. 开发模式运行：

```bash
npm run dev
```

3. 构建生产版本：

```bash
npm run build
```

## 配置项

在`.env`文件中可配置以下项：

```
BASE_URL=https://dm.xueximeng.com # 默认 http://localhost:8000
ASSETS_PATH=../data/assets # 默认 "../assets"
```

## 环境要求

- Node.js 16+
- npm 7+

## 外部数据源开发

如需开发新的外部数据源模块，请参考`src/extDS/外接数据源开发文档.md`和`template.js`模板文件。每个数据源需要实现`searchMovies`和`getMovieDetail`两个主要方法，并确保格式一致。

### 数据源接口规范

外部数据源需要实现以下接口：

```javascript
const externalDataSource = {
  // 基本信息
  name: "数据源名称",
  baseUrl: "https://example.com",
  // 可选属性
  useXml: false, // 是否使用XML格式
  
  // 搜索电影
  async searchMovies(keyword, page, pageSize) {
    // 返回标准格式的搜索结果
    return {
      total: 100,
      data: [
        {
          id: "123",
          name: "电影名称",
          year: "2023",
          type: "电影",
          // 其他属性...
        }
      ]
    };
  },
  
  // 获取电影详情
  async getMovieDetail(id) {
    // 返回标准格式的电影详情
    return {
      id: "123",
      name: "电影名称",
      description: "电影描述",
      coverUrl: "https://example.com/cover.jpg",
      // 其他属性...
    };
  }
};
```

所有数据源都会自动使用CORS代理处理跨域请求，开发者无需担心跨域问题。

## 最近更新内容

- **外部数据源系统增强**：
  - 添加了XML格式支持，支持解析XML格式的API响应
  - 优化了CORS代理实现，自动处理所有外部请求
  - 改进数据源加载机制，支持从数据库加载配置
  - 添加了数据源模板和开发文档，便于开发新的数据源
- **管理界面优化**：
  - 修复了数据源列表加载和删除逻辑
  - 添加了数据源删除后的保存提示
  - 优化了数据源配置的界面交互
- **用户体验改进**：
  - 改进页面加载状态显示
  - 优化错误处理和提示信息
  - 增强主题切换和暗色模式支持
- **性能优化**：
  - 减少不必要的组件重渲染
  - 优化大型列表的加载和滚动性能
  - 改进图片加载和处理逻辑

## 贡献指南

欢迎提交PR或Issue来完善项目。请确保提交的代码经过了测试并遵循项目的代码风格规范。

## 开源许可

本项目使用MIT许可证 