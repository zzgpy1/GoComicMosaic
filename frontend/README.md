# 美漫资源共建平台前端

## 项目概述

美漫资源共建平台(GoComicMosaic)是一个专为动漫爱好者设计的开源资源分享与管理系统。该平台允许用户浏览、提交和管理动漫资源，管理员可以审核用户提交的内容。平台还提供在线流媒体播放功能，支持多集动漫的分集播放和管理。

## 功能特点

- **资源浏览**：用户可以浏览平台上的动漫资源列表
- **资源详情**：查看特定资源的详细信息，包括简介、图片和下载链接
- **资源提交**：用户可以提交新的动漫资源或为现有资源补充信息
- **资源搜索**：支持按名称、类型等搜索资源
- **用户喜好标记**：用户可以标记喜欢的资源
- **在线流媒体**：支持在线播放视频内容，包括HLS、MP4等格式
- **剧集管理**：支持多集视频内容的分集选择和管理
- **自定义流媒体播放**：用户可以输入自定义链接进行播放
- **播放历史记录**：记录用户最近观看的内容
- **管理功能**：管理员可以审核和编辑用户提交的资源
- **移动端适配**：界面响应式设计，适配各种屏幕尺寸

## 技术栈

- **前端框架**：Vue.js 3.4.0
- **路由管理**：Vue Router 4.2.5
- **HTTP客户端**：Axios 1.6.5
- **视频播放**：video.js 8.22.0 + @videojs/http-streaming 3.17.0
- **构建工具**：Vite 5.0.10
- **CSS预处理**：原生CSS，自定义变量支持主题定制

## 项目结构

```
frontend/
├── public/               # 公共静态资源
│   ├── favicon.ico       # 网站图标
│   ├── robots.txt        # 搜索引擎爬虫规则
│   └── sitemap.xml       # 网站地图
├── scripts/              # 项目脚本
│   └── generate-sitemap.js # 生成网站地图的脚本
├── src/                  # 源代码
│   ├── assets/           # 项目资源
│   │   └── streamsPage.css # 流媒体页面样式
│   ├── components/       # 公共组件
│   │   ├── EpisodeSelector.vue # 剧集选择器组件
│   │   ├── LocalSearch.vue     # 本地搜索组件
│   │   └── VideoPlayer.vue     # 视频播放器组件
│   ├── router/           # 路由配置
│   │   └── index.js      # 路由定义文件
│   ├── utils/            # 工具函数
│   │   ├── api.js        # API请求工具
│   │   ├── auth.js       # 身份验证工具
│   │   ├── corsProxy.js  # CORS代理工具
│   │   ├── dataSourceManager.js # 数据源管理工具
│   │   ├── imageUtils.js # 图片处理工具
│   │   └── dataSources/  # 数据源实现
│   │       ├── heimuer.js    # 黑幕数据源
│   │       ├── mockSource.js # 模拟数据源
│   │       └── testApi.js    # 测试API数据源
│   ├── views/            # 页面组件
│   │   ├── About.vue     # 关于页面
│   │   ├── Admin.vue     # 管理后台页面
│   │   ├── Home.vue      # 首页
│   │   ├── Login.vue     # 登录页面
│   │   ├── ResourceDetail.vue # 资源详情页面
│   │   ├── ResourceReview.vue # 资源审核页面
│   │   ├── StreamsPage.vue    # 视频流页面
│   │   └── SubmitResource.vue # 资源提交页面
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html            # HTML模板
├── package.json          # 项目配置
└── vite.config.js        # Vite配置
```

## 安装与配置

### 1. 克隆仓库

```bash
git clone [仓库地址]
cd [项目目录]/frontend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

开发环境无需特殊配置，生产环境可修改 `.env.production` 文件：

```
VITE_API_BASE_URL=/api
VITE_ASSETS_URL=/assets
```

## 开发

### 启动开发服务器

```bash
npm run dev
```

开发服务器将在 http://localhost:3000 启动，支持热重载

### API代理配置

项目已配置API代理，开发时：
- 所有对 `/api` 的请求将被转发到 `http://127.0.0.1:8000`
- 所有对 `/assets` 的请求也会被转发到 `http://127.0.0.1:8000`

## 构建与部署

### 构建生产版本

```bash
npm run build
```

构建过程将同时生成网站地图

### 预览生产构建

```bash
npm run preview
```

### 单独生成网站地图

```bash
# 生产环境
npm run generate:sitemap

# 测试环境
npm run generate:sitemap:test
```

## 主要功能详解

### 1. 资源浏览与搜索

Home.vue 提供资源列表浏览功能，支持按分类筛选和关键词搜索。搜索逻辑由 LocalSearch.vue 组件实现，提供实时搜索建议。

### 2. 资源详情与提交

- ResourceDetail.vue 展示资源详细信息，包括图片、介绍和下载链接
- SubmitResource.vue 允许用户提交新资源或为现有资源补充信息

### 3. 流媒体播放功能

StreamsPage.vue 提供在线播放功能，主要特点：
- 支持多种媒体格式，特别优化HLS流
- 提供剧集选择功能，适合多集内容(使用EpisodeSelector.vue)
- 播放历史记录，便于继续观看
- 多数据源支持，可选择不同内容提供商

### 4. 视频播放组件

VideoPlayer.vue 基于video.js实现，具有以下特点：
- 自适应响应式布局
- 清晰度自动选择
- 播放错误处理与恢复
- 移动设备横屏优化

### 5. 管理功能

Admin.vue 和 ResourceReview.vue 提供管理员功能：
- 资源审核与管理
- 内容编辑与更新
- 用户提交内容管理

## 路由说明

- `/` - 首页，展示资源列表
- `/resource/:id` - 资源详情页
- `/submit` - 资源提交页
- `/login` - 用户登录页
- `/admin` - 管理员页面（需要认证）
- `/admin/resource-review/:id` - 资源审核页（需要认证）
- `/about` - 关于页面
- `/streams` - 流媒体内容页面，支持查询参数：
  - `?id=xxx` - 播放特定ID的内容
  - `?direct_url=xxx` - 直接播放指定URL的内容

## 最近更新

- 修复EpisodeSelector组件中分页功能无响应的问题
- 添加用户手动翻页标志，解决自动页码调整与用户手动操作的冲突
- 优化移动端下视频播放器的响应式布局
- 增强对HLS流的支持与错误处理
- 添加多数据源支持，可配置不同的内容提供商

## 贡献

欢迎提交Pull Request或Issue来帮助改进项目。

## 许可

本项目采用ISC许可证。 